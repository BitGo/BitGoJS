// Karma configuration
// Generated on Tue Aug 11 2020 16:34:20 GMT-0700 (Pacific Daylight Time)
if (!process.env.CHROME_BIN) {
  process.env.CHROME_BIN = require('puppeteer').executablePath();
}

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'karma-typescript'],

    // list of files / patterns to load in the browser
    files: [
      'dist/browser/BitGoJS.min.js',
      'test/browser/karmaHelper.js',
      { pattern: 'test/browser/**/*.ts' },
      { pattern: 'dist/browser/*.wasm', included: false, served: true, watched: false, nocache: true },
    ],

    plugins: [require('karma-jasmine'), require('karma-typescript'), require('karma-chrome-launcher')],
    // list of files / patterns to exclude
    exclude: ['node_modules'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/browser/**/*.ts': ['karma-typescript'],
    },
    karmaTypescriptConfig: {
      bundlerOptions: {
        entrypoints: /\.spec\.ts$/,
      },
      compilerOptions: {
        sourceMap: true,
        target: 'es6',
        lib: ['dom', 'es6', 'es5', 'es2017', 'es2018'],
        types: ['jasmine'],
      },
      include: ['test/browser/**/*.ts'],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    browsers: ['HeadlessChromeNoSandbox'],
    customLaunchers: {
      HeadlessChromeNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
    // uncomment to debug locally
    // browsers: ['Chrome'],
    // singleRun: false
  });
};
