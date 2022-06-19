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
        alias: {
          ...aliasItems,
          // use the default version here since we're webpacking ourselves
          '@bitgo/sdk-api': path.resolve('../sdk-api/dist/src/index.js'),
          '@bitgo/sdk-core': path.resolve('../sdk-core/dist/src/index.js'),
          '@bitgo/utxo-lib': path.resolve('../utxo-lib/dist/src/index.js'),
          bitgo: path.resolve('../bitgo/dist/src/index.js'),
        },
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
