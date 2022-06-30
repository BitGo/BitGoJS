'use strict';

module.exports = {
  require: 'ts-node/register',
  timeout: '20000',
  reporter: 'min',
  'reporter-option': ['consoleReporter=min'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
