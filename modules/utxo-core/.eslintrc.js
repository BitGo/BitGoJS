module.exports = {
  extends: ['../../.eslintrc.json'],
  rules: {
    '@typescript-eslint/ban-types': 'off',
    'import/order': ['error', { 'newlines-between': 'always' }],
    'import/no-internal-modules': 'off',
  },
};
