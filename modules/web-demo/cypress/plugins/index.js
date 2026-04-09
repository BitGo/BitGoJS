const {
  aliasItems,
  devRules,
  devPlugins,
  mergeCustomizer,
} = require('../../webpack/base.config');
const bitgoConfig = require('../../../../webpack/bitgojs.config');
const { mergeWith } = require('lodash');
const { startDevServer } = require('@cypress/webpack-dev-server');

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    const webpackConfig = mergeWith(
      {
        module: {
          rules: devRules,
        },
        resolve: {
          extensions: ['.tsx', '.ts', '.js'],
          alias: aliasItems,
        },
        plugins: devPlugins,
      },
      bitgoConfig,
      mergeCustomizer,
    );
    return startDevServer({
      options,
      webpackConfig,
    });
  });
};
