const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { join } = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const outputConfig = {
  destPath: './dist',
};

// Entry points
// https://webpack.js.org/concepts/entry-points/
const entryConfig = ['./src/index.tsx', './src/assets/stylesheets/app.scss'];

// Copy files from src to dist
// https://webpack.js.org/plugins/copy-webpack-plugin/
const copyPluginPatterns = {
  patterns: [
    { from: './src/assets/images', to: 'images' },
    { from: './src/assets/fonts', to: 'fonts' },
    { from: './src/assets/vendor', to: 'js' },
  ],
};

// Dev server setup
// https://webpack.js.org/configuration/dev-server/
const devServer = {
  static: {
    directory: path.join(__dirname, outputConfig.destPath),
  },
  historyApiFallback: true,
};

// SCSS compile
const scssConfig = {
  destFileName: 'css/app.min.css',
};

// Production terser config options
// https://webpack.js.org/plugins/terser-webpack-plugin/#terseroptions
const terserPluginConfig = {
  extractComments: false,
  terserOptions: {
    compress: {
      drop_console: true,
    },
  },
};

const aliasItems = {
  '@src': join(__dirname, '../src'),
  '@images': join(__dirname, '../src/images'),
  '@styles': join(__dirname, '../src/styles'),
  '@components': join(__dirname, '../src/components'),
};

const experiments = {
  backCompat: false,
};

const rules = [
  {
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/,
  },
  {
    test: /\.(?:ico|gif|png|jpg|jpeg|svg)$/i,
    type: 'javascript/auto',
    loader: 'file-loader',
    options: {
      publicPath: '../',
      name: '[path][name].[ext]',
      context: path.resolve(__dirname, 'src/assets'),
      emitFile: false,
    },
  },
  {
    test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
    type: 'javascript/auto',
    exclude: /images/,
    loader: 'file-loader',
    options: {
      publicPath: '../',
      context: path.resolve(__dirname, 'src/assets'),
      name: '[path][name].[ext]',
      emitFile: false,
    },
  },
];

const devRules = [
  ...rules,
  {
    test: /\.scss$/,
    use: [
      // We're in dev and want HMR, SCSS is handled in JS
      // In production, we want our css as files
      'style-loader',
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [['postcss-preset-env']],
          },
        },
      },
      'sass-loader',
    ],
  },
];

const prodRules = [
  ...rules,
  {
    test: /\.scss$/,
    use: [
      MiniCssExtractPlugin.loader,
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [['postcss-preset-env']],
          },
        },
      },
      'sass-loader',
    ],
  },
];

const devPlugins = [
  new HtmlWebpackPlugin({
    template: './src/index.html',
    inject: true,
    minify: false,
  }),
  new CopyPlugin(copyPluginPatterns),
];

const prodPlugins = [
  new CleanWebpackPlugin(),
  new CopyPlugin(copyPluginPatterns),
  new MiniCssExtractPlugin({ filename: scssConfig.destFileName }),
  new HtmlWebpackPlugin({
    template: './src/index.html',
    inject: true,
    minify: false,
  }),
];

const resolveFallback = {
  'process/browser': require.resolve('process/browser'),
};

module.exports = {
  aliasItems,
  copyPluginPatterns,
  devServer,
  entryConfig,
  experiments,
  outputConfig,
  scssConfig,
  terserPluginConfig,
  devRules,
  prodRules,
  devPlugins,
  prodPlugins,
  resolveFallback,
};
