# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.22.0...@bitgo/utxo-core@1.23.0) (2025-11-13)


### Features

* bump wasm-utxo to 1.3.0 ([d84e380](https://github.com/BitGo/BitGoJS/commit/d84e3808d1eb60d00ad03a29c34e27781ee8bf27))





# [1.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.21.3...@bitgo/utxo-core@1.22.0) (2025-11-12)


### Features

* replace wasm-miniscript with wasm-utxo package ([90dc886](https://github.com/BitGo/BitGoJS/commit/90dc8865a6154a5b42211c5610a5ee196cf0ca8e))





## [1.21.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.21.2...@bitgo/utxo-core@1.21.3) (2025-11-06)

**Note:** Version bump only for package @bitgo/utxo-core





## [1.21.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.21.1...@bitgo/utxo-core@1.21.2) (2025-10-24)

**Note:** Version bump only for package @bitgo/utxo-core





## [1.21.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.21.0...@bitgo/utxo-core@1.21.1) (2025-10-21)

**Note:** Version bump only for package @bitgo/utxo-core





# [1.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.20.4...@bitgo/utxo-core@1.21.0) (2025-10-16)


### Features

* **abstract-utxo:** use secp256k1 for bip32 operations ([b1ae0fc](https://github.com/BitGo/BitGoJS/commit/b1ae0fc7e52b83677e228a236b4f8e0844fd9b6f))





## [1.20.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.20.3...@bitgo/utxo-core@1.20.4) (2025-10-13)

**Note:** Version bump only for package @bitgo/utxo-core





## [1.20.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.20.2...@bitgo/utxo-core@1.20.3) (2025-10-09)


### Bug Fixes

* run check-fmt on code files only ([9745196](https://github.com/BitGo/BitGoJS/commit/9745196b02b9678c740d290a4638ceb153a8fd75))





## [1.20.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.20.1...@bitgo/utxo-core@1.20.2) (2025-10-08)

**Note:** Version bump only for package @bitgo/utxo-core





## [1.20.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.20.0...@bitgo/utxo-core@1.20.1) (2025-10-02)

**Note:** Version bump only for package @bitgo/utxo-core

# [1.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.19.0...@bitgo/utxo-core@1.20.0) (2025-09-25)

### Features

- configure learn to skip git operations ([ee3a622](https://github.com/BitGo/BitGoJS/commit/ee3a6220496476aa7f4545b5f4a9a3bf97d9bdb9))
- **sdk-coin-flrp:** added keypair and utils ([71846e7](https://github.com/BitGo/BitGoJS/commit/71846e7431af97736e1babe7dc0fc2953639192a))

# [1.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.18.0...@bitgo/utxo-core@1.19.0) (2025-09-03)

### Features

- **utxo-core:** add BIP322 signature verification ([f71aa51](https://github.com/BitGo/BitGoJS/commit/f71aa51edf0d90038f894a57f62fdeb44d2fbdb5))

# [1.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.17.0...@bitgo/utxo-core@1.18.0) (2025-08-27)

### Features

- **utxo-core:** add bip322 proof checker ([b898f78](https://github.com/BitGo/BitGoJS/commit/b898f78dbc3b0766a64dccbebc245942a2c33c37))
- **utxo-core:** explicitly set SIGHASH_ALL for BIP322 inputs ([b06eeb9](https://github.com/BitGo/BitGoJS/commit/b06eeb9d1a914f185ed93cf22be29e68ec821668))

# [1.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.16.1...@bitgo/utxo-core@1.17.0) (2025-08-22)

### Bug Fixes

- **utxo-core:** correct path name for fixtures ([7149d02](https://github.com/BitGo/BitGoJS/commit/7149d02ed61d5f42d533973825221749b8cf271a))

### Features

- **root:** migrate ts-node -> tsx ([ea180b4](https://github.com/BitGo/BitGoJS/commit/ea180b43001d8e956196bc07b32798e3a7031eeb))

## [1.16.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.16.0...@bitgo/utxo-core@1.16.1) (2025-08-19)

**Note:** Version bump only for package @bitgo/utxo-core

# [1.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.15.0...@bitgo/utxo-core@1.16.0) (2025-08-14)

### Features

- **utxo-core:** accept scriptId instead of chain and index params ([0257f73](https://github.com/BitGo/BitGoJS/commit/0257f73a3f1830a6a434ae7548838382919958e4))
- **utxo-core:** add bip32derivation fields to BIP322 message signing ([fd96317](https://github.com/BitGo/BitGoJS/commit/fd96317b5bf2e4c1b92bb8143df0fdbf9dc64d36))
- **utxo-core:** add support for taproot script types ([656ec5e](https://github.com/BitGo/BitGoJS/commit/656ec5efbec4a508e1d10b4b7155d395b374725c))
- **utxo-core:** implement function to extract BIP322 message by index ([2666645](https://github.com/BitGo/BitGoJS/commit/2666645a81a347b8774c970e9cdd6bb41a8c23af))
- **utxo-core:** use standard Psbt type for BIP322 functions ([b491a42](https://github.com/BitGo/BitGoJS/commit/b491a4258d7263b2c17c4dedf256d6e664dfd867))

# [1.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.14.0...@bitgo/utxo-core@1.15.0) (2025-08-07)

### Bug Fixes

- **utxo-core:** update toSignPsbt to properly set witnessUtxo ([c3c0bfa](https://github.com/BitGo/BitGoJS/commit/c3c0bfa5cc6322dee5e0c0c542899c179702766f))

### Features

- **utxo-core:** add BIP322 message tagged hash implementation ([364ad84](https://github.com/BitGo/BitGoJS/commit/364ad84f7a0b3ccda00b5ed9f5171c9bf684fee7))
- **utxo-core:** add buildToSpendTransactionFromChainAndIndex function ([093f4c8](https://github.com/BitGo/BitGoJS/commit/093f4c87fda1c1ee9756822e3a3ecea1ee3f6af4))
- **utxo-core:** add helper to build signing PSBT by chain and index ([496f98c](https://github.com/BitGo/BitGoJS/commit/496f98c7a222ed0a480cc91ce9247c0287020632))
- **utxo-core:** add utility function to check for taproot chain ([244fd8d](https://github.com/BitGo/BitGoJS/commit/244fd8dd197fd4af6eb13e8085ffc1dc5a141d54))
- **utxo-core:** add utility functions for PSBT message proofs ([f6d0d8b](https://github.com/BitGo/BitGoJS/commit/f6d0d8b3185e3808ad43b84ea6539ad7e0f43385))
- **utxo-core:** implement BIP322 to_spend transaction builder ([1d989a5](https://github.com/BitGo/BitGoJS/commit/1d989a57e50debf7d963bfc04b99d609acad0aeb))
- **utxo-core:** implement buildToSignPsbt for BIP322 message signing ([11993ae](https://github.com/BitGo/BitGoJS/commit/11993aed2da9b8052076da42928f9e0972b7405d))
- **utxo-core:** improve bip322 transaction handling ([16c29d1](https://github.com/BitGo/BitGoJS/commit/16c29d104fe83107f7b1eea845c6d3a36c5566de))
- **utxo-core:** simplify signature process with direct message param ([2641f25](https://github.com/BitGo/BitGoJS/commit/2641f250bb5ec7e8d0cbd12d146bc88d8a161df9))

# [1.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.12.1...@bitgo/utxo-core@1.14.0) (2025-07-25)

### Bug Fixes

- run test in /dist to avoid strip-only mode for node 24 ([868a01a](https://github.com/BitGo/BitGoJS/commit/868a01ab0a21fdf04fa352396c6a5cb825e01c36))
- **utxo-core:** improve property extraction in toPlainObject ([f0cad57](https://github.com/BitGo/BitGoJS/commit/f0cad5738c55dccc63d0618203dc8f96784fd0bf))

### Features

- **utxo-core:** implement pattern matcher for descriptor parsing ([9e528cc](https://github.com/BitGo/BitGoJS/commit/9e528cc79efcf519b98e3757f4164443f0e08821))

# [1.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.12.1...@bitgo/utxo-core@1.13.0) (2025-07-23)

### Bug Fixes

- **utxo-core:** improve property extraction in toPlainObject ([f0cad57](https://github.com/BitGo/BitGoJS/commit/f0cad5738c55dccc63d0618203dc8f96784fd0bf))

### Features

- **utxo-core:** implement pattern matcher for descriptor parsing ([9e528cc](https://github.com/BitGo/BitGoJS/commit/9e528cc79efcf519b98e3757f4164443f0e08821))

## [1.12.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.12.0...@bitgo/utxo-core@1.12.1) (2025-07-15)

**Note:** Version bump only for package @bitgo/utxo-core

# [1.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.11.0...@bitgo/utxo-core@1.12.0) (2025-07-10)

### Features

- **utxo-core:** add selectTapLeafScript option to createPsbt ([b8ecac2](https://github.com/BitGo/BitGoJS/commit/b8ecac2cd5df48e6c773935e9dc6f20b9a33673c))
- **utxo-core:** allow Buffer message type in signMessage/verifyMessage ([3c35f37](https://github.com/BitGo/BitGoJS/commit/3c35f37a539e59f9a6959414042dfb717fd93d5a))
- **utxo-core:** remove lodash dependency ([b07644c](https://github.com/BitGo/BitGoJS/commit/b07644c99924a2ce64fbd052994fb647b3fdcca4))
- **utxo-core:** replace lodash type checks with native JavaScript ([2265a49](https://github.com/BitGo/BitGoJS/commit/2265a499304c88fc605eb54d5d96971547a9e50e))
- **utxo-core:** replace should.js with assert in bip32utils test ([62776df](https://github.com/BitGo/BitGoJS/commit/62776df6ae6c638f70c08c458f5faa6cab5ca98e))

# [1.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.10.0...@bitgo/utxo-core@1.11.0) (2025-06-24)

### Features

- **utxo-core:** extractMsgBufferFromPayGoAttestationProof refactor ([b9d2a45](https://github.com/BitGo/BitGoJS/commit/b9d2a453e162cf529a042bf00e16d593a00e6556))

# [1.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.9.1...@bitgo/utxo-core@1.10.0) (2025-06-18)

### Features

- **utxo-core:** export fromFixedScriptWallet ([2af49d9](https://github.com/BitGo/BitGoJS/commit/2af49d97fcccf39ab6f24234bc8872ef15b2a26e))
- **utxo-core:** improve fromFixedScriptWallet descriptor handling ([3f9ab49](https://github.com/BitGo/BitGoJS/commit/3f9ab499f0f33bb457b0abb31c6484dbeaf7efb6))

## [1.9.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.9.0...@bitgo/utxo-core@1.9.1) (2025-06-10)

**Note:** Version bump only for package @bitgo/utxo-core

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.8.0...@bitgo/utxo-core@1.9.0) (2025-06-05)

### Features

- **utxo-core:** add descriptor support for fixed script wallets ([090bac5](https://github.com/BitGo/BitGoJS/commit/090bac5797961ec963438e17220885211eaa8f07))

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.7.0...@bitgo/utxo-core@1.8.0) (2025-04-15)

### Features

- **utxo-core:** add PSBT signing utilities ([d46fecf](https://github.com/BitGo/BitGoJS/commit/d46fecfcd6a435951162cdfcd8dd12efb2fbed35))
- **utxo-core:** extract TestParams type for cleaner PSBT tests ([e83ece1](https://github.com/BitGo/BitGoJS/commit/e83ece12310635f6473c4f27f3af959b3b6d137e))
- **utxo-core:** support custom input sequence in transaction creation ([89fad6b](https://github.com/BitGo/BitGoJS/commit/89fad6bb233689d4ca32eb0f33ef5b2df0597f6d))

# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.6.0...@bitgo/utxo-core@1.7.0) (2025-04-04)

### Features

- **utxo-core:** export derive from descriptor index ([87270df](https://github.com/BitGo/BitGoJS/commit/87270df9b44fab48fe05b602cd0595a6200ed75b))

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.5.0...@bitgo/utxo-core@1.6.0) (2025-03-28)

### Features

- **utxo-core:** add toXOnlyPublicKey utility function ([bc527b5](https://github.com/BitGo/BitGoJS/commit/bc527b5d8169453e8438c839acb5c20f1ab124cf))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.2.0...@bitgo/utxo-core@1.5.0) (2025-03-04)

### Bug Fixes

- **utxo-core:** identify internal/external output correctly ([45a1b29](https://github.com/BitGo/BitGoJS/commit/45a1b296bd7e8b79ad38a79bd4e00a0eaa1bf2e3))
- **utxo-lib:** fix psbt clone to preserve network and class type ([d5c4e52](https://github.com/BitGo/BitGoJS/commit/d5c4e5236662441322a974b9aa706a2d31b6b2c3))

### Features

- **utxo-core:** add BIP65 CLTV locktime encoding functions ([f3ace39](https://github.com/BitGo/BitGoJS/commit/f3ace391ca2f1169b0f57fdb4e927aabd8cb970f))
- **utxo-core:** add dust threshold calculations for UTXO coins ([f1b5c2d](https://github.com/BitGo/BitGoJS/commit/f1b5c2db131f558d806c5e0ccb48a9250a1d5a28))
- **utxo-core:** add output utilities for transaction building ([678906f](https://github.com/BitGo/BitGoJS/commit/678906fe9ee15db40fa83473572a524ac0f438d9))
- **utxo-core:** add PSBT virtual size estimation ([bf51d1d](https://github.com/BitGo/BitGoJS/commit/bf51d1d8412a1e64fceca1a4ca523a0371a8cddf))
- **utxo-core:** add support for descriptors with plain keys ([52616ac](https://github.com/BitGo/BitGoJS/commit/52616acf94b189732ad8ae9ae89b91637ada1545))
- **utxo-core:** add taproot 1-of-3 descriptor template ([b394636](https://github.com/BitGo/BitGoJS/commit/b3946364a16ab461b5ada77d4c7576a381b1171e))
- **utxo-core:** add VirtualSize export ([a80b121](https://github.com/BitGo/BitGoJS/commit/a80b121e7d9aed446e7dcc216411ffc76c634a75))
- **utxo-core:** auto-detect descriptor type from string ([1dc56bb](https://github.com/BitGo/BitGoJS/commit/1dc56bb831721ff93e89d9ec096b1de04de94047))
- **utxo-core:** export dustThreshold utils ([4ab3d9d](https://github.com/BitGo/BitGoJS/commit/4ab3d9de7f8750e54197e6deef4f95950fc868fc))
- **utxo-core:** simplify module exports ([ea7cd0f](https://github.com/BitGo/BitGoJS/commit/ea7cd0f90977894c25fc0734386b9e8d27465fd5))
- **utxo-core:** use wrapped psbt for test stages ([0133ac9](https://github.com/BitGo/BitGoJS/commit/0133ac9f3c64a6c8f7c8fbd905ac182267ff12cc))

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.2.0...@bitgo/utxo-core@1.4.0) (2025-02-26)

### Bug Fixes

- **utxo-lib:** fix psbt clone to preserve network and class type ([d5c4e52](https://github.com/BitGo/BitGoJS/commit/d5c4e5236662441322a974b9aa706a2d31b6b2c3))

### Features

- **utxo-core:** add output utilities for transaction building ([678906f](https://github.com/BitGo/BitGoJS/commit/678906fe9ee15db40fa83473572a524ac0f438d9))
- **utxo-core:** add taproot 1-of-3 descriptor template ([b394636](https://github.com/BitGo/BitGoJS/commit/b3946364a16ab461b5ada77d4c7576a381b1171e))
- **utxo-core:** use wrapped psbt for test stages ([0133ac9](https://github.com/BitGo/BitGoJS/commit/0133ac9f3c64a6c8f7c8fbd905ac182267ff12cc))

# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-core@1.2.0...@bitgo/utxo-core@1.3.0) (2025-02-20)

### Features

- **utxo-core:** add output utilities for transaction building ([678906f](https://github.com/BitGo/BitGoJS/commit/678906fe9ee15db40fa83473572a524ac0f438d9))

# 1.2.0 (2025-02-19)

### Features

- **abstract-utxo:** remove script hash wrapper from coredao stake ([c5ebf47](https://github.com/BitGo/BitGoJS/commit/c5ebf478ad9864b5c903698a27612407abcbe443))
- **utxo-core:** add new module for UTXO types and functions ([7046b8a](https://github.com/BitGo/BitGoJS/commit/7046b8a53d6b56982d4813fae620eb4b03bbd208))
- **utxo-core:** add txt encoding support for test fixtures ([8ce5aa8](https://github.com/BitGo/BitGoJS/commit/8ce5aa8a176c94d9f3fbc8c3bb4ea54ff92ccd1e))
- **utxo-core:** update descriptor test util to use AST types ([d29e0dc](https://github.com/BitGo/BitGoJS/commit/d29e0dcb09352f2ba9910d224ac3ac9c92cc9e81))

# 1.1.0 (2025-02-11)

### Features

- **utxo-core:** add new module for UTXO types and functions ([7046b8a](https://github.com/BitGo/BitGoJS/commit/7046b8a53d6b56982d4813fae620eb4b03bbd208))
