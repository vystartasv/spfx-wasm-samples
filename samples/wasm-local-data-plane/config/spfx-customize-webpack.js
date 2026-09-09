'use strict';

// The SPFx Heft webpack hook runs after the rig's defaults. Keep .wasm as a copied asset so
// the import resolves to a same-origin ClientSideAssets URL. Webpack's asyncWebAssembly
// experiment is deliberately not used because SPFx's AMD output cannot consume its wrapper.
module.exports = function customizeWebpack(webpackConfiguration) {
  const configurations = Array.isArray(webpackConfiguration) ? webpackConfiguration : [webpackConfiguration];

  configurations.forEach(config => {
    if (!config) {
      return;
    }

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.unshift({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: { filename: '[name].[contenthash:8].wasm' }
    });
    config.plugins = config.plugins || [];
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('spfx-wasm-worker-manifest-audit', compilation => {
          const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT - 1;
          compilation.hooks.processAssets.tap({ name: 'spfx-wasm-worker-manifest-audit', stage }, () => {
            // SPFx's dependency-audit plugin treats every runtime chunk as an async SPFx bundle.
            // This worker is a browser asset, not a SharePoint component entry, so exclude only
            // its audit metadata while retaining the emitted worker file and runtime.
            const componentRuntimeChunks = new Set(
              Array.from(compilation.entrypoints.values()).map(entrypoint => entrypoint.getRuntimeChunk())
            );
            for (const chunk of compilation.chunks) {
              if (!componentRuntimeChunks.has(chunk)) {
                for (const group of chunk.groupsIterable) {
                  if (typeof group.setRuntimeChunk === 'function' && group.getRuntimeChunk() === chunk) {
                    group.setRuntimeChunk(undefined);
                  }
                }
              }
            }
          });
        });
      }
    });
  });

  return webpackConfiguration;
};
