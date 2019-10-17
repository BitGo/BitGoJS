const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const glob = require('glob');

// Loaders handle certain extensions and apply transforms
function setupRules(env) {
  const rules = [
    {
      test: /\.ts$/,
      loader: 'awesome-typescript-loader',
    },
  ];

  return rules;
}

function setupExternals() {
  const nodeLibraries = ['fs', 'net', 'tls'];
  
  return nodeLibraries;
}

// Used for extra processing that does not involve transpilation (e.g. minification)
function setupPlugins(env) {
  const plugins = [
    // This is for handling dynamic requires in third-party libraries
    // By default, webpack will bundle _everything_ that could possibly match the expression
    // inside a dynamic 'require'. This changes Webpack so that it bundles nothing.
    new webpack.ContextReplacementPlugin(/.*$/, /$NEVER_MATCH^/),
  ];

  return plugins;
}

// Test configuration - does not bundle main code, but merges all files in test/ to single output file
function getTestConfig(env) {
  return {
    // Take everything in the test directory
    entry: glob.sync(path.join(__dirname, 'test', '**', '*.ts')),

    // Output everything into browser/tests.js
    output: {
      path: path.join(__dirname, 'browser'),
      filename: 'tests.js'
    },

    externals: setupExternals(env),
    plugins: setupPlugins(env)
  };
}

// Webpack configuration takes environment as argument, returns a config object
module.exports = function setupWebpack(env) {
  // If no env is provided, default to dev
  if (!env) {
    console.log('No environment provided - defaulting to dev. Use the npm `compile` tasks for a better build experience.');
    env = { dev: true };
  }

  if (env.test) {
    // Compile tests
    return getTestConfig(env);
  }

  // Compile source code
  return {
    resolve: {
      extensions: ['.js']
    },
    // Main project entry point
    entry: path.join(__dirname, 'dist', 'browserify', 'bitgo-account-lib.browserify.js'),

    // Output directory and filename
    output: {
      path: path.join(__dirname, 'dist', 'browser'),
      filename: env.prod ? 'bitgo-account-lib.min.js' : 'bitgo-account-lib.js',
      library: 'bitgo-account-lib',
      libraryTarget: 'umd'
    },

    // All of our transpilation settings. Should really only need 'loaders' for now
    module: { rules: setupRules(env) },

    // Do not bundle these when encountered
    externals: setupExternals(env),

    // Any extra processing
    plugins: setupPlugins(env),

    optimization: {
      minimizer: [new TerserPlugin({
        terserOptions: {
          ecma: 5,
          warnings: true,
          mangle: false,
          keep_classnames: true,
          keep_fnames: true
        }
      })]
    },

    // Create a source map for the bundled code (dev and test only)
    devtool: !env.prod && 'source-map',
    mode: env.prod ? 'production' : 'development'
  };
};
