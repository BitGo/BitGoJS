const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const mode = process.env.NODE_ENV ?? 'production';

module.exports = {
  mode,
  target: 'web',
  entry: path.join(__dirname, '/dist/src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist/web'),
    libraryTarget: 'commonjs',
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new HTMLWebpackPlugin({ filename: 'browser.html', title: 'BitGo SDK Sandbox' }),
  ],
  externals: ['morgan', 'superagent-proxy'],
  resolve: {
    extensions: ['.js'],
    fallback: {
      constants: false,
      crypto: require.resolve('crypto-browserify'),
      dns: false,
      fs: false,
      http: require.resolve('stream-http'),
      http2: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
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
};
