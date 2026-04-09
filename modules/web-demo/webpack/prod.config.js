const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const {
  aliasItems,
  entryConfig,
  experiments,
  outputConfig,
  terserPluginConfig,
  prodRules,
  prodPlugins,
  mergeCustomizer,
  resolveFallback,
} = require('./base.config');
const { mergeWith } = require('lodash');
const bitgoConfig = require('./bitgojs.config');

module.exports = (env, options) => {
  return mergeWith(
    {
      mode: options.mode,
      entry: entryConfig,
      module: {
        rules: prodRules,
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
      optimization: {
        minimizer: [new TerserPlugin(terserPluginConfig)],
        splitChunks: {
          chunks: 'all',
        },
      },
      plugins: prodPlugins,
      experiments,
    },
    bitgoConfig,
    mergeCustomizer,
  );
};
