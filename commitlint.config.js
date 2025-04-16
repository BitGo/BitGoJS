const { readdir } = require('fs').promises;

module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (commit) => /^Merge commit '[a-f0-9]{40}'$/m.test(commit),
    (commit) => /^chore\(root\): publish modules/m.test(commit),
    (commit) => commit.includes('Signed-off-by: dependabot[bot] <support@github.com>'),
  ],
  rules: {
    'scope-enum': async () => [2, 'always', (await readdir('modules')).concat('root', 'deps', 'scripts')],
    'footer-max-line-length': [0, 'always', Infinity],
    'references-empty': [2, 'never'],
  },
  parserPreset: {
    parserOpts: {
      issuePrefixes: [
        'BG-',
        'BMF-',
        'BOS-',
        'BT-',
        'BTC-',
        'CAAS-',
        'CE-',
        'CEN-',
        'CLEX-',
        'COPS-',
        'CP-',
        'CR-',
        'CS-',
        'CSI-',
        'DE-',
        'DES-',
        'DO-',
        'DOS-',
        'DX-',
        'EA-',
        'ERC20-',
        'FAC-',
        'GNA-',
        'GO-',
        'GRC-',
        'HSM-',
        'INC-',
        'IR-',
        'IS-',
        'ITHD-',
        'ITOPS-',
        'MD-',
        'PB-',
        'POL-',
        'PX-',
        'QA-',
        'RA-',
        'SO-',
        'SC-',
        'ST-',
        'STLX-',
        'TRUST-',
        'USDS-',
        'VL-',
        'WIN-',
        'WP-',
        'COIN-',
        'FIAT-',
        '#', // Prefix used by GitHub issues
      ],
    },
  },
};
