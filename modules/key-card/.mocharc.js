'use strict';

module.exports = {
  require: 'ts-node/register',
  reporter: 'min',
  'reporter-option': ['cdn=true', 'json=false'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
