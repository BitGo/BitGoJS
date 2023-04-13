# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-unified-wallet@2.0.1...@bitgo/sdk-unified-wallet@3.0.0) (2023-04-13)

### Bug Fixes

- **sdk-unified-wallet:** added pagination options ([060fb99](https://github.com/BitGo/BitGoJS/commit/060fb9911d0d4c332a7c821c7743e00ae6d1571a))
- **sdk-unified-wallet:** change argument name in getunifiedwallet by id ([5f9f8a6](https://github.com/BitGo/BitGoJS/commit/5f9f8a6bc6401ca19bfe5870c3953bbcf3817a40))
- **sdk-unified-wallet:** made changes to accomodate api result change ([33246e1](https://github.com/BitGo/BitGoJS/commit/33246e1bcfb1c0aeba71eb11137dfc2039264fc5))

### Code Refactoring

- **sdk-unified-evm:** change getallunifiedwallets name ([b359860](https://github.com/BitGo/BitGoJS/commit/b3598605846f8eff4ae284fe32ead5ad6afb425c))

### Features

- **sdk-unified-wallet:** added eddsa impl ([284f147](https://github.com/BitGo/BitGoJS/commit/284f147df74cde83ab594338808eef83d6865615))
- **sdk-unified-wallet:** created getunifiedwalletfromkeytriplet ([7c85a05](https://github.com/BitGo/BitGoJS/commit/7c85a05ad1094fec357ebb20a373ccda1a4e05b8))

### BREAKING CHANGES

- **sdk-unified-evm:** rename getAllUnifiedWallets to getUnifiedWallets to conform with BitGo naming convention

Ticket: BG-69090

## [2.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-unified-wallet@2.0.0...@bitgo/sdk-unified-wallet@2.0.1) (2023-02-17)

**Note:** Version bump only for package @bitgo/sdk-unified-wallet

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
