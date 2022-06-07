# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.3.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.5...@bitgo/utxo-lib@2.3.0-rc.6) (2022-06-07)

**Note:** Version bump only for package @bitgo/utxo-lib





# [2.3.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.4...@bitgo/utxo-lib@2.3.0-rc.5) (2022-06-01)


### Bug Fixes

* **utxo-lib:** always use VERSION4_BRANCH_NU5 for zcash ([ef0692c](https://github.com/BitGo/BitGoJS/commit/ef0692c6772f6d21fce3da6cc515dc74915c3c6d))





# [2.3.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.3...@bitgo/utxo-lib@2.3.0-rc.4) (2022-05-17)

**Note:** Version bump only for package @bitgo/utxo-lib





# [2.3.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.2...@bitgo/utxo-lib@2.3.0-rc.3) (2022-05-16)

**Note:** Version bump only for package @bitgo/utxo-lib





# [2.3.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.1...@bitgo/utxo-lib@2.3.0-rc.2) (2022-05-12)

**Note:** Version bump only for package @bitgo/utxo-lib





# Changelog

## Versioning

This is a forked version of bitcoinjs-lib `3.1.1` that also contains some changes from
later upstream bitcoinjs-lib versions up to `3.3.1`.

Version `1.0.0` of bitgo-utxo-lib is roughly equivalent of bitcoinjs-lib `3.3.1`. For the a changelog up to this point please refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/CHANGELOG.md#331

This document contains the Changelog starting with release 1.8.0

## 2.0.0 (2021-09-13)

* Rewrite `bitcoinjs-lib` to be a wrapper instead of a fork. Uses minimal fork of `bitcoinjs-lib@5.2.0` as a dependency and
re-exports most symbols verbatim. Altcoin support and some bitgo-specific methods are available at `utxolib.bitgo.*`.

## 1.9.0 (2020-01-16)

* fix(bufferutils): remove pushdata re-exports ([f48669e](https://github.com/BitGo/bitgo-utxo-lib/commit/f48669e))
* fix(bufferutils): remove varInt functions ([84851f0](https://github.com/BitGo/bitgo-utxo-lib/commit/84851f0))
* fix(networks): BIP32 constants for litecoin ([69d0244](https://github.com/BitGo/bitgo-utxo-lib/commit/69d0244)) 
* fix(test): use `--recursive` in coverage ([49b2a0e](https://github.com/BitGo/bitgo-utxo-lib/commit/49b2a0e))
* bitcoincash test: move to test/forks/bitcoincash ([d65a9bf](https://github.com/BitGo/bitgo-utxo-lib/commit/d65a9bf))
* feat(src/coins): add isSameCoin(Network, Network) ([e1dd2cb](https://github.com/BitGo/bitgo-utxo-lib/commit/e1dd2cb))
* Fix test/bitcoincash.test.js ([a6930c5](https://github.com/BitGo/bitgo-utxo-lib/commit/a6930c5))
* fix(src/networks.js): litecoinTest WIF prefix ([b08089a](https://github.com/BitGo/bitgo-utxo-lib/commit/b08089a))
* Replace CHANGELOG.md ([f7cbb0f](https://github.com/BitGo/bitgo-utxo-lib/commit/f7cbb0f))
* src/coins.js: add getMainnet/getTestnet ([8ddc032](https://github.com/BitGo/bitgo-utxo-lib/commit/8ddc032))
* src/coins.js: add isDash to isValidNetwork ([4827e8a](https://github.com/BitGo/bitgo-utxo-lib/commit/4827e8a))
* src/coins.js: isValidCoin -> isValidNetwork ([9556784](https://github.com/BitGo/bitgo-utxo-lib/commit/9556784))
* src/networks.js: add tests ([c9f367a](https://github.com/BitGo/bitgo-utxo-lib/commit/c9f367a))
* src/networks.js: define coin network names ([06f0b92](https://github.com/BitGo/bitgo-utxo-lib/commit/06f0b92))
* src/networks.js: fix references ([0ec6b0b](https://github.com/BitGo/bitgo-utxo-lib/commit/0ec6b0b))
* src/networks.js: reorder networks ([4e3c4ad](https://github.com/BitGo/bitgo-utxo-lib/commit/4e3c4ad))
* test/forks: rename tests ([67c0cb2](https://github.com/BitGo/bitgo-utxo-lib/commit/67c0cb2))
* Use standard naming scheme for test titles ([98c53f0](https://github.com/BitGo/bitgo-utxo-lib/commit/98c53f0))



## 1.8.0 (2020-01-09)

* Add src/bitgo/keyutil ([1bfd335](https://github.com/BitGo/bitgo-utxo-lib/commit/1bfd335))
* ECPair: simplify `fromPrivateKeyBuffer` ([288f662](https://github.com/BitGo/bitgo-utxo-lib/commit/288f662))
* ECPair: simplify `getPublicKeyBuffer` ([fdf2d22](https://github.com/BitGo/bitgo-utxo-lib/commit/fdf2d22))
* src/coins.js: add getMainnet/getTestnet ([8ddc032](https://github.com/BitGo/bitgo-utxo-lib/commit/8ddc032))
* src/coins.js: add isDash to isValidNetwork ([4827e8a](https://github.com/BitGo/bitgo-utxo-lib/commit/4827e8a))
* src/coins.js: isValidCoin -> isValidNetwork ([9556784](https://github.com/BitGo/bitgo-utxo-lib/commit/9556784))

### Deprecation Notice: ECPair functions

Commit ([1bfd335](https://github.com/BitGo/bitgo-utxo-lib/commit/1bfd335)) adds deprecation notices for two custom `ECPair` functions which are not present in upstream bitcoinjs-lib:

* `ECPair.fromPrivateKeyBuffer`: use `utxolib.bitgo.keyutil.privateKeyBufferToECPair` instead
* `ECPair.prototype.getPrivateKeyBuffer`: use `utxolib.bitgo.keyutil.privateKeyBufferFromECPair` instead

These methods will be removed in a future major version.
