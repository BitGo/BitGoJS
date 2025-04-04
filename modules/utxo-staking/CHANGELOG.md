# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.12.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.12.0...@bitgo/utxo-staking@1.12.1) (2025-04-04)

**Note:** Version bump only for package @bitgo/utxo-staking

# [1.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.11.0...@bitgo/utxo-staking@1.12.0) (2025-03-28)

### Features

- **utxo-staking:** add babylon implementation link ([cfd5fd6](https://github.com/BitGo/BitGoJS/commit/cfd5fd619d7f16bfc5ae1734763a7ff6eb479d38))
- **utxo-staking:** add babylon network type and conversion utils ([4ef02f9](https://github.com/BitGo/BitGoJS/commit/4ef02f9e1ce65f7a29580ac5509ecbc3ac269ed1))
- **utxo-staking:** add createDelegationMessageFromPsbt utils ([ca8202e](https://github.com/BitGo/BitGoJS/commit/ca8202ec7dbc9b0ab83a8688b6a79a1f054ba4b3))
- **utxo-staking:** add reference link to babylon types impl ([a631006](https://github.com/BitGo/BitGoJS/commit/a6310064ef65e87ad7a2df5a373e5282aeba9ccf))
- **utxo-staking:** add staking timelock parameter ([689aded](https://github.com/BitGo/BitGoJS/commit/689aded1dbf07362ac082f151910cd85591e0196))
- **utxo-staking:** add toStakerInfo helper ([dd4ca9b](https://github.com/BitGo/BitGoJS/commit/dd4ca9b64be3818478f09db0c5666259fb89dfd2))
- **utxo-staking:** export babylon param lookup functions ([70b6efd](https://github.com/BitGo/BitGoJS/commit/70b6efd5914bbf6ae36625f25d4b2100eb8bae93))
- **utxo-staking:** extract network type definitions ([eb7f2b8](https://github.com/BitGo/BitGoJS/commit/eb7f2b87fa94ab8d9ef666818254604f42cfbceb))
- **utxo-staking:** init bitcoinjs ecc lib in index.ts ([d0e7ef5](https://github.com/BitGo/BitGoJS/commit/d0e7ef55bdf1298d53fe664758baaddf5fad7d28))
- **utxo-staking:** initialize bitcoinjs ecc lib with utxolib ecc ([fbfd4dd](https://github.com/BitGo/BitGoJS/commit/fbfd4dd3c603cf1ddc75efb49d89c8876a343e5d))
- **utxo-staking:** refactor delegation message creation ([8019a14](https://github.com/BitGo/BitGoJS/commit/8019a14d68157399ca16cab95936c5e67ddc539f))
- **utxo-staking:** remove unused key utils file ([df2f341](https://github.com/BitGo/BitGoJS/commit/df2f34108103b2003e907ec7d1cf65788d294385))

# [1.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.10.0...@bitgo/utxo-staking@1.11.0) (2025-03-20)

### Features

- **utxo-staking:** add babylon params sync script and manager ([c743316](https://github.com/BitGo/BitGoJS/commit/c743316b4c52a60063e0bfc926847152eccbf490))
- **utxo-staking:** add files field to package.json ([fdde58b](https://github.com/BitGo/BitGoJS/commit/fdde58bd8baca4ca8cdbe9e6f221759562a7ca76))

# [1.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.9.0...@bitgo/utxo-staking@1.10.0) (2025-03-18)

### Features

- **deps:** add babylonlabs package as dev dependency ([65e31bf](https://github.com/BitGo/BitGoJS/commit/65e31bff9e43f9f5401ca3dd334bf01085855128))
- **utxo-staking:** add test for babylon delegation message ([d1bf8c3](https://github.com/BitGo/BitGoJS/commit/d1bf8c3083b6f3f5f7f629b56c60e548608cdbbe))
- **utxo-staking:** add unsigned delegation message creation ([7fb9d68](https://github.com/BitGo/BitGoJS/commit/7fb9d68c6e7d2ac8f19c2f416807acb589c86f02))
- **utxo-staking:** add utils for creating unsigned delegation messages ([071f7e4](https://github.com/BitGo/BitGoJS/commit/071f7e40a0c50cf90d4c185c3e5e7f3bdca90f35))
- **utxo-staking:** bump babylon-proto-ts to 1.0.0 ([889b1c7](https://github.com/BitGo/BitGoJS/commit/889b1c7c8323db918d459117683c46afabfe83a6))

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.8.0...@bitgo/utxo-staking@1.9.0) (2025-03-06)

### Features

- **utxo-staking:** add normalize helper for test fixtures ([b2266d8](https://github.com/BitGo/BitGoJS/commit/b2266d8264b7579ebd505cb7c723389439f65849))

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.6.0...@bitgo/utxo-staking@1.8.0) (2025-03-04)

### Bug Fixes

- **utxo-staking:** avoid mutating input array in sortedKeys ([17f6e5d](https://github.com/BitGo/BitGoJS/commit/17f6e5de5f16d0356075816ba3f204b8612ce641))

### Features

- **utxo-core:** simplify module exports ([ea7cd0f](https://github.com/BitGo/BitGoJS/commit/ea7cd0f90977894c25fc0734386b9e8d27465fd5))
- **utxo-staking:** add single key finality provider script generation ([0fe5393](https://github.com/BitGo/BitGoJS/commit/0fe539359f01c204d34cfe86f208cdc2697bcb7d))
- **utxo-staking:** exclude test fixtures from prettier formatting ([7cf7bdc](https://github.com/BitGo/BitGoJS/commit/7cf7bdcc57bc5ee09be387abcf5ae119889f44db))
- **utxo-staking:** update CoreDAO output type to use utxo-core Output ([30902d6](https://github.com/BitGo/BitGoJS/commit/30902d6e152581651806a86aa3d1b2f56a1a9830))

# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.6.0...@bitgo/utxo-staking@1.7.0) (2025-02-26)

### Bug Fixes

- **utxo-staking:** avoid mutating input array in sortedKeys ([17f6e5d](https://github.com/BitGo/BitGoJS/commit/17f6e5de5f16d0356075816ba3f204b8612ce641))

### Features

- **utxo-staking:** add single key finality provider script generation ([0fe5393](https://github.com/BitGo/BitGoJS/commit/0fe539359f01c204d34cfe86f208cdc2697bcb7d))
- **utxo-staking:** exclude test fixtures from prettier formatting ([7cf7bdc](https://github.com/BitGo/BitGoJS/commit/7cf7bdcc57bc5ee09be387abcf5ae119889f44db))

## [1.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.6.0...@bitgo/utxo-staking@1.6.1) (2025-02-20)

**Note:** Version bump only for package @bitgo/utxo-staking

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.5.0...@bitgo/utxo-staking@1.6.0) (2025-02-19)

### Features

- **utxo-staking:** add testnet params and descriptor builder for Babylon ([b0764bb](https://github.com/BitGo/BitGoJS/commit/b0764bb644ad2313ac19ddd4210f340fbf9b60f1))
- **utxo-staking:** add vendored btc-staking-ts 0.4.0-rc.2 ([607fd3e](https://github.com/BitGo/BitGoJS/commit/607fd3eaea6508668ae42dbe9c5d2444d12ec245))
- **utxo-staking:** enable import ordering rule ([0f8b127](https://github.com/BitGo/BitGoJS/commit/0f8b1273a6e5683610a7131de828d6e21a5a4bc4))
- **utxo-staking:** export babylon staking module ([4e86a2c](https://github.com/BitGo/BitGoJS/commit/4e86a2c06fe68a5592aa937399a0e5aa6648e24e))
- **utxo-staking:** migrate test utils to utxo-core ([4395971](https://github.com/BitGo/BitGoJS/commit/4395971fcc21afaf55727f6badb26335c91cde19))
- **utxo-staking:** simplify mocha config and test scripts ([44b3d7c](https://github.com/BitGo/BitGoJS/commit/44b3d7c0ae0cc1d0c4b49f5fcbeabc21cfb7effa))
- **utxo-staking:** use miniscript AST for descriptor creation ([bc0fb09](https://github.com/BitGo/BitGoJS/commit/bc0fb096ce29dae1e6cde984f3d54f9a292d4996))
- **utxo-staking:** use TapTreeNode type for Babylon descriptor ([79f9c5c](https://github.com/BitGo/BitGoJS/commit/79f9c5c8e8650b494ec1afa2fa215328d3d1facb))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.5...@bitgo/utxo-staking@1.5.0) (2024-12-17)

### Features

- **utxo-staking:** add support for wsh script type ([c3632a4](https://github.com/BitGo/BitGoJS/commit/c3632a456a92953ee52340c79740bcd9e6f66215))

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.5...@bitgo/utxo-staking@1.4.0) (2024-12-17)

### Features

- **utxo-staking:** add support for wsh script type ([c3632a4](https://github.com/BitGo/BitGoJS/commit/c3632a456a92953ee52340c79740bcd9e6f66215))

## [1.3.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.4...@bitgo/utxo-staking@1.3.5) (2024-12-12)

**Note:** Version bump only for package @bitgo/utxo-staking

## [1.3.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.3...@bitgo/utxo-staking@1.3.4) (2024-12-11)

**Note:** Version bump only for package @bitgo/utxo-staking

## [1.3.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.2...@bitgo/utxo-staking@1.3.3) (2024-12-03)

**Note:** Version bump only for package @bitgo/utxo-staking

## [1.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.1...@bitgo/utxo-staking@1.3.2) (2024-11-26)

**Note:** Version bump only for package @bitgo/utxo-staking

## [1.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-staking@1.3.0...@bitgo/utxo-staking@1.3.1) (2024-11-21)

**Note:** Version bump only for package @bitgo/utxo-staking

# 1.3.0 (2024-11-19)

### Features

- **utxo-staking:** build staking transaction ([73b33bc](https://github.com/BitGo/BitGoJS/commit/73b33bc93e46934fe5e6002c52c0b1443a3d0d8d))
- **utxo-staking:** create coredao staking outputs ([6b5ca4b](https://github.com/BitGo/BitGoJS/commit/6b5ca4b7c726fb6a4380526391416f6db356e0b7))

# 1.2.0 (2024-11-14)

### Features

- **utxo-staking:** build staking transaction ([73b33bc](https://github.com/BitGo/BitGoJS/commit/73b33bc93e46934fe5e6002c52c0b1443a3d0d8d))
- **utxo-staking:** create coredao staking outputs ([6b5ca4b](https://github.com/BitGo/BitGoJS/commit/6b5ca4b7c726fb6a4380526391416f6db356e0b7))

# 1.1.0 (2024-11-01)

### Bug Fixes

- **utxo-coredao:** clarifications from the coredao team ([56157b3](https://github.com/BitGo/BitGoJS/commit/56157b34e6802895489928d8e7a87f8f5c8129ed))
- **utxo-coredao:** fix json encoding to add newline ([bb5be2f](https://github.com/BitGo/BitGoJS/commit/bb5be2f91e0e7f1d59d94a1786fdd2cccc4ebad6))

### Features

- **utxo-coredao:** descriptor for CoreDao ([791f9e4](https://github.com/BitGo/BitGoJS/commit/791f9e47033a8224759d98f0483f5b0bb9bbc524))
- **utxo-coredao:** init repo and op-return ([60fa058](https://github.com/BitGo/BitGoJS/commit/60fa058f693cf722db8d5e7507539a5ec1c8b1a5))
- **utxo-coredao:** parse and verify op-return ([32dc7c4](https://github.com/BitGo/BitGoJS/commit/32dc7c49f0ff5baeb0db4a20853f70745f71c02b))
