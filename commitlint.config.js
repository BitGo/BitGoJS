module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    (commit) => /^Merge commit '[a-f0-9]{40}'$/m.test(commit),
  ],
};
