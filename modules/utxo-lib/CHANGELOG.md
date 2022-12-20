# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [7.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.0.0...@bitgo/utxo-lib@7.1.0) (2022-12-06)

### Bug Fixes

- **utxo-lib:** hit correct function in zec psbt setup ([05ff530](https://github.com/BitGo/BitGoJS/commit/05ff530d80a1fff51e5c1aae6afc011702c03d59))
- **utxo-lib:** use network byte order for ZEC consensusBranchId ([221cb06](https://github.com/BitGo/BitGoJS/commit/221cb0611a6f0269a83dc8805dc00f611f8b8f0a))
- **utxo-lib:** ZEC PSBT version defaults ([29a2c82](https://github.com/BitGo/BitGoJS/commit/29a2c8206865ae6db4521b7c23add3ec58ae45db))

### Features

- **utxo-lib:** add psbt getSignatureValidationArray function ([480f743](https://github.com/BitGo/BitGoJS/commit/480f74337e931edc76f158dce5fd6b0431a399f7))

# [7.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@7.0.0) (2022-11-29)

### Bug Fixes

- add test paths to tsconfig.json ([68cd7e8](https://github.com/BitGo/BitGoJS/commit/68cd7e8119914fe4a78ab1f5def5490f7a493118))
- **utxo-bin:** change signature of `getNetworkName()` ([6e673c6](https://github.com/BitGo/BitGoJS/commit/6e673c60548a784cc71bdecf487249b441c1d5ea))
- **utxo-lib:** bump bitcoinjs-lib for PSBT fix ([633df05](https://github.com/BitGo/BitGoJS/commit/633df05eec6beed4b2e9ee271d3609261f816c97))
- **utxo-lib:** fix testFixtureArray ([83109e4](https://github.com/BitGo/BitGoJS/commit/83109e406320ffe771c4ba662f010422f7df8387))
- **utxo-lib:** sanitize signer.pubkey in signTaprootInput ([3ddc36c](https://github.com/BitGo/BitGoJS/commit/3ddc36c2a1b7f4070157811f218d3f82517c06fc))
- **utxo-lib:** update links in network docs ([ea47851](https://github.com/BitGo/BitGoJS/commit/ea47851142b1a511aeded55943db59090b34ea8d))

### Code Refactoring

- rename addChangeOutputToPsbt to addWalletOutputToPsbt, move ([189a129](https://github.com/BitGo/BitGoJS/commit/189a1294a947964336b7694832bd0bb5edd1752a))
- tweak names of some Unspent types ([8a43518](https://github.com/BitGo/BitGoJS/commit/8a4351897089c74caab440aa3633ab933a28a245))
- **utxo-lib:** deprecate p2pkh parsing ([21bc364](https://github.com/BitGo/BitGoJS/commit/21bc36453df30f09af66e4d8d6fa5b44a185d454))
- **utxo-lib:** remove unused props from ParsedSignatureScript ([ddc6ab7](https://github.com/BitGo/BitGoJS/commit/ddc6ab7e5c4fc7f12175d850f4ebd68d54cd509b))
- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt ([c271386](https://github.com/BitGo/BitGoJS/commit/c27138602636b563b5fa2f2d4dc710a09a597288))

### Features

- **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
- **utxo-lib:** add `getTapleafHash` method to outputScripts.ts ([cc283ca](https://github.com/BitGo/BitGoJS/commit/cc283ca54b7de260c3e9c74c5daf07cc89eefaee))
- **utxo-lib:** add method `getSignaturesWithPublicKeys` ([2e53327](https://github.com/BitGo/BitGoJS/commit/2e53327ed4f23f28840782b39e5e3f1d76a345b0))
- **utxo-lib:** add method hasWitnessData(scriptType) ([db7f5d2](https://github.com/BitGo/BitGoJS/commit/db7f5d270e47f153347569a66d4ca5bd4c5e2f88))
- **utxo-lib:** add methods fromOutput, fromOutputWithPrevTx ([77d90e2](https://github.com/BitGo/BitGoJS/commit/77d90e2ea8991a0216c52467d387fb1e4e6b642e))
- **utxo-lib:** add more precise capture groups ([dd93180](https://github.com/BitGo/BitGoJS/commit/dd93180396deb72dcccf38b08736d30ca75590ae))
- **utxo-lib:** add replay protection unspent tests to WalletUnspent ([cbcaf76](https://github.com/BitGo/BitGoJS/commit/cbcaf7605d3f505906d604dd00acbaa61f8563cc))
- **utxo-lib:** add replay protection unspent utils to wallet/util.ts ([b1188c3](https://github.com/BitGo/BitGoJS/commit/b1188c3247fe72ee679398ec0dd593793c4f7185))
- **utxo-lib:** add test for Psbt full signing ([56a767e](https://github.com/BitGo/BitGoJS/commit/56a767eb679d872338e1fbd3b3d21f552c7751e3))
- **utxo-lib:** add tests for getInputUpdate ([a0c3efc](https://github.com/BitGo/BitGoJS/commit/a0c3efc735fb475bc9b85153807e6eb2e9d73d24))
- **utxo-lib:** allow passing `prevTx` in getInputUpdate ([b1c91bc](https://github.com/BitGo/BitGoJS/commit/b1c91bcda40e4a8caed8302ff0206d3dfce85f9f))
- **utxo-lib:** allow passing `prevTx` in getPrevOutput(s) ([8df4fb6](https://github.com/BitGo/BitGoJS/commit/8df4fb65953080f01c01c6d5e045a7bce46f7b7d))
- **utxo-lib:** compute getTapleafHash only once per signature ([571241a](https://github.com/BitGo/BitGoJS/commit/571241a8104b61588ef5c2fcb25763776655dff6))
- **utxo-lib:** parse leafVersion in parseInput.ts ([854d7fc](https://github.com/BitGo/BitGoJS/commit/854d7fcc6010a784e12a952e9b4fbe9c4b9942cc))
- **utxo-lib:** parse pubkey and signature in parseP2PK ([8dc189a](https://github.com/BitGo/BitGoJS/commit/8dc189a5da5541b0860f81c2071f1f7013b4ba7a))
- **utxo-lib:** parse redeemScript, witnessScritpt ([793689d](https://github.com/BitGo/BitGoJS/commit/793689d5f16f7ae64dc7be6a8370d9764b1240a3))
- **utxo-lib:** remove dependency on `classify` in parseSignatureScript ([460ce6a](https://github.com/BitGo/BitGoJS/commit/460ce6aa2a2b9b5958910076007546807efc23c2))
- **utxo-lib:** test getInputUpdate for unsigned tx ([dbfd08a](https://github.com/BitGo/BitGoJS/commit/dbfd08a64f44a9ddd3da314068f81e6d3087cd94))
- **utxo-lib:** use MatchError instead of `undefined` in parseInput ([ac699ea](https://github.com/BitGo/BitGoJS/commit/ac699eaaa8803b549f8224d40b1d17072be168f1))

### BREAKING CHANGES

- **utxo-lib:** remove some properties of ParsedSignatureScript
  Issue: BG-57748
- **utxo-lib:** deprecate p2pkh parsing
- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt
- addChangeOutputToPsbt renamed to addWalletOutputToPsbt
- function and type rename

# [6.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@6.0.0) (2022-11-04)

### Bug Fixes

- add test paths to tsconfig.json ([68cd7e8](https://github.com/BitGo/BitGoJS/commit/68cd7e8119914fe4a78ab1f5def5490f7a493118))
- **utxo-bin:** change signature of `getNetworkName()` ([6e673c6](https://github.com/BitGo/BitGoJS/commit/6e673c60548a784cc71bdecf487249b441c1d5ea))
- **utxo-lib:** fix testFixtureArray ([83109e4](https://github.com/BitGo/BitGoJS/commit/83109e406320ffe771c4ba662f010422f7df8387))
- **utxo-lib:** update links in network docs ([ea47851](https://github.com/BitGo/BitGoJS/commit/ea47851142b1a511aeded55943db59090b34ea8d))

### Code Refactoring

- rename addChangeOutputToPsbt to addWalletOutputToPsbt, move ([189a129](https://github.com/BitGo/BitGoJS/commit/189a1294a947964336b7694832bd0bb5edd1752a))
- tweak names of some Unspent types ([8a43518](https://github.com/BitGo/BitGoJS/commit/8a4351897089c74caab440aa3633ab933a28a245))
- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt ([c271386](https://github.com/BitGo/BitGoJS/commit/c27138602636b563b5fa2f2d4dc710a09a597288))

### Features

- **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
- **utxo-lib:** add methods fromOutput, fromOutputWithPrevTx ([77d90e2](https://github.com/BitGo/BitGoJS/commit/77d90e2ea8991a0216c52467d387fb1e4e6b642e))
- **utxo-lib:** add replay protection unspent tests to WalletUnspent ([cbcaf76](https://github.com/BitGo/BitGoJS/commit/cbcaf7605d3f505906d604dd00acbaa61f8563cc))
- **utxo-lib:** add replay protection unspent utils to wallet/util.ts ([b1188c3](https://github.com/BitGo/BitGoJS/commit/b1188c3247fe72ee679398ec0dd593793c4f7185))

### BREAKING CHANGES

- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt
- addChangeOutputToPsbt renamed to addWalletOutputToPsbt
- function and type rename

# [4.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@4.0.0) (2022-10-27)

### Code Refactoring

- tweak names of some Unspent types ([8a43518](https://github.com/BitGo/BitGoJS/commit/8a4351897089c74caab440aa3633ab933a28a245))

### BREAKING CHANGES

- function and type rename

## [3.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@3.2.1) (2022-10-25)

**Note:** Version bump only for package @bitgo/utxo-lib

# [3.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.11...@bitgo/utxo-lib@3.2.0) (2022-10-18)

### Bug Fixes

- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
- format imported files ([2ba3302](https://github.com/BitGo/BitGoJS/commit/2ba330275e2149fce0e01f5fbc61592bca7453e3))
- remove references to bitcoinjs.Network ([84c7fd9](https://github.com/BitGo/BitGoJS/commit/84c7fd9bccd71b2f7429690481dc3104d2ae0928))
- **utxo-lib:** [dash] fix fromBuffer tx type ([7469ad0](https://github.com/BitGo/BitGoJS/commit/7469ad04fdacd4064262139757974970ee9fc614))
- **utxo-lib:** [psbt] always set witness utxo ([0104b02](https://github.com/BitGo/BitGoJS/commit/0104b0286b3f74ee3adbd802b22a1b416789343e))
- **utxo-lib:** [psbt] reduce use of hackish `this.tx` ([60e2289](https://github.com/BitGo/BitGoJS/commit/60e2289b2fe91065caf9ee80604053759231c380))
- **utxo-lib:** accept psbtopts when creating a PSBT ([bb6774a](https://github.com/BitGo/BitGoJS/commit/bb6774afbcba28374136020d041f6275fe49c4f7))
- **utxo-lib:** add TODO ([805074c](https://github.com/BitGo/BitGoJS/commit/805074c21b034d542ec952890b0136db536995a1))
- **utxo-lib:** clone witness array when cloning tx ([eecfbd7](https://github.com/BitGo/BitGoJS/commit/eecfbd7b4a4a084a75ca6f5ce7db9e1e2b38263e))
- **utxo-lib:** create PSBTs with proper inner TX class ([0c537e1](https://github.com/BitGo/BitGoJS/commit/0c537e1825642feeee09b28f6929400721fa4229))
- **utxo-lib:** export {Dash,Zcash}Psbt ([c47046e](https://github.com/BitGo/BitGoJS/commit/c47046efdfa82d319b29e4fa20e5a92737268739))
- **utxo-lib:** export UtxoPsbt ([b943679](https://github.com/BitGo/BitGoJS/commit/b94367942b1ded663dffd4f4b85a159c4db54469))
- **utxo-lib:** fix lint ([24bcf05](https://github.com/BitGo/BitGoJS/commit/24bcf05b1c6502c4788f6c95b6f63c096df09898))
- **utxo-lib:** import describe/it from `parse.ts` ([5aba693](https://github.com/BitGo/BitGoJS/commit/5aba693b078faa33cd2b525fbd0c44701e771df8))
- **utxo-lib:** include all bip32 derivations for non-taproot ([ef76bf3](https://github.com/BitGo/BitGoJS/commit/ef76bf3fac1f65adfe4f7c75893d8576203371db))
- **utxo-lib:** move getValueScaled->test + rename ([c605480](https://github.com/BitGo/BitGoJS/commit/c6054802cf44096546f7e44138d7bd540b409d66))
- **utxo-lib:** pin noble-secp256k1 ([92727bf](https://github.com/BitGo/BitGoJS/commit/92727bf173aee1437f03af542ecd4e8a153a8841))
- **utxo-lib:** remove unnecessary asyncs ([a4306ed](https://github.com/BitGo/BitGoJS/commit/a4306eddcee80ff33c735b5f259506252df8bd41))
- **utxo-lib:** tx/tx builder improvements ([0a4545a](https://github.com/BitGo/BitGoJS/commit/0a4545a0889cda154bc0ee017f479278da32cb72))
- **utxo-lib:** use BitGo published ecpair dep ([02b3c31](https://github.com/BitGo/BitGoJS/commit/02b3c31c605986ab915e88984de92630b1cd4ab7))
- **utxo-lib:** use published bitcoinjs-lib ([f9a625c](https://github.com/BitGo/BitGoJS/commit/f9a625c8ec6996813356f5edcebe1e78fe4a38f4))
- **utxo-lib:** use safe version of bitcoinjs-lib ([8f2226b](https://github.com/BitGo/BitGoJS/commit/8f2226b6276fe47413759bf7462b8429d9e69f90))

### Features

- import transaction_builder, classify, etc. ([e08776e](https://github.com/BitGo/BitGoJS/commit/e08776ea8e20b50d879bf25909db31b0451bb029))
- update to work with bitcoinjs-lib@6 ([1950934](https://github.com/BitGo/BitGoJS/commit/1950934d9426385ee12b204cc7456327e4480618))
- **utxo-lib:** [psbt] separate adding input and nonWitnessUtxo ([b16855c](https://github.com/BitGo/BitGoJS/commit/b16855ce76576cdbd973083dfc817926b41ad64e))
- **utxo-lib:** Add Dash/Zcash PSBT ([990de06](https://github.com/BitGo/BitGoJS/commit/990de06a7b1f666d2cb00e2d9205c3dc8e6bced8))
- **utxo-lib:** add maximumFeeRate for PsbtOpts ([367f72c](https://github.com/BitGo/BitGoJS/commit/367f72cb6017861fdd1a141062fb973d1e7528bb))
- **utxo-lib:** add PSBT creation funcs like txbuilder ([80880a0](https://github.com/BitGo/BitGoJS/commit/80880a0469e013586e2e35b1836670c848ca8734))
- **utxo-lib:** add PSBT from transaction ([65cc050](https://github.com/BitGo/BitGoJS/commit/65cc050adbd0507c6214baa2fd2b5076b2889007))
- **utxo-lib:** add round-trip test with high-precision values ([9c2bb77](https://github.com/BitGo/BitGoJS/commit/9c2bb7785656c2c22fb23e6c3516b9b351145744))
- **utxo-lib:** add UtxoPsbt w/BitGO P2TR signing ([1f35902](https://github.com/BitGo/BitGoJS/commit/1f35902fa6348da6b0d9dc70fc1367f3119181ef))
- **utxo-lib:** addChangeOutputToPsbt ([88e37c9](https://github.com/BitGo/BitGoJS/commit/88e37c90cc1327b70a007a20db79ac2de7c9f6c8))
- **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))
- **utxo-lib:** export ECPairAPI, BIP32API ([8f960fd](https://github.com/BitGo/BitGoJS/commit/8f960fd0adc61392ad7f40e4970e069267cd6f98))
- **utxo-lib:** full 64 bit support w/ bigints ([3186934](https://github.com/BitGo/BitGoJS/commit/3186934f8af3a3d50d3b8890446008e7bee06d90))
- **utxo-lib:** return unsigned tx ([6174bd3](https://github.com/BitGo/BitGoJS/commit/6174bd33cdda0f4b9fb84ec6c961f3deb6b51f63))
- **utxo-lib:** set default version for zcash and dash ([dc5015a](https://github.com/BitGo/BitGoJS/commit/dc5015aa0dc3b283e9afef68a113fd26036d96db))
- **utxo-lib:** store consensus branch id on psbt for zcash ([e078cf3](https://github.com/BitGo/BitGoJS/commit/e078cf3227abaa1919c677474debd46fea782fa2))

### BREAKING CHANGES

- **utxo-lib:** UtxoTransaction.fromBuffer interface - new optional param `amountType` inserted
  BG-54862

## [2.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.11...@bitgo/utxo-lib@2.4.1) (2022-07-19)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.10...@bitgo/utxo-lib@2.3.0-rc.11) (2022-07-11)

### Features

- **utxo-lib:** add network configuration for DOGE ([442e7e9](https://github.com/BitGo/BitGoJS/commit/442e7e9df3acd00edde3a0512de363164a377bb5))

# [2.3.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.9...@bitgo/utxo-lib@2.3.0-rc.10) (2022-06-23)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.8...@bitgo/utxo-lib@2.3.0-rc.9) (2022-06-22)

### Bug Fixes

- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))

# [2.3.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.7...@bitgo/utxo-lib@2.3.0-rc.8) (2022-06-16)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.6...@bitgo/utxo-lib@2.3.0-rc.7) (2022-06-13)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.5...@bitgo/utxo-lib@2.3.0-rc.6) (2022-06-07)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.4...@bitgo/utxo-lib@2.3.0-rc.5) (2022-06-01)

### Bug Fixes

- **utxo-lib:** always use VERSION4_BRANCH_NU5 for zcash ([ef0692c](https://github.com/BitGo/BitGoJS/commit/ef0692c6772f6d21fce3da6cc515dc74915c3c6d))

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

- Rewrite `bitcoinjs-lib` to be a wrapper instead of a fork. Uses minimal fork of `bitcoinjs-lib@5.2.0` as a dependency and
  re-exports most symbols verbatim. Altcoin support and some bitgo-specific methods are available at `utxolib.bitgo.*`.

## 1.9.0 (2020-01-16)

- fix(bufferutils): remove pushdata re-exports ([f48669e](https://github.com/BitGo/bitgo-utxo-lib/commit/f48669e))
- fix(bufferutils): remove varInt functions ([84851f0](https://github.com/BitGo/bitgo-utxo-lib/commit/84851f0))
- fix(networks): BIP32 constants for litecoin ([69d0244](https://github.com/BitGo/bitgo-utxo-lib/commit/69d0244))
- fix(test): use `--recursive` in coverage ([49b2a0e](https://github.com/BitGo/bitgo-utxo-lib/commit/49b2a0e))
- bitcoincash test: move to test/forks/bitcoincash ([d65a9bf](https://github.com/BitGo/bitgo-utxo-lib/commit/d65a9bf))
- feat(src/coins): add isSameCoin(Network, Network) ([e1dd2cb](https://github.com/BitGo/bitgo-utxo-lib/commit/e1dd2cb))
- Fix test/bitcoincash.test.js ([a6930c5](https://github.com/BitGo/bitgo-utxo-lib/commit/a6930c5))
- fix(src/networks.js): litecoinTest WIF prefix ([b08089a](https://github.com/BitGo/bitgo-utxo-lib/commit/b08089a))
- Replace CHANGELOG.md ([f7cbb0f](https://github.com/BitGo/bitgo-utxo-lib/commit/f7cbb0f))
- src/coins.js: add getMainnet/getTestnet ([8ddc032](https://github.com/BitGo/bitgo-utxo-lib/commit/8ddc032))
- src/coins.js: add isDash to isValidNetwork ([4827e8a](https://github.com/BitGo/bitgo-utxo-lib/commit/4827e8a))
- src/coins.js: isValidCoin -> isValidNetwork ([9556784](https://github.com/BitGo/bitgo-utxo-lib/commit/9556784))
- src/networks.js: add tests ([c9f367a](https://github.com/BitGo/bitgo-utxo-lib/commit/c9f367a))
- src/networks.js: define coin network names ([06f0b92](https://github.com/BitGo/bitgo-utxo-lib/commit/06f0b92))
- src/networks.js: fix references ([0ec6b0b](https://github.com/BitGo/bitgo-utxo-lib/commit/0ec6b0b))
- src/networks.js: reorder networks ([4e3c4ad](https://github.com/BitGo/bitgo-utxo-lib/commit/4e3c4ad))
- test/forks: rename tests ([67c0cb2](https://github.com/BitGo/bitgo-utxo-lib/commit/67c0cb2))
- Use standard naming scheme for test titles ([98c53f0](https://github.com/BitGo/bitgo-utxo-lib/commit/98c53f0))

## 1.8.0 (2020-01-09)

- Add src/bitgo/keyutil ([1bfd335](https://github.com/BitGo/bitgo-utxo-lib/commit/1bfd335))
- ECPair: simplify `fromPrivateKeyBuffer` ([288f662](https://github.com/BitGo/bitgo-utxo-lib/commit/288f662))
- ECPair: simplify `getPublicKeyBuffer` ([fdf2d22](https://github.com/BitGo/bitgo-utxo-lib/commit/fdf2d22))
- src/coins.js: add getMainnet/getTestnet ([8ddc032](https://github.com/BitGo/bitgo-utxo-lib/commit/8ddc032))
- src/coins.js: add isDash to isValidNetwork ([4827e8a](https://github.com/BitGo/bitgo-utxo-lib/commit/4827e8a))
- src/coins.js: isValidCoin -> isValidNetwork ([9556784](https://github.com/BitGo/bitgo-utxo-lib/commit/9556784))

### Deprecation Notice: ECPair functions

Commit ([1bfd335](https://github.com/BitGo/bitgo-utxo-lib/commit/1bfd335)) adds deprecation notices for two custom `ECPair` functions which are not present in upstream bitcoinjs-lib:

- `ECPair.fromPrivateKeyBuffer`: use `utxolib.bitgo.keyutil.privateKeyBufferToECPair` instead
- `ECPair.prototype.getPrivateKeyBuffer`: use `utxolib.bitgo.keyutil.privateKeyBufferFromECPair` instead

These methods will be removed in a future major version.
