# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.1.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@3.1.3...@bitgo/sdk-coin-atom@3.1.4) (2023-05-17)

**Note:** Version bump only for package @bitgo/sdk-coin-atom

## [3.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@3.1.2...@bitgo/sdk-coin-atom@3.1.3) (2023-05-10)

**Note:** Version bump only for package @bitgo/sdk-coin-atom

## [3.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@3.1.1...@bitgo/sdk-coin-atom@3.1.2) (2023-05-03)

**Note:** Version bump only for package @bitgo/sdk-coin-atom

## [3.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@3.1.0...@bitgo/sdk-coin-atom@3.1.1) (2023-04-25)

**Note:** Version bump only for package @bitgo/sdk-coin-atom

# [3.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@3.0.0...@bitgo/sdk-coin-atom@3.1.0) (2023-04-20)

### Features

- **sdk-coin-atom:** add memo support for atom ([0287361](https://github.com/BitGo/BitGoJS/commit/0287361265de70a57c833f0ec1598648a88f1c24))

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@2.1.0...@bitgo/sdk-coin-atom@3.0.0) (2023-04-13)

### Bug Fixes

- **sdk-coin-atom:** allow transaction creation from both Hex and Base64 ([91fae07](https://github.com/BitGo/BitGoJS/commit/91fae072387bcf79d571ce7537b2de42e8ed1166))
- **sdk-coin-atom:** fix getAddress of KeyPair ([b966658](https://github.com/BitGo/BitGoJS/commit/b9666588cc0f5f6965f57af50e0c0da5dfe0cc2b))
- **sdk-core:** add new function in BaseCoin to get hash-function ([e028b31](https://github.com/BitGo/BitGoJS/commit/e028b31b3954810ee6c3fd7fdfa6ed4a07aa458e))

### Features

- **sdk-coin-atom:** add function to load inputs and outputs of a transaction ([c3e3c1d](https://github.com/BitGo/BitGoJS/commit/c3e3c1d0632f5f7490f1aad6c0d1042533f222ab))
- **sdk-coin-atom:** add staking transaction builders ([5fe2e35](https://github.com/BitGo/BitGoJS/commit/5fe2e3589b1ac47031d82e1869dff1e676a4f318))
- **sdk-coin-atom:** add support to serialise unsigned txn ([f46c31b](https://github.com/BitGo/BitGoJS/commit/f46c31b3a22096b193e521d259fdc8f5c030ab02))
- **sdk-coin-atom:** implement isValidAddress for atom ([2fb8a93](https://github.com/BitGo/BitGoJS/commit/2fb8a93f05f024e12b72c7ee85ec8563a2e65275))
- **sdk-coin-atom:** implement remaining methods ([7c03501](https://github.com/BitGo/BitGoJS/commit/7c035019c76a1bbf4fbaa3da7e5823823637d2be))

### BREAKING CHANGES

- **sdk-coin-atom:** type MessageData is changed
- **sdk-coin-atom:** Renamed type interface GasFeeLimitData to FeeData and parameter gas to gasLimit

# [2.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-atom@2.0.0...@bitgo/sdk-coin-atom@2.1.0) (2023-02-17)

### Features

- **sdk-coin-atom:** add function to validate amount data ([8ab8054](https://github.com/BitGo/BitGoJS/commit/8ab805403f9e636dc4e32a7ea6302b6d9e5b205e))

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
