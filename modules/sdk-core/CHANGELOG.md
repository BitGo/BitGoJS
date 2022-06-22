# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.1.0-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.13...@bitgo/sdk-core@1.1.0-rc.14) (2022-06-22)


### Bug Fixes

* **account-lib:** fix chaincode to use correct modulo ([33db7a3](https://github.com/BitGo/BitGoJS/commit/33db7a3446d3d4b2d9d21ee5d88d3d6ff19e4ed0))
* add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))
* **sdk-core:** fix SOL Failed to create any transactions error BG-50572 ([01ddfd3](https://github.com/BitGo/BitGoJS/commit/01ddfd39e80188822a7fa72e5b70c9372d806b4c))


### Features

* add support for previewing tx requests ([a53149d](https://github.com/BitGo/BitGoJS/commit/a53149dd4081cb5547e2d0559e2f6c1913c54812))





# [1.1.0-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.12...@bitgo/sdk-core@1.1.0-rc.13) (2022-06-21)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.11...@bitgo/sdk-core@1.1.0-rc.12) (2022-06-16)


### Features

* **sdk-core:** add staking SDK functionality ([20371c9](https://github.com/BitGo/BitGoJS/commit/20371c9e320c6a6f9c929dcdbd3cfa197b960ac9))





# [1.1.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.10...@bitgo/sdk-core@1.1.0-rc.11) (2022-06-14)


### Features

* **sdk-coin-avaxp:** implemented builder for AddValidatorTx ([7cb8b2f](https://github.com/BitGo/BitGoJS/commit/7cb8b2fcaa31ff0dc165abcddd1f8383a7ecef5a))
* **sdk-core:** tss ecdsa key gen helper methods ([ef7e13e](https://github.com/BitGo/BitGoJS/commit/ef7e13e3bb948631f1d0faa7d2e34a4445197db2))
* tss - support user supplied entropy during signing ([29a0bea](https://github.com/BitGo/BitGoJS/commit/29a0bea4208f96c03c3aaac01069ca70c665b985))





# [1.1.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.9...@bitgo/sdk-core@1.1.0-rc.10) (2022-06-14)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.8...@bitgo/sdk-core@1.1.0-rc.9) (2022-06-13)


### Bug Fixes

* fix tss wallet creation ([8508182](https://github.com/BitGo/BitGoJS/commit/8508182d8746ea7e9e731c9cbdbd622c5ee65f31))





# [1.1.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.7...@bitgo/sdk-core@1.1.0-rc.8) (2022-06-10)


### Features

* **account-lib:** add support for chaincode for key derivation in ecdsa ([e8c9faf](https://github.com/BitGo/BitGoJS/commit/e8c9faf5cce270bf36d01a2012941004a06556b2))
* **account-lib:** add support for point multiplication in secp256k1 curve ([e8e00ab](https://github.com/BitGo/BitGoJS/commit/e8e00ab7ed935353ecaa88e865ba7f0348f40b69))
* **bitgo:** handle new response for consolidateAccount/build endpoin ([a333c5f](https://github.com/BitGo/BitGoJS/commit/a333c5f347aeab789414945aff5ed4281f3be296))
* move coinFactory from bitgo to sdk-core ([fb7e902](https://github.com/BitGo/BitGoJS/commit/fb7e902c150a25c40310dc040ca6a8833b097cef))
* support building transactions for tss custodial wallets ([12774ca](https://github.com/BitGo/BitGoJS/commit/12774cad3fe817f582be10228025aae2a5967cbc))





# [1.1.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.6...@bitgo/sdk-core@1.1.0-rc.7) (2022-06-07)


### Bug Fixes

* **sdk-core:** add paillier bigint dep ([a8cd71e](https://github.com/BitGo/BitGoJS/commit/a8cd71ea6b7ee9db98b4b004fb1661995dd94916))





# [1.1.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.5...@bitgo/sdk-core@1.1.0-rc.6) (2022-06-07)


### Features

* **account-lib:** add support for ecdsa keyshare generation tss ([c71bc34](https://github.com/BitGo/BitGoJS/commit/c71bc3437af7f5bdf0d1ef19d53b05a4a232ffe4))





# [1.1.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.4...@bitgo/sdk-core@1.1.0-rc.5) (2022-06-02)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.3...@bitgo/sdk-core@1.1.0-rc.4) (2022-06-02)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.2...@bitgo/sdk-core@1.1.0-rc.3) (2022-06-01)


### Bug Fixes

* add missing examples and filters for list addresses api ([6a6ad90](https://github.com/BitGo/BitGoJS/commit/6a6ad90c670710cd169cc11aeb68f227bfd60a7c))


### Features

* **sdk-core:** Define new BitGoBase interface in sdk-core ([907bd9e](https://github.com/BitGo/BitGoJS/commit/907bd9e024f196bfb707f04065a47d74e0f7ce0d))





# [1.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.1...@bitgo/sdk-core@1.1.0-rc.2) (2022-05-23)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.0...@bitgo/sdk-core@1.1.0-rc.1) (2022-05-19)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.0.2-rc.0...@bitgo/sdk-core@1.1.0-rc.0) (2022-05-17)


### Features

* **sdk-core:** select hsmpub key based on node env ([2658b77](https://github.com/BitGo/BitGoJS/commit/2658b7711d3f4c458b69f4e9fb479482a29648c6))





## [1.0.2-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.0.1...@bitgo/sdk-core@1.0.2-rc.0) (2022-05-16)

**Note:** Version bump only for package @bitgo/sdk-core
