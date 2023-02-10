# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.7.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.7.0...@bitgo/sdk-coin-sui@1.7.2) (2023-02-08)

### Bug Fixes

- **sdk-coin-sui:** fix sui signing ([860e078](https://github.com/BitGo/BitGoJS/commit/860e078f3b2e6cb724411d28994e67ce5d6d0340))

## [1.7.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.7.0...@bitgo/sdk-coin-sui@1.7.1) (2023-01-30)

**Note:** Version bump only for package @bitgo/sdk-coin-sui

# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.6.5...@bitgo/sdk-coin-sui@1.7.0) (2023-01-25)

### Features

- **sdk-coin-sui:** update sui serialize and deserialize tx to version greater than 0.19 ([e228ba2](https://github.com/BitGo/BitGoJS/commit/e228ba2670a75025b879df3e6df7fee3e460a557))

## [1.6.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.6.4...@bitgo/sdk-coin-sui@1.6.5) (2022-12-23)

**Note:** Version bump only for package @bitgo/sdk-coin-sui

## [1.6.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.6.3...@bitgo/sdk-coin-sui@1.6.4) (2022-12-20)

### Bug Fixes

- **sdk-coin-sui:** add allowAccountConsolidations ([0a6ca38](https://github.com/BitGo/BitGoJS/commit/0a6ca38b9403f08bd489b01b1edd3265b139aabc))
- **sdk-coin-sui:** exclude signer data from tx digest ([88db48e](https://github.com/BitGo/BitGoJS/commit/88db48e0b5a4947a9d49814f34a90213b15e1af5))
- **sdk-coin-sui:** fix explainTransaction when amounts is empty ([783471b](https://github.com/BitGo/BitGoJS/commit/783471bbdfb6187746e34f0430d11cdafa463eac))
- **sdk-coin-sui:** remove amount from payAll serialized txn ([ddf9273](https://github.com/BitGo/BitGoJS/commit/ddf92737910e73e5c73abb0d5d775e5831903f63))

## [1.6.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.6.2...@bitgo/sdk-coin-sui@1.6.3) (2022-12-09)

### Bug Fixes

- **sdk-coin-sui:** add signed data to serialized str ([1f49745](https://github.com/BitGo/BitGoJS/commit/1f49745f2c8ba2e1f3016e21448c1c6519fd4a73))
- **sdk-coin-sui:** fix serialization byte size ([750a16d](https://github.com/BitGo/BitGoJS/commit/750a16df89fa282d567aad1e362a4e772acb4832))

## [1.6.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.6.1...@bitgo/sdk-coin-sui@1.6.2) (2022-12-06)

**Note:** Version bump only for package @bitgo/sdk-coin-sui

## [1.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.6.0...@bitgo/sdk-coin-sui@1.6.1) (2022-12-01)

**Note:** Version bump only for package @bitgo/sdk-coin-sui

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.2.0...@bitgo/sdk-coin-sui@1.6.0) (2022-11-29)

### Bug Fixes

- **sdk-coin-sui:** added signature to sui transaction ([17e06be](https://github.com/BitGo/BitGoJS/commit/17e06bec0eaffb0db2464dc456c01e5db324d94b))
- **sdk-coin-sui:** fix serialized tx format type ([b1f716e](https://github.com/BitGo/BitGoJS/commit/b1f716ee1b76624487affd956e29f1ff351ba306))
- **sdk-coin-sui:** fix sui gasPayment in inputCoins ([22328e2](https://github.com/BitGo/BitGoJS/commit/22328e268429c3d664cc890aedf2eb938de2fbf4))

### Features

- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- implement sui keypair ([1ae6096](https://github.com/BitGo/BitGoJS/commit/1ae6096bbf48de1db0ccc8a3122b114f0e1489ce))
- **sdk-coin-sui:** add sui parse transaction ([c1b7b4f](https://github.com/BitGo/BitGoJS/commit/c1b7b4f21bd866e22192111dff304bb87f3460e5))
- **sdk-coin-sui:** added sui explain transaction ([0e681da](https://github.com/BitGo/BitGoJS/commit/0e681da2f5572e66dffe0be992c13acdcafc549d))
- **sdk-coin-sui:** support paySui and payAllSui transaction types ([2df4f9f](https://github.com/BitGo/BitGoJS/commit/2df4f9fa7423d3bc0ccf7fea478291ce3217b8ed))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.2.0...@bitgo/sdk-coin-sui@1.5.0) (2022-11-04)

### Bug Fixes

- **sdk-coin-sui:** added signature to sui transaction ([17e06be](https://github.com/BitGo/BitGoJS/commit/17e06bec0eaffb0db2464dc456c01e5db324d94b))

### Features

- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- implement sui keypair ([1ae6096](https://github.com/BitGo/BitGoJS/commit/1ae6096bbf48de1db0ccc8a3122b114f0e1489ce))
- **sdk-coin-sui:** add sui parse transaction ([c1b7b4f](https://github.com/BitGo/BitGoJS/commit/c1b7b4f21bd866e22192111dff304bb87f3460e5))
- **sdk-coin-sui:** added sui explain transaction ([0e681da](https://github.com/BitGo/BitGoJS/commit/0e681da2f5572e66dffe0be992c13acdcafc549d))

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.2.0...@bitgo/sdk-coin-sui@1.4.0) (2022-10-27)

### Features

- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- implement sui keypair ([1ae6096](https://github.com/BitGo/BitGoJS/commit/1ae6096bbf48de1db0ccc8a3122b114f0e1489ce))
- **sdk-coin-sui:** add sui parse transaction ([c1b7b4f](https://github.com/BitGo/BitGoJS/commit/c1b7b4f21bd866e22192111dff304bb87f3460e5))
- **sdk-coin-sui:** added sui explain transaction ([0e681da](https://github.com/BitGo/BitGoJS/commit/0e681da2f5572e66dffe0be992c13acdcafc549d))

# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sui@1.2.0...@bitgo/sdk-coin-sui@1.3.0) (2022-10-25)

### Features

- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- implement sui keypair ([1ae6096](https://github.com/BitGo/BitGoJS/commit/1ae6096bbf48de1db0ccc8a3122b114f0e1489ce))
- **sdk-coin-sui:** add sui parse transaction ([c1b7b4f](https://github.com/BitGo/BitGoJS/commit/c1b7b4f21bd866e22192111dff304bb87f3460e5))
- **sdk-coin-sui:** added sui explain transaction ([0e681da](https://github.com/BitGo/BitGoJS/commit/0e681da2f5572e66dffe0be992c13acdcafc549d))

# 1.2.0 (2022-10-18)

### Bug Fixes

- **sdk-coin-sui:** fix sui verifyTransaction ([72d94b5](https://github.com/BitGo/BitGoJS/commit/72d94b588ee30f6778be01799d91e5aa3e09863b))

### Features

- implement isValidAddress for SUI ([e47c41d](https://github.com/BitGo/BitGoJS/commit/e47c41d3f0b74b30df6851d06da32ef6bb96153d))
- **sdk-coin-sui:** added SUI skeleton ([7b04dd1](https://github.com/BitGo/BitGoJS/commit/7b04dd15800b6473b3317dafac39744e70cfad3d))
- **sdk-coin-sui:** added sui tx and transfer builder ([8a5b50b](https://github.com/BitGo/BitGoJS/commit/8a5b50bf06e30bb03d77eb4af584402e0d0860ab))
- **sdk-coin-sui:** create sui module ([8ba86b7](https://github.com/BitGo/BitGoJS/commit/8ba86b7a10720a14ff1efa9c4616c1f26d27d8e4))
- **sdk-coin-sui:** prefix sui addresses with 0x ([7e3ee9c](https://github.com/BitGo/BitGoJS/commit/7e3ee9c9ed27236e85f75b2d4b61f6714c94dfa6))
