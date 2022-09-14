# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-rc.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.20...@bitgo/sdk-core@2.0.0-rc.21) (2022-09-14)

**Note:** Version bump only for package @bitgo/sdk-core





# [2.0.0-rc.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.19...@bitgo/sdk-core@2.0.0-rc.20) (2022-09-13)


### Bug Fixes

* **sdk-core:** allow undefined for amtPaidSats ([7e9e9ea](https://github.com/BitGo/BitGoJS/commit/7e9e9eac7cab9ef41bc08e82704b90a8aeb46de9))





# [2.0.0-rc.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.17...@bitgo/sdk-core@2.0.0-rc.18) (2022-09-08)


### Bug Fixes

* **sdk-core:** tss tx signing ([ab7eb80](https://github.com/BitGo/BitGoJS/commit/ab7eb8079ea37e347727db106d01fe9362f36374))


### Features

* **sdk-coin-polygon:** support recovery ([15d6021](https://github.com/BitGo/BitGoJS/commit/15d602164d3a2b504d7995e65aa0fbcb38f98e89))





# [2.0.0-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.15...@bitgo/sdk-core@2.0.0-rc.16) (2022-09-07)


### Features

* **sdk-coin-avaxp:** implement tx builder for import on p ([f52d124](https://github.com/BitGo/BitGoJS/commit/f52d124a1dbf4be9fe7010eaa2460aa6a60a56ea))





# [2.0.0-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.14...@bitgo/sdk-core@2.0.0-rc.15) (2022-09-07)


### Features

* **sdk-core:** ecdsa type converters ([800b01b](https://github.com/BitGo/BitGoJS/commit/800b01b02194011bc0ac608a5d75094f935d6235))





# [2.0.0-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.13...@bitgo/sdk-core@2.0.0-rc.14) (2022-09-06)


### Features

* **sdk-coin-avaxp:** implement export tx builder ([483d9ce](https://github.com/BitGo/BitGoJS/commit/483d9ce67b75ca5eb4c1330f59820b18043cdb6c))





# [2.0.0-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.12...@bitgo/sdk-core@2.0.0-rc.13) (2022-09-01)

**Note:** Version bump only for package @bitgo/sdk-core





# [2.0.0-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.11...@bitgo/sdk-core@2.0.0-rc.12) (2022-08-31)


### Bug Fixes

* **sdk-core:** fix the signatures of lnurl pay methods ([6ffc17a](https://github.com/BitGo/BitGoJS/commit/6ffc17a025b9a79b33a334abdcbaa0f0d06e8a49))


### Features

* adding support for message signing ([01c6303](https://github.com/BitGo/BitGoJS/commit/01c63032d067e6ba5aef78804ea747b5e62709fe))
* **sdk-coin-avaxc:** add recover method for wrw ([40fb9a9](https://github.com/BitGo/BitGoJS/commit/40fb9a9b7a74ee043ee5d5a2618ecae065f8758b))


### BREAKING CHANGES

* **sdk-coin-avaxc:** The interface TransactionPrebuild is no longer exported
from package. It's defined in @bitgo/sdk-coin-eth.





# [2.0.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.10...@bitgo/sdk-core@2.0.0-rc.11) (2022-08-30)


### Features

* **account-lib:** add support for additional hash algorithms ([4e2aefe](https://github.com/BitGo/BitGoJS/commit/4e2aefe8bb7754f891e5f9919f591ad1cc04b34d))
* **sdk-core:** support lnurl pay ([6df91a3](https://github.com/BitGo/BitGoJS/commit/6df91a3eac28bf55600d5e856a297dde6b56c826))





# [2.0.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.9...@bitgo/sdk-core@2.0.0-rc.10) (2022-08-26)

**Note:** Version bump only for package @bitgo/sdk-core





# [2.0.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.8...@bitgo/sdk-core@2.0.0-rc.9) (2022-08-25)


### Bug Fixes

* allow token enablement for cold wallet ([557e79b](https://github.com/BitGo/BitGoJS/commit/557e79bb543dde8cbddd89ec13f424e9827aa4c3))


### Features

* **sdk-core:** add support for delegation in staking flow ([0c91edb](https://github.com/BitGo/BitGoJS/commit/0c91edb8ef4c76b577726abb3f4899f318f8ca17))





# [2.0.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.7...@bitgo/sdk-core@2.0.0-rc.8) (2022-08-23)


### Bug Fixes

* **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
* **sdk-core:** eth supports tss ([c0ec96f](https://github.com/BitGo/BitGoJS/commit/c0ec96fac7c5b4131d4f32d09463a78c0e1f8900))


### Features

* **sdk-coin-ethw:** add ethw sdk module ([63e9850](https://github.com/BitGo/BitGoJS/commit/63e9850c27039d1b614d14426a1d9b090d454b76))
* **sdk-core:** added verification of private share proofs ([66d6c63](https://github.com/BitGo/BitGoJS/commit/66d6c63bd102da49727e3bdb275cfa6231859ce5))
* update to work with bitcoinjs-lib@6 ([1950934](https://github.com/BitGo/BitGoJS/commit/1950934d9426385ee12b204cc7456327e4480618))





# [2.0.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.6...@bitgo/sdk-core@2.0.0-rc.7) (2022-08-22)


### Bug Fixes

* **account-lib:** shamir secret indices validity ([4e22783](https://github.com/BitGo/BitGoJS/commit/4e227839d5c1fb84a583f17d8754b46324f4eef9))


### Features

* **account-lib:** custom salt shamir share ([fa34652](https://github.com/BitGo/BitGoJS/commit/fa346529b5dc9897b6bbf6fb4a05ac77f2f05b2d))
* **sdk-core:** add getInvoices to lightning object ([232bea3](https://github.com/BitGo/BitGoJS/commit/232bea30d95a4b6f9554cc0416c54f0f73a979ad))


### Reverts

* Revert "feat: add keypair to acala module" ([ac4f700](https://github.com/BitGo/BitGoJS/commit/ac4f7001f7e77e6bfce4bb49d7fe4307d51c70b7))





# [2.0.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.5...@bitgo/sdk-core@2.0.0-rc.6) (2022-08-17)


### Bug Fixes

* **root:** align versions of bitcoinjs-lib ([b7eb929](https://github.com/BitGo/BitGoJS/commit/b7eb92998836a5945627ef1c80d74414b11f4867))


### Features

* **abstract-utxo:** add support for bigints from new utxo-lib ([77c60dd](https://github.com/BitGo/BitGoJS/commit/77c60ddd4d0ddd1e82a8b1bb041686a9c7f39fae))





# [2.0.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.4...@bitgo/sdk-core@2.0.0-rc.5) (2022-08-17)


### Bug Fixes

* **sdk-core:** tss wallet creation related bugs ([500c735](https://github.com/BitGo/BitGoJS/commit/500c73527edd902b65cfd784ea1022a21e0f6319))


### Features

* **sdk-core:** add deposit() to lightning object ([aeb483d](https://github.com/BitGo/BitGoJS/commit/aeb483d2cd2baf49659674f9b9ad7a9d37fcf672))





# [2.0.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.3...@bitgo/sdk-core@2.0.0-rc.4) (2022-08-15)


### Bug Fixes

* **sdk-core:** ecdsa signing get user share ([acbc700](https://github.com/BitGo/BitGoJS/commit/acbc7002c9ffd62c78e6dd2e72feac0c3ff4fe45))


### Features

* **sdk-core:** add withdraw to lightning object ([99474b5](https://github.com/BitGo/BitGoJS/commit/99474b581023b228ce6f2713f5b5d58c8d1186d6))





# [2.0.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.2...@bitgo/sdk-core@2.0.0-rc.3) (2022-08-12)


### Features

* **sdk-core:** add payInvoice to lightning object ([eaaa48d](https://github.com/BitGo/BitGoJS/commit/eaaa48d10a8d0cc74b2ac97e0d0d97feba88d72a))
* **sdk-core:** add support for enabling tokens on cold and custodial wallets ([e15c69c](https://github.com/BitGo/BitGoJS/commit/e15c69c4b38b7de74bd73627904960ad086b5f44))
* **sdk-core:** handle multiple token enables on chains that don't support it ([11302e9](https://github.com/BitGo/BitGoJS/commit/11302e97add128f6c11146373ef40637ec36ce95))


### Reverts

* Revert "feat(abstract-utxo): add support for bigints from new utxo-lib" ([f6091df](https://github.com/BitGo/BitGoJS/commit/f6091dfe659a94168db52b050d36907a7d0716b2))





# [2.0.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.0.0-rc.1...@bitgo/sdk-core@2.0.0-rc.2) (2022-08-10)


### Features

* **abstract-utxo:** add support for bigints from new utxo-lib ([8e5bbe5](https://github.com/BitGo/BitGoJS/commit/8e5bbe5e158254d34abb87f6d000e5afd9bb6b9d))
* **sdk-coin-sol:** sol token multi ata init ([736318f](https://github.com/BitGo/BitGoJS/commit/736318fff36f074fa841b97f3bc0c8cd95fae001))
* **sdk-core:** add createDepositAddress to lightning ([e7056dc](https://github.com/BitGo/BitGoJS/commit/e7056dc48448d69328d29bd223c179eb6486a40e))
* **sdk-core:** add createInvoice to lightning ([293a5d6](https://github.com/BitGo/BitGoJS/commit/293a5d6badd73def299b4f8420bc3380bb862cb2))





# [1.2.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.2.0-rc.2...@bitgo/sdk-core@1.2.0-rc.3) (2022-08-02)


### Features

* **account-lib:** add option to pass in custom seed ecdsa ([86b205e](https://github.com/BitGo/BitGoJS/commit/86b205e342ca5610ce460877a64f4733f944bf6e))





# [1.2.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.2.0-rc.1...@bitgo/sdk-core@1.2.0-rc.2) (2022-08-01)


### Bug Fixes

* **sdk-core:** fix tss ecdsa keychain encryption ([95f9c2d](https://github.com/BitGo/BitGoJS/commit/95f9c2d7d1018d387dc6cabd89e5c0d14b9f07d3))


### Features

* **sdk-core:** add specialized enable token functions ([3e60cef](https://github.com/BitGo/BitGoJS/commit/3e60cef71a0ae76b378356508338738eac49a920))





# [1.2.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.2.0-rc.0...@bitgo/sdk-core@1.2.0-rc.1) (2022-07-27)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.2.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.1...@bitgo/sdk-core@1.2.0-rc.0) (2022-07-26)


### Bug Fixes

* update AddWalletOptions ([64578e0](https://github.com/BitGo/BitGoJS/commit/64578e078129aa6503fd9d6193c57eddc5c4d27e))


### Features

* add u value proof during tss eddssa key creation ([79d2c91](https://github.com/BitGo/BitGoJS/commit/79d2c91ea5b101f8cad9b107b9e4426939333c5f))
* **sdk-core:** add more ecdsa helper methods ([aa57eac](https://github.com/BitGo/BitGoJS/commit/aa57eacdc97f2ecac4179f76461d798226178ba8))
* **sdk-core:** implement signing flow ecdsa ([68aa561](https://github.com/BitGo/BitGoJS/commit/68aa561193fe0574bd7b7080bb51d1d795cf31f9))





## [1.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.1-rc.1...@bitgo/sdk-core@1.1.1) (2022-07-21)

**Note:** Version bump only for package @bitgo/sdk-core





## [1.1.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.1-rc.0...@bitgo/sdk-core@1.1.1-rc.1) (2022-07-21)

**Note:** Version bump only for package @bitgo/sdk-core





## [1.1.1-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0...@bitgo/sdk-core@1.1.1-rc.0) (2022-07-20)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.29...@bitgo/sdk-core@1.1.0) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-core





# [1.1.0-rc.29](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.27...@bitgo/sdk-core@1.1.0-rc.29) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.29](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.27...@bitgo/sdk-core@1.1.0-rc.29) (2022-07-19)

### Bug Fixes

- **bitgo:** add token to whitelistedParams in eddsa prebuildTxWithIntent BG-52482 ([09c19e9](https://github.com/BitGo/BitGoJS/commit/09c19e950549f6777ee17919514cfb9a1039e73c))

### Features

- **sdk-coin-ada:** implement key pair and utils for ada sdk ([9a1aabb](https://github.com/BitGo/BitGoJS/commit/9a1aabb8a07b5787ab3fa645c29be1b940694892))

# [1.1.0-rc.28](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.27...@bitgo/sdk-core@1.1.0-rc.28) (2022-07-18)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.27](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.26...@bitgo/sdk-core@1.1.0-rc.27) (2022-07-15)

### Features

- support preview mode for consolidation ([3c89b91](https://github.com/BitGo/BitGoJS/commit/3c89b9150f8f073e236953fb1b06a18b7d545bfa))

# [1.1.0-rc.26](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.24...@bitgo/sdk-core@1.1.0-rc.26) (2022-07-15)

### Bug Fixes

- **account-lib:** fix proper format for compressed hex points ([3882452](https://github.com/BitGo/BitGoJS/commit/38824529efbbb2481e951236960833637e6cf5c5))

### Features

- **account-lib:** get rid of old ethereum lib ([abd2247](https://github.com/BitGo/BitGoJS/commit/abd2247047218d8cbd8ec7067d227721357f5fcc))

# [1.1.0-rc.25](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.24...@bitgo/sdk-core@1.1.0-rc.25) (2022-07-14)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.24](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.23...@bitgo/sdk-core@1.1.0-rc.24) (2022-07-11)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.23](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.22...@bitgo/sdk-core@1.1.0-rc.23) (2022-07-07)

### Bug Fixes

- **sdk-core:** make hex representation consistent ([ba493e9](https://github.com/BitGo/BitGoJS/commit/ba493e9a7d286197790c4d7e878aca83cf61d2fa))

### Features

- **account-lib:** token associate transaction builder for hedera accounts ([417c720](https://github.com/BitGo/BitGoJS/commit/417c7201b55c1fc546d52d5fd4daaf9390a3c480))
- **sdk-core:** tss ecdsa utility to create keychains ([0a1ab71](https://github.com/BitGo/BitGoJS/commit/0a1ab71ea981fe8bd833f1b25cc3c90e6cb89565))

# [1.1.0-rc.22](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.21...@bitgo/sdk-core@1.1.0-rc.22) (2022-07-05)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.20...@bitgo/sdk-core@1.1.0-rc.21) (2022-07-01)

### Features

- **sdk-core:** update validation to include eip1559 ([4775a84](https://github.com/BitGo/BitGoJS/commit/4775a84de1e4ba18dcbc7cd8cbfa0a40c4625e46))

# [1.1.0-rc.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.19...@bitgo/sdk-core@1.1.0-rc.20) (2022-06-30)

### Bug Fixes

- **account-lib:** fix ecdsa tests timeout issues ([12c86b2](https://github.com/BitGo/BitGoJS/commit/12c86b2dcbc24331ad47668829ec9f8eb131861f))
- **sdk-core:** fix sol send token sdk ([d5c697b](https://github.com/BitGo/BitGoJS/commit/d5c697b4f0b2e6a95eaf7a1f6e70db063f2877d2))

# [1.1.0-rc.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.18...@bitgo/sdk-core@1.1.0-rc.19) (2022-06-30)

### Bug Fixes

- **bitgo:** rounded value on spendable balance ([8ce7d01](https://github.com/BitGo/BitGoJS/commit/8ce7d019c3aed6827527a02c64226c4c27403f19))
- use correct address encoding when decoding polkadot txn ([99d4bdc](https://github.com/BitGo/BitGoJS/commit/99d4bdc237fcf126238455f7201ae51696e77566))

# [1.1.0-rc.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.16...@bitgo/sdk-core@1.1.0-rc.18) (2022-06-29)

### Features

- **account-lib:** add support for ecdsa sigining and verification tss ([8600501](https://github.com/BitGo/BitGoJS/commit/8600501320f09df21d63f9c01341844cb9a01fe1))

# [1.1.0-rc.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.16...@bitgo/sdk-core@1.1.0-rc.17) (2022-06-29)

### Features

- **account-lib:** add support for ecdsa sigining and verification tss ([8600501](https://github.com/BitGo/BitGoJS/commit/8600501320f09df21d63f9c01341844cb9a01fe1))

# [1.1.0-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.15...@bitgo/sdk-core@1.1.0-rc.16) (2022-06-27)

### Reverts

- Revert "feat(bitgo): handle new response for consolidateAccount/build endpoin" ([ec5ab05](https://github.com/BitGo/BitGoJS/commit/ec5ab05e66ef238addf3e213fff63ae9263e1010))

# [1.1.0-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.14...@bitgo/sdk-core@1.1.0-rc.15) (2022-06-23)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.13...@bitgo/sdk-core@1.1.0-rc.14) (2022-06-22)

### Bug Fixes

- **account-lib:** fix chaincode to use correct modulo ([33db7a3](https://github.com/BitGo/BitGoJS/commit/33db7a3446d3d4b2d9d21ee5d88d3d6ff19e4ed0))
- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))
- **sdk-core:** fix SOL Failed to create any transactions error BG-50572 ([01ddfd3](https://github.com/BitGo/BitGoJS/commit/01ddfd39e80188822a7fa72e5b70c9372d806b4c))

### Features

- add support for previewing tx requests ([a53149d](https://github.com/BitGo/BitGoJS/commit/a53149dd4081cb5547e2d0559e2f6c1913c54812))

# [1.1.0-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.12...@bitgo/sdk-core@1.1.0-rc.13) (2022-06-21)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.11...@bitgo/sdk-core@1.1.0-rc.12) (2022-06-16)

### Features

- **sdk-core:** add staking SDK functionality ([20371c9](https://github.com/BitGo/BitGoJS/commit/20371c9e320c6a6f9c929dcdbd3cfa197b960ac9))

# [1.1.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.10...@bitgo/sdk-core@1.1.0-rc.11) (2022-06-14)

### Features

- **sdk-coin-avaxp:** implemented builder for AddValidatorTx ([7cb8b2f](https://github.com/BitGo/BitGoJS/commit/7cb8b2fcaa31ff0dc165abcddd1f8383a7ecef5a))
- **sdk-core:** tss ecdsa key gen helper methods ([ef7e13e](https://github.com/BitGo/BitGoJS/commit/ef7e13e3bb948631f1d0faa7d2e34a4445197db2))
- tss - support user supplied entropy during signing ([29a0bea](https://github.com/BitGo/BitGoJS/commit/29a0bea4208f96c03c3aaac01069ca70c665b985))

# [1.1.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.9...@bitgo/sdk-core@1.1.0-rc.10) (2022-06-14)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.8...@bitgo/sdk-core@1.1.0-rc.9) (2022-06-13)

### Bug Fixes

- fix tss wallet creation ([8508182](https://github.com/BitGo/BitGoJS/commit/8508182d8746ea7e9e731c9cbdbd622c5ee65f31))

# [1.1.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.7...@bitgo/sdk-core@1.1.0-rc.8) (2022-06-10)

### Features

- **account-lib:** add support for chaincode for key derivation in ecdsa ([e8c9faf](https://github.com/BitGo/BitGoJS/commit/e8c9faf5cce270bf36d01a2012941004a06556b2))
- **account-lib:** add support for point multiplication in secp256k1 curve ([e8e00ab](https://github.com/BitGo/BitGoJS/commit/e8e00ab7ed935353ecaa88e865ba7f0348f40b69))
- **bitgo:** handle new response for consolidateAccount/build endpoin ([a333c5f](https://github.com/BitGo/BitGoJS/commit/a333c5f347aeab789414945aff5ed4281f3be296))
- move coinFactory from bitgo to sdk-core ([fb7e902](https://github.com/BitGo/BitGoJS/commit/fb7e902c150a25c40310dc040ca6a8833b097cef))
- support building transactions for tss custodial wallets ([12774ca](https://github.com/BitGo/BitGoJS/commit/12774cad3fe817f582be10228025aae2a5967cbc))

# [1.1.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.6...@bitgo/sdk-core@1.1.0-rc.7) (2022-06-07)

### Bug Fixes

- **sdk-core:** add paillier bigint dep ([a8cd71e](https://github.com/BitGo/BitGoJS/commit/a8cd71ea6b7ee9db98b4b004fb1661995dd94916))

# [1.1.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.5...@bitgo/sdk-core@1.1.0-rc.6) (2022-06-07)

### Features

- **account-lib:** add support for ecdsa keyshare generation tss ([c71bc34](https://github.com/BitGo/BitGoJS/commit/c71bc3437af7f5bdf0d1ef19d53b05a4a232ffe4))

# [1.1.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.4...@bitgo/sdk-core@1.1.0-rc.5) (2022-06-02)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.3...@bitgo/sdk-core@1.1.0-rc.4) (2022-06-02)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.2...@bitgo/sdk-core@1.1.0-rc.3) (2022-06-01)

### Bug Fixes

- add missing examples and filters for list addresses api ([6a6ad90](https://github.com/BitGo/BitGoJS/commit/6a6ad90c670710cd169cc11aeb68f227bfd60a7c))

### Features

- **sdk-core:** Define new BitGoBase interface in sdk-core ([907bd9e](https://github.com/BitGo/BitGoJS/commit/907bd9e024f196bfb707f04065a47d74e0f7ce0d))

# [1.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.1...@bitgo/sdk-core@1.1.0-rc.2) (2022-05-23)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.0...@bitgo/sdk-core@1.1.0-rc.1) (2022-05-19)

**Note:** Version bump only for package @bitgo/sdk-core

# [1.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.0.2-rc.0...@bitgo/sdk-core@1.1.0-rc.0) (2022-05-17)

### Features

- **sdk-core:** select hsmpub key based on node env ([2658b77](https://github.com/BitGo/BitGoJS/commit/2658b7711d3f4c458b69f4e9fb479482a29648c6))

## [1.0.2-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.0.1...@bitgo/sdk-core@1.0.2-rc.0) (2022-05-16)

**Note:** Version bump only for package @bitgo/sdk-core
