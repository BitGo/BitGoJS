'use strict';

module.exports = {
  require: 'ts-node/register',
  timeout: '60000',
  reporter: 'min',
  'reporter-option': ['cdn=true', 'json=false', 'consoleReporter=spec'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
