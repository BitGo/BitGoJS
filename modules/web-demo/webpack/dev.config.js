const path = require('path');
const {
  aliasItems,
  devServer,
  entryConfig,
  experiments,
  outputConfig,
  devRules,
  devPlugins,
  resolveFallback,
} = require('./base.config');
const { mergeWith } = require('lodash');
const bitgoConfig = require('../../../webpack/bitgojs.config');
const { mergeCustomizer } = require('../../../webpack/mergeCustomizer');

module.exports = (env, options) => {
  return mergeWith(
    {
      mode: options.mode,
      entry: entryConfig,
      devServer,
      // Dev only
      // Target must be set to web for hmr to work with .browserlist
      // https://github.com/webpack/webpack-dev-server/issues/2758#issuecomment-710086019
      target: 'web',
      module: {
        rules: devRules,
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: aliasItems,
        fallback: resolveFallback,
      },
      output: {
        filename: 'js/[name].bundle.js',
        path: path.resolve(__dirname, outputConfig.destPath),
        publicPath: '',
      },
      plugins: devPlugins,
      experiments,
    },
    bitgoConfig,
    mergeCustomizer,
  );
};
