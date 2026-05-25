'use strict';

module.exports = {
  require: 'tsx',
  timeout: '20000',
  reporter: 'min',
  'reporter-option': ['cdn=true', 'json=false'],
  exit: true,
  extension: ['.js', '.ts'],
};
