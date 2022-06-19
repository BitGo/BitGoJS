const path = require('path');
const mode = process.env.NODE_ENV ?? 'production';
const { mergeWith } = require('lodash');
const bitgoConfig = require('../../webpack/bitgojs.config');
const { mergeCustomizer } = require('../../webpack/mergeCustomizer');

module.exports = mergeWith(
  {
    mode,
    target: 'web',
    entry: path.join(__dirname, '/dist/src/index.js'),
    output: {
      path: path.resolve(__dirname, 'dist/web'),
      libraryTarget: 'commonjs',
    },
  },
  bitgoConfig,
  mergeCustomizer
);
