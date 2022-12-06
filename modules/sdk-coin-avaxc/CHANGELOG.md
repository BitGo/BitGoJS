# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@2.3.1...@bitgo/sdk-coin-avaxc@2.3.2) (2022-12-06)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

## [2.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@2.3.0...@bitgo/sdk-coin-avaxc@2.3.1) (2022-12-01)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

# [2.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@2.2.0...@bitgo/sdk-coin-avaxc@2.3.0) (2022-11-29)

### Bug Fixes

- **sdk-coin-avaxc:** add tx type to fee estimation and build params ([83a12be](https://github.com/BitGo/BitGoJS/commit/83a12be8d41a8796160737ccb48a9a3e98495042))

### Features

- **sdk-coin-avaxc:** hop export tx verify signature uses keccak256 for tx ([cd940b5](https://github.com/BitGo/BitGoJS/commit/cd940b5244a18f06882921da2448a4fbb2cdbdf4))
- **sdk-coin-avaxc:** remove use of suer req sig for hot tx ([fa231e8](https://github.com/BitGo/BitGoJS/commit/fa231e8ae08bcbb5ab48bd7cf19a624f46c92ea7))
- **sdk-coin-avaxc:** verify c to p hop export tx ([e34e2e9](https://github.com/BitGo/BitGoJS/commit/e34e2e95b4fb3fb6d7eb078408bab5403e64145c))

## [2.2.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@2.2.0...@bitgo/sdk-coin-avaxc@2.2.4) (2022-11-04)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

## [2.2.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@2.2.0...@bitgo/sdk-coin-avaxc@2.2.2) (2022-10-27)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

## [2.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@2.2.0...@bitgo/sdk-coin-avaxc@2.2.1) (2022-10-25)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

# [2.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.1.0-rc.3...@bitgo/sdk-coin-avaxc@2.2.0) (2022-10-18)

### Bug Fixes

- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
- **sdk-coin-avaxc:** fix hop transactions ([39a6b58](https://github.com/BitGo/BitGoJS/commit/39a6b5859618ff22b31843dea4d24cec11400f1b))
- **sdk-coin-avaxc:** fix unsigned sweep format for ovc ([564ca4d](https://github.com/BitGo/BitGoJS/commit/564ca4d80ab47de011f9790a536469355a86a86a))

### Features

- **account-lib:** add support for additional hash algorithms ([4e2aefe](https://github.com/BitGo/BitGoJS/commit/4e2aefe8bb7754f891e5f9919f591ad1cc04b34d))
- **sdk-coin-avaxc:** add recover method for wrw ([40fb9a9](https://github.com/BitGo/BitGoJS/commit/40fb9a9b7a74ee043ee5d5a2618ecae065f8758b))
- **sdk-coin-avaxc:** add recovery support for unsigned sweep ([f36efd1](https://github.com/BitGo/BitGoJS/commit/f36efd10ecbb93e476c947643097c75787972a8d))
- **sdk-coin-avaxc:** update explain transaction for avaxc ([94d502e](https://github.com/BitGo/BitGoJS/commit/94d502ee406a4817f6c97b53f954cc630baa6b98))

### BREAKING CHANGES

- **sdk-coin-avaxc:** The interface TransactionPrebuild is no longer exported
  from package. It's defined in @bitgo/sdk-coin-eth.

# [1.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.1.0-rc.3...@bitgo/sdk-coin-avaxc@1.1.0) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

# [1.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.1.0-rc.1...@bitgo/sdk-coin-avaxc@1.1.0-rc.3) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

# [1.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.1.0-rc.1...@bitgo/sdk-coin-avaxc@1.1.0-rc.2) (2022-07-18)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

# [1.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.1.0-rc.0...@bitgo/sdk-coin-avaxc@1.1.0-rc.1) (2022-07-15)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

# [1.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.0.1-rc.0...@bitgo/sdk-coin-avaxc@1.1.0-rc.0) (2022-07-15)

### Features

- **account-lib:** get rid of old ethereum lib ([abd2247](https://github.com/BitGo/BitGoJS/commit/abd2247047218d8cbd8ec7067d227721357f5fcc))

## [1.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-avaxc@1.0.1-rc.0...@bitgo/sdk-coin-avaxc@1.0.1-rc.1) (2022-07-14)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc

## 1.0.1-rc.0 (2022-07-12)

**Note:** Version bump only for package @bitgo/sdk-coin-avaxc
