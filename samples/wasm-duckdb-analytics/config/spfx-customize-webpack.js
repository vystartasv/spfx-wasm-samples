'use strict';
module.exports = function customizeWebpack(webpackConfiguration) {
  const configurations = Array.isArray(webpackConfiguration) ? webpackConfiguration : [webpackConfiguration];
  configurations.forEach(config => {
    if (!config) return;
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.unshift({ test: /\.wasm$/, type: 'asset/resource', generator: { filename: '[name].[contenthash:8].wasm' } });
    config.experiments = { ...config.experiments, asyncWebAssembly: false };
    config.plugins = config.plugins || [];
    config.plugins.push({ apply(compiler) { compiler.hooks.thisCompilation.tap('duckdb-worker-manifest-audit', compilation => { const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT - 1; compilation.hooks.processAssets.tap({ name: 'duckdb-worker-manifest-audit', stage }, () => { const componentRuntimeChunks = new Set(Array.from(compilation.entrypoints.values()).map(entrypoint => entrypoint.getRuntimeChunk())); for (const chunk of compilation.chunks) if (!componentRuntimeChunks.has(chunk)) for (const group of chunk.groupsIterable) if (typeof group.setRuntimeChunk === 'function' && group.getRuntimeChunk() === chunk) group.setRuntimeChunk(undefined); }); }); } });
  });
  return webpackConfiguration;
};
