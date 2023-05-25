# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.5.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.5.3...@bitgo/sdk-coin-bsc@3.5.4) (2023-05-25)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.5.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.5.2...@bitgo/sdk-coin-bsc@3.5.3) (2023-05-17)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.5.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.5.1...@bitgo/sdk-coin-bsc@3.5.2) (2023-05-10)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.5.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.5.0...@bitgo/sdk-coin-bsc@3.5.1) (2023-05-03)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

# [3.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.4.1...@bitgo/sdk-coin-bsc@3.5.0) (2023-04-25)

### Features

- **sdk-core:** update ecdsa signing to use enterprise challenge ([c626f00](https://github.com/BitGo/BitGoJS/commit/c626f00e141db2ef4147b3e0c4badf1776729465))

## [3.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.4.0...@bitgo/sdk-coin-bsc@3.4.1) (2023-04-20)

### Bug Fixes

- **root:** update tests using safe primes ([5a275ff](https://github.com/BitGo/BitGoJS/commit/5a275ffbf3eecf351dfbb0b4538d62dd0a2f2a43))

# [3.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.3.1...@bitgo/sdk-coin-bsc@3.4.0) (2023-04-13)

### Features

- **sdk-coin-bsc:** allow account consolidations ([0d94585](https://github.com/BitGo/BitGoJS/commit/0d94585cb5ddcbb1a90388930287c5952f67f658))

## [3.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.3.0...@bitgo/sdk-coin-bsc@3.3.1) (2023-02-17)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

# [3.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.5...@bitgo/sdk-coin-bsc@3.3.0) (2023-02-16)

### Bug Fixes

- **sdk-coin-bsc:** build from txHex ([15173e9](https://github.com/BitGo/BitGoJS/commit/15173e967741964f19b042a9523e280ec758e440))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))

# [3.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.5...@bitgo/sdk-coin-bsc@3.2.0) (2023-02-08)

### Bug Fixes

- **sdk-coin-bsc:** build from txHex ([15173e9](https://github.com/BitGo/BitGoJS/commit/15173e967741964f19b042a9523e280ec758e440))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))

## [3.1.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.5...@bitgo/sdk-coin-bsc@3.1.6) (2023-01-30)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.1.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.4...@bitgo/sdk-coin-bsc@3.1.5) (2023-01-25)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.1.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.3...@bitgo/sdk-coin-bsc@3.1.4) (2022-12-23)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.2...@bitgo/sdk-coin-bsc@3.1.3) (2022-12-20)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.1...@bitgo/sdk-coin-bsc@3.1.2) (2022-12-09)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [3.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.1.0...@bitgo/sdk-coin-bsc@3.1.1) (2022-12-06)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

# [3.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@3.0.0...@bitgo/sdk-coin-bsc@3.1.0) (2022-12-01)

### Features

- **sdk-core:** add keyDerive to ECDSA TSS implementation ([9ff1d89](https://github.com/BitGo/BitGoJS/commit/9ff1d89ba0e42d53640f0fe7b71c53d1a2eb4a10))

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@1.3.0...@bitgo/sdk-coin-bsc@3.0.0) (2022-11-29)

### Features

- **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))

### BREAKING CHANGES

- **sdk-core:** Key shares require a `v` value for combination.
  ISSUE: BG-57633

# [2.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@1.3.0...@bitgo/sdk-coin-bsc@2.0.0) (2022-11-04)

### Features

- **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))

### BREAKING CHANGES

- **sdk-core:** Key shares require a `v` value for combination.
  ISSUE: BG-57633

## [1.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@1.3.0...@bitgo/sdk-coin-bsc@1.3.2) (2022-10-27)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

## [1.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-bsc@1.3.0...@bitgo/sdk-coin-bsc@1.3.1) (2022-10-25)

**Note:** Version bump only for package @bitgo/sdk-coin-bsc

# 1.3.0 (2022-10-18)

### Bug Fixes

- **sdk-core:** ecdsa send signing bitgo's n share u ([1cb1e93](https://github.com/BitGo/BitGoJS/commit/1cb1e933c692f454de538b3b189ef2feb1b39475))
- **sdk-core:** tss wallet creation related bugs ([500c735](https://github.com/BitGo/BitGoJS/commit/500c73527edd902b65cfd784ea1022a21e0f6319))

### Features

- **sdk-coin-bsc:** add key pair ([17d3e0b](https://github.com/BitGo/BitGoJS/commit/17d3e0b72590b6ba34c45c6617265709ad70f955))
- **sdk-coin-bsc:** add transfer and transaction builders ([1c27a63](https://github.com/BitGo/BitGoJS/commit/1c27a6343f30d341588eadd2a323b4ac2fe73646))
- **sdk-coin-bsc:** create bsc module ([b55ca71](https://github.com/BitGo/BitGoJS/commit/b55ca7173e27ee2d75d342b6706698769f11734f))
- **sdk-coin-bsc:** replace bsc keypair with eth keypair ([e297107](https://github.com/BitGo/BitGoJS/commit/e297107f8f5e233acb1ef2d5f3c2bf5ade460f64))
- **sdk-coin-bsc:** support tokens for bsc ([44d2af8](https://github.com/BitGo/BitGoJS/commit/44d2af8f3f14bc61d31e6a0b8482a68db2a7d23e))
