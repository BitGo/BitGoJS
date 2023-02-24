'use strict';

module.exports = {
  require: 'ts-node/register',
  timeout: '600000',
  exit: true,
  spec: ['test/unit/**/*.ts'],
};
