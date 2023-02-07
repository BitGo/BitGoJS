'use strict';

module.exports = {
  require: 'ts-node/register',
  timeout: '60000',
  reporter: 'min',
  'reporter-option': ['consoleReporter=min'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
