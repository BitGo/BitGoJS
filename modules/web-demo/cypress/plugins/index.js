const path = require('path');
const {
  aliasItems,
  devRules,
  devPlugins,
  mergeCustomizer,
} = require('../../webpack/base.config');
const bitgoConfig = require('../../webpack/bitgojs.config');
const { mergeWith } = require('lodash');
const { startDevServer } = require('@cypress/webpack-dev-server');

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      options,
      webpackConfig: mergeWith(
        {
          module: {
            rules: devRules,
          },
          resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
              ...aliasItems,
              // use the default version here since we're webpacking ourselves
              '@bitgo/sdk-api': path.resolve('../sdk-api/dist/src/index.js'),
            },
          },
          plugins: devPlugins,
        },
        bitgoConfig,
        mergeCustomizer,
      ),
    });
  });
};
