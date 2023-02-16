# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 2.0.0 (2023-02-16)

### Bug Fixes

- **root:** manually fix up incorrect versions ([3b1d28a](https://github.com/BitGo/BitGoJS/commit/3b1d28a8a4925e6dc1d89bb7482ea3b2f52b7b95))
- **sdk-unified-wallet:** change name of package and codeowner ([487f21d](https://github.com/BitGo/BitGoJS/commit/487f21d7d80f9318f7f5ce2c4263eac624c9bdcd))
- **sdk-unified-wallet:** fix typo in coin names ([6906a0c](https://github.com/BitGo/BitGoJS/commit/6906a0c5bb8ab0a22d210950fb8831cb0327014b))
- **sdk-unified-wallet:** updated createwallet method to reflect api changes ([13d775c](https://github.com/BitGo/BitGoJS/commit/13d775c8cc14fe268a62e06c22240bd4b855f837))

### Code Refactoring

- **sdk-unified-wallet:** remove coin name from constructor ([cd5bd56](https://github.com/BitGo/BitGoJS/commit/cd5bd5608c25c35f9258d6d96e97b7ecd22e61fa))

### Features

- **sdk-unified-wallet:** added get coin wallet ([39ca8ab](https://github.com/BitGo/BitGoJS/commit/39ca8ab26816273acecdf979847b48d1a0c557f1))
- **sdk-unified-wallet:** added getters ([7d36d81](https://github.com/BitGo/BitGoJS/commit/7d36d81590b778054f74549ea297ecc3a63acea7))
- **sdk-unified-wallet:** finish key creation implementation ([53f6395](https://github.com/BitGo/BitGoJS/commit/53f639537e3f3459dbaf1d9424225ae1590a2c1f))

### BREAKING CHANGES

- **sdk-unified-wallet:** remove CoinFamily from sdk-unified0wallet as string is sufficient
- **sdk-unified-wallet:** remove coinName from UnifiedWallets (and children) constructor

Ticket: BG-67715
