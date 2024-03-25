const { defineConfig } = require('cypress');

const webpackConfig = require('./webpack/dev.config.js');
module.exports = defineConfig({
  video: false,

  component: {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setupNodeEvents(on, config) {},
    specPattern: 'src/**/*.spec.tsx',
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig,
    },
  },
});
