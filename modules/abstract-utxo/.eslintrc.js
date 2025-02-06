module.exports = {
  extends: ['../../.eslintrc.json'],
  rules: {
    'import/order': ['error', { 'newlines-between': 'always' }],
    'import/no-internal-modules': 'off',
  },
};
