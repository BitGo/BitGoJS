const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const mode = process.env.NODE_ENV ?? 'production';

// The following configuration is required in order to run BitGoJS in the browser.
// This file is assumed to be loaded by a package within the modules directory
module.exports = {
  mode,
  resolve: {
    alias: {
      // this is only required if using bitgo instead of just the sdk-api
      '@hashgraph/sdk': path.resolve('../../node_modules/@hashgraph/sdk/src/browser.js'),
      'proxy-agent': false,
      // use the default version here since we're webpacking ourselves
      '@bitgo/sdk-api': path.resolve('../sdk-api/dist/src/index.js'),
      async: path.resolve('../../node_modules/async/index.js'),
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
      async: require.resolve('async'),
    },
  },
  externals: ['morgan', 'proxy-agent', 'wasmer_wasi_js_bg.wasm'],
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),

    new webpack.NormalModuleReplacementPlugin(
      /\@emurgo\/cardano-serialization-lib-nodejs/,
      '@emurgo/cardano-serialization-lib-browser'
    ),

    new webpack.ContextReplacementPlugin(/cardano-serialization-lib-browser/),
  ],
  node: {
    global: true,
  },
  experiments: {
    backCompat: false,
    asyncWebAssembly: true,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 6,
          warnings: true,
          mangle: false,
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
};
