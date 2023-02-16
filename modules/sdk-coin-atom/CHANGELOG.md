# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@1.1.0...@bitgo/sdk-coin-atom@2.0.0) (2023-02-16)

### Bug Fixes

- **sdk-coin-atom:** fix get address method to generate unique address ([c75378b](https://github.com/BitGo/BitGoJS/commit/c75378b538b0b1002cc3195f29677fcb0e970208))

### Code Refactoring

- **sdk-coin-atom:** only decode sequence from raw atom tx ([84c8370](https://github.com/BitGo/BitGoJS/commit/84c8370bdeb1330e8801c416b9170a6329884c46))

### Features

- **sdk-coin-atom:** add Atom transaction builder skeleton ([94bf5c7](https://github.com/BitGo/BitGoJS/commit/94bf5c7bd1bbd10619fc99a21498746e04f2e5cd))
- **sdk-coin-atom:** implement basic util methods for atom ([ebd6a54](https://github.com/BitGo/BitGoJS/commit/ebd6a5400a976f6d2a0cd810c590147047be8680))
- **sdk-coin-atom:** skeleton for transaction class ATOM ([69f7c7e](https://github.com/BitGo/BitGoJS/commit/69f7c7e08e4f15fb16de545b1a816054fdaf8992))

### BREAKING CHANGES

- **sdk-coin-atom:** Updates the AtomTransaction schema to only
  use the sequence number, not the entire explicitSignerData property.
  TICKET: BG-67573

# [1.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@1.1.0...@bitgo/sdk-coin-atom@1.2.0) (2023-02-08)

### Features

- **sdk-coin-atom:** add Atom transaction builder skeleton ([94bf5c7](https://github.com/BitGo/BitGoJS/commit/94bf5c7bd1bbd10619fc99a21498746e04f2e5cd))
- **sdk-coin-atom:** implement basic util methods for atom ([ebd6a54](https://github.com/BitGo/BitGoJS/commit/ebd6a5400a976f6d2a0cd810c590147047be8680))
- **sdk-coin-atom:** skeleton for transaction class ATOM ([69f7c7e](https://github.com/BitGo/BitGoJS/commit/69f7c7e08e4f15fb16de545b1a816054fdaf8992))

## [1.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@1.1.0...@bitgo/sdk-coin-atom@1.1.1) (2023-01-30)

**Note:** Version bump only for package @bitgo/sdk-coin-atom

# 1.1.0 (2023-01-25)

### Features

- **sdk-coin-atom:** add keyPair management to cosmos ([9549a5e](https://github.com/BitGo/BitGoJS/commit/9549a5efde08c0ce13ab28149862499ad5f3eb08))
- **sdk-coin-atom:** create atom module ([88d9971](https://github.com/BitGo/BitGoJS/commit/88d99714275e98c3997451776c9eec3b21645ffa))
