'use strict';
module.exports = function customizeWebpack(webpackConfiguration) {
  const configurations = Array.isArray(webpackConfiguration) ? webpackConfiguration : [webpackConfiguration];
  configurations.forEach(config => {
    if (!config) return;
    config.plugins = config.plugins || [];
    config.plugins.push({ apply(compiler) { compiler.hooks.thisCompilation.tap('duplicate-detector-worker-manifest-audit', compilation => { const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT - 1; compilation.hooks.processAssets.tap({ name: 'duplicate-detector-worker-manifest-audit', stage }, () => { const componentRuntimeChunks = new Set(Array.from(compilation.entrypoints.values()).map(entrypoint => entrypoint.getRuntimeChunk())); for (const chunk of compilation.chunks) if (!componentRuntimeChunks.has(chunk)) for (const group of chunk.groupsIterable) if (typeof group.setRuntimeChunk === 'function' && group.getRuntimeChunk() === chunk) group.setRuntimeChunk(undefined); }); }); } });
  });
  return webpackConfiguration;
};
