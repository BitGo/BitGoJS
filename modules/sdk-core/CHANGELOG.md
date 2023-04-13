# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@7.0.1...@bitgo/sdk-core@8.0.0) (2023-04-13)

### Bug Fixes

- **bitgo:** add argument to create address on ofc wallets ([b1a212d](https://github.com/BitGo/BitGoJS/commit/b1a212d05962719822c8420acf4f01dc6e012d16))
- conditional check to custodial consolidation ([46cda4e](https://github.com/BitGo/BitGoJS/commit/46cda4e97bf060dd886d86bc254a6f709c09fe11))
- **sdk-core:** add new function in BaseCoin to get hash-function ([e028b31](https://github.com/BitGo/BitGoJS/commit/e028b31b3954810ee6c3fd7fdfa6ed4a07aa458e))
- **sdk-core:** add walletpassphrase to message signing ([7265c67](https://github.com/BitGo/BitGoJS/commit/7265c674e4934c00309525b4474d34c137a53cb9))
- **sdk-core:** change testnet ada node url in config ([8e7e185](https://github.com/BitGo/BitGoJS/commit/8e7e185c20c4c631a89ffb8a4074d80bd673b2dc))
- **sdk-core:** create reqid if not present ([758c198](https://github.com/BitGo/BitGoJS/commit/758c198aaf6a04553d0031f4a429aa109aa8f11e))
- **sdk-core:** eth tss receive address ([a67a98a](https://github.com/BitGo/BitGoJS/commit/a67a98a82e8a19c1f1c126900e273691be08d70c))
- **sdk-core:** fix parameter misordering for user gpg key ([225246e](https://github.com/BitGo/BitGoJS/commit/225246e7d52974c216e3b4ff7cfaf9edb213eb3e))
- **sdk-core:** return txreqid and raw message ([89944a5](https://github.com/BitGo/BitGoJS/commit/89944a5b23caea91bf7e9f61732abcd90bd0c61a))
- used derived keys and use xonly public key for script ([382ce07](https://github.com/BitGo/BitGoJS/commit/382ce073b660f2d002176e3a8fdcadcf5bbaff6a))

### Features

- add inscription builder class ([214eafe](https://github.com/BitGo/BitGoJS/commit/214eafe48e8d12fd5d58efac289bab33bbd46fd3))
- express route for signing arbitrary payloads ([808acec](https://github.com/BitGo/BitGoJS/commit/808acecc68d40edeb93f8365e45a01746cf98f97))
- **sdk-coin-btc:** transfer an inscription ([bc2eda8](https://github.com/BitGo/BitGoJS/commit/bc2eda86f73a4e4451fd6accbc2a794f08649b78))
- **sdk-coin-polygon:** support evm based cross chain recovery ([a88681f](https://github.com/BitGo/BitGoJS/commit/a88681f8428bcb6617ee2c7cfe5e8294b603af9f))
- **sdk-coin-sui:** add mystenlab types and remove old impl of transfer ([4a8aeaa](https://github.com/BitGo/BitGoJS/commit/4a8aeaa97cb372dfaa2b364fd9c617f47f037d03))
- **sdk-core:** add `switchValidator` for stakingWallet ([c067695](https://github.com/BitGo/BitGoJS/commit/c0676959b9f103ef45439ce32412cca27bf81642))
- **sdk-core:** add sha256 hash support in ecdsa tss signing ([b43d733](https://github.com/BitGo/BitGoJS/commit/b43d7330aa15174fdc07fc6800d19dd88055deb2))
- **sdk-core:** add signedChildPsbt to halfSigned object ([f1c1ac5](https://github.com/BitGo/BitGoJS/commit/f1c1ac59e9c45ea01d8133bcac502c67a465a000))
- **sdk-core:** allow passing a list of delegations for eth ([e6b7022](https://github.com/BitGo/BitGoJS/commit/e6b70226eb7735931c433c0888b8bbd0f8594234))
- **sdk-core:** enable fillNonce and acceleration tx for receive address ([09f05f3](https://github.com/BitGo/BitGoJS/commit/09f05f3f18994e5bd0600ba2f98f2f860ea85bd0))
- **utxo-lib:** create p2tr address using musig2 ([699e829](https://github.com/BitGo/BitGoJS/commit/699e8291f4a205ba0b2071c6369f2c8843b8a945))

### BREAKING CHANGES

- **sdk-core:** return txreqid, raw message, and txhash instead of just txhash

Ticket: BG-68940

## [7.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@7.0.0...@bitgo/sdk-core@7.0.1) (2023-02-17)

### Bug Fixes

- append bitgo challenge to bitgo a share ([4ef60e5](https://github.com/BitGo/BitGoJS/commit/4ef60e56d33d36c6ac0ba74986c45d19b52914e3))
- polygon recovery with range proof ([19317f7](https://github.com/BitGo/BitGoJS/commit/19317f709354e61b3e4947870049e99f85556029))
- use post on get challenge end-point ([f2a8320](https://github.com/BitGo/BitGoJS/commit/f2a8320ea985132e052ab81472043a47ec7f57c1))

# [7.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@5.1.0...@bitgo/sdk-core@7.0.0) (2023-02-16)

### Bug Fixes

- **account-lib:** modify ECDSA keyShare to use bip32 lib ([9ce8f23](https://github.com/BitGo/BitGoJS/commit/9ce8f2330307e884cec99900433a7085c82e2b3c))
- **bitgo:** remove enforcement of HMAC verification on all non-prod environments ([118722c](https://github.com/BitGo/BitGoJS/commit/118722c80bfcf8cfc850e07d575ecf10aacb3fd2))
- **sdk-core:** correct ecdsa verifyWalletSigs() ([3b1476c](https://github.com/BitGo/BitGoJS/commit/3b1476cab6ae9a4888a03e15685e70f539df02c2))
- **sdk-core:** ecdsa signing vss share ([c9acc46](https://github.com/BitGo/BitGoJS/commit/c9acc46a64d3468f5bfa644f1c22b0348b096f7c))
- **sdk-core:** eddsa signing vss share ([ae40423](https://github.com/BitGo/BitGoJS/commit/ae404230eec93c0eb2ddfc386fdb18fc42e17c12))
- **sdk-core:** fix ecdsa tss wallet creation ([cd0eaec](https://github.com/BitGo/BitGoJS/commit/cd0eaec629da42cddcc9a2d16b93f5a8ba0ce3c1))
- **sdk-core:** fix tau and gamma selection according to whitepaper ([0a647e1](https://github.com/BitGo/BitGoJS/commit/0a647e1345716557f8c3320f16caf4c6aa13259e))
- **sdk-core:** get low balance forwarder ([6b8205c](https://github.com/BitGo/BitGoJS/commit/6b8205c449e2f5fe3dca0247d92dfdf2fdb6ef58))
- **sdk-core:** make derivation play nicely with rangeproofs ([26ad5b5](https://github.com/BitGo/BitGoJS/commit/26ad5b58ff72caa1859a9e6d9c8376f140e8213b))
- **sdk-core:** mark pub as optional in Keychain interface ([7d6012c](https://github.com/BitGo/BitGoJS/commit/7d6012cf1058e43d96e129dc2b1607b5316dca1c))
- **sdk-core:** reduce size of beta0 and nu0 per revised whitepaper ([94d50c9](https://github.com/BitGo/BitGoJS/commit/94d50c91b375aa8155eae71f1ad41d66ffbd37c5))
- **sdk-core:** sign typed data json stringify ([8adbb76](https://github.com/BitGo/BitGoJS/commit/8adbb76667a54c2e460f6d72a5de5bd6ce793d19))
- **sdk-core:** update fixtures and fix tests ([c936478](https://github.com/BitGo/BitGoJS/commit/c9364786d7d11c9fbb621109efb1fb43a894e9d4))
- **sdk-core:** update password for tss ([ab83d5d](https://github.com/BitGo/BitGoJS/commit/ab83d5d440e5624cadc1f0f247634ac310b68c8d))
- **sdk-core:** use hex toString() verify ecdsa ([aead4a4](https://github.com/BitGo/BitGoJS/commit/aead4a4e02842b552e7fc21927fedc8320148cb5))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))
- move vss proof data to be with signature share ([a2d2e11](https://github.com/BitGo/BitGoJS/commit/a2d2e11c26c36f15f4463fb50da8de4a399b7f34))
- **sdk-coin-sui:** add switch delegation tx ([08e6f94](https://github.com/BitGo/BitGoJS/commit/08e6f94d1640dd1796bafc7bd18bc7a35e76f8fd))
- **sdk-core:** add challenge endpoint for tss rangeproof ([fbd1019](https://github.com/BitGo/BitGoJS/commit/fbd101980fb88813cf1971d7f2915a830e10088e))
- **sdk-core:** add ecdsa to verifyShareProof() ([9be664b](https://github.com/BitGo/BitGoJS/commit/9be664b8ee4267e20e0a40d30653d3bd3795b205))
- **sdk-core:** add ecdsa wallet sig verification ([375be2d](https://github.com/BitGo/BitGoJS/commit/375be2d86002258ba11012888fea41094dabc39b))
- **sdk-core:** add range proofs ([0087be9](https://github.com/BitGo/BitGoJS/commit/0087be954030cf375aaa1ac1f6e78dee390addba))
- **sdk-core:** add type property to Keychain ([5092b29](https://github.com/BitGo/BitGoJS/commit/5092b29a653ae5e5abb7320f65a7d926a7e4cc9f))
- **sdk-core:** allow consolidateUnspents method to only build the tx also ([790f2d1](https://github.com/BitGo/BitGoJS/commit/790f2d1d1451c3ce4ffade7609eb0cd23424f43c))
- **sdk-core:** change beta to random coprime ([48f4dc6](https://github.com/BitGo/BitGoJS/commit/48f4dc69342989bdc386413656dc8f35255c0975))
- **sdk-core:** delete unused proof from mu share ([c621945](https://github.com/BitGo/BitGoJS/commit/c6219450ab99d716ba7bf7d3d9d8936bd2e1a994))
- **sdk-core:** ecdsa signing use derivation path ([f4ca720](https://github.com/BitGo/BitGoJS/commit/f4ca720587822fd295b1a97f78c9127c2576a46d))
- **sdk-core:** include keyShares in third party backup tss keychain ([c5997de](https://github.com/BitGo/BitGoJS/commit/c5997de87f85bb012665cfe538705eeadbb522cc))
- **sdk-core:** only generate range proof if ntilde present ([d332395](https://github.com/BitGo/BitGoJS/commit/d332395aa29f0491e3ff34681da156850f556766))
- **sdk-core:** rename type ([c81221f](https://github.com/BitGo/BitGoJS/commit/c81221f3961abe3d73f4bf3c8801fb7f1b4f9b27))
- **sdk-core:** use fix sized buffers when filling e preimage ([77cca38](https://github.com/BitGo/BitGoJS/commit/77cca388c54c6fb3e94e66ab394e52ea11dba329))
- **sdk-core:** use trust backup gpg for encrypting ([400a9af](https://github.com/BitGo/BitGoJS/commit/400a9af34a5eb1933965bfc675911cd24b8c605b))
- send enterprise id to backupkeys end-point ([701ff7c](https://github.com/BitGo/BitGoJS/commit/701ff7c1aa41ea82ce06b09b36613f0781ad5e9d))

### BREAKING CHANGES

- **sdk-core:** Keychain.pub is now optional
- **sdk-core:** rename type backupGpgKey to BackupGpgKey
- **sdk-core:** The `verifyEdShareProof` function is renamed to
  `verifyShareProof` and now expects a 4th parameter which must be a
  string of either `eddsa` or `ecdsa`.

# [6.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@5.1.0...@bitgo/sdk-core@6.0.0) (2023-02-08)

### Bug Fixes

- **bitgo:** remove enforcement of HMAC verification on all non-prod environments ([118722c](https://github.com/BitGo/BitGoJS/commit/118722c80bfcf8cfc850e07d575ecf10aacb3fd2))
- **sdk-core:** correct ecdsa verifyWalletSigs() ([3b1476c](https://github.com/BitGo/BitGoJS/commit/3b1476cab6ae9a4888a03e15685e70f539df02c2))
- **sdk-core:** fix ecdsa tss wallet creation ([cd0eaec](https://github.com/BitGo/BitGoJS/commit/cd0eaec629da42cddcc9a2d16b93f5a8ba0ce3c1))
- **sdk-core:** get low balance forwarder ([6b8205c](https://github.com/BitGo/BitGoJS/commit/6b8205c449e2f5fe3dca0247d92dfdf2fdb6ef58))
- **sdk-core:** make derivation play nicely with rangeproofs ([26ad5b5](https://github.com/BitGo/BitGoJS/commit/26ad5b58ff72caa1859a9e6d9c8376f140e8213b))
- **sdk-core:** sign typed data json stringify ([8adbb76](https://github.com/BitGo/BitGoJS/commit/8adbb76667a54c2e460f6d72a5de5bd6ce793d19))
- **sdk-core:** update fixtures and fix tests ([c936478](https://github.com/BitGo/BitGoJS/commit/c9364786d7d11c9fbb621109efb1fb43a894e9d4))
- **sdk-core:** update password for tss ([ab83d5d](https://github.com/BitGo/BitGoJS/commit/ab83d5d440e5624cadc1f0f247634ac310b68c8d))
- **sdk-core:** use hex toString() verify ecdsa ([aead4a4](https://github.com/BitGo/BitGoJS/commit/aead4a4e02842b552e7fc21927fedc8320148cb5))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))
- **sdk-core:** add challenge endpoint for tss rangeproof ([fbd1019](https://github.com/BitGo/BitGoJS/commit/fbd101980fb88813cf1971d7f2915a830e10088e))
- **sdk-core:** add ecdsa to verifyShareProof() ([9be664b](https://github.com/BitGo/BitGoJS/commit/9be664b8ee4267e20e0a40d30653d3bd3795b205))
- **sdk-core:** add ecdsa wallet sig verification ([375be2d](https://github.com/BitGo/BitGoJS/commit/375be2d86002258ba11012888fea41094dabc39b))
- **sdk-core:** add range proofs ([0087be9](https://github.com/BitGo/BitGoJS/commit/0087be954030cf375aaa1ac1f6e78dee390addba))
- **sdk-core:** add type property to Keychain ([5092b29](https://github.com/BitGo/BitGoJS/commit/5092b29a653ae5e5abb7320f65a7d926a7e4cc9f))
- **sdk-core:** change beta to random coprime ([48f4dc6](https://github.com/BitGo/BitGoJS/commit/48f4dc69342989bdc386413656dc8f35255c0975))
- **sdk-core:** delete unused proof from mu share ([c621945](https://github.com/BitGo/BitGoJS/commit/c6219450ab99d716ba7bf7d3d9d8936bd2e1a994))
- **sdk-core:** ecdsa signing use derivation path ([f4ca720](https://github.com/BitGo/BitGoJS/commit/f4ca720587822fd295b1a97f78c9127c2576a46d))
- **sdk-core:** include keyShares in third party backup tss keychain ([c5997de](https://github.com/BitGo/BitGoJS/commit/c5997de87f85bb012665cfe538705eeadbb522cc))
- **sdk-core:** only generate range proof if ntilde present ([d332395](https://github.com/BitGo/BitGoJS/commit/d332395aa29f0491e3ff34681da156850f556766))
- **sdk-core:** rename type ([c81221f](https://github.com/BitGo/BitGoJS/commit/c81221f3961abe3d73f4bf3c8801fb7f1b4f9b27))
- **sdk-core:** use fix sized buffers when filling e preimage ([77cca38](https://github.com/BitGo/BitGoJS/commit/77cca388c54c6fb3e94e66ab394e52ea11dba329))
- **sdk-core:** use trust backup gpg for encrypting ([400a9af](https://github.com/BitGo/BitGoJS/commit/400a9af34a5eb1933965bfc675911cd24b8c605b))
- send enterprise id to backupkeys end-point ([701ff7c](https://github.com/BitGo/BitGoJS/commit/701ff7c1aa41ea82ce06b09b36613f0781ad5e9d))

### BREAKING CHANGES

- **sdk-core:** rename type backupGpgKey to BackupGpgKey
- **sdk-core:** The `verifyEdShareProof` function is renamed to
  `verifyShareProof` and now expects a 4th parameter which must be a
  string of either `eddsa` or `ecdsa`.

# [5.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@5.1.0...@bitgo/sdk-core@5.2.0) (2023-01-30)

### Bug Fixes

- **bitgo:** remove enforcement of HMAC verification on all non-prod environments ([118722c](https://github.com/BitGo/BitGoJS/commit/118722c80bfcf8cfc850e07d575ecf10aacb3fd2))
- **sdk-core:** get low balance forwarder ([6b8205c](https://github.com/BitGo/BitGoJS/commit/6b8205c449e2f5fe3dca0247d92dfdf2fdb6ef58))

### Features

- **sdk-core:** add ecdsa wallet sig verification ([375be2d](https://github.com/BitGo/BitGoJS/commit/375be2d86002258ba11012888fea41094dabc39b))

# [5.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@5.0.0...@bitgo/sdk-core@5.1.0) (2023-01-25)

### Bug Fixes

- **sdk-core:** allow sync pallier key generation for ovc ([3a91129](https://github.com/BitGo/BitGoJS/commit/3a9112963c89a960fc81ea12207ae7ca67faf378))
- **sdk-core:** remove generic typing from typeddata associated with eip712 ([ac1047e](https://github.com/BitGo/BitGoJS/commit/ac1047ea482f7751dd145d538de3412e738e30e9))
- **sdk-core:** send the passphrase as correct field for eddsa ([1aea3c2](https://github.com/BitGo/BitGoJS/commit/1aea3c285001e409cdcf4c5eacfb83426d46b14f))

### Features

- **sdk-core:** add extra params for addKey ([43e095e](https://github.com/BitGo/BitGoJS/commit/43e095efa52fefd25dd977ed8cd271fb146780ca))
- **sdk-core:** add keepAlive as a whitelisted consolidate param ([f503969](https://github.com/BitGo/BitGoJS/commit/f5039697f04941ed04e4e96e42d794fc09aaf429))
- **sdk-core:** add u value proof for ecdsa ([1ae0107](https://github.com/BitGo/BitGoJS/commit/1ae01076e503d57729a528a21044940526bfe917))
- **sdk-core:** change third party to backupGpgKey ([817fd86](https://github.com/BitGo/BitGoJS/commit/817fd86f7269bd3a62ddf3aad14b4bc1f6beb2d7))
- **sdk-core:** ecdsa tss return tx request detail ([90a6b6d](https://github.com/BitGo/BitGoJS/commit/90a6b6de6112e61b5d2cca142d12c9e7bac9c072))
- **sdk-core:** forwarder version 3 ([82e6deb](https://github.com/BitGo/BitGoJS/commit/82e6debac071486435c51ce3f52f8352bdb8a8fb))
- **sdk-core:** get bitgo public key based on coin and feature flags ([c5cee95](https://github.com/BitGo/BitGoJS/commit/c5cee95fa8005a8a83cf5c5afc01f35e3235d970))
- send vss proof and privateShareProof to bitgo as backup ([dd348e7](https://github.com/BitGo/BitGoJS/commit/dd348e7a02600965d96460010ef7dd37cf672f82))

# [5.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@4.3.0...@bitgo/sdk-core@5.0.0) (2022-12-23)

### Bug Fixes

- remove final sig construction for message signing ([c7c8a98](https://github.com/BitGo/BitGoJS/commit/c7c8a988449264c0be0d422b89f4390d713e9064))

### Features

- **sdk-core:** support fund forwader ([7dbab14](https://github.com/BitGo/BitGoJS/commit/7dbab14c74ae5faf99289f1cf2a3aacc558f6987))

### BREAKING CHANGES

- remove final sig construction

# [4.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@4.2.1...@bitgo/sdk-core@4.3.0) (2022-12-20)

### Bug Fixes

- **sdk-coin-avaxp:** fix parseTransaction throwing error for pending ([c9fea95](https://github.com/BitGo/BitGoJS/commit/c9fea9505616557ea7e27d34829adc4ffa922697))
- **sdk-core:** fix generate wallets isCold param ([ff22908](https://github.com/BitGo/BitGoJS/commit/ff229088405cf09be4bc86bdbdee340b37b551a6))

### Features

- added eip712 sign typed data ([6d2cbea](https://github.com/BitGo/BitGoJS/commit/6d2cbeaa04de80c12b41dcd1e88f886011f46b30))
- **core:** add register to base interface ([2c08793](https://github.com/BitGo/BitGoJS/commit/2c087937608f6fa6246cf44a29c91ef40713fb74))
- **sdk-coin-eth:** add support for tss recoveries ([5954c7d](https://github.com/BitGo/BitGoJS/commit/5954c7dd1d32b2f60e8c41d31d7b205ccc51ecc4))
- **sdk-core:** allow forwarder version 2 ([7b9a05b](https://github.com/BitGo/BitGoJS/commit/7b9a05b89f68ac13858911e002be7adf3304646f))
- **sdk-core:** derive unhardened method for ecdsa ([4684bff](https://github.com/BitGo/BitGoJS/commit/4684bff6cfaf7071f3b454327afe4067d65318c9))

## [4.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@4.2.0...@bitgo/sdk-core@4.2.1) (2022-12-09)

**Note:** Version bump only for package @bitgo/sdk-core

# [4.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@4.1.0...@bitgo/sdk-core@4.2.0) (2022-12-06)

### Features

- **sdk-coin-polygon:** crossChainRecovery support ([9b42813](https://github.com/BitGo/BitGoJS/commit/9b4281333a8d3835219e566e31cba28ab448c85f))
- **sdk-core:** add source destination chain to send many ([1b27a48](https://github.com/BitGo/BitGoJS/commit/1b27a486e4be24cb2a66606e9ddf35699280393c))

# [4.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@4.0.0...@bitgo/sdk-core@4.1.0) (2022-12-01)

### Bug Fixes

- **sdk-core:** fix tss signing ([79882b1](https://github.com/BitGo/BitGoJS/commit/79882b1b3a2f722877aaa1def76aba10776717aa))
- **sdk-core:** whitelist source and destination chain params ([5724d22](https://github.com/BitGo/BitGoJS/commit/5724d22130ebacf65e1545cab18ee602e1dff231))
- update ofc coin for ibasecoin changes ([65986c6](https://github.com/BitGo/BitGoJS/commit/65986c6405e2771b6c7c85dd8b62bf99d6cd8c41))

### Features

- **bitgo:** add api version input ([42f353f](https://github.com/BitGo/BitGoJS/commit/42f353f0b33857963d66739d34b0d0cac85e82db))
- **sdk-core:** add keyDerive to ECDSA TSS implementation ([9ff1d89](https://github.com/BitGo/BitGoJS/commit/9ff1d89ba0e42d53640f0fe7b71c53d1a2eb4a10))

# [4.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.2.0...@bitgo/sdk-core@4.0.0) (2022-11-29)

### Bug Fixes

- disable vss verification ([5cdc53b](https://github.com/BitGo/BitGoJS/commit/5cdc53b2e2440524c6ba11109f50eb41222c3f3e))
- fix eddsa proof generation ([8a9253b](https://github.com/BitGo/BitGoJS/commit/8a9253bd2339b5c6bc7ca5093a09750b81931e32))
- fix unit-test-all errors ([4adab4d](https://github.com/BitGo/BitGoJS/commit/4adab4dd363cdd4c21bd964fd3b6d5581bd63e46))
- multiple issues with message signing ([d703b9a](https://github.com/BitGo/BitGoJS/commit/d703b9a6149c4fe26ad16001f5f681389c8f8aba))
- pass custodianId to prebuildTxWithIntent ([1b14921](https://github.com/BitGo/BitGoJS/commit/1b14921d32dd12c0fdaff1c168538c6481f8fbbb))
- remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
- **sdk-coin-avaxc:** add tx type to fee estimation and build params ([83a12be](https://github.com/BitGo/BitGoJS/commit/83a12be8d41a8796160737ccb48a9a3e98495042))
- **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
- **sdk-core:** add destinationChain to prebuild whitelisted params ([95b3e13](https://github.com/BitGo/BitGoJS/commit/95b3e1372dddc6b5652152416d7451a809beb095))
- **sdk-core:** add hopParams & sourceChain to prebuild whitelisted params ([feef8c9](https://github.com/BitGo/BitGoJS/commit/feef8c96cba79cd7073ad9e18b6fcd66f5a00bcb))
- **sdk-core:** disabling vss for eddsa ([7c91d14](https://github.com/BitGo/BitGoJS/commit/7c91d1485f879ebe7a3435871f1d8dafc8f1eef8))
- **sdk-core:** ecdsa sharing wallet ([8645e3b](https://github.com/BitGo/BitGoJS/commit/8645e3b111406888f544cba2cceb3093f16fcad2))
- **sdk-core:** ecdsa tss wallet creation ([2fd5f41](https://github.com/BitGo/BitGoJS/commit/2fd5f4143f4586bb770d9c508316490d57753a32))
- **sdk-core:** eddsa vss ([de1fbd6](https://github.com/BitGo/BitGoJS/commit/de1fbd6179190cc0dae4054088cfb50402286589))
- **sdk-core:** pass custodianMessageId in signMessage ([84cf0cc](https://github.com/BitGo/BitGoJS/commit/84cf0ccec3f31786b6e38509e3bb73fca1e52a57))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))
- **sdk-core:** vss ([01be344](https://github.com/BitGo/BitGoJS/commit/01be34475a036640a9d842f3f657f46d49a45517))
- typo in intent name for message signing ([a855dbb](https://github.com/BitGo/BitGoJS/commit/a855dbbf7f03f49fb56563231f0d434b320f0083))

### Features

- add cancel staking request ([7e053fd](https://github.com/BitGo/BitGoJS/commit/7e053fddd93888ff73a5c03924cc1c42623bff32))
- add units functions to sdk core ([583885d](https://github.com/BitGo/BitGoJS/commit/583885dae0d7ecada83b65b985fc0d35b3fad21f))
- **bitgo:** sdk script to get token balance from wallet ([67086f8](https://github.com/BitGo/BitGoJS/commit/67086f8bf844a91ef4ecebead004fb63f520a23f))
- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- **express:** consolidate account support in external signer ([414e0df](https://github.com/BitGo/BitGoJS/commit/414e0dfc1f33d02f740db2e2e9d5af28166d9f72))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add function to verify wallet signatures for TSS ([0e6840e](https://github.com/BitGo/BitGoJS/commit/0e6840e4b9a89aea30e784e0acede2377937fe6c))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))
- **sdk-core:** added date params to getInvoice query ([f782dbb](https://github.com/BitGo/BitGoJS/commit/f782dbb7d5308b9154c27553690cd2ab23774d3d))
- **sdk-core:** added get payments method for lightning ([fd22577](https://github.com/BitGo/BitGoJS/commit/fd22577755be722ac98ddae21108787adf7d4c13))
- **sdk-core:** change sendMany to work for custodial wallets ([45eb658](https://github.com/BitGo/BitGoJS/commit/45eb65883cb5a5f28fca486fec31215cddae8f69))
- **sdk-core:** expect txid response for lightning withdrawal ([22dfeab](https://github.com/BitGo/BitGoJS/commit/22dfeabda3923a104a4f86e820375c32d05d6879))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

### BREAKING CHANGES

- **sdk-core:** Key shares require a `v` value for combination.
  ISSUE: BG-57633

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.2.0...@bitgo/sdk-core@3.0.0) (2022-11-04)

### Bug Fixes

- disable vss verification ([5cdc53b](https://github.com/BitGo/BitGoJS/commit/5cdc53b2e2440524c6ba11109f50eb41222c3f3e))
- fix eddsa proof generation ([8a9253b](https://github.com/BitGo/BitGoJS/commit/8a9253bd2339b5c6bc7ca5093a09750b81931e32))
- fix unit-test-all errors ([4adab4d](https://github.com/BitGo/BitGoJS/commit/4adab4dd363cdd4c21bd964fd3b6d5581bd63e46))
- remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
- **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
- **sdk-core:** ecdsa sharing wallet ([8645e3b](https://github.com/BitGo/BitGoJS/commit/8645e3b111406888f544cba2cceb3093f16fcad2))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))
- **sdk-core:** allow preBuildTransaction to accept wallet id ([a797e38](https://github.com/BitGo/BitGoJS/commit/a797e38b0269bc0ea6e4834f0aca4605ef297265))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

### BREAKING CHANGES

- **sdk-core:** Key shares require a `v` value for combination.
  ISSUE: BG-57633

# [2.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.2.0...@bitgo/sdk-core@2.4.0) (2022-10-27)

### Bug Fixes

- **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

# [2.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@2.2.0...@bitgo/sdk-core@2.3.0) (2022-10-25)

### Bug Fixes

- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))

### Features

- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- implement isWalletAddress for SUI ([a3696ab](https://github.com/BitGo/BitGoJS/commit/a3696ab00f693da2db4ef32034a85504dc5aa4c5))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

# [2.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.29...@bitgo/sdk-core@2.2.0) (2022-10-18)

### Bug Fixes

- **account-lib:** fix EDDSA MPC key validation for small number keys ([f9f7407](https://github.com/BitGo/BitGoJS/commit/f9f740721a91f8351df40b3b4d89f2c393acd7cf))
- **account-lib:** shamir secret indices validity ([4e22783](https://github.com/BitGo/BitGoJS/commit/4e227839d5c1fb84a583f17d8754b46324f4eef9))
- add 'preview' as whitelisted param for token enablement ([a998ecc](https://github.com/BitGo/BitGoJS/commit/a998ecc0b018ac3ce21db91df7cc6c5ad29f76a4))
- allow token enablement for cold wallet ([557e79b](https://github.com/BitGo/BitGoJS/commit/557e79bb543dde8cbddd89ec13f424e9827aa4c3))
- **bitgo:** remove address param from lightning().deposit ([b49ec63](https://github.com/BitGo/BitGoJS/commit/b49ec638e130633508cdc64fe6a3bdaaafed5aef))
- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
- **root:** align versions of bitcoinjs-lib ([b7eb929](https://github.com/BitGo/BitGoJS/commit/b7eb92998836a5945627ef1c80d74414b11f4867))
- **root:** resolve [@noble-secp256k1](https://github.com/noble-secp256k1) ([5faefa2](https://github.com/BitGo/BitGoJS/commit/5faefa298d8d366e9f499bca81189b7c0a0eceb8))
- **sdk-coin-eth:** fix convert signature share to/from ([9aed51e](https://github.com/BitGo/BitGoJS/commit/9aed51ee96aefef29ef1cf11b0ce821b996ce08e))
- **sdk-coin-eth:** fixes to the sign and verify functions for eth tss ([ce79269](https://github.com/BitGo/BitGoJS/commit/ce7926985886cfd48a174df4ea1341e1ec388f8b))
- **sdk-core:** add missing ecdsa helper type ([92d49f2](https://github.com/BitGo/BitGoJS/commit/92d49f28bf33940f315754825916aabf0cda072e))
- **sdk-core:** allow for optional passphrase on tss wallets ([f334232](https://github.com/BitGo/BitGoJS/commit/f3342328a85c78ab9d886478bfd027239f2251d8))
- **sdk-core:** allow undefined for amtPaidSats ([7e9e9ea](https://github.com/BitGo/BitGoJS/commit/7e9e9eac7cab9ef41bc08e82704b90a8aeb46de9))
- **sdk-core:** default wallet to non tss ([26febd4](https://github.com/BitGo/BitGoJS/commit/26febd42bc12fe417fecb1896e8ff5313be9fc18))
- **sdk-core:** ecdsa commonkeychain validation ([269e16b](https://github.com/BitGo/BitGoJS/commit/269e16bf694f32396c753e58a78de3c2d036338d))
- **sdk-core:** ecdsa keychain creation types mach ([1224de3](https://github.com/BitGo/BitGoJS/commit/1224de3f707759f4ef22836a80c3b834ec04b98d))
- **sdk-core:** ecdsa send signing bitgo's n share u ([1cb1e93](https://github.com/BitGo/BitGoJS/commit/1cb1e933c692f454de538b3b189ef2feb1b39475))
- **sdk-core:** ecdsa sign serializedTxHex ([2fda8fc](https://github.com/BitGo/BitGoJS/commit/2fda8fc364f357a66645665b7793182baf2efbcb))
- **sdk-core:** ecdsa signing get user share ([acbc700](https://github.com/BitGo/BitGoJS/commit/acbc7002c9ffd62c78e6dd2e72feac0c3ff4fe45))
- **sdk-core:** ecdsa tss signing flow update ([226586c](https://github.com/BitGo/BitGoJS/commit/226586ce2f1af6f5593bb97c3a297f332aee3b34))
- **sdk-core:** eth supports tss ([c0ec96f](https://github.com/BitGo/BitGoJS/commit/c0ec96fac7c5b4131d4f32d09463a78c0e1f8900))
- **sdk-core:** fix lightning requests params ([32b2038](https://github.com/BitGo/BitGoJS/commit/32b2038dab7e93a525efcbf34df65e44ad8eb39a))
- **sdk-core:** fix send token enablements by writing in buildParams in prebuildTx ([9dc933a](https://github.com/BitGo/BitGoJS/commit/9dc933a878b2a70adc69cd329883f668a8943aa0))
- **sdk-core:** fix the signatures of lnurl pay methods ([6ffc17a](https://github.com/BitGo/BitGoJS/commit/6ffc17a025b9a79b33a334abdcbaa0f0d06e8a49))
- **sdk-core:** fix tss ecdsa keychain encryption ([95f9c2d](https://github.com/BitGo/BitGoJS/commit/95f9c2d7d1018d387dc6cabd89e5c0d14b9f07d3))
- **sdk-core:** tss signing ([f17491d](https://github.com/BitGo/BitGoJS/commit/f17491d24db4086bf4b9ae692ea782803723568e))
- **sdk-core:** tss tx signing ([ab7eb80](https://github.com/BitGo/BitGoJS/commit/ab7eb8079ea37e347727db106d01fe9362f36374))
- **sdk-core:** tss wallet creation related bugs ([500c735](https://github.com/BitGo/BitGoJS/commit/500c73527edd902b65cfd784ea1022a21e0f6319))
- update AddWalletOptions ([64578e0](https://github.com/BitGo/BitGoJS/commit/64578e078129aa6503fd9d6193c57eddc5c4d27e))

### Features

- **abstract-eth:** validate istss for evms ([29f0b5a](https://github.com/BitGo/BitGoJS/commit/29f0b5aa875c4a6a727f9b3e9a073740230c4fb8))
- **abstract-utxo:** add support for bigints from new utxo-lib ([77c60dd](https://github.com/BitGo/BitGoJS/commit/77c60ddd4d0ddd1e82a8b1bb041686a9c7f39fae))
- **account-lib:** add option to pass in custom seed ecdsa ([86b205e](https://github.com/BitGo/BitGoJS/commit/86b205e342ca5610ce460877a64f4733f944bf6e))
- **account-lib:** add support for additional hash algorithms ([4e2aefe](https://github.com/BitGo/BitGoJS/commit/4e2aefe8bb7754f891e5f9919f591ad1cc04b34d))
- **account-lib:** custom salt shamir share ([fa34652](https://github.com/BitGo/BitGoJS/commit/fa346529b5dc9897b6bbf6fb4a05ac77f2f05b2d))
- add message signing support for polygon ([ab2bac1](https://github.com/BitGo/BitGoJS/commit/ab2bac13dad55ce8571d014796298aa52a24a5f2))
- add u value proof during tss eddssa key creation ([79d2c91](https://github.com/BitGo/BitGoJS/commit/79d2c91ea5b101f8cad9b107b9e4426939333c5f))
- adding support for message signing ([01c6303](https://github.com/BitGo/BitGoJS/commit/01c63032d067e6ba5aef78804ea747b5e62709fe))
- **bitgo:** support chaincodes on BLS-DKG keychains creation ([bfaa380](https://github.com/BitGo/BitGoJS/commit/bfaa380551d2fe90e041975b392d4398c781074a))
- **express:** adding EdDSA TSS support to external signer ([dbccabc](https://github.com/BitGo/BitGoJS/commit/dbccabc7b1b2c1258108e6b38f853c676f8a6562))
- **express:** support routes to prebuildAndSignTransaction ([b7f0ec3](https://github.com/BitGo/BitGoJS/commit/b7f0ec37f6ea9a948c229003bdee023066d62b68))
- **sdk-coin-ada:** implement recover function for cardano ([9bc3eeb](https://github.com/BitGo/BitGoJS/commit/9bc3eebac95621e1301c258027c87ab69cacc2da))
- **sdk-coin-avaxc:** add recover method for wrw ([40fb9a9](https://github.com/BitGo/BitGoJS/commit/40fb9a9b7a74ee043ee5d5a2618ecae065f8758b))
- **sdk-coin-avaxp:** implement export tx builder ([483d9ce](https://github.com/BitGo/BitGoJS/commit/483d9ce67b75ca5eb4c1330f59820b18043cdb6c))
- **sdk-coin-avaxp:** implement tx builder for import on p ([f52d124](https://github.com/BitGo/BitGoJS/commit/f52d124a1dbf4be9fe7010eaa2460aa6a60a56ea))
- **sdk-coin-dot:** implement recover function for dot ([66f8cba](https://github.com/BitGo/BitGoJS/commit/66f8cba4bd79598ab8197472bb1ad595d0026d60))
- **sdk-coin-eth:** add acceleration capability for eth ([436ba8c](https://github.com/BitGo/BitGoJS/commit/436ba8ceb478c4028d5b05dc34bb623be6fc581f))
- **sdk-coin-ethw:** add ethw sdk module ([63e9850](https://github.com/BitGo/BitGoJS/commit/63e9850c27039d1b614d14426a1d9b090d454b76))
- **sdk-coin-ethw:** use ETHw full node RPC queries to recover funds ([7db9bcd](https://github.com/BitGo/BitGoJS/commit/7db9bcd61549e4e96d8f745211717586eec4535c))
- **sdk-coin-polygon:** support recovery ([15d6021](https://github.com/BitGo/BitGoJS/commit/15d602164d3a2b504d7995e65aa0fbcb38f98e89))
- **sdk-coin-sol:** implemented recover function for solana ([f043033](https://github.com/BitGo/BitGoJS/commit/f0430338371c58bebb53dbc8a7cf45ce51599fc7))
- **sdk-coin-sol:** sol token multi ata init ([736318f](https://github.com/BitGo/BitGoJS/commit/736318fff36f074fa841b97f3bc0c8cd95fae001))
- **sdk-core:** add createDepositAddress to lightning ([e7056dc](https://github.com/BitGo/BitGoJS/commit/e7056dc48448d69328d29bd223c179eb6486a40e))
- **sdk-core:** add createInvoice to lightning ([293a5d6](https://github.com/BitGo/BitGoJS/commit/293a5d6badd73def299b4f8420bc3380bb862cb2))
- **sdk-core:** add deposit() to lightning object ([aeb483d](https://github.com/BitGo/BitGoJS/commit/aeb483d2cd2baf49659674f9b9ad7a9d37fcf672))
- **sdk-core:** add enable token support for sol ([dde3a95](https://github.com/BitGo/BitGoJS/commit/dde3a952b45f9e49d61bdc92d7cddaff1a646c08))
- **sdk-core:** add getBalance for lightning ([ccd2e81](https://github.com/BitGo/BitGoJS/commit/ccd2e817cddda09709ae3d65a91d7fd122661f5c))
- **sdk-core:** add getInvoices to lightning object ([232bea3](https://github.com/BitGo/BitGoJS/commit/232bea30d95a4b6f9554cc0416c54f0f73a979ad))
- **sdk-core:** add helper to create backup TSS key share held by BitGo ([d5921ad](https://github.com/BitGo/BitGoJS/commit/d5921ad6c0a90b9a0e5ec7d60b86fd8741550b5c))
- **sdk-core:** add helper to finish backup TSS key share held by BitGo ([f2d85b5](https://github.com/BitGo/BitGoJS/commit/f2d85b5132c9466a70dea645598dbbf95c677c4d))
- **sdk-core:** add includeTokens wallet.addresses parameter ([8c03d83](https://github.com/BitGo/BitGoJS/commit/8c03d8363e3e3b56b6c7f18b0e098d68f25d54c2))
- **sdk-core:** add logic to handle ERC20 tokens for staking ([c77a253](https://github.com/BitGo/BitGoJS/commit/c77a253d18815483a516de2a83e8778f82e6a5ab))
- **sdk-core:** add more ecdsa helper methods ([aa57eac](https://github.com/BitGo/BitGoJS/commit/aa57eacdc97f2ecac4179f76461d798226178ba8))
- **sdk-core:** add payInvoice to lightning object ([eaaa48d](https://github.com/BitGo/BitGoJS/commit/eaaa48d10a8d0cc74b2ac97e0d0d97feba88d72a))
- **sdk-core:** add recid to fully constructed signature ([a8adcd9](https://github.com/BitGo/BitGoJS/commit/a8adcd9c3f452f1dfc85454668c19103cec7160d))
- **sdk-core:** add specialized enable token functions ([3e60cef](https://github.com/BitGo/BitGoJS/commit/3e60cef71a0ae76b378356508338738eac49a920))
- **sdk-core:** add support for delegation in staking flow ([0c91edb](https://github.com/BitGo/BitGoJS/commit/0c91edb8ef4c76b577726abb3f4899f318f8ca17))
- **sdk-core:** add support for enabling tokens on cold and custodial wallets ([e15c69c](https://github.com/BitGo/BitGoJS/commit/e15c69c4b38b7de74bd73627904960ad086b5f44))
- **sdk-core:** add withdraw to lightning object ([99474b5](https://github.com/BitGo/BitGoJS/commit/99474b581023b228ce6f2713f5b5d58c8d1186d6))
- **sdk-core:** added large value support while calling WP ([870621e](https://github.com/BitGo/BitGoJS/commit/870621e2bc93d15ed6f040379353d039eb17e609))
- **sdk-core:** added verification of private share proofs ([66d6c63](https://github.com/BitGo/BitGoJS/commit/66d6c63bd102da49727e3bdb275cfa6231859ce5))
- **sdk-core:** allow getting a staking wallet for any coin ([cfae0fe](https://github.com/BitGo/BitGoJS/commit/cfae0feeb14c1bcb30dad2840abd8489372bfbc8))
- **sdk-core:** capitalize transaction type enum ([bce263e](https://github.com/BitGo/BitGoJS/commit/bce263e01ebf70119ddefd572f55c3a69f15751c))
- **sdk-core:** create ILightning interface ([6a2f347](https://github.com/BitGo/BitGoJS/commit/6a2f347983ee0e8abba5e457159842e4d1f56f50))
- **sdk-core:** ecdsa type converters ([800b01b](https://github.com/BitGo/BitGoJS/commit/800b01b02194011bc0ac608a5d75094f935d6235))
- **sdk-core:** handle multiple token enables on chains that don't support it ([11302e9](https://github.com/BitGo/BitGoJS/commit/11302e97add128f6c11146373ef40637ec36ce95))
- **sdk-core:** implement signing flow ecdsa ([68aa561](https://github.com/BitGo/BitGoJS/commit/68aa561193fe0574bd7b7080bb51d1d795cf31f9))
- **sdk-core:** parse zero value lightning invoices ([78cab72](https://github.com/BitGo/BitGoJS/commit/78cab722387bd6348cb81951c2e611db231484e0))
- **sdk-core:** support lnurl pay ([6df91a3](https://github.com/BitGo/BitGoJS/commit/6df91a3eac28bf55600d5e856a297dde6b56c826))
- **sdk-core:** support transfertoken type transactions ([6579785](https://github.com/BitGo/BitGoJS/commit/65797851062fb7beb3b1eb6a1db00e23f0a3c209))
- **sdk-core:** use eth wallet for building and signing token txs ([82dd4a9](https://github.com/BitGo/BitGoJS/commit/82dd4a9a19f144dfdf83afd40155532d4df3163c))
- the client needs to generate a gpg key for their backup key share and share it with bitgo ([fb10fae](https://github.com/BitGo/BitGoJS/commit/fb10fae409761363fd8a3bb489011c34f041140c))
- update to work with bitcoinjs-lib@6 ([1950934](https://github.com/BitGo/BitGoJS/commit/1950934d9426385ee12b204cc7456327e4480618))
- **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))

### Reverts

- Revert "feat: add keypair to acala module" ([ac4f700](https://github.com/BitGo/BitGoJS/commit/ac4f7001f7e77e6bfce4bb49d7fe4307d51c70b7))

### BREAKING CHANGES

- **sdk-core:** change to upper case first char of addDelegator and addValidator
  BG-56847
- **sdk-core:** The SShare type's `r` field is now `R` (33 bytes encoded as 66 hex characters).
  ISSUE: BG-56664
- **sdk-coin-avaxc:** The interface TransactionPrebuild is no longer exported
  from package. It's defined in @bitgo/sdk-coin-eth.
- **sdk-core:** We need to deal with the new enableToken intent type for solana on wp.
- **bitgo:** This breaks the current ETH2 Hot Wallet creation flow. Needs BG-46182 to be
  implemented and deployed too.

BG-46184

# [1.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-core@1.1.0-rc.29...@bitgo/sdk-core@1.1.0) (2022-07-19)

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
