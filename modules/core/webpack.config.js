const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const mode = process.env.NODE_ENV ?? 'production';
const TerserPlugin = require('terser-webpack-plugin');

function replaceUnsafeEval(file) {
  const replacementRegex = /Function\("return this"\)\(\)/g;
  const replaceWith = 'window';

  if (!file) {
    throw new Error('must specify webpack bundle file to replace unsafe evals');
  }

  // eslint-disable-next-line no-sync
  if (!fs.existsSync(file)) {
    throw new Error(`bundle file ${file} does not exist`);
  }

  let replacements = 0;

  // eslint-disable-next-line no-sync
  const bundle = fs.readFileSync(file).toString('utf8').replace(replacementRegex, () => {
    replacements++;
    return replaceWith;
  });

  // eslint-disable-next-line no-sync
  fs.writeFileSync(file, bundle);

  return replacements;
}

function getOutputFileName() {
  return mode === 'production' ? 'BitGoJS.min.js' : 'BitGoJS.js';
}

module.exports = {
  mode,
  target: 'web',
  entry: path.join(__dirname, '/dist/src/index.js'),
  output: {
    path: path.join(__dirname, '/dist/browser'),
    filename: getOutputFileName(),
    library: 'BitGoJS',
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@hashgraph/sdk': path.resolve('../../node_modules/@hashgraph/sdk/src/browser.js'),
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
    new HTMLWebpackPlugin({ filename: 'browser.html', title: 'BitGo SDK Sandbox' }),
    // This plugin uses webpack's hooks to perform a post processing step to find + replace unsafe code.
    // currently, hashgraph protobufs generated code will attempt resolve the global object with:
    //   Function("return this")()
    // which is not permitted in strict CSP environments. This can safely just be replaced with the *actual* global
    // object, i.e. window
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
          replaceUnsafeEval(`./dist/browser/${getOutputFileName()}`);
        });
      },
    },
  ],
  node: {
    global: true,
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
