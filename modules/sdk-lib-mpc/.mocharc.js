'use strict';

module.exports = {
  require: 'ts-node/register',
  timeout: '20000',
  reporter: 'min',
  'reporter-option': ['cdn=true', 'json=false'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
  extension: ['.js', '.ts'],
};
