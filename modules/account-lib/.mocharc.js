'use strict';

module.exports = {
  require: 'ts-node/register',
  timeout: '20000',
  reporter: 'mochawesome',
  'reporter-option': ['consoleReporter=min'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
