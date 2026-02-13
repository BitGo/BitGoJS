# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [10.18.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.18.0...@bitgo/abstract-utxo@10.18.1) (2026-02-13)

**Note:** Version bump only for package @bitgo/abstract-utxo





# [10.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.17.0...@bitgo/abstract-utxo@10.18.0) (2026-02-12)


### Bug Fixes

* **abstract-utxo:** update BIP322 test to verify wasm-utxo respects sighashType ([b721908](https://github.com/BitGo/BitGoJS/commit/b7219080087e7f65921f9416f14ea499fc6311cd))


### Features

* **abstract-utxo:** add signTransaction tests ([352beb8](https://github.com/BitGo/BitGoJS/commit/352beb887b1a2c7b0357454036e3c4c54f9eb4db))
* **abstract-utxo:** always use wasm-utxo backend for recovery ([88e3135](https://github.com/BitGo/BitGoJS/commit/88e3135bdb7546c75320c079ddf3af24720624aa))
* **abstract-utxo:** bump wasm-utxo to 1.32.0 ([6621f86](https://github.com/BitGo/BitGoJS/commit/6621f86777c1b3e7d803f657179aad5939e2abc6))
* **abstract-utxo:** bump wasm-utxo to 1.34.0 ([3067511](https://github.com/BitGo/BitGoJS/commit/30675114fb1380c5d08dd339a4233b04a32a06f7))
* **abstract-utxo:** default to wasm-utxo on testnet ([15b50c8](https://github.com/BitGo/BitGoJS/commit/15b50c89a18d7d1d48eafec2587c7fe077cc5089))
* **abstract-utxo:** export UtxoCoinName types and type guards ([bb8bf45](https://github.com/BitGo/BitGoJS/commit/bb8bf45c3cc134fda2ef64a4971102b7caee151a))
* **abstract-utxo:** improve Litecoin address conversion for cross-chain recovery ([2e2335d](https://github.com/BitGo/BitGoJS/commit/2e2335d64ba77f20f2a80b7fb9bb2502fabf4439))
* **abstract-utxo:** inline unspent type definitions ([83cfd4b](https://github.com/BitGo/BitGoJS/commit/83cfd4bd201b91657293c54c0ebec717d495adf7))
* **abstract-utxo:** make pubs parameter required for custom signing function ([945a272](https://github.com/BitGo/BitGoJS/commit/945a2722c53dcd9032fed6acf449911e4d3ba074))
* **abstract-utxo:** optimize test suite with min coin selection ([a7228c5](https://github.com/BitGo/BitGoJS/commit/a7228c56947f595cd35a95a982134f7d61593a08))
* **abstract-utxo:** refactor backup key recovery ([bba10c3](https://github.com/BitGo/BitGoJS/commit/bba10c3a11a3259848c225cfbff6e20351e27e64))
* **abstract-utxo:** remove unspents dependency ([92d3e52](https://github.com/BitGo/BitGoJS/commit/92d3e52fa32625ed1aee31ceaff30855f08e566d))
* **abstract-utxo:** remove unused addressType param ([ffb0e61](https://github.com/BitGo/BitGoJS/commit/ffb0e618fdb15a25db6a56f0dde31616a0dac5eb))
* **abstract-utxo:** replace utxo-lib with wasm-utxo in tests ([68861ee](https://github.com/BitGo/BitGoJS/commit/68861ee5ce83aabc8bca0a70f0b05270418a9023))
* **abstract-utxo:** simplify BIP322 message verification ([0fbc202](https://github.com/BitGo/BitGoJS/commit/0fbc2023f21dedb270e4e479c826ff706409df76))
* **abstract-utxo:** simplify mock recovery provider ([fb8feb7](https://github.com/BitGo/BitGoJS/commit/fb8feb7157715e2cf9e10831d4693774d2c422a4))
* **abstract-utxo:** simplify test script configuration ([4c68dbf](https://github.com/BitGo/BitGoJS/commit/4c68dbf90d6b272cbb0552d55ca053a70e1e5365))
* **abstract-utxo:** switch to using wasm-utxo primitives ([473b076](https://github.com/BitGo/BitGoJS/commit/473b0760a69477f0463adf828dd6f7831db81152))
* **abstract-utxo:** update check-fmt command path pattern ([8eedc51](https://github.com/BitGo/BitGoJS/commit/8eedc51febd6a630d4c2d401aeefb56f7f2bb868))
* **abstract-utxo:** upgrade wasm-utxo to version 1.36.0 ([2f60e92](https://github.com/BitGo/BitGoJS/commit/2f60e9230d6243a2b62323b0129b3c64d08d0b2c))
* **abstract-utxo:** use correct script hash for testnet LTC addresses ([c908b56](https://github.com/BitGo/BitGoJS/commit/c908b5661cb620d6a1831d5d587dd036ecb860ea))
* **abstract-utxo:** use PSBT getHalfSignedLegacyFormat method ([a326192](https://github.com/BitGo/BitGoJS/commit/a326192983287dab29ee462c8aa44e43f5c727e0))
* **abstract-utxo:** use wasm-utxo for backup key recovery ([b14a369](https://github.com/BitGo/BitGoJS/commit/b14a3693e1885b6bb9af151d6979f56f5a0ad77c))
* **abstract-utxo:** use wasm-utxo for CCR utility functions ([0006da4](https://github.com/BitGo/BitGoJS/commit/0006da4e79c07393a9aab66b5b5713b1a8bf1799))
* **abstract-utxo:** use wasm-utxo instead of utxo-lib ([c2fb2d5](https://github.com/BitGo/BitGoJS/commit/c2fb2d5ab3e8bb42cc17b942d4c4e957c624bb5a))





# [10.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.16.0...@bitgo/abstract-utxo@10.17.0) (2026-01-30)


### Bug Fixes

* **abstract-utxo:** add override keyword to preprocessBuildParams method ([836cbda](https://github.com/BitGo/BitGoJS/commit/836cbda23f977ada67dacc1671e77d0b12745a61))
* **abstract-utxo:** check optional params for allowExternalChangeAddress ([d79d95a](https://github.com/BitGo/BitGoJS/commit/d79d95a2c74cb891bdfa1a4a916240cf0b2e3444))
* **abstract-utxo:** move outputDifference tests to correct directory ([dd294ad](https://github.com/BitGo/BitGoJS/commit/dd294ad0045561cca47aaaf604af3807b1961341))
* **abstract-utxo:** move toCanonicalTransactionRecipient to parseTransaction ([3a2037f](https://github.com/BitGo/BitGoJS/commit/3a2037f1be249e13f5b9baeedb409d15b1709e55))
* **abstract-utxo:** normalize address comparison in parseOutput ([27c4e89](https://github.com/BitGo/BitGoJS/commit/27c4e89a65f94a5cb75b1b595aabc53f063009d0))


### Features

* **abstract-utxo:** add utxo-ord to project references ([1805c7b](https://github.com/BitGo/BitGoJS/commit/1805c7b67515a322b4abb5dce3b9513a0de96ce3))
* **abstract-utxo:** allow optional expected outputs ([710e60b](https://github.com/BitGo/BitGoJS/commit/710e60bc5c075af39d885ba6c852970c6765020b))
* **abstract-utxo:** migrate from utxolib to wasm-utxo address module ([ceb8051](https://github.com/BitGo/BitGoJS/commit/ceb8051879cd4591f0aa7052e7fcaabf1d6364e8))
* **abstract-utxo:** optimize tx signing with bulk approach ([b3626a7](https://github.com/BitGo/BitGoJS/commit/b3626a71a17915836b50f8748798ec12f563069f))
* **abstract-utxo:** simplify interface, use wasm types ([a71a702](https://github.com/BitGo/BitGoJS/commit/a71a702595f6fa1ea401fd772994690a39435006))
* **abstract-utxo:** update wasm-utxo dependency to 1.29.0 ([a6f9c5c](https://github.com/BitGo/BitGoJS/commit/a6f9c5c53fe87d36c231fbdc2f9f09b4e0549ca4))
* **abstract-utxo:** use coin name instead of network to determine chain ([cd752c6](https://github.com/BitGo/BitGoJS/commit/cd752c6409fb98d8387b3f4effc9b583e52d08a6))
* **abstract-utxo:** use wasm address generation for fixed script ([0d339d9](https://github.com/BitGo/BitGoJS/commit/0d339d9d57655d3c9c93744097b6ea3cfcc61598))
* **abstract-utxo:** use wasm-utxo for inscriptionBuilder ([e33840c](https://github.com/BitGo/BitGoJS/commit/e33840ccdca43c9611f525f99993a28791c5f898))
* support node 24 ([b998bd1](https://github.com/BitGo/BitGoJS/commit/b998bd1bdb7e267e8e2f33b3599643a5c85c21d2))





# [10.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.15.1...@bitgo/abstract-utxo@10.16.0) (2026-01-22)


### Features

* **abstract-utxo:** fetch keychains from wallet in explainTransaction ([3ca122b](https://github.com/BitGo/BitGoJS/commit/3ca122bec75333a781be6302a04498ea570401c4))





## [10.15.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.15.0...@bitgo/abstract-utxo@10.15.1) (2026-01-19)

**Note:** Version bump only for package @bitgo/abstract-utxo





# [10.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.14.0...@bitgo/abstract-utxo@10.15.0) (2026-01-19)


### Features

* **abstract-utxo:** update wasm-utxo dependency to latest version ([f15d0f9](https://github.com/BitGo/BitGoJS/commit/f15d0f924867015ddaf6f0ed08ba9797679e1abd))
* **deps:** bump version to 1.24.0 ([9fa7fee](https://github.com/BitGo/BitGoJS/commit/9fa7feeae89b10395a2392d5a07b04cdca132f22))





# [10.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.13.0...@bitgo/abstract-utxo@10.14.0) (2026-01-14)


### Bug Fixes

* **abstract-utxo:** improve type checking in isUtxoWalletData ([75d85f8](https://github.com/BitGo/BitGoJS/commit/75d85f899fe01f86aa2a09b45a7d4b9150a37ded))


### Features

* **abstract-utxo:** add BIP-322 signature verification with wasm-utxo ([c28752a](https://github.com/BitGo/BitGoJS/commit/c28752a913a5cbd9e4b37307eef3160fd9a3b865))
* **abstract-utxo:** add explicit testnet coin array and mainnet mapping ([e321560](https://github.com/BitGo/BitGoJS/commit/e3215603398944de3006ca7c24d7c7a08de2e9fe))
* **abstract-utxo:** add unified signAndVerifyPsbt function ([b1e6da5](https://github.com/BitGo/BitGoJS/commit/b1e6da5263a1124f27602f98084f8ce1b02eefa0))
* **abstract-utxo:** bump wasm-utxo dependency to v1.20.0 ([b57480c](https://github.com/BitGo/BitGoJS/commit/b57480cd4698fd23c53b16e733133d0982a746a2))
* **abstract-utxo:** define coin name in coin class instead of network ([2a15687](https://github.com/BitGo/BitGoJS/commit/2a156874daf73527d95465ffa0f7063e69b214e1))
* **abstract-utxo:** enable wasm-utxo tests for zcash ([5caf606](https://github.com/BitGo/BitGoJS/commit/5caf60657b9c9dbc0cc71e769e819e993cb5bde3))
* **abstract-utxo:** refactor signAndVerifyPsbt ([d346b68](https://github.com/BitGo/BitGoJS/commit/d346b687b741c058a262dba6afd940b563176c2b))
* **abstract-utxo:** refine typed interfaces and update naming ([4f0cd23](https://github.com/BitGo/BitGoJS/commit/4f0cd233f9536ac0578e9c5dd6c68d82cce2add7))
* **abstract-utxo:** rename signPsbt to signPsbtUtxolib ([b9ed41a](https://github.com/BitGo/BitGoJS/commit/b9ed41a27db8391146f6514620e565600ec2de19))
* **abstract-utxo:** simplify replay protection unspent check ([23b0f15](https://github.com/BitGo/BitGoJS/commit/23b0f15bec5e6547cbe1cd423b6a9787a2887f2b))
* **abstract-utxo:** simplify testnet coin name type and check ([9215302](https://github.com/BitGo/BitGoJS/commit/92153022f243072f77a330522271f44f0c09a009))
* **abstract-utxo:** use coin name instead of network ([0cd99bd](https://github.com/BitGo/BitGoJS/commit/0cd99bdfc786b6b16672a3fdb75c7d5d26f3a19b))
* **abstract-utxo:** use coin name instead of network object ([bd9ace7](https://github.com/BitGo/BitGoJS/commit/bd9ace7d0ba8950d12f3eb74bbe61883d2d65a53))
* **abstract-utxo:** use coin name to determine coin full name ([c6afa6b](https://github.com/BitGo/BitGoJS/commit/c6afa6bfadc8483bf3c2cde93a4435d17aeaaa51))
* **abstract-utxo:** use coin name to get family ([868d070](https://github.com/BitGo/BitGoJS/commit/868d07042385ed98ea8bd261e258cb2679dadb5c))
* **abstract-utxo:** use wasm-utxo address generator for all networks ([5982cf4](https://github.com/BitGo/BitGoJS/commit/5982cf4fee9cbe877e260a5fcaee5832ddc55a5c))
* **abstract-utxo:** use wasm-utxo for BIP322 verification ([76e33bf](https://github.com/BitGo/BitGoJS/commit/76e33bf607c5263393320cd87aad312639fb02ef))
* **abstract-utxo:** use wasm-utxo for recovery functions ([6754c34](https://github.com/BitGo/BitGoJS/commit/6754c349c29e27a728f1c539dbd352c2d16ab99a))
* use fromOutput to remove utxolib dependency in wasm path ([55e446d](https://github.com/BitGo/BitGoJS/commit/55e446da3754550c46f98e21aa152ac92f0ff37a))
* use wasm dimensions in psbt calculation ([adae3f8](https://github.com/BitGo/BitGoJS/commit/adae3f8b478925f3c7d6765b78edd741b61ddc50))
* use wasm-utxo dimensions for crossChainRecovery ([78a3d35](https://github.com/BitGo/BitGoJS/commit/78a3d35dbaf56f1a601e9dad3ff40a1385774951))
* use wasm-utxo for testnet in backup recovery ([25c26aa](https://github.com/BitGo/BitGoJS/commit/25c26aa519ae52a912cf3fb56eef151e0c479cb0))





# [10.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.12.0...@bitgo/abstract-utxo@10.13.0) (2026-01-07)


### Features

* add wasm-utxo backend for cross-chain recovery ([f6509fb](https://github.com/BitGo/BitGoJS/commit/f6509fbcdef27e6448785a147029f2d61d0bd9c9))
* bump @bitgo/wasm-utxo to 1.19.0 ([9627848](https://github.com/BitGo/BitGoJS/commit/962784829fc8fc8d2f80ae5299f2143a0d31b269))





# [10.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.11.1...@bitgo/abstract-utxo@10.12.0) (2025-12-23)


### Bug Fixes

* **abstract-utxo:** add fee rate test for backup key recovery ([4bad0f8](https://github.com/BitGo/BitGoJS/commit/4bad0f817fc2b630613156c5423221772e8cb593))
* **abstract-utxo:** correct fee calculation in backup recovery ([e8c8961](https://github.com/BitGo/BitGoJS/commit/e8c8961d546a39a24b48f70a577a11dfb32a2c3f))
* **abstract-utxo:** fix backup key recovery for KRS wallets ([ef2b442](https://github.com/BitGo/BitGoJS/commit/ef2b44239929f95ed05033aab48f59301b4e56e8))
* **abstract-utxo:** refactor backup key recovery psbt creation ([8d6c758](https://github.com/BitGo/BitGoJS/commit/8d6c758649b5f080d0b0b3e671bb2685dc42f16c))
* **abstract-utxo:** use fixed fee rate for bkr tests ([441a305](https://github.com/BitGo/BitGoJS/commit/441a3052a79a6097250966600029ca7c444ea335))


### Features

* **abstract-utxo:** add getReplayProtectionPubkeys function ([8c2bb89](https://github.com/BitGo/BitGoJS/commit/8c2bb89b74ea75a99c99d67359c38d24ae999427))
* **abstract-utxo:** enable wasm support for BCH, BTG, BSV, XEC ([90d369e](https://github.com/BitGo/BitGoJS/commit/90d369ebff5324a8d9559406349db02e4d8d5e11))
* **abstract-utxo:** extract default recovery fee rates into constants ([8f61ac4](https://github.com/BitGo/BitGoJS/commit/8f61ac409d70f0ccbdb11ecee83bbef4a63fd49d))
* bump wasm-utxo to 1.15.0 ([e327602](https://github.com/BitGo/BitGoJS/commit/e3276022fca422ee6befefaaac83ed49919e1ad8))
* bump wasm-utxo to 1.17.0 ([50b2fe6](https://github.com/BitGo/BitGoJS/commit/50b2fe66e2ce8288c098660f82e1f56277f15a75))
* psbtify cross-chain recovery transactions ([a58302a](https://github.com/BitGo/BitGoJS/commit/a58302a5e583b0c45d78f669ee8fdf5772247a99))
* refactor unsignedSweep tx format in backupKeyRecovery ([1fce5c9](https://github.com/BitGo/BitGoJS/commit/1fce5c971140a8287ed8e971e3f0da143d193108))
* use wasm-utxo for PSBT creation in backupKeyRecovery ([5ec3b7e](https://github.com/BitGo/BitGoJS/commit/5ec3b7eef9786d171cc5f1f943de08530d9389b9))





## [10.11.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.11.0...@bitgo/abstract-utxo@10.11.1) (2025-12-17)

**Note:** Version bump only for package @bitgo/abstract-utxo





# [10.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.10.0...@bitgo/abstract-utxo@10.11.0) (2025-12-11)


### Features

* **abstract-utxo:** add default SDK backend property ([a517e73](https://github.com/BitGo/BitGoJS/commit/a517e7354facc16170611a2cfaef465632310347))





# [10.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.9.0...@bitgo/abstract-utxo@10.10.0) (2025-12-05)


### Features

* **abstract-utxo:** add encodeTransaction function ([8783f95](https://github.com/BitGo/BitGoJS/commit/8783f95b42b824d6cb8eba678450979c8495afa3))
* **abstract-utxo:** add fixedScriptWallet to decodeTransactionAsPsbt ([19cd235](https://github.com/BitGo/BitGoJS/commit/19cd2358b8aef0a2d97522dbd1fde66b593aff7e))
* **abstract-utxo:** add support for PSBT decoder selection ([c78c2f2](https://github.com/BitGo/BitGoJS/commit/c78c2f210f3b78365a84b98f092a7346cc26fc50))
* **abstract-utxo:** add WASM-based PSBT signing for MuSig2 ([2dc2ede](https://github.com/BitGo/BitGoJS/commit/2dc2ede4b93024a20aa04af9d53905502b6ae1ca))
* **abstract-utxo:** add wasm-utxo decoding support to test suite ([0f5c86c](https://github.com/BitGo/BitGoJS/commit/0f5c86c4f00a37fe8d850ee4450f1ffa008390d4))
* **abstract-utxo:** enable signing psbt with wasm implementation ([c941b08](https://github.com/BitGo/BitGoJS/commit/c941b08afb3ade94164a51164f754bf3d45bcbc2))
* **abstract-utxo:** extend DecodedTransaction to include wasm-utxo BitGoPsbt ([cc67073](https://github.com/BitGo/BitGoJS/commit/cc67073e45a871769d54d4e1a349517b5df32137))
* **abstract-utxo:** refactor replay protection to use pubkeys ([b2c8c47](https://github.com/BitGo/BitGoJS/commit/b2c8c470d13000cdcea0c5eb4944655486dac7d1))





# [10.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.8.0...@bitgo/abstract-utxo@10.9.0) (2025-12-04)


### Features

* **abstract-utxo:** add test for signAndVerifyPsbt function ([1eee8fe](https://github.com/BitGo/BitGoJS/commit/1eee8fe7d6d5c6b483f669773b5dbb738f8c72af))
* **abstract-utxo:** add transaction decoding utils ([1121868](https://github.com/BitGo/BitGoJS/commit/1121868dcd4a0e79577c4447dc46b1c93e64f805))
* **abstract-utxo:** bump wasm-utxo version to 1.11.0 ([11225f6](https://github.com/BitGo/BitGoJS/commit/11225f6012dee5759ea246811aebe5f25c64717d))
* **abstract-utxo:** change `signTransaction` to return transaction object ([581edde](https://github.com/BitGo/BitGoJS/commit/581edde7b14cf522b0be79e0cf46a2f89a6a7c68))
* **abstract-utxo:** extract replay protection addresses param ([eb767d8](https://github.com/BitGo/BitGoJS/commit/eb767d8080501c0ab443e8d25b662c93a5d9fb72))
* **abstract-utxo:** fix npm test to handle extra arguments ([4696fad](https://github.com/BitGo/BitGoJS/commit/4696fad8d5142c1cee4e40f6e09ea4d4800b69c7))
* **abstract-utxo:** include script type in input signing error ([b73057e](https://github.com/BitGo/BitGoJS/commit/b73057e6a6e86a7e4a5b2cf80b7612ab03445a73))
* **abstract-utxo:** move replay protection and signing to transaction/fixedScript ([65f39e1](https://github.com/BitGo/BitGoJS/commit/65f39e1b812e140f3eb7c706edc5ad984185cc70))
* **abstract-utxo:** move RootWalletKeys type to utxo-lib ([7809170](https://github.com/BitGo/BitGoJS/commit/7809170cfe88a0cc37d4bc3c86f98c8f5a4b5e14))
* **abstract-utxo:** move signTransaction away from abstract coin ([ef88bda](https://github.com/BitGo/BitGoJS/commit/ef88bdab2d6507e7a6c2574fe5904c04ffe1a58d))
* **abstract-utxo:** rename signPsbt to getMusig2Nonces ([4548dfc](https://github.com/BitGo/BitGoJS/commit/4548dfcf98be51b8673d950d0eeeef34e3aed3c1))
* **abstract-utxo:** set default strict to true for paygo ver ([2b6567a](https://github.com/BitGo/BitGoJS/commit/2b6567a380919b5ffa3b235353275b212322f40f))
* **abstract-utxo:** test signPsbtWithMusig2Participant ([540eca9](https://github.com/BitGo/BitGoJS/commit/540eca9c667547e136c7e31bfa021aef9f56e94f))
* add LTC cross-chain recovery support ([0e6a03a](https://github.com/BitGo/BitGoJS/commit/0e6a03ad54a8145e8249811b365f03b2e47fad43))
* add tx explanation for TxIntentMismatch errors ([feed271](https://github.com/BitGo/BitGoJS/commit/feed271ec7ae1ae099adf3eb100a532b12d03228))





# [10.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.7.0...@bitgo/abstract-utxo@10.8.0) (2025-11-26)


### Bug Fixes

* **abstract-utxo:** increase timeout for test recovery data ([f3f088b](https://github.com/BitGo/BitGoJS/commit/f3f088bc6431d66032ac7d460bcb5b4427acd0c9))
* **utxo-lib:** fix default consensus branch id for v4/v5 transactions ([292196f](https://github.com/BitGo/BitGoJS/commit/292196f2237c510ed4cd3003ade114cdf8f55103))


### Features

* **abstract-utxo:** add custom change wallet parsing to PSBT explainer ([80284e0](https://github.com/BitGo/BitGoJS/commit/80284e0d9dbdfd2fa46b58cbb86279cd3ce8bccf))
* **abstract-utxo:** add function to convert keychains to xpub format ([fcad8e5](https://github.com/BitGo/BitGoJS/commit/fcad8e5bd01ea2fe3f5f26f3d9b9bf6095070f96))
* **abstract-utxo:** add support for RootWalletKeys in toBip32Triple ([c130be3](https://github.com/BitGo/BitGoJS/commit/c130be3662831e1a03b8d7b8262f727b86f96b64))
* **abstract-utxo:** add test for custom change outputs in PSBT ([e7d24df](https://github.com/BitGo/BitGoJS/commit/e7d24dfce8acf2c32e8ee3c3dde485522ef6377d))
* **abstract-utxo:** document explainPsbt parameters ([cdd22af](https://github.com/BitGo/BitGoJS/commit/cdd22af15681f29422127fe41826b24a5ea13630))
* **abstract-utxo:** implement support for custom change outputs ([4d80186](https://github.com/BitGo/BitGoJS/commit/4d80186f0d90defa9465fc586a1fff81799521f5))
* **abstract-utxo:** improve comments for address validation process ([2e945a1](https://github.com/BitGo/BitGoJS/commit/2e945a1f96b1d8a1a4d0956bb8386a1d892d98fc))
* **abstract-utxo:** optimize backup key recovery with address generation ([e4a6b38](https://github.com/BitGo/BitGoJS/commit/e4a6b3819853ca2fe188652cf71a732cb41cb521))
* **abstract-utxo:** refactor PSBT output handling ([fb12eaf](https://github.com/BitGo/BitGoJS/commit/fb12eafd97e541147755f9f52c5aa8a63676138a))
* **abstract-utxo:** support RootWalletKeys in fixedScript address generation ([e65fabb](https://github.com/BitGo/BitGoJS/commit/e65fabbc21d7ec6d0d3ef33bd59b8d681a4f39c4))





# [10.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.6.0...@bitgo/abstract-utxo@10.7.0) (2025-11-19)


### Bug Fixes

* **abstract-utxo:** handle script recipients in toCanonicalTransipient ([c297db0](https://github.com/BitGo/BitGoJS/commit/c297db02b5610bdb00c8f2cb48c1bfb98f9b7828))
* **abstract-utxo:** improve error message for invalid recipients ([42007f3](https://github.com/BitGo/BitGoJS/commit/42007f3e3cd862fb219223d0c204cd8089a65418))
* **abstract-utxo:** refactor parseTransaction to improve organization ([195c1eb](https://github.com/BitGo/BitGoJS/commit/195c1eb452e620645b7d8705316bf79a6cbe560a))
* **abstract-utxo:** support RBF in parsePsbt tests ([9ace7ad](https://github.com/BitGo/BitGoJS/commit/9ace7ad3e04e59a7c05d3b2f6972440e0be28fb4))
* **utxo-lib:** set OP_RETURN output value to 0 ([169cab7](https://github.com/BitGo/BitGoJS/commit/169cab7f6e97edd11f6df60e7e8976a2cdd9c500))


### Features

* **abstract-utxo:** add ESM build support ([34025df](https://github.com/BitGo/BitGoJS/commit/34025df21144678f22ba59092617a27a72000034))
* **abstract-utxo:** add replay protection output scripts function ([516a56c](https://github.com/BitGo/BitGoJS/commit/516a56c0ffc6a555f94b1771d9d775737bb8b0fb))
* **abstract-utxo:** add support for external change address ([975b73e](https://github.com/BitGo/BitGoJS/commit/975b73ecf474703940130dcc63c2af7e1f67ff95))
* **abstract-utxo:** add support for parsing legacy transactions ([2d36d4e](https://github.com/BitGo/BitGoJS/commit/2d36d4e566691fcc32a5c5797608ef9064c4b6c3))
* **abstract-utxo:** add support for wasm-utxo PSBT explaining ([cb91c1d](https://github.com/BitGo/BitGoJS/commit/cb91c1dca1f7d120721f9ca5e1278f0701833692))
* **abstract-utxo:** add tx format unit tests ([51c2560](https://github.com/BitGo/BitGoJS/commit/51c25600c1bb0597f85021dcf7a866790f376bf5))
* **abstract-utxo:** add wasm test cases for parsePsbt ([e0058a0](https://github.com/BitGo/BitGoJS/commit/e0058a099395dd7734936f47b710419fb9dd410d))
* **abstract-utxo:** default PSBT for all testnet coins minus zcash ([45745c9](https://github.com/BitGo/BitGoJS/commit/45745c9569c793bd81423ab38b5e9fba773fe959))
* **abstract-utxo:** default testnet transactions to PSBT format ([6681c74](https://github.com/BitGo/BitGoJS/commit/6681c749be3e2ef9b8ed34f0ff76977c72619639))
* **abstract-utxo:** default to psbt-lite for testnet ([7f4c3b2](https://github.com/BitGo/BitGoJS/commit/7f4c3b28fa57e877c1144ebbc500e772674f874a))
* **abstract-utxo:** exclude Zcash from PSBT default tx format ([a5d1612](https://github.com/BitGo/BitGoJS/commit/a5d16121e8300587d58ee1b9c18cc318c14e3d45))
* **abstract-utxo:** handle script recipients in BCH canonicalAddress ([ba2343d](https://github.com/BitGo/BitGoJS/commit/ba2343d1ab7c2e37656f8f5462105aec970f0a84))
* **abstract-utxo:** improve parseTransaction expected outputs logic ([7ca4628](https://github.com/BitGo/BitGoJS/commit/7ca46281ea0a21d8001d00ca7287d2ab5e8a2407))
* **abstract-utxo:** move transaction types to separate file ([bb66fb9](https://github.com/BitGo/BitGoJS/commit/bb66fb9b1b4288bfa87cc3369c39341ac9ed9047))
* **abstract-utxo:** prohibit legacy tx format on testnet ([f86f3aa](https://github.com/BitGo/BitGoJS/commit/f86f3aae426629460ad535ddba2fa95b32596b9d))
* **abstract-utxo:** refactor conditional logic in parse transaction tests ([d411c04](https://github.com/BitGo/BitGoJS/commit/d411c042ccfe6a932786e13899130dbc9a5d1ebb))
* **abstract-utxo:** refactor parsePsbt test to improve reusability ([7c982bf](https://github.com/BitGo/BitGoJS/commit/7c982bf0d9a389c55d884578c302d4109271b075))
* **abstract-utxo:** refactor tx format selection into dedicated function ([d5abc10](https://github.com/BitGo/BitGoJS/commit/d5abc10eaa7e18fc60735d1b864b804e1f9f599c))
* **abstract-utxo:** test over all wallet types ([076170e](https://github.com/BitGo/BitGoJS/commit/076170e7424e2dcdeb839f0b7b7526b8f9b85606))
* **abstract-utxo:** update transaction parsing comments ([93a3af8](https://github.com/BitGo/BitGoJS/commit/93a3af8f0bdcd8043a1d855387bc931a71857cf7))
* **abstract-utxo:** use defaultTxFormat in tests instead of hardcoded chain list ([4c23213](https://github.com/BitGo/BitGoJS/commit/4c2321318906d03bf8721cc544bf6ea2dbaf3f1b))





# [10.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.5.0...@bitgo/abstract-utxo@10.6.0) (2025-11-13)


### Bug Fixes

* **abstract-utxo:** restore normal fixture path handling ([afaff4f](https://github.com/BitGo/BitGoJS/commit/afaff4f04472851ecb1b867573ee092d0b6fa976))


### Features

* **abstract-utxo:** add bitcoin testnet normalization for fixtures ([f580dbf](https://github.com/BitGo/BitGoJS/commit/f580dbf06cac23758abdff6b14dc6af34a3be6b4))
* **abstract-utxo:** refactor recovery tests to run with multiple script types ([eb7b468](https://github.com/BitGo/BitGoJS/commit/eb7b46867890747dab6b2554627cf035ff3894c5))
* **abstract-utxo:** wrap recovery tests in describe block for clarity ([996ab3b](https://github.com/BitGo/BitGoJS/commit/996ab3bdb354aac988d9a2ea7c012916dd8f1488))
* bump wasm-utxo to 1.3.0 ([d84e380](https://github.com/BitGo/BitGoJS/commit/d84e3808d1eb60d00ad03a29c34e27781ee8bf27))
* use wasm-utxo for address generation on testnets ([65a6c11](https://github.com/BitGo/BitGoJS/commit/65a6c11436c2b773dfa96b92d8ef809759be3516))


### Performance Improvements

* **abstract-utxo:** optimize test setup to reduce test discovery time ([3b7dedf](https://github.com/BitGo/BitGoJS/commit/3b7dedf72c490dac90de03392f7ff0d04e522f2a))





# [10.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.4.0...@bitgo/abstract-utxo@10.5.0) (2025-11-12)


### Features

* **abstract-utxo:** add test for explainPsbt utility ([17b5a94](https://github.com/BitGo/BitGoJS/commit/17b5a94a8b903973c63729bca04da0831422c257))
* **abstract-utxo:** make TransactionExplanation more flexible ([0912ec0](https://github.com/BitGo/BitGoJS/commit/0912ec000390c2f46b1005ca5898e8d9733af642))
* **abstract-utxo:** refactor transaction explanation utilities ([fd2e902](https://github.com/BitGo/BitGoJS/commit/fd2e902a360ba07541f75e28169304e684717f22))
* **abstract-utxo:** remove type param from explainPsbt ([6229861](https://github.com/BitGo/BitGoJS/commit/6229861b85f70c3d7a91f992f9fbe71853f55db3))
* replace wasm-miniscript with wasm-utxo package ([90dc886](https://github.com/BitGo/BitGoJS/commit/90dc8865a6154a5b42211c5610a5ee196cf0ca8e))





# [10.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.3.0...@bitgo/abstract-utxo@10.4.0) (2025-11-06)


### Features

* **abstract-utxo:** improve parseTransaction tests ([c52568f](https://github.com/BitGo/BitGoJS/commit/c52568f1620af62027f98bdb3c7df33fbd61c4bf))
* **abstract-utxo:** replace should.js with node's assert module ([adc9fb2](https://github.com/BitGo/BitGoJS/commit/adc9fb2ee0d529f276473f0567102322630f8e19))





# [10.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.2.0...@bitgo/abstract-utxo@10.3.0) (2025-10-31)


### Features

* add fixed fee for Dogecoin transactions ([48c4be2](https://github.com/BitGo/BitGoJS/commit/48c4be2e030735db4bbde85930df4155cc59e954))





# [10.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.1.0...@bitgo/abstract-utxo@10.2.0) (2025-10-29)


### Features

* **abstract-utxo:** add .vscode to gitignore ([a939fad](https://github.com/BitGo/BitGoJS/commit/a939fad704db82e441b42590fd8997a6bab5a9ce))
* **abstract-utxo:** add comprehensive README documentation ([196eca7](https://github.com/BitGo/BitGoJS/commit/196eca79e66d755614dc1056460c6034dee4ffbd))
* **abstract-utxo:** extract fixed-script address generation ([394f6ee](https://github.com/BitGo/BitGoJS/commit/394f6ee322f518c4491fb38d3330e123b52d0b80))
* **abstract-utxo:** move generateAddress to a separate file ([d717184](https://github.com/BitGo/BitGoJS/commit/d7171848ff65361e179fd61c0755fe02fa620248))
* **abstract-utxo:** move utxo test files to abstract-utxo module ([e8a1166](https://github.com/BitGo/BitGoJS/commit/e8a1166de87ec10b214596a8626ed0cae7fdc3ca))
* **abstract-utxo:** remove threshold from GenerateAddressOptions ([93f72ea](https://github.com/BitGo/BitGoJS/commit/93f72ea1488068c3d74cf1157e1eea7295f5dc25))
* **abstract-utxo:** remove unused threshold parameter ([c6755c0](https://github.com/BitGo/BitGoJS/commit/c6755c0b9115c61fdb1f2b0be2eba1c5e8339cef))
* **abstract-utxo:** return specific coin types from createInstance ([ead5231](https://github.com/BitGo/BitGoJS/commit/ead523150d60dbed02e13dd2452687645afeff11))
* **abstract-utxo:** use internal coin impls and modern fs/promises ([d02c35c](https://github.com/BitGo/BitGoJS/commit/d02c35c1ab9276bf043361ed3f4b459acf98fc53))





# [10.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.0.1...@bitgo/abstract-utxo@10.1.0) (2025-10-24)


### Features

* **abstract-utxo:** move coin implementations from sdk modules ([02e2e69](https://github.com/BitGo/BitGoJS/commit/02e2e69557703ee75e3ace7d831973a4d66c9d2d))
* **abstract-utxo:** remove deprecated getCoinLibrary method ([8f1836f](https://github.com/BitGo/BitGoJS/commit/8f1836f620191ca337758292b2f337d76f814f0a))
* improve transaction verification error handling ([641406f](https://github.com/BitGo/BitGoJS/commit/641406fa3d9e9a9380664f545e0ab80aafffac20))
* refactoring error handling for transaction verification ([a3513a3](https://github.com/BitGo/BitGoJS/commit/a3513a35c1cde4f7575500a49adc50ee412bcad5))
* replace generic Error with TxIntentMismatchError ([982f902](https://github.com/BitGo/BitGoJS/commit/982f9022f972076d28ac0647088b329fd1ec827a))





## [10.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@10.0.0...@bitgo/abstract-utxo@10.0.1) (2025-10-21)

**Note:** Version bump only for package @bitgo/abstract-utxo





# [10.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.27.5...@bitgo/abstract-utxo@10.0.0) (2025-10-16)


### Features

* **abstract-utxo:** remove deprecated signature verification functions ([2ca3bf5](https://github.com/BitGo/BitGoJS/commit/2ca3bf5824a30fe78c5b95bc03019020d5be9c71))
* **abstract-utxo:** use secp256k1 for bip32 operations ([b1ae0fc](https://github.com/BitGo/BitGoJS/commit/b1ae0fc7e52b83677e228a236b4f8e0844fd9b6f))


### BREAKING CHANGES

* **abstract-utxo:** Consumers must now use
`utxolib.bitgo.getDefaultSigHash(network)`

Issue: BTC-2676

Co-authored-by: llm-git <llm-git@ttll.de>





## [9.27.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.27.4...@bitgo/abstract-utxo@9.27.5) (2025-10-13)

**Note:** Version bump only for package @bitgo/abstract-utxo





## [9.27.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.27.3...@bitgo/abstract-utxo@9.27.4) (2025-10-09)


### Bug Fixes

* run check-fmt on code files only ([9745196](https://github.com/BitGo/BitGoJS/commit/9745196b02b9678c740d290a4638ceb153a8fd75))





## [9.27.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.27.2...@bitgo/abstract-utxo@9.27.3) (2025-10-08)

**Note:** Version bump only for package @bitgo/abstract-utxo





## [9.27.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.27.1...@bitgo/abstract-utxo@9.27.2) (2025-10-02)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.27.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.27.0...@bitgo/abstract-utxo@9.27.1) (2025-09-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.27.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.26.0...@bitgo/abstract-utxo@9.27.0) (2025-09-25)

### Features

- configure learn to skip git operations ([ee3a622](https://github.com/BitGo/BitGoJS/commit/ee3a6220496476aa7f4545b5f4a9a3bf97d9bdb9))

# [9.26.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.25.2...@bitgo/abstract-utxo@9.26.0) (2025-09-03)

### Bug Fixes

- **abstract-utxo:** export transaction ([75d6552](https://github.com/BitGo/BitGoJS/commit/75d6552a73c19de53a95450ff46da28cd30f1c05))
- export bip322 types and utility functions ([d352531](https://github.com/BitGo/BitGoJS/commit/d3525316f2e5de4b48b4796857efc7c573c38170))

### Features

- **abstract-utxo:** add BIP322 message verification functionality ([531a83c](https://github.com/BitGo/BitGoJS/commit/531a83c16d9b187506068d57a27bab1bc5b3b865))

## [9.25.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.25.1...@bitgo/abstract-utxo@9.25.2) (2025-08-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.25.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.25.0...@bitgo/abstract-utxo@9.25.1) (2025-08-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.25.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.24.0...@bitgo/abstract-utxo@9.25.0) (2025-08-27)

### Features

- **abstract-utxo:** add BIP322 message serialization format ([b3f30de](https://github.com/BitGo/BitGoJS/commit/b3f30dedb715d29a1f180ba1b0f3d30d806fce6d))

# [9.24.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.23.0...@bitgo/abstract-utxo@9.24.0) (2025-08-22)

### Features

- **root:** migrate ts-node -> tsx ([ea180b4](https://github.com/BitGo/BitGoJS/commit/ea180b43001d8e956196bc07b32798e3a7031eeb))

# [9.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.22.1...@bitgo/abstract-utxo@9.23.0) (2025-08-22)

### Features

- **abstract-utxo:** add BIP322 message extraction to explainTransaction ([f23f65f](https://github.com/BitGo/BitGoJS/commit/f23f65f387f10e7ad350c5c738cb0b54b263fb4d))

## [9.22.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.22.0...@bitgo/abstract-utxo@9.22.1) (2025-08-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.12...@bitgo/abstract-utxo@9.22.0) (2025-08-14)

### Features

- **abstract-utxo:** verify paygo ([a3203bc](https://github.com/BitGo/BitGoJS/commit/a3203bc59a04bf5ae7b573eb4b911a3425df21b7))

## [9.21.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.11...@bitgo/abstract-utxo@9.21.12) (2025-08-07)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.10...@bitgo/abstract-utxo@9.21.11) (2025-07-31)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.9...@bitgo/abstract-utxo@9.21.10) (2025-07-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.7...@bitgo/abstract-utxo@9.21.9) (2025-07-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.7...@bitgo/abstract-utxo@9.21.8) (2025-07-23)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.6...@bitgo/abstract-utxo@9.21.7) (2025-07-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.5...@bitgo/abstract-utxo@9.21.6) (2025-07-10)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.4...@bitgo/abstract-utxo@9.21.5) (2025-07-03)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.3...@bitgo/abstract-utxo@9.21.4) (2025-06-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.2...@bitgo/abstract-utxo@9.21.3) (2025-06-24)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.1...@bitgo/abstract-utxo@9.21.2) (2025-06-18)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.21.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.21.0...@bitgo/abstract-utxo@9.21.1) (2025-06-10)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.20.0...@bitgo/abstract-utxo@9.21.0) (2025-06-05)

### Features

- **root:** support node 22 ([c4ad6af](https://github.com/BitGo/BitGoJS/commit/c4ad6af2e8896221417c303f0f6b84652b493216))

# [9.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.12...@bitgo/abstract-utxo@9.20.0) (2025-06-02)

### Features

- rename audit function naming and signature ([1a885ab](https://github.com/BitGo/BitGoJS/commit/1a885ab60d30ca8595e284a728f2ab9d3c09994e))
- **root:** add new audit key baseCoin method ([57c1778](https://github.com/BitGo/BitGoJS/commit/57c17784a72ea364f18e3af9dbd83da877827e69))

## [9.19.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.11...@bitgo/abstract-utxo@9.19.12) (2025-05-28)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.10...@bitgo/abstract-utxo@9.19.11) (2025-05-22)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.9...@bitgo/abstract-utxo@9.19.10) (2025-05-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.8...@bitgo/abstract-utxo@9.19.9) (2025-05-07)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.7...@bitgo/abstract-utxo@9.19.8) (2025-04-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.6...@bitgo/abstract-utxo@9.19.7) (2025-04-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.5...@bitgo/abstract-utxo@9.19.6) (2025-04-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.4...@bitgo/abstract-utxo@9.19.5) (2025-04-04)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.3...@bitgo/abstract-utxo@9.19.4) (2025-04-02)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.2...@bitgo/abstract-utxo@9.19.3) (2025-03-28)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.1...@bitgo/abstract-utxo@9.19.2) (2025-03-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.19.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.19.0...@bitgo/abstract-utxo@9.19.1) (2025-03-18)

### Bug Fixes

- **sdk-core:** set default multisig if empty ([e2727df](https://github.com/BitGo/BitGoJS/commit/e2727dfc89dd314a607b737e761e5eff824606af))

# [9.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.18.0...@bitgo/abstract-utxo@9.19.0) (2025-03-06)

### Features

- allow a custom fee rate for utxo recovery ([411c666](https://github.com/BitGo/BitGoJS/commit/411c666462975c49db7e1fd77af478aee843f13b))
- use dimensions to estimate transaction size ([750f92e](https://github.com/BitGo/BitGoJS/commit/750f92e665149e94853bb2b2705ff0353d7a10ae))

# [9.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.17.0...@bitgo/abstract-utxo@9.18.0) (2025-03-04)

### Features

- **utxo-core:** simplify module exports ([ea7cd0f](https://github.com/BitGo/BitGoJS/commit/ea7cd0f90977894c25fc0734386b9e8d27465fd5))

## [9.17.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.17.0...@bitgo/abstract-utxo@9.17.2) (2025-02-26)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.17.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.17.0...@bitgo/abstract-utxo@9.17.1) (2025-02-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.15.0...@bitgo/abstract-utxo@9.17.0) (2025-02-19)

### Features

- **abstract-utxo:** add multiple descriptor validation support ([512782b](https://github.com/BitGo/BitGoJS/commit/512782b2da40b8e1b057ef64a2dbc408d6234f84))
- **abstract-utxo:** allow only same-type descriptors in prod ([417276e](https://github.com/BitGo/BitGoJS/commit/417276e5b72c29e1a583dc790e083e55b322b3dc))
- **utxo-core:** add new module for UTXO types and functions ([7046b8a](https://github.com/BitGo/BitGoJS/commit/7046b8a53d6b56982d4813fae620eb4b03bbd208))
- **utxo-core:** update descriptor test util to use AST types ([d29e0dc](https://github.com/BitGo/BitGoJS/commit/d29e0dcb09352f2ba9910d224ac3ac9c92cc9e81))

# [9.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.15.0...@bitgo/abstract-utxo@9.16.0) (2025-02-11)

### Features

- **utxo-core:** add new module for UTXO types and functions ([7046b8a](https://github.com/BitGo/BitGoJS/commit/7046b8a53d6b56982d4813fae620eb4b03bbd208))

# [9.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.14.0...@bitgo/abstract-utxo@9.15.0) (2025-02-05)

### Bug Fixes

- **abstract-utxo:** fix presignTransaction for descriptor wallets ([2702580](https://github.com/BitGo/BitGoJS/commit/270258078224978b9e9d2aae80a58a2df6debea9))

### Features

- **abstract-utxo:** add isUtxoWalletData function ([5155cad](https://github.com/BitGo/BitGoJS/commit/5155cad3b50a5b9d80c6442befa2840bd8afec65))
- **abstract-utxo:** add UtxoCoinName type ([7ca28b5](https://github.com/BitGo/BitGoJS/commit/7ca28b557c3a7edaf71fe42b1bdd92b709997f10))

# [9.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.13.1...@bitgo/abstract-utxo@9.14.0) (2025-01-28)

### Bug Fixes

- **abstract-utxo:** fix findDescriptorForOutput for taproot outputs ([758777c](https://github.com/BitGo/BitGoJS/commit/758777c94dbcc6d1008ecc36c11c2d45b2457d1b))
- **abstract-utxo:** handle explicit internal recipients correctly ([74a940f](https://github.com/BitGo/BitGoJS/commit/74a940f300900ed824b757123f78f77d50123418))

### Features

- **abstract-utxo:** add createPsbt test for Tr2of3-NoKeyPath ([6034f43](https://github.com/BitGo/BitGoJS/commit/6034f4328b6bd910028f27c4f4da3e1cfb3d0351))
- **abstract-utxo:** add support for taproot descriptors in findDescriptors ([898ecd8](https://github.com/BitGo/BitGoJS/commit/898ecd85bc4df50c2d0805fa197735b50f6ecbbf))
- **abstract-utxo:** add support for taproot in descriptors testutils ([2717de0](https://github.com/BitGo/BitGoJS/commit/2717de05470fd4bfca3d28acc4ca548d0c208b50))
- **abstract-utxo:** add support for taproot in VirtualSize ([1ea2143](https://github.com/BitGo/BitGoJS/commit/1ea214348e585096ee0cbfb29a865b853cc89325))
- **abstract-utxo:** extend Tr2Of3 test for findDescriptors ([437eb7e](https://github.com/BitGo/BitGoJS/commit/437eb7e14e3aacebd17ae99948f0acbe706dd526))
- **abstract-utxo:** test explicit internal recipients ([12281b2](https://github.com/BitGo/BitGoJS/commit/12281b22a7cf69df974f38d7b07854c7572874eb))

## [9.13.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.13.0...@bitgo/abstract-utxo@9.13.1) (2025-01-23)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.12.0...@bitgo/abstract-utxo@9.13.0) (2025-01-23)

### Bug Fixes

- **abstract-utxo:** only include dist/src in package.json ([ae0c36a](https://github.com/BitGo/BitGoJS/commit/ae0c36a1579a7ec698ac09efc443dd75142212e9))

### Features

- **abstract-utxo:** export `offlineVault` module ([cf248c1](https://github.com/BitGo/BitGoJS/commit/cf248c191b5f3a77e7556ec3208ab39c2aa369ca))
- add getTransactionExplanation ([8a53455](https://github.com/BitGo/BitGoJS/commit/8a53455a9246c814185f61d4115d745395fc8cd0))

# [9.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.11.1...@bitgo/abstract-utxo@9.12.0) (2025-01-20)

### Bug Fixes

- **abstract-utxo:** improve createHalfSigned ([bac55b4](https://github.com/BitGo/BitGoJS/commit/bac55b4aa5a9c6624479e55424568a2bda32cac9))

### Features

- **abstract-utxo:** add descriptor support for offline vault ([7082893](https://github.com/BitGo/BitGoJS/commit/7082893036763d6c5bbe37236ebac68acd1976f5))

## [9.11.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.11.0...@bitgo/abstract-utxo@9.11.1) (2025-01-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.10.0...@bitgo/abstract-utxo@9.11.0) (2025-01-09)

### Bug Fixes

- **abstract-utxo:** check if external and internal descriptors are different ([10a48c3](https://github.com/BitGo/BitGoJS/commit/10a48c3b90bb985206a3eb808e2f454e1d8e292a))

### Features

- **abstract-utxo:** allow signed descriptors in prod policy ([a19606a](https://github.com/BitGo/BitGoJS/commit/a19606aa68e527bb0457e926e2b263d18c7e0f45))
- add example for createDescriptorWalletWithWalletPassphrase ([384ed92](https://github.com/BitGo/BitGoJS/commit/384ed9221c14eca4235b152d4a848d16d68aaf14))
- export createNamedDescriptorWithSignature ([8856442](https://github.com/BitGo/BitGoJS/commit/885644217954e1a8d5736d11dff2aa171c1ace11))

# [9.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.9.0...@bitgo/abstract-utxo@9.10.0) (2025-01-03)

### Features

- **abstract-utxo:** sign descriptors when creating wallet ([079d9b9](https://github.com/BitGo/BitGoJS/commit/079d9b91281ee05b1140aaf8fbf0758627820bba))

# [9.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.8.0...@bitgo/abstract-utxo@9.9.0) (2024-12-24)

### Features

- **abstract-utxo:** add support for 'max' value parse.ts ([e664c26](https://github.com/BitGo/BitGoJS/commit/e664c267a2f35f9dcc5d62cbd3386be5943748e9))
- **abstract-utxo:** allow 'max' value in ExpectedOutput ([470767a](https://github.com/BitGo/BitGoJS/commit/470767ab3e4df7946d12f354dee12906566bc7d4))
- use descriptor outputDifference method ([663944a](https://github.com/BitGo/BitGoJS/commit/663944af14072b988d80cc69d85d257438f8846b))

# [9.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.7.0...@bitgo/abstract-utxo@9.8.0) (2024-12-19)

### Bug Fixes

- **abstract-utxo:** pass actual wallet to signTransaction ([1024bff](https://github.com/BitGo/BitGoJS/commit/1024bff44bd5387a908703336e83ca7f6e4c9edc))
- **abstract-utxo:** remove txHex check from postProcessPrebuild ([7e7c047](https://github.com/BitGo/BitGoJS/commit/7e7c04757320f8af2f1235e34b8cea1cf6b8a442))

### Features

- **abstract-utxo:** enforce import order lint rule ([c6f0d09](https://github.com/BitGo/BitGoJS/commit/c6f0d093fceefdd7035212bf00fd2c3ac458b5bd))
- **abstract-utxo:** extract signer keychain earlier ([048c240](https://github.com/BitGo/BitGoJS/commit/048c240138c833bd4782f4c606a37a47d41dc6a5))
- **abstract-utxo:** implement sign for descriptor wallets ([24eaced](https://github.com/BitGo/BitGoJS/commit/24eacedc9f77c7308ceb06dc06dca6c9742581a0))

# [9.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.5.0...@bitgo/abstract-utxo@9.7.0) (2024-12-17)

### Features

- **abstract-utxo:** add getKeySignatures function ([cbbf6e3](https://github.com/BitGo/BitGoJS/commit/cbbf6e34918fd499fbdf9f2325b123238dc0ebee))
- **abstract-utxo:** implement explainTx for descriptor wallets ([36bca5b](https://github.com/BitGo/BitGoJS/commit/36bca5b230f60b7fd3766079c7adc8b0be66a9ed))
- **abstract-utxo:** implement parseTransaction for descriptor ([9573556](https://github.com/BitGo/BitGoJS/commit/957355697b233a164fb889ed52bda17805780d93))
- **abstract-utxo:** implement verifyTransaction ([8261e50](https://github.com/BitGo/BitGoJS/commit/8261e50c4fb20454704f3b544d4d7bc0edb71cad))
- **abstract-utxo:** permit Wsh2Of3CltvDrop in descriptor validation ([95a393f](https://github.com/BitGo/BitGoJS/commit/95a393faaa44ea6a6018773b06bc916b4ad1420b))

# [9.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.5.0...@bitgo/abstract-utxo@9.6.0) (2024-12-17)

### Features

- **abstract-utxo:** add getKeySignatures function ([cbbf6e3](https://github.com/BitGo/BitGoJS/commit/cbbf6e34918fd499fbdf9f2325b123238dc0ebee))
- **abstract-utxo:** implement explainTx for descriptor wallets ([36bca5b](https://github.com/BitGo/BitGoJS/commit/36bca5b230f60b7fd3766079c7adc8b0be66a9ed))
- **abstract-utxo:** implement parseTransaction for descriptor ([9573556](https://github.com/BitGo/BitGoJS/commit/957355697b233a164fb889ed52bda17805780d93))
- **abstract-utxo:** implement verifyTransaction ([8261e50](https://github.com/BitGo/BitGoJS/commit/8261e50c4fb20454704f3b544d4d7bc0edb71cad))
- **abstract-utxo:** permit Wsh2Of3CltvDrop in descriptor validation ([95a393f](https://github.com/BitGo/BitGoJS/commit/95a393faaa44ea6a6018773b06bc916b4ad1420b))

# [9.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.4.0...@bitgo/abstract-utxo@9.5.0) (2024-12-12)

### Bug Fixes

- **abstract-utxo:** fix decodeTransaction for base64 input ([c00ade0](https://github.com/BitGo/BitGoJS/commit/c00ade0e16b7af07f69b4981eae7245ff331549e))
- **abstract-utxo:** fix mocha config ([b4931d1](https://github.com/BitGo/BitGoJS/commit/b4931d10381e0ca959d256bcf559b0820f7696b7))
- **abstract-utxo:** remove outputDifference ([caebae1](https://github.com/BitGo/BitGoJS/commit/caebae110e970056483a172fea4fd262808c62bc))

### Features

- **abstract-utxo:** add .json files to .prettierignore ([ffbff4e](https://github.com/BitGo/BitGoJS/commit/ffbff4ed40c9c3097fc8d04939548990de4c2101))
- **abstract-utxo:** add DescriptorBuilder and parser ([e25bc68](https://github.com/BitGo/BitGoJS/commit/e25bc6883626629d6fc244ca8dcb6af7142ca734))
- **abstract-utxo:** add descriptorWallet explainPsbt ([897d369](https://github.com/BitGo/BitGoJS/commit/897d369cd94c1ad12a3d68ede75f56a88efdd2a2))
- **abstract-utxo:** add isDescriptorWalletData ([017ba2c](https://github.com/BitGo/BitGoJS/commit/017ba2c1405f7d5ff0a9f81bc4c639b0fb7657b1))
- **abstract-utxo:** add outputDifference utility ([02f84bc](https://github.com/BitGo/BitGoJS/commit/02f84bcfef19bb36b44367bcf29fc60a4c6188d6))
- **abstract-utxo:** guard against descriptor wallets ([45dda5a](https://github.com/BitGo/BitGoJS/commit/45dda5abbdcad98494572a22479d0721ea0f5501))
- **abstract-utxo:** improve isDescriptorWallet family ([b92855e](https://github.com/BitGo/BitGoJS/commit/b92855e4c89840e5b2c9d114cb4181edef217d81))
- **abstract-utxo:** permit BIP32Interface in descriptor utils ([baa9290](https://github.com/BitGo/BitGoJS/commit/baa92902d9407dd5b9178e3bbf92701629b20cb2))
- **abstract-utxo:** validate descriptors depending on env ([dcd9793](https://github.com/BitGo/BitGoJS/commit/dcd9793ab3b070ac38334c8b66c484725e21d749))

# [9.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.3.0...@bitgo/abstract-utxo@9.4.0) (2024-12-11)

### Features

- **abstract-utxo:** add apply option to toPlainObject ([6eae1ca](https://github.com/BitGo/BitGoJS/commit/6eae1ca0a46f36cef19cbd839abb4b68d972089b))
- **abstract-utxo:** add package src/core ([6ca55f5](https://github.com/BitGo/BitGoJS/commit/6ca55f5fb0df16e2a38fcd7a9bcd7286bbb68d5d))
- **abstract-utxo:** enable esModuleInterop ([f99aa90](https://github.com/BitGo/BitGoJS/commit/f99aa90ad656b62eeae8c094d57caf5ae883eb7c))
- **abstract-utxo:** include test files in tsconfig.json ([c2187fb](https://github.com/BitGo/BitGoJS/commit/c2187fbf1d5ea150cc8a69630e1b819dd2a300e0))
- **abstract-utxo:** update wasm-miniscript to 2.0.0-beta.2 ([cec5cd7](https://github.com/BitGo/BitGoJS/commit/cec5cd72f5ea1b7eed074a3ef436e21cf7362733))

# [9.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.2.2...@bitgo/abstract-utxo@9.3.0) (2024-12-03)

### Features

- **abstract-utxo:** make AbstractUtxoCoin less abstract ([e456e04](https://github.com/BitGo/BitGoJS/commit/e456e04628c773b72e77e06c094e6c56e0d9661d))

## [9.2.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.2.1...@bitgo/abstract-utxo@9.2.2) (2024-11-26)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.2.0...@bitgo/abstract-utxo@9.2.1) (2024-11-21)

### Bug Fixes

- validate addresses created matches the requested format ([01006ee](https://github.com/BitGo/BitGoJS/commit/01006ee65a4e036c0268ca96e2c435df8337027b))

# [9.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.1.2...@bitgo/abstract-utxo@9.2.0) (2024-11-19)

### Bug Fixes

- **abstract-utxo:** rename isExtendedAddressFormat to isScriptRecipient ([c37b2a5](https://github.com/BitGo/BitGoJS/commit/c37b2a50fec7c4a60706e0cb906b40c2d47990ef))

### Features

- **abstract-utxo:** explain and verify tx with op return ([04f8518](https://github.com/BitGo/BitGoJS/commit/04f851884ab245fd25eb9ee2858743263a5e99d9))
- fix scriptPubKey prefix ([9d9ce34](https://github.com/BitGo/BitGoJS/commit/9d9ce34330583cd65aba082c623024e0d9ab1505)), closes [/github.com/bitcoin/bitcoin/blob/v28.0/src/rpc/blockchain.cpp#L657](https://github.com//github.com/bitcoin/bitcoin/blob/v28.0/src/rpc/blockchain.cpp/issues/L657)

## [9.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.1.2...@bitgo/abstract-utxo@9.1.3) (2024-11-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.1.1...@bitgo/abstract-utxo@9.1.2) (2024-11-08)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.1.0...@bitgo/abstract-utxo@9.1.1) (2024-11-07)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.0.3...@bitgo/abstract-utxo@9.1.0) (2024-11-01)

### Features

- update public-types ([85f8d0f](https://github.com/BitGo/BitGoJS/commit/85f8d0fcf1c1e8bf85088406b0ff3de62aab180d))

## [9.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.0.2...@bitgo/abstract-utxo@9.0.3) (2024-10-22)

### Bug Fixes

- **abstract-utxo:** fix isValidAddress by generating all addr formats ([5be7bfc](https://github.com/BitGo/BitGoJS/commit/5be7bfcfebacadd1b6eed85ca3ed2c134bfff829))
- **abstract-utxo:** use param in isValidAddress ([ec9165a](https://github.com/BitGo/BitGoJS/commit/ec9165a9bf32eb09ecf97942839e40c3133e7256))

## [9.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.0.1...@bitgo/abstract-utxo@9.0.2) (2024-10-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [9.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@9.0.0...@bitgo/abstract-utxo@9.0.1) (2024-10-08)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [9.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.14.4...@bitgo/abstract-utxo@9.0.0) (2024-10-04)

### chore

- **utxo-lib:** remove unnecessary properties from WalletUnspent ([159f667](https://github.com/BitGo/BitGoJS/commit/159f66715cf8aa0f485d4df601556b0564cc6cfa))

### Features

- add btc testnet4 to sdk ([8edfa40](https://github.com/BitGo/BitGoJS/commit/8edfa40e24fa5061f104e7e59a8e55c2dd27a0b8))

### BREAKING CHANGES

- **utxo-lib:** removes fields from WalletUnspent type

Issue: BTC-1351

## [8.14.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.14.3...@bitgo/abstract-utxo@8.14.4) (2024-09-24)

### Bug Fixes

- **abstract-utxo:** address verification ([7d67509](https://github.com/BitGo/BitGoJS/commit/7d67509cbdbf2595d3298ea4609d6b2ed6efcada))

## [8.14.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.14.2...@bitgo/abstract-utxo@8.14.3) (2024-09-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.14.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.14.1...@bitgo/abstract-utxo@8.14.2) (2024-09-16)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.14.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.14.0...@bitgo/abstract-utxo@8.14.1) (2024-09-10)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.13.2...@bitgo/abstract-utxo@8.14.0) (2024-09-03)

### Features

- **abstract-utxo:** add address creation for descriptor wallets ([a5b3a71](https://github.com/BitGo/BitGoJS/commit/a5b3a71132f588c61033e44cd7a5ab0be54f0722))

## [8.13.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.13.1...@bitgo/abstract-utxo@8.13.2) (2024-08-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.13.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.13.0...@bitgo/abstract-utxo@8.13.1) (2024-08-27)

### Bug Fixes

- **abstract-utxo:** do not throw error when cannot verify psbt ccw ([0fadd86](https://github.com/BitGo/BitGoJS/commit/0fadd86ad4e7a6b6a79f5c919f8bbc36f9fa23a5))
- **abstract-utxo:** fix change wallet verification ([1d27e87](https://github.com/BitGo/BitGoJS/commit/1d27e87bd053733b7970ed749de12fda506826a3))

# [8.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.12.0...@bitgo/abstract-utxo@8.13.0) (2024-08-20)

### Features

- default to psbt format for btc hot wallets ([0e12c94](https://github.com/BitGo/BitGoJS/commit/0e12c9466c89281fbeb1035e48d7abea96ccdebe))

## [8.12.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.12.0...@bitgo/abstract-utxo@8.12.1) (2024-08-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.11.2...@bitgo/abstract-utxo@8.12.0) (2024-08-07)

### Features

- add bitgo signet for btc ([a1912b9](https://github.com/BitGo/BitGoJS/commit/a1912b9478211568b29b2ea8986dc62db435f6ab))

## [8.11.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.11.1...@bitgo/abstract-utxo@8.11.2) (2024-07-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.11.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.11.0...@bitgo/abstract-utxo@8.11.1) (2024-07-24)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.10.0...@bitgo/abstract-utxo@8.11.0) (2024-07-16)

### Bug Fixes

- disable PSBT for zcash ([f7c79ca](https://github.com/BitGo/BitGoJS/commit/f7c79ca7491cf34746b78b8aa4bc74e4305c7dfd))

### Features

- put `changeAddress` in `expectedOutputs` if ([70f3cbf](https://github.com/BitGo/BitGoJS/commit/70f3cbfbdc03e61ecaf1e329beeb7f70170dc683))

# [8.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.9.0...@bitgo/abstract-utxo@8.10.0) (2024-07-04)

### Bug Fixes

- make public signet tests work with bitgo module ([fe32ae3](https://github.com/BitGo/BitGoJS/commit/fe32ae31241176762e608f1b43b0ab54976efe1c))

### Features

- **abstract-utxo:** allow non-segwit signing by looking at txHex ([09e355a](https://github.com/BitGo/BitGoJS/commit/09e355a73c28dd807893c0e027b4c723a42d003d))

# [8.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.8.1...@bitgo/abstract-utxo@8.9.0) (2024-07-02)

### Features

- add `sweep` function for v1 wallets ([a78e2cf](https://github.com/BitGo/BitGoJS/commit/a78e2cfaec23d3a1d129b757e0bcba76ce12addf))
- export `BitGoV1Unspent` interface from `abstract-utxo` ([c6d9e63](https://github.com/BitGo/BitGoJS/commit/c6d9e63dde2404f6250a138a049dadc7a408328a))

## [8.8.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.8.0...@bitgo/abstract-utxo@8.8.1) (2024-06-27)

### Bug Fixes

- find change address instead of using index ([81aad0c](https://github.com/BitGo/BitGoJS/commit/81aad0c7abc7e0da8f1d623f3a780dba3a67a708))

# [8.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.7.2...@bitgo/abstract-utxo@8.8.0) (2024-06-26)

### Bug Fixes

- **abstract-utxo:** remove unused coinSpecific in isWalletAddress ([b3e7e38](https://github.com/BitGo/BitGoJS/commit/b3e7e385ea6dc421937db875fe3c2a305285a01a))

### Features

- **abstract-utxo:** allow non-standard signing on bulk tx ([214342f](https://github.com/BitGo/BitGoJS/commit/214342f8a16848a7827d98ee239d72db742f84bc))
- **abstract-utxo:** do not query wp for output addresses if psbt ([500baf6](https://github.com/BitGo/BitGoJS/commit/500baf6001cbece5caa0003139f7db654fe6f742))

## [8.7.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.7.0...@bitgo/abstract-utxo@8.7.2) (2024-06-21)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.7.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.7.0...@bitgo/abstract-utxo@8.7.1) (2024-06-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.6.1...@bitgo/abstract-utxo@8.7.0) (2024-06-14)

### Bug Fixes

- correctly parse the response of `/fees/recommended` from Mempool ([e7455a8](https://github.com/BitGo/BitGoJS/commit/e7455a8057a6ece91b73fe373ecd1742282a8c28))

### Features

- add `recover` function for v1 btc wallets ([16e3b25](https://github.com/BitGo/BitGoJS/commit/16e3b2550baab6d15795ee8314935ee3f13c5af1))

## [8.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.6.0...@bitgo/abstract-utxo@8.6.1) (2024-06-11)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.5.0...@bitgo/abstract-utxo@8.6.0) (2024-06-05)

### Features

- **utxo-lib:** add signPsbtFromOVC ([59db80f](https://github.com/BitGo/BitGoJS/commit/59db80fcd2d07d145049b6f2dfbdccb6c1931606))

### Reverts

- Revert "feat: use psbt format for hot and custodial wallets" ([4d027c8](https://github.com/BitGo/BitGoJS/commit/4d027c8c218fca8228544f22f1b413e2ba507463))

# [8.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.4.0...@bitgo/abstract-utxo@8.5.0) (2024-05-31)

### Features

- use cashaddr address format for ecash recovery ([072f11f](https://github.com/BitGo/BitGoJS/commit/072f11f9e2b8b10c91d9ddf4e0503dc3a1e13563))
- use psbt format for hot and custodial wallets ([7b66a58](https://github.com/BitGo/BitGoJS/commit/7b66a584ce304093e03a372dafad9152ef875e7b))

# [8.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.3.1...@bitgo/abstract-utxo@8.4.0) (2024-05-28)

### Features

- add p2tr as the last option ([673c7d8](https://github.com/BitGo/BitGoJS/commit/673c7d8444be8147ca2b3803e641ab35890e6521))
- remove p2tr from changeAddressType list ([561a8bd](https://github.com/BitGo/BitGoJS/commit/561a8bdd4f785a4e8ef483e0271a40a4a5c192d9))

## [8.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.3.0...@bitgo/abstract-utxo@8.3.1) (2024-05-22)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.2.1...@bitgo/abstract-utxo@8.3.0) (2024-05-17)

### Features

- remove conditional p2trMusig2 check ([9683f33](https://github.com/BitGo/BitGoJS/commit/9683f3325fd454a804a60894c618ee0212acc6b2))
- send changeAddressType preferences array ([bd18c9e](https://github.com/BitGo/BitGoJS/commit/bd18c9e5e897655036676db49070858e11b6e028))

## [8.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.2.0...@bitgo/abstract-utxo@8.2.1) (2024-05-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.3...@bitgo/abstract-utxo@8.2.0) (2024-05-08)

### Features

- use canonical address when checking if owned by wallet ([82a13bd](https://github.com/BitGo/BitGoJS/commit/82a13bdaed9cf4f7ae5a1aa87e6ff7d92bf989eb))

### Reverts

- Revert "Revert "feat(abstract-utxo): support trustless change outputs from explaintx"" ([03896f6](https://github.com/BitGo/BitGoJS/commit/03896f65ecaaa85f6a5a9be9d45012d848329938))

## [8.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.2...@bitgo/abstract-utxo@8.1.3) (2024-05-01)

### Reverts

- Revert "feat(abstract-utxo): support trustless change outputs from explaintx" ([23442a9](https://github.com/BitGo/BitGoJS/commit/23442a9873ae432c1d5efee8a3b3d4c0c3a772e2))

## [8.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.1...@bitgo/abstract-utxo@8.1.2) (2024-04-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.0...@bitgo/abstract-utxo@8.1.1) (2024-04-24)

### Bug Fixes

- superagent upgrade to 9.0 ([6e9aa43](https://github.com/BitGo/BitGoJS/commit/6e9aa43a6d2999298abd450ceb168d664b8b926d))

# [8.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.6...@bitgo/abstract-utxo@8.1.0) (2024-04-22)

### Features

- **abstract-utxo:** support trustless change outputs from explaintx ([445ed53](https://github.com/BitGo/BitGoJS/commit/445ed5357c24357b5f9137669551e146bf2f2e60))
- only query unspents for wallet owned addresses ([5beaff5](https://github.com/BitGo/BitGoJS/commit/5beaff54e8fc11b642c13e3ac17ffd6b6ff4752c))

## [8.0.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.5...@bitgo/abstract-utxo@8.0.6) (2024-04-17)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.4...@bitgo/abstract-utxo@8.0.5) (2024-04-12)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.3...@bitgo/abstract-utxo@8.0.4) (2024-04-10)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.2...@bitgo/abstract-utxo@8.0.3) (2024-04-09)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.1...@bitgo/abstract-utxo@8.0.2) (2024-04-08)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.0...@bitgo/abstract-utxo@8.0.1) (2024-04-05)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.4...@bitgo/abstract-utxo@8.0.0) (2024-03-28)

### Features

- **root:** deprecate node 16 ([d3ec624](https://github.com/BitGo/BitGoJS/commit/d3ec6240bddae2a4ab7fa80c4a16efecc36210bd))

### BREAKING CHANGES

- **root:** Node 16 is no longer supported in bitgojs.
  TICKET: WP-1100

## [7.0.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.3...@bitgo/abstract-utxo@7.0.4) (2024-03-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [7.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.2...@bitgo/abstract-utxo@7.0.3) (2024-03-11)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [7.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.1...@bitgo/abstract-utxo@7.0.2) (2024-02-28)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [7.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.0...@bitgo/abstract-utxo@7.0.1) (2024-02-22)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [7.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@7.0.0) (2024-02-19)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- pass down `includeRbf: true` while fetching tx to be replaced ([4a5d9f0](https://github.com/BitGo/BitGoJS/commit/4a5d9f02db9a45a179bcaa3369493e2c57ecdf40))
- rectify the external/internal recipients handling for RBF ([6f0be13](https://github.com/BitGo/BitGoJS/commit/6f0be13918ac7afbeddb222819a243a44a46fd5b))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [6.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@6.0.0) (2024-01-30)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [5.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@5.0.0) (2024-01-26)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [4.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@4.0.0) (2024-01-26)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [3.32.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.32.0) (2024-01-25)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.31.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.31.0) (2024-01-22)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.30.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.30.0) (2024-01-09)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.29.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.29.0) (2024-01-03)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.28.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.28.0) (2023-12-18)

### Bug Fixes

- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.27.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.27.0) (2023-12-12)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.26.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.26.0) (2023-12-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.25.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.25.0) (2023-12-05)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.24.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.24.0) (2023-11-28)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.23.0) (2023-11-24)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.22.0) (2023-11-17)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.21.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.20.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.19.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.18.0) (2023-10-20)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.17.0) (2023-10-18)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.16.0) (2023-09-25)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.15.0) (2023-09-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.14.0) (2023-09-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.13.0) (2023-09-07)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.12.0) (2023-09-05)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.11.0) (2023-09-01)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.10.0) (2023-08-29)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.9.0) (2023-08-25)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.8.0) (2023-08-24)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.7.0) (2023-08-16)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.6.0) (2023-08-16)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.3.0...@bitgo/abstract-utxo@3.5.0) (2023-08-04)

### Features

- **abstract-utxo:** add psbt support backup recovery ([b312a86](https://github.com/BitGo/BitGoJS/commit/b312a86091c1320b4d7a02bd1ca5c3d2056c00c6))
- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))
- **utxo-lib:** extract half signed tx from psbt ([3145474](https://github.com/BitGo/BitGoJS/commit/31454748fcea6df7fbbf886937abc48b36fb9cbd))

# [3.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.3.0...@bitgo/abstract-utxo@3.4.0) (2023-07-28)

### Features

- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))
- **utxo-lib:** extract half signed tx from psbt ([3145474](https://github.com/BitGo/BitGoJS/commit/31454748fcea6df7fbbf886937abc48b36fb9cbd))

# [3.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.2.0...@bitgo/abstract-utxo@3.3.0) (2023-07-18)

### Features

- **abstract-utxo:** always use bitcoin network for validating secondary key signatures ([d9b7022](https://github.com/BitGo/BitGoJS/commit/d9b7022832ed38d8661b842add34caa97f340d31))
- **abstract-utxo:** move keysSignatures test to separate file ([b9fa5c5](https://github.com/BitGo/BitGoJS/commit/b9fa5c57ae6207974612c96c4cf0941665703a4e))

# [3.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.1.2...@bitgo/abstract-utxo@3.2.0) (2023-06-21)

### Features

- **abstract-utxo:** support express external signer for musig2 inputs ([4401367](https://github.com/BitGo/BitGoJS/commit/44013673d564c976ae7b55788369dc48acbec64f))
- **utxo-lib:** add extractTransaction to UtxoPsbt ([0c41982](https://github.com/BitGo/BitGoJS/commit/0c41982de5b9397e69b314272c4e0f38bb6f69c3))

## [3.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.1.1...@bitgo/abstract-utxo@3.1.2) (2023-06-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [3.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.1.0...@bitgo/abstract-utxo@3.1.1) (2023-06-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [3.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.0.0...@bitgo/abstract-utxo@3.1.0) (2023-06-07)

### Features

- **abstract-utxo:** make walletId param optional for signtx ([f5aff50](https://github.com/BitGo/BitGoJS/commit/f5aff5087727fb1842dc7cda64756553ab364c2b))

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.3.0...@bitgo/abstract-utxo@3.0.0) (2023-06-05)

### Bug Fixes

- **utxo-lib:** use PsbtInput instead of UtxoPsbt ([1f73539](https://github.com/BitGo/BitGoJS/commit/1f73539409cf69fc55ab8aedb9d8873bb82bc375))

### Features

- **abstract-utxo:** add psbt support to explain and verify Tx ([4189659](https://github.com/BitGo/BitGoJS/commit/41896593cdc180cb5a60145a8d31fdf55dba6bb2))

### BREAKING CHANGES

- **utxo-lib:** functions signature is changed

# [2.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.2.1...@bitgo/abstract-utxo@2.3.0) (2023-05-25)

### Features

- **abstract-utxo:** add psbt and musig2 support for sdk-api ([7a23991](https://github.com/BitGo/BitGoJS/commit/7a23991079e5609d43d7483f8137189163943dfc))

## [2.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.2.0...@bitgo/abstract-utxo@2.2.1) (2023-05-17)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [2.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.3...@bitgo/abstract-utxo@2.2.0) (2023-05-10)

### Features

- **sdk-coin-btc:** find & use supplementary unspents in case ([fc321ee](https://github.com/BitGo/BitGoJS/commit/fc321ee1fccfae2d6676070fb32d8d4dee531aaf))

## [2.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.2...@bitgo/abstract-utxo@2.1.3) (2023-05-03)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [2.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.1...@bitgo/abstract-utxo@2.1.2) (2023-04-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [2.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.0...@bitgo/abstract-utxo@2.1.1) (2023-04-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [2.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.0.1...@bitgo/abstract-utxo@2.1.0) (2023-04-13)

### Bug Fixes

- **sdk-coin-btc:** get rootwalletkeys for inscription transfer ([b160186](https://github.com/BitGo/BitGoJS/commit/b16018643273e20ea6908f51149139def7209932))

### Features

- **utxo-lib:** create p2tr address using musig2 ([699e829](https://github.com/BitGo/BitGoJS/commit/699e8291f4a205ba0b2071c6369f2c8843b8a945))

## [2.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.0.0...@bitgo/abstract-utxo@2.0.1) (2023-02-17)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [2.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.5...@bitgo/abstract-utxo@2.0.0) (2023-02-16)

### Bug Fixes

- accept apiKey for recoverFromWrongChain ([3f27775](https://github.com/BitGo/BitGoJS/commit/3f2777506326ae08d0e5d211146522af0d15c3f2))
- convert addr to canonical addr during wrongChainRecovery ([2089596](https://github.com/BitGo/BitGoJS/commit/20895964eeac1eedc9f859f0ce9b607313cc6568))
- **sdk-core:** mark pub as optional in Keychain interface ([7d6012c](https://github.com/BitGo/BitGoJS/commit/7d6012cf1058e43d96e129dc2b1607b5316dca1c))

### Features

- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))
- use UtxoApi to facilitate cross chain recoveries ([61151aa](https://github.com/BitGo/BitGoJS/commit/61151aa2634b7fa89f995a85940fd680f87cf854))

### BREAKING CHANGES

- **sdk-core:** Keychain.pub is now optional

# [1.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.5...@bitgo/abstract-utxo@1.12.0) (2023-02-08)

### Bug Fixes

- accept apiKey for recoverFromWrongChain ([3f27775](https://github.com/BitGo/BitGoJS/commit/3f2777506326ae08d0e5d211146522af0d15c3f2))
- convert addr to canonical addr during wrongChainRecovery ([2089596](https://github.com/BitGo/BitGoJS/commit/20895964eeac1eedc9f859f0ce9b607313cc6568))

### Features

- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))
- use UtxoApi to facilitate cross chain recoveries ([61151aa](https://github.com/BitGo/BitGoJS/commit/61151aa2634b7fa89f995a85940fd680f87cf854))

# [1.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.5...@bitgo/abstract-utxo@1.11.0) (2023-01-30)

### Features

- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))
- use UtxoApi to facilitate cross chain recoveries ([61151aa](https://github.com/BitGo/BitGoJS/commit/61151aa2634b7fa89f995a85940fd680f87cf854))

## [1.10.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.4...@bitgo/abstract-utxo@1.10.5) (2023-01-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.3...@bitgo/abstract-utxo@1.10.4) (2022-12-23)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.2...@bitgo/abstract-utxo@1.10.3) (2022-12-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.1...@bitgo/abstract-utxo@1.10.2) (2022-12-09)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.0...@bitgo/abstract-utxo@1.10.1) (2022-12-06)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.9.0...@bitgo/abstract-utxo@1.10.0) (2022-12-01)

### Features

- **abstract-utxo:** add valueString to unspents for doge recovery flow ([439f95c](https://github.com/BitGo/BitGoJS/commit/439f95c4e337e33a0812ac28b03e46b52e4a9fde))

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.9.0) (2022-11-29)

### Bug Fixes

- fix unit-test-all errors ([4adab4d](https://github.com/BitGo/BitGoJS/commit/4adab4dd363cdd4c21bd964fd3b6d5581bd63e46))
- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **abstract-utxo:** allow for override in isValidAddress ([1d02d98](https://github.com/BitGo/BitGoJS/commit/1d02d988401b6abc00336f67687a7b01d682989e))
- **root:** add support for cross chain recovery for bcha ([f9ab941](https://github.com/BitGo/BitGoJS/commit/f9ab941055eaf79f6623b40e9aac982124f78843))
- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))
- **utxo-lib:** simplify isValidAddress ([cf826fe](https://github.com/BitGo/BitGoJS/commit/cf826fe4d0a32f09888d2218028b24ce33a6aa92))

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.8.0) (2022-11-04)

### Bug Fixes

- fix unit-test-all errors ([4adab4d](https://github.com/BitGo/BitGoJS/commit/4adab4dd363cdd4c21bd964fd3b6d5581bd63e46))
- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.6.0) (2022-10-27)

### Bug Fixes

- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.5.0) (2022-10-25)

### Bug Fixes

- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.6...@bitgo/abstract-utxo@1.4.0) (2022-10-18)

### Bug Fixes

- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))

### Features

- **abstract-utxo:** add support for bigints from new utxo-lib ([77c60dd](https://github.com/BitGo/BitGoJS/commit/77c60ddd4d0ddd1e82a8b1bb041686a9c7f39fae))
- **abstract-utxo:** backup key recovery service for doge ([612be53](https://github.com/BitGo/BitGoJS/commit/612be533836f33fdecb9584ddc0f5674df31dcb0))
- **abstract-utxo:** cross chain recovery support for bigint coins (doge) ([ad6bf71](https://github.com/BitGo/BitGoJS/commit/ad6bf71f58a4bae79f3bb014ee947a878f4b89d2))
- **sdk-core:** added large value support while calling WP ([870621e](https://github.com/BitGo/BitGoJS/commit/870621e2bc93d15ed6f040379353d039eb17e609))
- **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))

# [1.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.6...@bitgo/abstract-utxo@1.1.0) (2022-07-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.4...@bitgo/abstract-utxo@1.1.0-rc.6) (2022-07-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.4...@bitgo/abstract-utxo@1.1.0-rc.5) (2022-07-18)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.3...@bitgo/abstract-utxo@1.1.0-rc.4) (2022-07-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.1...@bitgo/abstract-utxo@1.1.0-rc.3) (2022-07-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.1...@bitgo/abstract-utxo@1.1.0-rc.2) (2022-07-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.0...@bitgo/abstract-utxo@1.1.0-rc.1) (2022-07-12)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.15...@bitgo/abstract-utxo@1.1.0-rc.0) (2022-07-11)

### Features

- check network argument in AbstractUtxoCoin constructor ([4a36223](https://github.com/BitGo/BitGoJS/commit/4a3622341ed4011ba04acab0a5d799b79941d1c4))

## [1.0.1-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.14...@bitgo/abstract-utxo@1.0.1-rc.15) (2022-07-07)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.13...@bitgo/abstract-utxo@1.0.1-rc.14) (2022-07-05)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.12...@bitgo/abstract-utxo@1.0.1-rc.13) (2022-07-01)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.11...@bitgo/abstract-utxo@1.0.1-rc.12) (2022-06-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.10...@bitgo/abstract-utxo@1.0.1-rc.11) (2022-06-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.8...@bitgo/abstract-utxo@1.0.1-rc.10) (2022-06-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.8...@bitgo/abstract-utxo@1.0.1-rc.9) (2022-06-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.7...@bitgo/abstract-utxo@1.0.1-rc.8) (2022-06-27)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.6...@bitgo/abstract-utxo@1.0.1-rc.7) (2022-06-23)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.5...@bitgo/abstract-utxo@1.0.1-rc.6) (2022-06-22)

### Bug Fixes

- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))

## [1.0.1-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.4...@bitgo/abstract-utxo@1.0.1-rc.5) (2022-06-21)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.3...@bitgo/abstract-utxo@1.0.1-rc.4) (2022-06-16)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.2...@bitgo/abstract-utxo@1.0.1-rc.3) (2022-06-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.1...@bitgo/abstract-utxo@1.0.1-rc.2) (2022-06-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.0...@bitgo/abstract-utxo@1.0.1-rc.1) (2022-06-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

## 1.0.1-rc.0 (2022-06-10)

### Bug Fixes

- **abstract-utxo:** add bsv replay protection case ([5e166cb](https://github.com/BitGo/BitGoJS/commit/5e166cbbc89ff10bd59308debf8f43dd18de0c47))
