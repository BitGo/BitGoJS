const path = require('path');
const webpack = require('webpack');

// The following configuration is required in order to run BitGoJS in the browser
module.exports = {
  resolve: {
    alias: {
      // this is only required if using bitgo instead of just the sdk-api
      '@hashgraph/sdk': path.resolve(
        '../../node_modules/@hashgraph/sdk/src/browser.js',
      ),
    },
    fallback: {
      constants: false,
      crypto: require.resolve('crypto-browserify'),
      dns: false,
      fs: false,
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      http2: require.resolve('stream-http'),
      net: false,
      os: false,
      path: false,
      stream: require.resolve('stream-browserify'),
      tls: false,
      url: require.resolve('url/'),
      vm: false,
      zlib: false,
    },
  },
  externals: ['morgan', 'superagent-proxy'],
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
  node: {
    global: true,
  },
};
