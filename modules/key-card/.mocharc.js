'use strict';

module.exports = {
  require: 'tsx',
  reporter: 'min',
  'reporter-option': ['cdn=true', 'json=false'],
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
