# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.7.0...@bitgo/sdk-coin-canton@1.8.0) (2025-10-31)


### Features

* added explainTransaction for canton ([080a847](https://github.com/BitGo/BitGoJS/commit/080a8477188b633e98d702fedc7f5bb0a019f219))
* handling new type of intents in prebuild ([ad46a25](https://github.com/BitGo/BitGoJS/commit/ad46a25b7959f4f809cabd8c24a1d049e1d678b1))





# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.6.0...@bitgo/sdk-coin-canton@1.7.0) (2025-10-29)


### Bug Fixes

* **sdk-coin-canton:** bug fix in transaction type ([c0abb73](https://github.com/BitGo/BitGoJS/commit/c0abb734ddbade498c03ef44e2f2283b5dd2dede))


### Features

* added transfer reject builder ([ac4fbe7](https://github.com/BitGo/BitGoJS/commit/ac4fbe73ba3ed12f73b43ae43927b3eeb8f9c436))
* **sdk-coin-canton:** added acknowledgement data in transaction ([f9da33b](https://github.com/BitGo/BitGoJS/commit/f9da33b1c2a885addf77d324d6087e11ad155886))
* **sdk-coin-canton:** added handling is parse raw canton transaction to correctly extract the data ([f2422d3](https://github.com/BitGo/BitGoJS/commit/f2422d37a98a5eac581ac5fee538d76358ba4db9))
* **sdk-coin-canton:** added transfer acknowledgement builder ([a51a9f6](https://github.com/BitGo/BitGoJS/commit/a51a9f68950c233dcde97c6a0cf9d5ea323d35e9))





# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.5.0...@bitgo/sdk-coin-canton@1.6.0) (2025-10-24)


### Bug Fixes

* **sdk-coin-canton:** fix transaction signable payload getter ([8d02499](https://github.com/BitGo/BitGoJS/commit/8d02499d3c663cc2d5d3cc03927f36c8c3eae1f4))


### Features

* add  in package json to correctly resolve esm-based projects ([34a894d](https://github.com/BitGo/BitGoJS/commit/34a894d2c33bb913fc3dd866cc82002ef93a88fa))
* added createAccount intent for canton wallet init ([f0f9964](https://github.com/BitGo/BitGoJS/commit/f0f9964f7af9dd6e7fc7704e4fde2758d13ae1a6))
* **sdk-coin-canton:** added transfer acceptance builder ([d1f3794](https://github.com/BitGo/BitGoJS/commit/d1f37944f66b377952fc769c3be508404dd3e8d8))
* **sdk-coin-canton:** added verify transaction method handling for wallet init ([b7f600b](https://github.com/BitGo/BitGoJS/commit/b7f600b2f084ec36f1341bf0f051d7434dad782e))





# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.4.0...@bitgo/sdk-coin-canton@1.5.0) (2025-10-21)


### Features

* **sdk-coin-canton:** added from implementation to the builder factory ([52a286b](https://github.com/BitGo/BitGoJS/commit/52a286b80e9f53af29f8abfdb55c01b568b49a85))
* **sdk-coin-canton:** modified the toBroadcastFormat for the wallet init transaction ([2e5d25c](https://github.com/BitGo/BitGoJS/commit/2e5d25c3dc5166e603bbd742012944695156864f))





# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.3.0...@bitgo/sdk-coin-canton@1.4.0) (2025-10-16)


### Bug Fixes

* **sdk-coin-canton:** fix issue with beta dependency bumps ([9672c67](https://github.com/BitGo/BitGoJS/commit/9672c67a40bf5f9db5646ccccce3b1e80bbbdb20))
* **sdk-coin-canton:** removed the non-required export ([73ed13d](https://github.com/BitGo/BitGoJS/commit/73ed13d974e7cc840c77678688b95b4a0ab2b726))


### Features

* **sdk-coin-canton:** added pre-approval builder ([8cbdf3e](https://github.com/BitGo/BitGoJS/commit/8cbdf3ec4be6cc52abd405c369befb8814957063))
* **sdk-coin-canton:** added wallet initialize builder to the builder factory ([8bc0608](https://github.com/BitGo/BitGoJS/commit/8bc0608c5bace577350c4adb01501700cc1e5a82))
* **sdk-coin-canton:** export the wallet init transaction ([fcdebce](https://github.com/BitGo/BitGoJS/commit/fcdebce615b2c8dc32bf3f33fdd76ff6d31226a3))
* **sdk-coin-canton:** removed non-required fields from builders ([b4f19cc](https://github.com/BitGo/BitGoJS/commit/b4f19cc59ca8ee80d01de958708020f32726a58d))





# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.2.0...@bitgo/sdk-coin-canton@1.3.0) (2025-10-13)


### Features

* **sdk-coin-canton:** added wallet initialization builder class ([5a75d7a](https://github.com/BitGo/BitGoJS/commit/5a75d7a85ae4783edd0c368eb9b4992eb53b4443))





# [1.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-canton@1.1.0...@bitgo/sdk-coin-canton@1.2.0) (2025-10-09)


### Bug Fixes

* run check-fmt on code files only ([9745196](https://github.com/BitGo/BitGoJS/commit/9745196b02b9678c740d290a4638ceb153a8fd75))


### Features

* **sdk-coin-canton:** added transaction class and canton raw transaction local parser ([2062ff5](https://github.com/BitGo/BitGoJS/commit/2062ff5eb341dda8b9b8696f0d6b2f0c76ba7c02))





# 1.1.0 (2025-10-08)


### Bug Fixes

* **sdk-coin-canton:** added 'files' in package json to fix the publish issue ([420fdcf](https://github.com/BitGo/BitGoJS/commit/420fdcf845589a2a8ce9e37136a6da80fa2b4bdb))


### Features

* added canton coin to statics ([0eebbc9](https://github.com/BitGo/BitGoJS/commit/0eebbc9a377b2ef6f792498004520074aa62fd92))
* **sdk-coin-canton:** added key pair generation & test ([33f7705](https://github.com/BitGo/BitGoJS/commit/33f7705782e058c5a6c4f134cbc455ee7cfeca16))
* **sdk-coin-canton:** added new coin, canton skeleton ([9aa34bb](https://github.com/BitGo/BitGoJS/commit/9aa34bb85688b225c3429e3909e7702cfd7f4608))
