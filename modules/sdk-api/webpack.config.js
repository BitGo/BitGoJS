const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  entry: './dist/src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/web'),
    library: 'BitGoJS',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new HtmlWebpackPlugin({}),
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

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
  } else {
    config.mode = 'development';
  }
  return config;
};
