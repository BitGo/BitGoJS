const { readdir } = require('fs').promises;

module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (commit) => /^Merge commit '[a-f0-9]{40}'$/m.test(commit),
  ],
  rules: {
    'scope-enum': async () => [2, 'always', (await readdir('modules')).concat('root')],
    'references-empty': [
      2,
      'never',
    ],
  },
  parserPreset: {
    parserOpts: {
      issuePrefixes: [
        'BG-',
        'CR-',
        'STLX-',
        'BOS-',
      ],
    },
  },
};
