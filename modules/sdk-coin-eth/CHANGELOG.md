# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@2.2.0...@bitgo/sdk-coin-eth@2.7.0) (2022-11-29)

### Bug Fixes

- multiple issues with message signing ([d703b9a](https://github.com/BitGo/BitGoJS/commit/d703b9a6149c4fe26ad16001f5f681389c8f8aba))
- remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
- **sdk-coin-celo:** fix precision bug in celo build/sign ([15b47c7](https://github.com/BitGo/BitGoJS/commit/15b47c73c9550ab8060b59cc1d1f8c2ce5cb0361))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))

# [2.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@2.2.0...@bitgo/sdk-coin-eth@2.6.0) (2022-11-04)

### Bug Fixes

- remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))

# [2.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@2.2.0...@bitgo/sdk-coin-eth@2.4.0) (2022-10-27)

### Bug Fixes

- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))

# [2.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@2.2.0...@bitgo/sdk-coin-eth@2.3.0) (2022-10-25)

### Bug Fixes

- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))

# [2.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.1.0-rc.3...@bitgo/sdk-coin-eth@2.2.0) (2022-10-18)

### Bug Fixes

- **bitgo:** no `Buffer` support in browsers ([5210662](https://github.com/BitGo/BitGoJS/commit/521066269397dc21040c835b669ad5f3e8fd329d))
- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
- **sdk-coin-eth:** create custom ETH common for unsupported chain ids ([9329162](https://github.com/BitGo/BitGoJS/commit/93291625150a0ae1f2f69432a3910845ee933e9d))
- **sdk-coin-eth:** fix v1 address init code ([9a3bb82](https://github.com/BitGo/BitGoJS/commit/9a3bb8216da92cf3cf3ce009d6595bf2a1a66885))
- **sdk-core:** eth supports tss ([c0ec96f](https://github.com/BitGo/BitGoJS/commit/c0ec96fac7c5b4131d4f32d09463a78c0e1f8900))
- **sdk-core:** tss tx signing ([ab7eb80](https://github.com/BitGo/BitGoJS/commit/ab7eb8079ea37e347727db106d01fe9362f36374))

### Features

- **abstract-eth:** validate istss for evms ([29f0b5a](https://github.com/BitGo/BitGoJS/commit/29f0b5aa875c4a6a727f9b3e9a073740230c4fb8))
- **account-lib:** add support for additional hash algorithms ([4e2aefe](https://github.com/BitGo/BitGoJS/commit/4e2aefe8bb7754f891e5f9919f591ad1cc04b34d))
- adding support for message signing ([01c6303](https://github.com/BitGo/BitGoJS/commit/01c63032d067e6ba5aef78804ea747b5e62709fe))
- **sdk-coin-eth:** add acceleration capability for eth ([436ba8c](https://github.com/BitGo/BitGoJS/commit/436ba8ceb478c4028d5b05dc34bb623be6fc581f))
- **sdk-coin-eth:** add v1 wallet init code ([b1c983d](https://github.com/BitGo/BitGoJS/commit/b1c983d2f0723aa6647fca3d01a4c814639624b4))
- **sdk-coin-polygon:** add second signing ([c053924](https://github.com/BitGo/BitGoJS/commit/c05392483224194fc9aa97f02592534d25ef9ade))
- **sdk-coin-polygon:** add signTx method ([3458ed0](https://github.com/BitGo/BitGoJS/commit/3458ed0f10d46489be5f1765679a8de3e786b020))
- **sdk-coin-polygon:** support recovery ([15d6021](https://github.com/BitGo/BitGoJS/commit/15d602164d3a2b504d7995e65aa0fbcb38f98e89))
- **sdk-core:** allow getting a staking wallet for any coin ([cfae0fe](https://github.com/BitGo/BitGoJS/commit/cfae0feeb14c1bcb30dad2840abd8489372bfbc8))

### BREAKING CHANGES

- **sdk-coin-eth:** Changes the return for exported method
  decodeWalletCreationData() in sdk-coin-eth
  BG-53733

# [1.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.1.0-rc.3...@bitgo/sdk-coin-eth@1.1.0) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-coin-eth

# [1.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.1.0-rc.1...@bitgo/sdk-coin-eth@1.1.0-rc.3) (2022-07-19)

### Bug Fixes

- **sdk-coin-eth:** modify buildAddressInitializationTransaction method ([3cc205f](https://github.com/BitGo/BitGoJS/commit/3cc205f6e216fa4245dcebefe584de708f4037b0))

# [1.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.1.0-rc.1...@bitgo/sdk-coin-eth@1.1.0-rc.2) (2022-07-18)

**Note:** Version bump only for package @bitgo/sdk-coin-eth

# [1.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.1.0-rc.0...@bitgo/sdk-coin-eth@1.1.0-rc.1) (2022-07-15)

**Note:** Version bump only for package @bitgo/sdk-coin-eth

# [1.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.0.1-rc.2...@bitgo/sdk-coin-eth@1.1.0-rc.0) (2022-07-15)

### Features

- **account-lib:** get rid of old ethereum lib ([abd2247](https://github.com/BitGo/BitGoJS/commit/abd2247047218d8cbd8ec7067d227721357f5fcc))
- **sdk-coin-eth:** modify address init code ([16c8985](https://github.com/BitGo/BitGoJS/commit/16c8985c7ff1498a413835d473fe7e9472685f13))

## [1.0.1-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.0.1-rc.2...@bitgo/sdk-coin-eth@1.0.1-rc.3) (2022-07-14)

**Note:** Version bump only for package @bitgo/sdk-coin-eth

## [1.0.1-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.0.1-rc.1...@bitgo/sdk-coin-eth@1.0.1-rc.2) (2022-07-12)

**Note:** Version bump only for package @bitgo/sdk-coin-eth

## [1.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-eth@1.0.1-rc.0...@bitgo/sdk-coin-eth@1.0.1-rc.1) (2022-07-11)

**Note:** Version bump only for package @bitgo/sdk-coin-eth

## 1.0.1-rc.0 (2022-07-07)

**Note:** Version bump only for package @bitgo/sdk-coin-eth
