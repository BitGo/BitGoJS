const HTMLWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack');
const dotenv = require('dotenv');
const path = require('path')

module.exports = () => {
  const env = dotenv.config().parsed;
  
  const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
  }, {});

  return {
    mode: 'development',
    devServer: {
      port: 3001
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
        {
          test: /\.wasm$/,
          loaders: ['wasm-loader', 'base64-loader'],
          type: 'javascript/auto',
        },
        {
          test: /\.js$/,
          include: [path.resolve(__dirname, './node_modules/@polkadot/')],
          exclude: /src/,
          use: [
            require.resolve('@open-wc/webpack-import-meta-loader'),
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/env'],
              },
            },
          ],
        
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      alias: {
        ['raw-body']: path.join(__dirname, 'node_modules', 'raw-body'),
        nanoassert: path.join(__dirname, 'node_modules', 'nanoassert'),
      },
    },
    plugins: [
      new HTMLWebpackPlugin({
        template: './src/index.html'
      }),
      new webpack.DefinePlugin(envKeys)  
    ],
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    externals: {
      "vm2": "require('vm2')",
      "async_hooks": "require('async_hooks')"
    },
  }
}