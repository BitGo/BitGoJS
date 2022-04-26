## [14.0.0](https://github.com/BitGo/BitGoJS/compare/1.9.1...14.0.0) (2022-04-26)


### ⚠ BREAKING CHANGES

* **account-lib:** Builder method changing

STLX-14028
* **core:** Methods that previously implemented `verifyAddress` incorrectly will
now throw `MethodNotImplementedError()` instead.

Issue: BG-43225
* **account-lib:** BlsKeyPair is not just a default prv and pub object, instead it has an array of
secretShares and a publicShare which should be merged with the other BLS key pairs to get the common
public key and the private key of each keypair.

BG-35989
* **utxo-lib:** * The namespace `utxolib.coins` is removed

Issue: BG-40432
* **utxo-lib:** Removes these methods from AbstractUtxoCoin:

* `supportsP2sh()`
* `supportsP2shP2wsh()`
* `supportsP2wsh()`
* `supportsP2tr()`

Use `supportsAddressType(ScriptType2Of3)` instead.

Issue: BG-38773
* **core:** * `AbstractUtxoCoin.prototype.signTransaction()` now requires the
  parameter `pubs` (wallet xpub triple)
* `Wallet.prototype.signTransaction()` drops properties
  `userKeychain`/`backupKeychain`/`bitgoKeychain`. It accepts the
  optional parameter `pubs` instead (wallet xpub triple).

Issue: BG-38773
* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript
* **core:** bluebird-specific promise methods are no longer present
on the `get`/`post`/`put`/`del`/`patch` request helper methods on BitGo
objects.
* **core:** remove support for callbacks to async fns

Native promises don't support the `asCallback` or `nodeify` helpers that
are on Bluebird promises. We will need to add a compatiblity layer for
these since we don't (yet) want to entirely deprecate support for
callback style usage of Bitgo object methods, but for now let's remove
all the callback params and make everything work correctly as regular
async functions.

We still want the current API surface to remain callback compatible for
the moment, so convert from raw promises to bluebird promises where
callbacks are needed.

Ticket; BG-31214
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992

### Features

* **account lib:** add new fee model to transaction builder ([6ae88c0](https://github.com/BitGo/BitGoJS/commit/6ae88c057565f23e5c4aca39d7e01bf58aa4fa0a))
* **account lib:** adding multisigAddress ([547518c](https://github.com/BitGo/BitGoJS/commit/547518cbdecdbec4c1a368052e274e8f288f41d0))
* **account lib:** get trx fee limit from statics ([55f43b1](https://github.com/BitGo/BitGoJS/commit/55f43b1547f7f30fb2c5dd26587745b07b9694e6))
* **account lib:** implemented happy path for transfer transaction ([61f3bd5](https://github.com/BitGo/BitGoJS/commit/61f3bd5124ac7d2532726ec07975e5f6f545566e))
* **account lib:** stlx-657 implemented wallet initialization builder ([b6e5a02](https://github.com/BitGo/BitGoJS/commit/b6e5a0215137e63b30bd75206651094b1cc8fe6a))
* **account-lib and core:** fix commets  and refactor ([d1f6859](https://github.com/BitGo/BitGoJS/commit/d1f6859ee81d2997bb11810405b577f33729c5e4))
* **account-lib:** add algo transaction ([5d180bc](https://github.com/BitGo/BitGoJS/commit/5d180bcec8aaaac459a3257d31bacae7b73b40c3))
* **account-lib:** add algo transfer builder ([89f238a](https://github.com/BitGo/BitGoJS/commit/89f238a39271674173f57e7b5feedd56b3acf7cf))
* **account-lib:** add algo txn validation methods to txn builder ([b43b8b2](https://github.com/BitGo/BitGoJS/commit/b43b8b2c7b76ab30b48cec5f7768beb7001e8ed0))
* **account-lib:** add anonymous proxy txn builder STLX-11137 ([692c062](https://github.com/BitGo/BitGoJS/commit/692c062beb5b8e9df856c1f1cba3829f073b1641))
* **account-lib:** add asset transfer builder implementation ([8919ce5](https://github.com/BitGo/BitGoJS/commit/8919ce50d0b91c0b6073c0b9abe17a90d3f32700))
* **account-lib:** add AvaxWalletSimple.sol ABI to walletUtil.ts ([28e5007](https://github.com/BitGo/BitGoJS/commit/28e50073061222627795e4dfdcd6a9351919ffcf))
* **account-lib:** add batch txn builder for DOT ([c259b9d](https://github.com/BitGo/BitGoJS/commit/c259b9d815da67c7e21cda59b53412417d27e3ee))
* **account-lib:** add claim for dot staking ([34ca211](https://github.com/BitGo/BitGoJS/commit/34ca2116304ed638871f9b294befcfecbeb1854d))
* **account-lib:** add close remainder to ([2c5694f](https://github.com/BitGo/BitGoJS/commit/2c5694ff275b2042697447ef44311fde9c21ddb6))
* **account-lib:** add deactivate builder ([eeab032](https://github.com/BitGo/BitGoJS/commit/eeab03288a6fd35f4db7f9627f85bfd696e32680))
* **account-lib:** add DelegateBuilder and UndelegateBuilder ([6b7a083](https://github.com/BitGo/BitGoJS/commit/6b7a083818e51c5530ad4bc65bf08c22d83cea83))
* **account-lib:** add deposit and stake builder for near ([10d6d1e](https://github.com/BitGo/BitGoJS/commit/10d6d1e0c63d01e192e8ea4979bf8386736eaee8))
* **account-lib:** add encodeAddress in account-lib and unit test ([90ae1ab](https://github.com/BitGo/BitGoJS/commit/90ae1ab9225955812d1b468bd16d3158fc794c63))
* **account-lib:** add estimate size ([b9f6752](https://github.com/BitGo/BitGoJS/commit/b9f67525eccf67d37de8ae5eed456342737a3ff1))
* **account-lib:** add explain transaction for Near ([adfa88b](https://github.com/BitGo/BitGoJS/commit/adfa88b46a1312c9c9f02cff650f761e27da37b6))
* **account-lib:** add from publicKey in stx contract buidler ([5e78a9d](https://github.com/BitGo/BitGoJS/commit/5e78a9df615d8a04a01f7cebc9d34954d2838b88))
* **account-lib:** add fromPubKey in stx transactionBuilder ([ff7a534](https://github.com/BitGo/BitGoJS/commit/ff7a534e5b5e59b8fb31c52f4159f025fe6a7903))
* **account-lib:** add function to remove prefix from signature algorithm ([958003a](https://github.com/BitGo/BitGoJS/commit/958003aa58ce9ac7c38c6fe673967ac0ad0e1e72))
* **account-lib:** add functions to validate and pad transactions memos for STX ([b8a8a85](https://github.com/BitGo/BitGoJS/commit/b8a8a8518023a7529f25361706c7d1f97c662383))
* **account-lib:** add genesisID and genesisHash to toJson() ([ea54d43](https://github.com/BitGo/BitGoJS/commit/ea54d4330df09e21d90e1480c30ff3a449db6d93))
* **account-lib:** add getSTXAddressFromPubKeys -- generate an address for multisig transactions ([b58d55e](https://github.com/BitGo/BitGoJS/commit/b58d55eea84055d9a5781f674afcfc398b38185b))
* **account-lib:** add getTxHash to dot utils ([3798123](https://github.com/BitGo/BitGoJS/commit/379812358f523227627dd45b657b3dc0eb7067af))
* **account-lib:** add implementation methods to txn builder ([102db02](https://github.com/BitGo/BitGoJS/commit/102db02a30cd4e74b061a91dd89e711519712810))
* **account-lib:** add key factory for coins ([82be006](https://github.com/BitGo/BitGoJS/commit/82be006dde732cfba53f72aa46c6350d53b80e14))
* **account-lib:** add keyreg builder ([f055d2d](https://github.com/BitGo/BitGoJS/commit/f055d2d928009a36edebb8c0fce53e3e998bbe62))
* **account-lib:** add latest version of algo-sdk ([871641c](https://github.com/BitGo/BitGoJS/commit/871641cd590f16d953b125c7a2d1bb377baac108))
* **account-lib:** add method to retrieve algosdk suggested params ([fde7c33](https://github.com/BitGo/BitGoJS/commit/fde7c33856c7d1388d778ba230aa9f170afd4b6a))
* **account-lib:** add NEAR keypair ([8586b10](https://github.com/BitGo/BitGoJS/commit/8586b10f51147f2c9862614ec8eff9d95163a73b))
* **account-lib:** add NEAR transaction builder ([3badcbd](https://github.com/BitGo/BitGoJS/commit/3badcbdb974a62c26aa96a10d627aea27a5d7123))
* **account-lib:** add NEAR tss signing ([d8ee226](https://github.com/BitGo/BitGoJS/commit/d8ee226f2aad5e75328e0f0c8836282c993d054b))
* **account-lib:** add NEAR util ([9bbbb08](https://github.com/BitGo/BitGoJS/commit/9bbbb08595d433106a40733a04dc0d2c83d7a603))
* **account-lib:** add number of signers setter to algo ([d12a089](https://github.com/BitGo/BitGoJS/commit/d12a0898de2057eeacfa0ae47dbf48159426cd51))
* **account-lib:** add pub key validation and address validation for CSPR ([d4ec859](https://github.com/BitGo/BitGoJS/commit/d4ec8594d865640dcef677ca5b9d7564f0964073))
* **account-lib:** add send-many in Account-Lib ([974a43e](https://github.com/BitGo/BitGoJS/commit/974a43e2ecd3783a06c2ee00e06928d7cfb6f6cb))
* **account-lib:** add setters for algo txn builder ([07ff195](https://github.com/BitGo/BitGoJS/commit/07ff195843c35862a86bdbd358a24c6039595053))
* **account-lib:** add signers check on account lib and add unit test ([44d68b6](https://github.com/BitGo/BitGoJS/commit/44d68b6aa5789ae2f0d586a5e76b981d5797a120))
* **account-lib:** add signMessage method ([1b16350](https://github.com/BitGo/BitGoJS/commit/1b16350ad7e4204cfec9f133a75eb74f88b6570d))
* **account-lib:** add skeleton for solana ([660d244](https://github.com/BitGo/BitGoJS/commit/660d24472d73ab30f2e40006692319ab774578df))
* **account-lib:** add skeleton implementation for Algorand ([9ad5c60](https://github.com/BitGo/BitGoJS/commit/9ad5c60fd246e3d7dca0058d05f61ec0dce989f5))
* **account-lib:** add solana tokens STLX-11959 ([1902efb](https://github.com/BitGo/BitGoJS/commit/1902efbf3dcee72879d0bec2676a97961caba24d))
* **account-lib:** add solana util functions for use in wp, refactor ([460adfa](https://github.com/BitGo/BitGoJS/commit/460adfa7576712d9eab184bbd7e55f8c19e41131))
* **account-lib:** add stacks coin keypair + utils implementation ([97d413a](https://github.com/BitGo/BitGoJS/commit/97d413a2719296855558cccdf6ff44740dd860ad))
* **account-lib:** add stacks smart contracts ([8ea73c9](https://github.com/BitGo/BitGoJS/commit/8ea73c9db315c36ac6a531e3db131bffef2b1b91))
* **account-lib:** add staking activate builder ([b23e5c3](https://github.com/BitGo/BitGoJS/commit/b23e5c3c7e4900173bbecb02e56ebf61a7a11fb9))
* **account-lib:** add staking deactivate builder ([35bb996](https://github.com/BitGo/BitGoJS/commit/35bb9965513a87b63ca89c0e3d05298230248079))
* **account-lib:** add staking withdraw builder ([34c7a75](https://github.com/BitGo/BitGoJS/commit/34c7a75a6755480c2a62606562002f645f90c65f))
* **account-lib:** add stateproofkey param ([46111c9](https://github.com/BitGo/BitGoJS/commit/46111c90df78b735d1c1d8da391857975c5bf6f5))
* **account-lib:** add stx coin (blockstack) and supporting utils ([a65b3eb](https://github.com/BitGo/BitGoJS/commit/a65b3eb47d60a5fd326dab1c75a0e736d94e12bc))
* **account-lib:** add stx to account-lib's coinBuilderMap ([2b9bffc](https://github.com/BitGo/BitGoJS/commit/2b9bffc07907e066ea1e22d46a5c02655a17c634))
* **account-lib:** add support for "memoId" field for STX addresses ([dd712e0](https://github.com/BitGo/BitGoJS/commit/dd712e03a22d27c30848634859eaa5508310800b))
* **account-lib:** add support for algo flat fees ([d7d0029](https://github.com/BitGo/BitGoJS/commit/d7d00294ccebb147c89152a3a0ba23ffe5122662))
* **account-lib:** add support for decoding signed algo txns ([bcc4929](https://github.com/BitGo/BitGoJS/commit/bcc4929fe7f76a01d614a83a94b7744faafca889))
* **account-lib:** add support for generating stx keypairs using extended public/private keys ([21f38cb](https://github.com/BitGo/BitGoJS/commit/21f38cb897497c38b4a64082749aafa47d60126f))
* **account-lib:** add support for offline kr txn ([4fad380](https://github.com/BitGo/BitGoJS/commit/4fad380967effc80deb650626519d30b05933e0e))
* **account-lib:** add test unit getTrasactionByteSize ([a6a3062](https://github.com/BitGo/BitGoJS/commit/a6a3062c6cb406bf7c178fafe2d5607ea797ed23))
* **account-lib:** add transaction type argument ([3c112ed](https://github.com/BitGo/BitGoJS/commit/3c112ed9f5f16af799bfc57291fa252c375982fb))
* **account-lib:** add transactionSize() to stx, for fee calculation ([9118362](https://github.com/BitGo/BitGoJS/commit/91183621307383192e8ebb359f1519e1e91ed5d1))
* **account-lib:** add unit test for avaxToken ([699d542](https://github.com/BitGo/BitGoJS/commit/699d542307cc61e2bc522842868ecee99bad0e40))
* **account-lib:** add unit tests related to extended keys support ([d4841d2](https://github.com/BitGo/BitGoJS/commit/d4841d284fb87a2a9dee07ad04f912df6bd37820))
* **account-lib:** add unnominate for dot staking ([8a1a5e2](https://github.com/BitGo/BitGoJS/commit/8a1a5e26ac453baedeeb44bbdd8ed47e9e7ab6a8))
* **account-lib:** add USDT USDC as testnet tokens ([f4d372b](https://github.com/BitGo/BitGoJS/commit/f4d372b3cdccc68aa9ce5e2c35b1cced127b6145))
* **account-lib:** add util factory for coins ([4233e2d](https://github.com/BitGo/BitGoJS/commit/4233e2d05dca961e79b907cb75af81e91c9bc1c9))
* **account-lib:** add utility function to convert algo pk to addr ([b1348dd](https://github.com/BitGo/BitGoJS/commit/b1348dde965f255cf07977bb008c7ccb12fbf4ac))
* **account-lib:** add utils to validate tx and block hash ([e59cb7c](https://github.com/BitGo/BitGoJS/commit/e59cb7c03f31eb9c1c7d5a3b35eab87972d324cc))
* **account-lib:** add validation for cspr address with transferId ([5a1ecd9](https://github.com/BitGo/BitGoJS/commit/5a1ecd95a0bb364fc6011dba369474d59ec728b8))
* **account-lib:** add validations for contract name, address and function ([42d51a9](https://github.com/BitGo/BitGoJS/commit/42d51a97f7758473ad1c7f7b0bbec01ff590628b))
* **account-lib:** add verifySignature Method ([260edfc](https://github.com/BitGo/BitGoJS/commit/260edfcb32db05fefb75b426662fd30ce0601a8d))
* **account-lib:** add verifySignature() for stx with test cases ([f9a8724](https://github.com/BitGo/BitGoJS/commit/f9a8724825f3e3b35b15dc77c8853fb5059aa368))
* **account-lib:** add withdraw staking builder ([6a4b9a5](https://github.com/BitGo/BitGoJS/commit/6a4b9a56cfdca3780f83addf077b2e152fc65385))
* **account-lib:** add withdrawUnstaked for dot ([984e412](https://github.com/BitGo/BitGoJS/commit/984e412f88eb6060182c144bf6fc2b8dee12899e))
* **account-lib:** added Algo encodeObj support on account lib ([e9a3e2e](https://github.com/BitGo/BitGoJS/commit/e9a3e2e7c20cd8a73b64ae8b603db750f6bfeb4f))
* **account-lib:** added UT over transaction ([4687e16](https://github.com/BitGo/BitGoJS/commit/4687e16083f7600a9fe3b5d62778b79a7542ce95))
* **account-lib:** adding NFT support to BitGo SDK ([39b7a4f](https://github.com/BitGo/BitGoJS/commit/39b7a4f6e4707a172cc506312f7930f8bc0a1603))
* **account-lib:** adding unit test for eth2 staking contract ([3fb5116](https://github.com/BitGo/BitGoJS/commit/3fb51166d3064ae806ffd75390a6328313d5278c))
* **account-lib:** addition of getTxId method for multisig txn ([ad22216](https://github.com/BitGo/BitGoJS/commit/ad222163171b3fd4fed5a20bc7fef8289cee1e69))
* **account-lib:** addition of getTxId method for multisig txn ([4240477](https://github.com/BitGo/BitGoJS/commit/4240477845c6404a7eee1ad477ade28674818bb8))
* **account-lib:** addition txType on account-lib ([8046424](https://github.com/BitGo/BitGoJS/commit/80464248402815413dacc2aa4095da72141c7fc3))
* **account-lib:** algo key dilution fix ([faebb5c](https://github.com/BitGo/BitGoJS/commit/faebb5c401a38be21d96f3736315ef852fe8e76d))
* **account-lib:** algo removal ([e8121d4](https://github.com/BitGo/BitGoJS/commit/e8121d4a08d1a2cd0b37c777da3e6f5d37e5c27d))
* **account-lib:** algo support for half sign tx ([e063c03](https://github.com/BitGo/BitGoJS/commit/e063c03ad4760d6f90a151ba29cdb65a83f89c19))
* **account-lib:** allow creating ETH Keypair from provided or random seed ([e96e4bb](https://github.com/BitGo/BitGoJS/commit/e96e4bb915a14b014efd04f873af4b75f1cf09c9))
* **account-lib:** allow dot key pair init with bs58 pub key ([d40ef28](https://github.com/BitGo/BitGoJS/commit/d40ef28af3edc77aaa61265512b07b61ee378065))
* **account-lib:** attempt webpack with ecma 6 ([37ace8c](https://github.com/BitGo/BitGoJS/commit/37ace8c0eb1b9c3920c296719e841a5c35634959))
* **account-lib:** avalanche C implement transactionBuilder, transferBuilder, tests ([dbac92b](https://github.com/BitGo/BitGoJS/commit/dbac92b442554984bf994456d63e247312341a67))
* **account-lib:** avax key pair support ([27c562f](https://github.com/BitGo/BitGoJS/commit/27c562fa1d557f50c7128308666987dab5c48231))
* **account-lib:** avaxc upgrade common fork to london ([9028b75](https://github.com/BitGo/BitGoJS/commit/9028b7543f9e8322598c2225eefc4dff7d5ea5dd))
* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** change NEAR transfer builder interface ([ac4bf46](https://github.com/BitGo/BitGoJS/commit/ac4bf4605e2cbae191c4cbac252b76a8a8c49bef))
* **account-lib:** create ataInitBuilder to initialize solana associated token account STLX-11958 ([e060add](https://github.com/BitGo/BitGoJS/commit/e060add6cb98e7950e56b6e1a0442b2a7fbe3dca))
* **account-lib:** determine how to use contract method IDs ([ecbcb8a](https://github.com/BitGo/BitGoJS/commit/ecbcb8a22065058d376bade7eed8ddf775805152))
* **account-lib:** dot explain transaction ([97a2f21](https://github.com/BitGo/BitGoJS/commit/97a2f21251f81ca2b9113ffabc2dd2ade7410ff4))
* **account-lib:** dot fee error fix ([1a91cae](https://github.com/BitGo/BitGoJS/commit/1a91caee176357e69d4dd5e14830a7402a7bf204))
* **account-lib:** dot final review fixes ([520ed78](https://github.com/BitGo/BitGoJS/commit/520ed78d0240469d754633d536c6ef5bab4b61e7))
* **account-lib:** dot optimization ([82dd145](https://github.com/BitGo/BitGoJS/commit/82dd1457793624e4c9ba1b880b5bfe4fdf19c740))
* **account-lib:** dot private key fix STLX-10448 ([08cc8f5](https://github.com/BitGo/BitGoJS/commit/08cc8f5e14fc5180f3d952e2b02dd6e685c288c0))
* **account-lib:** enable offline transaction building for algo ([95f6f95](https://github.com/BitGo/BitGoJS/commit/95f6f957511fc0572311039b4ce8c324cd3211c8))
* **account-lib:** export AddressVersion and AddressHashMode for STX ([8779deb](https://github.com/BitGo/BitGoJS/commit/8779deb6737183b67340cc8de3e0ed3e8ab82f24))
* **account-lib:** export AtaInitializationBuilder STLX-11958 ([c0ec45b](https://github.com/BitGo/BitGoJS/commit/c0ec45ba1690e44b28e7439e7bbe487b91dd6ac9))
* **account-lib:** export Solana builders and transaction ([597734f](https://github.com/BitGo/BitGoJS/commit/597734f364fe575f4cd361daaf2257551155ef54))
* **account-lib:** export token transfer builder STLX-11959 ([b757aa8](https://github.com/BitGo/BitGoJS/commit/b757aa89c6fd535740b732556df2ec53e281396e))
* **account-lib:** fix multisig signing issue ([e445dc4](https://github.com/BitGo/BitGoJS/commit/e445dc475bcd8486d2bfab9559123cb6898d63c6))
* **account-lib:** fixing coins.ts tsol mint addresses STLX-11959 ([f973924](https://github.com/BitGo/BitGoJS/commit/f973924eb29a53570de67861f44d270cdf35a1cd))
* **account-lib:** from implementation for transfer builder ([d9c85f5](https://github.com/BitGo/BitGoJS/commit/d9c85f534ddb6d0891724d975279bff244a11060))
* **account-lib:** implement a field for transaction material ([42fd74c](https://github.com/BitGo/BitGoJS/commit/42fd74c709e0e726cfc75b38707a08a5483532af))
* **account-lib:** implement add signature for sol ([451e58a](https://github.com/BitGo/BitGoJS/commit/451e58a1f1a34e54c7d493a2dac6621c777da783))
* **account-lib:** implement basic util methods for solana ([6fb3746](https://github.com/BitGo/BitGoJS/commit/6fb37465fa4be552dcda0f63729214339d8bb913))
* **account-lib:** implement isValidPrivateKey() method for CSPR ([c58d44a](https://github.com/BitGo/BitGoJS/commit/c58d44abc613f26d9497f2536009cf06cb9777fa))
* **account-lib:** implement keypair, transaction, builder and builder factory for solana ([c8493f6](https://github.com/BitGo/BitGoJS/commit/c8493f6b19d3aa01eb03ead7c514b79a0b58161b))
* **account-lib:** implement validityWindow and sequenceId for Sol ([0677955](https://github.com/BitGo/BitGoJS/commit/06779551b6b21a0f38d809c03a6870c309b83d21))
* **account-lib:** implementation of generateAccoutn() in account-lib ([7737024](https://github.com/BitGo/BitGoJS/commit/7737024d04187cd8432473d17354543d4d35aba0))
* **account-lib:** implementation of the functionality secretKeyToMnemonic with unit test ([0c80d0a](https://github.com/BitGo/BitGoJS/commit/0c80d0a65dd5ab09c196421c9d25022174c89a24))
* **account-lib:** implemetion stellerpub to algoaddress and encodeAddress ([a636bc0](https://github.com/BitGo/BitGoJS/commit/a636bc01dca47e51663a99b8dee843e3ba28b4c6))
* **account-lib:** improve and export NEAR util methods ([7ad569e](https://github.com/BitGo/BitGoJS/commit/7ad569e631ca8a5f8737c199bfdb190d92af9c61))
* **account-lib:** include rent exempt amount in solana ata init transaction STLX-11958 ([25c7eeb](https://github.com/BitGo/BitGoJS/commit/25c7eebce629b0d9de6a52946bc4b3f91b34fe22))
* **account-lib:** initial algorand keypair support ([fd00e5b](https://github.com/BitGo/BitGoJS/commit/fd00e5b204c08c73c5da3e60545f90d0b3c0257e))
* **account-lib:** initial setup ([63be9dd](https://github.com/BitGo/BitGoJS/commit/63be9dd76bef92423b41c57d628b4e093fa5e2cc))
* **account-lib:** keyreg linting fix ([29f2cb5](https://github.com/BitGo/BitGoJS/commit/29f2cb5b4f150eab9870ec941589ba9553303775))
* **account-lib:** load inputs and outputs of solana create ata instruction STLX-11958 ([a3a2ab1](https://github.com/BitGo/BitGoJS/commit/a3a2ab1a6fb885a9aecc5c648529bfc9f313622c))
* **account-lib:** make chainname parameterizable in txBuilder ([2115d96](https://github.com/BitGo/BitGoJS/commit/2115d96da9299deb6490ee447612326be5d67a17))
* **account-lib:** migrate BLS key pair from @bitgo/bls to @bitgo/bls-dkg lib ([c95877f](https://github.com/BitGo/BitGoJS/commit/c95877fda2201a5d71618ad68ba14cc73308f4f7))
* **account-lib:** move buildFeeInfo logic to AL and add unit test ([9c7ae4e](https://github.com/BitGo/BitGoJS/commit/9c7ae4ec9e5f0ecc751372375b1a83a7be4c1e7c))
* **account-lib:** near coin skeleton ([5fda33d](https://github.com/BitGo/BitGoJS/commit/5fda33da57e2037f0b9e2c81b98fe7b5fc2a35e9))
* **account-lib:** package json  fix ([dc14fc6](https://github.com/BitGo/BitGoJS/commit/dc14fc6b679590c08cdc6528c10e822158072cdf))
* **account-lib:** rebase account-lib in the bitgoJs and fixing errors ([cf5baaf](https://github.com/BitGo/BitGoJS/commit/cf5baaf577cd9c151be40d4efb6257ba47c03889))
* **account-lib:** recover signature from raw tx ([113f132](https://github.com/BitGo/BitGoJS/commit/113f132f3219c752938b40a56eb90fca937b223d))
* **account-lib:** refactor after code review ([27761f5](https://github.com/BitGo/BitGoJS/commit/27761f5c2e72a4a284959630cd6821d0e07e77b9))
* **account-lib:** refactor and added missing unit test ([33bae36](https://github.com/BitGo/BitGoJS/commit/33bae3646e26ebd131f3c6e0a5a84f3f3e4bbec2))
* **account-lib:** refactor casper addresses format ([cb8a30c](https://github.com/BitGo/BitGoJS/commit/cb8a30c47f199ef889946e411dfb8738e2621e55))
* **account-lib:** refactor code after code review ([a0d13b4](https://github.com/BitGo/BitGoJS/commit/a0d13b4bb587ef6f7b23dbcd5588e3230caded5e))
* **account-lib:** refactor due to pull request review suggestions ([e30a6ea](https://github.com/BitGo/BitGoJS/commit/e30a6eaefc1e780dab2b6d66d048fc4e75d28f6d))
* **account-lib:** refactor mintAddress -> tokenName 3 STLX-11959 ([a1455a3](https://github.com/BitGo/BitGoJS/commit/a1455a36eab968503691928d2ac8daef1a00797d))
* **account-lib:** refactor mintAddress -> tokenName 4 STLX-11959 ([eeeaecd](https://github.com/BitGo/BitGoJS/commit/eeeaecdffb2ae00e2c01e5b14e52995c934f8998))
* **account-lib:** refactor mintAddress -> tokenName STLX-11959 ([6ca2d10](https://github.com/BitGo/BitGoJS/commit/6ca2d1065e76c26f0d2aac8a08ed536bbba9bbad))
* **account-lib:** refactor to control over minimum transfer amount ([2ae3ac1](https://github.com/BitGo/BitGoJS/commit/2ae3ac18bdde24909f4275f9b3796796cb9cd0c5))
* **account-lib:** remove asynchronicity from some methods and improved jsdoc ([cb1636f](https://github.com/BitGo/BitGoJS/commit/cb1636f885a0ba752803ad4bc412cc6f68689755))
* **account-lib:** remove KeyExclusionBuilder from account-lib ([3950c7b](https://github.com/BitGo/BitGoJS/commit/3950c7bf68c19dfdf46490f8c3c5d79f6ffb38d6))
* **account-lib:** remove question mark from genesisID and genesisHash ([14c961e](https://github.com/BitGo/BitGoJS/commit/14c961e658f114da34e107871d4021997cf7f586))
* **account-lib:** sign message and verify sign for casper ([80cfbb9](https://github.com/BitGo/BitGoJS/commit/80cfbb93395ac9e62ae5a770272c3b16068176c5))
* **account-lib:** skeleton code for avalanche c-chain in account-lib ([8c5382b](https://github.com/BitGo/BitGoJS/commit/8c5382b1e51e453b60e7127b2cc18467f4a0f952))
* **account-lib:** solana - implement derive address function ([3dbdf6c](https://github.com/BitGo/BitGoJS/commit/3dbdf6cdc3a89883d86ba7237e958cc3bd475d58))
* **account-lib:** spl-token encode/decode rework STLX-11959 ([e1db449](https://github.com/BitGo/BitGoJS/commit/e1db449d2094ea9f85f8af479f83f14f0371b99b))
* **account-lib:** stlx-1458 from implementation for wallet initialization ([94395dd](https://github.com/BitGo/BitGoJS/commit/94395dd8c371dbe6e43eadd4736d1172c9a77e70))
* **account-lib:** stlx-793 implemented from implementation for transaction and transaction builder ([679c1af](https://github.com/BitGo/BitGoJS/commit/679c1af134a34ff8432817768e28e05971ccf06f))
* **account-lib:** stx contract call args ([b482b72](https://github.com/BitGo/BitGoJS/commit/b482b724b4647bd677a2f2082825a1c410cffb1f))
* **account-lib:** stx ContractBuilder functionArgs add optionl ([1e5e725](https://github.com/BitGo/BitGoJS/commit/1e5e725152bc75fd58358474f3cbbfedbbbd403b))
* **account-lib:** sTX getSTXAddressFromPubKeys takes an optional AddressHashMode param ([7dc694d](https://github.com/BitGo/BitGoJS/commit/7dc694dab04c45f44d363c0b6938ec37ac3b78c0))
* **account-lib:** stx toBroadcastFormat does not prefix with 0x ([3d0749f](https://github.com/BitGo/BitGoJS/commit/3d0749f8be7749e89c84494a5db59b2647433273))
* **account-lib:** sTX's transaction builder checks if the provided memo string is valid ([c4c2fac](https://github.com/BitGo/BitGoJS/commit/c4c2fac63dbee5087851281afa97f7f8b86fc5d7))
* **account-lib:** support creating TSS keyshares with seed ([6716720](https://github.com/BitGo/BitGoJS/commit/6716720705087d31bddc978b4c89ad0bf1a494bd))
* **account-lib:** support HD MPC key generation and signing ([be934d3](https://github.com/BitGo/BitGoJS/commit/be934d34fb75020d78618ef9fdf2976041346be8))
* **account-lib:** support new fee model in EthTransactionData ([c4b2e38](https://github.com/BitGo/BitGoJS/commit/c4b2e38e517d06ad91ff1a060d78ec7322c2a312))
* **account-lib:** supporting adding signatures to transactions ([00cd566](https://github.com/BitGo/BitGoJS/commit/00cd5662bf9f89c9c4bdab948f6548107c9ef696))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **account-lib:** token transfer support STLX-11959 ([1687234](https://github.com/BitGo/BitGoJS/commit/16872349fc25bffce07eda515728aff250d1a25d))
* **account-lib:** transation hash is calclated wrongly ([15628a2](https://github.com/BitGo/BitGoJS/commit/15628a20b4feef9d4b77debb5359158ccc99f821))
* **account-lib:** unit test for non participation in keyRegistrationBuilder ([540774b](https://github.com/BitGo/BitGoJS/commit/540774b40dd1406d7b8d9e6d6fa573f1bb723318))
* **account-lib:** update casper sdk to version 20 ([34996e4](https://github.com/BitGo/BitGoJS/commit/34996e4879e966fb2511e20cccb84d01c96b24d6))
* **account-lib:** update casper sdk version ([b0bc77a](https://github.com/BitGo/BitGoJS/commit/b0bc77a2c59606e0dbd0ae25bbe15970af13fb37))
* **account-lib:** update casper-client-sdk lib version ([5f74054](https://github.com/BitGo/BitGoJS/commit/5f740548b5292dbccf478837aa48083cf5ac4e0b))
* **account-lib:** update eth behavior require by hsm3 ([062eba1](https://github.com/BitGo/BitGoJS/commit/062eba1232083bf40ed66f69eebda7a73b7bbded))
* **account-lib:** update the casper-client-sdk dependency to v1.0.16 ([a97e235](https://github.com/BitGo/BitGoJS/commit/a97e235e267521a729fb5b87802764ee7b97ed40))
* **account-lib:** update verification methods ([af93730](https://github.com/BitGo/BitGoJS/commit/af937306b61286ab813e4410b65079659883e93b))
* **account-lib:** updated casper node version ([fa2d7f6](https://github.com/BitGo/BitGoJS/commit/fa2d7f65edf416231bd8d829ce7e33c2294b65f6))
* **account-lib:** updated casper sdk version to 1.0.19 ([13806da](https://github.com/BitGo/BitGoJS/commit/13806da99039c09a7d0e13a4b0a5651293c24874))
* **account-lib:** updating after comments ([13726e8](https://github.com/BitGo/BitGoJS/commit/13726e81920af88b4cc40a6e5bed39823d62e10a))
* **account-lib:** upgrade celo to 1.2.4 ([c7ed64d](https://github.com/BitGo/BitGoJS/commit/c7ed64d3c21d77c62a015f126c59843d39866214))
* **account-lib:** validate ValidityWindows in baseBuildTransaction ([dd1dfc4](https://github.com/BitGo/BitGoJS/commit/dd1dfc41ac2a5fa9489f0472b31ad584b868b9d7))
* **accountlib:** add closeremaindeto and unit tests ([69917a0](https://github.com/BitGo/BitGoJS/commit/69917a0074e382a900df71bc247cc9eadfd0533d))
* **accountlib:** add new casper coin skeleton structure ([9163b22](https://github.com/BitGo/BitGoJS/commit/9163b22b2edb8baa8c54c381b4857fac46b7e646))
* **accountlib:** add testing ([8f4e3a0](https://github.com/BitGo/BitGoJS/commit/8f4e3a0f0fb2743f14211565c1f1e4e6bfcc144e))
* add BCH coin and recovery ([a74b877](https://github.com/BitGo/BitGoJS/commit/a74b877a14ab46b2bcf0955e60fbab6db4f5c302))
* add bls initialization ([f7fe3d4](https://github.com/BitGo/BitGoJS/commit/f7fe3d42be5e3e98327e346fbc57b151a826124c))
* add custom signing function url to requests ([2a0aca5](https://github.com/BitGo/BitGoJS/commit/2a0aca5123547635ab97d25befd4ef5b4bcc5dc1))
* add ERC20 OFC "token" support to statics ([4473ef9](https://github.com/BitGo/BitGoJS/commit/4473ef99d7cadbbb58ac6f88cdfff1be4a7ef577))
* add eth2 to statics ([61665a3](https://github.com/BitGo/BitGoJS/commit/61665a3cdb2ba4a3700a3cc9baa803abdd17c6bf))
* add fetchEncryptedPrivKeys.ts ([136fbab](https://github.com/BitGo/BitGoJS/commit/136fbabb6220b7e5620d6705b0ceb1819f45dcac))
* add github actions CI workflow ([e90bef1](https://github.com/BitGo/BitGoJS/commit/e90bef1c3b646d81b962bc92bf63c97fd286cb64))
* add log for xpub during tx signing ([c0bba72](https://github.com/BitGo/BitGoJS/commit/c0bba72de81e21223f03b0b6ea90782262fcab14))
* add module `@bitgo/blockapis` ([2bc8991](https://github.com/BitGo/BitGoJS/commit/2bc8991df6eabbe5775663f1169e90d599e6b87d))
* add new token ([8a60853](https://github.com/BitGo/BitGoJS/commit/8a60853f3988faa1eedfce777cc40cb6244ae027))
* add new tokens ([7027f50](https://github.com/BitGo/BitGoJS/commit/7027f50da97e885eb5c068d339a65953da255f04))
* add new tokens ([69b320e](https://github.com/BitGo/BitGoJS/commit/69b320e5bde0724e353d2cb710b3a358808100b8))
* add nft tokens to statics ([9f42cc4](https://github.com/BitGo/BitGoJS/commit/9f42cc4b8dc4f81bcff6fa6d7da58b07df5b8c2a))
* add retry logic to external signer ([05e198a](https://github.com/BitGo/BitGoJS/commit/05e198a64f43afbf035fee406f27e0b35cb90721))
* add signing functionality to external signer mode ([ee26c72](https://github.com/BitGo/BitGoJS/commit/ee26c727931a2ae08613f173bd34a1092c5915fc))
* add SIH ([2cbd5b4](https://github.com/BitGo/BitGoJS/commit/2cbd5b4cb9c1ec01cbd8da408ecbe1406f70e17e))
* add support for generating p2tr addresses ([2cd462c](https://github.com/BitGo/BitGoJS/commit/2cd462cb7b13aa2b9c6b09e667abe128c1c9262f))
* add support for node 16 and add to test matrix ([9fab886](https://github.com/BitGo/BitGoJS/commit/9fab886fab10eeacdd91d294f1c5deeb5cd03a28))
* add support for sign(signParams: TxbSignArg) ([f15fb36](https://github.com/BitGo/BitGoJS/commit/f15fb36e6a1aa7515dfbf0c1f2c36620a9ba8eab))
* **add tokens:** add tokens (lowcase) ([5c5612e](https://github.com/BitGo/BitGoJS/commit/5c5612e600bab01adc40c973696ed788ac679f2a))
* add TSS key generation and signing functions ([3d1dce5](https://github.com/BitGo/BitGoJS/commit/3d1dce5e2c225acd08d5018f53c43727eba19632))
* add unspents module from BitGo/unspents ([47acb1e](https://github.com/BitGo/BitGoJS/commit/47acb1eff7f00cadde40eb480c7c19342ee126e8))
* adding comment to SubmitTransactionOptions ([ac32498](https://github.com/BitGo/BitGoJS/commit/ac324988fe37f256a901d71761ad908f95f72f29))
* adds BLS key generation to account-lib. Used for ETH2 ([9fc8583](https://github.com/BitGo/BitGoJS/commit/9fc8583649b567b6b41a5ea18d536291caaf8ea0))
* adds eth2 coin controller in core ([8c74388](https://github.com/BitGo/BitGoJS/commit/8c74388eba50df6ce853c80cb5291e6627a94251))
* adds new tokens ([0607785](https://github.com/BitGo/BitGoJS/commit/06077852a6e97b27265826e4d877bcc53fffb3cf))
* **algo:** add algo token support ([740d064](https://github.com/BitGo/BitGoJS/commit/740d06493b76e82b16f7be746d623616d7082220))
* **algo:** bG-31598-Add-ALGO-Token-Support ([29eb2a0](https://github.com/BitGo/BitGoJS/commit/29eb2a0ff320cc83727a54fe8a932e25359c831d))
* **algo:** misc updates for platform migration to use account lib ([b310c57](https://github.com/BitGo/BitGoJS/commit/b310c57d5ff497aff76fe5859a3baef6466915c5))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* **bitgo:** add emergency param to whitelist ([3e0b615](https://github.com/BitGo/BitGoJS/commit/3e0b6155c750da431ffc8062a4ccf7c0bad639f2))
* **bitgo:** add nonce in prebuild whitelisted params ([bbf4084](https://github.com/BitGo/BitGoJS/commit/bbf4084912bb0b29c048bbc192d83b1ce4bdf156))
* **bitgojs:** update algo sdk to last stable version ([87e258a](https://github.com/BitGo/BitGoJS/commit/87e258aa69c72a339f9a911e512aa447ff77dc32))
* **bitgojs:** update algo sdk to last stable version ([291f166](https://github.com/BitGo/BitGoJS/commit/291f166447cd29dac463b0cf2d4851ac21b00684))
* **bitgo:** update tss hd wallet sharing ([d416f1e](https://github.com/BitGo/BitGoJS/commit/d416f1e65794f1be2a0d908b0d2d43b5f0589355))
* **blockapis:** add OutputSpends, TransactionStatus queries ([53bd87e](https://github.com/BitGo/BitGoJS/commit/53bd87e2128598e4321654a58e647bab88e82325))
* **c8p token:** update decimal places ([85d7cfe](https://github.com/BitGo/BitGoJS/commit/85d7cfef5a40d4b818b62e79daff7c38965b961f))
* check config when running in external signer mode ([3c0e9a1](https://github.com/BitGo/BitGoJS/commit/3c0e9a12f2ae652a95defc289cb32a9589369bb0))
* check that signerFileSystemPath path contains a private key ([fe78332](https://github.com/BitGo/BitGoJS/commit/fe78332784edcff6f897ef05d315f2106a1308f4))
* **core & account-lib:** adapt tron to receive data for a contract call ([8bbcac0](https://github.com/BitGo/BitGoJS/commit/8bbcac05215c6eb14edb103ea241f72ae934ec7e))
* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript ([a5b80b2](https://github.com/BitGo/BitGoJS/commit/a5b80b274ce4d3d38c4e4396d5f313a6192c4652))
* **core:** add `considerMigratedFromAddressInternal` verification flag ([288c6f1](https://github.com/BitGo/BitGoJS/commit/288c6f15e11c908849047f4f995d4ba20f4da958))
* **core:** add `ecdhXprv` to serialized SDK JSON object ([3112c72](https://github.com/BitGo/BitGoJS/commit/3112c72f735e319d25f885c446ea8b1e8b30f0f3))
* **core:** add amount to refund eos txn ([f3e5a67](https://github.com/BitGo/BitGoJS/commit/f3e5a676112252b4ab746f2ed0678e9bf316992c))
* **core:** add AvaxcToken coins in sdk ([8beb7bf](https://github.com/BitGo/BitGoJS/commit/8beb7bf2b52090fc04b43800cc328951a509417d))
* **core:** add Avaxctokens coins in sdk ([9f74b40](https://github.com/BitGo/BitGoJS/commit/9f74b406751044a5ded33b6763ca2df7f125b4dc))
* **core:** add bip32path.fromLegacyPath() ([b95c55f](https://github.com/BitGo/BitGoJS/commit/b95c55f73ecc75b2e946353c4a01856279a916e2))
* **core:** add bip32util with signMessage/verifyMessage ([43178f2](https://github.com/BitGo/BitGoJS/commit/43178f2cf9da0e812fdae2057e597c5dc8bc5660))
* **core:** add class WalletKeys ([4417bb0](https://github.com/BitGo/BitGoJS/commit/4417bb0de33c2233ed640a472fb6abb0ab93c522))
* **core:** add compatibility for @bitgo/utxo-lib 1.9.x ([1bbc4df](https://github.com/BitGo/BitGoJS/commit/1bbc4dfd6caa51acf69f39a46e7e6b901d6184cf))
* **core:** add core skeleton for solana ([2269db4](https://github.com/BitGo/BitGoJS/commit/2269db4ada70549df295002f652838ffaa647938))
* **core:** add createTss func to keychains ([954a148](https://github.com/BitGo/BitGoJS/commit/954a148a324acaadfdf28a0b570ecb4a8a817076))
* **core:** add distinct "unit-test" target ([079b1fb](https://github.com/BitGo/BitGoJS/commit/079b1fb3890f8ea55d3303eb674cf09bfc5843f5))
* **core:** add enable and disable token txs to explain transaction method ([8d99fdc](https://github.com/BitGo/BitGoJS/commit/8d99fdca1ec854d199c28ba1e26a9be533985c81))
* **core:** add eos explain refund txn ([d1231c0](https://github.com/BitGo/BitGoJS/commit/d1231c0b98f6d340790cfed5352893b5867d78b8))
* **core:** add examples of enable and disable token ([1aeeeb3](https://github.com/BitGo/BitGoJS/commit/1aeeeb3c6b87fa0c7b3a1ff9de131be74d6d8286))
* **core:** add explainTransaction for STX ([b69cc82](https://github.com/BitGo/BitGoJS/commit/b69cc82ff66ce5bb10fe3b787b79f5dd923e75f7))
* **core:** add fixture-based parameteric utxo tests ([444888f](https://github.com/BitGo/BitGoJS/commit/444888f9f0ba5a5ec5d6ed941c968cf29efa8e52))
* **core:** add function for verifying eth address ([32d5714](https://github.com/BitGo/BitGoJS/commit/32d5714d7e4b2b0e2537da42e6f2448f0488c973))
* **core:** add function in SDK and write examples for deploy/flush forwarder. Ticket: STLX-12550 ([c4cd0b4](https://github.com/BitGo/BitGoJS/commit/c4cd0b4710b8405add0104c289eb145a45983636))
* **core:** add hop to signTransaction and unit tests ([9d58b26](https://github.com/BitGo/BitGoJS/commit/9d58b261ddeb24bfbbb5cb6ebf2e18b8ec94e550))
* **core:** add method to aggregate ETH2 BLS shares ([953ddfb](https://github.com/BitGo/BitGoJS/commit/953ddfb92cacb3239ec994979d02481775f88f22))
* **core:** add NEAR core skeleton ([16bc15d](https://github.com/BitGo/BitGoJS/commit/16bc15d5ce80b53c14b54a5cd9faa6fe71912b70))
* **core:** add parseOutputId to utxo/unspent.ts ([ec77d11](https://github.com/BitGo/BitGoJS/commit/ec77d1172d7d8f6f93b415f6c280397e36f57ace))
* **core:** add publicKeys optional param to stx's explainTransaction call options ([6581839](https://github.com/BitGo/BitGoJS/commit/6581839d4d0cebf97d8c770ac981290d4bb9ee48))
* **core:** add rel prefix to github actions branch list ([0519d66](https://github.com/BitGo/BitGoJS/commit/0519d6686a6cab57a43df2662402adef02837dff))
* **core:** add request method to auth v3 hmac subject ([74e5b1f](https://github.com/BitGo/BitGoJS/commit/74e5b1f659c832bb848172745251a9ef93ee9fa2))
* **core:** add send support for XLM muxed addresses ([fdaf489](https://github.com/BitGo/BitGoJS/commit/fdaf489e7fa26b6963b5157c59ecdffff3bcde4f))
* **core:** add signTransactions method in stx ([bdd669f](https://github.com/BitGo/BitGoJS/commit/bdd669fbc67ae67696659c85ce8454cc59e919e7))
* **core:** add signWalletTransactionWithUnspent ([834c505](https://github.com/BitGo/BitGoJS/commit/834c50586b37a864b54a0ac0f291980b6ec8191e))
* **core:** add stacking to explain tx ([d637154](https://github.com/BitGo/BitGoJS/commit/d637154d11e45f195bb0b75fd664a16338bd268c))
* **core:** add support for avaxc ([a30e29c](https://github.com/BitGo/BitGoJS/commit/a30e29cc4bd0a134186bc76e3afb5e3f49c4f03f))
* **core:** add support for node 12, 14, 15 ([0085455](https://github.com/BitGo/BitGoJS/commit/0085455dd22640994db627877c23c48fc5c9e18f))
* **core:** add support for p2tr recoveries ([286469f](https://github.com/BitGo/BitGoJS/commit/286469ffe9ad6868b926a63bc9c4cb1a55ae11d8))
* **core:** add support for p2tr script path sign ([99b0453](https://github.com/BitGo/BitGoJS/commit/99b04535b57703ca37cf2dfc0553de03f9a51c51))
* **core:** add support for user-provided custom signing function ([672f1a8](https://github.com/BitGo/BitGoJS/commit/672f1a83f5690a03e36309eaeff19b7daeb13044))
* **core:** add support for verifying STX addresses with an optional "memoId" field ([5627877](https://github.com/BitGo/BitGoJS/commit/5627877b1a98f3d8b49a6e2c084da75afc1d5c4f))
* **core:** add supportsAddressChain(), supportsAddressType() ([89cb98f](https://github.com/BitGo/BitGoJS/commit/89cb98f6a9dbe9801df6feb238d33e5659d69243))
* **core:** add toBase58Check to legacyBitcoin ([c220d7d](https://github.com/BitGo/BitGoJS/commit/c220d7d45b8533d343c1e2425109caa94da7a0da))
* **core:** add tss flow on pending approval ([22313ff](https://github.com/BitGo/BitGoJS/commit/22313ff47dcea31340eee3e83c9d09ad641e02e4))
* **core:** add unspent address check ([0bb42c2](https://github.com/BitGo/BitGoJS/commit/0bb42c205e28715a0e43ebbb374e61528db2aee2))
* **core:** add verifyWalletTransactionWithUnspents ([93e3292](https://github.com/BitGo/BitGoJS/commit/93e3292276c203b82e264ac19719699d5b3b6285))
* **core:** add, use getKrsProvider ([c839f08](https://github.com/BitGo/BitGoJS/commit/c839f088dca16cbc1d19c09241641f63518df444))
* **core:** added algo token config on core ([45bcf2f](https://github.com/BitGo/BitGoJS/commit/45bcf2f4c949995f126b06118b20c48d7b864bc1))
* **core:** added closeReminderTo into whitelist for cold enable token tx ([c7b725b](https://github.com/BitGo/BitGoJS/commit/c7b725b73681a74e1f3abcf1341c2fb5469b53e4))
* **core:** added cspr and tcspr to core module ([c7dd309](https://github.com/BitGo/BitGoJS/commit/c7dd30979e1ab222540949d2b9a0913742f51503))
* **core:** added ETH V1 examples ([32153d2](https://github.com/BitGo/BitGoJS/commit/32153d252765f3aedb1802d456886920bc75c5db))
* **core:** added node urls for Near ([4102c56](https://github.com/BitGo/BitGoJS/commit/4102c56fb4bc7ddbb57ef3e928b3f3e4c95c4073))
* **core:** added support for send on cashaddr ([0457b6d](https://github.com/BitGo/BitGoJS/commit/0457b6da7200aa8e298e8708830a76be1edf8454))
* **core:** allow alphanumeric memoid for eos ([ab4d3f2](https://github.com/BitGo/BitGoJS/commit/ab4d3f2ce838a8c80b9d6a9cbe5c7c91fc184854))
* **core:** allowed amount 0 on recipients for enable token ([29948a4](https://github.com/BitGo/BitGoJS/commit/29948a42492a9ce9e0ec2d16c8dfc8c34d594e89))
* **core:** bG-29057: Add non participant keyreg transaction support for Algorand ([e6b36c4](https://github.com/BitGo/BitGoJS/commit/e6b36c4a1e7e1175d32d6b8396f1a2f29790c273))
* **core:** create wallet with eip1559 ([3cfc343](https://github.com/BitGo/BitGoJS/commit/3cfc343ade54bb25a2b318adc2b4c94f3b78ca46))
* **core:** dot core helpers ([161d66a](https://github.com/BitGo/BitGoJS/commit/161d66a362b3e4f64a90fdf30ef97db9be9b7f0e))
* **core:** dot core sign tx ([4691678](https://github.com/BitGo/BitGoJS/commit/469167876a08928924a10b9406bc3a703eb19b51))
* **core:** dot review fixes ([4593a7a](https://github.com/BitGo/BitGoJS/commit/4593a7a5a01dada29d6bcab28587ba24fac187c5))
* **core:** enable hop transactions in avaxc ([4395c47](https://github.com/BitGo/BitGoJS/commit/4395c4791a64eca7500dd7c0658a6f9a5690e0af))
* **core:** enhanced address verification in sdk ([fa951d5](https://github.com/BitGo/BitGoJS/commit/fa951d5d6b4bf1ee914f2a74a94a7c92ba80d0e6))
* **core:** eos token configuration ([adbb0ae](https://github.com/BitGo/BitGoJS/commit/adbb0ae3d954b5c8dba88e31e1c2fc82528b1d46))
* **core:** explain transaction for transfer builder and keyreg builder ([9ce76ef](https://github.com/BitGo/BitGoJS/commit/9ce76efdf5a51ebf6f334f8593b9367258b1d6e4))
* **core:** explain unstake eos transaction ([a09501d](https://github.com/BitGo/BitGoJS/commit/a09501dd9cb5dc5f2b943c663c5c001299040099))
* **core:** export txEnumTypes from core ([ace20bb](https://github.com/BitGo/BitGoJS/commit/ace20bb3b01171c144dd577c216f6d3830800f09))
* **core:** expose compatibility layer at `require('bitgo').bitcoin` ([48cbfe3](https://github.com/BitGo/BitGoJS/commit/48cbfe33c867d0bd5e60dea6f132e5ad9f6c7a82))
* **core:** fix version of core dependecies ([7af586a](https://github.com/BitGo/BitGoJS/commit/7af586a7f6c4bdb261492a09ace651bdfb16f599))
* **core:** impelement tss wallet creation ([d5dfe3a](https://github.com/BitGo/BitGoJS/commit/d5dfe3a83c235ec1c30fbf8afc14e2bb46168218))
* **core:** implement algo sign txn ([1af84ea](https://github.com/BitGo/BitGoJS/commit/1af84ea225e0d9d35b1d0ef52baf35dd1e0a526c))
* **core:** implement explain transaction method for Casper ([6a607ec](https://github.com/BitGo/BitGoJS/commit/6a607ec7370b6c799472a58df043452ee76fc10f))
* **core:** implement getSignablePayload for baseCoin and sol ([c584437](https://github.com/BitGo/BitGoJS/commit/c584437485922af67940b807afde2bee348e158c))
* **core:** implement message signing ([0c2ba7e](https://github.com/BitGo/BitGoJS/commit/0c2ba7e8bfc89e8acbc5b8d6d0c50e2aa7f1905b))
* **core:** implement parseTransaction for CSPR ([9a81b62](https://github.com/BitGo/BitGoJS/commit/9a81b62dc577bf8f99a48f26b741d7223ddd8971))
* **core:** implement sign transaction for NEAR ([6da463a](https://github.com/BitGo/BitGoJS/commit/6da463a35a97a328985cdd0b3e3f173956884424))
* **core:** implement support for auth v3 ([9de7ffa](https://github.com/BitGo/BitGoJS/commit/9de7ffa560f323f8c71821fe39ea631812d58a5b))
* **core:** implement transaction signing methods ([739e72f](https://github.com/BitGo/BitGoJS/commit/739e72f30c101b9fe2c03f9b46ee67c854597a02))
* **core:** implement verify transaction function for sol ([aeaaf50](https://github.com/BitGo/BitGoJS/commit/aeaaf50577ff6d131654e283f8c23901825736fe))
* **core:** implement verifyAddress for stx coin ([d0a11b9](https://github.com/BitGo/BitGoJS/commit/d0a11b981d74534a4571210e592e48c86f3fe7f3))
* **core:** improve type signature for Unspent ([e0dfd6f](https://github.com/BitGo/BitGoJS/commit/e0dfd6f862ec5cdeab29763348a4430a4a837e0c))
* **core:** improve type signatures for recovery methods ([106a31d](https://github.com/BitGo/BitGoJS/commit/106a31db4cae439356fd3d6fcdb7f4d15166bfe3))
* **core:** move secp256k1 to regular dependencies ([d43b363](https://github.com/BitGo/BitGoJS/commit/d43b363aecb8164d0c6b5fca6b0cbf010bfb67fb))
* **core:** return bip32 in getBip32Keys ([82b0ba2](https://github.com/BitGo/BitGoJS/commit/82b0ba2beef8018b79c42524fd43035743a87f67))
* **core:** sign consolidate txns ([8aeeb3e](https://github.com/BitGo/BitGoJS/commit/8aeeb3e705aa1720dde1db0d85515364d8141e12))
* **core:** sign functions for casper ([9242aab](https://github.com/BitGo/BitGoJS/commit/9242aabaf3d362e03d341be1bfb924a23ed3b5e8))
* **core:** stx sign tx multisig ([873b006](https://github.com/BitGo/BitGoJS/commit/873b006307bc394d73e699280e3a20fb6683dcfe))
* **core:** support BLS-DKG key generation flow for ETH2 hot wallet creation ([356eee7](https://github.com/BitGo/BitGoJS/commit/356eee7b9fc090de6dda03a864c405e464701988))
* **core:** support creating algo wallets with seed ([41837ad](https://github.com/BitGo/BitGoJS/commit/41837ad8645285a157d1b565abfbe88f7ee15bf4))
* **core:** support creating solana ATA with sdk ([40ee96f](https://github.com/BitGo/BitGoJS/commit/40ee96ff0804f140b027cf9c7034b295a876a86d))
* **core:** support signing single sig dot transactions ([4ab0219](https://github.com/BitGo/BitGoJS/commit/4ab02195c5bf5e478e057a8568674b04f830bf1b))
* **core:** support tss wallet sharing ([249f424](https://github.com/BitGo/BitGoJS/commit/249f424f56d5ea2ecd4a4546986133e95d693fc1))
* **core:** tss wallet sharing tests ([3a5923b](https://github.com/BitGo/BitGoJS/commit/3a5923b13883d9022a86a7b8621b8dd488a7d85c))
* **core:** update createAddress to perform hardened derivation ([356dbaa](https://github.com/BitGo/BitGoJS/commit/356dbaa9503e002c5151e1497e0c1c583098b853))
* **core:** update forwarder flags ([670bde5](https://github.com/BitGo/BitGoJS/commit/670bde508bc75520ff540bf78e560f17abbf20b9))
* **core:** use sanitizeLegacyPath in transactionBuilder ([46543aa](https://github.com/BitGo/BitGoJS/commit/46543aa07a5194a857297f3f34c242b0435e8874))
* **core:** use scriptTypeForChain in abstractUtxoCoin ([4d675cc](https://github.com/BitGo/BitGoJS/commit/4d675ccdebb57a793468cb891b180b2db5d6a938))
* **core:** verify and prebuild hop transactions ([bac9bde](https://github.com/BitGo/BitGoJS/commit/bac9bde745371804357fa3cd673fa0572442f1b9))
* **core:** verify tss transactions ([319515f](https://github.com/BitGo/BitGoJS/commit/319515f91200fab7b96954c0b1687dbef7092308))
* **cspr:** update CSPR explorer URLs ([db7d1c1](https://github.com/BitGo/BitGoJS/commit/db7d1c1819d31632c8d2a89387003f944443362a))
* **defi:** add support for building, signing and sending meta transactions ([c1833cd](https://github.com/BitGo/BitGoJS/commit/c1833cd4568affec14886893afe43cc4f5132d76))
* **dot:** implement signMessage ([f0169d8](https://github.com/BitGo/BitGoJS/commit/f0169d8f03c9aee4ddb61998a36beba54dcdb063))
* enable consolidation support for solana ([1b8fcca](https://github.com/BitGo/BitGoJS/commit/1b8fcca3e6c6ce2125d6027834e50017c34e09a6))
* enable external signer mode for production ([077d2de](https://github.com/BitGo/BitGoJS/commit/077d2de7e477a2563b64b7d9be2fb7d4a594949b))
* **eos-tokens:** update explain transaction to support EOS tokens ([deab70b](https://github.com/BitGo/BitGoJS/commit/deab70b14be6ca1941588aae41e6cc0691d50aaf))
* **eos-tokens:** update explain transaction to support EOS tokens ([c8b7a24](https://github.com/BitGo/BitGoJS/commit/c8b7a24093a9e011b62e4a08b83eaa0782fb9752))
* **eos:** add eos token support ([6fb1319](https://github.com/BitGo/BitGoJS/commit/6fb1319cbf4dd076412d95fa1f93e7d2fca96305))
* **eth2:** add signMessage for ETH2 ([afbbcb2](https://github.com/BitGo/BitGoJS/commit/afbbcb2738002def0e48d06138a550b28a9b8a86))
* **eth:** add batcher ([cc4dfc3](https://github.com/BitGo/BitGoJS/commit/cc4dfc3ccdf9f845ef132a5efe36fb0dd05315ef))
* **eth:** build contract call transactions ([d6098fc](https://github.com/BitGo/BitGoJS/commit/d6098fcfcc1ff9657e6d85522c84af9fd3c10cd9))
* **eth:** enable eip1559 transactions for recovery ([f2b73ee](https://github.com/BitGo/BitGoJS/commit/f2b73ee9723b44de5ad874d13fe54291099ea41e))
* **eth:** generalize chain id configuration ([e97a7ce](https://github.com/BitGo/BitGoJS/commit/e97a7ce9b0134545b18825fc6be3d65c5f5fb1b0))
* **eth:** pass forwarderVersion flag ([9b56ab9](https://github.com/BitGo/BitGoJS/commit/9b56ab9321a3f53dcf5c7c8fc363cd7ac1b5df13))
* **eth:** update ethereumjs libs ([0bb3ada](https://github.com/BitGo/BitGoJS/commit/0bb3ada9eeb42aaa285dee277bf12ca49f5e4b6e))
* **eth:** verify pre-built eth txns ([f6a39c1](https://github.com/BitGo/BitGoJS/commit/f6a39c1205623149a26b543de3ec866cd5d2c860))
* **express:** add route for create address ([cdd3fec](https://github.com/BitGo/BitGoJS/commit/cdd3feca35881538bf83c01051792b86de6d9a11))
* **express:** add support for binding to an IPC socket (unix socket) ([b76c16c](https://github.com/BitGo/BitGoJS/commit/b76c16ca6d104b4fe6e47146a7c2e2a028552945))
* **express:** add support for returning keychains with generated wallet ([e04de53](https://github.com/BitGo/BitGoJS/commit/e04de5313ca418670c900e423a434ce2b6cf9a84))
* **express:** log request method and url upon failed request ([5a22ede](https://github.com/BitGo/BitGoJS/commit/5a22ede922509bd92fca09bf5be68dc3cff3445f))
* external signer to read encrypted privkeys ([32176e7](https://github.com/BitGo/BitGoJS/commit/32176e78edefa4cf3f5a853c33640604e812a42d))
* external signer to read private key from walletid ([735dcd9](https://github.com/BitGo/BitGoJS/commit/735dcd9cc0a00745405740d728c27da9aba993b3))
* feat: add pubkey aggregation ([7259779](https://github.com/BitGo/BitGoJS/commit/725977910f265d4d8726c153ed4b761a1a17437d))
* Fix CELO token transactionBuilder ([15b951a](https://github.com/BitGo/BitGoJS/commit/15b951a3b4a35b11e1cdafc5e98efffa8def729e))
* fixing halfSigned in SubmitTransactionOptions ([2603199](https://github.com/BitGo/BitGoJS/commit/2603199283e5598fd22318ec97d6983cca06c656))
* **hbar:** add check for key length ([b516bd0](https://github.com/BitGo/BitGoJS/commit/b516bd0559fbeaaca5415b24d0ff289819c3bbf4))
* **hbar:** update HBAR lib and protobufs ([425dbe5](https://github.com/BitGo/BitGoJS/commit/425dbe534984dc6da442c5f680608ed61d13f252))
* **hbar:** update hbar sdk ([b4bef77](https://github.com/BitGo/BitGoJS/commit/b4bef77c18c1ccf6933b1a4f853416375b10c4f1))
* implement keypair generation for casper in account-lib ([e944601](https://github.com/BitGo/BitGoJS/commit/e944601dda6182d9a2331ae2138de10afc3221cb))
* include feature flag for external signing API ([fedba73](https://github.com/BitGo/BitGoJS/commit/fedba7383214c6183261166c744a377547eaab74)), closes [#BG-38025](https://github.com/BitGo/BitGoJS/issues/BG-38025)
* make SDK derive key with address path for Tezos signing ([92ad147](https://github.com/BitGo/BitGoJS/commit/92ad1474ceaf7d43530a0581e76e43f5a38f2a01))
* **modules/bls-dkg:** add BLS-DKG module ([124a18b](https://github.com/BitGo/BitGoJS/commit/124a18bbc42c02345e7cc10cf79737f2d0d6481d))
* only allow external signing feature to run in test mode ([7b00932](https://github.com/BitGo/BitGoJS/commit/7b009324446b0b0546ca68832767afc5ef92f5c5))
* pass eip1559 fee params in send and sendmany ([73ef7fc](https://github.com/BitGo/BitGoJS/commit/73ef7fcca3f3559476063b4c16547e0314c42f13))
* **recovery:** cusomize gasPrice and gasLimit ([f777ba8](https://github.com/BitGo/BitGoJS/commit/f777ba842f69d11fb77254cfb8cc4f89e83eafbd))
* **remove fee address config from eth2 statics:** remove fee address config from eth2 statics ([38f0b40](https://github.com/BitGo/BitGoJS/commit/38f0b4019f22d7d72b3533a7ebac9127f7bf8686))
* resolve failing keycurve tests ([63702af](https://github.com/BitGo/BitGoJS/commit/63702afd782f7a85e2eaf55b344c63a992bb71e4))
* **root:** add unit-test-all to ci ([3d0efa4](https://github.com/BitGo/BitGoJS/commit/3d0efa49b3fb64dd658829e45c557152e8b7ae43))
* **root:** implement isWalletAddress for HBAR ([dc8d5fc](https://github.com/BitGo/BitGoJS/commit/dc8d5fca2c41881d97ffab084a1e6232f9a1c426))
* **root:** implement isWalletAddress for STX ([1828397](https://github.com/BitGo/BitGoJS/commit/1828397d1eedab1afde6e04ad64894437698cfa5))
* **root:** set tsconfig target to `es6` ([8c92c12](https://github.com/BitGo/BitGoJS/commit/8c92c12634722d4137d1c12c7e1e2f464973fae9))
* **root:** update SDK sendMany to use TSS ([6fef741](https://github.com/BitGo/BitGoJS/commit/6fef741913d6afb86ec3c73b6cdefe8a7c831afc))
* **root:** use lib "es2017" ([16ad3e4](https://github.com/BitGo/BitGoJS/commit/16ad3e4521ded7d5ef0f6da7e851d4c15e691d82))
* **sdk:** add feeLimit parameter to Send options ([c10d6fa](https://github.com/BitGo/BitGoJS/commit/c10d6fa384dc352aa082f1c4079dfa10fcde4e88))
* **sol:** address fee and id in explain transaction ([c494568](https://github.com/BitGo/BitGoJS/commit/c494568ceefa48b956fca6bc90bfdf707bf1b568))
* **sol:** implement parse transaction ([5a1f262](https://github.com/BitGo/BitGoJS/commit/5a1f262df2f9c4b250fc42d44626e59a39ad3b70))
* **sol:** initial implementation of explain transaction ([3e27360](https://github.com/BitGo/BitGoJS/commit/3e273608d70edf75faef4d62c59e7e1486fb3739))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* **statics:** add  new tokens ([805d911](https://github.com/BitGo/BitGoJS/commit/805d9111c08f8ce771f3ca02020ca92472b9d889))
* **statics:** add 2nd batch Feb tokens ([53aa64d](https://github.com/BitGo/BitGoJS/commit/53aa64d33ebb90bea1186ac39c2c4fce9464130f))
* **statics:** add add new tokens erc20 ([3e652ad](https://github.com/BitGo/BitGoJS/commit/3e652ad96946a51c25fbba9c8e5e9b3ee8a6b500))
* **statics:** add april tokens ERC20 and algo token ([a0cb164](https://github.com/BitGo/BitGoJS/commit/a0cb164d01872abc47925df97ddf43c35b58c7f1))
* **statics:** add arc20token and implementation ([ec6cf30](https://github.com/BitGo/BitGoJS/commit/ec6cf30349b6bf21af60bb37aa3dc2962a96a12a))
* **statics:** add AVAXC coin to statics ([0b8b1d6](https://github.com/BitGo/BitGoJS/commit/0b8b1d6e9198c63c910d3551d522db8996e3cc6a))
* **statics:** add Casper coin configuration to Statics ([f744b95](https://github.com/BitGo/BitGoJS/commit/f744b95b720aae1e1ddbd55a9bae5028f75e8b6a))
* **statics:** add casper explorer url ([fcb3a55](https://github.com/BitGo/BitGoJS/commit/fcb3a55f4db605e4e475383719e90949e63682e9))
* **statics:** add eos mainnet token config ([1ab6ee1](https://github.com/BitGo/BitGoJS/commit/1ab6ee1c0b47756b53705b7dbec9133cdd52738f))
* **statics:** add erc20 tokens ([fc496c3](https://github.com/BitGo/BitGoJS/commit/fc496c34a1b538ad1e31fbe6b4ab3a159590d40e))
* **statics:** add gteth support for trading ([53e5680](https://github.com/BitGo/BitGoJS/commit/53e56803407f54803e0c456bb32be87210a7cf59))
* **statics:** add imxv2 token ([68a7338](https://github.com/BitGo/BitGoJS/commit/68a733851cb393ad9f05510eda221ad2d6e19a45))
* **statics:** add matic coin config ([c6514c9](https://github.com/BitGo/BitGoJS/commit/c6514c98d494e7bc1a8ab110024d68abc51ae8f3))
* **statics:** add name property to networks ([6aebdd4](https://github.com/BitGo/BitGoJS/commit/6aebdd4a1a3b8972e890231a513fcd227cb53602))
* **statics:** add NEAR config ([61a74c1](https://github.com/BitGo/BitGoJS/commit/61a74c1749de1d9d7c5135451fcc8758efd4037b))
* **statics:** add new ERC20 and Stellar Tokens ([bad95cc](https://github.com/BitGo/BitGoJS/commit/bad95cc3ecbc7283fd131e50c7275b5fc2532d3e))
* **statics:** add new erc20 tokens to base.ts and coins.ts ([0e0e2c7](https://github.com/BitGo/BitGoJS/commit/0e0e2c763b2afa85d2a4acda80a3dec3b94e1d42))
* **statics:** add new erc20s for goerli london hard fork testing ([d566b39](https://github.com/BitGo/BitGoJS/commit/d566b39d3850eb69adc36ee7ad393faca1730dfd))
* **statics:** add new token ([fdf96bb](https://github.com/BitGo/BitGoJS/commit/fdf96bbb368b7a58e04f48edabbdace552212913))
* **statics:** add new tokens ([9328422](https://github.com/BitGo/BitGoJS/commit/93284228b12627efaa0e2f0c770f9dd733b9fc9f))
* **statics:** add new tokens ([b10781f](https://github.com/BitGo/BitGoJS/commit/b10781f075e69f2c6cd0f6ac5917f53dd031c090))
* **statics:** add new tokens ([c8d787c](https://github.com/BitGo/BitGoJS/commit/c8d787c0ad559c63dd75c6a504be086d50008833))
* **statics:** add new tokens ([db83f77](https://github.com/BitGo/BitGoJS/commit/db83f77e34054031496517d85f3517c4207edd74))
* **statics:** add new tokens ([4c113d3](https://github.com/BitGo/BitGoJS/commit/4c113d3e1b6436b70f645454656801a6ceb9f725))
* **statics:** add new tokens ERC20 ([4306190](https://github.com/BitGo/BitGoJS/commit/4306190a4d0a6f0dbfee413fc9bf88d0f431dde1))
* **statics:** add NPXS token again ([f258b41](https://github.com/BitGo/BitGoJS/commit/f258b414616b58e838c17cb8ca4758ca44132ceb))
* **statics:** add ofc casper coins support for trading ([a88406f](https://github.com/BitGo/BitGoJS/commit/a88406f444022d29ad6b5d746280025059a00217))
* **statics:** add ofc stacks coins support for trading ([3fa7ee4](https://github.com/BitGo/BitGoJS/commit/3fa7ee45a05dd873ca39aec9d1d452069ca19780))
* **statics:** add ofcavaxc and ofctavaxc support for trading ([c06f72c](https://github.com/BitGo/BitGoJS/commit/c06f72cb5a291f1badbf5374f88bbfba923ea208))
* **statics:** add priority tokens ([3b2b44b](https://github.com/BitGo/BitGoJS/commit/3b2b44bcd3f634da74b3b39c1cbee151e15ab67a))
* **statics:** add requires reserve ([28f4a6e](https://github.com/BitGo/BitGoJS/commit/28f4a6efefc8e71fb615eb5430dd4fc58b37dc21))
* **statics:** add support for several ERC20 tokens ([bfd95c2](https://github.com/BitGo/BitGoJS/commit/bfd95c2da0a2dc6acce093d0fa1e722a6d7a55db))
* **statics:** add tesnet tokenes ([de9d5b5](https://github.com/BitGo/BitGoJS/commit/de9d5b529b47c925f6e5741d599b06006bf58951))
* **statics:** add testnet tokens ([62c3273](https://github.com/BitGo/BitGoJS/commit/62c3273fa769f26b1304d9a7078d21308c81a02a))
* **statics:** add TOken MVI and WLUNA ([dbf3b0b](https://github.com/BitGo/BitGoJS/commit/dbf3b0b4cd92d7d0e2d8fda370ccb9a4a001d26a))
* **statics:** add token traxx ([752f2a3](https://github.com/BitGo/BitGoJS/commit/752f2a391bc5d23d4ae5b7eb3cfc70b2c3251f64))
* **statics:** add tokens jan batch 2nd ([0eb6d2c](https://github.com/BitGo/BitGoJS/commit/0eb6d2c7dbfab8ccdd89d81773b207412b96fa03))
* **statics:** add trx fee limit to statics ([50d01b8](https://github.com/BitGo/BitGoJS/commit/50d01b85de121c44825acb6fe21b69960d7431b7))
* **statics:** add usdc and usdt to config ([f96d622](https://github.com/BitGo/BitGoJS/commit/f96d622ba1f6244482f6cebc199f0ae783482fcd))
* **statics:** add usdc and usdt to config ([80934b7](https://github.com/BitGo/BitGoJS/commit/80934b7e0f168d5ef8d87470d96df850fa45e4e0))
* **statics:** add wec token ([b514252](https://github.com/BitGo/BitGoJS/commit/b51425253f22bc4ff8582a2292441ea2eaf55094))
* **statics:** add WETH and WBTC on tron ([5e2a631](https://github.com/BitGo/BitGoJS/commit/5e2a6316a48850b3a5df05018e768bf53b7573f2))
* **statics:** change name to gHDO and gHCN ([0112296](https://github.com/BitGo/BitGoJS/commit/011229645d474bfaf0e7529ac71d31e100285447))
* **statics:** coin feature custody ([448b45c](https://github.com/BitGo/BitGoJS/commit/448b45c072be055a1cf13974d0fc171a9a4e7350))
* **statics:** create FIAT currency in Testnet ([4b3bfcb](https://github.com/BitGo/BitGoJS/commit/4b3bfcb07c95cd9ca5cdf7d745fd5f56a3217652))
* **statics:** create FIAT tokens in Testnet ([9a4d727](https://github.com/BitGo/BitGoJS/commit/9a4d7275e1a65dd2cda54e8d4c8918f36f7952a8))
* **statics:** create fiat-usdc-tusdc ([a9a1d60](https://github.com/BitGo/BitGoJS/commit/a9a1d6058da72b1b1eebeec556d2af984ec660b6))
* **statics:** define coin sol in statics ([619d359](https://github.com/BitGo/BitGoJS/commit/619d359bebcbcca4cac6bf6a801eb89feb0b5997))
* **statics:** define coin sol in statics ([7d98009](https://github.com/BitGo/BitGoJS/commit/7d9800956bb10c14b2c377566ef8b3343a79b11c))
* **statics:** dot ignore coin init ([40b9015](https://github.com/BitGo/BitGoJS/commit/40b9015c262165e9d9d9f92f157964d60b3fe4d0))
* **statics:** dot statics addition ([60a0ecd](https://github.com/BitGo/BitGoJS/commit/60a0ecd008246706793d643078a979cf0497e68c))
* **statics:** eRC20 Token Support ([062b09c](https://github.com/BitGo/BitGoJS/commit/062b09c8eef4bee05eadfb4eef6ab1999de20e07))
* **statics:** eRC20 Token Support ([ba2d870](https://github.com/BitGo/BitGoJS/commit/ba2d8707fff934fe5124163bd78e52bf9a1730da))
* **statics:** fix address ([97d80a0](https://github.com/BitGo/BitGoJS/commit/97d80a090d2a25fbeabaedc244f537d7071d3830))
* **statics:** fix BXX address ([fa12160](https://github.com/BitGo/BitGoJS/commit/fa12160625c24161edf2ecbcafadf8cdd776408f))
* **statics:** hot fix address FDT AND FET1 ([153b3b3](https://github.com/BitGo/BitGoJS/commit/153b3b39b4b6b2716fc1f909c9cf5519ee71fec8))
* **statics:** implement iterator for CoinMap ([a4a2f4b](https://github.com/BitGo/BitGoJS/commit/a4a2f4b830084a136840abbaf3b30fe5852a60e1))
* **statics:** new tokens ([bbdf990](https://github.com/BitGo/BitGoJS/commit/bbdf990b660499333fdbf3b895c34137f2ab7298))
* **statics:** new tokens being added ([1491060](https://github.com/BitGo/BitGoJS/commit/1491060833c9c9bba2934191fa532a563999340a))
* **statics:** onboard erc-20 coins in groups 1-3 ([92c184e](https://github.com/BitGo/BitGoJS/commit/92c184e2db02cdf21e8e4265fc0b304a72601b43))
* **statics:** onboard february tokens ([5493311](https://github.com/BitGo/BitGoJS/commit/549331175e3f42925c0c2a45c7c3fc12326c92cd))
* **statics:** onboard tokens for prime trading ([681c4dd](https://github.com/BitGo/BitGoJS/commit/681c4dd40778ec8a542c7a9125c5d33c6a85c9cc))
* **statics:** onboarding  jan batch ([3753850](https://github.com/BitGo/BitGoJS/commit/375385035ce30b6202576a79e229355e49e3ee93))
* **statics:** onboarding BXXV1 token ([d05ec73](https://github.com/BitGo/BitGoJS/commit/d05ec73078c101dfd1fab48bf23511900b4c860f))
* **statics:** polkadot unit tests and exporer url ([1842a1f](https://github.com/BitGo/BitGoJS/commit/1842a1f98c3f8ee9057469d417a8da70889bddd0))
* **statics:** rename burp token ([762fb19](https://github.com/BitGo/BitGoJS/commit/762fb198b8ca381cd8a5a9c1b92e159cd4130781))
* **statics:** revert DYNS token to DYN ([a2a7f5b](https://github.com/BitGo/BitGoJS/commit/a2a7f5b6e6de05bbcbe1643ca5b4c630bdac92cf))
* **statics:** support new Algo token name format ([47a1cd7](https://github.com/BitGo/BitGoJS/commit/47a1cd7a66530795f853f7d775da5a4153c975a0))
* **statics:** update contract addresses ([db652bf](https://github.com/BitGo/BitGoJS/commit/db652bfa9d3cc1128a4ff04ebc07145ab97e508a))
* **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))
* **statics:** update decimal places for c8p token ([b5604ca](https://github.com/BitGo/BitGoJS/commit/b5604ca1f3af09e61cd9bf28cb16d08b74e06958))
* **statics:** update EOS with SUPPORTS_TOKENS feature ([241630c](https://github.com/BitGo/BitGoJS/commit/241630c8f36c6c6441cda2dc01331de816196e39))
* **statics:** update token contract addresses ([85744bf](https://github.com/BitGo/BitGoJS/commit/85744bf3c66141cd3841259acb91d4f2eab1a958))
* **statics:** update Token Gog ([b3dde20](https://github.com/BitGo/BitGoJS/commit/b3dde20d5fbc2e768f4bfc23fad949e6dfdd7005))
* **statics:** update USDC and USDT name and address ([83c9b06](https://github.com/BitGo/BitGoJS/commit/83c9b0684499d0482b99301f74e69ff796123075))
* **statics:** update westend metadata ([a057ed5](https://github.com/BitGo/BitGoJS/commit/a057ed51b84819ad455469f29bf1774ed756ffe0))
* **statics:** wtk token contract update ([eadb5eb](https://github.com/BitGo/BitGoJS/commit/eadb5eb6f51a868411d2253b7525462e0e196f26))
* **stx:** remove 0 in memo ([7f5d531](https://github.com/BitGo/BitGoJS/commit/7f5d53159a6f54760799fb36d776f541c29d765e))
* **support flush coins:** support flushing coins ([2afcddf](https://github.com/BitGo/BitGoJS/commit/2afcddffd762d9e50343b234b736735eb23c6990))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))
* support validation of  base58 dot public keys ([a8fae0d](https://github.com/BitGo/BitGoJS/commit/a8fae0d0e69154327625a523afdc2b5f4e512cda))
* **terc token:** update decimal places for terc token ([d9d2de6](https://github.com/BitGo/BitGoJS/commit/d9d2de685296f3ec6e3ad40e53d04158540cd516))
* **Tron TransactionBuilder:** validateKey ([b42e67e](https://github.com/BitGo/BitGoJS/commit/b42e67e8f4dab69ef9984f539db12e84e0edb3da))
* **trx account lib:** add contract call builder ([01137d2](https://github.com/BitGo/BitGoJS/commit/01137d2be9ce535dd30482cd5d143f335e3369e1))
* **trx account lib:** inputs and outputs complement ([be2d51f](https://github.com/BitGo/BitGoJS/commit/be2d51fcc03c9945c25cd7c48d10dc774f9acfad))
* tss keychain creation ([93c33be](https://github.com/BitGo/BitGoJS/commit/93c33be9bdf62ef2bb676f04a509e564cf5c7725))
* unhardened derivation with tss ([ce29c26](https://github.com/BitGo/BitGoJS/commit/ce29c26bfcdbf9b1e015d8ef759ec1b2b29ccda9))
* **unspents:** add p2tr tests ([8a0f084](https://github.com/BitGo/BitGoJS/commit/8a0f0841eabd07478b6f40129e15e83954743fc9))
* **unspents:** classify p2tr script path sigs ([28d6860](https://github.com/BitGo/BitGoJS/commit/28d6860e1beedf0dd2ba0bb708530fd9032071fe))
* **unspents:** use `parsed.scriptType` parameter in fromInput ([84dd467](https://github.com/BitGo/BitGoJS/commit/84dd4670aaadb11fd966d4d3637f02b54d2c5ffc))
* update params to post /signatureshares ([49cdcdd](https://github.com/BitGo/BitGoJS/commit/49cdcdd9fb1af3f3cb316251fd0682740e31b390))
* update secp256k1 in core to ^4 ([bfb3128](https://github.com/BitGo/BitGoJS/commit/bfb3128131b19d07540174e6c250ae3b353ecd54))
* update tss key creation to support hd ([9611e5d](https://github.com/BitGo/BitGoJS/commit/9611e5dce0460d0fae691fbc90c887d3f8e720fd))
* update tss signing to support hd ([a3b3b3f](https://github.com/BitGo/BitGoJS/commit/a3b3b3fed18a462d85d11a6f0fd498edf0f699e2))
* **utxo-bin:** add package `utxo-bin` ([149f81c](https://github.com/BitGo/BitGoJS/commit/149f81c7452c93c2a0b7c221eb4a9dcd99befafd))
* **utxo-bin:** add support for odd transactions ([4c44297](https://github.com/BitGo/BitGoJS/commit/4c442974b5638f97db2ca013ecd887adaa9f8707))
* **utxo-bin:** use prevOutputs, spend status ([9f8bbfb](https://github.com/BitGo/BitGoJS/commit/9f8bbfbe7479e7bfde21532efb64c00379e485bd))
* **utxo-lib:** add `bitgo/wallet` package ([78aff6c](https://github.com/BitGo/BitGoJS/commit/78aff6c1260266ab4c7e1b84d07177e5237d2eaa))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([ee826bd](https://github.com/BitGo/BitGoJS/commit/ee826bd8f6ef96ad0b1f1986ac648f9498634ba8))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([5ea5758](https://github.com/BitGo/BitGoJS/commit/5ea5758fbadfc4d474d7fca627f2dde85e9d3514))
* **utxo-lib:** add `wallet/chains` ([0439a0d](https://github.com/BitGo/BitGoJS/commit/0439a0d4ffe4a15a9932ed70f98cc5745cc6526f))
* **utxo-lib:** add addressFormats ([c1bd457](https://github.com/BitGo/BitGoJS/commit/c1bd45796e0bae9c2fdd4964f2771812147f14d3))
* **utxo-lib:** add captured test fixtures ([0f98933](https://github.com/BitGo/BitGoJS/commit/0f98933cb21a501967ebc78411fb093221b51aa9))
* **utxo-lib:** add createSpendTransaction match test ([436104a](https://github.com/BitGo/BitGoJS/commit/436104aabcb256e1045afc263473a808af8467ca))
* **utxo-lib:** add createTransactionFromHex() ([a7c6032](https://github.com/BitGo/BitGoJS/commit/a7c6032c5f947c372d9a18fb44343c4e53b5ba27))
* **utxo-lib:** add getDefaultSigHash(network) ([bdb5ace](https://github.com/BitGo/BitGoJS/commit/bdb5acebf94bf91540c6491489c69c8f41a40cca))
* **utxo-lib:** add isSupportedScriptType(network, scriptType) ([ae53ab8](https://github.com/BitGo/BitGoJS/commit/ae53ab868c2bc9c9a64d628c5538861c08abef6f))
* **utxo-lib:** add more assertions to createOutputScript2of3 ([29e5735](https://github.com/BitGo/BitGoJS/commit/29e5735410e09a77ad6a178ffd5488fdd97a8828))
* **utxo-lib:** add p2tr output scripts support ([3aebc5b](https://github.com/BitGo/BitGoJS/commit/3aebc5b77052e02b2cd688d01935c7e199e25902))
* **utxo-lib:** add p2tr output scripts support ([7af9d9e](https://github.com/BitGo/BitGoJS/commit/7af9d9e6da4d6f2ba83b26794ba58ccaf4b738a9))
* **utxo-lib:** add padInputScript ([0c1be6e](https://github.com/BitGo/BitGoJS/commit/0c1be6e7bf37ef1bd6392b8492624cefc83e4f8c))
* **utxo-lib:** add ParsedSignatureScriptTaproot ([206c860](https://github.com/BitGo/BitGoJS/commit/206c860a98fa6393399a8d9d56cee63d9dbc5c72))
* **utxo-lib:** add property `scriptType` to ParsedSignatureScript ([c0b678f](https://github.com/BitGo/BitGoJS/commit/c0b678f2b28cf81e41399902a6bdb5e1592c4e3a))
* **utxo-lib:** add RPC tests ([1a9a9c5](https://github.com/BitGo/BitGoJS/commit/1a9a9c519e38d6eecaed572ff47f33d9dc25e50a))
* **utxo-lib:** add scriptPathLevel to ParsedSignatureScriptTaproot ([27cf563](https://github.com/BitGo/BitGoJS/commit/27cf563f7121f7306f39c9e3b3477c70c485f69d))
* **utxo-lib:** add scriptType argument for getDefaultSigHash ([87d5b7f](https://github.com/BitGo/BitGoJS/commit/87d5b7f521bffaf76885ab76c83be427cb6811be))
* **utxo-lib:** add scriptTypeForChain() ([e11cabe](https://github.com/BitGo/BitGoJS/commit/e11cabe06ef98311270131462142d78f13c73063))
* **utxo-lib:** add signature helpers, tests ([5ea779e](https://github.com/BitGo/BitGoJS/commit/5ea779e2983a7421d4ac9aeb02708aa414c7cc9a))
* **utxo-lib:** add signInput2Of3(), signInputP2shP2pk() ([e3927c0](https://github.com/BitGo/BitGoJS/commit/e3927c010bae3e8e142da15b2975493768135a3e))
* **utxo-lib:** add support for p2tr in signInput2Of3 ([7890854](https://github.com/BitGo/BitGoJS/commit/78908547f27ab52baa4f6e7c5d5561ecaf422863))
* **utxo-lib:** add support for PrevOutput[] in TransactionBuilder ([cdf1899](https://github.com/BitGo/BitGoJS/commit/cdf1899da3db97e6229e23373e1921b4634f44cf))
* **utxo-lib:** add support for Zcash version 5 "NU5" ([5d2c383](https://github.com/BitGo/BitGoJS/commit/5d2c383454383725bb57b7e676851cdfcba86521))
* **utxo-lib:** add test comparing rpc data to parsed data ([bd5fb7a](https://github.com/BitGo/BitGoJS/commit/bd5fb7aa550d5510ff062db94d342ebddb8890ef))
* **utxo-lib:** add test fixtures for special dash transactions ([0a655ae](https://github.com/BitGo/BitGoJS/commit/0a655aee64022b6f368f867445162b1f8f3cf4cd))
* **utxo-lib:** add tests for half-signed transactions ([c8e5222](https://github.com/BitGo/BitGoJS/commit/c8e52229115846303110f24421836500b1140bc9))
* **utxo-lib:** add thirdparty fixtures ([9d48994](https://github.com/BitGo/BitGoJS/commit/9d48994887aaa094fc2ee2cd375384c154473fab))
* **utxo-lib:** add verifySignatureWithPublicKeys ([4682727](https://github.com/BitGo/BitGoJS/commit/46827273ab457c4073cd468d9a33c39b128234a3))
* **utxo-lib:** add wrappers for Transaction(Builder) constructors ([62aafa9](https://github.com/BitGo/BitGoJS/commit/62aafa98e69b88a801d0fb5bb3e751391a426f44))
* **utxo-lib:** add zcash version 450 ([8f9d332](https://github.com/BitGo/BitGoJS/commit/8f9d332e6b7517cb132c7fc749b587c6aadcc201))
* **utxo-lib:** add, use parseTransactionRoundTrip ([fc2ece4](https://github.com/BitGo/BitGoJS/commit/fc2ece41ead787a9103cb74ffdf0132a3acd3a48))
* **utxo-lib:** allow select networks in integration_local_rpc ([dfc6696](https://github.com/BitGo/BitGoJS/commit/dfc66966a0c7c6e8be5cd5fca7250e30920a9beb))
* **utxo-lib:** export address check types ([411db60](https://github.com/BitGo/BitGoJS/commit/411db60aa0df6b85e253b59d1641476bac46a4df))
* **utxo-lib:** export type NetworkName ([df27a99](https://github.com/BitGo/BitGoJS/commit/df27a9951edf9a178594a388a353f6933beee053))
* **utxo-lib:** export, use BitcoinJSNetwork ([ce85f44](https://github.com/BitGo/BitGoJS/commit/ce85f44aad5e36903d29c66d7e3ec179c9c4f887))
* **utxo-lib:** expose lower-level signature validation methods ([4a2e276](https://github.com/BitGo/BitGoJS/commit/4a2e2769f6e8c9281e050e3a6e2df3ce498bf68b))
* **utxo-lib:** implement parseSignatureScript for p2tr ([d600c42](https://github.com/BitGo/BitGoJS/commit/d600c42a0cca9163b5a6611e7e9fd4d7fd995245))
* **utxo-lib:** improve p2tr readability, types ([81faf11](https://github.com/BitGo/BitGoJS/commit/81faf110d818f648796ca4c1d078b71149577d69))
* **utxo-lib:** move outputScripts to bitgo subpackage ([c1b0fa7](https://github.com/BitGo/BitGoJS/commit/c1b0fa722243d7d6c28ae0b7762387e24d234052))
* **utxo-lib:** support import from `src/bitgo` ([f5ca9dd](https://github.com/BitGo/BitGoJS/commit/f5ca9dde4c9435d483791fd6075f4cde41931f8f))
* **utxo-lib:** support p2shP2pk inputs ([f034ead](https://github.com/BitGo/BitGoJS/commit/f034ead6d4ca5d2a11bcd7c1c7042e6de5dd04de))
* **utxo-lib:** support schnorr signature verification ([6e24fd6](https://github.com/BitGo/BitGoJS/commit/6e24fd621a4d1a0a87a1f9ecaab61ce514cad857))
* **utxo-lib:** test createTransactionBuilderFromTransaction ([9761ec7](https://github.com/BitGo/BitGoJS/commit/9761ec7c5b7bc5460a6b7134406c6d3142fc515d))
* **utxo-lib:** use `ChainCode` for `WalletUnspent['chain']` ([6c9c73b](https://github.com/BitGo/BitGoJS/commit/6c9c73b13a32f847912d944748c2ef67fca913fe))
* **utxo-lib:** use new package name and new external links ([3805eee](https://github.com/BitGo/BitGoJS/commit/3805eee8abc955b1d92da00c650c684e1662ac19))
* **utxo:** accept txBuilder in signAndVerifyWalletTransaction ([61d8335](https://github.com/BitGo/BitGoJS/commit/61d8335c527615b6f80d57eed6ce7ffadf985d61))
* **utxolib:** add bitcoingoldTestnet ([06c1dd6](https://github.com/BitGo/BitGoJS/commit/06c1dd6f7ae9e738fedd398e7665b84c03daf46c)), closes [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L332](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L332) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L329](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L329) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L326](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L326) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L327](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L327) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L328](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L328) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h#L35](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h/issues/L35)
* **utxolib:** implement padInputScript for p2wsh transactions ([f73f7ea](https://github.com/BitGo/BitGoJS/commit/f73f7eaebf1e675e9203beb383f35fc4193c130a))
* **utxo:** update createTaprootScript2of3 ([31bb3ed](https://github.com/BitGo/BitGoJS/commit/31bb3edfb2046daabeea14587cf7735c4c383783))
* **wp:** added support of cashaddr for create address ([fcdc261](https://github.com/BitGo/BitGoJS/commit/fcdc261df6187d9befb30c81ba6882056e9a9ffb))


### Bug Fixes

* **account-lib:** add hash to signable ([401266a](https://github.com/BitGo/BitGoJS/commit/401266a4094be9ab7d034565476635817fdf828b))
* **account-lib:** add input/output in stx contract call ([05f95f9](https://github.com/BitGo/BitGoJS/commit/05f95f9df5c468bd4ddbaede874cf8e9ed58a014))
* **account-lib:** add more checks and tests ([423bc26](https://github.com/BitGo/BitGoJS/commit/423bc26196d0fcb9f5f8cdf5110f446b804a051d))
* **account-lib:** add parsing for optional type in stringifyCV ([3f3fddb](https://github.com/BitGo/BitGoJS/commit/3f3fddbb37ea970eac8311585f22bb8dc6a8d0dc))
* **account-lib:** bG-29930 Update and pin hashgraph sdk version ([5654e37](https://github.com/BitGo/BitGoJS/commit/5654e37b4500f7fe8c9e81d22a6ce9c2a1e76410))
* **account-lib:** change statics version back to ^6.0.0 ([49f0a02](https://github.com/BitGo/BitGoJS/commit/49f0a02273ce1d6b0881bfa4a05eb8743780326f))
* **account-lib:** changed key validation for Solana ([274af3b](https://github.com/BitGo/BitGoJS/commit/274af3b8cd395f9969224aa2441de558514fbb8a))
* **account-lib:** check accountId for null before accessing property ([b3639d8](https://github.com/BitGo/BitGoJS/commit/b3639d86f757d840bc6433cd9968d1158b75e2ec))
* **account-lib:** dot unit test memory issue ([709266b](https://github.com/BitGo/BitGoJS/commit/709266b172bcd288e1912b9441752bd3be4545b8))
* **account-lib:** eip1559 transaction builder deserialization ([32a3151](https://github.com/BitGo/BitGoJS/commit/32a31518cf1ffcddad5225baa7073b62e4779280))
* **account-lib:** fix addSignature method of cspr transaction ([ce00564](https://github.com/BitGo/BitGoJS/commit/ce005643424f5306a60e688306194cf14bb69846))
* **account-lib:** fix amount in cspr delegate & undelegate builders ([43b0b3f](https://github.com/BitGo/BitGoJS/commit/43b0b3fcf2fbc3eb2420e943a27e0cfb28065dd1))
* **account-lib:** fix amount method unit ([8df519b](https://github.com/BitGo/BitGoJS/commit/8df519b83c08ce985b6011edf6685eafb948eea4))
* **account-lib:** fix chain name used in CSPR transactions ([a54cdab](https://github.com/BitGo/BitGoJS/commit/a54cdab2126a0b81b66029aef8ce5684c107e192))
* **account-lib:** fix CSPR address validation ([db92eb4](https://github.com/BitGo/BitGoJS/commit/db92eb45c69a37abd0a118194205208682ba32c8))
* **account-lib:** fix CSPR address validation for encoding change ([91b1ba3](https://github.com/BitGo/BitGoJS/commit/91b1ba35cfa86560aae6c0e7ec2d25b7c969b891))
* **account-lib:** fix decode signed algo transaction ([fd82efe](https://github.com/BitGo/BitGoJS/commit/fd82efee18ab186b1d14d301a99fa803edaffa7f))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([977d4df](https://github.com/BitGo/BitGoJS/commit/977d4df509101cd463d81ce2330b59ad2dc90b6e))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([94e0fa2](https://github.com/BitGo/BitGoJS/commit/94e0fa27a3b39e139f441fafc7a834a2e0007cdf))
* **account-lib:** fix get account hash method ([e321c9c](https://github.com/BitGo/BitGoJS/commit/e321c9c077aef8a8d798cf6d77b1e47d4bd8efd1))
* **account-lib:** fix getTransferId method of cspr utils ([2d3d658](https://github.com/BitGo/BitGoJS/commit/2d3d658d17cc1f4e790ba3164b014df412b4ffff))
* **account-lib:** fix isValidPublicKey to check for undefined pubKey ([9020a0f](https://github.com/BitGo/BitGoJS/commit/9020a0f26b5681eab2e2081be37862e8e8d3f782))
* **account-lib:** fix lint errors ([56b789f](https://github.com/BitGo/BitGoJS/commit/56b789f5ca161bc8c5f14e95ea81d3db67e9b9b5))
* **account-lib:** fix lint errors ([cc87263](https://github.com/BitGo/BitGoJS/commit/cc872636370ed76e39c7c5726ad9afbbdecd855d))
* **account-lib:** fix postcondition for send many builder ([7c3c70f](https://github.com/BitGo/BitGoJS/commit/7c3c70fa7d01586c3e95583f45c02f69ff8411e1))
* **account-lib:** fix processSigning method of cspr transactionBuilder ([895c643](https://github.com/BitGo/BitGoJS/commit/895c643e7af72d311b92931deed8fcccf14f2752))
* **account-lib:** fix solana isValidAddress ([0f1cd93](https://github.com/BitGo/BitGoJS/commit/0f1cd93dd30d5cc7313201f4bf2ec9f657022465))
* **account-lib:** fix test ([31763a1](https://github.com/BitGo/BitGoJS/commit/31763a1ae3183e0b908427fa9b67b2350e76cbe3))
* **account-lib:** fix trx fee limit boundary ([059cf6e](https://github.com/BitGo/BitGoJS/commit/059cf6ef80b2d69693a72e2eb7bff6db3a383d30))
* **account-lib:** fix types in algo utils and typos ([415225c](https://github.com/BitGo/BitGoJS/commit/415225ceb3ad95f63b98d4235f0dbc975dbc83e1))
* **account-lib:** fix typo on json field ([3025e83](https://github.com/BitGo/BitGoJS/commit/3025e83071f56d3fc03621aeb14a5ce473f4573a))
* **account-lib:** fix validate algo address test ([801846d](https://github.com/BitGo/BitGoJS/commit/801846dad63010c53ff7e614f7ded1aea6e4c8e3))
* **account-lib:** fix validity windows unit test ([1f39b99](https://github.com/BitGo/BitGoJS/commit/1f39b99bcfe6e921c9c69d5183925270c4468861))
* **account-lib:** fixed tobroadcastformat method ([8cf3353](https://github.com/BitGo/BitGoJS/commit/8cf335353dc0b9a9f0091ac7ced099cdddee4a35))
* **account-lib:** merge-related changes (stacks renamed to stx, etc) ([64a9597](https://github.com/BitGo/BitGoJS/commit/64a9597e6eec4e230b0e4bfcb28021f66adcc18c))
* **account-lib:** readd `es5` target and `esModuleInterop` ([f2e316d](https://github.com/BitGo/BitGoJS/commit/f2e316dd6df0eb2387516b755ce84b9c96e523c4))
* **account-lib:** remove algo utils ([ba8ea30](https://github.com/BitGo/BitGoJS/commit/ba8ea301c639bdbf3e5c033b8f854cef94498086))
* **account-lib:** remove proxy type from constants STLX-12064 ([82b1d47](https://github.com/BitGo/BitGoJS/commit/82b1d475a7c958d0d7420998e55c603f1a29f214))
* **account-lib:** remove unused import ([fe4555f](https://github.com/BitGo/BitGoJS/commit/fe4555fe5bd91ba936ae8a807153a94864bb301d))
* **account-lib:** stacks multi sig issue ([253c46d](https://github.com/BitGo/BitGoJS/commit/253c46dce8b31dc19b9cb987fbcf339652edf39e))
* **account-lib:** stx default signers to 2 ([02a6c56](https://github.com/BitGo/BitGoJS/commit/02a6c56c44983fb81b6d143783db431be2326a6f))
* **account-lib:** stx get signatures to return only signatures ([271fefb](https://github.com/BitGo/BitGoJS/commit/271fefbb6e9e74ba34e10cc14553961434c11902))
* **account-lib:** stx half sign tx ([0925fe4](https://github.com/BitGo/BitGoJS/commit/0925fe4018431f2b5db48620b8dbcc51267cecd0))
* **account-lib:** update algo decode transaction method ([e142775](https://github.com/BitGo/BitGoJS/commit/e142775f19bad0fec015fe9eb1bf73afca87f6ee))
* **account-lib:** update dot feeOption jsdoc ([dff22a8](https://github.com/BitGo/BitGoJS/commit/dff22a82012399bb95314ae31cbc52407028375d))
* **account-lib:** update static values for dot tests STLX-11678 ([773800e](https://github.com/BitGo/BitGoJS/commit/773800e47e75902b7e30d7bbbc0807f166fc73e9))
* **account-lib:** update validitiyWindow dot validation ([47d35ff](https://github.com/BitGo/BitGoJS/commit/47d35ffc23deb143e7c32b2d180fdbe584698299))
* **account-lib:** use stable version of @bitgo/blake2b ([77d035a](https://github.com/BitGo/BitGoJS/commit/77d035acaa5ff9925a891075375c91db5158811e))
* **account-lib:** yarn lock after revert ([f1b66b2](https://github.com/BitGo/BitGoJS/commit/f1b66b2959a41412b34c8f59c5981b43a139482b))
* **accountlib:** fix getStxAddressFromPubKeys to add signatures required paramater ([2d7e5ae](https://github.com/BitGo/BitGoJS/commit/2d7e5ae9ca59f592b65e15c8b06ce63db27754bd))
* **accountlib:** improve multisig in order to user any order or combination of keys ([37235fd](https://github.com/BitGo/BitGoJS/commit/37235fdfdc83133eab1db185b1598671c092a89c))
* **accountlib:** stx transactionBuilder network fix ([d966f10](https://github.com/BitGo/BitGoJS/commit/d966f1084c3cf935fc3c7e125490088a5edf530a))
* add `publishConfig` package.json of public packages ([195ac13](https://github.com/BitGo/BitGoJS/commit/195ac137d9a8da9c6c6cfe5821738ecc898b6c2c))
* add `publishConfig` package.json of public packages ([28cf439](https://github.com/BitGo/BitGoJS/commit/28cf439c49a075de7241895374ccce6318792b1c))
* add more informative error msg ([4fbb634](https://github.com/BitGo/BitGoJS/commit/4fbb634e6bfaf707322a369ab70241956a770d76))
* add new tokens ([c1db855](https://github.com/BitGo/BitGoJS/commit/c1db855ac2a0a970b4052adab86a3c261760c577))
* add to base and changes for prettify ([95035a8](https://github.com/BitGo/BitGoJS/commit/95035a82193f5c2a722463c948386723b9afb43a))
* add up-to-date node version support info to README ([6eb0962](https://github.com/BitGo/BitGoJS/commit/6eb0962a0469bafd151b7ab02940aae0ad97b857))
* address review comments ([261bc0a](https://github.com/BitGo/BitGoJS/commit/261bc0a062756e98897edfc3e2494e6ed1cb7574))
* adds wallet version support in core ([f76e71a](https://github.com/BitGo/BitGoJS/commit/f76e71a8f8b492155500ad2f429a95f7310ca897))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([931ef50](https://github.com/BitGo/BitGoJS/commit/931ef50e7cc093923c3b6a799f7d70472171bf2a))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([ef1afb8](https://github.com/BitGo/BitGoJS/commit/ef1afb8ead03e852a4a40060f7d423967b9b032f))
* **algo:** invalid signature on create wallet (bg-38048) ([c7071cc](https://github.com/BitGo/BitGoJS/commit/c7071ccbbbe1d6889cd912242addbe37c04fb0c7))
* **algo:** support for signing unsigned keyreg transaction (bg-37892) ([ffdfdf2](https://github.com/BitGo/BitGoJS/commit/ffdfdf24085f5d1b2fba262d7ac5bcfa5761126f))
* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** fix avaxctoken cannot withdraw ([a3c1dc7](https://github.com/BitGo/BitGoJS/commit/a3c1dc78a994e040df2a17b7488dae6a39090fff))
* **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
* **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))
* **bitgo:** fix verifyTransaction for near ([9d5cf1f](https://github.com/BitGo/BitGoJS/commit/9d5cf1f3363a321363bf39cdde76a99c2eae9e6a))
* **bitgojs:** fix security audit build failure ([347cc22](https://github.com/BitGo/BitGoJS/commit/347cc227f11b6efb5f5eed0277d41d2921e0ba94))
* **bitgojs:** revert revert of algo-tokens changes ([5784921](https://github.com/BitGo/BitGoJS/commit/5784921456c625340b8101a1ad9b528fc4aa1686))
* **bitgojs:** revert revert of algo-tokens changes ([a469736](https://github.com/BitGo/BitGoJS/commit/a469736ef57afa47d829d223cfd7fb4b86771c52))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* **blockapis:** use correct mocha import ([958b2c0](https://github.com/BitGo/BitGoJS/commit/958b2c093df39b5ec80ca793ba9d71d451fa7d57))
* **bls-dkg:** add publish config for public package ([c530435](https://github.com/BitGo/BitGoJS/commit/c530435a1ac863ee9d1e6b9d48b5bc73db101811))
* catch etherscan rate limit error ([d0b1b0f](https://github.com/BitGo/BitGoJS/commit/d0b1b0f4670695af7eebd41ff474d3d9edcacc74))
* change automated commit message to be conventional-commits compatible ([d824782](https://github.com/BitGo/BitGoJS/commit/d8247827775261f7b9ba3fe917751aec169c905b))
* change keyname from asset to symbol in amount ([5b23bf7](https://github.com/BitGo/BitGoJS/commit/5b23bf780adb8288336e807c45c2a745d876599d))
* change the token address for cqt ([1149bdc](https://github.com/BitGo/BitGoJS/commit/1149bdcfb02276556dea04e0ee84bdbfd4661713))
* change the token address for cqt ([2c545da](https://github.com/BitGo/BitGoJS/commit/2c545dae350b84806ba66fb9455718602420e3f9))
* check account properties before using ([9d2457f](https://github.com/BitGo/BitGoJS/commit/9d2457fb62bbf6079f55cb0125b4d714dd9cf2d7))
* **ci:** add signature to .drone.yml when it gets regenerated from the .drone.jsonnet ([00c80a9](https://github.com/BitGo/BitGoJS/commit/00c80a950682a214ff072aa36eb9c5f06cf5beb8))
* **ci:** ignore merge commits when checking commit messages ([b24707e](https://github.com/BitGo/BitGoJS/commit/b24707ee3a96304a0ab7a1f8c68f565f0309305f))
* **codeowners:** add eth-team to codeowners ([dd84a05](https://github.com/BitGo/BitGoJS/commit/dd84a0548dcebe93a9c68b7d9d13bee20e547911))
* **config:** add BSV and BCHA as recoverable coin with coincover ([76f7b40](https://github.com/BitGo/BitGoJS/commit/76f7b40e93dfbe59307e180317a2b5f94f06087e))
* **core:** accountSet txn support ([2e3b236](https://github.com/BitGo/BitGoJS/commit/2e3b2368e5a19ef1fa5feae1a65f3091ca63e0f6))
* **core:** add a "memo" field to stx's explainTransaction's displayOrder ([be8c251](https://github.com/BitGo/BitGoJS/commit/be8c251fbfc3380ff1edcd310a070002efeb962a))
* **core:** add algo seed encoding ([c0f8ea5](https://github.com/BitGo/BitGoJS/commit/c0f8ea5cd07e1f106ab17ad09399e04b1f6591af))
* **core:** add algo seed encoding ([8808b1c](https://github.com/BitGo/BitGoJS/commit/8808b1cfa228cf81d91a064b0f24e97e05670f2d))
* **core:** add base `explainTransaction` method ([4731af3](https://github.com/BitGo/BitGoJS/commit/4731af36cb4992843c4ecfde77395098afc5a10d))
* **core:** add flush threshold example ([6048485](https://github.com/BitGo/BitGoJS/commit/6048485fc255e6db8dff581e91bbfbef81aade90))
* **core:** add missing dep on `@bitgo/blockapis` ([a2cd98e](https://github.com/BitGo/BitGoJS/commit/a2cd98e3ebb65a6f0b243ec5ab1b1840342c309f))
* **core:** add multisig type param on add wallet ([2622028](https://github.com/BitGo/BitGoJS/commit/2622028bfe2b4d50aa15ae20e12e92fc27f10e5e))
* **core:** add route name as tx type for consolidate/fanout ([b6c4733](https://github.com/BitGo/BitGoJS/commit/b6c4733ae942ed893772111400e1bb56593ca03a))
* **core:** add signing params for hopTx ([987bc33](https://github.com/BitGo/BitGoJS/commit/987bc3315a45e730f1576ee6ccb6191117aa20f2))
* **core:** add transferid to list of valid tx params ([7e222db](https://github.com/BitGo/BitGoJS/commit/7e222dbfe0f1547ca28364c113e0a13b88bd6842))
* **core:** add transferid to sendmany options ([d713f4a](https://github.com/BitGo/BitGoJS/commit/d713f4a015d8167d4658f76cbf58d62fd810cb50))
* **core:** address verification should fail for uppercase bech32 addresses ([39c5d7c](https://github.com/BitGo/BitGoJS/commit/39c5d7cbdd793ade4ba939bf4c6df1b4d9ec5e79))
* **core:** algosdk typings ([80095b1](https://github.com/BitGo/BitGoJS/commit/80095b1d665282cf81d241f09364ec36c5b98a81))
* **core:** allow for ENS resolution in WP to change recipient addr(eth) ([8d8a9e5](https://github.com/BitGo/BitGoJS/commit/8d8a9e589cff5ee717b2dea9a22ddc2c7b75e26d))
* **core:** allow paygo outputs for empty verification options object ([b20405c](https://github.com/BitGo/BitGoJS/commit/b20405c36fee2681aa974ff4e5f3c6f6cd3109f3))
* **core:** always fetch full key triple for signing ([3af1ab2](https://github.com/BitGo/BitGoJS/commit/3af1ab238a5e491f1503645f09c696a4785950aa))
* **core:** body not being included in HMAC ([50babb5](https://github.com/BitGo/BitGoJS/commit/50babb5473f3c2c4b2138a411870d5f93d0997b5))
* **core:** break cyclical dependency ([0d00616](https://github.com/BitGo/BitGoJS/commit/0d00616cde5e1b7945410e4f45158f2071032163))
* **core:** bring back getECDHSecret ([922b5bf](https://github.com/BitGo/BitGoJS/commit/922b5bf3f4b34f69d3ee7c262c7f3cf09f21364d))
* **core:** bump account-lib version ([5491fd7](https://github.com/BitGo/BitGoJS/commit/5491fd708f0fb7702bb3e56f42a1037a782e6c60))
* **core:** bump stellar-sdk ([200bc3f](https://github.com/BitGo/BitGoJS/commit/200bc3f8f1593c5808b1467fdaf264c7af4625e8))
* **core:** change loop to POST /address ([d66305f](https://github.com/BitGo/BitGoJS/commit/d66305f16d65dd8f299b122fc8a81a596ab343a1))
* **core:** change stx implementation of generateKeyPair() to return xpub format ([c248936](https://github.com/BitGo/BitGoJS/commit/c2489363ba58680e8c60bc5189160dc04ca76caa))
* **core:** change the type of sendMethodName which is used for fixing erc20 unsigned sweep recovery ([66d118c](https://github.com/BitGo/BitGoJS/commit/66d118c71724ff1e7f1ba2711858ec78e5a75518)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** change type of `sequenceId` to string ([9ff64f3](https://github.com/BitGo/BitGoJS/commit/9ff64f307856a5d3b86c1597c2629a8fe824f7a1))
* **core:** client send an objet as memo but memo is treated as a string ([c631daa](https://github.com/BitGo/BitGoJS/commit/c631daae45747960f5f20dc915c4e4503d18b9eb))
* **core:** correct chainid of eos testnet ([bc128a9](https://github.com/BitGo/BitGoJS/commit/bc128a91a0a3349af792aa2a88c46b279b0cbc29))
* **core:** correct type of `allTokens` property on `TransfersOptions` ([401aa09](https://github.com/BitGo/BitGoJS/commit/401aa093121ee7acbc97468e995e1f308830a09a))
* **core:** correct typo when address parameter is missing ([9cf7e90](https://github.com/BitGo/BitGoJS/commit/9cf7e903cadc3c2fe5adca25d24b4977c9643ffe))
* **core:** correctly handle ECPair case in `getAddressP2PKH` ([a386bb4](https://github.com/BitGo/BitGoJS/commit/a386bb4983ae9c9aa209e9e4dfced832de88899c))
* **core:** correctly pass `pubs` ([159f6f1](https://github.com/BitGo/BitGoJS/commit/159f6f1116bc637808f02ec9349d5d93b5f3163e))
* **core:** deduplicate repetitive `abstractUtxoCoin` parse tx tests ([be39c40](https://github.com/BitGo/BitGoJS/commit/be39c4087215e1b1e694196467e5e00edcda828c))
* **core:** default goerli for etherscan ([f4fadbf](https://github.com/BitGo/BitGoJS/commit/f4fadbfa9256ef58d4f4f56b511faaea739ab9ca))
* **core:** defer application of authorization headers ([8a26071](https://github.com/BitGo/BitGoJS/commit/8a26071fec8c290c68f5920dad69be545813118b))
* **core:** disable `esModuleInterop` ([619769c](https://github.com/BitGo/BitGoJS/commit/619769cbfb53a550b18b04643514f1fdbecccfe8))
* **core:** disable p2tr for btg ([cc70f26](https://github.com/BitGo/BitGoJS/commit/cc70f260035268ed0707e3c31be5d4ac1afa4046))
* **core:** disable verification for hop transactions ([2515a9c](https://github.com/BitGo/BitGoJS/commit/2515a9c9aeba6d0f2f10cbce39f094a059e40a20))
* **core:** don't add extra `0x` prefix when formatting for offline vault ([3555d50](https://github.com/BitGo/BitGoJS/commit/3555d5056963c3e6d4035f125a4fecb41f8cd761))
* **core:** don't log wallet upon tx prebuild validation failure ([0c5c5c3](https://github.com/BitGo/BitGoJS/commit/0c5c5c3f097638629348e7104ddc66fa61ecf295))
* **core:** don't pick individual tx verification options ([d1fdc36](https://github.com/BitGo/BitGoJS/commit/d1fdc3699289f4fb850845d0e543e5ce17af0cd8))
* **core:** don't require `pubs` param to `explainTransaction` ([18ad557](https://github.com/BitGo/BitGoJS/commit/18ad557759c1f32732f69bb9c67445a5a47aab1d))
* **core:** expose feeInfo when building txns from tx requests ([6000d2e](https://github.com/BitGo/BitGoJS/commit/6000d2edd14297e51fd4fbd433fe091b8bdb1d61))
* **core:** fix address validation for casper ([f0ada2e](https://github.com/BitGo/BitGoJS/commit/f0ada2e99b244373dbc0050a26a0436120b5e7e7))
* **core:** fix bip32-based `isValidPub`/`isValidPrv` ([3ab57c4](https://github.com/BitGo/BitGoJS/commit/3ab57c4ee3983377d97486cc526a836f5bec8130))
* **core:** fix broken tests ([feb63f5](https://github.com/BitGo/BitGoJS/commit/feb63f5c7f08b53ff230e8f8b408d3adc70cc769))
* **core:** fix createTransactionBuilderFromTransaction call ([0de8574](https://github.com/BitGo/BitGoJS/commit/0de8574e1b7a30f9772ce0427d782dfafc9eae9d))
* **core:** fix cspr address validation to account for transferId ([89f1990](https://github.com/BitGo/BitGoJS/commit/89f1990c44289e5fc4a94c99fe5c2136b7b775c9))
* **core:** fix default sigHash for p2tr ([595d957](https://github.com/BitGo/BitGoJS/commit/595d957f61f3d10ba78219c68fa2b5a8952c6323))
* **core:** fix ENS resolution for eth sends ([8ca5d2f](https://github.com/BitGo/BitGoJS/commit/8ca5d2fb6978b62ba1d425f17468ec345fb464ef))
* **core:** fix failing tests after coroutine removal in test code ([6b8bbe2](https://github.com/BitGo/BitGoJS/commit/6b8bbe2762e97aafa93e885742030a01c56f61d0))
* **core:** fix fromBase58() in legacyBitcoin ([f563fd4](https://github.com/BitGo/BitGoJS/commit/f563fd4196e79d4961840f11bb5673b6040a9726))
* **core:** fix getExtraPrebuildParams ([6486c9f](https://github.com/BitGo/BitGoJS/commit/6486c9fc7308cdaa02ddcaaae9a829e50e61c2c9))
* **core:** fix hbar webpack ([7bc465a](https://github.com/BitGo/BitGoJS/commit/7bc465afca300f7e3eec5af92e9254e820eec555))
* **core:** fix import for Bluebird library on cspr ([324c484](https://github.com/BitGo/BitGoJS/commit/324c4845f8da8e0e4150ec60e22b9fd0394130c6))
* **core:** fix incorrect return type on presignTransaction ([b9dc27c](https://github.com/BitGo/BitGoJS/commit/b9dc27c0d8550b8d59066151f125c9f8958ef0a1))
* **core:** fix issue of erc20 token recovery using unsigned sweep ([0de956f](https://github.com/BitGo/BitGoJS/commit/0de956fd77253d351a35f215ccd747ca6c562c66)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** fix issue while signing eos transaction using OVC ([5c25580](https://github.com/BitGo/BitGoJS/commit/5c25580442721a6784645e1383b0e435ccd418aa))
* **core:** fix key pair generation methods ([fa16f19](https://github.com/BitGo/BitGoJS/commit/fa16f1932f026ee334b7eaa700bf7a0ff9112ea4))
* **core:** fix lint error ([7abc0e2](https://github.com/BitGo/BitGoJS/commit/7abc0e219b5afb51ccf4c62d544db40dd3b30130))
* **core:** fix memoid check for eos txn ([145bea7](https://github.com/BitGo/BitGoJS/commit/145bea753da193fa17c7351a4fa46f2b529063b0))
* **core:** fix method name to TRX.xpubToUncompressedPub ([b45b882](https://github.com/BitGo/BitGoJS/commit/b45b882b0db02b61f59e03d78a6000b72290ef64))
* **core:** fix nock body types ([465acf0](https://github.com/BitGo/BitGoJS/commit/465acf00bfa3c36af840cd6956179879b045bd61))
* **core:** fix prebuild transaction for tron contractCalls ([9d0edea](https://github.com/BitGo/BitGoJS/commit/9d0edeaffd39b23ba5fd07a134df030c3d622902))
* **core:** fix regression in `addAccessToken` when using v1 auth ([e58e86b](https://github.com/BitGo/BitGoJS/commit/e58e86bc00b6f6582d5d527044dbc87cf4086a51))
* **core:** fix sol send tx ([012d702](https://github.com/BitGo/BitGoJS/commit/012d7023e9fe32d8d7d2aa13cef94dceae176d43))
* **core:** fix tests which were broken after coroutine removal ([deb6698](https://github.com/BitGo/BitGoJS/commit/deb66982cd4c898665399fbd5dd8288d74502331))
* **core:** fix token unit test which expected Bluebird promise ([9c39873](https://github.com/BitGo/BitGoJS/commit/9c3987335a1371a4c5f579fca5caa875358563ee))
* **core:** fix tss pending approvals ([e686536](https://github.com/BitGo/BitGoJS/commit/e686536679f2a1729d531c3430c7456402345803))
* **core:** fix tss wallet creation ([ac06c62](https://github.com/BitGo/BitGoJS/commit/ac06c624710f2fff49430b6bb0b32a66892aaa8e))
* **core:** fix txPrebuild param in CSPR signTransaction method ([85cdc87](https://github.com/BitGo/BitGoJS/commit/85cdc87d6b09a6826b2a363503dc6f12313548ec))
* **core:** fix verify sign parameters for Algorand ([47348cd](https://github.com/BitGo/BitGoJS/commit/47348cd4297b54c66377f6afa52edff6c1a8473b))
* **core:** fix verify tx for solana ([0085ddc](https://github.com/BitGo/BitGoJS/commit/0085ddc26644231a3c8a0dcaef18d8b32db3dda9))
* **core:** fix verityTransaction for sol ([ac98a34](https://github.com/BitGo/BitGoJS/commit/ac98a34b9935477a8c3a2a6c24f9eca9ebfd7c0e))
* **core:** fix wallet creation for CSPR ([667917e](https://github.com/BitGo/BitGoJS/commit/667917e9b41690eb7b501419d2890857bcf453e7))
* **core:** fix xpubToEthAddress ([aabaa51](https://github.com/BitGo/BitGoJS/commit/aabaa51322066dc8b8a7f9e7ca7d71b3cc434b36))
* **core:** fixed TAT issues ([378d76e](https://github.com/BitGo/BitGoJS/commit/378d76e2b6ee7a071fcb244c47237ca2a59c2306))
* **core:** fixed TAT issues ([c648262](https://github.com/BitGo/BitGoJS/commit/c64826249e22c4ebb017e2e47ff740fdfa57d7ee))
* **core:** follow up improvements from PR [#1292](https://github.com/BitGo/BitGoJS/issues/1292) ([7ee6fdb](https://github.com/BitGo/BitGoJS/commit/7ee6fdb05508992761afd50f906b860e9e3096e0))
* **core:** get appropriate signing keys for all signing calls ([1a4d60c](https://github.com/BitGo/BitGoJS/commit/1a4d60cdd2b63f8ffaf796c514eeeb4aeb8e7710))
* **core:** handle script sigs without signature property in `explainTransaction` ([76028f5](https://github.com/BitGo/BitGoJS/commit/76028f58a6cc5b8a390a6d16d5a696ced368e6cc))
* **core:** hard code zcash transaction version ([5ff20c5](https://github.com/BitGo/BitGoJS/commit/5ff20c5b5ea491701e74288480dbb9f1e5020fcd))
* **core:** ignore algo token from browser tests ([d0104ed](https://github.com/BitGo/BitGoJS/commit/d0104ed1dd90f62f89fe9ceeff4e45cb465e6dca))
* **core:** ignore typescript errors from incompatible `@types/ethereumjs-util` ([a52de1b](https://github.com/BitGo/BitGoJS/commit/a52de1b9417f9cac392a91482b1715074415c064))
* **core:** implement explainTransaction for p2tr ([8ef2d6a](https://github.com/BitGo/BitGoJS/commit/8ef2d6ac44738a5f5cd23dc29f244e84deb14727))
* **core:** implement isWalletAddress for ALGO ([262a1ec](https://github.com/BitGo/BitGoJS/commit/262a1ecea7d3bb6055c7aee465ba70bb7202546a))
* **core:** implement verify transaction for eos ([8cd3051](https://github.com/BitGo/BitGoJS/commit/8cd3051465cd013a22424a9708419dd4e2f9f3ff))
* **core:** improve documentation in hashForSignatureByNetwork ([081c573](https://github.com/BitGo/BitGoJS/commit/081c573b810c7e847c68990381bebe1d445847c9))
* **core:** improve error response string creation ([43e10e3](https://github.com/BitGo/BitGoJS/commit/43e10e3490d0d2196d5f5a7cd1792248fe299256))
* **core:** improve GenerateAddressOptions type ([b0dbb6a](https://github.com/BitGo/BitGoJS/commit/b0dbb6aea5076afbc801d25614298166c61cc708))
* **core:** improve logging when encountering prebuild validation error ([75ffd0c](https://github.com/BitGo/BitGoJS/commit/75ffd0c1f4c1df673201f04faa8815bdadecce9e))
* **core:** load all keychains for taproot signing ([1e34120](https://github.com/BitGo/BitGoJS/commit/1e34120de798e2597bf6ead6e661c3c2301cf824))
* **core:** Recreate XLM integration test wallets ([4603039](https://github.com/BitGo/BitGoJS/commit/4603039131900c6405d845c307156298fdaf3386))
* **core:** remove coroutines from v2/coins/dot and fix tests ([9ea55e8](https://github.com/BitGo/BitGoJS/commit/9ea55e814e825f077832d3772fd784e1d697573b))
* **core:** remove custom getTxInfoFromExplorer in LTC ([491358f](https://github.com/BitGo/BitGoJS/commit/491358fa0e8d73387a8a47b93a4c9efb60d52e6f))
* **core:** removed signingKey capability ([14346fa](https://github.com/BitGo/BitGoJS/commit/14346fae2e5459467cc8c89b1c70a3f17d91cb42))
* **core:** rename feeInfo param in explain tx method for Casper ([5b02e13](https://github.com/BitGo/BitGoJS/commit/5b02e13f735328087c6d1aac437089a789b221e1))
* **core:** rename HalfSignedTransaction to HalfSignedAccountTransaction ([5a6dedd](https://github.com/BitGo/BitGoJS/commit/5a6deddec240ab722b553aab11e473758d7de827))
* **core:** Rename import instead of colliding with declared interface ([8b55707](https://github.com/BitGo/BitGoJS/commit/8b55707487d719459597a5314d2de1f9e295b283))
* **core:** rename token to tokenName, possible clash with auth token for algo ([46cfcf2](https://github.com/BitGo/BitGoJS/commit/46cfcf2564f4d1d350987bd1ce6dbdb947033802))
* **core:** rename verifyAddress and remove invalid implementations ([3d6d5d0](https://github.com/BitGo/BitGoJS/commit/3d6d5d07fcc4d228d39b7634e8f3349a6d623ded))
* **core:** repair replay protection input signing ([8c6b069](https://github.com/BitGo/BitGoJS/commit/8c6b069ddfcdc71a9fb8477ec95cd159cb2f8dc1))
* **core:** replace bitcoin-abc with ecash in blockchair apis ([c8e9c56](https://github.com/BitGo/BitGoJS/commit/c8e9c566310b9f31cc43380a42b283d801d15b3f))
* **core:** restore `async` on `explainTransaction` in `AbstractUtxoCoin` ([d8d7a0a](https://github.com/BitGo/BitGoJS/commit/d8d7a0af7f1d7c613bd02c3b8e63cc9b028bf96a))
* **core:** run tests against btg ([2805bd5](https://github.com/BitGo/BitGoJS/commit/2805bd56cfdba8ef33db66a2ba5e79c5ab1f91f4))
* **core:** send `derivedFromParentWithSeed` when generating wallet ([b81f31d](https://github.com/BitGo/BitGoJS/commit/b81f31d1c7629e8b2eb74c9117ff74e15aabb6df))
* **core:** sign multi-input p2tr script path txs ([885a91f](https://github.com/BitGo/BitGoJS/commit/885a91fe410dcff16e1f771cdc43ad78d2384691))
* **core:** stacks changed prv param type in StxSignTransactionOptions ([52138ea](https://github.com/BitGo/BitGoJS/commit/52138ead3ea1067706803c3fd6a7720e8cc8afbf))
* **core:** support eip-1559 and eip-155 in wrw ([e88b8e1](https://github.com/BitGo/BitGoJS/commit/e88b8e11a8f469be527a770972132aee5c9ec2a8))
* **core:** support password reset and enterprise with MPC ([2434ee6](https://github.com/BitGo/BitGoJS/commit/2434ee644b0c1c111dc6df32f5e061b61ca2bd50))
* **core:** token transactions does build correctly ([178d4e2](https://github.com/BitGo/BitGoJS/commit/178d4e219df22d42f31b9fcbad6d8f10181a17fa))
* **core:** transactionBuilder: ignore `walletSubPath === 'm'` ([5bbf8d1](https://github.com/BitGo/BitGoJS/commit/5bbf8d143a6e99ee2958ae764889ecd7f46ebdd8))
* **core:** transfer id is not stored to in mongodb in entries and coin specific ([17d44a6](https://github.com/BitGo/BitGoJS/commit/17d44a6ce192142608fcc41e4d5cc7e8c157c7b1))
* **core:** tss backup keychain output prv ([e7facc7](https://github.com/BitGo/BitGoJS/commit/e7facc792b7cfe8b36f71cc662d7504316fa88fd))
* **core:** update `vm2` by uninstalling/reinstalling `superagent-proxy` ([66f4ad3](https://github.com/BitGo/BitGoJS/commit/66f4ad3c8bcec0649cde34e724945f4076e431dd))
* **core:** update codeowners to remove previous staff ([67b3245](https://github.com/BitGo/BitGoJS/commit/67b3245de1e257f6841c9417bec988c33838fc27))
* **core:** update statics version to latest ([2f8bc0d](https://github.com/BitGo/BitGoJS/commit/2f8bc0db4743df8b1b97207d92a9b123239dcaa1))
* **core:** update yarn resolutions to temporarily resolve audit issues ([77feec3](https://github.com/BitGo/BitGoJS/commit/77feec3bcb71968f76e8b0ff7cbfc1ddc3b29d7a))
* **core:** use `@bitgo/blockapis@1.0.0-rc.0` ([7717447](https://github.com/BitGo/BitGoJS/commit/7717447a6598840d7dacbefb070d62f4d0736154))
* **core:** use `buildIncomplete()` in utxo recovery ([60e99c9](https://github.com/BitGo/BitGoJS/commit/60e99c9d74941d8332ae67cca6530967bd058007))
* **core:** use `derivedFromParentWithSeed` from user keychain if present ([c55800e](https://github.com/BitGo/BitGoJS/commit/c55800e49b63da365a77ec22136fe53e1a229352))
* **core:** use AbstractUtxoCoin type in btc tests ([956fef1](https://github.com/BitGo/BitGoJS/commit/956fef11ba024ed40f5ce5e5caaf73d37c6dd9db))
* **core:** use hashForSignatureByNetwork in core ([3b210f0](https://github.com/BitGo/BitGoJS/commit/3b210f0fc44a2e4eb85627a7b5d9e9054b553db2))
* **core:** use ltc explorer to get unspents during cross chain recovery ([4c5d19f](https://github.com/BitGo/BitGoJS/commit/4c5d19f8e349adcde42bfd1272f54c4dc683e749))
* **core:** use mempool.space instead of earn.com for recovery fee ([5338f4e](https://github.com/BitGo/BitGoJS/commit/5338f4efda4b6b7705d9c1fb0d1a6914606b7314)), closes [#1126](https://github.com/BitGo/BitGoJS/issues/1126)
* **core:** use signAndVerifyWalletTransaction ([3811b42](https://github.com/BitGo/BitGoJS/commit/3811b42a6866fe3e3f89b314a2287bc80a0bd408))
* **core:** use wallet keys in explainTransaction ([2c3b494](https://github.com/BitGo/BitGoJS/commit/2c3b494792ae52e4e2f61c0ba0f59cab955ce2e7))
* correctly regenerate .drone.yml ([eaf6aaa](https://github.com/BitGo/BitGoJS/commit/eaf6aaa67c5293a2e2083cc224172c6eacd9fab5))
* do not not strip out null values from the stx transaction memo field ([e028517](https://github.com/BitGo/BitGoJS/commit/e0285172522aff9fd7b5b618b31b716c4d84bfbf))
* don't run unit tests on node 8 ([7fa7510](https://github.com/BitGo/BitGoJS/commit/7fa7510bf2107e540d2e2975b5ea0578717509b5))
* enable TEST token for testnet ofc ([bfe12c6](https://github.com/BitGo/BitGoJS/commit/bfe12c670ab879c445103a2d62e7202b6d32aeef))
* **eos:** can accept addresses with memoId when making recovery ([8001e7e](https://github.com/BitGo/BitGoJS/commit/8001e7e592d48b0c0097384e7395838adde9e8b5))
* **eos:** fix deserialize transaction with OVC ([b4d8821](https://github.com/BitGo/BitGoJS/commit/b4d8821773e182560e206ffc48cde2d5e5d640b3))
* **eos:** fix incorrect explorerUrl for teos ([3a5914d](https://github.com/BitGo/BitGoJS/commit/3a5914dab2427c9924c8b332c4189a98d10a4dbd))
* **eos:** fix issue verifying EOS transactions ([79dd073](https://github.com/BitGo/BitGoJS/commit/79dd0736c999bbeeaa663f3054769ff86c1f1ca7))
* **eos:** moved eos fixures to the currect directory ([e64aed4](https://github.com/BitGo/BitGoJS/commit/e64aed4c70586f98808c67477c4c0603c47351ca))
* **eos:** removed unnecessary assertions in eos unit test cases ([205c695](https://github.com/BitGo/BitGoJS/commit/205c695df5d5517851151293aedb7baa2acc6176))
* **eos:** sinon sandbox restored after use in test case ([6cfef71](https://github.com/BitGo/BitGoJS/commit/6cfef71c4fdb5fc9da5699059c74ef7dc187489f))
* **eth-lhf:** set default hf to lhf if lhf params present ([06a9f7b](https://github.com/BitGo/BitGoJS/commit/06a9f7b03798df4a957a28cf23174929fbdc2f35))
* **eth2:** fix eth2 lib initialization and key signatures ([d171404](https://github.com/BitGo/BitGoJS/commit/d1714044bef8afe3f8b9166dc49f28ef3451bda8))
* **eth:** goerli coins now set to gteth in core/src/config.ts ([3ea10f6](https://github.com/BitGo/BitGoJS/commit/3ea10f64ca02d89db500904a9acc1c3511931e62))
* **ethlike:** add chainid to statics ([56a769e](https://github.com/BitGo/BitGoJS/commit/56a769e2fe9a9e7a1808d5a499941d42461d006e))
* **eth:** make replay protection optional ([061f2c6](https://github.com/BitGo/BitGoJS/commit/061f2c64f55eac31a162986ee2ac3df7da047978))
* **eth:** move gasLimit to base params ([6a1f108](https://github.com/BitGo/BitGoJS/commit/6a1f10867e87db853cad38ba62fdc9ca26bff946))
* **eth:** restore fixed hop transaction verification ([7b2420a](https://github.com/BitGo/BitGoJS/commit/7b2420aaf6fd684fe8847c27c7cd1aa5882fb8db))
* **eth:** update tx with signature in recover ([3fa3de4](https://github.com/BitGo/BitGoJS/commit/3fa3de43cc21618deda3be5183b2b21878367576))
* exclude ripple-address-codec 4.2 ([8178095](https://github.com/BitGo/BitGoJS/commit/8178095b9e672ea3df0f05f974083fac8f56a31f))
* **express:** add error logs in tx signing fns ([dc22bae](https://github.com/BitGo/BitGoJS/commit/dc22bae196b47a2a531e9bdc579046d9d6c62d17))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([0c835b8](https://github.com/BitGo/BitGoJS/commit/0c835b8d010c1cd3f843daf8dfeb6fc74d71c459))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([1b96bfe](https://github.com/BitGo/BitGoJS/commit/1b96bfec6c8ccc3f68ec253595dd07e523bd10ef))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([58ea46e](https://github.com/BitGo/BitGoJS/commit/58ea46ecafa13766be26e25ad8a8fbc8b06b1f9f))
* **express:** always prefer command line arguments to env var args ([b8aeee1](https://github.com/BitGo/BitGoJS/commit/b8aeee132658c0839ede81b1da6bf48609a12069))
* **express:** always use bitgo object http methods to proxy requests ([5153a96](https://github.com/BitGo/BitGoJS/commit/5153a9637725bac6b3c36888f21ca44e1ac21da6))
* **express:** build express outside TS Build systm ([4c59ff8](https://github.com/BitGo/BitGoJS/commit/4c59ff87a4a03f4a324d0a126e00dd19c5acf44d))
* **express:** correctly handle failed proxy calls ([d36bf9c](https://github.com/BitGo/BitGoJS/commit/d36bf9c30dc799e087e9b42a4fd30d9ebe407509))
* **express:** Deprecate older forms of environment variable config ([2c88e69](https://github.com/BitGo/BitGoJS/commit/2c88e69983acea4da9b09994f38d49c99a73548c))
* **express:** do not access `_promise` ([8cd097e](https://github.com/BitGo/BitGoJS/commit/8cd097e76cc4e3de8b8b769f39c3bbe9bb79f96e))
* **express:** don't store false when boolean flags are not given ([4194ae1](https://github.com/BitGo/BitGoJS/commit/4194ae17f91d1174f096aeb1a0a85819762b9ae8))
* **express:** don't use bluebird methods on native promise returning functions ([b5b3782](https://github.com/BitGo/BitGoJS/commit/b5b37822e8b0814ad63433e1580255416c645ec1))
* **express:** enable tezos consolidations route in express ([fdf2c8a](https://github.com/BitGo/BitGoJS/commit/fdf2c8a8a8c0503728825ebaa2b16f7a1e5fec70))
* **express:** lock to y18n@^4.0.3 ([044da56](https://github.com/BitGo/BitGoJS/commit/044da56c6832492a83af07af77c4001521b8271b))
* **express:** log bitgo-express and bitgojs versions on error ([f21178f](https://github.com/BitGo/BitGoJS/commit/f21178f8dc40a8d93895463823acbe5bd320ba5d))
* **express:** pass POST body for proxy requests ([f5113ea](https://github.com/BitGo/BitGoJS/commit/f5113ea07ecfaa265d18a48f32143d3045ac7e27))
* **express:** re-add `typescript` to express dev deps ([75c1601](https://github.com/BitGo/BitGoJS/commit/75c16011029a5de624363396a0047a3564ec85dd))
* **express:** remove gcompat, switch to alpine build container ([d4a9cca](https://github.com/BitGo/BitGoJS/commit/d4a9ccab1b3c6773c1d81503bd55c7376f40f8db))
* **express:** remove gcompat, switch to alpine build container ([969dd49](https://github.com/BitGo/BitGoJS/commit/969dd4913ad5f26c9e2b1a9e823412cce2c6c27f))
* **express:** run prettier on `test/integration/bitgoExpress` ([e105d3a](https://github.com/BitGo/BitGoJS/commit/e105d3aa0054f1ed7428fd1d935ff1eada8d9800))
* **express:** update lodash and ini to fix npm audit issues ([36c3d0b](https://github.com/BitGo/BitGoJS/commit/36c3d0b3a68d86772a6b1a872dde398ca53dec84))
* **express:** update to typescript 4.2.2 ([460e898](https://github.com/BitGo/BitGoJS/commit/460e898edc30205f6b5edfa100b818c20a7af58b))
* **express:** use gcompat instead of libc6-compat ([4636f8d](https://github.com/BitGo/BitGoJS/commit/4636f8df7dd0bfe15e8e736d8029b08f4a55d5c1))
* **express:** use gcompat instead of libc6-compat ([df5f84b](https://github.com/BitGo/BitGoJS/commit/df5f84bdc02a65c22097680d072553e079997fdc))
* **express:** use gcompat instead of libc6-compat ([e72b9b9](https://github.com/BitGo/BitGoJS/commit/e72b9b9b7b213ceb5aaf5bb985ba30a498280df4))
* **express:** use yarn to run build script ([e2b7cad](https://github.com/BitGo/BitGoJS/commit/e2b7cad4a8f8bf0273240d6a015839a97837c38e))
* **express:** use yarn to run commands installed at root ([4795b06](https://github.com/BitGo/BitGoJS/commit/4795b062c2f92d02053cfb931dbefc4daf579d00))
* **express:** use yarn to run commands installed at root ([3c2acef](https://github.com/BitGo/BitGoJS/commit/3c2acef7b72bfde1bfd6becfff4fb6d9349f0c02))
* fix 1inch in coins.ts ([ef338c9](https://github.com/BitGo/BitGoJS/commit/ef338c907f5ca78851ea0b39a7b97c34fd381d0e))
* fix build ([4a19ae6](https://github.com/BitGo/BitGoJS/commit/4a19ae67b003a39982551c9615a7a4ef217bc15b))
* fix EOS testnet fullnode URLs ([55cb375](https://github.com/BitGo/BitGoJS/commit/55cb37526bdf80c431392f8a1a6af9dad01d3be8))
* fix Etherscan Testnet URL ([f83b5cd](https://github.com/BitGo/BitGoJS/commit/f83b5cd742149f81d2a9a2074f22d8aa812a964c))
* fix failing unit test nocks ([c5fb6e3](https://github.com/BitGo/BitGoJS/commit/c5fb6e30fccb2799cda730504e18806576f01290))
* fix signing for Tezos ([290df65](https://github.com/BitGo/BitGoJS/commit/290df6525095a7f4e5cad6a634202197fa16c5c5))
* fix urijs vuln ([957c618](https://github.com/BitGo/BitGoJS/commit/957c6185f912cf74792cfcbc4e3bd20b14ab5de3))
* fix wei to gwei conversion ([89af10d](https://github.com/BitGo/BitGoJS/commit/89af10d710da3cf6e1b8fc4ffea593d386628b76))
* fixed consolidation and added express route ([81a4c6d](https://github.com/BitGo/BitGoJS/commit/81a4c6d1763feea6432bf7d564e41c8eb125eff9))
* force secure urls unless disabled ([3b9edd5](https://github.com/BitGo/BitGoJS/commit/3b9edd593016f82fa69a4fe740ea706fe1daeee7))
* getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
* **gterc-tokens:** add missing gterc tokens ([724406b](https://github.com/BitGo/BitGoJS/commit/724406b5113dc00246d839c13d623b64c47012c8))
* **gterc-tokens:** add missing gterc tokens ([27a86db](https://github.com/BitGo/BitGoJS/commit/27a86db9f5c6d2a3f93eea74f71c2b7a15e5523a))
* hard-code current ZEC consensus branch ID using updated utxo-lib ([93798ba](https://github.com/BitGo/BitGoJS/commit/93798ba3629dcfdb7440778c1dcb3c09ab578bae))
* **hbar-validateaddress:** add validation for hedera addresses fix case where hex address were valid ([eb7c1eb](https://github.com/BitGo/BitGoJS/commit/eb7c1eb02d973acfa97cfd613816b365ea29d567))
* **hbar:** add missing validateKeySignatures method ([870fc6e](https://github.com/BitGo/BitGoJS/commit/870fc6eb463f5c177a312163fac532ba5ceb5723))
* **hbar:** add new hashTx impl ([44498e3](https://github.com/BitGo/BitGoJS/commit/44498e37ee3a39a7537ce51ccbf61040e3ffd5bf))
* **hbar:** fix sign and verify for hex encoded hbar message ([c3ef546](https://github.com/BitGo/BitGoJS/commit/c3ef546b68dac87339f39197bf798c899d881bdf))
* **hbar:** fix sign and verify for hex encoded hbar message ([b82dae2](https://github.com/BitGo/BitGoJS/commit/b82dae2ec89bf55f5d891b9887069c5c66b07157))
* **hbar:** key validation ([113fa3c](https://github.com/BitGo/BitGoJS/commit/113fa3cbe0c5aa31acd6d93dbf22d9319a3749e4))
* **hbar:** modify validation for keys ([af57749](https://github.com/BitGo/BitGoJS/commit/af5774900d6bbc0a6a29020f11b68f532af2f12c))
* **hbar:** update test ([fadce41](https://github.com/BitGo/BitGoJS/commit/fadce418c188e895813d83c9a2ddb8009b458c74))
* improve Etherscan Error Handling ([4e90aed](https://github.com/BitGo/BitGoJS/commit/4e90aedbf489e4accc0a0b96b4d222722321023c))
* keyreg type changed to wallet init ([78beac5](https://github.com/BitGo/BitGoJS/commit/78beac58d2dfb0dd13c41a1e8e884fca19cbe20c))
* **ltc:** update block explorer link for ltc ([1a501da](https://github.com/BitGo/BitGoJS/commit/1a501da07df6796e7215c20800bcb865270b13a6))
* **lumina:** update full name for rbtc ([4bf0098](https://github.com/BitGo/BitGoJS/commit/4bf0098efd6e0ce5f2e9a70b680e64ec7b031235))
* **release:** upgrade lerna to 3.21.0 ([ae6ff7e](https://github.com/BitGo/BitGoJS/commit/ae6ff7eade463ee95fec03460f5a1a552740a9cb))
* remove `gitHead` from module package.jsons ([66e9809](https://github.com/BitGo/BitGoJS/commit/66e9809d6a36f03c8a334f9b8bbcfa82aca426b0))
* remove `gitHead` property from package.jsons ([e6b7fdd](https://github.com/BitGo/BitGoJS/commit/e6b7fdd4e4e16c4a07a9a7ad39cc70f08854486e))
* **remove logs:** remove logs ([f439bfa](https://github.com/BitGo/BitGoJS/commit/f439bfacbe6953b54f7492e4400e780d8d7769ac))
* remove non existing testnet OFC tokens and fix asset for TERC ([a70860e](https://github.com/BitGo/BitGoJS/commit/a70860e16fcdf831c589a38b6479657d7eea0344))
* remove ripple-lib due to node issues ([ecf34a4](https://github.com/BitGo/BitGoJS/commit/ecf34a4b2402799b77b641172832357a45b6a8aa))
* removing extra space ([261b87e](https://github.com/BitGo/BitGoJS/commit/261b87eb102d12b4e8b66683590bef29954a9bf5))
* replace sed with js function for replacing unsafe evals ([f8c089a](https://github.com/BitGo/BitGoJS/commit/f8c089ae10b8732565fbc8ed1a9209c7b7ac42ec))
* reset core package json back to master ([5ad8684](https://github.com/BitGo/BitGoJS/commit/5ad86846805b94eec3f125f33a8579286c3fc7d8))
* **root:** add package-lock.json to .gitignore ([754ef40](https://github.com/BitGo/BitGoJS/commit/754ef401fb6c9bfa1f5c5daa0d10cdce86a4de45))
* **root:** disable eslint `no-undef` rule for typescript files ([597e468](https://github.com/BitGo/BitGoJS/commit/597e4688a2bfbbdbf8ae6235c420cd35adf701ad))
* **root:** removed buffer library and fallback from webpack config for account-lib and core ([a5c9fec](https://github.com/BitGo/BitGoJS/commit/a5c9fecd17d0fedced34fad9434eb1f0f36bd0d5))
* **root:** resolve `axios` to `^0.21.2` ([04d63f9](https://github.com/BitGo/BitGoJS/commit/04d63f9bb1e8a74692b5d54668a79999abc23c64))
* **root:** resolve `follow-redirects` to version ^1.14.7 ([d81b77f](https://github.com/BitGo/BitGoJS/commit/d81b77f2b8184b18d63b6d504cd33592ee9c8b69))
* **root:** resolve `node-fetch` to version 2.6.7 ([da8e05b](https://github.com/BitGo/BitGoJS/commit/da8e05bfee6c5fc1d3e29166a1f85ecafb704fd3))
* **root:** update `@celo/contractkit` deps to fix audit issues ([fba7595](https://github.com/BitGo/BitGoJS/commit/fba7595cb3c5bed76294cb9fae6241ab497e72a5))
* **root:** update lerna deps to fix audit issues ([08315ba](https://github.com/BitGo/BitGoJS/commit/08315baec81cef7098d645183ba742ae2b93c395))
* **sdk:** add avaxc family ([85d945d](https://github.com/BitGo/BitGoJS/commit/85d945d252f3446de50204c77e3110ef81847abe))
* **SERV-593:** Correctly handle undefined boolean config items ([770d7c1](https://github.com/BitGo/BitGoJS/commit/770d7c1e22e502a3e5de00085aeab7285c99a1c9)), closes [#599](https://github.com/BitGo/BitGoJS/issues/599)
* **SERV-597:** Ensure `Error.captureStackTrace` is defined before call ([fe35e3e](https://github.com/BitGo/BitGoJS/commit/fe35e3e0fd2b487d96c50c9a64a0890942192814))
* **sol:** fix deserializing signed sol transaction ([1da611a](https://github.com/BitGo/BitGoJS/commit/1da611ac9f830ed4303d4425a0391c4bc13c9f8c))
* **sol:** get signature data from a Sol transaction ([5249a6e](https://github.com/BitGo/BitGoJS/commit/5249a6e5da74ceb43a2b47ca439495d62c280f07))
* **statics:** add unique token types to goerli testnet tokens ([306df63](https://github.com/BitGo/BitGoJS/commit/306df6341767b4b58031fce2aca9057b10400d94))
* **statics:** adding ofcmcdai, ofcaxsv2, ofclrcv2, and ofcxsushi ([d472e9d](https://github.com/BitGo/BitGoJS/commit/d472e9d63e3cddf7cd416f606c60426013e0d109))
* **statics:** apply prettier to full project ([9ae3e15](https://github.com/BitGo/BitGoJS/commit/9ae3e157a84afebe495bab105fac6fbcfee2b0ee))
* **statics:** avaxc token name to lower case ([de49cb3](https://github.com/BitGo/BitGoJS/commit/de49cb30be27dad05e958e7a7eceacd6ec2e0c33))
* **statics:** change Goerli ETH underlying asset from ETH to GTETH ([7fafd32](https://github.com/BitGo/BitGoJS/commit/7fafd3281a00c5596cf506a1476e96f2df7db6d7))
* **statics:** delete invalid testnet URL ([77ae3ab](https://github.com/BitGo/BitGoJS/commit/77ae3ab434fcc05c16b44126ad46833cd6053533))
* **statics:** ensure UnderlyingAssets values are unique ([d297246](https://github.com/BitGo/BitGoJS/commit/d2972468cf90c0166a2ae3dd49e58da20dac1f1a))
* **statics:** fix BitcoinGoldTestnet derivation ([dfd097c](https://github.com/BitGo/BitGoJS/commit/dfd097c76ac2f1983af9bb02f6b15cb9d491b9ee))
* **statics:** fix etc statics ([4970253](https://github.com/BitGo/BitGoJS/commit/497025350595716c21d77bf5e1c420abc3bc6851))
* **statics:** fix GDT contract ([12e8258](https://github.com/BitGo/BitGoJS/commit/12e8258428b371657c33794c4651f5a4d617f1a4))
* **statics:** fix import/exports ([29d02b9](https://github.com/BitGo/BitGoJS/commit/29d02b9a5f97f1a78bce2313c5e95dc07240a3db))
* **statics:** fix precision for ofcterc ([75e465a](https://github.com/BitGo/BitGoJS/commit/75e465ac812ea0d59b2f05af9059debdb8a472ba))
* **statics:** fix send many memo contract address for prod ([3a1396d](https://github.com/BitGo/BitGoJS/commit/3a1396d17a15737bbc57a9f7803fe7fc2b47e6c5))
* **statics:** fix Solana transactions explorers ([c1f4e62](https://github.com/BitGo/BitGoJS/commit/c1f4e62e683e932af21b7238777c73a6fc7ef2d2))
* **statics:** fix stx explorer url ([cfa4998](https://github.com/BitGo/BitGoJS/commit/cfa499829f41ee791d5a0f7cc79bae801fdc1b73))
* **statics:** fix typo on testnet casper coin ([86488dd](https://github.com/BitGo/BitGoJS/commit/86488ddcc139eca3945d15c639ea9e63b9b5965e))
* **statics:** inherit BitcoinTestnet from Testnet ([246135c](https://github.com/BitGo/BitGoJS/commit/246135c4a4b78c9092cee8d08d5a79b8bf737a75))
* **statics:** remove duplicate tokens ([35e445a](https://github.com/BitGo/BitGoJS/commit/35e445aa92a56e0c14dbdb72b987d9a07c1e6d96))
* **statics:** remove invalid BIP32 constants ([e1d66ba](https://github.com/BitGo/BitGoJS/commit/e1d66ba4a8992e72279c5581591f5885bf6e5540)), closes [/github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp#L142-L143](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp/issues/L142-L143) [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L306-L309](https://github.com/BitGo//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L306-L309)
* **statics:** remove invalid wif constants ([3b633a9](https://github.com/BitGo/BitGoJS/commit/3b633a9e0c52ca17078bfe8a5440a84980fd0261)), closes [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L486-L487](https://github.com/BitGo//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L486-L487) [/github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp#L248](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp/issues/L248)
* **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))
* **statics:** update CODEOWNERS ([02b03fe](https://github.com/BitGo/BitGoJS/commit/02b03fe4549cc176731357f328301a9b88ff6c0f))
* **statics:** update deprecated explorer url ([391219a](https://github.com/BitGo/BitGoJS/commit/391219a37806d08ae56b52a84d2c3e69938140cb))
* **statics:** update deprecated explorer url for BCH ([1bfaf3a](https://github.com/BitGo/BitGoJS/commit/1bfaf3a950a3c7c2dc342146b174629bc8bf420c))
* **statics:** update zcash explorer url ([6bfb111](https://github.com/BitGo/BitGoJS/commit/6bfb1117deaaaefe32faf07cdef88cfd869ac16d))
* **statics:** use `utxolibName` instead of redefining constants ([b54c30a](https://github.com/BitGo/BitGoJS/commit/b54c30ae8e88dfe9701237a3316edf5f6c71483c))
* **stx-core:** parse stx transactions ([5ad70c8](https://github.com/BitGo/BitGoJS/commit/5ad70c854e1b37231abd106169f01eef36f6f351))
* **stx:** resolves toJSON for stx ([4b66b78](https://github.com/BitGo/BitGoJS/commit/4b66b78fa69eef4e55377fd64f439343a804edc8))
* **tdash:** fix incorrect explorerUrl for tdash ([e84b9db](https://github.com/BitGo/BitGoJS/commit/e84b9db96f5db161f5dd2ccac5109a05c34c1eda))
* temporarily remove AVAXC from failing SDK test for Secp256k1 coins ([a602eaa](https://github.com/BitGo/BitGoJS/commit/a602eaa8fd6c0b0f66c070b4e26091bfc32780dc))
* Test case should throw exception ([4b5b0b2](https://github.com/BitGo/BitGoJS/commit/4b5b0b25939c6f20a5ae794a692c1c63e9ef875c))
* **test:** remove illegal use of `bufferutils` ([4bb33a1](https://github.com/BitGo/BitGoJS/commit/4bb33a19e28f7351b0040fb2eee8ac898a7e3e8c)), closes [/github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f#diff-73e64645f9c04dc17e67b782cb9342](https://github.com/BitGo//github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f/issues/diff-73e64645f9c04dc17e67b782cb9342)
* **teth:** add terc tokens with 2,6,18 decimals ([3be4597](https://github.com/BitGo/BitGoJS/commit/3be4597e18fe3fa21eb123160e1528d3630e0be9))
* **teth:** add terc tokens with 2,6,18 decimals ([846f758](https://github.com/BitGo/BitGoJS/commit/846f758aff7cb03a68c25ed93af112f83538bed7))
* **tltc:** update block explorer link for tltc ([7323ccf](https://github.com/BitGo/BitGoJS/commit/7323ccf8aa2e0a2ced76f5218db20b25bd0658fb))
* **trx:** asign trx builder acording to each transaction type ([3454ee1](https://github.com/BitGo/BitGoJS/commit/3454ee1f4d5f187d48fa4c4aeef5a9327d89e6ec))
* **unspents:** add `readonly` modifier to Dimensions fields ([4cc973e](https://github.com/BitGo/BitGoJS/commit/4cc973e345b63cdde57c0bef4a53c0a02de6e625))
* **unspents:** fix nInputs ([e5e54e7](https://github.com/BitGo/BitGoJS/commit/e5e54e796995254d479f39e044635169547ad69b))
* **unspents:** fix package.json ([7edf5fe](https://github.com/BitGo/BitGoJS/commit/7edf5fe71f9b844947378e154ea5ba48b70806ed))
* **unspents:** use latest rc as version instead of 2.3.0 ([b0ae190](https://github.com/BitGo/BitGoJS/commit/b0ae190b955ab25b7c33236f7f81861008b8f4df))
* update dot to address breaking changes in 7.15.1 ([a949618](https://github.com/BitGo/BitGoJS/commit/a949618de00b944b2d9729485f6b9ac4e6fced3f))
* update freeze request to include sending params ([2b61a2a](https://github.com/BitGo/BitGoJS/commit/2b61a2a5869c5dc985eafb2368ea51bc233d54fe))
* update package-lock.json and clientRoutes ([a3433ea](https://github.com/BitGo/BitGoJS/commit/a3433ea0e86af35a26ae24bcb2e3f9c7adede91f))
* update package-lock.json and clientRoutes ([9ed9bb4](https://github.com/BitGo/BitGoJS/commit/9ed9bb44727611cf3d9b67284b1d7dd6ec10772f))
* update test for ZEC ([e17eea0](https://github.com/BitGo/BitGoJS/commit/e17eea0eeeca90909783e92fef021b364ee66283))
* update utxo-lib to published version 1.7.3 ([1798510](https://github.com/BitGo/BitGoJS/commit/1798510690766438e4faa30bbb0c3f4188d99e91))
* update ZEC consensusBranchId for Caopy hardfork ~Nov 18 2020 ([574a7c7](https://github.com/BitGo/BitGoJS/commit/574a7c77accc8182f30e7385859e57ed82864538))
* use correct kovan testnet explorer urls ([e86723c](https://github.com/BitGo/BitGoJS/commit/e86723c46a22d2790bad7b43d8e6bc5feaa700ee))
* **utxo-lib:** always verify ECDSA in strict mode ([4fcaf53](https://github.com/BitGo/BitGoJS/commit/4fcaf53f18f74a68f37a0513a549fea1c5c1ffb8)), closes [/github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts#L215](https://github.com/BitGo//github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts/issues/L215) [/github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts#L1212](https://github.com/BitGo//github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts/issues/L1212)
* **utxo-lib:** default to `version: 2` for BTG transactions ([c4047ed](https://github.com/BitGo/BitGoJS/commit/c4047ed24a80904f39f2d598ba6b67722ce8de7b))
* **utxo-lib:** do not throw on unsigned inputs ([69dddb6](https://github.com/BitGo/BitGoJS/commit/69dddb6ae077c6093d048fe91b0521e74ab5055e))
* **utxo-lib:** eslint fix ([a17d3c0](https://github.com/BitGo/BitGoJS/commit/a17d3c09aef4124edb4541dc03cd316e0826f6ac))
* **utxo-lib:** fix `addForkId` evaluation ([2d5f7e6](https://github.com/BitGo/BitGoJS/commit/2d5f7e6bf7592447cd6ca35ad320202343595227))
* **utxo-lib:** fix fixture generation for bitcoingold ([b3067ec](https://github.com/BitGo/BitGoJS/commit/b3067ec02f40489f3c99989e3a507e28775bb7dd))
* **utxo-lib:** fix imports in test ([204e404](https://github.com/BitGo/BitGoJS/commit/204e4044b5a487c3a687f2514e148f5cb318b3c7))
* **utxo-lib:** fix missing word in local rpc parse test ([7336ee2](https://github.com/BitGo/BitGoJS/commit/7336ee22200fe8c0e9f0144fadb571cfa7b1836e))
* **utxo-lib:** fix setConsensusBranchId ([4efa636](https://github.com/BitGo/BitGoJS/commit/4efa63670ae4e1bf17895b85c8559df33ac319ab))
* **utxo-lib:** fix sighash for dash transactions ([c171435](https://github.com/BitGo/BitGoJS/commit/c1714357eab3f8fc961e75ad0af8e49f967e801b))
* **utxo-lib:** improve ParsedSignatureScriptTaproot ([b809bb2](https://github.com/BitGo/BitGoJS/commit/b809bb2779a2e498fd0ba76437a198ad20ec1536))
* **utxo-lib:** increase test coverage for signature.ts ([49a1a48](https://github.com/BitGo/BitGoJS/commit/49a1a4805f7c69ee873243525fba4b9037f890fc))
* **utxo-lib:** make compatible with node 10, 12 ([dd8d8f9](https://github.com/BitGo/BitGoJS/commit/dd8d8f9a903c46549742512c30f5ce540b1c1e75))
* **utxo-lib:** pass 0 offset to `readUInt16BE` for zcash `fromBase58Check` ([ff99d32](https://github.com/BitGo/BitGoJS/commit/ff99d32110f23dfe2f1f41b9942f33ccc39deaac))
* **utxo-lib:** pass buffer to `hash256` ([602936a](https://github.com/BitGo/BitGoJS/commit/602936adfed547edd6254c915a9500e80c943bda))
* **utxo-lib:** remove debugger ([ac6e7ed](https://github.com/BitGo/BitGoJS/commit/ac6e7edbd8f28fc6afae7bc28dae2f2754d3e0d6))
* **utxo-lib:** remove trailing comma ([67dac1d](https://github.com/BitGo/BitGoJS/commit/67dac1d9e3d47352eab46b1ceccb203a7024718d))
* **utxo-lib:** respond to comments ([a2a5808](https://github.com/BitGo/BitGoJS/commit/a2a580815c2c8fa76822a8255b9cdd8028c8db77))
* **utxo-lib:** update mocha and test `.ts` files ([fb0e7d0](https://github.com/BitGo/BitGoJS/commit/fb0e7d0b4aed2e72a8b269f93c8c7ed8f0367ed0))
* **utxo-lib:** use different bitcoinjs-lib specifier ([a629eec](https://github.com/BitGo/BitGoJS/commit/a629eec182910e41e339bfebfa6faecffac01305))
* **utxo-lib:** use NU5_BRANCH_ID when parsing zcashTest v4 ([ae2ded6](https://github.com/BitGo/BitGoJS/commit/ae2ded6d35f807409eacd575b8b91f6451cdfdc8))
* **utxo-lib:** use OP_CHECKSIG for 2nd p2tr opcode ([a5fdf02](https://github.com/BitGo/BitGoJS/commit/a5fdf02795fcde78d85e94f51f9ac92db620aa67))
* **utxo-lib:** write `version` as `Int32` ([d3e337a](https://github.com/BitGo/BitGoJS/commit/d3e337ab997c81a2c2c4c1a7ee678777a571f89a))
* **utxolib:** use `debug` package ([68113bb](https://github.com/BitGo/BitGoJS/commit/68113bbd64411c71fa1c274eb8ff6d0ff1757d1d))
* **utxolib:** use path package for path operations ([75f6fab](https://github.com/BitGo/BitGoJS/commit/75f6fab78ee3d1d0493be407e4c05257712dfddd))
* v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))
* Validation is a part of builder ([641810b](https://github.com/BitGo/BitGoJS/commit/641810b7cce14ab34268fde7d93893d04b158ede))
* wait a second between 2 subsequent API calls ([62ec37d](https://github.com/BitGo/BitGoJS/commit/62ec37daba171cfc3bb5c97c19b58bb6d3e230c6))
* **wallet-platform:** whitelist messageKey param ([081e486](https://github.com/BitGo/BitGoJS/commit/081e486cc9b64cc3ba568bce6aec675f5f2e3ea6))
* whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))
* **wp:** split mocha test from outputScripts impl ([01053c9](https://github.com/BitGo/BitGoJS/commit/01053c9a5f754b884c665e485d613d964055053a))
* **wrw recoveries:** enable unsigned sweeps for recovery of erc20 tokens ([0c108eb](https://github.com/BitGo/BitGoJS/commit/0c108eb7f26fd6a0d22ee7d3bbe743c8f8cf4c35))
* **xrp:** fix incorrect explorerUrl for txrp ([67f9fbf](https://github.com/BitGo/BitGoJS/commit/67f9fbf16476dbd5f59014647ee47d16c56f4064))
* **xrp:** incorrect types for ledgerSequenceDelta ([03c2860](https://github.com/BitGo/BitGoJS/commit/03c28605c4d5a141203e9d247200778ddb19899c))


### Reverts

* Revert "Revert "feat(account-lib): dot implementation"" ([0519e38](https://github.com/BitGo/BitGoJS/commit/0519e381222f8d5b8841114bdc0a34ec79c73950))
* Revert "chore(core): remove insecure modules from webpack" ([23143ca](https://github.com/BitGo/BitGoJS/commit/23143cac90e247f7f90286485cae7e5e741190e6))
* Revert "fix(account-lib): revert algorand tokens changes" ([cdb5539](https://github.com/BitGo/BitGoJS/commit/cdb5539bc0a68f6df112c7229c938b87f5bf6625))
* Revert "Revert "fix(core): use more correct edge case value in abstract utxo test"" ([5ca7405](https://github.com/BitGo/BitGoJS/commit/5ca7405acef847cd93269c671a60ce37274e34e4))
* Revert "Revert "feat(core): allow disabling paygo outputs during utxo tx verification"" ([85b7e1c](https://github.com/BitGo/BitGoJS/commit/85b7e1c6c82b7073ceea699973ea7ffdb2078b23))
* Revert "fix(core): set minimal required node version to 10.22.0" ([eec236f](https://github.com/BitGo/BitGoJS/commit/eec236f28c2d33647a329d253097222d1ab6fb35))
* Revert "feat: add STX coin to statics and core" ([90eee7b](https://github.com/BitGo/BitGoJS/commit/90eee7b247d8b05cada93104888097a13f681425))
* Revert "Fixed toJson usage in core module" ([c029984](https://github.com/BitGo/BitGoJS/commit/c0299847d72c4b0a744fb6a4cce40708bb226d34))
* Revert "BGA-297 Compose transaction/transactionBuilder for HBAR using" ([9a38f4d](https://github.com/BitGo/BitGoJS/commit/9a38f4dbdb450dbdeff8a1d29549b43de58a6424))
* Revert "BGA-324 Update toJson method" ([43170e2](https://github.com/BitGo/BitGoJS/commit/43170e2a4d702af1fd228476fea720ef25bbcb0a))
* Revert "BGA-324 Set body to be mandatory" ([8201971](https://github.com/BitGo/BitGoJS/commit/8201971ddd696bf361056ff59aecd79def28f928))
* Revert "Update lerna to fix yarn audit finding" ([4710597](https://github.com/BitGo/BitGoJS/commit/4710597bdeef8058ace4128d89c4edfd0419f878))
* Revert "Fix: Validation is a part of builder" ([10f990e](https://github.com/BitGo/BitGoJS/commit/10f990e681ccea2a543ff631a8972a69df56b985))
* Revert "Revert "BG-11787 use updateSingleKeychainPassword instead of changeSingleKeychainPassword and fix unit tests"" ([a4873da](https://github.com/BitGo/BitGoJS/commit/a4873da71384467e66660b790f3bd17c0c7cd9fe))
* Revert "BG-8668: Add total and per-input signature counts to `explainTransaction`" ([4f4d9aa](https://github.com/BitGo/BitGoJS/commit/4f4d9aac3a04555e4c893d68f8ee2c5c4a258b1c))
* **core:** proper fix found for the stx transaction memo field test ([ca0a29e](https://github.com/BitGo/BitGoJS/commit/ca0a29ef7a953d3665daced83e5982280b20f093))
* **core:** revert isValidPub test with extended keys; needs an account-lib update ([cad98a5](https://github.com/BitGo/BitGoJS/commit/cad98a5ee0c7b4ad7d27a5477c995325b06485c4))
* don't initialize stx in the coinFactory just yet ([1ef2c5f](https://github.com/BitGo/BitGoJS/commit/1ef2c5febb8bc606fc7d51f807e0bb812b11ac58))
* return master branch package versions to non-rc versions ([5a0ca2b](https://github.com/BitGo/BitGoJS/commit/5a0ca2bda526fad472fe10290610783ae986982b))


### Code Refactoring

* **account-lib:** refactor builder to be consistent with other coins builders ([cbdc721](https://github.com/BitGo/BitGoJS/commit/cbdc721ebbb81752071f8731db4d11afc47539fa))
* **core:** add, use signAndVerifyWalletTransaction for utxo ([1070021](https://github.com/BitGo/BitGoJS/commit/1070021e38720824e0564dc729f25e273f3ea754))
* **core:** remove bluebird from bitgo object http methods ([be6c9b6](https://github.com/BitGo/BitGoJS/commit/be6c9b6f0436dd8aa2c0a5710cbfcb419dde746a))
* **utxo-lib:** improve `network` exports ([d1d6091](https://github.com/BitGo/BitGoJS/commit/d1d6091186800fa8aad0c906101ad266ebebe3ce))

### [2.1.3](https://github.com/BitGo/BitGoJS/compare/4.34.0...v2.1.3) (2018-08-10)

## [4.24.0](https://github.com/BitGo/BitGoJS/compare/4.23.0...4.24.0) (2018-04-10)

## [4.23.0](https://github.com/BitGo/BitGoJS/compare/4.22.0...4.23.0) (2018-03-28)

## [4.22.0](https://github.com/BitGo/BitGoJS/compare/4.21.0...4.22.0) (2018-03-14)

## [4.20.0](https://github.com/BitGo/BitGoJS/compare/4.19.0...4.20.0) (2018-02-14)

### [1.1.7](https://github.com/BitGo/BitGoJS/compare/v1.1.6...v1.1.7) (2018-01-22)

### [1.1.6](https://github.com/BitGo/BitGoJS/compare/v1.1.5...v1.1.6) (2018-01-22)

### [1.1.5](https://github.com/BitGo/BitGoJS/compare/4.18.1...v1.1.5) (2018-01-20)

### [4.17.1](https://github.com/BitGo/BitGoJS/compare/4.17.0...4.17.1) (2018-01-02)

## [4.17.0](https://github.com/BitGo/BitGoJS/compare/4.16.0...4.17.0) (2017-12-21)

## [4.16.0](https://github.com/BitGo/BitGoJS/compare/4.15.0...4.16.0) (2017-12-19)

## [4.15.0](https://github.com/BitGo/BitGoJS/compare/4.13.0...4.15.0) (2017-11-17)

## [4.13.0](https://github.com/BitGo/BitGoJS/compare/4.12.0...4.13.0) (2017-11-09)

## [4.12.0](https://github.com/BitGo/BitGoJS/compare/4.11.0...4.12.0) (2017-10-30)

## [4.11.0](https://github.com/BitGo/BitGoJS/compare/4.10.0...4.11.0) (2017-10-20)

## [4.10.0](https://github.com/BitGo/BitGoJS/compare/4.9.0...4.10.0) (2017-10-10)

## [4.9.0](https://github.com/BitGo/BitGoJS/compare/v4.9.0...4.9.0) (2017-10-05)

## [4.9.0](https://github.com/BitGo/BitGoJS/compare/4.8.0...v4.9.0) (2017-10-05)

## [4.8.0](https://github.com/BitGo/BitGoJS/compare/4.7.0...4.8.0) (2017-10-05)

## [4.7.0](https://github.com/BitGo/BitGoJS/compare/4.6.0...4.7.0) (2017-10-04)

## [4.6.0](https://github.com/BitGo/BitGoJS/compare/4.4.3...4.6.0) (2017-09-30)


### Reverts

* Revert "Improved error message" ([2c4b5d1](https://github.com/BitGo/BitGoJS/commit/2c4b5d1f6acf8462f2f130e9be9bf6cdcadbe288))

### [4.4.3](https://github.com/BitGo/BitGoJS/compare/4.4.2...4.4.3) (2017-09-21)

### [4.4.2](https://github.com/BitGo/BitGoJS/compare/v1.1.4...4.4.2) (2017-09-20)

### [1.1.4](https://github.com/BitGo/BitGoJS/compare/v4.4.1...v1.1.4) (2017-09-15)

### [4.4.1](https://github.com/BitGo/BitGoJS/compare/4.4.1...v4.4.1) (2017-09-13)

## [4.4.0](https://github.com/BitGo/BitGoJS/compare/v4.4.0...4.4.0) (2017-09-13)

## [4.4.0](https://github.com/BitGo/BitGoJS/compare/4.3.1...v4.4.0) (2017-09-13)

### [4.3.1](https://github.com/BitGo/BitGoJS/compare/4.3.0...4.3.1) (2017-09-11)

## [4.3.0](https://github.com/BitGo/BitGoJS/compare/4.2.2...4.3.0) (2017-09-09)

### [4.2.2](https://github.com/BitGo/BitGoJS/compare/4.2.1...4.2.2) (2017-09-06)

### [4.2.1](https://github.com/BitGo/BitGoJS/compare/4.1.3...4.2.1) (2017-09-06)

### [4.1.3](https://github.com/BitGo/BitGoJS/compare/4.1.2...4.1.3) (2017-09-05)

### [4.1.2](https://github.com/BitGo/BitGoJS/compare/4.1.0...4.1.2) (2017-09-04)

## [4.1.0](https://github.com/BitGo/BitGoJS/compare/4.0.0...4.1.0) (2017-08-28)

## [4.0.0](https://github.com/BitGo/BitGoJS/compare/3.5.1...4.0.0) (2017-08-23)

### [3.5.1](https://github.com/BitGo/BitGoJS/compare/3.5.0...3.5.1) (2017-08-10)

## [3.5.0](https://github.com/BitGo/BitGoJS/compare/3.4.15...3.5.0) (2017-08-08)

### [3.4.15](https://github.com/BitGo/BitGoJS/compare/3.4.14...3.4.15) (2017-08-08)

### [3.4.14](https://github.com/BitGo/BitGoJS/compare/3.4.11...3.4.14) (2017-08-07)

### [3.4.11](https://github.com/BitGo/BitGoJS/compare/3.4.10...3.4.11) (2017-08-04)

### [3.4.10](https://github.com/BitGo/BitGoJS/compare/3.4.9...3.4.10) (2017-08-03)

### [3.4.9](https://github.com/BitGo/BitGoJS/compare/3.4.8...3.4.9) (2017-07-28)

### [3.4.8](https://github.com/BitGo/BitGoJS/compare/3.4.7...3.4.8) (2017-07-25)

### [3.4.7](https://github.com/BitGo/BitGoJS/compare/3.4.6...3.4.7) (2017-07-24)

### [3.4.6](https://github.com/BitGo/BitGoJS/compare/3.4.4...3.4.6) (2017-07-14)

### [3.4.4](https://github.com/BitGo/BitGoJS/compare/3.4.3...3.4.4) (2017-07-07)

### [3.4.3](https://github.com/BitGo/BitGoJS/compare/3.4.2...3.4.3) (2017-07-07)

### [3.4.2](https://github.com/BitGo/BitGoJS/compare/3.4.1...3.4.2) (2017-07-06)

### [3.4.1](https://github.com/BitGo/BitGoJS/compare/3.4.0...3.4.1) (2017-07-05)

## [3.4.0](https://github.com/BitGo/BitGoJS/compare/v1.1.3...3.4.0) (2017-06-16)

### [1.1.3](https://github.com/BitGo/BitGoJS/compare/3.3.6...v1.1.3) (2017-06-15)


### Reverts

* Revert "2.0.0" - WASM too big to load sync in browser ([70db5d3](https://github.com/BitGo/BitGoJS/commit/70db5d328428aa2eba0c2b9738a47d23d138bb69))
* Revert "use sync wasm loading" ([a4b3217](https://github.com/BitGo/BitGoJS/commit/a4b32178ee94299416d28f0db65cc4a613c68f11))

### [3.3.6](https://github.com/BitGo/BitGoJS/compare/3.3.5...3.3.6) (2017-06-14)

### [3.3.5](https://github.com/BitGo/BitGoJS/compare/v1.1.2...3.3.5) (2017-06-14)

### [1.1.2](https://github.com/BitGo/BitGoJS/compare/v1.1.1...v1.1.2) (2017-06-11)

### [1.1.1](https://github.com/BitGo/BitGoJS/compare/v2.1.2...v1.1.1) (2017-06-11)

### [2.1.2](https://github.com/BitGo/BitGoJS/compare/v2.1.1...v2.1.2) (2017-06-11)

### [2.1.1](https://github.com/BitGo/BitGoJS/compare/v2.1.0...v2.1.1) (2017-06-11)

## [2.1.0](https://github.com/BitGo/BitGoJS/compare/v2.0.1...v2.1.0) (2017-06-11)

### [2.0.1](https://github.com/BitGo/BitGoJS/compare/v2.0.0...v2.0.1) (2017-06-11)

## [2.0.0](https://github.com/BitGo/BitGoJS/compare/3.3.3...v2.0.0) (2017-06-11)

### [3.3.3](https://github.com/BitGo/BitGoJS/compare/v1.2.0...3.3.3) (2017-06-08)

## [1.2.0](https://github.com/BitGo/BitGoJS/compare/v1.1.0...v1.2.0) (2017-06-06)

## [1.1.0](https://github.com/BitGo/BitGoJS/compare/3.3.1...v1.1.0) (2017-06-06)

### [3.3.1](https://github.com/BitGo/BitGoJS/compare/3.3.0...3.3.1) (2017-06-02)

## [3.3.0](https://github.com/BitGo/BitGoJS/compare/3.2.10...3.3.0) (2017-06-02)

### [3.2.10](https://github.com/BitGo/BitGoJS/compare/3.2.9...3.2.10) (2017-06-01)

### [3.2.9](https://github.com/BitGo/BitGoJS/compare/v1.0.0...3.2.9) (2017-06-01)

## [1.0.0](https://github.com/BitGo/BitGoJS/compare/3.2.8...v1.0.0) (2017-05-29)

### [3.2.8](https://github.com/BitGo/BitGoJS/compare/3.2.7...3.2.8) (2017-05-18)

### [3.2.7](https://github.com/BitGo/BitGoJS/compare/3.2.5...3.2.7) (2017-05-17)

### [3.2.5](https://github.com/BitGo/BitGoJS/compare/3.2.3...3.2.5) (2017-05-16)

### [3.2.3](https://github.com/BitGo/BitGoJS/compare/3.2.2...3.2.3) (2017-05-15)

### [3.2.2](https://github.com/BitGo/BitGoJS/compare/3.2.1...3.2.2) (2017-05-15)

### [3.2.1](https://github.com/BitGo/BitGoJS/compare/3.2.0...3.2.1) (2017-05-12)

## [3.2.0](https://github.com/BitGo/BitGoJS/compare/3.1.2...3.2.0) (2017-05-12)

### [3.1.2](https://github.com/BitGo/BitGoJS/compare/3.1.0...3.1.2) (2017-05-09)

## [3.1.0](https://github.com/BitGo/BitGoJS/compare/3.0.6...3.1.0) (2017-05-01)

### [3.0.6](https://github.com/BitGo/BitGoJS/compare/3.0.5...3.0.6) (2017-04-28)

### [3.0.5](https://github.com/BitGo/BitGoJS/compare/3.0.3...3.0.5) (2017-04-27)

### [3.0.3](https://github.com/BitGo/BitGoJS/compare/2.2.4...3.0.3) (2017-04-20)

### [2.2.4](https://github.com/BitGo/BitGoJS/compare/2.2.3...2.2.4) (2017-04-03)

### [2.2.3](https://github.com/BitGo/BitGoJS/compare/2.2.2...2.2.3) (2017-03-26)

### [2.2.2](https://github.com/BitGo/BitGoJS/compare/2.2.1...2.2.2) (2017-03-24)

### [2.2.1](https://github.com/BitGo/BitGoJS/compare/2.2.0...2.2.1) (2017-03-21)

## [2.2.0](https://github.com/BitGo/BitGoJS/compare/2.1.11...2.2.0) (2017-03-02)

### [2.1.11](https://github.com/BitGo/BitGoJS/compare/2.1.10...2.1.11) (2017-03-02)

### [2.1.10](https://github.com/BitGo/BitGoJS/compare/2.1.8...2.1.10) (2017-02-24)

### [2.1.8](https://github.com/BitGo/BitGoJS/compare/2.1.7...2.1.8) (2017-02-22)

### [2.1.7](https://github.com/BitGo/BitGoJS/compare/2.1.6...2.1.7) (2017-02-08)

### [2.1.6](https://github.com/BitGo/BitGoJS/compare/2.1.5...2.1.6) (2017-02-06)

### [2.1.5](https://github.com/BitGo/BitGoJS/compare/2.1.4...2.1.5) (2017-01-06)

### [2.1.4](https://github.com/BitGo/BitGoJS/compare/2.1.2...2.1.4) (2017-01-04)

### [2.1.2](https://github.com/BitGo/BitGoJS/compare/2.1.1...2.1.2) (2016-12-27)

### [2.1.1](https://github.com/BitGo/BitGoJS/compare/2.1.0...2.1.1) (2016-12-22)

## [2.1.0](https://github.com/BitGo/BitGoJS/compare/2.0.5...2.1.0) (2016-12-16)

### [2.0.5](https://github.com/BitGo/BitGoJS/compare/2.0.4...2.0.5) (2016-12-01)

### [2.0.4](https://github.com/BitGo/BitGoJS/compare/2.0.3...2.0.4) (2016-10-17)

### [2.0.3](https://github.com/BitGo/BitGoJS/compare/2.0.2...2.0.3) (2016-08-26)

### [2.0.2](https://github.com/BitGo/BitGoJS/compare/2.0.1...2.0.2) (2016-08-19)

### [2.0.1](https://github.com/BitGo/BitGoJS/compare/2.0.0...2.0.1) (2016-07-26)

## [2.0.0](https://github.com/BitGo/BitGoJS/compare/1.8.0...2.0.0) (2016-07-02)

## [1.8.0](https://github.com/BitGo/BitGoJS/compare/1.7.0...1.8.0) (2016-05-27)

## [1.7.0](https://github.com/BitGo/BitGoJS/compare/1.6.1...1.7.0) (2016-05-21)

### [1.6.1](https://github.com/BitGo/BitGoJS/compare/1.6.0...1.6.1) (2016-05-10)

## [1.6.0](https://github.com/BitGo/BitGoJS/compare/1.5.4...1.6.0) (2016-05-10)

### [1.5.4](https://github.com/BitGo/BitGoJS/compare/1.5.3...1.5.4) (2016-05-02)

### [1.5.3](https://github.com/BitGo/BitGoJS/compare/1.5.1...1.5.3) (2016-04-27)

### [1.5.1](https://github.com/BitGo/BitGoJS/compare/1.5.0...1.5.1) (2016-04-27)

## [1.5.0](https://github.com/BitGo/BitGoJS/compare/1.4.0...1.5.0) (2016-04-27)

## [1.4.0](https://github.com/BitGo/BitGoJS/compare/1.3.0...1.4.0) (2016-04-20)

## [1.3.0](https://github.com/BitGo/BitGoJS/compare/1.2.1...1.3.0) (2016-04-12)

### [1.2.1](https://github.com/BitGo/BitGoJS/compare/1.0.0...1.2.1) (2016-04-11)

## [1.0.0](https://github.com/BitGo/BitGoJS/compare/0.13.0...1.0.0) (2016-03-22)

## [0.13.0](https://github.com/BitGo/BitGoJS/compare/0.12.0...0.13.0) (2016-03-18)

## [0.12.0](https://github.com/BitGo/BitGoJS/compare/0.11.72...0.12.0) (2016-03-07)

### [0.11.72](https://github.com/BitGo/BitGoJS/compare/0.11.70...0.11.72) (2016-03-04)

### [0.11.70](https://github.com/BitGo/BitGoJS/compare/0.11.68...0.11.70) (2016-03-02)

### [0.11.68](https://github.com/BitGo/BitGoJS/compare/0.11.67...0.11.68) (2016-03-01)

### [0.11.67](https://github.com/BitGo/BitGoJS/compare/0.11.66...0.11.67) (2016-02-25)

### [0.11.66](https://github.com/BitGo/BitGoJS/compare/0.11.65...0.11.66) (2016-02-23)

### [0.11.65](https://github.com/BitGo/BitGoJS/compare/0.11.64...0.11.65) (2016-02-18)

### [0.11.64](https://github.com/BitGo/BitGoJS/compare/0.11.63...0.11.64) (2016-01-16)

### [0.11.63](https://github.com/BitGo/BitGoJS/compare/0.11.62...0.11.63) (2016-01-16)

### [0.11.62](https://github.com/BitGo/BitGoJS/compare/0.11.60...0.11.62) (2015-12-22)

### [0.11.60](https://github.com/BitGo/BitGoJS/compare/0.11.59...0.11.60) (2015-12-18)

### [0.11.59](https://github.com/BitGo/BitGoJS/compare/0.11.58...0.11.59) (2015-12-18)

### [0.11.58](https://github.com/BitGo/BitGoJS/compare/0.11.57...0.11.58) (2015-12-17)

### [0.11.57](https://github.com/BitGo/BitGoJS/compare/0.11.47...0.11.57) (2015-12-17)

### [0.11.47](https://github.com/BitGo/BitGoJS/compare/0.11.45...0.11.47) (2015-11-17)

### [0.11.45](https://github.com/BitGo/BitGoJS/compare/0.11.42...0.11.45) (2015-10-30)

### [0.11.42](https://github.com/BitGo/BitGoJS/compare/0.11.41...0.11.42) (2015-09-23)

### [0.11.41](https://github.com/BitGo/BitGoJS/compare/0.11.40...0.11.41) (2015-09-23)

### [0.11.40](https://github.com/BitGo/BitGoJS/compare/0.11.38...0.11.40) (2015-09-22)

### [0.11.38](https://github.com/BitGo/BitGoJS/compare/0.11.36...0.11.38) (2015-09-21)

### [0.11.36](https://github.com/BitGo/BitGoJS/compare/0.11.35...0.11.36) (2015-09-14)

### [0.11.35](https://github.com/BitGo/BitGoJS/compare/0.11.34...0.11.35) (2015-09-10)

### [0.11.34](https://github.com/BitGo/BitGoJS/compare/0.11.33...0.11.34) (2015-09-02)

### [0.11.33](https://github.com/BitGo/BitGoJS/compare/0.11.32...0.11.33) (2015-08-28)

### [0.11.32](https://github.com/BitGo/BitGoJS/compare/0.11.31...0.11.32) (2015-08-20)

### [0.11.31](https://github.com/BitGo/BitGoJS/compare/0.11.30...0.11.31) (2015-08-17)

### [0.11.30](https://github.com/BitGo/BitGoJS/compare/0.11.29...0.11.30) (2015-08-14)

### [0.11.29](https://github.com/BitGo/BitGoJS/compare/0.11.28...0.11.29) (2015-08-14)

### [0.11.28](https://github.com/BitGo/BitGoJS/compare/0.11.27...0.11.28) (2015-08-14)

### [0.11.27](https://github.com/BitGo/BitGoJS/compare/0.11.26...0.11.27) (2015-07-31)

### [0.11.26](https://github.com/BitGo/BitGoJS/compare/0.11.25...0.11.26) (2015-07-31)

### [0.11.25](https://github.com/BitGo/BitGoJS/compare/0.11.24...0.11.25) (2015-07-21)

### [0.11.24](https://github.com/BitGo/BitGoJS/compare/0.11.23...0.11.24) (2015-07-17)

### [0.11.23](https://github.com/BitGo/BitGoJS/compare/0.11.22...0.11.23) (2015-07-16)

### [0.11.22](https://github.com/BitGo/BitGoJS/compare/0.11.21...0.11.22) (2015-07-08)

### [0.11.21](https://github.com/BitGo/BitGoJS/compare/0.11.20...0.11.21) (2015-07-08)

### [0.11.20](https://github.com/BitGo/BitGoJS/compare/0.11.19...0.11.20) (2015-07-08)

### [0.11.19](https://github.com/BitGo/BitGoJS/compare/0.11.18...0.11.19) (2015-06-26)

### [0.11.18](https://github.com/BitGo/BitGoJS/compare/0.11.17...0.11.18) (2015-06-22)

### [0.11.17](https://github.com/BitGo/BitGoJS/compare/0.11.16...0.11.17) (2015-06-12)

### [0.11.16](https://github.com/BitGo/BitGoJS/compare/0.11.15...0.11.16) (2015-06-05)

### [0.11.15](https://github.com/BitGo/BitGoJS/compare/0.11.14...0.11.15) (2015-06-05)

### [0.11.14](https://github.com/BitGo/BitGoJS/compare/0.11.13...0.11.14) (2015-06-04)

### [0.11.13](https://github.com/BitGo/BitGoJS/compare/0.11.12...0.11.13) (2015-06-02)

### [0.11.12](https://github.com/BitGo/BitGoJS/compare/0.11.11...0.11.12) (2015-06-02)

### [0.11.11](https://github.com/BitGo/BitGoJS/compare/0.11.10...0.11.11) (2015-05-29)

### [0.11.10](https://github.com/BitGo/BitGoJS/compare/0.11.9...0.11.10) (2015-05-28)

### [0.11.9](https://github.com/BitGo/BitGoJS/compare/0.11.8...0.11.9) (2015-05-28)

### [0.11.8](https://github.com/BitGo/BitGoJS/compare/0.11.7...0.11.8) (2015-05-24)

### [0.11.7](https://github.com/BitGo/BitGoJS/compare/0.11.6...0.11.7) (2015-05-20)

### [0.11.6](https://github.com/BitGo/BitGoJS/compare/0.11.5...0.11.6) (2015-05-16)

### [0.11.5](https://github.com/BitGo/BitGoJS/compare/0.11.3...0.11.5) (2015-05-07)

### [0.11.3](https://github.com/BitGo/BitGoJS/compare/0.11.2...0.11.3) (2015-05-06)

### [0.11.2](https://github.com/BitGo/BitGoJS/compare/0.11.1...0.11.2) (2015-05-04)

### [0.11.1](https://github.com/BitGo/BitGoJS/compare/v0.11.0...0.11.1) (2015-04-20)

## [0.11.0](https://github.com/BitGo/BitGoJS/compare/v0.10.0...v0.11.0) (2015-04-15)

## [0.10.0](https://github.com/BitGo/BitGoJS/compare/0.9.26...v0.10.0) (2015-04-10)

### [0.9.26](https://github.com/BitGo/BitGoJS/compare/0.9.25...0.9.26) (2015-02-19)

### [0.9.25](https://github.com/BitGo/BitGoJS/compare/0.9.24...0.9.25) (2015-02-18)

### [0.9.24](https://github.com/BitGo/BitGoJS/compare/0.9.23...0.9.24) (2015-02-18)

### [0.9.23](https://github.com/BitGo/BitGoJS/compare/0.9.22...0.9.23) (2015-02-13)

### [0.9.22](https://github.com/BitGo/BitGoJS/compare/0.9.21...0.9.22) (2015-02-11)

### [0.9.21](https://github.com/BitGo/BitGoJS/compare/0.9.20...0.9.21) (2015-02-04)

### [0.9.20](https://github.com/BitGo/BitGoJS/compare/0.9.19...0.9.20) (2015-02-03)

### [0.9.19](https://github.com/BitGo/BitGoJS/compare/0.9.18...0.9.19) (2015-02-03)

### [0.9.18](https://github.com/BitGo/BitGoJS/compare/0.9.16...0.9.18) (2015-01-30)

### [0.9.16](https://github.com/BitGo/BitGoJS/compare/v0.9.15...0.9.16) (2015-01-29)

### [0.9.15](https://github.com/BitGo/BitGoJS/compare/v0.9.13...v0.9.15) (2015-01-29)

### [0.9.13](https://github.com/BitGo/BitGoJS/compare/v0.9.11...v0.9.13) (2015-01-27)

### [0.9.11](https://github.com/BitGo/BitGoJS/compare/v0.9.10...v0.9.11) (2015-01-16)

### [0.9.10](https://github.com/BitGo/BitGoJS/compare/v0.9.9...v0.9.10) (2015-01-16)

### [0.9.9](https://github.com/BitGo/BitGoJS/compare/v0.9.8...v0.9.9) (2015-01-13)

### [0.9.8](https://github.com/BitGo/BitGoJS/compare/v0.9.5...v0.9.8) (2015-01-10)

### [0.9.5](https://github.com/BitGo/BitGoJS/compare/v0.9.4...v0.9.5) (2015-01-09)

### [0.9.4](https://github.com/BitGo/BitGoJS/compare/v0.9.3...v0.9.4) (2015-01-09)

### [0.9.3](https://github.com/BitGo/BitGoJS/compare/v0.9.2...v0.9.3) (2015-01-08)

### [0.9.2](https://github.com/BitGo/BitGoJS/compare/v0.9.1...v0.9.2) (2015-01-08)

### [0.9.1](https://github.com/BitGo/BitGoJS/compare/v0.9.0...v0.9.1) (2015-01-08)

## 0.9.0 (2014-12-31)

## [14.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0...bitgo@14.0.0) (2022-04-26)


### ⚠ BREAKING CHANGES

* **account-lib:** Builder method changing

STLX-14028
* **core:** Methods that previously implemented `verifyAddress` incorrectly will
now throw `MethodNotImplementedError()` instead.

Issue: BG-43225

### Features

* **account-lib:** add claim for dot staking ([34ca211](https://github.com/BitGo/BitGoJS/commit/34ca2116304ed638871f9b294befcfecbeb1854d))
* **account-lib:** add deposit and stake builder for near ([10d6d1e](https://github.com/BitGo/BitGoJS/commit/10d6d1e0c63d01e192e8ea4979bf8386736eaee8))
* **account-lib:** add explain transaction for Near ([adfa88b](https://github.com/BitGo/BitGoJS/commit/adfa88b46a1312c9c9f02cff650f761e27da37b6))
* **account-lib:** add NEAR transaction builder ([3badcbd](https://github.com/BitGo/BitGoJS/commit/3badcbdb974a62c26aa96a10d627aea27a5d7123))
* **account-lib:** add NEAR tss signing ([d8ee226](https://github.com/BitGo/BitGoJS/commit/d8ee226f2aad5e75328e0f0c8836282c993d054b))
* **account-lib:** add solana tokens STLX-11959 ([1902efb](https://github.com/BitGo/BitGoJS/commit/1902efbf3dcee72879d0bec2676a97961caba24d))
* **account-lib:** add solana util functions for use in wp, refactor ([460adfa](https://github.com/BitGo/BitGoJS/commit/460adfa7576712d9eab184bbd7e55f8c19e41131))
* **account-lib:** add staking deactivate builder ([35bb996](https://github.com/BitGo/BitGoJS/commit/35bb9965513a87b63ca89c0e3d05298230248079))
* **account-lib:** add staking withdraw builder ([34c7a75](https://github.com/BitGo/BitGoJS/commit/34c7a75a6755480c2a62606562002f645f90c65f))
* **account-lib:** add stateproofkey param ([46111c9](https://github.com/BitGo/BitGoJS/commit/46111c90df78b735d1c1d8da391857975c5bf6f5))
* **account-lib:** add support for offline kr txn ([4fad380](https://github.com/BitGo/BitGoJS/commit/4fad380967effc80deb650626519d30b05933e0e))
* **account-lib:** add withdrawUnstaked for dot ([984e412](https://github.com/BitGo/BitGoJS/commit/984e412f88eb6060182c144bf6fc2b8dee12899e))
* **account-lib:** adding NFT support to BitGo SDK ([39b7a4f](https://github.com/BitGo/BitGoJS/commit/39b7a4f6e4707a172cc506312f7930f8bc0a1603))
* **account-lib:** allow dot key pair init with bs58 pub key ([d40ef28](https://github.com/BitGo/BitGoJS/commit/d40ef28af3edc77aaa61265512b07b61ee378065))
* **account-lib:** avaxc upgrade common fork to london ([9028b75](https://github.com/BitGo/BitGoJS/commit/9028b7543f9e8322598c2225eefc4dff7d5ea5dd))
* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** change NEAR transfer builder interface ([ac4bf46](https://github.com/BitGo/BitGoJS/commit/ac4bf4605e2cbae191c4cbac252b76a8a8c49bef))
* **account-lib:** export AtaInitializationBuilder STLX-11958 ([c0ec45b](https://github.com/BitGo/BitGoJS/commit/c0ec45ba1690e44b28e7439e7bbe487b91dd6ac9))
* **account-lib:** export token transfer builder STLX-11959 ([b757aa8](https://github.com/BitGo/BitGoJS/commit/b757aa89c6fd535740b732556df2ec53e281396e))
* **account-lib:** fixing coins.ts tsol mint addresses STLX-11959 ([f973924](https://github.com/BitGo/BitGoJS/commit/f973924eb29a53570de67861f44d270cdf35a1cd))
* **account-lib:** implement add signature for sol ([451e58a](https://github.com/BitGo/BitGoJS/commit/451e58a1f1a34e54c7d493a2dac6621c777da783))
* **account-lib:** improve and export NEAR util methods ([7ad569e](https://github.com/BitGo/BitGoJS/commit/7ad569e631ca8a5f8737c199bfdb190d92af9c61))
* **account-lib:** include rent exempt amount in solana ata init transaction STLX-11958 ([25c7eeb](https://github.com/BitGo/BitGoJS/commit/25c7eebce629b0d9de6a52946bc4b3f91b34fe22))
* **account-lib:** load inputs and outputs of solana create ata instruction STLX-11958 ([a3a2ab1](https://github.com/BitGo/BitGoJS/commit/a3a2ab1a6fb885a9aecc5c648529bfc9f313622c))
* **account-lib:** recover signature from raw tx ([113f132](https://github.com/BitGo/BitGoJS/commit/113f132f3219c752938b40a56eb90fca937b223d))
* **account-lib:** refactor mintAddress -> tokenName 3 STLX-11959 ([a1455a3](https://github.com/BitGo/BitGoJS/commit/a1455a36eab968503691928d2ac8daef1a00797d))
* **account-lib:** refactor mintAddress -> tokenName 4 STLX-11959 ([eeeaecd](https://github.com/BitGo/BitGoJS/commit/eeeaecdffb2ae00e2c01e5b14e52995c934f8998))
* **account-lib:** refactor mintAddress -> tokenName STLX-11959 ([6ca2d10](https://github.com/BitGo/BitGoJS/commit/6ca2d1065e76c26f0d2aac8a08ed536bbba9bbad))
* **account-lib:** spl-token encode/decode rework STLX-11959 ([e1db449](https://github.com/BitGo/BitGoJS/commit/e1db449d2094ea9f85f8af479f83f14f0371b99b))
* **account-lib:** support creating TSS keyshares with seed ([6716720](https://github.com/BitGo/BitGoJS/commit/6716720705087d31bddc978b4c89ad0bf1a494bd))
* **account-lib:** support HD MPC key generation and signing ([be934d3](https://github.com/BitGo/BitGoJS/commit/be934d34fb75020d78618ef9fdf2976041346be8))
* **account-lib:** supporting adding signatures to transactions ([00cd566](https://github.com/BitGo/BitGoJS/commit/00cd5662bf9f89c9c4bdab948f6548107c9ef696))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **account-lib:** token transfer support STLX-11959 ([1687234](https://github.com/BitGo/BitGoJS/commit/16872349fc25bffce07eda515728aff250d1a25d))
* **account-lib:** validate ValidityWindows in baseBuildTransaction ([dd1dfc4](https://github.com/BitGo/BitGoJS/commit/dd1dfc41ac2a5fa9489f0472b31ad584b868b9d7))
* add fetchEncryptedPrivKeys.ts ([136fbab](https://github.com/BitGo/BitGoJS/commit/136fbabb6220b7e5620d6705b0ceb1819f45dcac))
* add nft tokens to statics ([9f42cc4](https://github.com/BitGo/BitGoJS/commit/9f42cc4b8dc4f81bcff6fa6d7da58b07df5b8c2a))
* add retry logic to external signer ([05e198a](https://github.com/BitGo/BitGoJS/commit/05e198a64f43afbf035fee406f27e0b35cb90721))
* add signing functionality to external signer mode ([ee26c72](https://github.com/BitGo/BitGoJS/commit/ee26c727931a2ae08613f173bd34a1092c5915fc))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* **bitgo:** add emergency param to whitelist ([3e0b615](https://github.com/BitGo/BitGoJS/commit/3e0b6155c750da431ffc8062a4ccf7c0bad639f2))
* **bitgo:** add nonce in prebuild whitelisted params ([bbf4084](https://github.com/BitGo/BitGoJS/commit/bbf4084912bb0b29c048bbc192d83b1ce4bdf156))
* **bitgo:** update tss hd wallet sharing ([d416f1e](https://github.com/BitGo/BitGoJS/commit/d416f1e65794f1be2a0d908b0d2d43b5f0589355))
* check config when running in external signer mode ([3c0e9a1](https://github.com/BitGo/BitGoJS/commit/3c0e9a12f2ae652a95defc289cb32a9589369bb0))
* check that signerFileSystemPath path contains a private key ([fe78332](https://github.com/BitGo/BitGoJS/commit/fe78332784edcff6f897ef05d315f2106a1308f4))
* **core:** add createTss func to keychains ([954a148](https://github.com/BitGo/BitGoJS/commit/954a148a324acaadfdf28a0b570ecb4a8a817076))
* **core:** add examples of enable and disable token ([1aeeeb3](https://github.com/BitGo/BitGoJS/commit/1aeeeb3c6b87fa0c7b3a1ff9de131be74d6d8286))
* **core:** add function in SDK and write examples for deploy/flush forwarder. Ticket: STLX-12550 ([c4cd0b4](https://github.com/BitGo/BitGoJS/commit/c4cd0b4710b8405add0104c289eb145a45983636))
* **core:** add hop to signTransaction and unit tests ([9d58b26](https://github.com/BitGo/BitGoJS/commit/9d58b261ddeb24bfbbb5cb6ebf2e18b8ec94e550))
* **core:** add tss flow on pending approval ([22313ff](https://github.com/BitGo/BitGoJS/commit/22313ff47dcea31340eee3e83c9d09ad641e02e4))
* **core:** added node urls for Near ([4102c56](https://github.com/BitGo/BitGoJS/commit/4102c56fb4bc7ddbb57ef3e928b3f3e4c95c4073))
* **core:** enable hop transactions in avaxc ([4395c47](https://github.com/BitGo/BitGoJS/commit/4395c4791a64eca7500dd7c0658a6f9a5690e0af))
* **core:** impelement tss wallet creation ([d5dfe3a](https://github.com/BitGo/BitGoJS/commit/d5dfe3a83c235ec1c30fbf8afc14e2bb46168218))
* **core:** implement getSignablePayload for baseCoin and sol ([c584437](https://github.com/BitGo/BitGoJS/commit/c584437485922af67940b807afde2bee348e158c))
* **core:** implement sign transaction for NEAR ([6da463a](https://github.com/BitGo/BitGoJS/commit/6da463a35a97a328985cdd0b3e3f173956884424))
* **core:** support BLS-DKG key generation flow for ETH2 hot wallet creation ([356eee7](https://github.com/BitGo/BitGoJS/commit/356eee7b9fc090de6dda03a864c405e464701988))
* **core:** support creating algo wallets with seed ([41837ad](https://github.com/BitGo/BitGoJS/commit/41837ad8645285a157d1b565abfbe88f7ee15bf4))
* **core:** support creating solana ATA with sdk ([40ee96f](https://github.com/BitGo/BitGoJS/commit/40ee96ff0804f140b027cf9c7034b295a876a86d))
* **core:** support tss wallet sharing ([249f424](https://github.com/BitGo/BitGoJS/commit/249f424f56d5ea2ecd4a4546986133e95d693fc1))
* **core:** tss wallet sharing tests ([3a5923b](https://github.com/BitGo/BitGoJS/commit/3a5923b13883d9022a86a7b8621b8dd488a7d85c))
* **core:** verify and prebuild hop transactions ([bac9bde](https://github.com/BitGo/BitGoJS/commit/bac9bde745371804357fa3cd673fa0572442f1b9))
* **core:** verify tss transactions ([319515f](https://github.com/BitGo/BitGoJS/commit/319515f91200fab7b96954c0b1687dbef7092308))
* enable external signer mode for production ([077d2de](https://github.com/BitGo/BitGoJS/commit/077d2de7e477a2563b64b7d9be2fb7d4a594949b))
* external signer to read encrypted privkeys ([32176e7](https://github.com/BitGo/BitGoJS/commit/32176e78edefa4cf3f5a853c33640604e812a42d))
* external signer to read private key from walletid ([735dcd9](https://github.com/BitGo/BitGoJS/commit/735dcd9cc0a00745405740d728c27da9aba993b3))
* only allow external signing feature to run in test mode ([7b00932](https://github.com/BitGo/BitGoJS/commit/7b009324446b0b0546ca68832767afc5ef92f5c5))
* **root:** add unit-test-all to ci ([3d0efa4](https://github.com/BitGo/BitGoJS/commit/3d0efa49b3fb64dd658829e45c557152e8b7ae43))
* **root:** implement isWalletAddress for HBAR ([dc8d5fc](https://github.com/BitGo/BitGoJS/commit/dc8d5fca2c41881d97ffab084a1e6232f9a1c426))
* **root:** implement isWalletAddress for STX ([1828397](https://github.com/BitGo/BitGoJS/commit/1828397d1eedab1afde6e04ad64894437698cfa5))
* **root:** update SDK sendMany to use TSS ([6fef741](https://github.com/BitGo/BitGoJS/commit/6fef741913d6afb86ec3c73b6cdefe8a7c831afc))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* **statics:** add 2nd batch Feb tokens ([53aa64d](https://github.com/BitGo/BitGoJS/commit/53aa64d33ebb90bea1186ac39c2c4fce9464130f))
* **statics:** add april tokens ERC20 and algo token ([a0cb164](https://github.com/BitGo/BitGoJS/commit/a0cb164d01872abc47925df97ddf43c35b58c7f1))
* **statics:** add erc20 tokens ([fc496c3](https://github.com/BitGo/BitGoJS/commit/fc496c34a1b538ad1e31fbe6b4ab3a159590d40e))
* **statics:** add gteth support for trading ([53e5680](https://github.com/BitGo/BitGoJS/commit/53e56803407f54803e0c456bb32be87210a7cf59))
* **statics:** add matic coin config ([c6514c9](https://github.com/BitGo/BitGoJS/commit/c6514c98d494e7bc1a8ab110024d68abc51ae8f3))
* **statics:** add new tokens ([9328422](https://github.com/BitGo/BitGoJS/commit/93284228b12627efaa0e2f0c770f9dd733b9fc9f))
* **statics:** add ofc casper coins support for trading ([a88406f](https://github.com/BitGo/BitGoJS/commit/a88406f444022d29ad6b5d746280025059a00217))
* **statics:** add ofc stacks coins support for trading ([3fa7ee4](https://github.com/BitGo/BitGoJS/commit/3fa7ee45a05dd873ca39aec9d1d452069ca19780))
* **statics:** add ofcavaxc and ofctavaxc support for trading ([c06f72c](https://github.com/BitGo/BitGoJS/commit/c06f72cb5a291f1badbf5374f88bbfba923ea208))
* **statics:** add token traxx ([752f2a3](https://github.com/BitGo/BitGoJS/commit/752f2a391bc5d23d4ae5b7eb3cfc70b2c3251f64))
* **statics:** create FIAT currency in Testnet ([4b3bfcb](https://github.com/BitGo/BitGoJS/commit/4b3bfcb07c95cd9ca5cdf7d745fd5f56a3217652))
* **statics:** create FIAT tokens in Testnet ([9a4d727](https://github.com/BitGo/BitGoJS/commit/9a4d7275e1a65dd2cda54e8d4c8918f36f7952a8))
* **statics:** create fiat-usdc-tusdc ([a9a1d60](https://github.com/BitGo/BitGoJS/commit/a9a1d6058da72b1b1eebeec556d2af984ec660b6))
* **statics:** rename burp token ([762fb19](https://github.com/BitGo/BitGoJS/commit/762fb198b8ca381cd8a5a9c1b92e159cd4130781))
* **statics:** support new Algo token name format ([47a1cd7](https://github.com/BitGo/BitGoJS/commit/47a1cd7a66530795f853f7d775da5a4153c975a0))
* **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))
* **statics:** update token contract addresses ([85744bf](https://github.com/BitGo/BitGoJS/commit/85744bf3c66141cd3841259acb91d4f2eab1a958))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))
* support validation of  base58 dot public keys ([a8fae0d](https://github.com/BitGo/BitGoJS/commit/a8fae0d0e69154327625a523afdc2b5f4e512cda))
* tss keychain creation ([93c33be](https://github.com/BitGo/BitGoJS/commit/93c33be9bdf62ef2bb676f04a509e564cf5c7725))
* unhardened derivation with tss ([ce29c26](https://github.com/BitGo/BitGoJS/commit/ce29c26bfcdbf9b1e015d8ef759ec1b2b29ccda9))
* update params to post /signatureshares ([49cdcdd](https://github.com/BitGo/BitGoJS/commit/49cdcdd9fb1af3f3cb316251fd0682740e31b390))
* update tss key creation to support hd ([9611e5d](https://github.com/BitGo/BitGoJS/commit/9611e5dce0460d0fae691fbc90c887d3f8e720fd))
* update tss signing to support hd ([a3b3b3f](https://github.com/BitGo/BitGoJS/commit/a3b3b3fed18a462d85d11a6f0fd498edf0f699e2))
* **utxo-bin:** add support for odd transactions ([4c44297](https://github.com/BitGo/BitGoJS/commit/4c442974b5638f97db2ca013ecd887adaa9f8707))


### Bug Fixes

* **account-lib:** add hash to signable ([401266a](https://github.com/BitGo/BitGoJS/commit/401266a4094be9ab7d034565476635817fdf828b))
* **account-lib:** dot unit test memory issue ([709266b](https://github.com/BitGo/BitGoJS/commit/709266b172bcd288e1912b9441752bd3be4545b8))
* **account-lib:** fix amount method unit ([8df519b](https://github.com/BitGo/BitGoJS/commit/8df519b83c08ce985b6011edf6685eafb948eea4))
* **account-lib:** fix validity windows unit test ([1f39b99](https://github.com/BitGo/BitGoJS/commit/1f39b99bcfe6e921c9c69d5183925270c4468861))
* **account-lib:** update algo decode transaction method ([e142775](https://github.com/BitGo/BitGoJS/commit/e142775f19bad0fec015fe9eb1bf73afca87f6ee))
* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** fix avaxctoken cannot withdraw ([a3c1dc7](https://github.com/BitGo/BitGoJS/commit/a3c1dc78a994e040df2a17b7488dae6a39090fff))
* **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
* **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))
* **bitgo:** fix verifyTransaction for near ([9d5cf1f](https://github.com/BitGo/BitGoJS/commit/9d5cf1f3363a321363bf39cdde76a99c2eae9e6a))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* **blockapis:** use correct mocha import ([958b2c0](https://github.com/BitGo/BitGoJS/commit/958b2c093df39b5ec80ca793ba9d71d451fa7d57))
* change keyname from asset to symbol in amount ([5b23bf7](https://github.com/BitGo/BitGoJS/commit/5b23bf780adb8288336e807c45c2a745d876599d))
* **core:** add multisig type param on add wallet ([2622028](https://github.com/BitGo/BitGoJS/commit/2622028bfe2b4d50aa15ae20e12e92fc27f10e5e))
* **core:** add signing params for hopTx ([987bc33](https://github.com/BitGo/BitGoJS/commit/987bc3315a45e730f1576ee6ccb6191117aa20f2))
* **core:** change loop to POST /address ([d66305f](https://github.com/BitGo/BitGoJS/commit/d66305f16d65dd8f299b122fc8a81a596ab343a1))
* **core:** default goerli for etherscan ([f4fadbf](https://github.com/BitGo/BitGoJS/commit/f4fadbfa9256ef58d4f4f56b511faaea739ab9ca))
* **core:** expose feeInfo when building txns from tx requests ([6000d2e](https://github.com/BitGo/BitGoJS/commit/6000d2edd14297e51fd4fbd433fe091b8bdb1d61))
* **core:** fix tss pending approvals ([e686536](https://github.com/BitGo/BitGoJS/commit/e686536679f2a1729d531c3430c7456402345803))
* **core:** fix tss wallet creation ([ac06c62](https://github.com/BitGo/BitGoJS/commit/ac06c624710f2fff49430b6bb0b32a66892aaa8e))
* **core:** implement isWalletAddress for ALGO ([262a1ec](https://github.com/BitGo/BitGoJS/commit/262a1ecea7d3bb6055c7aee465ba70bb7202546a))
* **core:** rename token to tokenName, possible clash with auth token for algo ([46cfcf2](https://github.com/BitGo/BitGoJS/commit/46cfcf2564f4d1d350987bd1ce6dbdb947033802))
* **core:** rename verifyAddress and remove invalid implementations ([3d6d5d0](https://github.com/BitGo/BitGoJS/commit/3d6d5d07fcc4d228d39b7634e8f3349a6d623ded))
* **core:** support eip-1559 and eip-155 in wrw ([e88b8e1](https://github.com/BitGo/BitGoJS/commit/e88b8e11a8f469be527a770972132aee5c9ec2a8))
* **core:** support password reset and enterprise with MPC ([2434ee6](https://github.com/BitGo/BitGoJS/commit/2434ee644b0c1c111dc6df32f5e061b61ca2bd50))
* **core:** tss backup keychain output prv ([e7facc7](https://github.com/BitGo/BitGoJS/commit/e7facc792b7cfe8b36f71cc662d7504316fa88fd))
* **express:** build express outside TS Build systm ([4c59ff8](https://github.com/BitGo/BitGoJS/commit/4c59ff87a4a03f4a324d0a126e00dd19c5acf44d))
* fix build ([4a19ae6](https://github.com/BitGo/BitGoJS/commit/4a19ae67b003a39982551c9615a7a4ef217bc15b))
* fix urijs vuln ([957c618](https://github.com/BitGo/BitGoJS/commit/957c6185f912cf74792cfcbc4e3bd20b14ab5de3))
* force secure urls unless disabled ([3b9edd5](https://github.com/BitGo/BitGoJS/commit/3b9edd593016f82fa69a4fe740ea706fe1daeee7))
* getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
* remove `gitHead` property from package.jsons ([e6b7fdd](https://github.com/BitGo/BitGoJS/commit/e6b7fdd4e4e16c4a07a9a7ad39cc70f08854486e))
* **statics:** adding ofcmcdai, ofcaxsv2, ofclrcv2, and ofcxsushi ([d472e9d](https://github.com/BitGo/BitGoJS/commit/d472e9d63e3cddf7cd416f606c60426013e0d109))
* **statics:** avaxc token name to lower case ([de49cb3](https://github.com/BitGo/BitGoJS/commit/de49cb30be27dad05e958e7a7eceacd6ec2e0c33))
* **statics:** fix import/exports ([29d02b9](https://github.com/BitGo/BitGoJS/commit/29d02b9a5f97f1a78bce2313c5e95dc07240a3db))
* **statics:** fix precision for ofcterc ([75e465a](https://github.com/BitGo/BitGoJS/commit/75e465ac812ea0d59b2f05af9059debdb8a472ba))
* **statics:** fix Solana transactions explorers ([c1f4e62](https://github.com/BitGo/BitGoJS/commit/c1f4e62e683e932af21b7238777c73a6fc7ef2d2))
* **statics:** fix stx explorer url ([cfa4998](https://github.com/BitGo/BitGoJS/commit/cfa499829f41ee791d5a0f7cc79bae801fdc1b73))
* **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))
* update dot to address breaking changes in 7.15.1 ([a949618](https://github.com/BitGo/BitGoJS/commit/a949618de00b944b2d9729485f6b9ac4e6fced3f))
* update package-lock.json and clientRoutes ([a3433ea](https://github.com/BitGo/BitGoJS/commit/a3433ea0e86af35a26ae24bcb2e3f9c7adede91f))
* update package-lock.json and clientRoutes ([9ed9bb4](https://github.com/BitGo/BitGoJS/commit/9ed9bb44727611cf3d9b67284b1d7dd6ec10772f))
* **utxo-lib:** always verify ECDSA in strict mode ([4fcaf53](https://github.com/BitGo/BitGoJS/commit/4fcaf53f18f74a68f37a0513a549fea1c5c1ffb8)), closes [/github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts#L215](https://github.com/BitGo//github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts/issues/L215) [/github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts#L1212](https://github.com/BitGo//github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts/issues/L1212)
* v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))
* whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))


### Code Refactoring

* **account-lib:** refactor builder to be consistent with other coins builders ([cbdc721](https://github.com/BitGo/BitGoJS/commit/cbdc721ebbb81752071f8731db4d11afc47539fa))

# [14.0.0](https://github.com/BitGo/BitGoJS/compare/1.9.1...14.0.0) (2022-04-26)


### Bug Fixes

* **account-lib:** add hash to signable ([401266a](https://github.com/BitGo/BitGoJS/commit/401266a4094be9ab7d034565476635817fdf828b))
* **account-lib:** add input/output in stx contract call ([05f95f9](https://github.com/BitGo/BitGoJS/commit/05f95f9df5c468bd4ddbaede874cf8e9ed58a014))
* **account-lib:** add more checks and tests ([423bc26](https://github.com/BitGo/BitGoJS/commit/423bc26196d0fcb9f5f8cdf5110f446b804a051d))
* **account-lib:** add parsing for optional type in stringifyCV ([3f3fddb](https://github.com/BitGo/BitGoJS/commit/3f3fddbb37ea970eac8311585f22bb8dc6a8d0dc))
* **account-lib:** bG-29930 Update and pin hashgraph sdk version ([5654e37](https://github.com/BitGo/BitGoJS/commit/5654e37b4500f7fe8c9e81d22a6ce9c2a1e76410))
* **account-lib:** change statics version back to ^6.0.0 ([49f0a02](https://github.com/BitGo/BitGoJS/commit/49f0a02273ce1d6b0881bfa4a05eb8743780326f))
* **account-lib:** changed key validation for Solana ([274af3b](https://github.com/BitGo/BitGoJS/commit/274af3b8cd395f9969224aa2441de558514fbb8a))
* **account-lib:** check accountId for null before accessing property ([b3639d8](https://github.com/BitGo/BitGoJS/commit/b3639d86f757d840bc6433cd9968d1158b75e2ec))
* **account-lib:** dot unit test memory issue ([709266b](https://github.com/BitGo/BitGoJS/commit/709266b172bcd288e1912b9441752bd3be4545b8))
* **account-lib:** eip1559 transaction builder deserialization ([32a3151](https://github.com/BitGo/BitGoJS/commit/32a31518cf1ffcddad5225baa7073b62e4779280))
* **account-lib:** fix addSignature method of cspr transaction ([ce00564](https://github.com/BitGo/BitGoJS/commit/ce005643424f5306a60e688306194cf14bb69846))
* **account-lib:** fix amount in cspr delegate & undelegate builders ([43b0b3f](https://github.com/BitGo/BitGoJS/commit/43b0b3fcf2fbc3eb2420e943a27e0cfb28065dd1))
* **account-lib:** fix amount method unit ([8df519b](https://github.com/BitGo/BitGoJS/commit/8df519b83c08ce985b6011edf6685eafb948eea4))
* **account-lib:** fix chain name used in CSPR transactions ([a54cdab](https://github.com/BitGo/BitGoJS/commit/a54cdab2126a0b81b66029aef8ce5684c107e192))
* **account-lib:** fix CSPR address validation ([db92eb4](https://github.com/BitGo/BitGoJS/commit/db92eb45c69a37abd0a118194205208682ba32c8))
* **account-lib:** fix CSPR address validation for encoding change ([91b1ba3](https://github.com/BitGo/BitGoJS/commit/91b1ba35cfa86560aae6c0e7ec2d25b7c969b891))
* **account-lib:** fix decode signed algo transaction ([fd82efe](https://github.com/BitGo/BitGoJS/commit/fd82efee18ab186b1d14d301a99fa803edaffa7f))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([977d4df](https://github.com/BitGo/BitGoJS/commit/977d4df509101cd463d81ce2330b59ad2dc90b6e))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([94e0fa2](https://github.com/BitGo/BitGoJS/commit/94e0fa27a3b39e139f441fafc7a834a2e0007cdf))
* **account-lib:** fix get account hash method ([e321c9c](https://github.com/BitGo/BitGoJS/commit/e321c9c077aef8a8d798cf6d77b1e47d4bd8efd1))
* **account-lib:** fix getTransferId method of cspr utils ([2d3d658](https://github.com/BitGo/BitGoJS/commit/2d3d658d17cc1f4e790ba3164b014df412b4ffff))
* **account-lib:** fix isValidPublicKey to check for undefined pubKey ([9020a0f](https://github.com/BitGo/BitGoJS/commit/9020a0f26b5681eab2e2081be37862e8e8d3f782))
* **account-lib:** fix lint errors ([56b789f](https://github.com/BitGo/BitGoJS/commit/56b789f5ca161bc8c5f14e95ea81d3db67e9b9b5))
* **account-lib:** fix lint errors ([cc87263](https://github.com/BitGo/BitGoJS/commit/cc872636370ed76e39c7c5726ad9afbbdecd855d))
* **account-lib:** fix postcondition for send many builder ([7c3c70f](https://github.com/BitGo/BitGoJS/commit/7c3c70fa7d01586c3e95583f45c02f69ff8411e1))
* **account-lib:** fix processSigning method of cspr transactionBuilder ([895c643](https://github.com/BitGo/BitGoJS/commit/895c643e7af72d311b92931deed8fcccf14f2752))
* **account-lib:** fix solana isValidAddress ([0f1cd93](https://github.com/BitGo/BitGoJS/commit/0f1cd93dd30d5cc7313201f4bf2ec9f657022465))
* **account-lib:** fix test ([31763a1](https://github.com/BitGo/BitGoJS/commit/31763a1ae3183e0b908427fa9b67b2350e76cbe3))
* **account-lib:** fix trx fee limit boundary ([059cf6e](https://github.com/BitGo/BitGoJS/commit/059cf6ef80b2d69693a72e2eb7bff6db3a383d30))
* **account-lib:** fix types in algo utils and typos ([415225c](https://github.com/BitGo/BitGoJS/commit/415225ceb3ad95f63b98d4235f0dbc975dbc83e1))
* **account-lib:** fix typo on json field ([3025e83](https://github.com/BitGo/BitGoJS/commit/3025e83071f56d3fc03621aeb14a5ce473f4573a))
* **account-lib:** fix validate algo address test ([801846d](https://github.com/BitGo/BitGoJS/commit/801846dad63010c53ff7e614f7ded1aea6e4c8e3))
* **account-lib:** fix validity windows unit test ([1f39b99](https://github.com/BitGo/BitGoJS/commit/1f39b99bcfe6e921c9c69d5183925270c4468861))
* **account-lib:** fixed tobroadcastformat method ([8cf3353](https://github.com/BitGo/BitGoJS/commit/8cf335353dc0b9a9f0091ac7ced099cdddee4a35))
* **account-lib:** merge-related changes (stacks renamed to stx, etc) ([64a9597](https://github.com/BitGo/BitGoJS/commit/64a9597e6eec4e230b0e4bfcb28021f66adcc18c))
* **account-lib:** readd `es5` target and `esModuleInterop` ([f2e316d](https://github.com/BitGo/BitGoJS/commit/f2e316dd6df0eb2387516b755ce84b9c96e523c4))
* **account-lib:** remove algo utils ([ba8ea30](https://github.com/BitGo/BitGoJS/commit/ba8ea301c639bdbf3e5c033b8f854cef94498086))
* **account-lib:** remove proxy type from constants STLX-12064 ([82b1d47](https://github.com/BitGo/BitGoJS/commit/82b1d475a7c958d0d7420998e55c603f1a29f214))
* **account-lib:** remove unused import ([fe4555f](https://github.com/BitGo/BitGoJS/commit/fe4555fe5bd91ba936ae8a807153a94864bb301d))
* **account-lib:** stacks multi sig issue ([253c46d](https://github.com/BitGo/BitGoJS/commit/253c46dce8b31dc19b9cb987fbcf339652edf39e))
* **account-lib:** stx default signers to 2 ([02a6c56](https://github.com/BitGo/BitGoJS/commit/02a6c56c44983fb81b6d143783db431be2326a6f))
* **account-lib:** stx get signatures to return only signatures ([271fefb](https://github.com/BitGo/BitGoJS/commit/271fefbb6e9e74ba34e10cc14553961434c11902))
* **account-lib:** stx half sign tx ([0925fe4](https://github.com/BitGo/BitGoJS/commit/0925fe4018431f2b5db48620b8dbcc51267cecd0))
* **account-lib:** update algo decode transaction method ([e142775](https://github.com/BitGo/BitGoJS/commit/e142775f19bad0fec015fe9eb1bf73afca87f6ee))
* **account-lib:** update dot feeOption jsdoc ([dff22a8](https://github.com/BitGo/BitGoJS/commit/dff22a82012399bb95314ae31cbc52407028375d))
* **account-lib:** update static values for dot tests STLX-11678 ([773800e](https://github.com/BitGo/BitGoJS/commit/773800e47e75902b7e30d7bbbc0807f166fc73e9))
* **account-lib:** update validitiyWindow dot validation ([47d35ff](https://github.com/BitGo/BitGoJS/commit/47d35ffc23deb143e7c32b2d180fdbe584698299))
* **account-lib:** use stable version of @bitgo/blake2b ([77d035a](https://github.com/BitGo/BitGoJS/commit/77d035acaa5ff9925a891075375c91db5158811e))
* **account-lib:** yarn lock after revert ([f1b66b2](https://github.com/BitGo/BitGoJS/commit/f1b66b2959a41412b34c8f59c5981b43a139482b))
* **accountlib:** fix getStxAddressFromPubKeys to add signatures required paramater ([2d7e5ae](https://github.com/BitGo/BitGoJS/commit/2d7e5ae9ca59f592b65e15c8b06ce63db27754bd))
* **accountlib:** improve multisig in order to user any order or combination of keys ([37235fd](https://github.com/BitGo/BitGoJS/commit/37235fdfdc83133eab1db185b1598671c092a89c))
* **accountlib:** stx transactionBuilder network fix ([d966f10](https://github.com/BitGo/BitGoJS/commit/d966f1084c3cf935fc3c7e125490088a5edf530a))
* add `publishConfig` package.json of public packages ([195ac13](https://github.com/BitGo/BitGoJS/commit/195ac137d9a8da9c6c6cfe5821738ecc898b6c2c))
* add `publishConfig` package.json of public packages ([28cf439](https://github.com/BitGo/BitGoJS/commit/28cf439c49a075de7241895374ccce6318792b1c))
* add more informative error msg ([4fbb634](https://github.com/BitGo/BitGoJS/commit/4fbb634e6bfaf707322a369ab70241956a770d76))
* add new tokens ([c1db855](https://github.com/BitGo/BitGoJS/commit/c1db855ac2a0a970b4052adab86a3c261760c577))
* add to base and changes for prettify ([95035a8](https://github.com/BitGo/BitGoJS/commit/95035a82193f5c2a722463c948386723b9afb43a))
* add up-to-date node version support info to README ([6eb0962](https://github.com/BitGo/BitGoJS/commit/6eb0962a0469bafd151b7ab02940aae0ad97b857))
* address review comments ([261bc0a](https://github.com/BitGo/BitGoJS/commit/261bc0a062756e98897edfc3e2494e6ed1cb7574))
* adds wallet version support in core ([f76e71a](https://github.com/BitGo/BitGoJS/commit/f76e71a8f8b492155500ad2f429a95f7310ca897))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([931ef50](https://github.com/BitGo/BitGoJS/commit/931ef50e7cc093923c3b6a799f7d70472171bf2a))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([ef1afb8](https://github.com/BitGo/BitGoJS/commit/ef1afb8ead03e852a4a40060f7d423967b9b032f))
* **algo:** invalid signature on create wallet (bg-38048) ([c7071cc](https://github.com/BitGo/BitGoJS/commit/c7071ccbbbe1d6889cd912242addbe37c04fb0c7))
* **algo:** support for signing unsigned keyreg transaction (bg-37892) ([ffdfdf2](https://github.com/BitGo/BitGoJS/commit/ffdfdf24085f5d1b2fba262d7ac5bcfa5761126f))
* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** fix avaxctoken cannot withdraw ([a3c1dc7](https://github.com/BitGo/BitGoJS/commit/a3c1dc78a994e040df2a17b7488dae6a39090fff))
* **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
* **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))
* **bitgo:** fix verifyTransaction for near ([9d5cf1f](https://github.com/BitGo/BitGoJS/commit/9d5cf1f3363a321363bf39cdde76a99c2eae9e6a))
* **bitgojs:** fix security audit build failure ([347cc22](https://github.com/BitGo/BitGoJS/commit/347cc227f11b6efb5f5eed0277d41d2921e0ba94))
* **bitgojs:** revert revert of algo-tokens changes ([5784921](https://github.com/BitGo/BitGoJS/commit/5784921456c625340b8101a1ad9b528fc4aa1686))
* **bitgojs:** revert revert of algo-tokens changes ([a469736](https://github.com/BitGo/BitGoJS/commit/a469736ef57afa47d829d223cfd7fb4b86771c52))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* **blockapis:** use correct mocha import ([958b2c0](https://github.com/BitGo/BitGoJS/commit/958b2c093df39b5ec80ca793ba9d71d451fa7d57))
* **bls-dkg:** add publish config for public package ([c530435](https://github.com/BitGo/BitGoJS/commit/c530435a1ac863ee9d1e6b9d48b5bc73db101811))
* catch etherscan rate limit error ([d0b1b0f](https://github.com/BitGo/BitGoJS/commit/d0b1b0f4670695af7eebd41ff474d3d9edcacc74))
* change automated commit message to be conventional-commits compatible ([d824782](https://github.com/BitGo/BitGoJS/commit/d8247827775261f7b9ba3fe917751aec169c905b))
* change keyname from asset to symbol in amount ([5b23bf7](https://github.com/BitGo/BitGoJS/commit/5b23bf780adb8288336e807c45c2a745d876599d))
* change the token address for cqt ([1149bdc](https://github.com/BitGo/BitGoJS/commit/1149bdcfb02276556dea04e0ee84bdbfd4661713))
* change the token address for cqt ([2c545da](https://github.com/BitGo/BitGoJS/commit/2c545dae350b84806ba66fb9455718602420e3f9))
* check account properties before using ([9d2457f](https://github.com/BitGo/BitGoJS/commit/9d2457fb62bbf6079f55cb0125b4d714dd9cf2d7))
* **ci:** add signature to .drone.yml when it gets regenerated from the .drone.jsonnet ([00c80a9](https://github.com/BitGo/BitGoJS/commit/00c80a950682a214ff072aa36eb9c5f06cf5beb8))
* **ci:** ignore merge commits when checking commit messages ([b24707e](https://github.com/BitGo/BitGoJS/commit/b24707ee3a96304a0ab7a1f8c68f565f0309305f))
* **codeowners:** add eth-team to codeowners ([dd84a05](https://github.com/BitGo/BitGoJS/commit/dd84a0548dcebe93a9c68b7d9d13bee20e547911))
* **config:** add BSV and BCHA as recoverable coin with coincover ([76f7b40](https://github.com/BitGo/BitGoJS/commit/76f7b40e93dfbe59307e180317a2b5f94f06087e))
* **core:** accountSet txn support ([2e3b236](https://github.com/BitGo/BitGoJS/commit/2e3b2368e5a19ef1fa5feae1a65f3091ca63e0f6))
* **core:** add a "memo" field to stx's explainTransaction's displayOrder ([be8c251](https://github.com/BitGo/BitGoJS/commit/be8c251fbfc3380ff1edcd310a070002efeb962a))
* **core:** add algo seed encoding ([c0f8ea5](https://github.com/BitGo/BitGoJS/commit/c0f8ea5cd07e1f106ab17ad09399e04b1f6591af))
* **core:** add algo seed encoding ([8808b1c](https://github.com/BitGo/BitGoJS/commit/8808b1cfa228cf81d91a064b0f24e97e05670f2d))
* **core:** add base `explainTransaction` method ([4731af3](https://github.com/BitGo/BitGoJS/commit/4731af36cb4992843c4ecfde77395098afc5a10d))
* **core:** add flush threshold example ([6048485](https://github.com/BitGo/BitGoJS/commit/6048485fc255e6db8dff581e91bbfbef81aade90))
* **core:** add missing dep on `@bitgo/blockapis` ([a2cd98e](https://github.com/BitGo/BitGoJS/commit/a2cd98e3ebb65a6f0b243ec5ab1b1840342c309f))
* **core:** add multisig type param on add wallet ([2622028](https://github.com/BitGo/BitGoJS/commit/2622028bfe2b4d50aa15ae20e12e92fc27f10e5e))
* **core:** add route name as tx type for consolidate/fanout ([b6c4733](https://github.com/BitGo/BitGoJS/commit/b6c4733ae942ed893772111400e1bb56593ca03a))
* **core:** add signing params for hopTx ([987bc33](https://github.com/BitGo/BitGoJS/commit/987bc3315a45e730f1576ee6ccb6191117aa20f2))
* **core:** add transferid to list of valid tx params ([7e222db](https://github.com/BitGo/BitGoJS/commit/7e222dbfe0f1547ca28364c113e0a13b88bd6842))
* **core:** add transferid to sendmany options ([d713f4a](https://github.com/BitGo/BitGoJS/commit/d713f4a015d8167d4658f76cbf58d62fd810cb50))
* **core:** address verification should fail for uppercase bech32 addresses ([39c5d7c](https://github.com/BitGo/BitGoJS/commit/39c5d7cbdd793ade4ba939bf4c6df1b4d9ec5e79))
* **core:** algosdk typings ([80095b1](https://github.com/BitGo/BitGoJS/commit/80095b1d665282cf81d241f09364ec36c5b98a81))
* **core:** allow for ENS resolution in WP to change recipient addr(eth) ([8d8a9e5](https://github.com/BitGo/BitGoJS/commit/8d8a9e589cff5ee717b2dea9a22ddc2c7b75e26d))
* **core:** allow paygo outputs for empty verification options object ([b20405c](https://github.com/BitGo/BitGoJS/commit/b20405c36fee2681aa974ff4e5f3c6f6cd3109f3))
* **core:** always fetch full key triple for signing ([3af1ab2](https://github.com/BitGo/BitGoJS/commit/3af1ab238a5e491f1503645f09c696a4785950aa))
* **core:** body not being included in HMAC ([50babb5](https://github.com/BitGo/BitGoJS/commit/50babb5473f3c2c4b2138a411870d5f93d0997b5))
* **core:** break cyclical dependency ([0d00616](https://github.com/BitGo/BitGoJS/commit/0d00616cde5e1b7945410e4f45158f2071032163))
* **core:** bring back getECDHSecret ([922b5bf](https://github.com/BitGo/BitGoJS/commit/922b5bf3f4b34f69d3ee7c262c7f3cf09f21364d))
* **core:** bump account-lib version ([5491fd7](https://github.com/BitGo/BitGoJS/commit/5491fd708f0fb7702bb3e56f42a1037a782e6c60))
* **core:** bump stellar-sdk ([200bc3f](https://github.com/BitGo/BitGoJS/commit/200bc3f8f1593c5808b1467fdaf264c7af4625e8))
* **core:** change loop to POST /address ([d66305f](https://github.com/BitGo/BitGoJS/commit/d66305f16d65dd8f299b122fc8a81a596ab343a1))
* **core:** change stx implementation of generateKeyPair() to return xpub format ([c248936](https://github.com/BitGo/BitGoJS/commit/c2489363ba58680e8c60bc5189160dc04ca76caa))
* **core:** change the type of sendMethodName which is used for fixing erc20 unsigned sweep recovery ([66d118c](https://github.com/BitGo/BitGoJS/commit/66d118c71724ff1e7f1ba2711858ec78e5a75518)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** change type of `sequenceId` to string ([9ff64f3](https://github.com/BitGo/BitGoJS/commit/9ff64f307856a5d3b86c1597c2629a8fe824f7a1))
* **core:** client send an objet as memo but memo is treated as a string ([c631daa](https://github.com/BitGo/BitGoJS/commit/c631daae45747960f5f20dc915c4e4503d18b9eb))
* **core:** correct chainid of eos testnet ([bc128a9](https://github.com/BitGo/BitGoJS/commit/bc128a91a0a3349af792aa2a88c46b279b0cbc29))
* **core:** correct type of `allTokens` property on `TransfersOptions` ([401aa09](https://github.com/BitGo/BitGoJS/commit/401aa093121ee7acbc97468e995e1f308830a09a))
* **core:** correct typo when address parameter is missing ([9cf7e90](https://github.com/BitGo/BitGoJS/commit/9cf7e903cadc3c2fe5adca25d24b4977c9643ffe))
* **core:** correctly handle ECPair case in `getAddressP2PKH` ([a386bb4](https://github.com/BitGo/BitGoJS/commit/a386bb4983ae9c9aa209e9e4dfced832de88899c))
* **core:** correctly pass `pubs` ([159f6f1](https://github.com/BitGo/BitGoJS/commit/159f6f1116bc637808f02ec9349d5d93b5f3163e))
* **core:** deduplicate repetitive `abstractUtxoCoin` parse tx tests ([be39c40](https://github.com/BitGo/BitGoJS/commit/be39c4087215e1b1e694196467e5e00edcda828c))
* **core:** default goerli for etherscan ([f4fadbf](https://github.com/BitGo/BitGoJS/commit/f4fadbfa9256ef58d4f4f56b511faaea739ab9ca))
* **core:** defer application of authorization headers ([8a26071](https://github.com/BitGo/BitGoJS/commit/8a26071fec8c290c68f5920dad69be545813118b))
* **core:** disable `esModuleInterop` ([619769c](https://github.com/BitGo/BitGoJS/commit/619769cbfb53a550b18b04643514f1fdbecccfe8))
* **core:** disable p2tr for btg ([cc70f26](https://github.com/BitGo/BitGoJS/commit/cc70f260035268ed0707e3c31be5d4ac1afa4046))
* **core:** disable verification for hop transactions ([2515a9c](https://github.com/BitGo/BitGoJS/commit/2515a9c9aeba6d0f2f10cbce39f094a059e40a20))
* **core:** don't add extra `0x` prefix when formatting for offline vault ([3555d50](https://github.com/BitGo/BitGoJS/commit/3555d5056963c3e6d4035f125a4fecb41f8cd761))
* **core:** don't log wallet upon tx prebuild validation failure ([0c5c5c3](https://github.com/BitGo/BitGoJS/commit/0c5c5c3f097638629348e7104ddc66fa61ecf295))
* **core:** don't pick individual tx verification options ([d1fdc36](https://github.com/BitGo/BitGoJS/commit/d1fdc3699289f4fb850845d0e543e5ce17af0cd8))
* **core:** don't require `pubs` param to `explainTransaction` ([18ad557](https://github.com/BitGo/BitGoJS/commit/18ad557759c1f32732f69bb9c67445a5a47aab1d))
* **core:** expose feeInfo when building txns from tx requests ([6000d2e](https://github.com/BitGo/BitGoJS/commit/6000d2edd14297e51fd4fbd433fe091b8bdb1d61))
* **core:** fix address validation for casper ([f0ada2e](https://github.com/BitGo/BitGoJS/commit/f0ada2e99b244373dbc0050a26a0436120b5e7e7))
* **core:** fix bip32-based `isValidPub`/`isValidPrv` ([3ab57c4](https://github.com/BitGo/BitGoJS/commit/3ab57c4ee3983377d97486cc526a836f5bec8130))
* **core:** fix broken tests ([feb63f5](https://github.com/BitGo/BitGoJS/commit/feb63f5c7f08b53ff230e8f8b408d3adc70cc769))
* **core:** fix createTransactionBuilderFromTransaction call ([0de8574](https://github.com/BitGo/BitGoJS/commit/0de8574e1b7a30f9772ce0427d782dfafc9eae9d))
* **core:** fix cspr address validation to account for transferId ([89f1990](https://github.com/BitGo/BitGoJS/commit/89f1990c44289e5fc4a94c99fe5c2136b7b775c9))
* **core:** fix default sigHash for p2tr ([595d957](https://github.com/BitGo/BitGoJS/commit/595d957f61f3d10ba78219c68fa2b5a8952c6323))
* **core:** fix ENS resolution for eth sends ([8ca5d2f](https://github.com/BitGo/BitGoJS/commit/8ca5d2fb6978b62ba1d425f17468ec345fb464ef))
* **core:** fix failing tests after coroutine removal in test code ([6b8bbe2](https://github.com/BitGo/BitGoJS/commit/6b8bbe2762e97aafa93e885742030a01c56f61d0))
* **core:** fix fromBase58() in legacyBitcoin ([f563fd4](https://github.com/BitGo/BitGoJS/commit/f563fd4196e79d4961840f11bb5673b6040a9726))
* **core:** fix getExtraPrebuildParams ([6486c9f](https://github.com/BitGo/BitGoJS/commit/6486c9fc7308cdaa02ddcaaae9a829e50e61c2c9))
* **core:** fix hbar webpack ([7bc465a](https://github.com/BitGo/BitGoJS/commit/7bc465afca300f7e3eec5af92e9254e820eec555))
* **core:** fix import for Bluebird library on cspr ([324c484](https://github.com/BitGo/BitGoJS/commit/324c4845f8da8e0e4150ec60e22b9fd0394130c6))
* **core:** fix incorrect return type on presignTransaction ([b9dc27c](https://github.com/BitGo/BitGoJS/commit/b9dc27c0d8550b8d59066151f125c9f8958ef0a1))
* **core:** fix issue of erc20 token recovery using unsigned sweep ([0de956f](https://github.com/BitGo/BitGoJS/commit/0de956fd77253d351a35f215ccd747ca6c562c66)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** fix issue while signing eos transaction using OVC ([5c25580](https://github.com/BitGo/BitGoJS/commit/5c25580442721a6784645e1383b0e435ccd418aa))
* **core:** fix key pair generation methods ([fa16f19](https://github.com/BitGo/BitGoJS/commit/fa16f1932f026ee334b7eaa700bf7a0ff9112ea4))
* **core:** fix lint error ([7abc0e2](https://github.com/BitGo/BitGoJS/commit/7abc0e219b5afb51ccf4c62d544db40dd3b30130))
* **core:** fix memoid check for eos txn ([145bea7](https://github.com/BitGo/BitGoJS/commit/145bea753da193fa17c7351a4fa46f2b529063b0))
* **core:** fix method name to TRX.xpubToUncompressedPub ([b45b882](https://github.com/BitGo/BitGoJS/commit/b45b882b0db02b61f59e03d78a6000b72290ef64))
* **core:** fix nock body types ([465acf0](https://github.com/BitGo/BitGoJS/commit/465acf00bfa3c36af840cd6956179879b045bd61))
* **core:** fix prebuild transaction for tron contractCalls ([9d0edea](https://github.com/BitGo/BitGoJS/commit/9d0edeaffd39b23ba5fd07a134df030c3d622902))
* **core:** fix regression in `addAccessToken` when using v1 auth ([e58e86b](https://github.com/BitGo/BitGoJS/commit/e58e86bc00b6f6582d5d527044dbc87cf4086a51))
* **core:** fix sol send tx ([012d702](https://github.com/BitGo/BitGoJS/commit/012d7023e9fe32d8d7d2aa13cef94dceae176d43))
* **core:** fix tests which were broken after coroutine removal ([deb6698](https://github.com/BitGo/BitGoJS/commit/deb66982cd4c898665399fbd5dd8288d74502331))
* **core:** fix token unit test which expected Bluebird promise ([9c39873](https://github.com/BitGo/BitGoJS/commit/9c3987335a1371a4c5f579fca5caa875358563ee))
* **core:** fix tss pending approvals ([e686536](https://github.com/BitGo/BitGoJS/commit/e686536679f2a1729d531c3430c7456402345803))
* **core:** fix tss wallet creation ([ac06c62](https://github.com/BitGo/BitGoJS/commit/ac06c624710f2fff49430b6bb0b32a66892aaa8e))
* **core:** fix txPrebuild param in CSPR signTransaction method ([85cdc87](https://github.com/BitGo/BitGoJS/commit/85cdc87d6b09a6826b2a363503dc6f12313548ec))
* **core:** fix verify sign parameters for Algorand ([47348cd](https://github.com/BitGo/BitGoJS/commit/47348cd4297b54c66377f6afa52edff6c1a8473b))
* **core:** fix verify tx for solana ([0085ddc](https://github.com/BitGo/BitGoJS/commit/0085ddc26644231a3c8a0dcaef18d8b32db3dda9))
* **core:** fix verityTransaction for sol ([ac98a34](https://github.com/BitGo/BitGoJS/commit/ac98a34b9935477a8c3a2a6c24f9eca9ebfd7c0e))
* **core:** fix wallet creation for CSPR ([667917e](https://github.com/BitGo/BitGoJS/commit/667917e9b41690eb7b501419d2890857bcf453e7))
* **core:** fix xpubToEthAddress ([aabaa51](https://github.com/BitGo/BitGoJS/commit/aabaa51322066dc8b8a7f9e7ca7d71b3cc434b36))
* **core:** fixed TAT issues ([378d76e](https://github.com/BitGo/BitGoJS/commit/378d76e2b6ee7a071fcb244c47237ca2a59c2306))
* **core:** fixed TAT issues ([c648262](https://github.com/BitGo/BitGoJS/commit/c64826249e22c4ebb017e2e47ff740fdfa57d7ee))
* **core:** follow up improvements from PR [#1292](https://github.com/BitGo/BitGoJS/issues/1292) ([7ee6fdb](https://github.com/BitGo/BitGoJS/commit/7ee6fdb05508992761afd50f906b860e9e3096e0))
* **core:** get appropriate signing keys for all signing calls ([1a4d60c](https://github.com/BitGo/BitGoJS/commit/1a4d60cdd2b63f8ffaf796c514eeeb4aeb8e7710))
* **core:** handle script sigs without signature property in `explainTransaction` ([76028f5](https://github.com/BitGo/BitGoJS/commit/76028f58a6cc5b8a390a6d16d5a696ced368e6cc))
* **core:** hard code zcash transaction version ([5ff20c5](https://github.com/BitGo/BitGoJS/commit/5ff20c5b5ea491701e74288480dbb9f1e5020fcd))
* **core:** ignore algo token from browser tests ([d0104ed](https://github.com/BitGo/BitGoJS/commit/d0104ed1dd90f62f89fe9ceeff4e45cb465e6dca))
* **core:** ignore typescript errors from incompatible `@types/ethereumjs-util` ([a52de1b](https://github.com/BitGo/BitGoJS/commit/a52de1b9417f9cac392a91482b1715074415c064))
* **core:** implement explainTransaction for p2tr ([8ef2d6a](https://github.com/BitGo/BitGoJS/commit/8ef2d6ac44738a5f5cd23dc29f244e84deb14727))
* **core:** implement isWalletAddress for ALGO ([262a1ec](https://github.com/BitGo/BitGoJS/commit/262a1ecea7d3bb6055c7aee465ba70bb7202546a))
* **core:** implement verify transaction for eos ([8cd3051](https://github.com/BitGo/BitGoJS/commit/8cd3051465cd013a22424a9708419dd4e2f9f3ff))
* **core:** improve documentation in hashForSignatureByNetwork ([081c573](https://github.com/BitGo/BitGoJS/commit/081c573b810c7e847c68990381bebe1d445847c9))
* **core:** improve error response string creation ([43e10e3](https://github.com/BitGo/BitGoJS/commit/43e10e3490d0d2196d5f5a7cd1792248fe299256))
* **core:** improve GenerateAddressOptions type ([b0dbb6a](https://github.com/BitGo/BitGoJS/commit/b0dbb6aea5076afbc801d25614298166c61cc708))
* **core:** improve logging when encountering prebuild validation error ([75ffd0c](https://github.com/BitGo/BitGoJS/commit/75ffd0c1f4c1df673201f04faa8815bdadecce9e))
* **core:** load all keychains for taproot signing ([1e34120](https://github.com/BitGo/BitGoJS/commit/1e34120de798e2597bf6ead6e661c3c2301cf824))
* **core:** Recreate XLM integration test wallets ([4603039](https://github.com/BitGo/BitGoJS/commit/4603039131900c6405d845c307156298fdaf3386))
* **core:** remove coroutines from v2/coins/dot and fix tests ([9ea55e8](https://github.com/BitGo/BitGoJS/commit/9ea55e814e825f077832d3772fd784e1d697573b))
* **core:** remove custom getTxInfoFromExplorer in LTC ([491358f](https://github.com/BitGo/BitGoJS/commit/491358fa0e8d73387a8a47b93a4c9efb60d52e6f))
* **core:** removed signingKey capability ([14346fa](https://github.com/BitGo/BitGoJS/commit/14346fae2e5459467cc8c89b1c70a3f17d91cb42))
* **core:** rename feeInfo param in explain tx method for Casper ([5b02e13](https://github.com/BitGo/BitGoJS/commit/5b02e13f735328087c6d1aac437089a789b221e1))
* **core:** rename HalfSignedTransaction to HalfSignedAccountTransaction ([5a6dedd](https://github.com/BitGo/BitGoJS/commit/5a6deddec240ab722b553aab11e473758d7de827))
* **core:** Rename import instead of colliding with declared interface ([8b55707](https://github.com/BitGo/BitGoJS/commit/8b55707487d719459597a5314d2de1f9e295b283))
* **core:** rename token to tokenName, possible clash with auth token for algo ([46cfcf2](https://github.com/BitGo/BitGoJS/commit/46cfcf2564f4d1d350987bd1ce6dbdb947033802))
* **core:** rename verifyAddress and remove invalid implementations ([3d6d5d0](https://github.com/BitGo/BitGoJS/commit/3d6d5d07fcc4d228d39b7634e8f3349a6d623ded))
* **core:** repair replay protection input signing ([8c6b069](https://github.com/BitGo/BitGoJS/commit/8c6b069ddfcdc71a9fb8477ec95cd159cb2f8dc1))
* **core:** replace bitcoin-abc with ecash in blockchair apis ([c8e9c56](https://github.com/BitGo/BitGoJS/commit/c8e9c566310b9f31cc43380a42b283d801d15b3f))
* **core:** restore `async` on `explainTransaction` in `AbstractUtxoCoin` ([d8d7a0a](https://github.com/BitGo/BitGoJS/commit/d8d7a0af7f1d7c613bd02c3b8e63cc9b028bf96a))
* **core:** run tests against btg ([2805bd5](https://github.com/BitGo/BitGoJS/commit/2805bd56cfdba8ef33db66a2ba5e79c5ab1f91f4))
* **core:** send `derivedFromParentWithSeed` when generating wallet ([b81f31d](https://github.com/BitGo/BitGoJS/commit/b81f31d1c7629e8b2eb74c9117ff74e15aabb6df))
* **core:** sign multi-input p2tr script path txs ([885a91f](https://github.com/BitGo/BitGoJS/commit/885a91fe410dcff16e1f771cdc43ad78d2384691))
* **core:** stacks changed prv param type in StxSignTransactionOptions ([52138ea](https://github.com/BitGo/BitGoJS/commit/52138ead3ea1067706803c3fd6a7720e8cc8afbf))
* **core:** support eip-1559 and eip-155 in wrw ([e88b8e1](https://github.com/BitGo/BitGoJS/commit/e88b8e11a8f469be527a770972132aee5c9ec2a8))
* **core:** support password reset and enterprise with MPC ([2434ee6](https://github.com/BitGo/BitGoJS/commit/2434ee644b0c1c111dc6df32f5e061b61ca2bd50))
* **core:** token transactions does build correctly ([178d4e2](https://github.com/BitGo/BitGoJS/commit/178d4e219df22d42f31b9fcbad6d8f10181a17fa))
* **core:** transactionBuilder: ignore `walletSubPath === 'm'` ([5bbf8d1](https://github.com/BitGo/BitGoJS/commit/5bbf8d143a6e99ee2958ae764889ecd7f46ebdd8))
* **core:** transfer id is not stored to in mongodb in entries and coin specific ([17d44a6](https://github.com/BitGo/BitGoJS/commit/17d44a6ce192142608fcc41e4d5cc7e8c157c7b1))
* **core:** tss backup keychain output prv ([e7facc7](https://github.com/BitGo/BitGoJS/commit/e7facc792b7cfe8b36f71cc662d7504316fa88fd))
* **core:** update `vm2` by uninstalling/reinstalling `superagent-proxy` ([66f4ad3](https://github.com/BitGo/BitGoJS/commit/66f4ad3c8bcec0649cde34e724945f4076e431dd))
* **core:** update codeowners to remove previous staff ([67b3245](https://github.com/BitGo/BitGoJS/commit/67b3245de1e257f6841c9417bec988c33838fc27))
* **core:** update statics version to latest ([2f8bc0d](https://github.com/BitGo/BitGoJS/commit/2f8bc0db4743df8b1b97207d92a9b123239dcaa1))
* **core:** update yarn resolutions to temporarily resolve audit issues ([77feec3](https://github.com/BitGo/BitGoJS/commit/77feec3bcb71968f76e8b0ff7cbfc1ddc3b29d7a))
* **core:** use `@bitgo/blockapis@1.0.0-rc.0` ([7717447](https://github.com/BitGo/BitGoJS/commit/7717447a6598840d7dacbefb070d62f4d0736154))
* **core:** use `buildIncomplete()` in utxo recovery ([60e99c9](https://github.com/BitGo/BitGoJS/commit/60e99c9d74941d8332ae67cca6530967bd058007))
* **core:** use `derivedFromParentWithSeed` from user keychain if present ([c55800e](https://github.com/BitGo/BitGoJS/commit/c55800e49b63da365a77ec22136fe53e1a229352))
* **core:** use AbstractUtxoCoin type in btc tests ([956fef1](https://github.com/BitGo/BitGoJS/commit/956fef11ba024ed40f5ce5e5caaf73d37c6dd9db))
* **core:** use hashForSignatureByNetwork in core ([3b210f0](https://github.com/BitGo/BitGoJS/commit/3b210f0fc44a2e4eb85627a7b5d9e9054b553db2))
* **core:** use ltc explorer to get unspents during cross chain recovery ([4c5d19f](https://github.com/BitGo/BitGoJS/commit/4c5d19f8e349adcde42bfd1272f54c4dc683e749))
* **core:** use mempool.space instead of earn.com for recovery fee ([5338f4e](https://github.com/BitGo/BitGoJS/commit/5338f4efda4b6b7705d9c1fb0d1a6914606b7314)), closes [#1126](https://github.com/BitGo/BitGoJS/issues/1126)
* **core:** use signAndVerifyWalletTransaction ([3811b42](https://github.com/BitGo/BitGoJS/commit/3811b42a6866fe3e3f89b314a2287bc80a0bd408))
* **core:** use wallet keys in explainTransaction ([2c3b494](https://github.com/BitGo/BitGoJS/commit/2c3b494792ae52e4e2f61c0ba0f59cab955ce2e7))
* correctly regenerate .drone.yml ([eaf6aaa](https://github.com/BitGo/BitGoJS/commit/eaf6aaa67c5293a2e2083cc224172c6eacd9fab5))
* do not not strip out null values from the stx transaction memo field ([e028517](https://github.com/BitGo/BitGoJS/commit/e0285172522aff9fd7b5b618b31b716c4d84bfbf))
* don't run unit tests on node 8 ([7fa7510](https://github.com/BitGo/BitGoJS/commit/7fa7510bf2107e540d2e2975b5ea0578717509b5))
* enable TEST token for testnet ofc ([bfe12c6](https://github.com/BitGo/BitGoJS/commit/bfe12c670ab879c445103a2d62e7202b6d32aeef))
* **eos:** can accept addresses with memoId when making recovery ([8001e7e](https://github.com/BitGo/BitGoJS/commit/8001e7e592d48b0c0097384e7395838adde9e8b5))
* **eos:** fix deserialize transaction with OVC ([b4d8821](https://github.com/BitGo/BitGoJS/commit/b4d8821773e182560e206ffc48cde2d5e5d640b3))
* **eos:** fix incorrect explorerUrl for teos ([3a5914d](https://github.com/BitGo/BitGoJS/commit/3a5914dab2427c9924c8b332c4189a98d10a4dbd))
* **eos:** fix issue verifying EOS transactions ([79dd073](https://github.com/BitGo/BitGoJS/commit/79dd0736c999bbeeaa663f3054769ff86c1f1ca7))
* **eos:** moved eos fixures to the currect directory ([e64aed4](https://github.com/BitGo/BitGoJS/commit/e64aed4c70586f98808c67477c4c0603c47351ca))
* **eos:** removed unnecessary assertions in eos unit test cases ([205c695](https://github.com/BitGo/BitGoJS/commit/205c695df5d5517851151293aedb7baa2acc6176))
* **eos:** sinon sandbox restored after use in test case ([6cfef71](https://github.com/BitGo/BitGoJS/commit/6cfef71c4fdb5fc9da5699059c74ef7dc187489f))
* **eth-lhf:** set default hf to lhf if lhf params present ([06a9f7b](https://github.com/BitGo/BitGoJS/commit/06a9f7b03798df4a957a28cf23174929fbdc2f35))
* **eth2:** fix eth2 lib initialization and key signatures ([d171404](https://github.com/BitGo/BitGoJS/commit/d1714044bef8afe3f8b9166dc49f28ef3451bda8))
* **eth:** goerli coins now set to gteth in core/src/config.ts ([3ea10f6](https://github.com/BitGo/BitGoJS/commit/3ea10f64ca02d89db500904a9acc1c3511931e62))
* **ethlike:** add chainid to statics ([56a769e](https://github.com/BitGo/BitGoJS/commit/56a769e2fe9a9e7a1808d5a499941d42461d006e))
* **eth:** make replay protection optional ([061f2c6](https://github.com/BitGo/BitGoJS/commit/061f2c64f55eac31a162986ee2ac3df7da047978))
* **eth:** move gasLimit to base params ([6a1f108](https://github.com/BitGo/BitGoJS/commit/6a1f10867e87db853cad38ba62fdc9ca26bff946))
* **eth:** restore fixed hop transaction verification ([7b2420a](https://github.com/BitGo/BitGoJS/commit/7b2420aaf6fd684fe8847c27c7cd1aa5882fb8db))
* **eth:** update tx with signature in recover ([3fa3de4](https://github.com/BitGo/BitGoJS/commit/3fa3de43cc21618deda3be5183b2b21878367576))
* exclude ripple-address-codec 4.2 ([8178095](https://github.com/BitGo/BitGoJS/commit/8178095b9e672ea3df0f05f974083fac8f56a31f))
* **express:** add error logs in tx signing fns ([dc22bae](https://github.com/BitGo/BitGoJS/commit/dc22bae196b47a2a531e9bdc579046d9d6c62d17))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([0c835b8](https://github.com/BitGo/BitGoJS/commit/0c835b8d010c1cd3f843daf8dfeb6fc74d71c459))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([1b96bfe](https://github.com/BitGo/BitGoJS/commit/1b96bfec6c8ccc3f68ec253595dd07e523bd10ef))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([58ea46e](https://github.com/BitGo/BitGoJS/commit/58ea46ecafa13766be26e25ad8a8fbc8b06b1f9f))
* **express:** always prefer command line arguments to env var args ([b8aeee1](https://github.com/BitGo/BitGoJS/commit/b8aeee132658c0839ede81b1da6bf48609a12069))
* **express:** always use bitgo object http methods to proxy requests ([5153a96](https://github.com/BitGo/BitGoJS/commit/5153a9637725bac6b3c36888f21ca44e1ac21da6))
* **express:** build express outside TS Build systm ([4c59ff8](https://github.com/BitGo/BitGoJS/commit/4c59ff87a4a03f4a324d0a126e00dd19c5acf44d))
* **express:** correctly handle failed proxy calls ([d36bf9c](https://github.com/BitGo/BitGoJS/commit/d36bf9c30dc799e087e9b42a4fd30d9ebe407509))
* **express:** Deprecate older forms of environment variable config ([2c88e69](https://github.com/BitGo/BitGoJS/commit/2c88e69983acea4da9b09994f38d49c99a73548c))
* **express:** do not access `_promise` ([8cd097e](https://github.com/BitGo/BitGoJS/commit/8cd097e76cc4e3de8b8b769f39c3bbe9bb79f96e))
* **express:** don't store false when boolean flags are not given ([4194ae1](https://github.com/BitGo/BitGoJS/commit/4194ae17f91d1174f096aeb1a0a85819762b9ae8))
* **express:** don't use bluebird methods on native promise returning functions ([b5b3782](https://github.com/BitGo/BitGoJS/commit/b5b37822e8b0814ad63433e1580255416c645ec1))
* **express:** enable tezos consolidations route in express ([fdf2c8a](https://github.com/BitGo/BitGoJS/commit/fdf2c8a8a8c0503728825ebaa2b16f7a1e5fec70))
* **express:** lock to y18n@^4.0.3 ([044da56](https://github.com/BitGo/BitGoJS/commit/044da56c6832492a83af07af77c4001521b8271b))
* **express:** log bitgo-express and bitgojs versions on error ([f21178f](https://github.com/BitGo/BitGoJS/commit/f21178f8dc40a8d93895463823acbe5bd320ba5d))
* **express:** pass POST body for proxy requests ([f5113ea](https://github.com/BitGo/BitGoJS/commit/f5113ea07ecfaa265d18a48f32143d3045ac7e27))
* **express:** re-add `typescript` to express dev deps ([75c1601](https://github.com/BitGo/BitGoJS/commit/75c16011029a5de624363396a0047a3564ec85dd))
* **express:** remove gcompat, switch to alpine build container ([d4a9cca](https://github.com/BitGo/BitGoJS/commit/d4a9ccab1b3c6773c1d81503bd55c7376f40f8db))
* **express:** remove gcompat, switch to alpine build container ([969dd49](https://github.com/BitGo/BitGoJS/commit/969dd4913ad5f26c9e2b1a9e823412cce2c6c27f))
* **express:** run prettier on `test/integration/bitgoExpress` ([e105d3a](https://github.com/BitGo/BitGoJS/commit/e105d3aa0054f1ed7428fd1d935ff1eada8d9800))
* **express:** update lodash and ini to fix npm audit issues ([36c3d0b](https://github.com/BitGo/BitGoJS/commit/36c3d0b3a68d86772a6b1a872dde398ca53dec84))
* **express:** update to typescript 4.2.2 ([460e898](https://github.com/BitGo/BitGoJS/commit/460e898edc30205f6b5edfa100b818c20a7af58b))
* **express:** use gcompat instead of libc6-compat ([4636f8d](https://github.com/BitGo/BitGoJS/commit/4636f8df7dd0bfe15e8e736d8029b08f4a55d5c1))
* **express:** use gcompat instead of libc6-compat ([df5f84b](https://github.com/BitGo/BitGoJS/commit/df5f84bdc02a65c22097680d072553e079997fdc))
* **express:** use gcompat instead of libc6-compat ([e72b9b9](https://github.com/BitGo/BitGoJS/commit/e72b9b9b7b213ceb5aaf5bb985ba30a498280df4))
* **express:** use yarn to run build script ([e2b7cad](https://github.com/BitGo/BitGoJS/commit/e2b7cad4a8f8bf0273240d6a015839a97837c38e))
* **express:** use yarn to run commands installed at root ([4795b06](https://github.com/BitGo/BitGoJS/commit/4795b062c2f92d02053cfb931dbefc4daf579d00))
* **express:** use yarn to run commands installed at root ([3c2acef](https://github.com/BitGo/BitGoJS/commit/3c2acef7b72bfde1bfd6becfff4fb6d9349f0c02))
* fix 1inch in coins.ts ([ef338c9](https://github.com/BitGo/BitGoJS/commit/ef338c907f5ca78851ea0b39a7b97c34fd381d0e))
* fix build ([4a19ae6](https://github.com/BitGo/BitGoJS/commit/4a19ae67b003a39982551c9615a7a4ef217bc15b))
* fix EOS testnet fullnode URLs ([55cb375](https://github.com/BitGo/BitGoJS/commit/55cb37526bdf80c431392f8a1a6af9dad01d3be8))
* fix Etherscan Testnet URL ([f83b5cd](https://github.com/BitGo/BitGoJS/commit/f83b5cd742149f81d2a9a2074f22d8aa812a964c))
* fix failing unit test nocks ([c5fb6e3](https://github.com/BitGo/BitGoJS/commit/c5fb6e30fccb2799cda730504e18806576f01290))
* fix signing for Tezos ([290df65](https://github.com/BitGo/BitGoJS/commit/290df6525095a7f4e5cad6a634202197fa16c5c5))
* fix urijs vuln ([957c618](https://github.com/BitGo/BitGoJS/commit/957c6185f912cf74792cfcbc4e3bd20b14ab5de3))
* fix wei to gwei conversion ([89af10d](https://github.com/BitGo/BitGoJS/commit/89af10d710da3cf6e1b8fc4ffea593d386628b76))
* fixed consolidation and added express route ([81a4c6d](https://github.com/BitGo/BitGoJS/commit/81a4c6d1763feea6432bf7d564e41c8eb125eff9))
* force secure urls unless disabled ([3b9edd5](https://github.com/BitGo/BitGoJS/commit/3b9edd593016f82fa69a4fe740ea706fe1daeee7))
* getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
* **gterc-tokens:** add missing gterc tokens ([724406b](https://github.com/BitGo/BitGoJS/commit/724406b5113dc00246d839c13d623b64c47012c8))
* **gterc-tokens:** add missing gterc tokens ([27a86db](https://github.com/BitGo/BitGoJS/commit/27a86db9f5c6d2a3f93eea74f71c2b7a15e5523a))
* hard-code current ZEC consensus branch ID using updated utxo-lib ([93798ba](https://github.com/BitGo/BitGoJS/commit/93798ba3629dcfdb7440778c1dcb3c09ab578bae))
* **hbar-validateaddress:** add validation for hedera addresses fix case where hex address were valid ([eb7c1eb](https://github.com/BitGo/BitGoJS/commit/eb7c1eb02d973acfa97cfd613816b365ea29d567))
* **hbar:** add missing validateKeySignatures method ([870fc6e](https://github.com/BitGo/BitGoJS/commit/870fc6eb463f5c177a312163fac532ba5ceb5723))
* **hbar:** add new hashTx impl ([44498e3](https://github.com/BitGo/BitGoJS/commit/44498e37ee3a39a7537ce51ccbf61040e3ffd5bf))
* **hbar:** fix sign and verify for hex encoded hbar message ([c3ef546](https://github.com/BitGo/BitGoJS/commit/c3ef546b68dac87339f39197bf798c899d881bdf))
* **hbar:** fix sign and verify for hex encoded hbar message ([b82dae2](https://github.com/BitGo/BitGoJS/commit/b82dae2ec89bf55f5d891b9887069c5c66b07157))
* **hbar:** key validation ([113fa3c](https://github.com/BitGo/BitGoJS/commit/113fa3cbe0c5aa31acd6d93dbf22d9319a3749e4))
* **hbar:** modify validation for keys ([af57749](https://github.com/BitGo/BitGoJS/commit/af5774900d6bbc0a6a29020f11b68f532af2f12c))
* **hbar:** update test ([fadce41](https://github.com/BitGo/BitGoJS/commit/fadce418c188e895813d83c9a2ddb8009b458c74))
* improve Etherscan Error Handling ([4e90aed](https://github.com/BitGo/BitGoJS/commit/4e90aedbf489e4accc0a0b96b4d222722321023c))
* keyreg type changed to wallet init ([78beac5](https://github.com/BitGo/BitGoJS/commit/78beac58d2dfb0dd13c41a1e8e884fca19cbe20c))
* **ltc:** update block explorer link for ltc ([1a501da](https://github.com/BitGo/BitGoJS/commit/1a501da07df6796e7215c20800bcb865270b13a6))
* **lumina:** update full name for rbtc ([4bf0098](https://github.com/BitGo/BitGoJS/commit/4bf0098efd6e0ce5f2e9a70b680e64ec7b031235))
* **release:** upgrade lerna to 3.21.0 ([ae6ff7e](https://github.com/BitGo/BitGoJS/commit/ae6ff7eade463ee95fec03460f5a1a552740a9cb))
* remove `gitHead` from module package.jsons ([66e9809](https://github.com/BitGo/BitGoJS/commit/66e9809d6a36f03c8a334f9b8bbcfa82aca426b0))
* remove `gitHead` property from package.jsons ([e6b7fdd](https://github.com/BitGo/BitGoJS/commit/e6b7fdd4e4e16c4a07a9a7ad39cc70f08854486e))
* **remove logs:** remove logs ([f439bfa](https://github.com/BitGo/BitGoJS/commit/f439bfacbe6953b54f7492e4400e780d8d7769ac))
* remove non existing testnet OFC tokens and fix asset for TERC ([a70860e](https://github.com/BitGo/BitGoJS/commit/a70860e16fcdf831c589a38b6479657d7eea0344))
* remove ripple-lib due to node issues ([ecf34a4](https://github.com/BitGo/BitGoJS/commit/ecf34a4b2402799b77b641172832357a45b6a8aa))
* removing extra space ([261b87e](https://github.com/BitGo/BitGoJS/commit/261b87eb102d12b4e8b66683590bef29954a9bf5))
* replace sed with js function for replacing unsafe evals ([f8c089a](https://github.com/BitGo/BitGoJS/commit/f8c089ae10b8732565fbc8ed1a9209c7b7ac42ec))
* reset core package json back to master ([5ad8684](https://github.com/BitGo/BitGoJS/commit/5ad86846805b94eec3f125f33a8579286c3fc7d8))
* **root:** add package-lock.json to .gitignore ([754ef40](https://github.com/BitGo/BitGoJS/commit/754ef401fb6c9bfa1f5c5daa0d10cdce86a4de45))
* **root:** disable eslint `no-undef` rule for typescript files ([597e468](https://github.com/BitGo/BitGoJS/commit/597e4688a2bfbbdbf8ae6235c420cd35adf701ad))
* **root:** removed buffer library and fallback from webpack config for account-lib and core ([a5c9fec](https://github.com/BitGo/BitGoJS/commit/a5c9fecd17d0fedced34fad9434eb1f0f36bd0d5))
* **root:** resolve `axios` to `^0.21.2` ([04d63f9](https://github.com/BitGo/BitGoJS/commit/04d63f9bb1e8a74692b5d54668a79999abc23c64))
* **root:** resolve `follow-redirects` to version ^1.14.7 ([d81b77f](https://github.com/BitGo/BitGoJS/commit/d81b77f2b8184b18d63b6d504cd33592ee9c8b69))
* **root:** resolve `node-fetch` to version 2.6.7 ([da8e05b](https://github.com/BitGo/BitGoJS/commit/da8e05bfee6c5fc1d3e29166a1f85ecafb704fd3))
* **root:** update `@celo/contractkit` deps to fix audit issues ([fba7595](https://github.com/BitGo/BitGoJS/commit/fba7595cb3c5bed76294cb9fae6241ab497e72a5))
* **root:** update lerna deps to fix audit issues ([08315ba](https://github.com/BitGo/BitGoJS/commit/08315baec81cef7098d645183ba742ae2b93c395))
* **sdk:** add avaxc family ([85d945d](https://github.com/BitGo/BitGoJS/commit/85d945d252f3446de50204c77e3110ef81847abe))
* **SERV-593:** Correctly handle undefined boolean config items ([770d7c1](https://github.com/BitGo/BitGoJS/commit/770d7c1e22e502a3e5de00085aeab7285c99a1c9)), closes [#599](https://github.com/BitGo/BitGoJS/issues/599)
* **SERV-597:** Ensure `Error.captureStackTrace` is defined before call ([fe35e3e](https://github.com/BitGo/BitGoJS/commit/fe35e3e0fd2b487d96c50c9a64a0890942192814))
* **sol:** fix deserializing signed sol transaction ([1da611a](https://github.com/BitGo/BitGoJS/commit/1da611ac9f830ed4303d4425a0391c4bc13c9f8c))
* **sol:** get signature data from a Sol transaction ([5249a6e](https://github.com/BitGo/BitGoJS/commit/5249a6e5da74ceb43a2b47ca439495d62c280f07))
* **statics:** add unique token types to goerli testnet tokens ([306df63](https://github.com/BitGo/BitGoJS/commit/306df6341767b4b58031fce2aca9057b10400d94))
* **statics:** adding ofcmcdai, ofcaxsv2, ofclrcv2, and ofcxsushi ([d472e9d](https://github.com/BitGo/BitGoJS/commit/d472e9d63e3cddf7cd416f606c60426013e0d109))
* **statics:** apply prettier to full project ([9ae3e15](https://github.com/BitGo/BitGoJS/commit/9ae3e157a84afebe495bab105fac6fbcfee2b0ee))
* **statics:** avaxc token name to lower case ([de49cb3](https://github.com/BitGo/BitGoJS/commit/de49cb30be27dad05e958e7a7eceacd6ec2e0c33))
* **statics:** change Goerli ETH underlying asset from ETH to GTETH ([7fafd32](https://github.com/BitGo/BitGoJS/commit/7fafd3281a00c5596cf506a1476e96f2df7db6d7))
* **statics:** delete invalid testnet URL ([77ae3ab](https://github.com/BitGo/BitGoJS/commit/77ae3ab434fcc05c16b44126ad46833cd6053533))
* **statics:** ensure UnderlyingAssets values are unique ([d297246](https://github.com/BitGo/BitGoJS/commit/d2972468cf90c0166a2ae3dd49e58da20dac1f1a))
* **statics:** fix BitcoinGoldTestnet derivation ([dfd097c](https://github.com/BitGo/BitGoJS/commit/dfd097c76ac2f1983af9bb02f6b15cb9d491b9ee))
* **statics:** fix etc statics ([4970253](https://github.com/BitGo/BitGoJS/commit/497025350595716c21d77bf5e1c420abc3bc6851))
* **statics:** fix GDT contract ([12e8258](https://github.com/BitGo/BitGoJS/commit/12e8258428b371657c33794c4651f5a4d617f1a4))
* **statics:** fix import/exports ([29d02b9](https://github.com/BitGo/BitGoJS/commit/29d02b9a5f97f1a78bce2313c5e95dc07240a3db))
* **statics:** fix precision for ofcterc ([75e465a](https://github.com/BitGo/BitGoJS/commit/75e465ac812ea0d59b2f05af9059debdb8a472ba))
* **statics:** fix send many memo contract address for prod ([3a1396d](https://github.com/BitGo/BitGoJS/commit/3a1396d17a15737bbc57a9f7803fe7fc2b47e6c5))
* **statics:** fix Solana transactions explorers ([c1f4e62](https://github.com/BitGo/BitGoJS/commit/c1f4e62e683e932af21b7238777c73a6fc7ef2d2))
* **statics:** fix stx explorer url ([cfa4998](https://github.com/BitGo/BitGoJS/commit/cfa499829f41ee791d5a0f7cc79bae801fdc1b73))
* **statics:** fix typo on testnet casper coin ([86488dd](https://github.com/BitGo/BitGoJS/commit/86488ddcc139eca3945d15c639ea9e63b9b5965e))
* **statics:** inherit BitcoinTestnet from Testnet ([246135c](https://github.com/BitGo/BitGoJS/commit/246135c4a4b78c9092cee8d08d5a79b8bf737a75))
* **statics:** remove duplicate tokens ([35e445a](https://github.com/BitGo/BitGoJS/commit/35e445aa92a56e0c14dbdb72b987d9a07c1e6d96))
* **statics:** remove invalid BIP32 constants ([e1d66ba](https://github.com/BitGo/BitGoJS/commit/e1d66ba4a8992e72279c5581591f5885bf6e5540)), closes [/github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp#L142-L143](https://github.com//github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp/issues/L142-L143) [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L306-L309](https://github.com//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L306-L309)
* **statics:** remove invalid wif constants ([3b633a9](https://github.com/BitGo/BitGoJS/commit/3b633a9e0c52ca17078bfe8a5440a84980fd0261)), closes [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L486-L487](https://github.com//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L486-L487) [/github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp#L248](https://github.com//github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp/issues/L248)
* **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))
* **statics:** update CODEOWNERS ([02b03fe](https://github.com/BitGo/BitGoJS/commit/02b03fe4549cc176731357f328301a9b88ff6c0f))
* **statics:** update deprecated explorer url ([391219a](https://github.com/BitGo/BitGoJS/commit/391219a37806d08ae56b52a84d2c3e69938140cb))
* **statics:** update deprecated explorer url for BCH ([1bfaf3a](https://github.com/BitGo/BitGoJS/commit/1bfaf3a950a3c7c2dc342146b174629bc8bf420c))
* **statics:** update zcash explorer url ([6bfb111](https://github.com/BitGo/BitGoJS/commit/6bfb1117deaaaefe32faf07cdef88cfd869ac16d))
* **statics:** use `utxolibName` instead of redefining constants ([b54c30a](https://github.com/BitGo/BitGoJS/commit/b54c30ae8e88dfe9701237a3316edf5f6c71483c))
* **stx-core:** parse stx transactions ([5ad70c8](https://github.com/BitGo/BitGoJS/commit/5ad70c854e1b37231abd106169f01eef36f6f351))
* **stx:** resolves toJSON for stx ([4b66b78](https://github.com/BitGo/BitGoJS/commit/4b66b78fa69eef4e55377fd64f439343a804edc8))
* **tdash:** fix incorrect explorerUrl for tdash ([e84b9db](https://github.com/BitGo/BitGoJS/commit/e84b9db96f5db161f5dd2ccac5109a05c34c1eda))
* temporarily remove AVAXC from failing SDK test for Secp256k1 coins ([a602eaa](https://github.com/BitGo/BitGoJS/commit/a602eaa8fd6c0b0f66c070b4e26091bfc32780dc))
* **test:** remove illegal use of `bufferutils` ([4bb33a1](https://github.com/BitGo/BitGoJS/commit/4bb33a19e28f7351b0040fb2eee8ac898a7e3e8c)), closes [/github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f#diff-73e64645f9c04dc17e67b782cb9342](https://github.com//github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f/issues/diff-73e64645f9c04dc17e67b782cb9342)
* **teth:** add terc tokens with 2,6,18 decimals ([3be4597](https://github.com/BitGo/BitGoJS/commit/3be4597e18fe3fa21eb123160e1528d3630e0be9))
* **teth:** add terc tokens with 2,6,18 decimals ([846f758](https://github.com/BitGo/BitGoJS/commit/846f758aff7cb03a68c25ed93af112f83538bed7))
* **tltc:** update block explorer link for tltc ([7323ccf](https://github.com/BitGo/BitGoJS/commit/7323ccf8aa2e0a2ced76f5218db20b25bd0658fb))
* **trx:** asign trx builder acording to each transaction type ([3454ee1](https://github.com/BitGo/BitGoJS/commit/3454ee1f4d5f187d48fa4c4aeef5a9327d89e6ec))
* **unspents:** add `readonly` modifier to Dimensions fields ([4cc973e](https://github.com/BitGo/BitGoJS/commit/4cc973e345b63cdde57c0bef4a53c0a02de6e625))
* **unspents:** fix nInputs ([e5e54e7](https://github.com/BitGo/BitGoJS/commit/e5e54e796995254d479f39e044635169547ad69b))
* **unspents:** fix package.json ([7edf5fe](https://github.com/BitGo/BitGoJS/commit/7edf5fe71f9b844947378e154ea5ba48b70806ed))
* **unspents:** use latest rc as version instead of 2.3.0 ([b0ae190](https://github.com/BitGo/BitGoJS/commit/b0ae190b955ab25b7c33236f7f81861008b8f4df))
* update dot to address breaking changes in 7.15.1 ([a949618](https://github.com/BitGo/BitGoJS/commit/a949618de00b944b2d9729485f6b9ac4e6fced3f))
* update freeze request to include sending params ([2b61a2a](https://github.com/BitGo/BitGoJS/commit/2b61a2a5869c5dc985eafb2368ea51bc233d54fe))
* update package-lock.json and clientRoutes ([a3433ea](https://github.com/BitGo/BitGoJS/commit/a3433ea0e86af35a26ae24bcb2e3f9c7adede91f))
* update package-lock.json and clientRoutes ([9ed9bb4](https://github.com/BitGo/BitGoJS/commit/9ed9bb44727611cf3d9b67284b1d7dd6ec10772f))
* update test for ZEC ([e17eea0](https://github.com/BitGo/BitGoJS/commit/e17eea0eeeca90909783e92fef021b364ee66283))
* update utxo-lib to published version 1.7.3 ([1798510](https://github.com/BitGo/BitGoJS/commit/1798510690766438e4faa30bbb0c3f4188d99e91))
* update ZEC consensusBranchId for Caopy hardfork ~Nov 18 2020 ([574a7c7](https://github.com/BitGo/BitGoJS/commit/574a7c77accc8182f30e7385859e57ed82864538))
* use correct kovan testnet explorer urls ([e86723c](https://github.com/BitGo/BitGoJS/commit/e86723c46a22d2790bad7b43d8e6bc5feaa700ee))
* **utxo-lib:** always verify ECDSA in strict mode ([4fcaf53](https://github.com/BitGo/BitGoJS/commit/4fcaf53f18f74a68f37a0513a549fea1c5c1ffb8)), closes [/github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts#L215](https://github.com//github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts/issues/L215) [/github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts#L1212](https://github.com//github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts/issues/L1212)
* **utxo-lib:** default to `version: 2` for BTG transactions ([c4047ed](https://github.com/BitGo/BitGoJS/commit/c4047ed24a80904f39f2d598ba6b67722ce8de7b))
* **utxo-lib:** do not throw on unsigned inputs ([69dddb6](https://github.com/BitGo/BitGoJS/commit/69dddb6ae077c6093d048fe91b0521e74ab5055e))
* **utxo-lib:** eslint fix ([a17d3c0](https://github.com/BitGo/BitGoJS/commit/a17d3c09aef4124edb4541dc03cd316e0826f6ac))
* **utxo-lib:** fix `addForkId` evaluation ([2d5f7e6](https://github.com/BitGo/BitGoJS/commit/2d5f7e6bf7592447cd6ca35ad320202343595227))
* **utxo-lib:** fix fixture generation for bitcoingold ([b3067ec](https://github.com/BitGo/BitGoJS/commit/b3067ec02f40489f3c99989e3a507e28775bb7dd))
* **utxo-lib:** fix imports in test ([204e404](https://github.com/BitGo/BitGoJS/commit/204e4044b5a487c3a687f2514e148f5cb318b3c7))
* **utxo-lib:** fix missing word in local rpc parse test ([7336ee2](https://github.com/BitGo/BitGoJS/commit/7336ee22200fe8c0e9f0144fadb571cfa7b1836e))
* **utxo-lib:** fix setConsensusBranchId ([4efa636](https://github.com/BitGo/BitGoJS/commit/4efa63670ae4e1bf17895b85c8559df33ac319ab))
* **utxo-lib:** fix sighash for dash transactions ([c171435](https://github.com/BitGo/BitGoJS/commit/c1714357eab3f8fc961e75ad0af8e49f967e801b))
* **utxo-lib:** improve ParsedSignatureScriptTaproot ([b809bb2](https://github.com/BitGo/BitGoJS/commit/b809bb2779a2e498fd0ba76437a198ad20ec1536))
* **utxo-lib:** increase test coverage for signature.ts ([49a1a48](https://github.com/BitGo/BitGoJS/commit/49a1a4805f7c69ee873243525fba4b9037f890fc))
* **utxo-lib:** make compatible with node 10, 12 ([dd8d8f9](https://github.com/BitGo/BitGoJS/commit/dd8d8f9a903c46549742512c30f5ce540b1c1e75))
* **utxo-lib:** pass 0 offset to `readUInt16BE` for zcash `fromBase58Check` ([ff99d32](https://github.com/BitGo/BitGoJS/commit/ff99d32110f23dfe2f1f41b9942f33ccc39deaac))
* **utxo-lib:** pass buffer to `hash256` ([602936a](https://github.com/BitGo/BitGoJS/commit/602936adfed547edd6254c915a9500e80c943bda))
* **utxo-lib:** remove debugger ([ac6e7ed](https://github.com/BitGo/BitGoJS/commit/ac6e7edbd8f28fc6afae7bc28dae2f2754d3e0d6))
* **utxo-lib:** remove trailing comma ([67dac1d](https://github.com/BitGo/BitGoJS/commit/67dac1d9e3d47352eab46b1ceccb203a7024718d))
* **utxo-lib:** respond to comments ([a2a5808](https://github.com/BitGo/BitGoJS/commit/a2a580815c2c8fa76822a8255b9cdd8028c8db77))
* **utxo-lib:** update mocha and test `.ts` files ([fb0e7d0](https://github.com/BitGo/BitGoJS/commit/fb0e7d0b4aed2e72a8b269f93c8c7ed8f0367ed0))
* **utxo-lib:** use different bitcoinjs-lib specifier ([a629eec](https://github.com/BitGo/BitGoJS/commit/a629eec182910e41e339bfebfa6faecffac01305))
* **utxo-lib:** use NU5_BRANCH_ID when parsing zcashTest v4 ([ae2ded6](https://github.com/BitGo/BitGoJS/commit/ae2ded6d35f807409eacd575b8b91f6451cdfdc8))
* **utxo-lib:** use OP_CHECKSIG for 2nd p2tr opcode ([a5fdf02](https://github.com/BitGo/BitGoJS/commit/a5fdf02795fcde78d85e94f51f9ac92db620aa67))
* **utxo-lib:** write `version` as `Int32` ([d3e337a](https://github.com/BitGo/BitGoJS/commit/d3e337ab997c81a2c2c4c1a7ee678777a571f89a))
* **utxolib:** use `debug` package ([68113bb](https://github.com/BitGo/BitGoJS/commit/68113bbd64411c71fa1c274eb8ff6d0ff1757d1d))
* **utxolib:** use path package for path operations ([75f6fab](https://github.com/BitGo/BitGoJS/commit/75f6fab78ee3d1d0493be407e4c05257712dfddd))
* v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))
* wait a second between 2 subsequent API calls ([62ec37d](https://github.com/BitGo/BitGoJS/commit/62ec37daba171cfc3bb5c97c19b58bb6d3e230c6))
* **wallet-platform:** whitelist messageKey param ([081e486](https://github.com/BitGo/BitGoJS/commit/081e486cc9b64cc3ba568bce6aec675f5f2e3ea6))
* whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))
* **wp:** split mocha test from outputScripts impl ([01053c9](https://github.com/BitGo/BitGoJS/commit/01053c9a5f754b884c665e485d613d964055053a))
* **wrw recoveries:** enable unsigned sweeps for recovery of erc20 tokens ([0c108eb](https://github.com/BitGo/BitGoJS/commit/0c108eb7f26fd6a0d22ee7d3bbe743c8f8cf4c35))
* **xrp:** fix incorrect explorerUrl for txrp ([67f9fbf](https://github.com/BitGo/BitGoJS/commit/67f9fbf16476dbd5f59014647ee47d16c56f4064))
* **xrp:** incorrect types for ledgerSequenceDelta ([03c2860](https://github.com/BitGo/BitGoJS/commit/03c28605c4d5a141203e9d247200778ddb19899c))


### Code Refactoring

* **account-lib:** refactor builder to be consistent with other coins builders ([cbdc721](https://github.com/BitGo/BitGoJS/commit/cbdc721ebbb81752071f8731db4d11afc47539fa))
* **core:** remove bluebird from bitgo object http methods ([be6c9b6](https://github.com/BitGo/BitGoJS/commit/be6c9b6f0436dd8aa2c0a5710cbfcb419dde746a))
* **utxo-lib:** improve `network` exports ([d1d6091](https://github.com/BitGo/BitGoJS/commit/d1d6091186800fa8aad0c906101ad266ebebe3ce))


* refactor(core)!: add, use signAndVerifyWalletTransaction for utxo ([1070021](https://github.com/BitGo/BitGoJS/commit/1070021e38720824e0564dc729f25e273f3ea754))


### Features

* **account lib:** add new fee model to transaction builder ([6ae88c0](https://github.com/BitGo/BitGoJS/commit/6ae88c057565f23e5c4aca39d7e01bf58aa4fa0a))
* **account lib:** adding multisigAddress ([547518c](https://github.com/BitGo/BitGoJS/commit/547518cbdecdbec4c1a368052e274e8f288f41d0))
* **account lib:** get trx fee limit from statics ([55f43b1](https://github.com/BitGo/BitGoJS/commit/55f43b1547f7f30fb2c5dd26587745b07b9694e6))
* **account lib:** implemented happy path for transfer transaction ([61f3bd5](https://github.com/BitGo/BitGoJS/commit/61f3bd5124ac7d2532726ec07975e5f6f545566e))
* **account lib:** stlx-657 implemented wallet initialization builder ([b6e5a02](https://github.com/BitGo/BitGoJS/commit/b6e5a0215137e63b30bd75206651094b1cc8fe6a))
* **account-lib and core:** fix commets  and refactor ([d1f6859](https://github.com/BitGo/BitGoJS/commit/d1f6859ee81d2997bb11810405b577f33729c5e4))
* **account-lib:** add algo transaction ([5d180bc](https://github.com/BitGo/BitGoJS/commit/5d180bcec8aaaac459a3257d31bacae7b73b40c3))
* **account-lib:** add algo transfer builder ([89f238a](https://github.com/BitGo/BitGoJS/commit/89f238a39271674173f57e7b5feedd56b3acf7cf))
* **account-lib:** add algo txn validation methods to txn builder ([b43b8b2](https://github.com/BitGo/BitGoJS/commit/b43b8b2c7b76ab30b48cec5f7768beb7001e8ed0))
* **account-lib:** add anonymous proxy txn builder STLX-11137 ([692c062](https://github.com/BitGo/BitGoJS/commit/692c062beb5b8e9df856c1f1cba3829f073b1641))
* **account-lib:** add asset transfer builder implementation ([8919ce5](https://github.com/BitGo/BitGoJS/commit/8919ce50d0b91c0b6073c0b9abe17a90d3f32700))
* **account-lib:** add AvaxWalletSimple.sol ABI to walletUtil.ts ([28e5007](https://github.com/BitGo/BitGoJS/commit/28e50073061222627795e4dfdcd6a9351919ffcf))
* **account-lib:** add batch txn builder for DOT ([c259b9d](https://github.com/BitGo/BitGoJS/commit/c259b9d815da67c7e21cda59b53412417d27e3ee))
* **account-lib:** add claim for dot staking ([34ca211](https://github.com/BitGo/BitGoJS/commit/34ca2116304ed638871f9b294befcfecbeb1854d))
* **account-lib:** add close remainder to ([2c5694f](https://github.com/BitGo/BitGoJS/commit/2c5694ff275b2042697447ef44311fde9c21ddb6))
* **account-lib:** add deactivate builder ([eeab032](https://github.com/BitGo/BitGoJS/commit/eeab03288a6fd35f4db7f9627f85bfd696e32680))
* **account-lib:** add DelegateBuilder and UndelegateBuilder ([6b7a083](https://github.com/BitGo/BitGoJS/commit/6b7a083818e51c5530ad4bc65bf08c22d83cea83))
* **account-lib:** add deposit and stake builder for near ([10d6d1e](https://github.com/BitGo/BitGoJS/commit/10d6d1e0c63d01e192e8ea4979bf8386736eaee8))
* **account-lib:** add encodeAddress in account-lib and unit test ([90ae1ab](https://github.com/BitGo/BitGoJS/commit/90ae1ab9225955812d1b468bd16d3158fc794c63))
* **account-lib:** add estimate size ([b9f6752](https://github.com/BitGo/BitGoJS/commit/b9f67525eccf67d37de8ae5eed456342737a3ff1))
* **account-lib:** add explain transaction for Near ([adfa88b](https://github.com/BitGo/BitGoJS/commit/adfa88b46a1312c9c9f02cff650f761e27da37b6))
* **account-lib:** add from publicKey in stx contract buidler ([5e78a9d](https://github.com/BitGo/BitGoJS/commit/5e78a9df615d8a04a01f7cebc9d34954d2838b88))
* **account-lib:** add fromPubKey in stx transactionBuilder ([ff7a534](https://github.com/BitGo/BitGoJS/commit/ff7a534e5b5e59b8fb31c52f4159f025fe6a7903))
* **account-lib:** add function to remove prefix from signature algorithm ([958003a](https://github.com/BitGo/BitGoJS/commit/958003aa58ce9ac7c38c6fe673967ac0ad0e1e72))
* **account-lib:** add functions to validate and pad transactions memos for STX ([b8a8a85](https://github.com/BitGo/BitGoJS/commit/b8a8a8518023a7529f25361706c7d1f97c662383))
* **account-lib:** add genesisID and genesisHash to toJson() ([ea54d43](https://github.com/BitGo/BitGoJS/commit/ea54d4330df09e21d90e1480c30ff3a449db6d93))
* **account-lib:** add getSTXAddressFromPubKeys -- generate an address for multisig transactions ([b58d55e](https://github.com/BitGo/BitGoJS/commit/b58d55eea84055d9a5781f674afcfc398b38185b))
* **account-lib:** add getTxHash to dot utils ([3798123](https://github.com/BitGo/BitGoJS/commit/379812358f523227627dd45b657b3dc0eb7067af))
* **account-lib:** add implementation methods to txn builder ([102db02](https://github.com/BitGo/BitGoJS/commit/102db02a30cd4e74b061a91dd89e711519712810))
* **account-lib:** add key factory for coins ([82be006](https://github.com/BitGo/BitGoJS/commit/82be006dde732cfba53f72aa46c6350d53b80e14))
* **account-lib:** add keyreg builder ([f055d2d](https://github.com/BitGo/BitGoJS/commit/f055d2d928009a36edebb8c0fce53e3e998bbe62))
* **account-lib:** add latest version of algo-sdk ([871641c](https://github.com/BitGo/BitGoJS/commit/871641cd590f16d953b125c7a2d1bb377baac108))
* **account-lib:** add method to retrieve algosdk suggested params ([fde7c33](https://github.com/BitGo/BitGoJS/commit/fde7c33856c7d1388d778ba230aa9f170afd4b6a))
* **account-lib:** add NEAR keypair ([8586b10](https://github.com/BitGo/BitGoJS/commit/8586b10f51147f2c9862614ec8eff9d95163a73b))
* **account-lib:** add NEAR transaction builder ([3badcbd](https://github.com/BitGo/BitGoJS/commit/3badcbdb974a62c26aa96a10d627aea27a5d7123))
* **account-lib:** add NEAR tss signing ([d8ee226](https://github.com/BitGo/BitGoJS/commit/d8ee226f2aad5e75328e0f0c8836282c993d054b))
* **account-lib:** add NEAR util ([9bbbb08](https://github.com/BitGo/BitGoJS/commit/9bbbb08595d433106a40733a04dc0d2c83d7a603))
* **account-lib:** add number of signers setter to algo ([d12a089](https://github.com/BitGo/BitGoJS/commit/d12a0898de2057eeacfa0ae47dbf48159426cd51))
* **account-lib:** add pub key validation and address validation for CSPR ([d4ec859](https://github.com/BitGo/BitGoJS/commit/d4ec8594d865640dcef677ca5b9d7564f0964073))
* **account-lib:** add send-many in Account-Lib ([974a43e](https://github.com/BitGo/BitGoJS/commit/974a43e2ecd3783a06c2ee00e06928d7cfb6f6cb))
* **account-lib:** add setters for algo txn builder ([07ff195](https://github.com/BitGo/BitGoJS/commit/07ff195843c35862a86bdbd358a24c6039595053))
* **account-lib:** add signers check on account lib and add unit test ([44d68b6](https://github.com/BitGo/BitGoJS/commit/44d68b6aa5789ae2f0d586a5e76b981d5797a120))
* **account-lib:** add signMessage method ([1b16350](https://github.com/BitGo/BitGoJS/commit/1b16350ad7e4204cfec9f133a75eb74f88b6570d))
* **account-lib:** add skeleton for solana ([660d244](https://github.com/BitGo/BitGoJS/commit/660d24472d73ab30f2e40006692319ab774578df))
* **account-lib:** add skeleton implementation for Algorand ([9ad5c60](https://github.com/BitGo/BitGoJS/commit/9ad5c60fd246e3d7dca0058d05f61ec0dce989f5))
* **account-lib:** add solana tokens STLX-11959 ([1902efb](https://github.com/BitGo/BitGoJS/commit/1902efbf3dcee72879d0bec2676a97961caba24d))
* **account-lib:** add solana util functions for use in wp, refactor ([460adfa](https://github.com/BitGo/BitGoJS/commit/460adfa7576712d9eab184bbd7e55f8c19e41131))
* **account-lib:** add stacks coin keypair + utils implementation ([97d413a](https://github.com/BitGo/BitGoJS/commit/97d413a2719296855558cccdf6ff44740dd860ad))
* **account-lib:** add stacks smart contracts ([8ea73c9](https://github.com/BitGo/BitGoJS/commit/8ea73c9db315c36ac6a531e3db131bffef2b1b91))
* **account-lib:** add staking activate builder ([b23e5c3](https://github.com/BitGo/BitGoJS/commit/b23e5c3c7e4900173bbecb02e56ebf61a7a11fb9))
* **account-lib:** add staking deactivate builder ([35bb996](https://github.com/BitGo/BitGoJS/commit/35bb9965513a87b63ca89c0e3d05298230248079))
* **account-lib:** add staking withdraw builder ([34c7a75](https://github.com/BitGo/BitGoJS/commit/34c7a75a6755480c2a62606562002f645f90c65f))
* **account-lib:** add stateproofkey param ([46111c9](https://github.com/BitGo/BitGoJS/commit/46111c90df78b735d1c1d8da391857975c5bf6f5))
* **account-lib:** add stx coin (blockstack) and supporting utils ([a65b3eb](https://github.com/BitGo/BitGoJS/commit/a65b3eb47d60a5fd326dab1c75a0e736d94e12bc))
* **account-lib:** add stx to account-lib's coinBuilderMap ([2b9bffc](https://github.com/BitGo/BitGoJS/commit/2b9bffc07907e066ea1e22d46a5c02655a17c634))
* **account-lib:** add support for "memoId" field for STX addresses ([dd712e0](https://github.com/BitGo/BitGoJS/commit/dd712e03a22d27c30848634859eaa5508310800b))
* **account-lib:** add support for algo flat fees ([d7d0029](https://github.com/BitGo/BitGoJS/commit/d7d00294ccebb147c89152a3a0ba23ffe5122662))
* **account-lib:** add support for decoding signed algo txns ([bcc4929](https://github.com/BitGo/BitGoJS/commit/bcc4929fe7f76a01d614a83a94b7744faafca889))
* **account-lib:** add support for generating stx keypairs using extended public/private keys ([21f38cb](https://github.com/BitGo/BitGoJS/commit/21f38cb897497c38b4a64082749aafa47d60126f))
* **account-lib:** add support for offline kr txn ([4fad380](https://github.com/BitGo/BitGoJS/commit/4fad380967effc80deb650626519d30b05933e0e))
* **account-lib:** add test unit getTrasactionByteSize ([a6a3062](https://github.com/BitGo/BitGoJS/commit/a6a3062c6cb406bf7c178fafe2d5607ea797ed23))
* **account-lib:** add transaction type argument ([3c112ed](https://github.com/BitGo/BitGoJS/commit/3c112ed9f5f16af799bfc57291fa252c375982fb))
* **account-lib:** add transactionSize() to stx, for fee calculation ([9118362](https://github.com/BitGo/BitGoJS/commit/91183621307383192e8ebb359f1519e1e91ed5d1))
* **account-lib:** add unit test for avaxToken ([699d542](https://github.com/BitGo/BitGoJS/commit/699d542307cc61e2bc522842868ecee99bad0e40))
* **account-lib:** add unit tests related to extended keys support ([d4841d2](https://github.com/BitGo/BitGoJS/commit/d4841d284fb87a2a9dee07ad04f912df6bd37820))
* **account-lib:** add unnominate for dot staking ([8a1a5e2](https://github.com/BitGo/BitGoJS/commit/8a1a5e26ac453baedeeb44bbdd8ed47e9e7ab6a8))
* **account-lib:** add USDT USDC as testnet tokens ([f4d372b](https://github.com/BitGo/BitGoJS/commit/f4d372b3cdccc68aa9ce5e2c35b1cced127b6145))
* **account-lib:** add util factory for coins ([4233e2d](https://github.com/BitGo/BitGoJS/commit/4233e2d05dca961e79b907cb75af81e91c9bc1c9))
* **account-lib:** add utility function to convert algo pk to addr ([b1348dd](https://github.com/BitGo/BitGoJS/commit/b1348dde965f255cf07977bb008c7ccb12fbf4ac))
* **account-lib:** add utils to validate tx and block hash ([e59cb7c](https://github.com/BitGo/BitGoJS/commit/e59cb7c03f31eb9c1c7d5a3b35eab87972d324cc))
* **account-lib:** add validation for cspr address with transferId ([5a1ecd9](https://github.com/BitGo/BitGoJS/commit/5a1ecd95a0bb364fc6011dba369474d59ec728b8))
* **account-lib:** add validations for contract name, address and function ([42d51a9](https://github.com/BitGo/BitGoJS/commit/42d51a97f7758473ad1c7f7b0bbec01ff590628b))
* **account-lib:** add verifySignature Method ([260edfc](https://github.com/BitGo/BitGoJS/commit/260edfcb32db05fefb75b426662fd30ce0601a8d))
* **account-lib:** add verifySignature() for stx with test cases ([f9a8724](https://github.com/BitGo/BitGoJS/commit/f9a8724825f3e3b35b15dc77c8853fb5059aa368))
* **account-lib:** add withdraw staking builder ([6a4b9a5](https://github.com/BitGo/BitGoJS/commit/6a4b9a56cfdca3780f83addf077b2e152fc65385))
* **account-lib:** add withdrawUnstaked for dot ([984e412](https://github.com/BitGo/BitGoJS/commit/984e412f88eb6060182c144bf6fc2b8dee12899e))
* **account-lib:** added Algo encodeObj support on account lib ([e9a3e2e](https://github.com/BitGo/BitGoJS/commit/e9a3e2e7c20cd8a73b64ae8b603db750f6bfeb4f))
* **account-lib:** added UT over transaction ([4687e16](https://github.com/BitGo/BitGoJS/commit/4687e16083f7600a9fe3b5d62778b79a7542ce95))
* **account-lib:** adding NFT support to BitGo SDK ([39b7a4f](https://github.com/BitGo/BitGoJS/commit/39b7a4f6e4707a172cc506312f7930f8bc0a1603))
* **account-lib:** adding unit test for eth2 staking contract ([3fb5116](https://github.com/BitGo/BitGoJS/commit/3fb51166d3064ae806ffd75390a6328313d5278c))
* **account-lib:** addition of getTxId method for multisig txn ([ad22216](https://github.com/BitGo/BitGoJS/commit/ad222163171b3fd4fed5a20bc7fef8289cee1e69))
* **account-lib:** addition of getTxId method for multisig txn ([4240477](https://github.com/BitGo/BitGoJS/commit/4240477845c6404a7eee1ad477ade28674818bb8))
* **account-lib:** addition txType on account-lib ([8046424](https://github.com/BitGo/BitGoJS/commit/80464248402815413dacc2aa4095da72141c7fc3))
* **account-lib:** algo key dilution fix ([faebb5c](https://github.com/BitGo/BitGoJS/commit/faebb5c401a38be21d96f3736315ef852fe8e76d))
* **account-lib:** algo removal ([e8121d4](https://github.com/BitGo/BitGoJS/commit/e8121d4a08d1a2cd0b37c777da3e6f5d37e5c27d))
* **account-lib:** algo support for half sign tx ([e063c03](https://github.com/BitGo/BitGoJS/commit/e063c03ad4760d6f90a151ba29cdb65a83f89c19))
* **account-lib:** allow creating ETH Keypair from provided or random seed ([e96e4bb](https://github.com/BitGo/BitGoJS/commit/e96e4bb915a14b014efd04f873af4b75f1cf09c9))
* **account-lib:** allow dot key pair init with bs58 pub key ([d40ef28](https://github.com/BitGo/BitGoJS/commit/d40ef28af3edc77aaa61265512b07b61ee378065))
* **account-lib:** attempt webpack with ecma 6 ([37ace8c](https://github.com/BitGo/BitGoJS/commit/37ace8c0eb1b9c3920c296719e841a5c35634959))
* **account-lib:** avalanche C implement transactionBuilder, transferBuilder, tests ([dbac92b](https://github.com/BitGo/BitGoJS/commit/dbac92b442554984bf994456d63e247312341a67))
* **account-lib:** avax key pair support ([27c562f](https://github.com/BitGo/BitGoJS/commit/27c562fa1d557f50c7128308666987dab5c48231))
* **account-lib:** avaxc upgrade common fork to london ([9028b75](https://github.com/BitGo/BitGoJS/commit/9028b7543f9e8322598c2225eefc4dff7d5ea5dd))
* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** change NEAR transfer builder interface ([ac4bf46](https://github.com/BitGo/BitGoJS/commit/ac4bf4605e2cbae191c4cbac252b76a8a8c49bef))
* **account-lib:** create ataInitBuilder to initialize solana associated token account STLX-11958 ([e060add](https://github.com/BitGo/BitGoJS/commit/e060add6cb98e7950e56b6e1a0442b2a7fbe3dca))
* **account-lib:** determine how to use contract method IDs ([ecbcb8a](https://github.com/BitGo/BitGoJS/commit/ecbcb8a22065058d376bade7eed8ddf775805152))
* **account-lib:** dot explain transaction ([97a2f21](https://github.com/BitGo/BitGoJS/commit/97a2f21251f81ca2b9113ffabc2dd2ade7410ff4))
* **account-lib:** dot fee error fix ([1a91cae](https://github.com/BitGo/BitGoJS/commit/1a91caee176357e69d4dd5e14830a7402a7bf204))
* **account-lib:** dot final review fixes ([520ed78](https://github.com/BitGo/BitGoJS/commit/520ed78d0240469d754633d536c6ef5bab4b61e7))
* **account-lib:** dot optimization ([82dd145](https://github.com/BitGo/BitGoJS/commit/82dd1457793624e4c9ba1b880b5bfe4fdf19c740))
* **account-lib:** dot private key fix STLX-10448 ([08cc8f5](https://github.com/BitGo/BitGoJS/commit/08cc8f5e14fc5180f3d952e2b02dd6e685c288c0))
* **account-lib:** enable offline transaction building for algo ([95f6f95](https://github.com/BitGo/BitGoJS/commit/95f6f957511fc0572311039b4ce8c324cd3211c8))
* **account-lib:** export AddressVersion and AddressHashMode for STX ([8779deb](https://github.com/BitGo/BitGoJS/commit/8779deb6737183b67340cc8de3e0ed3e8ab82f24))
* **account-lib:** export AtaInitializationBuilder STLX-11958 ([c0ec45b](https://github.com/BitGo/BitGoJS/commit/c0ec45ba1690e44b28e7439e7bbe487b91dd6ac9))
* **account-lib:** export Solana builders and transaction ([597734f](https://github.com/BitGo/BitGoJS/commit/597734f364fe575f4cd361daaf2257551155ef54))
* **account-lib:** export token transfer builder STLX-11959 ([b757aa8](https://github.com/BitGo/BitGoJS/commit/b757aa89c6fd535740b732556df2ec53e281396e))
* **account-lib:** fix multisig signing issue ([e445dc4](https://github.com/BitGo/BitGoJS/commit/e445dc475bcd8486d2bfab9559123cb6898d63c6))
* **account-lib:** fixing coins.ts tsol mint addresses STLX-11959 ([f973924](https://github.com/BitGo/BitGoJS/commit/f973924eb29a53570de67861f44d270cdf35a1cd))
* **account-lib:** from implementation for transfer builder ([d9c85f5](https://github.com/BitGo/BitGoJS/commit/d9c85f534ddb6d0891724d975279bff244a11060))
* **account-lib:** implement a field for transaction material ([42fd74c](https://github.com/BitGo/BitGoJS/commit/42fd74c709e0e726cfc75b38707a08a5483532af))
* **account-lib:** implement add signature for sol ([451e58a](https://github.com/BitGo/BitGoJS/commit/451e58a1f1a34e54c7d493a2dac6621c777da783))
* **account-lib:** implement basic util methods for solana ([6fb3746](https://github.com/BitGo/BitGoJS/commit/6fb37465fa4be552dcda0f63729214339d8bb913))
* **account-lib:** implement isValidPrivateKey() method for CSPR ([c58d44a](https://github.com/BitGo/BitGoJS/commit/c58d44abc613f26d9497f2536009cf06cb9777fa))
* **account-lib:** implement keypair, transaction, builder and builder factory for solana ([c8493f6](https://github.com/BitGo/BitGoJS/commit/c8493f6b19d3aa01eb03ead7c514b79a0b58161b))
* **account-lib:** implement validityWindow and sequenceId for Sol ([0677955](https://github.com/BitGo/BitGoJS/commit/06779551b6b21a0f38d809c03a6870c309b83d21))
* **account-lib:** implementation of generateAccoutn() in account-lib ([7737024](https://github.com/BitGo/BitGoJS/commit/7737024d04187cd8432473d17354543d4d35aba0))
* **account-lib:** implementation of the functionality secretKeyToMnemonic with unit test ([0c80d0a](https://github.com/BitGo/BitGoJS/commit/0c80d0a65dd5ab09c196421c9d25022174c89a24))
* **account-lib:** implemetion stellerpub to algoaddress and encodeAddress ([a636bc0](https://github.com/BitGo/BitGoJS/commit/a636bc01dca47e51663a99b8dee843e3ba28b4c6))
* **account-lib:** improve and export NEAR util methods ([7ad569e](https://github.com/BitGo/BitGoJS/commit/7ad569e631ca8a5f8737c199bfdb190d92af9c61))
* **account-lib:** include rent exempt amount in solana ata init transaction STLX-11958 ([25c7eeb](https://github.com/BitGo/BitGoJS/commit/25c7eebce629b0d9de6a52946bc4b3f91b34fe22))
* **account-lib:** initial algorand keypair support ([fd00e5b](https://github.com/BitGo/BitGoJS/commit/fd00e5b204c08c73c5da3e60545f90d0b3c0257e))
* **account-lib:** initial setup ([63be9dd](https://github.com/BitGo/BitGoJS/commit/63be9dd76bef92423b41c57d628b4e093fa5e2cc))
* **account-lib:** keyreg linting fix ([29f2cb5](https://github.com/BitGo/BitGoJS/commit/29f2cb5b4f150eab9870ec941589ba9553303775))
* **account-lib:** load inputs and outputs of solana create ata instruction STLX-11958 ([a3a2ab1](https://github.com/BitGo/BitGoJS/commit/a3a2ab1a6fb885a9aecc5c648529bfc9f313622c))
* **account-lib:** make chainname parameterizable in txBuilder ([2115d96](https://github.com/BitGo/BitGoJS/commit/2115d96da9299deb6490ee447612326be5d67a17))
* **account-lib:** migrate BLS key pair from @bitgo/bls to @bitgo/bls-dkg lib ([c95877f](https://github.com/BitGo/BitGoJS/commit/c95877fda2201a5d71618ad68ba14cc73308f4f7))
* **account-lib:** move buildFeeInfo logic to AL and add unit test ([9c7ae4e](https://github.com/BitGo/BitGoJS/commit/9c7ae4ec9e5f0ecc751372375b1a83a7be4c1e7c))
* **account-lib:** near coin skeleton ([5fda33d](https://github.com/BitGo/BitGoJS/commit/5fda33da57e2037f0b9e2c81b98fe7b5fc2a35e9))
* **account-lib:** package json  fix ([dc14fc6](https://github.com/BitGo/BitGoJS/commit/dc14fc6b679590c08cdc6528c10e822158072cdf))
* **account-lib:** rebase account-lib in the bitgoJs and fixing errors ([cf5baaf](https://github.com/BitGo/BitGoJS/commit/cf5baaf577cd9c151be40d4efb6257ba47c03889))
* **account-lib:** recover signature from raw tx ([113f132](https://github.com/BitGo/BitGoJS/commit/113f132f3219c752938b40a56eb90fca937b223d))
* **account-lib:** refactor after code review ([27761f5](https://github.com/BitGo/BitGoJS/commit/27761f5c2e72a4a284959630cd6821d0e07e77b9))
* **account-lib:** refactor and added missing unit test ([33bae36](https://github.com/BitGo/BitGoJS/commit/33bae3646e26ebd131f3c6e0a5a84f3f3e4bbec2))
* **account-lib:** refactor casper addresses format ([cb8a30c](https://github.com/BitGo/BitGoJS/commit/cb8a30c47f199ef889946e411dfb8738e2621e55))
* **account-lib:** refactor code after code review ([a0d13b4](https://github.com/BitGo/BitGoJS/commit/a0d13b4bb587ef6f7b23dbcd5588e3230caded5e))
* **account-lib:** refactor due to pull request review suggestions ([e30a6ea](https://github.com/BitGo/BitGoJS/commit/e30a6eaefc1e780dab2b6d66d048fc4e75d28f6d))
* **account-lib:** refactor mintAddress -> tokenName 3 STLX-11959 ([a1455a3](https://github.com/BitGo/BitGoJS/commit/a1455a36eab968503691928d2ac8daef1a00797d))
* **account-lib:** refactor mintAddress -> tokenName 4 STLX-11959 ([eeeaecd](https://github.com/BitGo/BitGoJS/commit/eeeaecdffb2ae00e2c01e5b14e52995c934f8998))
* **account-lib:** refactor mintAddress -> tokenName STLX-11959 ([6ca2d10](https://github.com/BitGo/BitGoJS/commit/6ca2d1065e76c26f0d2aac8a08ed536bbba9bbad))
* **account-lib:** refactor to control over minimum transfer amount ([2ae3ac1](https://github.com/BitGo/BitGoJS/commit/2ae3ac18bdde24909f4275f9b3796796cb9cd0c5))
* **account-lib:** remove asynchronicity from some methods and improved jsdoc ([cb1636f](https://github.com/BitGo/BitGoJS/commit/cb1636f885a0ba752803ad4bc412cc6f68689755))
* **account-lib:** remove KeyExclusionBuilder from account-lib ([3950c7b](https://github.com/BitGo/BitGoJS/commit/3950c7bf68c19dfdf46490f8c3c5d79f6ffb38d6))
* **account-lib:** remove question mark from genesisID and genesisHash ([14c961e](https://github.com/BitGo/BitGoJS/commit/14c961e658f114da34e107871d4021997cf7f586))
* **account-lib:** sign message and verify sign for casper ([80cfbb9](https://github.com/BitGo/BitGoJS/commit/80cfbb93395ac9e62ae5a770272c3b16068176c5))
* **account-lib:** skeleton code for avalanche c-chain in account-lib ([8c5382b](https://github.com/BitGo/BitGoJS/commit/8c5382b1e51e453b60e7127b2cc18467f4a0f952))
* **account-lib:** solana - implement derive address function ([3dbdf6c](https://github.com/BitGo/BitGoJS/commit/3dbdf6cdc3a89883d86ba7237e958cc3bd475d58))
* **account-lib:** spl-token encode/decode rework STLX-11959 ([e1db449](https://github.com/BitGo/BitGoJS/commit/e1db449d2094ea9f85f8af479f83f14f0371b99b))
* **account-lib:** stlx-1458 from implementation for wallet initialization ([94395dd](https://github.com/BitGo/BitGoJS/commit/94395dd8c371dbe6e43eadd4736d1172c9a77e70))
* **account-lib:** stlx-793 implemented from implementation for transaction and transaction builder ([679c1af](https://github.com/BitGo/BitGoJS/commit/679c1af134a34ff8432817768e28e05971ccf06f))
* **account-lib:** stx contract call args ([b482b72](https://github.com/BitGo/BitGoJS/commit/b482b724b4647bd677a2f2082825a1c410cffb1f))
* **account-lib:** stx ContractBuilder functionArgs add optionl ([1e5e725](https://github.com/BitGo/BitGoJS/commit/1e5e725152bc75fd58358474f3cbbfedbbbd403b))
* **account-lib:** sTX getSTXAddressFromPubKeys takes an optional AddressHashMode param ([7dc694d](https://github.com/BitGo/BitGoJS/commit/7dc694dab04c45f44d363c0b6938ec37ac3b78c0))
* **account-lib:** stx toBroadcastFormat does not prefix with 0x ([3d0749f](https://github.com/BitGo/BitGoJS/commit/3d0749f8be7749e89c84494a5db59b2647433273))
* **account-lib:** sTX's transaction builder checks if the provided memo string is valid ([c4c2fac](https://github.com/BitGo/BitGoJS/commit/c4c2fac63dbee5087851281afa97f7f8b86fc5d7))
* **account-lib:** support creating TSS keyshares with seed ([6716720](https://github.com/BitGo/BitGoJS/commit/6716720705087d31bddc978b4c89ad0bf1a494bd))
* **account-lib:** support HD MPC key generation and signing ([be934d3](https://github.com/BitGo/BitGoJS/commit/be934d34fb75020d78618ef9fdf2976041346be8))
* **account-lib:** support new fee model in EthTransactionData ([c4b2e38](https://github.com/BitGo/BitGoJS/commit/c4b2e38e517d06ad91ff1a060d78ec7322c2a312))
* **account-lib:** supporting adding signatures to transactions ([00cd566](https://github.com/BitGo/BitGoJS/commit/00cd5662bf9f89c9c4bdab948f6548107c9ef696))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **account-lib:** token transfer support STLX-11959 ([1687234](https://github.com/BitGo/BitGoJS/commit/16872349fc25bffce07eda515728aff250d1a25d))
* **account-lib:** transation hash is calclated wrongly ([15628a2](https://github.com/BitGo/BitGoJS/commit/15628a20b4feef9d4b77debb5359158ccc99f821))
* **account-lib:** unit test for non participation in keyRegistrationBuilder ([540774b](https://github.com/BitGo/BitGoJS/commit/540774b40dd1406d7b8d9e6d6fa573f1bb723318))
* **account-lib:** update casper sdk to version 20 ([34996e4](https://github.com/BitGo/BitGoJS/commit/34996e4879e966fb2511e20cccb84d01c96b24d6))
* **account-lib:** update casper sdk version ([b0bc77a](https://github.com/BitGo/BitGoJS/commit/b0bc77a2c59606e0dbd0ae25bbe15970af13fb37))
* **account-lib:** update casper-client-sdk lib version ([5f74054](https://github.com/BitGo/BitGoJS/commit/5f740548b5292dbccf478837aa48083cf5ac4e0b))
* **account-lib:** update eth behavior require by hsm3 ([062eba1](https://github.com/BitGo/BitGoJS/commit/062eba1232083bf40ed66f69eebda7a73b7bbded))
* **account-lib:** update the casper-client-sdk dependency to v1.0.16 ([a97e235](https://github.com/BitGo/BitGoJS/commit/a97e235e267521a729fb5b87802764ee7b97ed40))
* **account-lib:** update verification methods ([af93730](https://github.com/BitGo/BitGoJS/commit/af937306b61286ab813e4410b65079659883e93b))
* **account-lib:** updated casper node version ([fa2d7f6](https://github.com/BitGo/BitGoJS/commit/fa2d7f65edf416231bd8d829ce7e33c2294b65f6))
* **account-lib:** updated casper sdk version to 1.0.19 ([13806da](https://github.com/BitGo/BitGoJS/commit/13806da99039c09a7d0e13a4b0a5651293c24874))
* **account-lib:** updating after comments ([13726e8](https://github.com/BitGo/BitGoJS/commit/13726e81920af88b4cc40a6e5bed39823d62e10a))
* **account-lib:** upgrade celo to 1.2.4 ([c7ed64d](https://github.com/BitGo/BitGoJS/commit/c7ed64d3c21d77c62a015f126c59843d39866214))
* **account-lib:** validate ValidityWindows in baseBuildTransaction ([dd1dfc4](https://github.com/BitGo/BitGoJS/commit/dd1dfc41ac2a5fa9489f0472b31ad584b868b9d7))
* **accountlib:** add closeremaindeto and unit tests ([69917a0](https://github.com/BitGo/BitGoJS/commit/69917a0074e382a900df71bc247cc9eadfd0533d))
* **accountlib:** add new casper coin skeleton structure ([9163b22](https://github.com/BitGo/BitGoJS/commit/9163b22b2edb8baa8c54c381b4857fac46b7e646))
* **accountlib:** add testing ([8f4e3a0](https://github.com/BitGo/BitGoJS/commit/8f4e3a0f0fb2743f14211565c1f1e4e6bfcc144e))
* add BCH coin and recovery ([a74b877](https://github.com/BitGo/BitGoJS/commit/a74b877a14ab46b2bcf0955e60fbab6db4f5c302))
* add bls initialization ([f7fe3d4](https://github.com/BitGo/BitGoJS/commit/f7fe3d42be5e3e98327e346fbc57b151a826124c))
* add custom signing function url to requests ([2a0aca5](https://github.com/BitGo/BitGoJS/commit/2a0aca5123547635ab97d25befd4ef5b4bcc5dc1))
* add ERC20 OFC "token" support to statics ([4473ef9](https://github.com/BitGo/BitGoJS/commit/4473ef99d7cadbbb58ac6f88cdfff1be4a7ef577))
* add eth2 to statics ([61665a3](https://github.com/BitGo/BitGoJS/commit/61665a3cdb2ba4a3700a3cc9baa803abdd17c6bf))
* add fetchEncryptedPrivKeys.ts ([136fbab](https://github.com/BitGo/BitGoJS/commit/136fbabb6220b7e5620d6705b0ceb1819f45dcac))
* add github actions CI workflow ([e90bef1](https://github.com/BitGo/BitGoJS/commit/e90bef1c3b646d81b962bc92bf63c97fd286cb64))
* add log for xpub during tx signing ([c0bba72](https://github.com/BitGo/BitGoJS/commit/c0bba72de81e21223f03b0b6ea90782262fcab14))
* add module `@bitgo/blockapis` ([2bc8991](https://github.com/BitGo/BitGoJS/commit/2bc8991df6eabbe5775663f1169e90d599e6b87d))
* add new token ([8a60853](https://github.com/BitGo/BitGoJS/commit/8a60853f3988faa1eedfce777cc40cb6244ae027))
* add new tokens ([7027f50](https://github.com/BitGo/BitGoJS/commit/7027f50da97e885eb5c068d339a65953da255f04))
* add new tokens ([69b320e](https://github.com/BitGo/BitGoJS/commit/69b320e5bde0724e353d2cb710b3a358808100b8))
* add nft tokens to statics ([9f42cc4](https://github.com/BitGo/BitGoJS/commit/9f42cc4b8dc4f81bcff6fa6d7da58b07df5b8c2a))
* add retry logic to external signer ([05e198a](https://github.com/BitGo/BitGoJS/commit/05e198a64f43afbf035fee406f27e0b35cb90721))
* add signing functionality to external signer mode ([ee26c72](https://github.com/BitGo/BitGoJS/commit/ee26c727931a2ae08613f173bd34a1092c5915fc))
* add SIH ([2cbd5b4](https://github.com/BitGo/BitGoJS/commit/2cbd5b4cb9c1ec01cbd8da408ecbe1406f70e17e))
* add support for generating p2tr addresses ([2cd462c](https://github.com/BitGo/BitGoJS/commit/2cd462cb7b13aa2b9c6b09e667abe128c1c9262f))
* add support for node 16 and add to test matrix ([9fab886](https://github.com/BitGo/BitGoJS/commit/9fab886fab10eeacdd91d294f1c5deeb5cd03a28))
* add support for sign(signParams: TxbSignArg) ([f15fb36](https://github.com/BitGo/BitGoJS/commit/f15fb36e6a1aa7515dfbf0c1f2c36620a9ba8eab))
* **add tokens:** add tokens (lowcase) ([5c5612e](https://github.com/BitGo/BitGoJS/commit/5c5612e600bab01adc40c973696ed788ac679f2a))
* add TSS key generation and signing functions ([3d1dce5](https://github.com/BitGo/BitGoJS/commit/3d1dce5e2c225acd08d5018f53c43727eba19632))
* add unspents module from BitGo/unspents ([47acb1e](https://github.com/BitGo/BitGoJS/commit/47acb1eff7f00cadde40eb480c7c19342ee126e8))
* adding comment to SubmitTransactionOptions ([ac32498](https://github.com/BitGo/BitGoJS/commit/ac324988fe37f256a901d71761ad908f95f72f29))
* adds BLS key generation to account-lib. Used for ETH2 ([9fc8583](https://github.com/BitGo/BitGoJS/commit/9fc8583649b567b6b41a5ea18d536291caaf8ea0))
* adds eth2 coin controller in core ([8c74388](https://github.com/BitGo/BitGoJS/commit/8c74388eba50df6ce853c80cb5291e6627a94251))
* adds new tokens ([0607785](https://github.com/BitGo/BitGoJS/commit/06077852a6e97b27265826e4d877bcc53fffb3cf))
* **algo:** add algo token support ([740d064](https://github.com/BitGo/BitGoJS/commit/740d06493b76e82b16f7be746d623616d7082220))
* **algo:** bG-31598-Add-ALGO-Token-Support ([29eb2a0](https://github.com/BitGo/BitGoJS/commit/29eb2a0ff320cc83727a54fe8a932e25359c831d))
* **algo:** misc updates for platform migration to use account lib ([b310c57](https://github.com/BitGo/BitGoJS/commit/b310c57d5ff497aff76fe5859a3baef6466915c5))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* **bitgo:** add emergency param to whitelist ([3e0b615](https://github.com/BitGo/BitGoJS/commit/3e0b6155c750da431ffc8062a4ccf7c0bad639f2))
* **bitgo:** add nonce in prebuild whitelisted params ([bbf4084](https://github.com/BitGo/BitGoJS/commit/bbf4084912bb0b29c048bbc192d83b1ce4bdf156))
* **bitgojs:** update algo sdk to last stable version ([87e258a](https://github.com/BitGo/BitGoJS/commit/87e258aa69c72a339f9a911e512aa447ff77dc32))
* **bitgojs:** update algo sdk to last stable version ([291f166](https://github.com/BitGo/BitGoJS/commit/291f166447cd29dac463b0cf2d4851ac21b00684))
* **bitgo:** update tss hd wallet sharing ([d416f1e](https://github.com/BitGo/BitGoJS/commit/d416f1e65794f1be2a0d908b0d2d43b5f0589355))
* **blockapis:** add OutputSpends, TransactionStatus queries ([53bd87e](https://github.com/BitGo/BitGoJS/commit/53bd87e2128598e4321654a58e647bab88e82325))
* **c8p token:** update decimal places ([85d7cfe](https://github.com/BitGo/BitGoJS/commit/85d7cfef5a40d4b818b62e79daff7c38965b961f))
* check config when running in external signer mode ([3c0e9a1](https://github.com/BitGo/BitGoJS/commit/3c0e9a12f2ae652a95defc289cb32a9589369bb0))
* check that signerFileSystemPath path contains a private key ([fe78332](https://github.com/BitGo/BitGoJS/commit/fe78332784edcff6f897ef05d315f2106a1308f4))
* **core & account-lib:** adapt tron to receive data for a contract call ([8bbcac0](https://github.com/BitGo/BitGoJS/commit/8bbcac05215c6eb14edb103ea241f72ae934ec7e))
* **core:** add `considerMigratedFromAddressInternal` verification flag ([288c6f1](https://github.com/BitGo/BitGoJS/commit/288c6f15e11c908849047f4f995d4ba20f4da958))
* **core:** add `ecdhXprv` to serialized SDK JSON object ([3112c72](https://github.com/BitGo/BitGoJS/commit/3112c72f735e319d25f885c446ea8b1e8b30f0f3))
* **core:** add amount to refund eos txn ([f3e5a67](https://github.com/BitGo/BitGoJS/commit/f3e5a676112252b4ab746f2ed0678e9bf316992c))
* **core:** add AvaxcToken coins in sdk ([8beb7bf](https://github.com/BitGo/BitGoJS/commit/8beb7bf2b52090fc04b43800cc328951a509417d))
* **core:** add Avaxctokens coins in sdk ([9f74b40](https://github.com/BitGo/BitGoJS/commit/9f74b406751044a5ded33b6763ca2df7f125b4dc))
* **core:** add bip32path.fromLegacyPath() ([b95c55f](https://github.com/BitGo/BitGoJS/commit/b95c55f73ecc75b2e946353c4a01856279a916e2))
* **core:** add bip32util with signMessage/verifyMessage ([43178f2](https://github.com/BitGo/BitGoJS/commit/43178f2cf9da0e812fdae2057e597c5dc8bc5660))
* **core:** add class WalletKeys ([4417bb0](https://github.com/BitGo/BitGoJS/commit/4417bb0de33c2233ed640a472fb6abb0ab93c522))
* **core:** add compatibility for @bitgo/utxo-lib 1.9.x ([1bbc4df](https://github.com/BitGo/BitGoJS/commit/1bbc4dfd6caa51acf69f39a46e7e6b901d6184cf))
* **core:** add core skeleton for solana ([2269db4](https://github.com/BitGo/BitGoJS/commit/2269db4ada70549df295002f652838ffaa647938))
* **core:** add createTss func to keychains ([954a148](https://github.com/BitGo/BitGoJS/commit/954a148a324acaadfdf28a0b570ecb4a8a817076))
* **core:** add distinct "unit-test" target ([079b1fb](https://github.com/BitGo/BitGoJS/commit/079b1fb3890f8ea55d3303eb674cf09bfc5843f5))
* **core:** add enable and disable token txs to explain transaction method ([8d99fdc](https://github.com/BitGo/BitGoJS/commit/8d99fdca1ec854d199c28ba1e26a9be533985c81))
* **core:** add eos explain refund txn ([d1231c0](https://github.com/BitGo/BitGoJS/commit/d1231c0b98f6d340790cfed5352893b5867d78b8))
* **core:** add examples of enable and disable token ([1aeeeb3](https://github.com/BitGo/BitGoJS/commit/1aeeeb3c6b87fa0c7b3a1ff9de131be74d6d8286))
* **core:** add explainTransaction for STX ([b69cc82](https://github.com/BitGo/BitGoJS/commit/b69cc82ff66ce5bb10fe3b787b79f5dd923e75f7))
* **core:** add fixture-based parameteric utxo tests ([444888f](https://github.com/BitGo/BitGoJS/commit/444888f9f0ba5a5ec5d6ed941c968cf29efa8e52))
* **core:** add function for verifying eth address ([32d5714](https://github.com/BitGo/BitGoJS/commit/32d5714d7e4b2b0e2537da42e6f2448f0488c973))
* **core:** add function in SDK and write examples for deploy/flush forwarder. Ticket: STLX-12550 ([c4cd0b4](https://github.com/BitGo/BitGoJS/commit/c4cd0b4710b8405add0104c289eb145a45983636))
* **core:** add hop to signTransaction and unit tests ([9d58b26](https://github.com/BitGo/BitGoJS/commit/9d58b261ddeb24bfbbb5cb6ebf2e18b8ec94e550))
* **core:** add method to aggregate ETH2 BLS shares ([953ddfb](https://github.com/BitGo/BitGoJS/commit/953ddfb92cacb3239ec994979d02481775f88f22))
* **core:** add NEAR core skeleton ([16bc15d](https://github.com/BitGo/BitGoJS/commit/16bc15d5ce80b53c14b54a5cd9faa6fe71912b70))
* **core:** add parseOutputId to utxo/unspent.ts ([ec77d11](https://github.com/BitGo/BitGoJS/commit/ec77d1172d7d8f6f93b415f6c280397e36f57ace))
* **core:** add publicKeys optional param to stx's explainTransaction call options ([6581839](https://github.com/BitGo/BitGoJS/commit/6581839d4d0cebf97d8c770ac981290d4bb9ee48))
* **core:** add rel prefix to github actions branch list ([0519d66](https://github.com/BitGo/BitGoJS/commit/0519d6686a6cab57a43df2662402adef02837dff))
* **core:** add request method to auth v3 hmac subject ([74e5b1f](https://github.com/BitGo/BitGoJS/commit/74e5b1f659c832bb848172745251a9ef93ee9fa2))
* **core:** add send support for XLM muxed addresses ([fdaf489](https://github.com/BitGo/BitGoJS/commit/fdaf489e7fa26b6963b5157c59ecdffff3bcde4f))
* **core:** add signTransactions method in stx ([bdd669f](https://github.com/BitGo/BitGoJS/commit/bdd669fbc67ae67696659c85ce8454cc59e919e7))
* **core:** add signWalletTransactionWithUnspent ([834c505](https://github.com/BitGo/BitGoJS/commit/834c50586b37a864b54a0ac0f291980b6ec8191e))
* **core:** add stacking to explain tx ([d637154](https://github.com/BitGo/BitGoJS/commit/d637154d11e45f195bb0b75fd664a16338bd268c))
* **core:** add support for avaxc ([a30e29c](https://github.com/BitGo/BitGoJS/commit/a30e29cc4bd0a134186bc76e3afb5e3f49c4f03f))
* **core:** add support for node 12, 14, 15 ([0085455](https://github.com/BitGo/BitGoJS/commit/0085455dd22640994db627877c23c48fc5c9e18f))
* **core:** add support for p2tr recoveries ([286469f](https://github.com/BitGo/BitGoJS/commit/286469ffe9ad6868b926a63bc9c4cb1a55ae11d8))
* **core:** add support for p2tr script path sign ([99b0453](https://github.com/BitGo/BitGoJS/commit/99b04535b57703ca37cf2dfc0553de03f9a51c51))
* **core:** add support for user-provided custom signing function ([672f1a8](https://github.com/BitGo/BitGoJS/commit/672f1a83f5690a03e36309eaeff19b7daeb13044))
* **core:** add support for verifying STX addresses with an optional "memoId" field ([5627877](https://github.com/BitGo/BitGoJS/commit/5627877b1a98f3d8b49a6e2c084da75afc1d5c4f))
* **core:** add supportsAddressChain(), supportsAddressType() ([89cb98f](https://github.com/BitGo/BitGoJS/commit/89cb98f6a9dbe9801df6feb238d33e5659d69243))
* **core:** add toBase58Check to legacyBitcoin ([c220d7d](https://github.com/BitGo/BitGoJS/commit/c220d7d45b8533d343c1e2425109caa94da7a0da))
* **core:** add tss flow on pending approval ([22313ff](https://github.com/BitGo/BitGoJS/commit/22313ff47dcea31340eee3e83c9d09ad641e02e4))
* **core:** add unspent address check ([0bb42c2](https://github.com/BitGo/BitGoJS/commit/0bb42c205e28715a0e43ebbb374e61528db2aee2))
* **core:** add verifyWalletTransactionWithUnspents ([93e3292](https://github.com/BitGo/BitGoJS/commit/93e3292276c203b82e264ac19719699d5b3b6285))
* **core:** add, use getKrsProvider ([c839f08](https://github.com/BitGo/BitGoJS/commit/c839f088dca16cbc1d19c09241641f63518df444))
* **core:** added algo token config on core ([45bcf2f](https://github.com/BitGo/BitGoJS/commit/45bcf2f4c949995f126b06118b20c48d7b864bc1))
* **core:** added closeReminderTo into whitelist for cold enable token tx ([c7b725b](https://github.com/BitGo/BitGoJS/commit/c7b725b73681a74e1f3abcf1341c2fb5469b53e4))
* **core:** added cspr and tcspr to core module ([c7dd309](https://github.com/BitGo/BitGoJS/commit/c7dd30979e1ab222540949d2b9a0913742f51503))
* **core:** added ETH V1 examples ([32153d2](https://github.com/BitGo/BitGoJS/commit/32153d252765f3aedb1802d456886920bc75c5db))
* **core:** added node urls for Near ([4102c56](https://github.com/BitGo/BitGoJS/commit/4102c56fb4bc7ddbb57ef3e928b3f3e4c95c4073))
* **core:** added support for send on cashaddr ([0457b6d](https://github.com/BitGo/BitGoJS/commit/0457b6da7200aa8e298e8708830a76be1edf8454))
* **core:** allow alphanumeric memoid for eos ([ab4d3f2](https://github.com/BitGo/BitGoJS/commit/ab4d3f2ce838a8c80b9d6a9cbe5c7c91fc184854))
* **core:** allowed amount 0 on recipients for enable token ([29948a4](https://github.com/BitGo/BitGoJS/commit/29948a42492a9ce9e0ec2d16c8dfc8c34d594e89))
* **core:** bG-29057: Add non participant keyreg transaction support for Algorand ([e6b36c4](https://github.com/BitGo/BitGoJS/commit/e6b36c4a1e7e1175d32d6b8396f1a2f29790c273))
* **core:** create wallet with eip1559 ([3cfc343](https://github.com/BitGo/BitGoJS/commit/3cfc343ade54bb25a2b318adc2b4c94f3b78ca46))
* **core:** dot core helpers ([161d66a](https://github.com/BitGo/BitGoJS/commit/161d66a362b3e4f64a90fdf30ef97db9be9b7f0e))
* **core:** dot core sign tx ([4691678](https://github.com/BitGo/BitGoJS/commit/469167876a08928924a10b9406bc3a703eb19b51))
* **core:** dot review fixes ([4593a7a](https://github.com/BitGo/BitGoJS/commit/4593a7a5a01dada29d6bcab28587ba24fac187c5))
* **core:** enable hop transactions in avaxc ([4395c47](https://github.com/BitGo/BitGoJS/commit/4395c4791a64eca7500dd7c0658a6f9a5690e0af))
* **core:** enhanced address verification in sdk ([fa951d5](https://github.com/BitGo/BitGoJS/commit/fa951d5d6b4bf1ee914f2a74a94a7c92ba80d0e6))
* **core:** eos token configuration ([adbb0ae](https://github.com/BitGo/BitGoJS/commit/adbb0ae3d954b5c8dba88e31e1c2fc82528b1d46))
* **core:** explain transaction for transfer builder and keyreg builder ([9ce76ef](https://github.com/BitGo/BitGoJS/commit/9ce76efdf5a51ebf6f334f8593b9367258b1d6e4))
* **core:** explain unstake eos transaction ([a09501d](https://github.com/BitGo/BitGoJS/commit/a09501dd9cb5dc5f2b943c663c5c001299040099))
* **core:** export txEnumTypes from core ([ace20bb](https://github.com/BitGo/BitGoJS/commit/ace20bb3b01171c144dd577c216f6d3830800f09))
* **core:** expose compatibility layer at `require('bitgo').bitcoin` ([48cbfe3](https://github.com/BitGo/BitGoJS/commit/48cbfe33c867d0bd5e60dea6f132e5ad9f6c7a82))
* **core:** fix version of core dependecies ([7af586a](https://github.com/BitGo/BitGoJS/commit/7af586a7f6c4bdb261492a09ace651bdfb16f599))
* **core:** impelement tss wallet creation ([d5dfe3a](https://github.com/BitGo/BitGoJS/commit/d5dfe3a83c235ec1c30fbf8afc14e2bb46168218))
* **core:** implement algo sign txn ([1af84ea](https://github.com/BitGo/BitGoJS/commit/1af84ea225e0d9d35b1d0ef52baf35dd1e0a526c))
* **core:** implement explain transaction method for Casper ([6a607ec](https://github.com/BitGo/BitGoJS/commit/6a607ec7370b6c799472a58df043452ee76fc10f))
* **core:** implement getSignablePayload for baseCoin and sol ([c584437](https://github.com/BitGo/BitGoJS/commit/c584437485922af67940b807afde2bee348e158c))
* **core:** implement message signing ([0c2ba7e](https://github.com/BitGo/BitGoJS/commit/0c2ba7e8bfc89e8acbc5b8d6d0c50e2aa7f1905b))
* **core:** implement parseTransaction for CSPR ([9a81b62](https://github.com/BitGo/BitGoJS/commit/9a81b62dc577bf8f99a48f26b741d7223ddd8971))
* **core:** implement sign transaction for NEAR ([6da463a](https://github.com/BitGo/BitGoJS/commit/6da463a35a97a328985cdd0b3e3f173956884424))
* **core:** implement support for auth v3 ([9de7ffa](https://github.com/BitGo/BitGoJS/commit/9de7ffa560f323f8c71821fe39ea631812d58a5b))
* **core:** implement transaction signing methods ([739e72f](https://github.com/BitGo/BitGoJS/commit/739e72f30c101b9fe2c03f9b46ee67c854597a02))
* **core:** implement verify transaction function for sol ([aeaaf50](https://github.com/BitGo/BitGoJS/commit/aeaaf50577ff6d131654e283f8c23901825736fe))
* **core:** implement verifyAddress for stx coin ([d0a11b9](https://github.com/BitGo/BitGoJS/commit/d0a11b981d74534a4571210e592e48c86f3fe7f3))
* **core:** improve type signature for Unspent ([e0dfd6f](https://github.com/BitGo/BitGoJS/commit/e0dfd6f862ec5cdeab29763348a4430a4a837e0c))
* **core:** improve type signatures for recovery methods ([106a31d](https://github.com/BitGo/BitGoJS/commit/106a31db4cae439356fd3d6fcdb7f4d15166bfe3))
* **core:** move secp256k1 to regular dependencies ([d43b363](https://github.com/BitGo/BitGoJS/commit/d43b363aecb8164d0c6b5fca6b0cbf010bfb67fb))
* **core:** return bip32 in getBip32Keys ([82b0ba2](https://github.com/BitGo/BitGoJS/commit/82b0ba2beef8018b79c42524fd43035743a87f67))
* **core:** sign consolidate txns ([8aeeb3e](https://github.com/BitGo/BitGoJS/commit/8aeeb3e705aa1720dde1db0d85515364d8141e12))
* **core:** sign functions for casper ([9242aab](https://github.com/BitGo/BitGoJS/commit/9242aabaf3d362e03d341be1bfb924a23ed3b5e8))
* **core:** stx sign tx multisig ([873b006](https://github.com/BitGo/BitGoJS/commit/873b006307bc394d73e699280e3a20fb6683dcfe))
* **core:** support BLS-DKG key generation flow for ETH2 hot wallet creation ([356eee7](https://github.com/BitGo/BitGoJS/commit/356eee7b9fc090de6dda03a864c405e464701988))
* **core:** support creating algo wallets with seed ([41837ad](https://github.com/BitGo/BitGoJS/commit/41837ad8645285a157d1b565abfbe88f7ee15bf4))
* **core:** support creating solana ATA with sdk ([40ee96f](https://github.com/BitGo/BitGoJS/commit/40ee96ff0804f140b027cf9c7034b295a876a86d))
* **core:** support signing single sig dot transactions ([4ab0219](https://github.com/BitGo/BitGoJS/commit/4ab02195c5bf5e478e057a8568674b04f830bf1b))
* **core:** support tss wallet sharing ([249f424](https://github.com/BitGo/BitGoJS/commit/249f424f56d5ea2ecd4a4546986133e95d693fc1))
* **core:** tss wallet sharing tests ([3a5923b](https://github.com/BitGo/BitGoJS/commit/3a5923b13883d9022a86a7b8621b8dd488a7d85c))
* **core:** update createAddress to perform hardened derivation ([356dbaa](https://github.com/BitGo/BitGoJS/commit/356dbaa9503e002c5151e1497e0c1c583098b853))
* **core:** update forwarder flags ([670bde5](https://github.com/BitGo/BitGoJS/commit/670bde508bc75520ff540bf78e560f17abbf20b9))
* **core:** use sanitizeLegacyPath in transactionBuilder ([46543aa](https://github.com/BitGo/BitGoJS/commit/46543aa07a5194a857297f3f34c242b0435e8874))
* **core:** use scriptTypeForChain in abstractUtxoCoin ([4d675cc](https://github.com/BitGo/BitGoJS/commit/4d675ccdebb57a793468cb891b180b2db5d6a938))
* **core:** verify and prebuild hop transactions ([bac9bde](https://github.com/BitGo/BitGoJS/commit/bac9bde745371804357fa3cd673fa0572442f1b9))
* **core:** verify tss transactions ([319515f](https://github.com/BitGo/BitGoJS/commit/319515f91200fab7b96954c0b1687dbef7092308))
* **cspr:** update CSPR explorer URLs ([db7d1c1](https://github.com/BitGo/BitGoJS/commit/db7d1c1819d31632c8d2a89387003f944443362a))
* **defi:** add support for building, signing and sending meta transactions ([c1833cd](https://github.com/BitGo/BitGoJS/commit/c1833cd4568affec14886893afe43cc4f5132d76))
* **dot:** implement signMessage ([f0169d8](https://github.com/BitGo/BitGoJS/commit/f0169d8f03c9aee4ddb61998a36beba54dcdb063))
* enable consolidation support for solana ([1b8fcca](https://github.com/BitGo/BitGoJS/commit/1b8fcca3e6c6ce2125d6027834e50017c34e09a6))
* enable external signer mode for production ([077d2de](https://github.com/BitGo/BitGoJS/commit/077d2de7e477a2563b64b7d9be2fb7d4a594949b))
* **eos-tokens:** update explain transaction to support EOS tokens ([deab70b](https://github.com/BitGo/BitGoJS/commit/deab70b14be6ca1941588aae41e6cc0691d50aaf))
* **eos-tokens:** update explain transaction to support EOS tokens ([c8b7a24](https://github.com/BitGo/BitGoJS/commit/c8b7a24093a9e011b62e4a08b83eaa0782fb9752))
* **eos:** add eos token support ([6fb1319](https://github.com/BitGo/BitGoJS/commit/6fb1319cbf4dd076412d95fa1f93e7d2fca96305))
* **eth2:** add signMessage for ETH2 ([afbbcb2](https://github.com/BitGo/BitGoJS/commit/afbbcb2738002def0e48d06138a550b28a9b8a86))
* **eth:** add batcher ([cc4dfc3](https://github.com/BitGo/BitGoJS/commit/cc4dfc3ccdf9f845ef132a5efe36fb0dd05315ef))
* **eth:** build contract call transactions ([d6098fc](https://github.com/BitGo/BitGoJS/commit/d6098fcfcc1ff9657e6d85522c84af9fd3c10cd9))
* **eth:** enable eip1559 transactions for recovery ([f2b73ee](https://github.com/BitGo/BitGoJS/commit/f2b73ee9723b44de5ad874d13fe54291099ea41e))
* **eth:** generalize chain id configuration ([e97a7ce](https://github.com/BitGo/BitGoJS/commit/e97a7ce9b0134545b18825fc6be3d65c5f5fb1b0))
* **eth:** pass forwarderVersion flag ([9b56ab9](https://github.com/BitGo/BitGoJS/commit/9b56ab9321a3f53dcf5c7c8fc363cd7ac1b5df13))
* **eth:** update ethereumjs libs ([0bb3ada](https://github.com/BitGo/BitGoJS/commit/0bb3ada9eeb42aaa285dee277bf12ca49f5e4b6e))
* **eth:** verify pre-built eth txns ([f6a39c1](https://github.com/BitGo/BitGoJS/commit/f6a39c1205623149a26b543de3ec866cd5d2c860))
* **express:** add route for create address ([cdd3fec](https://github.com/BitGo/BitGoJS/commit/cdd3feca35881538bf83c01051792b86de6d9a11))
* **express:** add support for binding to an IPC socket (unix socket) ([b76c16c](https://github.com/BitGo/BitGoJS/commit/b76c16ca6d104b4fe6e47146a7c2e2a028552945))
* **express:** add support for returning keychains with generated wallet ([e04de53](https://github.com/BitGo/BitGoJS/commit/e04de5313ca418670c900e423a434ce2b6cf9a84))
* **express:** log request method and url upon failed request ([5a22ede](https://github.com/BitGo/BitGoJS/commit/5a22ede922509bd92fca09bf5be68dc3cff3445f))
* external signer to read encrypted privkeys ([32176e7](https://github.com/BitGo/BitGoJS/commit/32176e78edefa4cf3f5a853c33640604e812a42d))
* external signer to read private key from walletid ([735dcd9](https://github.com/BitGo/BitGoJS/commit/735dcd9cc0a00745405740d728c27da9aba993b3))
* feat: add pubkey aggregation ([7259779](https://github.com/BitGo/BitGoJS/commit/725977910f265d4d8726c153ed4b761a1a17437d))
* Fix CELO token transactionBuilder ([15b951a](https://github.com/BitGo/BitGoJS/commit/15b951a3b4a35b11e1cdafc5e98efffa8def729e))
* fixing halfSigned in SubmitTransactionOptions ([2603199](https://github.com/BitGo/BitGoJS/commit/2603199283e5598fd22318ec97d6983cca06c656))
* **hbar:** add check for key length ([b516bd0](https://github.com/BitGo/BitGoJS/commit/b516bd0559fbeaaca5415b24d0ff289819c3bbf4))
* **hbar:** update HBAR lib and protobufs ([425dbe5](https://github.com/BitGo/BitGoJS/commit/425dbe534984dc6da442c5f680608ed61d13f252))
* **hbar:** update hbar sdk ([b4bef77](https://github.com/BitGo/BitGoJS/commit/b4bef77c18c1ccf6933b1a4f853416375b10c4f1))
* implement keypair generation for casper in account-lib ([e944601](https://github.com/BitGo/BitGoJS/commit/e944601dda6182d9a2331ae2138de10afc3221cb))
* include feature flag for external signing API ([fedba73](https://github.com/BitGo/BitGoJS/commit/fedba7383214c6183261166c744a377547eaab74)), closes [#BG-38025](https://github.com/BitGo/BitGoJS/issues/BG-38025)
* make SDK derive key with address path for Tezos signing ([92ad147](https://github.com/BitGo/BitGoJS/commit/92ad1474ceaf7d43530a0581e76e43f5a38f2a01))
* **modules/bls-dkg:** add BLS-DKG module ([124a18b](https://github.com/BitGo/BitGoJS/commit/124a18bbc42c02345e7cc10cf79737f2d0d6481d))
* only allow external signing feature to run in test mode ([7b00932](https://github.com/BitGo/BitGoJS/commit/7b009324446b0b0546ca68832767afc5ef92f5c5))
* pass eip1559 fee params in send and sendmany ([73ef7fc](https://github.com/BitGo/BitGoJS/commit/73ef7fcca3f3559476063b4c16547e0314c42f13))
* **recovery:** cusomize gasPrice and gasLimit ([f777ba8](https://github.com/BitGo/BitGoJS/commit/f777ba842f69d11fb77254cfb8cc4f89e83eafbd))
* **remove fee address config from eth2 statics:** remove fee address config from eth2 statics ([38f0b40](https://github.com/BitGo/BitGoJS/commit/38f0b4019f22d7d72b3533a7ebac9127f7bf8686))
* resolve failing keycurve tests ([63702af](https://github.com/BitGo/BitGoJS/commit/63702afd782f7a85e2eaf55b344c63a992bb71e4))
* **root:** add unit-test-all to ci ([3d0efa4](https://github.com/BitGo/BitGoJS/commit/3d0efa49b3fb64dd658829e45c557152e8b7ae43))
* **root:** implement isWalletAddress for HBAR ([dc8d5fc](https://github.com/BitGo/BitGoJS/commit/dc8d5fca2c41881d97ffab084a1e6232f9a1c426))
* **root:** implement isWalletAddress for STX ([1828397](https://github.com/BitGo/BitGoJS/commit/1828397d1eedab1afde6e04ad64894437698cfa5))
* **root:** set tsconfig target to `es6` ([8c92c12](https://github.com/BitGo/BitGoJS/commit/8c92c12634722d4137d1c12c7e1e2f464973fae9))
* **root:** update SDK sendMany to use TSS ([6fef741](https://github.com/BitGo/BitGoJS/commit/6fef741913d6afb86ec3c73b6cdefe8a7c831afc))
* **root:** use lib "es2017" ([16ad3e4](https://github.com/BitGo/BitGoJS/commit/16ad3e4521ded7d5ef0f6da7e851d4c15e691d82))
* **sdk:** add feeLimit parameter to Send options ([c10d6fa](https://github.com/BitGo/BitGoJS/commit/c10d6fa384dc352aa082f1c4079dfa10fcde4e88))
* **sol:** address fee and id in explain transaction ([c494568](https://github.com/BitGo/BitGoJS/commit/c494568ceefa48b956fca6bc90bfdf707bf1b568))
* **sol:** implement parse transaction ([5a1f262](https://github.com/BitGo/BitGoJS/commit/5a1f262df2f9c4b250fc42d44626e59a39ad3b70))
* **sol:** initial implementation of explain transaction ([3e27360](https://github.com/BitGo/BitGoJS/commit/3e273608d70edf75faef4d62c59e7e1486fb3739))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* **statics:** add  new tokens ([805d911](https://github.com/BitGo/BitGoJS/commit/805d9111c08f8ce771f3ca02020ca92472b9d889))
* **statics:** add 2nd batch Feb tokens ([53aa64d](https://github.com/BitGo/BitGoJS/commit/53aa64d33ebb90bea1186ac39c2c4fce9464130f))
* **statics:** add add new tokens erc20 ([3e652ad](https://github.com/BitGo/BitGoJS/commit/3e652ad96946a51c25fbba9c8e5e9b3ee8a6b500))
* **statics:** add april tokens ERC20 and algo token ([a0cb164](https://github.com/BitGo/BitGoJS/commit/a0cb164d01872abc47925df97ddf43c35b58c7f1))
* **statics:** add arc20token and implementation ([ec6cf30](https://github.com/BitGo/BitGoJS/commit/ec6cf30349b6bf21af60bb37aa3dc2962a96a12a))
* **statics:** add AVAXC coin to statics ([0b8b1d6](https://github.com/BitGo/BitGoJS/commit/0b8b1d6e9198c63c910d3551d522db8996e3cc6a))
* **statics:** add Casper coin configuration to Statics ([f744b95](https://github.com/BitGo/BitGoJS/commit/f744b95b720aae1e1ddbd55a9bae5028f75e8b6a))
* **statics:** add casper explorer url ([fcb3a55](https://github.com/BitGo/BitGoJS/commit/fcb3a55f4db605e4e475383719e90949e63682e9))
* **statics:** add eos mainnet token config ([1ab6ee1](https://github.com/BitGo/BitGoJS/commit/1ab6ee1c0b47756b53705b7dbec9133cdd52738f))
* **statics:** add erc20 tokens ([fc496c3](https://github.com/BitGo/BitGoJS/commit/fc496c34a1b538ad1e31fbe6b4ab3a159590d40e))
* **statics:** add gteth support for trading ([53e5680](https://github.com/BitGo/BitGoJS/commit/53e56803407f54803e0c456bb32be87210a7cf59))
* **statics:** add imxv2 token ([68a7338](https://github.com/BitGo/BitGoJS/commit/68a733851cb393ad9f05510eda221ad2d6e19a45))
* **statics:** add matic coin config ([c6514c9](https://github.com/BitGo/BitGoJS/commit/c6514c98d494e7bc1a8ab110024d68abc51ae8f3))
* **statics:** add name property to networks ([6aebdd4](https://github.com/BitGo/BitGoJS/commit/6aebdd4a1a3b8972e890231a513fcd227cb53602))
* **statics:** add NEAR config ([61a74c1](https://github.com/BitGo/BitGoJS/commit/61a74c1749de1d9d7c5135451fcc8758efd4037b))
* **statics:** add new ERC20 and Stellar Tokens ([bad95cc](https://github.com/BitGo/BitGoJS/commit/bad95cc3ecbc7283fd131e50c7275b5fc2532d3e))
* **statics:** add new erc20 tokens to base.ts and coins.ts ([0e0e2c7](https://github.com/BitGo/BitGoJS/commit/0e0e2c763b2afa85d2a4acda80a3dec3b94e1d42))
* **statics:** add new erc20s for goerli london hard fork testing ([d566b39](https://github.com/BitGo/BitGoJS/commit/d566b39d3850eb69adc36ee7ad393faca1730dfd))
* **statics:** add new token ([fdf96bb](https://github.com/BitGo/BitGoJS/commit/fdf96bbb368b7a58e04f48edabbdace552212913))
* **statics:** add new tokens ([9328422](https://github.com/BitGo/BitGoJS/commit/93284228b12627efaa0e2f0c770f9dd733b9fc9f))
* **statics:** add new tokens ([b10781f](https://github.com/BitGo/BitGoJS/commit/b10781f075e69f2c6cd0f6ac5917f53dd031c090))
* **statics:** add new tokens ([c8d787c](https://github.com/BitGo/BitGoJS/commit/c8d787c0ad559c63dd75c6a504be086d50008833))
* **statics:** add new tokens ([db83f77](https://github.com/BitGo/BitGoJS/commit/db83f77e34054031496517d85f3517c4207edd74))
* **statics:** add new tokens ([4c113d3](https://github.com/BitGo/BitGoJS/commit/4c113d3e1b6436b70f645454656801a6ceb9f725))
* **statics:** add new tokens ERC20 ([4306190](https://github.com/BitGo/BitGoJS/commit/4306190a4d0a6f0dbfee413fc9bf88d0f431dde1))
* **statics:** add NPXS token again ([f258b41](https://github.com/BitGo/BitGoJS/commit/f258b414616b58e838c17cb8ca4758ca44132ceb))
* **statics:** add ofc casper coins support for trading ([a88406f](https://github.com/BitGo/BitGoJS/commit/a88406f444022d29ad6b5d746280025059a00217))
* **statics:** add ofc stacks coins support for trading ([3fa7ee4](https://github.com/BitGo/BitGoJS/commit/3fa7ee45a05dd873ca39aec9d1d452069ca19780))
* **statics:** add ofcavaxc and ofctavaxc support for trading ([c06f72c](https://github.com/BitGo/BitGoJS/commit/c06f72cb5a291f1badbf5374f88bbfba923ea208))
* **statics:** add priority tokens ([3b2b44b](https://github.com/BitGo/BitGoJS/commit/3b2b44bcd3f634da74b3b39c1cbee151e15ab67a))
* **statics:** add requires reserve ([28f4a6e](https://github.com/BitGo/BitGoJS/commit/28f4a6efefc8e71fb615eb5430dd4fc58b37dc21))
* **statics:** add support for several ERC20 tokens ([bfd95c2](https://github.com/BitGo/BitGoJS/commit/bfd95c2da0a2dc6acce093d0fa1e722a6d7a55db))
* **statics:** add tesnet tokenes ([de9d5b5](https://github.com/BitGo/BitGoJS/commit/de9d5b529b47c925f6e5741d599b06006bf58951))
* **statics:** add testnet tokens ([62c3273](https://github.com/BitGo/BitGoJS/commit/62c3273fa769f26b1304d9a7078d21308c81a02a))
* **statics:** add TOken MVI and WLUNA ([dbf3b0b](https://github.com/BitGo/BitGoJS/commit/dbf3b0b4cd92d7d0e2d8fda370ccb9a4a001d26a))
* **statics:** add token traxx ([752f2a3](https://github.com/BitGo/BitGoJS/commit/752f2a391bc5d23d4ae5b7eb3cfc70b2c3251f64))
* **statics:** add tokens jan batch 2nd ([0eb6d2c](https://github.com/BitGo/BitGoJS/commit/0eb6d2c7dbfab8ccdd89d81773b207412b96fa03))
* **statics:** add trx fee limit to statics ([50d01b8](https://github.com/BitGo/BitGoJS/commit/50d01b85de121c44825acb6fe21b69960d7431b7))
* **statics:** add usdc and usdt to config ([f96d622](https://github.com/BitGo/BitGoJS/commit/f96d622ba1f6244482f6cebc199f0ae783482fcd))
* **statics:** add usdc and usdt to config ([80934b7](https://github.com/BitGo/BitGoJS/commit/80934b7e0f168d5ef8d87470d96df850fa45e4e0))
* **statics:** add wec token ([b514252](https://github.com/BitGo/BitGoJS/commit/b51425253f22bc4ff8582a2292441ea2eaf55094))
* **statics:** add WETH and WBTC on tron ([5e2a631](https://github.com/BitGo/BitGoJS/commit/5e2a6316a48850b3a5df05018e768bf53b7573f2))
* **statics:** change name to gHDO and gHCN ([0112296](https://github.com/BitGo/BitGoJS/commit/011229645d474bfaf0e7529ac71d31e100285447))
* **statics:** coin feature custody ([448b45c](https://github.com/BitGo/BitGoJS/commit/448b45c072be055a1cf13974d0fc171a9a4e7350))
* **statics:** create FIAT currency in Testnet ([4b3bfcb](https://github.com/BitGo/BitGoJS/commit/4b3bfcb07c95cd9ca5cdf7d745fd5f56a3217652))
* **statics:** create FIAT tokens in Testnet ([9a4d727](https://github.com/BitGo/BitGoJS/commit/9a4d7275e1a65dd2cda54e8d4c8918f36f7952a8))
* **statics:** create fiat-usdc-tusdc ([a9a1d60](https://github.com/BitGo/BitGoJS/commit/a9a1d6058da72b1b1eebeec556d2af984ec660b6))
* **statics:** define coin sol in statics ([619d359](https://github.com/BitGo/BitGoJS/commit/619d359bebcbcca4cac6bf6a801eb89feb0b5997))
* **statics:** define coin sol in statics ([7d98009](https://github.com/BitGo/BitGoJS/commit/7d9800956bb10c14b2c377566ef8b3343a79b11c))
* **statics:** dot ignore coin init ([40b9015](https://github.com/BitGo/BitGoJS/commit/40b9015c262165e9d9d9f92f157964d60b3fe4d0))
* **statics:** dot statics addition ([60a0ecd](https://github.com/BitGo/BitGoJS/commit/60a0ecd008246706793d643078a979cf0497e68c))
* **statics:** eRC20 Token Support ([062b09c](https://github.com/BitGo/BitGoJS/commit/062b09c8eef4bee05eadfb4eef6ab1999de20e07))
* **statics:** eRC20 Token Support ([ba2d870](https://github.com/BitGo/BitGoJS/commit/ba2d8707fff934fe5124163bd78e52bf9a1730da))
* **statics:** fix address ([97d80a0](https://github.com/BitGo/BitGoJS/commit/97d80a090d2a25fbeabaedc244f537d7071d3830))
* **statics:** fix BXX address ([fa12160](https://github.com/BitGo/BitGoJS/commit/fa12160625c24161edf2ecbcafadf8cdd776408f))
* **statics:** hot fix address FDT AND FET1 ([153b3b3](https://github.com/BitGo/BitGoJS/commit/153b3b39b4b6b2716fc1f909c9cf5519ee71fec8))
* **statics:** implement iterator for CoinMap ([a4a2f4b](https://github.com/BitGo/BitGoJS/commit/a4a2f4b830084a136840abbaf3b30fe5852a60e1))
* **statics:** new tokens ([bbdf990](https://github.com/BitGo/BitGoJS/commit/bbdf990b660499333fdbf3b895c34137f2ab7298))
* **statics:** new tokens being added ([1491060](https://github.com/BitGo/BitGoJS/commit/1491060833c9c9bba2934191fa532a563999340a))
* **statics:** onboard erc-20 coins in groups 1-3 ([92c184e](https://github.com/BitGo/BitGoJS/commit/92c184e2db02cdf21e8e4265fc0b304a72601b43))
* **statics:** onboard february tokens ([5493311](https://github.com/BitGo/BitGoJS/commit/549331175e3f42925c0c2a45c7c3fc12326c92cd))
* **statics:** onboard tokens for prime trading ([681c4dd](https://github.com/BitGo/BitGoJS/commit/681c4dd40778ec8a542c7a9125c5d33c6a85c9cc))
* **statics:** onboarding  jan batch ([3753850](https://github.com/BitGo/BitGoJS/commit/375385035ce30b6202576a79e229355e49e3ee93))
* **statics:** onboarding BXXV1 token ([d05ec73](https://github.com/BitGo/BitGoJS/commit/d05ec73078c101dfd1fab48bf23511900b4c860f))
* **statics:** polkadot unit tests and exporer url ([1842a1f](https://github.com/BitGo/BitGoJS/commit/1842a1f98c3f8ee9057469d417a8da70889bddd0))
* **statics:** rename burp token ([762fb19](https://github.com/BitGo/BitGoJS/commit/762fb198b8ca381cd8a5a9c1b92e159cd4130781))
* **statics:** revert DYNS token to DYN ([a2a7f5b](https://github.com/BitGo/BitGoJS/commit/a2a7f5b6e6de05bbcbe1643ca5b4c630bdac92cf))
* **statics:** support new Algo token name format ([47a1cd7](https://github.com/BitGo/BitGoJS/commit/47a1cd7a66530795f853f7d775da5a4153c975a0))
* **statics:** update contract addresses ([db652bf](https://github.com/BitGo/BitGoJS/commit/db652bfa9d3cc1128a4ff04ebc07145ab97e508a))
* **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))
* **statics:** update decimal places for c8p token ([b5604ca](https://github.com/BitGo/BitGoJS/commit/b5604ca1f3af09e61cd9bf28cb16d08b74e06958))
* **statics:** update EOS with SUPPORTS_TOKENS feature ([241630c](https://github.com/BitGo/BitGoJS/commit/241630c8f36c6c6441cda2dc01331de816196e39))
* **statics:** update token contract addresses ([85744bf](https://github.com/BitGo/BitGoJS/commit/85744bf3c66141cd3841259acb91d4f2eab1a958))
* **statics:** update Token Gog ([b3dde20](https://github.com/BitGo/BitGoJS/commit/b3dde20d5fbc2e768f4bfc23fad949e6dfdd7005))
* **statics:** update USDC and USDT name and address ([83c9b06](https://github.com/BitGo/BitGoJS/commit/83c9b0684499d0482b99301f74e69ff796123075))
* **statics:** update westend metadata ([a057ed5](https://github.com/BitGo/BitGoJS/commit/a057ed51b84819ad455469f29bf1774ed756ffe0))
* **statics:** wtk token contract update ([eadb5eb](https://github.com/BitGo/BitGoJS/commit/eadb5eb6f51a868411d2253b7525462e0e196f26))
* **stx:** remove 0 in memo ([7f5d531](https://github.com/BitGo/BitGoJS/commit/7f5d53159a6f54760799fb36d776f541c29d765e))
* **support flush coins:** support flushing coins ([2afcddf](https://github.com/BitGo/BitGoJS/commit/2afcddffd762d9e50343b234b736735eb23c6990))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))
* support validation of  base58 dot public keys ([a8fae0d](https://github.com/BitGo/BitGoJS/commit/a8fae0d0e69154327625a523afdc2b5f4e512cda))
* **terc token:** update decimal places for terc token ([d9d2de6](https://github.com/BitGo/BitGoJS/commit/d9d2de685296f3ec6e3ad40e53d04158540cd516))
* **Tron TransactionBuilder:** validateKey ([b42e67e](https://github.com/BitGo/BitGoJS/commit/b42e67e8f4dab69ef9984f539db12e84e0edb3da))
* **trx account lib:** add contract call builder ([01137d2](https://github.com/BitGo/BitGoJS/commit/01137d2be9ce535dd30482cd5d143f335e3369e1))
* **trx account lib:** inputs and outputs complement ([be2d51f](https://github.com/BitGo/BitGoJS/commit/be2d51fcc03c9945c25cd7c48d10dc774f9acfad))
* tss keychain creation ([93c33be](https://github.com/BitGo/BitGoJS/commit/93c33be9bdf62ef2bb676f04a509e564cf5c7725))
* unhardened derivation with tss ([ce29c26](https://github.com/BitGo/BitGoJS/commit/ce29c26bfcdbf9b1e015d8ef759ec1b2b29ccda9))
* **unspents:** add p2tr tests ([8a0f084](https://github.com/BitGo/BitGoJS/commit/8a0f0841eabd07478b6f40129e15e83954743fc9))
* **unspents:** classify p2tr script path sigs ([28d6860](https://github.com/BitGo/BitGoJS/commit/28d6860e1beedf0dd2ba0bb708530fd9032071fe))
* **unspents:** use `parsed.scriptType` parameter in fromInput ([84dd467](https://github.com/BitGo/BitGoJS/commit/84dd4670aaadb11fd966d4d3637f02b54d2c5ffc))
* update params to post /signatureshares ([49cdcdd](https://github.com/BitGo/BitGoJS/commit/49cdcdd9fb1af3f3cb316251fd0682740e31b390))
* update secp256k1 in core to ^4 ([bfb3128](https://github.com/BitGo/BitGoJS/commit/bfb3128131b19d07540174e6c250ae3b353ecd54))
* update tss key creation to support hd ([9611e5d](https://github.com/BitGo/BitGoJS/commit/9611e5dce0460d0fae691fbc90c887d3f8e720fd))
* update tss signing to support hd ([a3b3b3f](https://github.com/BitGo/BitGoJS/commit/a3b3b3fed18a462d85d11a6f0fd498edf0f699e2))
* **utxo-bin:** add package `utxo-bin` ([149f81c](https://github.com/BitGo/BitGoJS/commit/149f81c7452c93c2a0b7c221eb4a9dcd99befafd))
* **utxo-bin:** add support for odd transactions ([4c44297](https://github.com/BitGo/BitGoJS/commit/4c442974b5638f97db2ca013ecd887adaa9f8707))
* **utxo-bin:** use prevOutputs, spend status ([9f8bbfb](https://github.com/BitGo/BitGoJS/commit/9f8bbfbe7479e7bfde21532efb64c00379e485bd))
* **utxo-lib:** add `bitgo/wallet` package ([78aff6c](https://github.com/BitGo/BitGoJS/commit/78aff6c1260266ab4c7e1b84d07177e5237d2eaa))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([ee826bd](https://github.com/BitGo/BitGoJS/commit/ee826bd8f6ef96ad0b1f1986ac648f9498634ba8))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([5ea5758](https://github.com/BitGo/BitGoJS/commit/5ea5758fbadfc4d474d7fca627f2dde85e9d3514))
* **utxo-lib:** add `wallet/chains` ([0439a0d](https://github.com/BitGo/BitGoJS/commit/0439a0d4ffe4a15a9932ed70f98cc5745cc6526f))
* **utxo-lib:** add addressFormats ([c1bd457](https://github.com/BitGo/BitGoJS/commit/c1bd45796e0bae9c2fdd4964f2771812147f14d3))
* **utxo-lib:** add captured test fixtures ([0f98933](https://github.com/BitGo/BitGoJS/commit/0f98933cb21a501967ebc78411fb093221b51aa9))
* **utxo-lib:** add createSpendTransaction match test ([436104a](https://github.com/BitGo/BitGoJS/commit/436104aabcb256e1045afc263473a808af8467ca))
* **utxo-lib:** add createTransactionFromHex() ([a7c6032](https://github.com/BitGo/BitGoJS/commit/a7c6032c5f947c372d9a18fb44343c4e53b5ba27))
* **utxo-lib:** add getDefaultSigHash(network) ([bdb5ace](https://github.com/BitGo/BitGoJS/commit/bdb5acebf94bf91540c6491489c69c8f41a40cca))
* **utxo-lib:** add isSupportedScriptType(network, scriptType) ([ae53ab8](https://github.com/BitGo/BitGoJS/commit/ae53ab868c2bc9c9a64d628c5538861c08abef6f))
* **utxo-lib:** add more assertions to createOutputScript2of3 ([29e5735](https://github.com/BitGo/BitGoJS/commit/29e5735410e09a77ad6a178ffd5488fdd97a8828))
* **utxo-lib:** add p2tr output scripts support ([3aebc5b](https://github.com/BitGo/BitGoJS/commit/3aebc5b77052e02b2cd688d01935c7e199e25902))
* **utxo-lib:** add p2tr output scripts support ([7af9d9e](https://github.com/BitGo/BitGoJS/commit/7af9d9e6da4d6f2ba83b26794ba58ccaf4b738a9))
* **utxo-lib:** add padInputScript ([0c1be6e](https://github.com/BitGo/BitGoJS/commit/0c1be6e7bf37ef1bd6392b8492624cefc83e4f8c))
* **utxo-lib:** add ParsedSignatureScriptTaproot ([206c860](https://github.com/BitGo/BitGoJS/commit/206c860a98fa6393399a8d9d56cee63d9dbc5c72))
* **utxo-lib:** add property `scriptType` to ParsedSignatureScript ([c0b678f](https://github.com/BitGo/BitGoJS/commit/c0b678f2b28cf81e41399902a6bdb5e1592c4e3a))
* **utxo-lib:** add RPC tests ([1a9a9c5](https://github.com/BitGo/BitGoJS/commit/1a9a9c519e38d6eecaed572ff47f33d9dc25e50a))
* **utxo-lib:** add scriptPathLevel to ParsedSignatureScriptTaproot ([27cf563](https://github.com/BitGo/BitGoJS/commit/27cf563f7121f7306f39c9e3b3477c70c485f69d))
* **utxo-lib:** add scriptType argument for getDefaultSigHash ([87d5b7f](https://github.com/BitGo/BitGoJS/commit/87d5b7f521bffaf76885ab76c83be427cb6811be))
* **utxo-lib:** add scriptTypeForChain() ([e11cabe](https://github.com/BitGo/BitGoJS/commit/e11cabe06ef98311270131462142d78f13c73063))
* **utxo-lib:** add signature helpers, tests ([5ea779e](https://github.com/BitGo/BitGoJS/commit/5ea779e2983a7421d4ac9aeb02708aa414c7cc9a))
* **utxo-lib:** add signInput2Of3(), signInputP2shP2pk() ([e3927c0](https://github.com/BitGo/BitGoJS/commit/e3927c010bae3e8e142da15b2975493768135a3e))
* **utxo-lib:** add support for p2tr in signInput2Of3 ([7890854](https://github.com/BitGo/BitGoJS/commit/78908547f27ab52baa4f6e7c5d5561ecaf422863))
* **utxo-lib:** add support for PrevOutput[] in TransactionBuilder ([cdf1899](https://github.com/BitGo/BitGoJS/commit/cdf1899da3db97e6229e23373e1921b4634f44cf))
* **utxo-lib:** add support for Zcash version 5 "NU5" ([5d2c383](https://github.com/BitGo/BitGoJS/commit/5d2c383454383725bb57b7e676851cdfcba86521))
* **utxo-lib:** add test comparing rpc data to parsed data ([bd5fb7a](https://github.com/BitGo/BitGoJS/commit/bd5fb7aa550d5510ff062db94d342ebddb8890ef))
* **utxo-lib:** add test fixtures for special dash transactions ([0a655ae](https://github.com/BitGo/BitGoJS/commit/0a655aee64022b6f368f867445162b1f8f3cf4cd))
* **utxo-lib:** add tests for half-signed transactions ([c8e5222](https://github.com/BitGo/BitGoJS/commit/c8e52229115846303110f24421836500b1140bc9))
* **utxo-lib:** add thirdparty fixtures ([9d48994](https://github.com/BitGo/BitGoJS/commit/9d48994887aaa094fc2ee2cd375384c154473fab))
* **utxo-lib:** add verifySignatureWithPublicKeys ([4682727](https://github.com/BitGo/BitGoJS/commit/46827273ab457c4073cd468d9a33c39b128234a3))
* **utxo-lib:** add wrappers for Transaction(Builder) constructors ([62aafa9](https://github.com/BitGo/BitGoJS/commit/62aafa98e69b88a801d0fb5bb3e751391a426f44))
* **utxo-lib:** add zcash version 450 ([8f9d332](https://github.com/BitGo/BitGoJS/commit/8f9d332e6b7517cb132c7fc749b587c6aadcc201))
* **utxo-lib:** add, use parseTransactionRoundTrip ([fc2ece4](https://github.com/BitGo/BitGoJS/commit/fc2ece41ead787a9103cb74ffdf0132a3acd3a48))
* **utxo-lib:** allow select networks in integration_local_rpc ([dfc6696](https://github.com/BitGo/BitGoJS/commit/dfc66966a0c7c6e8be5cd5fca7250e30920a9beb))
* **utxo-lib:** export address check types ([411db60](https://github.com/BitGo/BitGoJS/commit/411db60aa0df6b85e253b59d1641476bac46a4df))
* **utxo-lib:** export type NetworkName ([df27a99](https://github.com/BitGo/BitGoJS/commit/df27a9951edf9a178594a388a353f6933beee053))
* **utxo-lib:** export, use BitcoinJSNetwork ([ce85f44](https://github.com/BitGo/BitGoJS/commit/ce85f44aad5e36903d29c66d7e3ec179c9c4f887))
* **utxo-lib:** expose lower-level signature validation methods ([4a2e276](https://github.com/BitGo/BitGoJS/commit/4a2e2769f6e8c9281e050e3a6e2df3ce498bf68b))
* **utxo-lib:** implement parseSignatureScript for p2tr ([d600c42](https://github.com/BitGo/BitGoJS/commit/d600c42a0cca9163b5a6611e7e9fd4d7fd995245))
* **utxo-lib:** improve p2tr readability, types ([81faf11](https://github.com/BitGo/BitGoJS/commit/81faf110d818f648796ca4c1d078b71149577d69))
* **utxo-lib:** move outputScripts to bitgo subpackage ([c1b0fa7](https://github.com/BitGo/BitGoJS/commit/c1b0fa722243d7d6c28ae0b7762387e24d234052))
* **utxo-lib:** support import from `src/bitgo` ([f5ca9dd](https://github.com/BitGo/BitGoJS/commit/f5ca9dde4c9435d483791fd6075f4cde41931f8f))
* **utxo-lib:** support p2shP2pk inputs ([f034ead](https://github.com/BitGo/BitGoJS/commit/f034ead6d4ca5d2a11bcd7c1c7042e6de5dd04de))
* **utxo-lib:** support schnorr signature verification ([6e24fd6](https://github.com/BitGo/BitGoJS/commit/6e24fd621a4d1a0a87a1f9ecaab61ce514cad857))
* **utxo-lib:** test createTransactionBuilderFromTransaction ([9761ec7](https://github.com/BitGo/BitGoJS/commit/9761ec7c5b7bc5460a6b7134406c6d3142fc515d))
* **utxo-lib:** use `ChainCode` for `WalletUnspent['chain']` ([6c9c73b](https://github.com/BitGo/BitGoJS/commit/6c9c73b13a32f847912d944748c2ef67fca913fe))
* **utxo-lib:** use new package name and new external links ([3805eee](https://github.com/BitGo/BitGoJS/commit/3805eee8abc955b1d92da00c650c684e1662ac19))
* **utxo:** accept txBuilder in signAndVerifyWalletTransaction ([61d8335](https://github.com/BitGo/BitGoJS/commit/61d8335c527615b6f80d57eed6ce7ffadf985d61))
* **utxolib:** add bitcoingoldTestnet ([06c1dd6](https://github.com/BitGo/BitGoJS/commit/06c1dd6f7ae9e738fedd398e7665b84c03daf46c)), closes [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L332](https://github.com//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L332) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L329](https://github.com//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L329) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L326](https://github.com//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L326) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L327](https://github.com//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L327) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L328](https://github.com//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L328) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h#L35](https://github.com//github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h/issues/L35)
* **utxolib:** implement padInputScript for p2wsh transactions ([f73f7ea](https://github.com/BitGo/BitGoJS/commit/f73f7eaebf1e675e9203beb383f35fc4193c130a))
* **utxo:** update createTaprootScript2of3 ([31bb3ed](https://github.com/BitGo/BitGoJS/commit/31bb3edfb2046daabeea14587cf7735c4c383783))
* **wp:** added support of cashaddr for create address ([fcdc261](https://github.com/BitGo/BitGoJS/commit/fcdc261df6187d9befb30c81ba6882056e9a9ffb))


### Reverts

* Revert "Revert "feat(account-lib): dot implementation"" ([0519e38](https://github.com/BitGo/BitGoJS/commit/0519e381222f8d5b8841114bdc0a34ec79c73950))
* Revert "chore(core): remove insecure modules from webpack" ([23143ca](https://github.com/BitGo/BitGoJS/commit/23143cac90e247f7f90286485cae7e5e741190e6))
* Revert "fix(account-lib): revert algorand tokens changes" ([cdb5539](https://github.com/BitGo/BitGoJS/commit/cdb5539bc0a68f6df112c7229c938b87f5bf6625))
* Revert "Revert "fix(core): use more correct edge case value in abstract utxo test"" ([5ca7405](https://github.com/BitGo/BitGoJS/commit/5ca7405acef847cd93269c671a60ce37274e34e4))
* Revert "Revert "feat(core): allow disabling paygo outputs during utxo tx verification"" ([85b7e1c](https://github.com/BitGo/BitGoJS/commit/85b7e1c6c82b7073ceea699973ea7ffdb2078b23))
* Revert "fix(core): set minimal required node version to 10.22.0" ([eec236f](https://github.com/BitGo/BitGoJS/commit/eec236f28c2d33647a329d253097222d1ab6fb35))
* Revert "feat: add STX coin to statics and core" ([90eee7b](https://github.com/BitGo/BitGoJS/commit/90eee7b247d8b05cada93104888097a13f681425))
* Revert "Fixed toJson usage in core module" ([c029984](https://github.com/BitGo/BitGoJS/commit/c0299847d72c4b0a744fb6a4cce40708bb226d34))
* Revert "BGA-297 Compose transaction/transactionBuilder for HBAR using" ([9a38f4d](https://github.com/BitGo/BitGoJS/commit/9a38f4dbdb450dbdeff8a1d29549b43de58a6424))
* Revert "BGA-324 Update toJson method" ([43170e2](https://github.com/BitGo/BitGoJS/commit/43170e2a4d702af1fd228476fea720ef25bbcb0a))
* Revert "BGA-324 Set body to be mandatory" ([8201971](https://github.com/BitGo/BitGoJS/commit/8201971ddd696bf361056ff59aecd79def28f928))
* Revert "Update lerna to fix yarn audit finding" ([4710597](https://github.com/BitGo/BitGoJS/commit/4710597bdeef8058ace4128d89c4edfd0419f878))
* Revert "Fix: Validation is a part of builder" ([10f990e](https://github.com/BitGo/BitGoJS/commit/10f990e681ccea2a543ff631a8972a69df56b985))
* Revert "Revert "BG-11787 use updateSingleKeychainPassword instead of changeSingleKeychainPassword and fix unit tests"" ([a4873da](https://github.com/BitGo/BitGoJS/commit/a4873da71384467e66660b790f3bd17c0c7cd9fe))
* Revert "BG-8668: Add total and per-input signature counts to `explainTransaction`" ([4f4d9aa](https://github.com/BitGo/BitGoJS/commit/4f4d9aac3a04555e4c893d68f8ee2c5c4a258b1c))
* **core:** proper fix found for the stx transaction memo field test ([ca0a29e](https://github.com/BitGo/BitGoJS/commit/ca0a29ef7a953d3665daced83e5982280b20f093))
* **core:** revert isValidPub test with extended keys; needs an account-lib update ([cad98a5](https://github.com/BitGo/BitGoJS/commit/cad98a5ee0c7b4ad7d27a5477c995325b06485c4))
* don't initialize stx in the coinFactory just yet ([1ef2c5f](https://github.com/BitGo/BitGoJS/commit/1ef2c5febb8bc606fc7d51f807e0bb812b11ac58))
* return master branch package versions to non-rc versions ([5a0ca2b](https://github.com/BitGo/BitGoJS/commit/5a0ca2bda526fad472fe10290610783ae986982b))


### BREAKING CHANGES

* **account-lib:** Builder method changing

STLX-14028
* **core:** Methods that previously implemented `verifyAddress` incorrectly will
now throw `MethodNotImplementedError()` instead.

Issue: BG-43225
* **account-lib:** BlsKeyPair is not just a default prv and pub object, instead it has an array of
secretShares and a publicShare which should be merged with the other BLS key pairs to get the common
public key and the private key of each keypair.

BG-35989
* **utxo-lib:** * The namespace `utxolib.coins` is removed

Issue: BG-40432
* **utxo-lib:** Removes these methods from AbstractUtxoCoin:

* `supportsP2sh()`
* `supportsP2shP2wsh()`
* `supportsP2wsh()`
* `supportsP2tr()`

Use `supportsAddressType(ScriptType2Of3)` instead.

Issue: BG-38773
* * `AbstractUtxoCoin.prototype.signTransaction()` now requires the
  parameter `pubs` (wallet xpub triple)
* `Wallet.prototype.signTransaction()` drops properties
  `userKeychain`/`backupKeychain`/`bitgoKeychain`. It accepts the
  optional parameter `pubs` instead (wallet xpub triple).

Issue: BG-38773
* **core:** bluebird-specific promise methods are no longer present
on the `get`/`post`/`put`/`del`/`patch` request helper methods on BitGo
objects.
* **core:** remove support for callbacks to async fns

Native promises don't support the `asCallback` or `nodeify` helpers that
are on Bluebird promises. We will need to add a compatiblity layer for
these since we don't (yet) want to entirely deprecate support for
callback style usage of Bitgo object methods, but for now let's remove
all the callback params and make everything work correctly as regular
async functions.

We still want the current API surface to remain callback compatible for
the moment, so convert from raw promises to bluebird promises where
callbacks are needed.

Ticket; BG-31214
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992



## [2.1.3](https://github.com/BitGo/BitGoJS/compare/4.34.0...v2.1.3) (2018-08-10)



# [4.24.0](https://github.com/BitGo/BitGoJS/compare/4.23.0...4.24.0) (2018-04-10)



# [4.23.0](https://github.com/BitGo/BitGoJS/compare/4.22.0...4.23.0) (2018-03-28)



# [4.22.0](https://github.com/BitGo/BitGoJS/compare/4.21.0...4.22.0) (2018-03-14)



# [4.20.0](https://github.com/BitGo/BitGoJS/compare/4.19.0...4.20.0) (2018-02-14)



## [1.1.7](https://github.com/BitGo/BitGoJS/compare/v1.1.6...v1.1.7) (2018-01-22)



## [1.1.6](https://github.com/BitGo/BitGoJS/compare/v1.1.5...v1.1.6) (2018-01-22)



## [1.1.5](https://github.com/BitGo/BitGoJS/compare/4.18.1...v1.1.5) (2018-01-20)



## [4.17.1](https://github.com/BitGo/BitGoJS/compare/4.17.0...4.17.1) (2018-01-02)



# [4.17.0](https://github.com/BitGo/BitGoJS/compare/4.16.0...4.17.0) (2017-12-21)



# [4.16.0](https://github.com/BitGo/BitGoJS/compare/4.15.0...4.16.0) (2017-12-19)



# [4.15.0](https://github.com/BitGo/BitGoJS/compare/4.13.0...4.15.0) (2017-11-17)



# [4.13.0](https://github.com/BitGo/BitGoJS/compare/4.12.0...4.13.0) (2017-11-09)



# [4.12.0](https://github.com/BitGo/BitGoJS/compare/4.11.0...4.12.0) (2017-10-30)



# [4.11.0](https://github.com/BitGo/BitGoJS/compare/4.10.0...4.11.0) (2017-10-20)



# [4.10.0](https://github.com/BitGo/BitGoJS/compare/4.9.0...4.10.0) (2017-10-10)



# [4.9.0](https://github.com/BitGo/BitGoJS/compare/v4.9.0...4.9.0) (2017-10-05)



# [4.9.0](https://github.com/BitGo/BitGoJS/compare/4.8.0...v4.9.0) (2017-10-05)



# [4.8.0](https://github.com/BitGo/BitGoJS/compare/4.7.0...4.8.0) (2017-10-05)



# [4.7.0](https://github.com/BitGo/BitGoJS/compare/4.6.0...4.7.0) (2017-10-04)



# [4.6.0](https://github.com/BitGo/BitGoJS/compare/4.4.3...4.6.0) (2017-09-30)


### Reverts

* Revert "Improved error message" ([2c4b5d1](https://github.com/BitGo/BitGoJS/commit/2c4b5d1f6acf8462f2f130e9be9bf6cdcadbe288))



## [4.4.3](https://github.com/BitGo/BitGoJS/compare/4.4.2...4.4.3) (2017-09-21)



## [4.4.2](https://github.com/BitGo/BitGoJS/compare/v1.1.4...4.4.2) (2017-09-20)



## [1.1.4](https://github.com/BitGo/BitGoJS/compare/v4.4.1...v1.1.4) (2017-09-15)



## [4.4.1](https://github.com/BitGo/BitGoJS/compare/4.4.1...v4.4.1) (2017-09-13)



# [4.4.0](https://github.com/BitGo/BitGoJS/compare/v4.4.0...4.4.0) (2017-09-13)



# [4.4.0](https://github.com/BitGo/BitGoJS/compare/4.3.1...v4.4.0) (2017-09-13)



## [4.3.1](https://github.com/BitGo/BitGoJS/compare/4.3.0...4.3.1) (2017-09-11)



# [4.3.0](https://github.com/BitGo/BitGoJS/compare/4.2.2...4.3.0) (2017-09-09)



## [4.2.2](https://github.com/BitGo/BitGoJS/compare/4.2.1...4.2.2) (2017-09-06)



## [4.2.1](https://github.com/BitGo/BitGoJS/compare/4.1.3...4.2.1) (2017-09-06)



## [4.1.3](https://github.com/BitGo/BitGoJS/compare/4.1.2...4.1.3) (2017-09-05)



## [4.1.2](https://github.com/BitGo/BitGoJS/compare/4.1.0...4.1.2) (2017-09-04)



# [4.1.0](https://github.com/BitGo/BitGoJS/compare/4.0.0...4.1.0) (2017-08-28)



# [4.0.0](https://github.com/BitGo/BitGoJS/compare/3.5.1...4.0.0) (2017-08-23)



## [3.5.1](https://github.com/BitGo/BitGoJS/compare/3.5.0...3.5.1) (2017-08-10)



# [3.5.0](https://github.com/BitGo/BitGoJS/compare/3.4.15...3.5.0) (2017-08-08)



## [3.4.15](https://github.com/BitGo/BitGoJS/compare/3.4.14...3.4.15) (2017-08-08)



## [3.4.14](https://github.com/BitGo/BitGoJS/compare/3.4.11...3.4.14) (2017-08-07)



## [3.4.11](https://github.com/BitGo/BitGoJS/compare/3.4.10...3.4.11) (2017-08-04)



## [3.4.10](https://github.com/BitGo/BitGoJS/compare/3.4.9...3.4.10) (2017-08-03)



## [3.4.9](https://github.com/BitGo/BitGoJS/compare/3.4.8...3.4.9) (2017-07-28)



## [3.4.8](https://github.com/BitGo/BitGoJS/compare/3.4.7...3.4.8) (2017-07-25)



## [3.4.7](https://github.com/BitGo/BitGoJS/compare/3.4.6...3.4.7) (2017-07-24)



## [3.4.6](https://github.com/BitGo/BitGoJS/compare/3.4.4...3.4.6) (2017-07-14)



## [3.4.4](https://github.com/BitGo/BitGoJS/compare/3.4.3...3.4.4) (2017-07-07)



## [3.4.3](https://github.com/BitGo/BitGoJS/compare/3.4.2...3.4.3) (2017-07-07)



## [3.4.2](https://github.com/BitGo/BitGoJS/compare/3.4.1...3.4.2) (2017-07-06)



## [3.4.1](https://github.com/BitGo/BitGoJS/compare/3.4.0...3.4.1) (2017-07-05)



# [3.4.0](https://github.com/BitGo/BitGoJS/compare/v1.1.3...3.4.0) (2017-06-16)



## [1.1.3](https://github.com/BitGo/BitGoJS/compare/3.3.6...v1.1.3) (2017-06-15)


### Reverts

* Revert "2.0.0" - WASM too big to load sync in browser ([70db5d3](https://github.com/BitGo/BitGoJS/commit/70db5d328428aa2eba0c2b9738a47d23d138bb69))
* Revert "use sync wasm loading" ([a4b3217](https://github.com/BitGo/BitGoJS/commit/a4b32178ee94299416d28f0db65cc4a613c68f11))



## [3.3.6](https://github.com/BitGo/BitGoJS/compare/3.3.5...3.3.6) (2017-06-14)



## [3.3.5](https://github.com/BitGo/BitGoJS/compare/v1.1.2...3.3.5) (2017-06-14)



## [1.1.2](https://github.com/BitGo/BitGoJS/compare/v1.1.1...v1.1.2) (2017-06-11)



## [1.1.1](https://github.com/BitGo/BitGoJS/compare/v2.1.2...v1.1.1) (2017-06-11)



## [2.1.2](https://github.com/BitGo/BitGoJS/compare/v2.1.1...v2.1.2) (2017-06-11)



## [2.1.1](https://github.com/BitGo/BitGoJS/compare/v2.1.0...v2.1.1) (2017-06-11)



# [2.1.0](https://github.com/BitGo/BitGoJS/compare/v2.0.1...v2.1.0) (2017-06-11)



## [2.0.1](https://github.com/BitGo/BitGoJS/compare/v2.0.0...v2.0.1) (2017-06-11)



# [2.0.0](https://github.com/BitGo/BitGoJS/compare/3.3.3...v2.0.0) (2017-06-11)



## [3.3.3](https://github.com/BitGo/BitGoJS/compare/v1.2.0...3.3.3) (2017-06-08)



# [1.2.0](https://github.com/BitGo/BitGoJS/compare/v1.1.0...v1.2.0) (2017-06-06)



# [1.1.0](https://github.com/BitGo/BitGoJS/compare/3.3.1...v1.1.0) (2017-06-06)



## [3.3.1](https://github.com/BitGo/BitGoJS/compare/3.3.0...3.3.1) (2017-06-02)



# [3.3.0](https://github.com/BitGo/BitGoJS/compare/3.2.10...3.3.0) (2017-06-02)



## [3.2.10](https://github.com/BitGo/BitGoJS/compare/3.2.9...3.2.10) (2017-06-01)



## [3.2.9](https://github.com/BitGo/BitGoJS/compare/v1.0.0...3.2.9) (2017-06-01)



# [1.0.0](https://github.com/BitGo/BitGoJS/compare/3.2.8...v1.0.0) (2017-05-29)



## [3.2.8](https://github.com/BitGo/BitGoJS/compare/3.2.7...3.2.8) (2017-05-18)



## [3.2.7](https://github.com/BitGo/BitGoJS/compare/3.2.5...3.2.7) (2017-05-17)



## [3.2.5](https://github.com/BitGo/BitGoJS/compare/3.2.3...3.2.5) (2017-05-16)



## [3.2.3](https://github.com/BitGo/BitGoJS/compare/3.2.2...3.2.3) (2017-05-15)



## [3.2.2](https://github.com/BitGo/BitGoJS/compare/3.2.1...3.2.2) (2017-05-15)



## [3.2.1](https://github.com/BitGo/BitGoJS/compare/3.2.0...3.2.1) (2017-05-12)



# [3.2.0](https://github.com/BitGo/BitGoJS/compare/3.1.2...3.2.0) (2017-05-12)



## [3.1.2](https://github.com/BitGo/BitGoJS/compare/3.1.0...3.1.2) (2017-05-09)



# [3.1.0](https://github.com/BitGo/BitGoJS/compare/3.0.6...3.1.0) (2017-05-01)



## [3.0.6](https://github.com/BitGo/BitGoJS/compare/3.0.5...3.0.6) (2017-04-28)



## [3.0.5](https://github.com/BitGo/BitGoJS/compare/3.0.3...3.0.5) (2017-04-27)



## [3.0.3](https://github.com/BitGo/BitGoJS/compare/2.2.4...3.0.3) (2017-04-20)



## [2.2.4](https://github.com/BitGo/BitGoJS/compare/2.2.3...2.2.4) (2017-04-03)



## [2.2.3](https://github.com/BitGo/BitGoJS/compare/2.2.2...2.2.3) (2017-03-26)



## [2.2.2](https://github.com/BitGo/BitGoJS/compare/2.2.1...2.2.2) (2017-03-24)



## [2.2.1](https://github.com/BitGo/BitGoJS/compare/2.2.0...2.2.1) (2017-03-21)



# [2.2.0](https://github.com/BitGo/BitGoJS/compare/2.1.11...2.2.0) (2017-03-02)



## [2.1.11](https://github.com/BitGo/BitGoJS/compare/2.1.10...2.1.11) (2017-03-02)



## [2.1.10](https://github.com/BitGo/BitGoJS/compare/2.1.8...2.1.10) (2017-02-24)



## [2.1.8](https://github.com/BitGo/BitGoJS/compare/2.1.7...2.1.8) (2017-02-22)



## [2.1.7](https://github.com/BitGo/BitGoJS/compare/2.1.6...2.1.7) (2017-02-08)



## [2.1.6](https://github.com/BitGo/BitGoJS/compare/2.1.5...2.1.6) (2017-02-06)



## [2.1.5](https://github.com/BitGo/BitGoJS/compare/2.1.4...2.1.5) (2017-01-06)



## [2.1.4](https://github.com/BitGo/BitGoJS/compare/2.1.2...2.1.4) (2017-01-04)



## [2.1.2](https://github.com/BitGo/BitGoJS/compare/2.1.1...2.1.2) (2016-12-27)



## [2.1.1](https://github.com/BitGo/BitGoJS/compare/2.1.0...2.1.1) (2016-12-22)



# [2.1.0](https://github.com/BitGo/BitGoJS/compare/2.0.5...2.1.0) (2016-12-16)



## [2.0.5](https://github.com/BitGo/BitGoJS/compare/2.0.4...2.0.5) (2016-12-01)



## [2.0.4](https://github.com/BitGo/BitGoJS/compare/2.0.3...2.0.4) (2016-10-17)



## [2.0.3](https://github.com/BitGo/BitGoJS/compare/2.0.2...2.0.3) (2016-08-26)



## [2.0.2](https://github.com/BitGo/BitGoJS/compare/2.0.1...2.0.2) (2016-08-19)



## [2.0.1](https://github.com/BitGo/BitGoJS/compare/2.0.0...2.0.1) (2016-07-26)



# [2.0.0](https://github.com/BitGo/BitGoJS/compare/1.8.0...2.0.0) (2016-07-02)



# [1.8.0](https://github.com/BitGo/BitGoJS/compare/1.7.0...1.8.0) (2016-05-27)



# [1.7.0](https://github.com/BitGo/BitGoJS/compare/1.6.1...1.7.0) (2016-05-21)



## [1.6.1](https://github.com/BitGo/BitGoJS/compare/1.6.0...1.6.1) (2016-05-10)



# [1.6.0](https://github.com/BitGo/BitGoJS/compare/1.5.4...1.6.0) (2016-05-10)



## [1.5.4](https://github.com/BitGo/BitGoJS/compare/1.5.3...1.5.4) (2016-05-02)



## [1.5.3](https://github.com/BitGo/BitGoJS/compare/1.5.1...1.5.3) (2016-04-27)



## [1.5.1](https://github.com/BitGo/BitGoJS/compare/1.5.0...1.5.1) (2016-04-27)



# [1.5.0](https://github.com/BitGo/BitGoJS/compare/1.4.0...1.5.0) (2016-04-27)



# [1.4.0](https://github.com/BitGo/BitGoJS/compare/1.3.0...1.4.0) (2016-04-20)



# [1.3.0](https://github.com/BitGo/BitGoJS/compare/1.2.1...1.3.0) (2016-04-12)



## [1.2.1](https://github.com/BitGo/BitGoJS/compare/1.0.0...1.2.1) (2016-04-11)



# [1.0.0](https://github.com/BitGo/BitGoJS/compare/0.13.0...1.0.0) (2016-03-22)



# [0.13.0](https://github.com/BitGo/BitGoJS/compare/0.12.0...0.13.0) (2016-03-18)



# [0.12.0](https://github.com/BitGo/BitGoJS/compare/0.11.72...0.12.0) (2016-03-07)



## [0.11.72](https://github.com/BitGo/BitGoJS/compare/0.11.70...0.11.72) (2016-03-04)



## [0.11.70](https://github.com/BitGo/BitGoJS/compare/0.11.68...0.11.70) (2016-03-02)



## [0.11.68](https://github.com/BitGo/BitGoJS/compare/0.11.67...0.11.68) (2016-03-01)



## [0.11.67](https://github.com/BitGo/BitGoJS/compare/0.11.66...0.11.67) (2016-02-25)



## [0.11.66](https://github.com/BitGo/BitGoJS/compare/0.11.65...0.11.66) (2016-02-23)



## [0.11.65](https://github.com/BitGo/BitGoJS/compare/0.11.64...0.11.65) (2016-02-18)



## [0.11.64](https://github.com/BitGo/BitGoJS/compare/0.11.63...0.11.64) (2016-01-16)



## [0.11.63](https://github.com/BitGo/BitGoJS/compare/0.11.62...0.11.63) (2016-01-16)



## [0.11.62](https://github.com/BitGo/BitGoJS/compare/0.11.60...0.11.62) (2015-12-22)



## [0.11.60](https://github.com/BitGo/BitGoJS/compare/0.11.59...0.11.60) (2015-12-18)



## [0.11.59](https://github.com/BitGo/BitGoJS/compare/0.11.58...0.11.59) (2015-12-18)



## [0.11.58](https://github.com/BitGo/BitGoJS/compare/0.11.57...0.11.58) (2015-12-17)



## [0.11.57](https://github.com/BitGo/BitGoJS/compare/0.11.47...0.11.57) (2015-12-17)



## [0.11.47](https://github.com/BitGo/BitGoJS/compare/0.11.45...0.11.47) (2015-11-17)



## [0.11.45](https://github.com/BitGo/BitGoJS/compare/0.11.42...0.11.45) (2015-10-30)



## [0.11.42](https://github.com/BitGo/BitGoJS/compare/0.11.41...0.11.42) (2015-09-23)



## [0.11.41](https://github.com/BitGo/BitGoJS/compare/0.11.40...0.11.41) (2015-09-23)



## [0.11.40](https://github.com/BitGo/BitGoJS/compare/0.11.38...0.11.40) (2015-09-22)



## [0.11.38](https://github.com/BitGo/BitGoJS/compare/0.11.36...0.11.38) (2015-09-21)



## [0.11.36](https://github.com/BitGo/BitGoJS/compare/0.11.35...0.11.36) (2015-09-14)



## [0.11.35](https://github.com/BitGo/BitGoJS/compare/0.11.34...0.11.35) (2015-09-10)



## [0.11.34](https://github.com/BitGo/BitGoJS/compare/0.11.33...0.11.34) (2015-09-02)



## [0.11.33](https://github.com/BitGo/BitGoJS/compare/0.11.32...0.11.33) (2015-08-28)



## [0.11.32](https://github.com/BitGo/BitGoJS/compare/0.11.31...0.11.32) (2015-08-20)



## [0.11.31](https://github.com/BitGo/BitGoJS/compare/0.11.30...0.11.31) (2015-08-17)



## [0.11.30](https://github.com/BitGo/BitGoJS/compare/0.11.29...0.11.30) (2015-08-14)



## [0.11.29](https://github.com/BitGo/BitGoJS/compare/0.11.28...0.11.29) (2015-08-14)



## [0.11.28](https://github.com/BitGo/BitGoJS/compare/0.11.27...0.11.28) (2015-08-14)



## [0.11.27](https://github.com/BitGo/BitGoJS/compare/0.11.26...0.11.27) (2015-07-31)



## [0.11.26](https://github.com/BitGo/BitGoJS/compare/0.11.25...0.11.26) (2015-07-31)



## [0.11.25](https://github.com/BitGo/BitGoJS/compare/0.11.24...0.11.25) (2015-07-21)



## [0.11.24](https://github.com/BitGo/BitGoJS/compare/0.11.23...0.11.24) (2015-07-17)



## [0.11.23](https://github.com/BitGo/BitGoJS/compare/0.11.22...0.11.23) (2015-07-16)



## [0.11.22](https://github.com/BitGo/BitGoJS/compare/0.11.21...0.11.22) (2015-07-08)



## [0.11.21](https://github.com/BitGo/BitGoJS/compare/0.11.20...0.11.21) (2015-07-08)



## [0.11.20](https://github.com/BitGo/BitGoJS/compare/0.11.19...0.11.20) (2015-07-08)



## [0.11.19](https://github.com/BitGo/BitGoJS/compare/0.11.18...0.11.19) (2015-06-26)



## [0.11.18](https://github.com/BitGo/BitGoJS/compare/0.11.17...0.11.18) (2015-06-22)



## [0.11.17](https://github.com/BitGo/BitGoJS/compare/0.11.16...0.11.17) (2015-06-12)



## [0.11.16](https://github.com/BitGo/BitGoJS/compare/0.11.15...0.11.16) (2015-06-05)



## [0.11.15](https://github.com/BitGo/BitGoJS/compare/0.11.14...0.11.15) (2015-06-05)



## [0.11.14](https://github.com/BitGo/BitGoJS/compare/0.11.13...0.11.14) (2015-06-04)



## [0.11.13](https://github.com/BitGo/BitGoJS/compare/0.11.12...0.11.13) (2015-06-02)



## [0.11.12](https://github.com/BitGo/BitGoJS/compare/0.11.11...0.11.12) (2015-06-02)



## [0.11.11](https://github.com/BitGo/BitGoJS/compare/0.11.10...0.11.11) (2015-05-29)



## [0.11.10](https://github.com/BitGo/BitGoJS/compare/0.11.9...0.11.10) (2015-05-28)



## [0.11.9](https://github.com/BitGo/BitGoJS/compare/0.11.8...0.11.9) (2015-05-28)



## [0.11.8](https://github.com/BitGo/BitGoJS/compare/0.11.7...0.11.8) (2015-05-24)



## [0.11.7](https://github.com/BitGo/BitGoJS/compare/0.11.6...0.11.7) (2015-05-20)



## [0.11.6](https://github.com/BitGo/BitGoJS/compare/0.11.5...0.11.6) (2015-05-16)



## [0.11.5](https://github.com/BitGo/BitGoJS/compare/0.11.3...0.11.5) (2015-05-07)



## [0.11.3](https://github.com/BitGo/BitGoJS/compare/0.11.2...0.11.3) (2015-05-06)



## [0.11.2](https://github.com/BitGo/BitGoJS/compare/0.11.1...0.11.2) (2015-05-04)



## [0.11.1](https://github.com/BitGo/BitGoJS/compare/v0.11.0...0.11.1) (2015-04-20)



# [0.11.0](https://github.com/BitGo/BitGoJS/compare/v0.10.0...v0.11.0) (2015-04-15)



# [0.10.0](https://github.com/BitGo/BitGoJS/compare/0.9.26...v0.10.0) (2015-04-10)



## [0.9.26](https://github.com/BitGo/BitGoJS/compare/0.9.25...0.9.26) (2015-02-19)



## [0.9.25](https://github.com/BitGo/BitGoJS/compare/0.9.24...0.9.25) (2015-02-18)



## [0.9.24](https://github.com/BitGo/BitGoJS/compare/0.9.23...0.9.24) (2015-02-18)



## [0.9.23](https://github.com/BitGo/BitGoJS/compare/0.9.22...0.9.23) (2015-02-13)



## [0.9.22](https://github.com/BitGo/BitGoJS/compare/0.9.21...0.9.22) (2015-02-11)



## [0.9.21](https://github.com/BitGo/BitGoJS/compare/0.9.20...0.9.21) (2015-02-04)



## [0.9.20](https://github.com/BitGo/BitGoJS/compare/0.9.19...0.9.20) (2015-02-03)



## [0.9.19](https://github.com/BitGo/BitGoJS/compare/0.9.18...0.9.19) (2015-02-03)



## [0.9.18](https://github.com/BitGo/BitGoJS/compare/0.9.16...0.9.18) (2015-01-30)



## [0.9.16](https://github.com/BitGo/BitGoJS/compare/v0.9.15...0.9.16) (2015-01-29)



## [0.9.15](https://github.com/BitGo/BitGoJS/compare/v0.9.13...v0.9.15) (2015-01-29)



## [0.9.13](https://github.com/BitGo/BitGoJS/compare/v0.9.11...v0.9.13) (2015-01-27)



## [0.9.11](https://github.com/BitGo/BitGoJS/compare/v0.9.10...v0.9.11) (2015-01-16)



## [0.9.10](https://github.com/BitGo/BitGoJS/compare/v0.9.9...v0.9.10) (2015-01-16)



## [0.9.9](https://github.com/BitGo/BitGoJS/compare/v0.9.8...v0.9.9) (2015-01-13)



## [0.9.8](https://github.com/BitGo/BitGoJS/compare/v0.9.5...v0.9.8) (2015-01-10)



## [0.9.5](https://github.com/BitGo/BitGoJS/compare/v0.9.4...v0.9.5) (2015-01-09)



## [0.9.4](https://github.com/BitGo/BitGoJS/compare/v0.9.3...v0.9.4) (2015-01-09)



## [0.9.3](https://github.com/BitGo/BitGoJS/compare/v0.9.2...v0.9.3) (2015-01-08)



## [0.9.2](https://github.com/BitGo/BitGoJS/compare/v0.9.1...v0.9.2) (2015-01-08)



## [0.9.1](https://github.com/BitGo/BitGoJS/compare/v0.9.0...v0.9.1) (2015-01-08)



# 0.9.0 (2014-12-31)



## [14.0.0](https://github.com/BitGo/BitGoJS/compare/1.9.1...14.0.0) (2022-04-26)


### ⚠ BREAKING CHANGES

* **account-lib:** Builder method changing

STLX-14028
* **core:** Methods that previously implemented `verifyAddress` incorrectly will
now throw `MethodNotImplementedError()` instead.

Issue: BG-43225
* **account-lib:** BlsKeyPair is not just a default prv and pub object, instead it has an array of
secretShares and a publicShare which should be merged with the other BLS key pairs to get the common
public key and the private key of each keypair.

BG-35989
* **utxo-lib:** * The namespace `utxolib.coins` is removed

Issue: BG-40432
* **utxo-lib:** Removes these methods from AbstractUtxoCoin:

* `supportsP2sh()`
* `supportsP2shP2wsh()`
* `supportsP2wsh()`
* `supportsP2tr()`

Use `supportsAddressType(ScriptType2Of3)` instead.

Issue: BG-38773
* **core:** * `AbstractUtxoCoin.prototype.signTransaction()` now requires the
  parameter `pubs` (wallet xpub triple)
* `Wallet.prototype.signTransaction()` drops properties
  `userKeychain`/`backupKeychain`/`bitgoKeychain`. It accepts the
  optional parameter `pubs` instead (wallet xpub triple).

Issue: BG-38773
* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript
* **core:** bluebird-specific promise methods are no longer present
on the `get`/`post`/`put`/`del`/`patch` request helper methods on BitGo
objects.
* **core:** remove support for callbacks to async fns

Native promises don't support the `asCallback` or `nodeify` helpers that
are on Bluebird promises. We will need to add a compatiblity layer for
these since we don't (yet) want to entirely deprecate support for
callback style usage of Bitgo object methods, but for now let's remove
all the callback params and make everything work correctly as regular
async functions.

We still want the current API surface to remain callback compatible for
the moment, so convert from raw promises to bluebird promises where
callbacks are needed.

Ticket; BG-31214
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992

### Features

* **account lib:** add new fee model to transaction builder ([6ae88c0](https://github.com/BitGo/BitGoJS/commit/6ae88c057565f23e5c4aca39d7e01bf58aa4fa0a))
* **account lib:** adding multisigAddress ([547518c](https://github.com/BitGo/BitGoJS/commit/547518cbdecdbec4c1a368052e274e8f288f41d0))
* **account lib:** get trx fee limit from statics ([55f43b1](https://github.com/BitGo/BitGoJS/commit/55f43b1547f7f30fb2c5dd26587745b07b9694e6))
* **account lib:** implemented happy path for transfer transaction ([61f3bd5](https://github.com/BitGo/BitGoJS/commit/61f3bd5124ac7d2532726ec07975e5f6f545566e))
* **account lib:** stlx-657 implemented wallet initialization builder ([b6e5a02](https://github.com/BitGo/BitGoJS/commit/b6e5a0215137e63b30bd75206651094b1cc8fe6a))
* **account-lib and core:** fix commets  and refactor ([d1f6859](https://github.com/BitGo/BitGoJS/commit/d1f6859ee81d2997bb11810405b577f33729c5e4))
* **account-lib:** add algo transaction ([5d180bc](https://github.com/BitGo/BitGoJS/commit/5d180bcec8aaaac459a3257d31bacae7b73b40c3))
* **account-lib:** add algo transfer builder ([89f238a](https://github.com/BitGo/BitGoJS/commit/89f238a39271674173f57e7b5feedd56b3acf7cf))
* **account-lib:** add algo txn validation methods to txn builder ([b43b8b2](https://github.com/BitGo/BitGoJS/commit/b43b8b2c7b76ab30b48cec5f7768beb7001e8ed0))
* **account-lib:** add anonymous proxy txn builder STLX-11137 ([692c062](https://github.com/BitGo/BitGoJS/commit/692c062beb5b8e9df856c1f1cba3829f073b1641))
* **account-lib:** add asset transfer builder implementation ([8919ce5](https://github.com/BitGo/BitGoJS/commit/8919ce50d0b91c0b6073c0b9abe17a90d3f32700))
* **account-lib:** add AvaxWalletSimple.sol ABI to walletUtil.ts ([28e5007](https://github.com/BitGo/BitGoJS/commit/28e50073061222627795e4dfdcd6a9351919ffcf))
* **account-lib:** add batch txn builder for DOT ([c259b9d](https://github.com/BitGo/BitGoJS/commit/c259b9d815da67c7e21cda59b53412417d27e3ee))
* **account-lib:** add claim for dot staking ([34ca211](https://github.com/BitGo/BitGoJS/commit/34ca2116304ed638871f9b294befcfecbeb1854d))
* **account-lib:** add close remainder to ([2c5694f](https://github.com/BitGo/BitGoJS/commit/2c5694ff275b2042697447ef44311fde9c21ddb6))
* **account-lib:** add deactivate builder ([eeab032](https://github.com/BitGo/BitGoJS/commit/eeab03288a6fd35f4db7f9627f85bfd696e32680))
* **account-lib:** add DelegateBuilder and UndelegateBuilder ([6b7a083](https://github.com/BitGo/BitGoJS/commit/6b7a083818e51c5530ad4bc65bf08c22d83cea83))
* **account-lib:** add deposit and stake builder for near ([10d6d1e](https://github.com/BitGo/BitGoJS/commit/10d6d1e0c63d01e192e8ea4979bf8386736eaee8))
* **account-lib:** add encodeAddress in account-lib and unit test ([90ae1ab](https://github.com/BitGo/BitGoJS/commit/90ae1ab9225955812d1b468bd16d3158fc794c63))
* **account-lib:** add estimate size ([b9f6752](https://github.com/BitGo/BitGoJS/commit/b9f67525eccf67d37de8ae5eed456342737a3ff1))
* **account-lib:** add explain transaction for Near ([adfa88b](https://github.com/BitGo/BitGoJS/commit/adfa88b46a1312c9c9f02cff650f761e27da37b6))
* **account-lib:** add from publicKey in stx contract buidler ([5e78a9d](https://github.com/BitGo/BitGoJS/commit/5e78a9df615d8a04a01f7cebc9d34954d2838b88))
* **account-lib:** add fromPubKey in stx transactionBuilder ([ff7a534](https://github.com/BitGo/BitGoJS/commit/ff7a534e5b5e59b8fb31c52f4159f025fe6a7903))
* **account-lib:** add function to remove prefix from signature algorithm ([958003a](https://github.com/BitGo/BitGoJS/commit/958003aa58ce9ac7c38c6fe673967ac0ad0e1e72))
* **account-lib:** add functions to validate and pad transactions memos for STX ([b8a8a85](https://github.com/BitGo/BitGoJS/commit/b8a8a8518023a7529f25361706c7d1f97c662383))
* **account-lib:** add genesisID and genesisHash to toJson() ([ea54d43](https://github.com/BitGo/BitGoJS/commit/ea54d4330df09e21d90e1480c30ff3a449db6d93))
* **account-lib:** add getSTXAddressFromPubKeys -- generate an address for multisig transactions ([b58d55e](https://github.com/BitGo/BitGoJS/commit/b58d55eea84055d9a5781f674afcfc398b38185b))
* **account-lib:** add getTxHash to dot utils ([3798123](https://github.com/BitGo/BitGoJS/commit/379812358f523227627dd45b657b3dc0eb7067af))
* **account-lib:** add implementation methods to txn builder ([102db02](https://github.com/BitGo/BitGoJS/commit/102db02a30cd4e74b061a91dd89e711519712810))
* **account-lib:** add key factory for coins ([82be006](https://github.com/BitGo/BitGoJS/commit/82be006dde732cfba53f72aa46c6350d53b80e14))
* **account-lib:** add keyreg builder ([f055d2d](https://github.com/BitGo/BitGoJS/commit/f055d2d928009a36edebb8c0fce53e3e998bbe62))
* **account-lib:** add latest version of algo-sdk ([871641c](https://github.com/BitGo/BitGoJS/commit/871641cd590f16d953b125c7a2d1bb377baac108))
* **account-lib:** add method to retrieve algosdk suggested params ([fde7c33](https://github.com/BitGo/BitGoJS/commit/fde7c33856c7d1388d778ba230aa9f170afd4b6a))
* **account-lib:** add NEAR keypair ([8586b10](https://github.com/BitGo/BitGoJS/commit/8586b10f51147f2c9862614ec8eff9d95163a73b))
* **account-lib:** add NEAR transaction builder ([3badcbd](https://github.com/BitGo/BitGoJS/commit/3badcbdb974a62c26aa96a10d627aea27a5d7123))
* **account-lib:** add NEAR tss signing ([d8ee226](https://github.com/BitGo/BitGoJS/commit/d8ee226f2aad5e75328e0f0c8836282c993d054b))
* **account-lib:** add NEAR util ([9bbbb08](https://github.com/BitGo/BitGoJS/commit/9bbbb08595d433106a40733a04dc0d2c83d7a603))
* **account-lib:** add number of signers setter to algo ([d12a089](https://github.com/BitGo/BitGoJS/commit/d12a0898de2057eeacfa0ae47dbf48159426cd51))
* **account-lib:** add pub key validation and address validation for CSPR ([d4ec859](https://github.com/BitGo/BitGoJS/commit/d4ec8594d865640dcef677ca5b9d7564f0964073))
* **account-lib:** add send-many in Account-Lib ([974a43e](https://github.com/BitGo/BitGoJS/commit/974a43e2ecd3783a06c2ee00e06928d7cfb6f6cb))
* **account-lib:** add setters for algo txn builder ([07ff195](https://github.com/BitGo/BitGoJS/commit/07ff195843c35862a86bdbd358a24c6039595053))
* **account-lib:** add signers check on account lib and add unit test ([44d68b6](https://github.com/BitGo/BitGoJS/commit/44d68b6aa5789ae2f0d586a5e76b981d5797a120))
* **account-lib:** add signMessage method ([1b16350](https://github.com/BitGo/BitGoJS/commit/1b16350ad7e4204cfec9f133a75eb74f88b6570d))
* **account-lib:** add skeleton for solana ([660d244](https://github.com/BitGo/BitGoJS/commit/660d24472d73ab30f2e40006692319ab774578df))
* **account-lib:** add skeleton implementation for Algorand ([9ad5c60](https://github.com/BitGo/BitGoJS/commit/9ad5c60fd246e3d7dca0058d05f61ec0dce989f5))
* **account-lib:** add solana tokens STLX-11959 ([1902efb](https://github.com/BitGo/BitGoJS/commit/1902efbf3dcee72879d0bec2676a97961caba24d))
* **account-lib:** add solana util functions for use in wp, refactor ([460adfa](https://github.com/BitGo/BitGoJS/commit/460adfa7576712d9eab184bbd7e55f8c19e41131))
* **account-lib:** add stacks coin keypair + utils implementation ([97d413a](https://github.com/BitGo/BitGoJS/commit/97d413a2719296855558cccdf6ff44740dd860ad))
* **account-lib:** add stacks smart contracts ([8ea73c9](https://github.com/BitGo/BitGoJS/commit/8ea73c9db315c36ac6a531e3db131bffef2b1b91))
* **account-lib:** add staking activate builder ([b23e5c3](https://github.com/BitGo/BitGoJS/commit/b23e5c3c7e4900173bbecb02e56ebf61a7a11fb9))
* **account-lib:** add staking deactivate builder ([35bb996](https://github.com/BitGo/BitGoJS/commit/35bb9965513a87b63ca89c0e3d05298230248079))
* **account-lib:** add staking withdraw builder ([34c7a75](https://github.com/BitGo/BitGoJS/commit/34c7a75a6755480c2a62606562002f645f90c65f))
* **account-lib:** add stateproofkey param ([46111c9](https://github.com/BitGo/BitGoJS/commit/46111c90df78b735d1c1d8da391857975c5bf6f5))
* **account-lib:** add stx coin (blockstack) and supporting utils ([a65b3eb](https://github.com/BitGo/BitGoJS/commit/a65b3eb47d60a5fd326dab1c75a0e736d94e12bc))
* **account-lib:** add stx to account-lib's coinBuilderMap ([2b9bffc](https://github.com/BitGo/BitGoJS/commit/2b9bffc07907e066ea1e22d46a5c02655a17c634))
* **account-lib:** add support for "memoId" field for STX addresses ([dd712e0](https://github.com/BitGo/BitGoJS/commit/dd712e03a22d27c30848634859eaa5508310800b))
* **account-lib:** add support for algo flat fees ([d7d0029](https://github.com/BitGo/BitGoJS/commit/d7d00294ccebb147c89152a3a0ba23ffe5122662))
* **account-lib:** add support for decoding signed algo txns ([bcc4929](https://github.com/BitGo/BitGoJS/commit/bcc4929fe7f76a01d614a83a94b7744faafca889))
* **account-lib:** add support for generating stx keypairs using extended public/private keys ([21f38cb](https://github.com/BitGo/BitGoJS/commit/21f38cb897497c38b4a64082749aafa47d60126f))
* **account-lib:** add support for offline kr txn ([4fad380](https://github.com/BitGo/BitGoJS/commit/4fad380967effc80deb650626519d30b05933e0e))
* **account-lib:** add test unit getTrasactionByteSize ([a6a3062](https://github.com/BitGo/BitGoJS/commit/a6a3062c6cb406bf7c178fafe2d5607ea797ed23))
* **account-lib:** add transaction type argument ([3c112ed](https://github.com/BitGo/BitGoJS/commit/3c112ed9f5f16af799bfc57291fa252c375982fb))
* **account-lib:** add transactionSize() to stx, for fee calculation ([9118362](https://github.com/BitGo/BitGoJS/commit/91183621307383192e8ebb359f1519e1e91ed5d1))
* **account-lib:** add unit test for avaxToken ([699d542](https://github.com/BitGo/BitGoJS/commit/699d542307cc61e2bc522842868ecee99bad0e40))
* **account-lib:** add unit tests related to extended keys support ([d4841d2](https://github.com/BitGo/BitGoJS/commit/d4841d284fb87a2a9dee07ad04f912df6bd37820))
* **account-lib:** add unnominate for dot staking ([8a1a5e2](https://github.com/BitGo/BitGoJS/commit/8a1a5e26ac453baedeeb44bbdd8ed47e9e7ab6a8))
* **account-lib:** add USDT USDC as testnet tokens ([f4d372b](https://github.com/BitGo/BitGoJS/commit/f4d372b3cdccc68aa9ce5e2c35b1cced127b6145))
* **account-lib:** add util factory for coins ([4233e2d](https://github.com/BitGo/BitGoJS/commit/4233e2d05dca961e79b907cb75af81e91c9bc1c9))
* **account-lib:** add utility function to convert algo pk to addr ([b1348dd](https://github.com/BitGo/BitGoJS/commit/b1348dde965f255cf07977bb008c7ccb12fbf4ac))
* **account-lib:** add utils to validate tx and block hash ([e59cb7c](https://github.com/BitGo/BitGoJS/commit/e59cb7c03f31eb9c1c7d5a3b35eab87972d324cc))
* **account-lib:** add validation for cspr address with transferId ([5a1ecd9](https://github.com/BitGo/BitGoJS/commit/5a1ecd95a0bb364fc6011dba369474d59ec728b8))
* **account-lib:** add validations for contract name, address and function ([42d51a9](https://github.com/BitGo/BitGoJS/commit/42d51a97f7758473ad1c7f7b0bbec01ff590628b))
* **account-lib:** add verifySignature Method ([260edfc](https://github.com/BitGo/BitGoJS/commit/260edfcb32db05fefb75b426662fd30ce0601a8d))
* **account-lib:** add verifySignature() for stx with test cases ([f9a8724](https://github.com/BitGo/BitGoJS/commit/f9a8724825f3e3b35b15dc77c8853fb5059aa368))
* **account-lib:** add withdraw staking builder ([6a4b9a5](https://github.com/BitGo/BitGoJS/commit/6a4b9a56cfdca3780f83addf077b2e152fc65385))
* **account-lib:** add withdrawUnstaked for dot ([984e412](https://github.com/BitGo/BitGoJS/commit/984e412f88eb6060182c144bf6fc2b8dee12899e))
* **account-lib:** added Algo encodeObj support on account lib ([e9a3e2e](https://github.com/BitGo/BitGoJS/commit/e9a3e2e7c20cd8a73b64ae8b603db750f6bfeb4f))
* **account-lib:** added UT over transaction ([4687e16](https://github.com/BitGo/BitGoJS/commit/4687e16083f7600a9fe3b5d62778b79a7542ce95))
* **account-lib:** adding NFT support to BitGo SDK ([39b7a4f](https://github.com/BitGo/BitGoJS/commit/39b7a4f6e4707a172cc506312f7930f8bc0a1603))
* **account-lib:** adding unit test for eth2 staking contract ([3fb5116](https://github.com/BitGo/BitGoJS/commit/3fb51166d3064ae806ffd75390a6328313d5278c))
* **account-lib:** addition of getTxId method for multisig txn ([ad22216](https://github.com/BitGo/BitGoJS/commit/ad222163171b3fd4fed5a20bc7fef8289cee1e69))
* **account-lib:** addition of getTxId method for multisig txn ([4240477](https://github.com/BitGo/BitGoJS/commit/4240477845c6404a7eee1ad477ade28674818bb8))
* **account-lib:** addition txType on account-lib ([8046424](https://github.com/BitGo/BitGoJS/commit/80464248402815413dacc2aa4095da72141c7fc3))
* **account-lib:** algo key dilution fix ([faebb5c](https://github.com/BitGo/BitGoJS/commit/faebb5c401a38be21d96f3736315ef852fe8e76d))
* **account-lib:** algo removal ([e8121d4](https://github.com/BitGo/BitGoJS/commit/e8121d4a08d1a2cd0b37c777da3e6f5d37e5c27d))
* **account-lib:** algo support for half sign tx ([e063c03](https://github.com/BitGo/BitGoJS/commit/e063c03ad4760d6f90a151ba29cdb65a83f89c19))
* **account-lib:** allow creating ETH Keypair from provided or random seed ([e96e4bb](https://github.com/BitGo/BitGoJS/commit/e96e4bb915a14b014efd04f873af4b75f1cf09c9))
* **account-lib:** allow dot key pair init with bs58 pub key ([d40ef28](https://github.com/BitGo/BitGoJS/commit/d40ef28af3edc77aaa61265512b07b61ee378065))
* **account-lib:** attempt webpack with ecma 6 ([37ace8c](https://github.com/BitGo/BitGoJS/commit/37ace8c0eb1b9c3920c296719e841a5c35634959))
* **account-lib:** avalanche C implement transactionBuilder, transferBuilder, tests ([dbac92b](https://github.com/BitGo/BitGoJS/commit/dbac92b442554984bf994456d63e247312341a67))
* **account-lib:** avax key pair support ([27c562f](https://github.com/BitGo/BitGoJS/commit/27c562fa1d557f50c7128308666987dab5c48231))
* **account-lib:** avaxc upgrade common fork to london ([9028b75](https://github.com/BitGo/BitGoJS/commit/9028b7543f9e8322598c2225eefc4dff7d5ea5dd))
* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** change NEAR transfer builder interface ([ac4bf46](https://github.com/BitGo/BitGoJS/commit/ac4bf4605e2cbae191c4cbac252b76a8a8c49bef))
* **account-lib:** create ataInitBuilder to initialize solana associated token account STLX-11958 ([e060add](https://github.com/BitGo/BitGoJS/commit/e060add6cb98e7950e56b6e1a0442b2a7fbe3dca))
* **account-lib:** determine how to use contract method IDs ([ecbcb8a](https://github.com/BitGo/BitGoJS/commit/ecbcb8a22065058d376bade7eed8ddf775805152))
* **account-lib:** dot explain transaction ([97a2f21](https://github.com/BitGo/BitGoJS/commit/97a2f21251f81ca2b9113ffabc2dd2ade7410ff4))
* **account-lib:** dot fee error fix ([1a91cae](https://github.com/BitGo/BitGoJS/commit/1a91caee176357e69d4dd5e14830a7402a7bf204))
* **account-lib:** dot final review fixes ([520ed78](https://github.com/BitGo/BitGoJS/commit/520ed78d0240469d754633d536c6ef5bab4b61e7))
* **account-lib:** dot optimization ([82dd145](https://github.com/BitGo/BitGoJS/commit/82dd1457793624e4c9ba1b880b5bfe4fdf19c740))
* **account-lib:** dot private key fix STLX-10448 ([08cc8f5](https://github.com/BitGo/BitGoJS/commit/08cc8f5e14fc5180f3d952e2b02dd6e685c288c0))
* **account-lib:** enable offline transaction building for algo ([95f6f95](https://github.com/BitGo/BitGoJS/commit/95f6f957511fc0572311039b4ce8c324cd3211c8))
* **account-lib:** export AddressVersion and AddressHashMode for STX ([8779deb](https://github.com/BitGo/BitGoJS/commit/8779deb6737183b67340cc8de3e0ed3e8ab82f24))
* **account-lib:** export AtaInitializationBuilder STLX-11958 ([c0ec45b](https://github.com/BitGo/BitGoJS/commit/c0ec45ba1690e44b28e7439e7bbe487b91dd6ac9))
* **account-lib:** export Solana builders and transaction ([597734f](https://github.com/BitGo/BitGoJS/commit/597734f364fe575f4cd361daaf2257551155ef54))
* **account-lib:** export token transfer builder STLX-11959 ([b757aa8](https://github.com/BitGo/BitGoJS/commit/b757aa89c6fd535740b732556df2ec53e281396e))
* **account-lib:** fix multisig signing issue ([e445dc4](https://github.com/BitGo/BitGoJS/commit/e445dc475bcd8486d2bfab9559123cb6898d63c6))
* **account-lib:** fixing coins.ts tsol mint addresses STLX-11959 ([f973924](https://github.com/BitGo/BitGoJS/commit/f973924eb29a53570de67861f44d270cdf35a1cd))
* **account-lib:** from implementation for transfer builder ([d9c85f5](https://github.com/BitGo/BitGoJS/commit/d9c85f534ddb6d0891724d975279bff244a11060))
* **account-lib:** implement a field for transaction material ([42fd74c](https://github.com/BitGo/BitGoJS/commit/42fd74c709e0e726cfc75b38707a08a5483532af))
* **account-lib:** implement add signature for sol ([451e58a](https://github.com/BitGo/BitGoJS/commit/451e58a1f1a34e54c7d493a2dac6621c777da783))
* **account-lib:** implement basic util methods for solana ([6fb3746](https://github.com/BitGo/BitGoJS/commit/6fb37465fa4be552dcda0f63729214339d8bb913))
* **account-lib:** implement isValidPrivateKey() method for CSPR ([c58d44a](https://github.com/BitGo/BitGoJS/commit/c58d44abc613f26d9497f2536009cf06cb9777fa))
* **account-lib:** implement keypair, transaction, builder and builder factory for solana ([c8493f6](https://github.com/BitGo/BitGoJS/commit/c8493f6b19d3aa01eb03ead7c514b79a0b58161b))
* **account-lib:** implement validityWindow and sequenceId for Sol ([0677955](https://github.com/BitGo/BitGoJS/commit/06779551b6b21a0f38d809c03a6870c309b83d21))
* **account-lib:** implementation of generateAccoutn() in account-lib ([7737024](https://github.com/BitGo/BitGoJS/commit/7737024d04187cd8432473d17354543d4d35aba0))
* **account-lib:** implementation of the functionality secretKeyToMnemonic with unit test ([0c80d0a](https://github.com/BitGo/BitGoJS/commit/0c80d0a65dd5ab09c196421c9d25022174c89a24))
* **account-lib:** implemetion stellerpub to algoaddress and encodeAddress ([a636bc0](https://github.com/BitGo/BitGoJS/commit/a636bc01dca47e51663a99b8dee843e3ba28b4c6))
* **account-lib:** improve and export NEAR util methods ([7ad569e](https://github.com/BitGo/BitGoJS/commit/7ad569e631ca8a5f8737c199bfdb190d92af9c61))
* **account-lib:** include rent exempt amount in solana ata init transaction STLX-11958 ([25c7eeb](https://github.com/BitGo/BitGoJS/commit/25c7eebce629b0d9de6a52946bc4b3f91b34fe22))
* **account-lib:** initial algorand keypair support ([fd00e5b](https://github.com/BitGo/BitGoJS/commit/fd00e5b204c08c73c5da3e60545f90d0b3c0257e))
* **account-lib:** initial setup ([63be9dd](https://github.com/BitGo/BitGoJS/commit/63be9dd76bef92423b41c57d628b4e093fa5e2cc))
* **account-lib:** keyreg linting fix ([29f2cb5](https://github.com/BitGo/BitGoJS/commit/29f2cb5b4f150eab9870ec941589ba9553303775))
* **account-lib:** load inputs and outputs of solana create ata instruction STLX-11958 ([a3a2ab1](https://github.com/BitGo/BitGoJS/commit/a3a2ab1a6fb885a9aecc5c648529bfc9f313622c))
* **account-lib:** make chainname parameterizable in txBuilder ([2115d96](https://github.com/BitGo/BitGoJS/commit/2115d96da9299deb6490ee447612326be5d67a17))
* **account-lib:** migrate BLS key pair from @bitgo/bls to @bitgo/bls-dkg lib ([c95877f](https://github.com/BitGo/BitGoJS/commit/c95877fda2201a5d71618ad68ba14cc73308f4f7))
* **account-lib:** move buildFeeInfo logic to AL and add unit test ([9c7ae4e](https://github.com/BitGo/BitGoJS/commit/9c7ae4ec9e5f0ecc751372375b1a83a7be4c1e7c))
* **account-lib:** near coin skeleton ([5fda33d](https://github.com/BitGo/BitGoJS/commit/5fda33da57e2037f0b9e2c81b98fe7b5fc2a35e9))
* **account-lib:** package json  fix ([dc14fc6](https://github.com/BitGo/BitGoJS/commit/dc14fc6b679590c08cdc6528c10e822158072cdf))
* **account-lib:** rebase account-lib in the bitgoJs and fixing errors ([cf5baaf](https://github.com/BitGo/BitGoJS/commit/cf5baaf577cd9c151be40d4efb6257ba47c03889))
* **account-lib:** recover signature from raw tx ([113f132](https://github.com/BitGo/BitGoJS/commit/113f132f3219c752938b40a56eb90fca937b223d))
* **account-lib:** refactor after code review ([27761f5](https://github.com/BitGo/BitGoJS/commit/27761f5c2e72a4a284959630cd6821d0e07e77b9))
* **account-lib:** refactor and added missing unit test ([33bae36](https://github.com/BitGo/BitGoJS/commit/33bae3646e26ebd131f3c6e0a5a84f3f3e4bbec2))
* **account-lib:** refactor casper addresses format ([cb8a30c](https://github.com/BitGo/BitGoJS/commit/cb8a30c47f199ef889946e411dfb8738e2621e55))
* **account-lib:** refactor code after code review ([a0d13b4](https://github.com/BitGo/BitGoJS/commit/a0d13b4bb587ef6f7b23dbcd5588e3230caded5e))
* **account-lib:** refactor due to pull request review suggestions ([e30a6ea](https://github.com/BitGo/BitGoJS/commit/e30a6eaefc1e780dab2b6d66d048fc4e75d28f6d))
* **account-lib:** refactor mintAddress -> tokenName 3 STLX-11959 ([a1455a3](https://github.com/BitGo/BitGoJS/commit/a1455a36eab968503691928d2ac8daef1a00797d))
* **account-lib:** refactor mintAddress -> tokenName 4 STLX-11959 ([eeeaecd](https://github.com/BitGo/BitGoJS/commit/eeeaecdffb2ae00e2c01e5b14e52995c934f8998))
* **account-lib:** refactor mintAddress -> tokenName STLX-11959 ([6ca2d10](https://github.com/BitGo/BitGoJS/commit/6ca2d1065e76c26f0d2aac8a08ed536bbba9bbad))
* **account-lib:** refactor to control over minimum transfer amount ([2ae3ac1](https://github.com/BitGo/BitGoJS/commit/2ae3ac18bdde24909f4275f9b3796796cb9cd0c5))
* **account-lib:** remove asynchronicity from some methods and improved jsdoc ([cb1636f](https://github.com/BitGo/BitGoJS/commit/cb1636f885a0ba752803ad4bc412cc6f68689755))
* **account-lib:** remove KeyExclusionBuilder from account-lib ([3950c7b](https://github.com/BitGo/BitGoJS/commit/3950c7bf68c19dfdf46490f8c3c5d79f6ffb38d6))
* **account-lib:** remove question mark from genesisID and genesisHash ([14c961e](https://github.com/BitGo/BitGoJS/commit/14c961e658f114da34e107871d4021997cf7f586))
* **account-lib:** sign message and verify sign for casper ([80cfbb9](https://github.com/BitGo/BitGoJS/commit/80cfbb93395ac9e62ae5a770272c3b16068176c5))
* **account-lib:** skeleton code for avalanche c-chain in account-lib ([8c5382b](https://github.com/BitGo/BitGoJS/commit/8c5382b1e51e453b60e7127b2cc18467f4a0f952))
* **account-lib:** solana - implement derive address function ([3dbdf6c](https://github.com/BitGo/BitGoJS/commit/3dbdf6cdc3a89883d86ba7237e958cc3bd475d58))
* **account-lib:** spl-token encode/decode rework STLX-11959 ([e1db449](https://github.com/BitGo/BitGoJS/commit/e1db449d2094ea9f85f8af479f83f14f0371b99b))
* **account-lib:** stlx-1458 from implementation for wallet initialization ([94395dd](https://github.com/BitGo/BitGoJS/commit/94395dd8c371dbe6e43eadd4736d1172c9a77e70))
* **account-lib:** stlx-793 implemented from implementation for transaction and transaction builder ([679c1af](https://github.com/BitGo/BitGoJS/commit/679c1af134a34ff8432817768e28e05971ccf06f))
* **account-lib:** stx contract call args ([b482b72](https://github.com/BitGo/BitGoJS/commit/b482b724b4647bd677a2f2082825a1c410cffb1f))
* **account-lib:** stx ContractBuilder functionArgs add optionl ([1e5e725](https://github.com/BitGo/BitGoJS/commit/1e5e725152bc75fd58358474f3cbbfedbbbd403b))
* **account-lib:** sTX getSTXAddressFromPubKeys takes an optional AddressHashMode param ([7dc694d](https://github.com/BitGo/BitGoJS/commit/7dc694dab04c45f44d363c0b6938ec37ac3b78c0))
* **account-lib:** stx toBroadcastFormat does not prefix with 0x ([3d0749f](https://github.com/BitGo/BitGoJS/commit/3d0749f8be7749e89c84494a5db59b2647433273))
* **account-lib:** sTX's transaction builder checks if the provided memo string is valid ([c4c2fac](https://github.com/BitGo/BitGoJS/commit/c4c2fac63dbee5087851281afa97f7f8b86fc5d7))
* **account-lib:** support creating TSS keyshares with seed ([6716720](https://github.com/BitGo/BitGoJS/commit/6716720705087d31bddc978b4c89ad0bf1a494bd))
* **account-lib:** support HD MPC key generation and signing ([be934d3](https://github.com/BitGo/BitGoJS/commit/be934d34fb75020d78618ef9fdf2976041346be8))
* **account-lib:** support new fee model in EthTransactionData ([c4b2e38](https://github.com/BitGo/BitGoJS/commit/c4b2e38e517d06ad91ff1a060d78ec7322c2a312))
* **account-lib:** supporting adding signatures to transactions ([00cd566](https://github.com/BitGo/BitGoJS/commit/00cd5662bf9f89c9c4bdab948f6548107c9ef696))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **account-lib:** token transfer support STLX-11959 ([1687234](https://github.com/BitGo/BitGoJS/commit/16872349fc25bffce07eda515728aff250d1a25d))
* **account-lib:** transation hash is calclated wrongly ([15628a2](https://github.com/BitGo/BitGoJS/commit/15628a20b4feef9d4b77debb5359158ccc99f821))
* **account-lib:** unit test for non participation in keyRegistrationBuilder ([540774b](https://github.com/BitGo/BitGoJS/commit/540774b40dd1406d7b8d9e6d6fa573f1bb723318))
* **account-lib:** update casper sdk to version 20 ([34996e4](https://github.com/BitGo/BitGoJS/commit/34996e4879e966fb2511e20cccb84d01c96b24d6))
* **account-lib:** update casper sdk version ([b0bc77a](https://github.com/BitGo/BitGoJS/commit/b0bc77a2c59606e0dbd0ae25bbe15970af13fb37))
* **account-lib:** update casper-client-sdk lib version ([5f74054](https://github.com/BitGo/BitGoJS/commit/5f740548b5292dbccf478837aa48083cf5ac4e0b))
* **account-lib:** update eth behavior require by hsm3 ([062eba1](https://github.com/BitGo/BitGoJS/commit/062eba1232083bf40ed66f69eebda7a73b7bbded))
* **account-lib:** update the casper-client-sdk dependency to v1.0.16 ([a97e235](https://github.com/BitGo/BitGoJS/commit/a97e235e267521a729fb5b87802764ee7b97ed40))
* **account-lib:** update verification methods ([af93730](https://github.com/BitGo/BitGoJS/commit/af937306b61286ab813e4410b65079659883e93b))
* **account-lib:** updated casper node version ([fa2d7f6](https://github.com/BitGo/BitGoJS/commit/fa2d7f65edf416231bd8d829ce7e33c2294b65f6))
* **account-lib:** updated casper sdk version to 1.0.19 ([13806da](https://github.com/BitGo/BitGoJS/commit/13806da99039c09a7d0e13a4b0a5651293c24874))
* **account-lib:** updating after comments ([13726e8](https://github.com/BitGo/BitGoJS/commit/13726e81920af88b4cc40a6e5bed39823d62e10a))
* **account-lib:** upgrade celo to 1.2.4 ([c7ed64d](https://github.com/BitGo/BitGoJS/commit/c7ed64d3c21d77c62a015f126c59843d39866214))
* **account-lib:** validate ValidityWindows in baseBuildTransaction ([dd1dfc4](https://github.com/BitGo/BitGoJS/commit/dd1dfc41ac2a5fa9489f0472b31ad584b868b9d7))
* **accountlib:** add closeremaindeto and unit tests ([69917a0](https://github.com/BitGo/BitGoJS/commit/69917a0074e382a900df71bc247cc9eadfd0533d))
* **accountlib:** add new casper coin skeleton structure ([9163b22](https://github.com/BitGo/BitGoJS/commit/9163b22b2edb8baa8c54c381b4857fac46b7e646))
* **accountlib:** add testing ([8f4e3a0](https://github.com/BitGo/BitGoJS/commit/8f4e3a0f0fb2743f14211565c1f1e4e6bfcc144e))
* add BCH coin and recovery ([a74b877](https://github.com/BitGo/BitGoJS/commit/a74b877a14ab46b2bcf0955e60fbab6db4f5c302))
* add bls initialization ([f7fe3d4](https://github.com/BitGo/BitGoJS/commit/f7fe3d42be5e3e98327e346fbc57b151a826124c))
* add custom signing function url to requests ([2a0aca5](https://github.com/BitGo/BitGoJS/commit/2a0aca5123547635ab97d25befd4ef5b4bcc5dc1))
* add ERC20 OFC "token" support to statics ([4473ef9](https://github.com/BitGo/BitGoJS/commit/4473ef99d7cadbbb58ac6f88cdfff1be4a7ef577))
* add eth2 to statics ([61665a3](https://github.com/BitGo/BitGoJS/commit/61665a3cdb2ba4a3700a3cc9baa803abdd17c6bf))
* add fetchEncryptedPrivKeys.ts ([136fbab](https://github.com/BitGo/BitGoJS/commit/136fbabb6220b7e5620d6705b0ceb1819f45dcac))
* add github actions CI workflow ([e90bef1](https://github.com/BitGo/BitGoJS/commit/e90bef1c3b646d81b962bc92bf63c97fd286cb64))
* add log for xpub during tx signing ([c0bba72](https://github.com/BitGo/BitGoJS/commit/c0bba72de81e21223f03b0b6ea90782262fcab14))
* add module `@bitgo/blockapis` ([2bc8991](https://github.com/BitGo/BitGoJS/commit/2bc8991df6eabbe5775663f1169e90d599e6b87d))
* add new token ([8a60853](https://github.com/BitGo/BitGoJS/commit/8a60853f3988faa1eedfce777cc40cb6244ae027))
* add new tokens ([7027f50](https://github.com/BitGo/BitGoJS/commit/7027f50da97e885eb5c068d339a65953da255f04))
* add new tokens ([69b320e](https://github.com/BitGo/BitGoJS/commit/69b320e5bde0724e353d2cb710b3a358808100b8))
* add nft tokens to statics ([9f42cc4](https://github.com/BitGo/BitGoJS/commit/9f42cc4b8dc4f81bcff6fa6d7da58b07df5b8c2a))
* add retry logic to external signer ([05e198a](https://github.com/BitGo/BitGoJS/commit/05e198a64f43afbf035fee406f27e0b35cb90721))
* add signing functionality to external signer mode ([ee26c72](https://github.com/BitGo/BitGoJS/commit/ee26c727931a2ae08613f173bd34a1092c5915fc))
* add SIH ([2cbd5b4](https://github.com/BitGo/BitGoJS/commit/2cbd5b4cb9c1ec01cbd8da408ecbe1406f70e17e))
* add support for generating p2tr addresses ([2cd462c](https://github.com/BitGo/BitGoJS/commit/2cd462cb7b13aa2b9c6b09e667abe128c1c9262f))
* add support for node 16 and add to test matrix ([9fab886](https://github.com/BitGo/BitGoJS/commit/9fab886fab10eeacdd91d294f1c5deeb5cd03a28))
* add support for sign(signParams: TxbSignArg) ([f15fb36](https://github.com/BitGo/BitGoJS/commit/f15fb36e6a1aa7515dfbf0c1f2c36620a9ba8eab))
* **add tokens:** add tokens (lowcase) ([5c5612e](https://github.com/BitGo/BitGoJS/commit/5c5612e600bab01adc40c973696ed788ac679f2a))
* add TSS key generation and signing functions ([3d1dce5](https://github.com/BitGo/BitGoJS/commit/3d1dce5e2c225acd08d5018f53c43727eba19632))
* add unspents module from BitGo/unspents ([47acb1e](https://github.com/BitGo/BitGoJS/commit/47acb1eff7f00cadde40eb480c7c19342ee126e8))
* adding comment to SubmitTransactionOptions ([ac32498](https://github.com/BitGo/BitGoJS/commit/ac324988fe37f256a901d71761ad908f95f72f29))
* adds BLS key generation to account-lib. Used for ETH2 ([9fc8583](https://github.com/BitGo/BitGoJS/commit/9fc8583649b567b6b41a5ea18d536291caaf8ea0))
* adds eth2 coin controller in core ([8c74388](https://github.com/BitGo/BitGoJS/commit/8c74388eba50df6ce853c80cb5291e6627a94251))
* adds new tokens ([0607785](https://github.com/BitGo/BitGoJS/commit/06077852a6e97b27265826e4d877bcc53fffb3cf))
* **algo:** add algo token support ([740d064](https://github.com/BitGo/BitGoJS/commit/740d06493b76e82b16f7be746d623616d7082220))
* **algo:** bG-31598-Add-ALGO-Token-Support ([29eb2a0](https://github.com/BitGo/BitGoJS/commit/29eb2a0ff320cc83727a54fe8a932e25359c831d))
* **algo:** misc updates for platform migration to use account lib ([b310c57](https://github.com/BitGo/BitGoJS/commit/b310c57d5ff497aff76fe5859a3baef6466915c5))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* **bitgo:** add emergency param to whitelist ([3e0b615](https://github.com/BitGo/BitGoJS/commit/3e0b6155c750da431ffc8062a4ccf7c0bad639f2))
* **bitgo:** add nonce in prebuild whitelisted params ([bbf4084](https://github.com/BitGo/BitGoJS/commit/bbf4084912bb0b29c048bbc192d83b1ce4bdf156))
* **bitgojs:** update algo sdk to last stable version ([87e258a](https://github.com/BitGo/BitGoJS/commit/87e258aa69c72a339f9a911e512aa447ff77dc32))
* **bitgojs:** update algo sdk to last stable version ([291f166](https://github.com/BitGo/BitGoJS/commit/291f166447cd29dac463b0cf2d4851ac21b00684))
* **bitgo:** update tss hd wallet sharing ([d416f1e](https://github.com/BitGo/BitGoJS/commit/d416f1e65794f1be2a0d908b0d2d43b5f0589355))
* **blockapis:** add OutputSpends, TransactionStatus queries ([53bd87e](https://github.com/BitGo/BitGoJS/commit/53bd87e2128598e4321654a58e647bab88e82325))
* **c8p token:** update decimal places ([85d7cfe](https://github.com/BitGo/BitGoJS/commit/85d7cfef5a40d4b818b62e79daff7c38965b961f))
* check config when running in external signer mode ([3c0e9a1](https://github.com/BitGo/BitGoJS/commit/3c0e9a12f2ae652a95defc289cb32a9589369bb0))
* check that signerFileSystemPath path contains a private key ([fe78332](https://github.com/BitGo/BitGoJS/commit/fe78332784edcff6f897ef05d315f2106a1308f4))
* **core & account-lib:** adapt tron to receive data for a contract call ([8bbcac0](https://github.com/BitGo/BitGoJS/commit/8bbcac05215c6eb14edb103ea241f72ae934ec7e))
* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript ([a5b80b2](https://github.com/BitGo/BitGoJS/commit/a5b80b274ce4d3d38c4e4396d5f313a6192c4652))
* **core:** add `considerMigratedFromAddressInternal` verification flag ([288c6f1](https://github.com/BitGo/BitGoJS/commit/288c6f15e11c908849047f4f995d4ba20f4da958))
* **core:** add `ecdhXprv` to serialized SDK JSON object ([3112c72](https://github.com/BitGo/BitGoJS/commit/3112c72f735e319d25f885c446ea8b1e8b30f0f3))
* **core:** add amount to refund eos txn ([f3e5a67](https://github.com/BitGo/BitGoJS/commit/f3e5a676112252b4ab746f2ed0678e9bf316992c))
* **core:** add AvaxcToken coins in sdk ([8beb7bf](https://github.com/BitGo/BitGoJS/commit/8beb7bf2b52090fc04b43800cc328951a509417d))
* **core:** add Avaxctokens coins in sdk ([9f74b40](https://github.com/BitGo/BitGoJS/commit/9f74b406751044a5ded33b6763ca2df7f125b4dc))
* **core:** add bip32path.fromLegacyPath() ([b95c55f](https://github.com/BitGo/BitGoJS/commit/b95c55f73ecc75b2e946353c4a01856279a916e2))
* **core:** add bip32util with signMessage/verifyMessage ([43178f2](https://github.com/BitGo/BitGoJS/commit/43178f2cf9da0e812fdae2057e597c5dc8bc5660))
* **core:** add class WalletKeys ([4417bb0](https://github.com/BitGo/BitGoJS/commit/4417bb0de33c2233ed640a472fb6abb0ab93c522))
* **core:** add compatibility for @bitgo/utxo-lib 1.9.x ([1bbc4df](https://github.com/BitGo/BitGoJS/commit/1bbc4dfd6caa51acf69f39a46e7e6b901d6184cf))
* **core:** add core skeleton for solana ([2269db4](https://github.com/BitGo/BitGoJS/commit/2269db4ada70549df295002f652838ffaa647938))
* **core:** add createTss func to keychains ([954a148](https://github.com/BitGo/BitGoJS/commit/954a148a324acaadfdf28a0b570ecb4a8a817076))
* **core:** add distinct "unit-test" target ([079b1fb](https://github.com/BitGo/BitGoJS/commit/079b1fb3890f8ea55d3303eb674cf09bfc5843f5))
* **core:** add enable and disable token txs to explain transaction method ([8d99fdc](https://github.com/BitGo/BitGoJS/commit/8d99fdca1ec854d199c28ba1e26a9be533985c81))
* **core:** add eos explain refund txn ([d1231c0](https://github.com/BitGo/BitGoJS/commit/d1231c0b98f6d340790cfed5352893b5867d78b8))
* **core:** add examples of enable and disable token ([1aeeeb3](https://github.com/BitGo/BitGoJS/commit/1aeeeb3c6b87fa0c7b3a1ff9de131be74d6d8286))
* **core:** add explainTransaction for STX ([b69cc82](https://github.com/BitGo/BitGoJS/commit/b69cc82ff66ce5bb10fe3b787b79f5dd923e75f7))
* **core:** add fixture-based parameteric utxo tests ([444888f](https://github.com/BitGo/BitGoJS/commit/444888f9f0ba5a5ec5d6ed941c968cf29efa8e52))
* **core:** add function for verifying eth address ([32d5714](https://github.com/BitGo/BitGoJS/commit/32d5714d7e4b2b0e2537da42e6f2448f0488c973))
* **core:** add function in SDK and write examples for deploy/flush forwarder. Ticket: STLX-12550 ([c4cd0b4](https://github.com/BitGo/BitGoJS/commit/c4cd0b4710b8405add0104c289eb145a45983636))
* **core:** add hop to signTransaction and unit tests ([9d58b26](https://github.com/BitGo/BitGoJS/commit/9d58b261ddeb24bfbbb5cb6ebf2e18b8ec94e550))
* **core:** add method to aggregate ETH2 BLS shares ([953ddfb](https://github.com/BitGo/BitGoJS/commit/953ddfb92cacb3239ec994979d02481775f88f22))
* **core:** add NEAR core skeleton ([16bc15d](https://github.com/BitGo/BitGoJS/commit/16bc15d5ce80b53c14b54a5cd9faa6fe71912b70))
* **core:** add parseOutputId to utxo/unspent.ts ([ec77d11](https://github.com/BitGo/BitGoJS/commit/ec77d1172d7d8f6f93b415f6c280397e36f57ace))
* **core:** add publicKeys optional param to stx's explainTransaction call options ([6581839](https://github.com/BitGo/BitGoJS/commit/6581839d4d0cebf97d8c770ac981290d4bb9ee48))
* **core:** add rel prefix to github actions branch list ([0519d66](https://github.com/BitGo/BitGoJS/commit/0519d6686a6cab57a43df2662402adef02837dff))
* **core:** add request method to auth v3 hmac subject ([74e5b1f](https://github.com/BitGo/BitGoJS/commit/74e5b1f659c832bb848172745251a9ef93ee9fa2))
* **core:** add send support for XLM muxed addresses ([fdaf489](https://github.com/BitGo/BitGoJS/commit/fdaf489e7fa26b6963b5157c59ecdffff3bcde4f))
* **core:** add signTransactions method in stx ([bdd669f](https://github.com/BitGo/BitGoJS/commit/bdd669fbc67ae67696659c85ce8454cc59e919e7))
* **core:** add signWalletTransactionWithUnspent ([834c505](https://github.com/BitGo/BitGoJS/commit/834c50586b37a864b54a0ac0f291980b6ec8191e))
* **core:** add stacking to explain tx ([d637154](https://github.com/BitGo/BitGoJS/commit/d637154d11e45f195bb0b75fd664a16338bd268c))
* **core:** add support for avaxc ([a30e29c](https://github.com/BitGo/BitGoJS/commit/a30e29cc4bd0a134186bc76e3afb5e3f49c4f03f))
* **core:** add support for node 12, 14, 15 ([0085455](https://github.com/BitGo/BitGoJS/commit/0085455dd22640994db627877c23c48fc5c9e18f))
* **core:** add support for p2tr recoveries ([286469f](https://github.com/BitGo/BitGoJS/commit/286469ffe9ad6868b926a63bc9c4cb1a55ae11d8))
* **core:** add support for p2tr script path sign ([99b0453](https://github.com/BitGo/BitGoJS/commit/99b04535b57703ca37cf2dfc0553de03f9a51c51))
* **core:** add support for user-provided custom signing function ([672f1a8](https://github.com/BitGo/BitGoJS/commit/672f1a83f5690a03e36309eaeff19b7daeb13044))
* **core:** add support for verifying STX addresses with an optional "memoId" field ([5627877](https://github.com/BitGo/BitGoJS/commit/5627877b1a98f3d8b49a6e2c084da75afc1d5c4f))
* **core:** add supportsAddressChain(), supportsAddressType() ([89cb98f](https://github.com/BitGo/BitGoJS/commit/89cb98f6a9dbe9801df6feb238d33e5659d69243))
* **core:** add toBase58Check to legacyBitcoin ([c220d7d](https://github.com/BitGo/BitGoJS/commit/c220d7d45b8533d343c1e2425109caa94da7a0da))
* **core:** add tss flow on pending approval ([22313ff](https://github.com/BitGo/BitGoJS/commit/22313ff47dcea31340eee3e83c9d09ad641e02e4))
* **core:** add unspent address check ([0bb42c2](https://github.com/BitGo/BitGoJS/commit/0bb42c205e28715a0e43ebbb374e61528db2aee2))
* **core:** add verifyWalletTransactionWithUnspents ([93e3292](https://github.com/BitGo/BitGoJS/commit/93e3292276c203b82e264ac19719699d5b3b6285))
* **core:** add, use getKrsProvider ([c839f08](https://github.com/BitGo/BitGoJS/commit/c839f088dca16cbc1d19c09241641f63518df444))
* **core:** added algo token config on core ([45bcf2f](https://github.com/BitGo/BitGoJS/commit/45bcf2f4c949995f126b06118b20c48d7b864bc1))
* **core:** added closeReminderTo into whitelist for cold enable token tx ([c7b725b](https://github.com/BitGo/BitGoJS/commit/c7b725b73681a74e1f3abcf1341c2fb5469b53e4))
* **core:** added cspr and tcspr to core module ([c7dd309](https://github.com/BitGo/BitGoJS/commit/c7dd30979e1ab222540949d2b9a0913742f51503))
* **core:** added ETH V1 examples ([32153d2](https://github.com/BitGo/BitGoJS/commit/32153d252765f3aedb1802d456886920bc75c5db))
* **core:** added node urls for Near ([4102c56](https://github.com/BitGo/BitGoJS/commit/4102c56fb4bc7ddbb57ef3e928b3f3e4c95c4073))
* **core:** added support for send on cashaddr ([0457b6d](https://github.com/BitGo/BitGoJS/commit/0457b6da7200aa8e298e8708830a76be1edf8454))
* **core:** allow alphanumeric memoid for eos ([ab4d3f2](https://github.com/BitGo/BitGoJS/commit/ab4d3f2ce838a8c80b9d6a9cbe5c7c91fc184854))
* **core:** allowed amount 0 on recipients for enable token ([29948a4](https://github.com/BitGo/BitGoJS/commit/29948a42492a9ce9e0ec2d16c8dfc8c34d594e89))
* **core:** bG-29057: Add non participant keyreg transaction support for Algorand ([e6b36c4](https://github.com/BitGo/BitGoJS/commit/e6b36c4a1e7e1175d32d6b8396f1a2f29790c273))
* **core:** create wallet with eip1559 ([3cfc343](https://github.com/BitGo/BitGoJS/commit/3cfc343ade54bb25a2b318adc2b4c94f3b78ca46))
* **core:** dot core helpers ([161d66a](https://github.com/BitGo/BitGoJS/commit/161d66a362b3e4f64a90fdf30ef97db9be9b7f0e))
* **core:** dot core sign tx ([4691678](https://github.com/BitGo/BitGoJS/commit/469167876a08928924a10b9406bc3a703eb19b51))
* **core:** dot review fixes ([4593a7a](https://github.com/BitGo/BitGoJS/commit/4593a7a5a01dada29d6bcab28587ba24fac187c5))
* **core:** enable hop transactions in avaxc ([4395c47](https://github.com/BitGo/BitGoJS/commit/4395c4791a64eca7500dd7c0658a6f9a5690e0af))
* **core:** enhanced address verification in sdk ([fa951d5](https://github.com/BitGo/BitGoJS/commit/fa951d5d6b4bf1ee914f2a74a94a7c92ba80d0e6))
* **core:** eos token configuration ([adbb0ae](https://github.com/BitGo/BitGoJS/commit/adbb0ae3d954b5c8dba88e31e1c2fc82528b1d46))
* **core:** explain transaction for transfer builder and keyreg builder ([9ce76ef](https://github.com/BitGo/BitGoJS/commit/9ce76efdf5a51ebf6f334f8593b9367258b1d6e4))
* **core:** explain unstake eos transaction ([a09501d](https://github.com/BitGo/BitGoJS/commit/a09501dd9cb5dc5f2b943c663c5c001299040099))
* **core:** export txEnumTypes from core ([ace20bb](https://github.com/BitGo/BitGoJS/commit/ace20bb3b01171c144dd577c216f6d3830800f09))
* **core:** expose compatibility layer at `require('bitgo').bitcoin` ([48cbfe3](https://github.com/BitGo/BitGoJS/commit/48cbfe33c867d0bd5e60dea6f132e5ad9f6c7a82))
* **core:** fix version of core dependecies ([7af586a](https://github.com/BitGo/BitGoJS/commit/7af586a7f6c4bdb261492a09ace651bdfb16f599))
* **core:** impelement tss wallet creation ([d5dfe3a](https://github.com/BitGo/BitGoJS/commit/d5dfe3a83c235ec1c30fbf8afc14e2bb46168218))
* **core:** implement algo sign txn ([1af84ea](https://github.com/BitGo/BitGoJS/commit/1af84ea225e0d9d35b1d0ef52baf35dd1e0a526c))
* **core:** implement explain transaction method for Casper ([6a607ec](https://github.com/BitGo/BitGoJS/commit/6a607ec7370b6c799472a58df043452ee76fc10f))
* **core:** implement getSignablePayload for baseCoin and sol ([c584437](https://github.com/BitGo/BitGoJS/commit/c584437485922af67940b807afde2bee348e158c))
* **core:** implement message signing ([0c2ba7e](https://github.com/BitGo/BitGoJS/commit/0c2ba7e8bfc89e8acbc5b8d6d0c50e2aa7f1905b))
* **core:** implement parseTransaction for CSPR ([9a81b62](https://github.com/BitGo/BitGoJS/commit/9a81b62dc577bf8f99a48f26b741d7223ddd8971))
* **core:** implement sign transaction for NEAR ([6da463a](https://github.com/BitGo/BitGoJS/commit/6da463a35a97a328985cdd0b3e3f173956884424))
* **core:** implement support for auth v3 ([9de7ffa](https://github.com/BitGo/BitGoJS/commit/9de7ffa560f323f8c71821fe39ea631812d58a5b))
* **core:** implement transaction signing methods ([739e72f](https://github.com/BitGo/BitGoJS/commit/739e72f30c101b9fe2c03f9b46ee67c854597a02))
* **core:** implement verify transaction function for sol ([aeaaf50](https://github.com/BitGo/BitGoJS/commit/aeaaf50577ff6d131654e283f8c23901825736fe))
* **core:** implement verifyAddress for stx coin ([d0a11b9](https://github.com/BitGo/BitGoJS/commit/d0a11b981d74534a4571210e592e48c86f3fe7f3))
* **core:** improve type signature for Unspent ([e0dfd6f](https://github.com/BitGo/BitGoJS/commit/e0dfd6f862ec5cdeab29763348a4430a4a837e0c))
* **core:** improve type signatures for recovery methods ([106a31d](https://github.com/BitGo/BitGoJS/commit/106a31db4cae439356fd3d6fcdb7f4d15166bfe3))
* **core:** move secp256k1 to regular dependencies ([d43b363](https://github.com/BitGo/BitGoJS/commit/d43b363aecb8164d0c6b5fca6b0cbf010bfb67fb))
* **core:** return bip32 in getBip32Keys ([82b0ba2](https://github.com/BitGo/BitGoJS/commit/82b0ba2beef8018b79c42524fd43035743a87f67))
* **core:** sign consolidate txns ([8aeeb3e](https://github.com/BitGo/BitGoJS/commit/8aeeb3e705aa1720dde1db0d85515364d8141e12))
* **core:** sign functions for casper ([9242aab](https://github.com/BitGo/BitGoJS/commit/9242aabaf3d362e03d341be1bfb924a23ed3b5e8))
* **core:** stx sign tx multisig ([873b006](https://github.com/BitGo/BitGoJS/commit/873b006307bc394d73e699280e3a20fb6683dcfe))
* **core:** support BLS-DKG key generation flow for ETH2 hot wallet creation ([356eee7](https://github.com/BitGo/BitGoJS/commit/356eee7b9fc090de6dda03a864c405e464701988))
* **core:** support creating algo wallets with seed ([41837ad](https://github.com/BitGo/BitGoJS/commit/41837ad8645285a157d1b565abfbe88f7ee15bf4))
* **core:** support creating solana ATA with sdk ([40ee96f](https://github.com/BitGo/BitGoJS/commit/40ee96ff0804f140b027cf9c7034b295a876a86d))
* **core:** support signing single sig dot transactions ([4ab0219](https://github.com/BitGo/BitGoJS/commit/4ab02195c5bf5e478e057a8568674b04f830bf1b))
* **core:** support tss wallet sharing ([249f424](https://github.com/BitGo/BitGoJS/commit/249f424f56d5ea2ecd4a4546986133e95d693fc1))
* **core:** tss wallet sharing tests ([3a5923b](https://github.com/BitGo/BitGoJS/commit/3a5923b13883d9022a86a7b8621b8dd488a7d85c))
* **core:** update createAddress to perform hardened derivation ([356dbaa](https://github.com/BitGo/BitGoJS/commit/356dbaa9503e002c5151e1497e0c1c583098b853))
* **core:** update forwarder flags ([670bde5](https://github.com/BitGo/BitGoJS/commit/670bde508bc75520ff540bf78e560f17abbf20b9))
* **core:** use sanitizeLegacyPath in transactionBuilder ([46543aa](https://github.com/BitGo/BitGoJS/commit/46543aa07a5194a857297f3f34c242b0435e8874))
* **core:** use scriptTypeForChain in abstractUtxoCoin ([4d675cc](https://github.com/BitGo/BitGoJS/commit/4d675ccdebb57a793468cb891b180b2db5d6a938))
* **core:** verify and prebuild hop transactions ([bac9bde](https://github.com/BitGo/BitGoJS/commit/bac9bde745371804357fa3cd673fa0572442f1b9))
* **core:** verify tss transactions ([319515f](https://github.com/BitGo/BitGoJS/commit/319515f91200fab7b96954c0b1687dbef7092308))
* **cspr:** update CSPR explorer URLs ([db7d1c1](https://github.com/BitGo/BitGoJS/commit/db7d1c1819d31632c8d2a89387003f944443362a))
* **defi:** add support for building, signing and sending meta transactions ([c1833cd](https://github.com/BitGo/BitGoJS/commit/c1833cd4568affec14886893afe43cc4f5132d76))
* **dot:** implement signMessage ([f0169d8](https://github.com/BitGo/BitGoJS/commit/f0169d8f03c9aee4ddb61998a36beba54dcdb063))
* enable consolidation support for solana ([1b8fcca](https://github.com/BitGo/BitGoJS/commit/1b8fcca3e6c6ce2125d6027834e50017c34e09a6))
* enable external signer mode for production ([077d2de](https://github.com/BitGo/BitGoJS/commit/077d2de7e477a2563b64b7d9be2fb7d4a594949b))
* **eos-tokens:** update explain transaction to support EOS tokens ([deab70b](https://github.com/BitGo/BitGoJS/commit/deab70b14be6ca1941588aae41e6cc0691d50aaf))
* **eos-tokens:** update explain transaction to support EOS tokens ([c8b7a24](https://github.com/BitGo/BitGoJS/commit/c8b7a24093a9e011b62e4a08b83eaa0782fb9752))
* **eos:** add eos token support ([6fb1319](https://github.com/BitGo/BitGoJS/commit/6fb1319cbf4dd076412d95fa1f93e7d2fca96305))
* **eth2:** add signMessage for ETH2 ([afbbcb2](https://github.com/BitGo/BitGoJS/commit/afbbcb2738002def0e48d06138a550b28a9b8a86))
* **eth:** add batcher ([cc4dfc3](https://github.com/BitGo/BitGoJS/commit/cc4dfc3ccdf9f845ef132a5efe36fb0dd05315ef))
* **eth:** build contract call transactions ([d6098fc](https://github.com/BitGo/BitGoJS/commit/d6098fcfcc1ff9657e6d85522c84af9fd3c10cd9))
* **eth:** enable eip1559 transactions for recovery ([f2b73ee](https://github.com/BitGo/BitGoJS/commit/f2b73ee9723b44de5ad874d13fe54291099ea41e))
* **eth:** generalize chain id configuration ([e97a7ce](https://github.com/BitGo/BitGoJS/commit/e97a7ce9b0134545b18825fc6be3d65c5f5fb1b0))
* **eth:** pass forwarderVersion flag ([9b56ab9](https://github.com/BitGo/BitGoJS/commit/9b56ab9321a3f53dcf5c7c8fc363cd7ac1b5df13))
* **eth:** update ethereumjs libs ([0bb3ada](https://github.com/BitGo/BitGoJS/commit/0bb3ada9eeb42aaa285dee277bf12ca49f5e4b6e))
* **eth:** verify pre-built eth txns ([f6a39c1](https://github.com/BitGo/BitGoJS/commit/f6a39c1205623149a26b543de3ec866cd5d2c860))
* **express:** add route for create address ([cdd3fec](https://github.com/BitGo/BitGoJS/commit/cdd3feca35881538bf83c01051792b86de6d9a11))
* **express:** add support for binding to an IPC socket (unix socket) ([b76c16c](https://github.com/BitGo/BitGoJS/commit/b76c16ca6d104b4fe6e47146a7c2e2a028552945))
* **express:** add support for returning keychains with generated wallet ([e04de53](https://github.com/BitGo/BitGoJS/commit/e04de5313ca418670c900e423a434ce2b6cf9a84))
* **express:** log request method and url upon failed request ([5a22ede](https://github.com/BitGo/BitGoJS/commit/5a22ede922509bd92fca09bf5be68dc3cff3445f))
* external signer to read encrypted privkeys ([32176e7](https://github.com/BitGo/BitGoJS/commit/32176e78edefa4cf3f5a853c33640604e812a42d))
* external signer to read private key from walletid ([735dcd9](https://github.com/BitGo/BitGoJS/commit/735dcd9cc0a00745405740d728c27da9aba993b3))
* feat: add pubkey aggregation ([7259779](https://github.com/BitGo/BitGoJS/commit/725977910f265d4d8726c153ed4b761a1a17437d))
* Fix CELO token transactionBuilder ([15b951a](https://github.com/BitGo/BitGoJS/commit/15b951a3b4a35b11e1cdafc5e98efffa8def729e))
* fixing halfSigned in SubmitTransactionOptions ([2603199](https://github.com/BitGo/BitGoJS/commit/2603199283e5598fd22318ec97d6983cca06c656))
* **hbar:** add check for key length ([b516bd0](https://github.com/BitGo/BitGoJS/commit/b516bd0559fbeaaca5415b24d0ff289819c3bbf4))
* **hbar:** update HBAR lib and protobufs ([425dbe5](https://github.com/BitGo/BitGoJS/commit/425dbe534984dc6da442c5f680608ed61d13f252))
* **hbar:** update hbar sdk ([b4bef77](https://github.com/BitGo/BitGoJS/commit/b4bef77c18c1ccf6933b1a4f853416375b10c4f1))
* implement keypair generation for casper in account-lib ([e944601](https://github.com/BitGo/BitGoJS/commit/e944601dda6182d9a2331ae2138de10afc3221cb))
* include feature flag for external signing API ([fedba73](https://github.com/BitGo/BitGoJS/commit/fedba7383214c6183261166c744a377547eaab74)), closes [#BG-38025](https://github.com/BitGo/BitGoJS/issues/BG-38025)
* make SDK derive key with address path for Tezos signing ([92ad147](https://github.com/BitGo/BitGoJS/commit/92ad1474ceaf7d43530a0581e76e43f5a38f2a01))
* **modules/bls-dkg:** add BLS-DKG module ([124a18b](https://github.com/BitGo/BitGoJS/commit/124a18bbc42c02345e7cc10cf79737f2d0d6481d))
* only allow external signing feature to run in test mode ([7b00932](https://github.com/BitGo/BitGoJS/commit/7b009324446b0b0546ca68832767afc5ef92f5c5))
* pass eip1559 fee params in send and sendmany ([73ef7fc](https://github.com/BitGo/BitGoJS/commit/73ef7fcca3f3559476063b4c16547e0314c42f13))
* **recovery:** cusomize gasPrice and gasLimit ([f777ba8](https://github.com/BitGo/BitGoJS/commit/f777ba842f69d11fb77254cfb8cc4f89e83eafbd))
* **remove fee address config from eth2 statics:** remove fee address config from eth2 statics ([38f0b40](https://github.com/BitGo/BitGoJS/commit/38f0b4019f22d7d72b3533a7ebac9127f7bf8686))
* resolve failing keycurve tests ([63702af](https://github.com/BitGo/BitGoJS/commit/63702afd782f7a85e2eaf55b344c63a992bb71e4))
* **root:** add unit-test-all to ci ([3d0efa4](https://github.com/BitGo/BitGoJS/commit/3d0efa49b3fb64dd658829e45c557152e8b7ae43))
* **root:** implement isWalletAddress for HBAR ([dc8d5fc](https://github.com/BitGo/BitGoJS/commit/dc8d5fca2c41881d97ffab084a1e6232f9a1c426))
* **root:** implement isWalletAddress for STX ([1828397](https://github.com/BitGo/BitGoJS/commit/1828397d1eedab1afde6e04ad64894437698cfa5))
* **root:** set tsconfig target to `es6` ([8c92c12](https://github.com/BitGo/BitGoJS/commit/8c92c12634722d4137d1c12c7e1e2f464973fae9))
* **root:** update SDK sendMany to use TSS ([6fef741](https://github.com/BitGo/BitGoJS/commit/6fef741913d6afb86ec3c73b6cdefe8a7c831afc))
* **root:** use lib "es2017" ([16ad3e4](https://github.com/BitGo/BitGoJS/commit/16ad3e4521ded7d5ef0f6da7e851d4c15e691d82))
* **sdk:** add feeLimit parameter to Send options ([c10d6fa](https://github.com/BitGo/BitGoJS/commit/c10d6fa384dc352aa082f1c4079dfa10fcde4e88))
* **sol:** address fee and id in explain transaction ([c494568](https://github.com/BitGo/BitGoJS/commit/c494568ceefa48b956fca6bc90bfdf707bf1b568))
* **sol:** implement parse transaction ([5a1f262](https://github.com/BitGo/BitGoJS/commit/5a1f262df2f9c4b250fc42d44626e59a39ad3b70))
* **sol:** initial implementation of explain transaction ([3e27360](https://github.com/BitGo/BitGoJS/commit/3e273608d70edf75faef4d62c59e7e1486fb3739))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* **statics:** add  new tokens ([805d911](https://github.com/BitGo/BitGoJS/commit/805d9111c08f8ce771f3ca02020ca92472b9d889))
* **statics:** add 2nd batch Feb tokens ([53aa64d](https://github.com/BitGo/BitGoJS/commit/53aa64d33ebb90bea1186ac39c2c4fce9464130f))
* **statics:** add add new tokens erc20 ([3e652ad](https://github.com/BitGo/BitGoJS/commit/3e652ad96946a51c25fbba9c8e5e9b3ee8a6b500))
* **statics:** add april tokens ERC20 and algo token ([a0cb164](https://github.com/BitGo/BitGoJS/commit/a0cb164d01872abc47925df97ddf43c35b58c7f1))
* **statics:** add arc20token and implementation ([ec6cf30](https://github.com/BitGo/BitGoJS/commit/ec6cf30349b6bf21af60bb37aa3dc2962a96a12a))
* **statics:** add AVAXC coin to statics ([0b8b1d6](https://github.com/BitGo/BitGoJS/commit/0b8b1d6e9198c63c910d3551d522db8996e3cc6a))
* **statics:** add Casper coin configuration to Statics ([f744b95](https://github.com/BitGo/BitGoJS/commit/f744b95b720aae1e1ddbd55a9bae5028f75e8b6a))
* **statics:** add casper explorer url ([fcb3a55](https://github.com/BitGo/BitGoJS/commit/fcb3a55f4db605e4e475383719e90949e63682e9))
* **statics:** add eos mainnet token config ([1ab6ee1](https://github.com/BitGo/BitGoJS/commit/1ab6ee1c0b47756b53705b7dbec9133cdd52738f))
* **statics:** add erc20 tokens ([fc496c3](https://github.com/BitGo/BitGoJS/commit/fc496c34a1b538ad1e31fbe6b4ab3a159590d40e))
* **statics:** add gteth support for trading ([53e5680](https://github.com/BitGo/BitGoJS/commit/53e56803407f54803e0c456bb32be87210a7cf59))
* **statics:** add imxv2 token ([68a7338](https://github.com/BitGo/BitGoJS/commit/68a733851cb393ad9f05510eda221ad2d6e19a45))
* **statics:** add matic coin config ([c6514c9](https://github.com/BitGo/BitGoJS/commit/c6514c98d494e7bc1a8ab110024d68abc51ae8f3))
* **statics:** add name property to networks ([6aebdd4](https://github.com/BitGo/BitGoJS/commit/6aebdd4a1a3b8972e890231a513fcd227cb53602))
* **statics:** add NEAR config ([61a74c1](https://github.com/BitGo/BitGoJS/commit/61a74c1749de1d9d7c5135451fcc8758efd4037b))
* **statics:** add new ERC20 and Stellar Tokens ([bad95cc](https://github.com/BitGo/BitGoJS/commit/bad95cc3ecbc7283fd131e50c7275b5fc2532d3e))
* **statics:** add new erc20 tokens to base.ts and coins.ts ([0e0e2c7](https://github.com/BitGo/BitGoJS/commit/0e0e2c763b2afa85d2a4acda80a3dec3b94e1d42))
* **statics:** add new erc20s for goerli london hard fork testing ([d566b39](https://github.com/BitGo/BitGoJS/commit/d566b39d3850eb69adc36ee7ad393faca1730dfd))
* **statics:** add new token ([fdf96bb](https://github.com/BitGo/BitGoJS/commit/fdf96bbb368b7a58e04f48edabbdace552212913))
* **statics:** add new tokens ([9328422](https://github.com/BitGo/BitGoJS/commit/93284228b12627efaa0e2f0c770f9dd733b9fc9f))
* **statics:** add new tokens ([b10781f](https://github.com/BitGo/BitGoJS/commit/b10781f075e69f2c6cd0f6ac5917f53dd031c090))
* **statics:** add new tokens ([c8d787c](https://github.com/BitGo/BitGoJS/commit/c8d787c0ad559c63dd75c6a504be086d50008833))
* **statics:** add new tokens ([db83f77](https://github.com/BitGo/BitGoJS/commit/db83f77e34054031496517d85f3517c4207edd74))
* **statics:** add new tokens ([4c113d3](https://github.com/BitGo/BitGoJS/commit/4c113d3e1b6436b70f645454656801a6ceb9f725))
* **statics:** add new tokens ERC20 ([4306190](https://github.com/BitGo/BitGoJS/commit/4306190a4d0a6f0dbfee413fc9bf88d0f431dde1))
* **statics:** add NPXS token again ([f258b41](https://github.com/BitGo/BitGoJS/commit/f258b414616b58e838c17cb8ca4758ca44132ceb))
* **statics:** add ofc casper coins support for trading ([a88406f](https://github.com/BitGo/BitGoJS/commit/a88406f444022d29ad6b5d746280025059a00217))
* **statics:** add ofc stacks coins support for trading ([3fa7ee4](https://github.com/BitGo/BitGoJS/commit/3fa7ee45a05dd873ca39aec9d1d452069ca19780))
* **statics:** add ofcavaxc and ofctavaxc support for trading ([c06f72c](https://github.com/BitGo/BitGoJS/commit/c06f72cb5a291f1badbf5374f88bbfba923ea208))
* **statics:** add priority tokens ([3b2b44b](https://github.com/BitGo/BitGoJS/commit/3b2b44bcd3f634da74b3b39c1cbee151e15ab67a))
* **statics:** add requires reserve ([28f4a6e](https://github.com/BitGo/BitGoJS/commit/28f4a6efefc8e71fb615eb5430dd4fc58b37dc21))
* **statics:** add support for several ERC20 tokens ([bfd95c2](https://github.com/BitGo/BitGoJS/commit/bfd95c2da0a2dc6acce093d0fa1e722a6d7a55db))
* **statics:** add tesnet tokenes ([de9d5b5](https://github.com/BitGo/BitGoJS/commit/de9d5b529b47c925f6e5741d599b06006bf58951))
* **statics:** add testnet tokens ([62c3273](https://github.com/BitGo/BitGoJS/commit/62c3273fa769f26b1304d9a7078d21308c81a02a))
* **statics:** add TOken MVI and WLUNA ([dbf3b0b](https://github.com/BitGo/BitGoJS/commit/dbf3b0b4cd92d7d0e2d8fda370ccb9a4a001d26a))
* **statics:** add token traxx ([752f2a3](https://github.com/BitGo/BitGoJS/commit/752f2a391bc5d23d4ae5b7eb3cfc70b2c3251f64))
* **statics:** add tokens jan batch 2nd ([0eb6d2c](https://github.com/BitGo/BitGoJS/commit/0eb6d2c7dbfab8ccdd89d81773b207412b96fa03))
* **statics:** add trx fee limit to statics ([50d01b8](https://github.com/BitGo/BitGoJS/commit/50d01b85de121c44825acb6fe21b69960d7431b7))
* **statics:** add usdc and usdt to config ([f96d622](https://github.com/BitGo/BitGoJS/commit/f96d622ba1f6244482f6cebc199f0ae783482fcd))
* **statics:** add usdc and usdt to config ([80934b7](https://github.com/BitGo/BitGoJS/commit/80934b7e0f168d5ef8d87470d96df850fa45e4e0))
* **statics:** add wec token ([b514252](https://github.com/BitGo/BitGoJS/commit/b51425253f22bc4ff8582a2292441ea2eaf55094))
* **statics:** add WETH and WBTC on tron ([5e2a631](https://github.com/BitGo/BitGoJS/commit/5e2a6316a48850b3a5df05018e768bf53b7573f2))
* **statics:** change name to gHDO and gHCN ([0112296](https://github.com/BitGo/BitGoJS/commit/011229645d474bfaf0e7529ac71d31e100285447))
* **statics:** coin feature custody ([448b45c](https://github.com/BitGo/BitGoJS/commit/448b45c072be055a1cf13974d0fc171a9a4e7350))
* **statics:** create FIAT currency in Testnet ([4b3bfcb](https://github.com/BitGo/BitGoJS/commit/4b3bfcb07c95cd9ca5cdf7d745fd5f56a3217652))
* **statics:** create FIAT tokens in Testnet ([9a4d727](https://github.com/BitGo/BitGoJS/commit/9a4d7275e1a65dd2cda54e8d4c8918f36f7952a8))
* **statics:** create fiat-usdc-tusdc ([a9a1d60](https://github.com/BitGo/BitGoJS/commit/a9a1d6058da72b1b1eebeec556d2af984ec660b6))
* **statics:** define coin sol in statics ([619d359](https://github.com/BitGo/BitGoJS/commit/619d359bebcbcca4cac6bf6a801eb89feb0b5997))
* **statics:** define coin sol in statics ([7d98009](https://github.com/BitGo/BitGoJS/commit/7d9800956bb10c14b2c377566ef8b3343a79b11c))
* **statics:** dot ignore coin init ([40b9015](https://github.com/BitGo/BitGoJS/commit/40b9015c262165e9d9d9f92f157964d60b3fe4d0))
* **statics:** dot statics addition ([60a0ecd](https://github.com/BitGo/BitGoJS/commit/60a0ecd008246706793d643078a979cf0497e68c))
* **statics:** eRC20 Token Support ([062b09c](https://github.com/BitGo/BitGoJS/commit/062b09c8eef4bee05eadfb4eef6ab1999de20e07))
* **statics:** eRC20 Token Support ([ba2d870](https://github.com/BitGo/BitGoJS/commit/ba2d8707fff934fe5124163bd78e52bf9a1730da))
* **statics:** fix address ([97d80a0](https://github.com/BitGo/BitGoJS/commit/97d80a090d2a25fbeabaedc244f537d7071d3830))
* **statics:** fix BXX address ([fa12160](https://github.com/BitGo/BitGoJS/commit/fa12160625c24161edf2ecbcafadf8cdd776408f))
* **statics:** hot fix address FDT AND FET1 ([153b3b3](https://github.com/BitGo/BitGoJS/commit/153b3b39b4b6b2716fc1f909c9cf5519ee71fec8))
* **statics:** implement iterator for CoinMap ([a4a2f4b](https://github.com/BitGo/BitGoJS/commit/a4a2f4b830084a136840abbaf3b30fe5852a60e1))
* **statics:** new tokens ([bbdf990](https://github.com/BitGo/BitGoJS/commit/bbdf990b660499333fdbf3b895c34137f2ab7298))
* **statics:** new tokens being added ([1491060](https://github.com/BitGo/BitGoJS/commit/1491060833c9c9bba2934191fa532a563999340a))
* **statics:** onboard erc-20 coins in groups 1-3 ([92c184e](https://github.com/BitGo/BitGoJS/commit/92c184e2db02cdf21e8e4265fc0b304a72601b43))
* **statics:** onboard february tokens ([5493311](https://github.com/BitGo/BitGoJS/commit/549331175e3f42925c0c2a45c7c3fc12326c92cd))
* **statics:** onboard tokens for prime trading ([681c4dd](https://github.com/BitGo/BitGoJS/commit/681c4dd40778ec8a542c7a9125c5d33c6a85c9cc))
* **statics:** onboarding  jan batch ([3753850](https://github.com/BitGo/BitGoJS/commit/375385035ce30b6202576a79e229355e49e3ee93))
* **statics:** onboarding BXXV1 token ([d05ec73](https://github.com/BitGo/BitGoJS/commit/d05ec73078c101dfd1fab48bf23511900b4c860f))
* **statics:** polkadot unit tests and exporer url ([1842a1f](https://github.com/BitGo/BitGoJS/commit/1842a1f98c3f8ee9057469d417a8da70889bddd0))
* **statics:** rename burp token ([762fb19](https://github.com/BitGo/BitGoJS/commit/762fb198b8ca381cd8a5a9c1b92e159cd4130781))
* **statics:** revert DYNS token to DYN ([a2a7f5b](https://github.com/BitGo/BitGoJS/commit/a2a7f5b6e6de05bbcbe1643ca5b4c630bdac92cf))
* **statics:** support new Algo token name format ([47a1cd7](https://github.com/BitGo/BitGoJS/commit/47a1cd7a66530795f853f7d775da5a4153c975a0))
* **statics:** update contract addresses ([db652bf](https://github.com/BitGo/BitGoJS/commit/db652bfa9d3cc1128a4ff04ebc07145ab97e508a))
* **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))
* **statics:** update decimal places for c8p token ([b5604ca](https://github.com/BitGo/BitGoJS/commit/b5604ca1f3af09e61cd9bf28cb16d08b74e06958))
* **statics:** update EOS with SUPPORTS_TOKENS feature ([241630c](https://github.com/BitGo/BitGoJS/commit/241630c8f36c6c6441cda2dc01331de816196e39))
* **statics:** update token contract addresses ([85744bf](https://github.com/BitGo/BitGoJS/commit/85744bf3c66141cd3841259acb91d4f2eab1a958))
* **statics:** update Token Gog ([b3dde20](https://github.com/BitGo/BitGoJS/commit/b3dde20d5fbc2e768f4bfc23fad949e6dfdd7005))
* **statics:** update USDC and USDT name and address ([83c9b06](https://github.com/BitGo/BitGoJS/commit/83c9b0684499d0482b99301f74e69ff796123075))
* **statics:** update westend metadata ([a057ed5](https://github.com/BitGo/BitGoJS/commit/a057ed51b84819ad455469f29bf1774ed756ffe0))
* **statics:** wtk token contract update ([eadb5eb](https://github.com/BitGo/BitGoJS/commit/eadb5eb6f51a868411d2253b7525462e0e196f26))
* **stx:** remove 0 in memo ([7f5d531](https://github.com/BitGo/BitGoJS/commit/7f5d53159a6f54760799fb36d776f541c29d765e))
* **support flush coins:** support flushing coins ([2afcddf](https://github.com/BitGo/BitGoJS/commit/2afcddffd762d9e50343b234b736735eb23c6990))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))
* support validation of  base58 dot public keys ([a8fae0d](https://github.com/BitGo/BitGoJS/commit/a8fae0d0e69154327625a523afdc2b5f4e512cda))
* **terc token:** update decimal places for terc token ([d9d2de6](https://github.com/BitGo/BitGoJS/commit/d9d2de685296f3ec6e3ad40e53d04158540cd516))
* **Tron TransactionBuilder:** validateKey ([b42e67e](https://github.com/BitGo/BitGoJS/commit/b42e67e8f4dab69ef9984f539db12e84e0edb3da))
* **trx account lib:** add contract call builder ([01137d2](https://github.com/BitGo/BitGoJS/commit/01137d2be9ce535dd30482cd5d143f335e3369e1))
* **trx account lib:** inputs and outputs complement ([be2d51f](https://github.com/BitGo/BitGoJS/commit/be2d51fcc03c9945c25cd7c48d10dc774f9acfad))
* tss keychain creation ([93c33be](https://github.com/BitGo/BitGoJS/commit/93c33be9bdf62ef2bb676f04a509e564cf5c7725))
* unhardened derivation with tss ([ce29c26](https://github.com/BitGo/BitGoJS/commit/ce29c26bfcdbf9b1e015d8ef759ec1b2b29ccda9))
* **unspents:** add p2tr tests ([8a0f084](https://github.com/BitGo/BitGoJS/commit/8a0f0841eabd07478b6f40129e15e83954743fc9))
* **unspents:** classify p2tr script path sigs ([28d6860](https://github.com/BitGo/BitGoJS/commit/28d6860e1beedf0dd2ba0bb708530fd9032071fe))
* **unspents:** use `parsed.scriptType` parameter in fromInput ([84dd467](https://github.com/BitGo/BitGoJS/commit/84dd4670aaadb11fd966d4d3637f02b54d2c5ffc))
* update params to post /signatureshares ([49cdcdd](https://github.com/BitGo/BitGoJS/commit/49cdcdd9fb1af3f3cb316251fd0682740e31b390))
* update secp256k1 in core to ^4 ([bfb3128](https://github.com/BitGo/BitGoJS/commit/bfb3128131b19d07540174e6c250ae3b353ecd54))
* update tss key creation to support hd ([9611e5d](https://github.com/BitGo/BitGoJS/commit/9611e5dce0460d0fae691fbc90c887d3f8e720fd))
* update tss signing to support hd ([a3b3b3f](https://github.com/BitGo/BitGoJS/commit/a3b3b3fed18a462d85d11a6f0fd498edf0f699e2))
* **utxo-bin:** add package `utxo-bin` ([149f81c](https://github.com/BitGo/BitGoJS/commit/149f81c7452c93c2a0b7c221eb4a9dcd99befafd))
* **utxo-bin:** add support for odd transactions ([4c44297](https://github.com/BitGo/BitGoJS/commit/4c442974b5638f97db2ca013ecd887adaa9f8707))
* **utxo-bin:** use prevOutputs, spend status ([9f8bbfb](https://github.com/BitGo/BitGoJS/commit/9f8bbfbe7479e7bfde21532efb64c00379e485bd))
* **utxo-lib:** add `bitgo/wallet` package ([78aff6c](https://github.com/BitGo/BitGoJS/commit/78aff6c1260266ab4c7e1b84d07177e5237d2eaa))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([ee826bd](https://github.com/BitGo/BitGoJS/commit/ee826bd8f6ef96ad0b1f1986ac648f9498634ba8))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([5ea5758](https://github.com/BitGo/BitGoJS/commit/5ea5758fbadfc4d474d7fca627f2dde85e9d3514))
* **utxo-lib:** add `wallet/chains` ([0439a0d](https://github.com/BitGo/BitGoJS/commit/0439a0d4ffe4a15a9932ed70f98cc5745cc6526f))
* **utxo-lib:** add addressFormats ([c1bd457](https://github.com/BitGo/BitGoJS/commit/c1bd45796e0bae9c2fdd4964f2771812147f14d3))
* **utxo-lib:** add captured test fixtures ([0f98933](https://github.com/BitGo/BitGoJS/commit/0f98933cb21a501967ebc78411fb093221b51aa9))
* **utxo-lib:** add createSpendTransaction match test ([436104a](https://github.com/BitGo/BitGoJS/commit/436104aabcb256e1045afc263473a808af8467ca))
* **utxo-lib:** add createTransactionFromHex() ([a7c6032](https://github.com/BitGo/BitGoJS/commit/a7c6032c5f947c372d9a18fb44343c4e53b5ba27))
* **utxo-lib:** add getDefaultSigHash(network) ([bdb5ace](https://github.com/BitGo/BitGoJS/commit/bdb5acebf94bf91540c6491489c69c8f41a40cca))
* **utxo-lib:** add isSupportedScriptType(network, scriptType) ([ae53ab8](https://github.com/BitGo/BitGoJS/commit/ae53ab868c2bc9c9a64d628c5538861c08abef6f))
* **utxo-lib:** add more assertions to createOutputScript2of3 ([29e5735](https://github.com/BitGo/BitGoJS/commit/29e5735410e09a77ad6a178ffd5488fdd97a8828))
* **utxo-lib:** add p2tr output scripts support ([3aebc5b](https://github.com/BitGo/BitGoJS/commit/3aebc5b77052e02b2cd688d01935c7e199e25902))
* **utxo-lib:** add p2tr output scripts support ([7af9d9e](https://github.com/BitGo/BitGoJS/commit/7af9d9e6da4d6f2ba83b26794ba58ccaf4b738a9))
* **utxo-lib:** add padInputScript ([0c1be6e](https://github.com/BitGo/BitGoJS/commit/0c1be6e7bf37ef1bd6392b8492624cefc83e4f8c))
* **utxo-lib:** add ParsedSignatureScriptTaproot ([206c860](https://github.com/BitGo/BitGoJS/commit/206c860a98fa6393399a8d9d56cee63d9dbc5c72))
* **utxo-lib:** add property `scriptType` to ParsedSignatureScript ([c0b678f](https://github.com/BitGo/BitGoJS/commit/c0b678f2b28cf81e41399902a6bdb5e1592c4e3a))
* **utxo-lib:** add RPC tests ([1a9a9c5](https://github.com/BitGo/BitGoJS/commit/1a9a9c519e38d6eecaed572ff47f33d9dc25e50a))
* **utxo-lib:** add scriptPathLevel to ParsedSignatureScriptTaproot ([27cf563](https://github.com/BitGo/BitGoJS/commit/27cf563f7121f7306f39c9e3b3477c70c485f69d))
* **utxo-lib:** add scriptType argument for getDefaultSigHash ([87d5b7f](https://github.com/BitGo/BitGoJS/commit/87d5b7f521bffaf76885ab76c83be427cb6811be))
* **utxo-lib:** add scriptTypeForChain() ([e11cabe](https://github.com/BitGo/BitGoJS/commit/e11cabe06ef98311270131462142d78f13c73063))
* **utxo-lib:** add signature helpers, tests ([5ea779e](https://github.com/BitGo/BitGoJS/commit/5ea779e2983a7421d4ac9aeb02708aa414c7cc9a))
* **utxo-lib:** add signInput2Of3(), signInputP2shP2pk() ([e3927c0](https://github.com/BitGo/BitGoJS/commit/e3927c010bae3e8e142da15b2975493768135a3e))
* **utxo-lib:** add support for p2tr in signInput2Of3 ([7890854](https://github.com/BitGo/BitGoJS/commit/78908547f27ab52baa4f6e7c5d5561ecaf422863))
* **utxo-lib:** add support for PrevOutput[] in TransactionBuilder ([cdf1899](https://github.com/BitGo/BitGoJS/commit/cdf1899da3db97e6229e23373e1921b4634f44cf))
* **utxo-lib:** add support for Zcash version 5 "NU5" ([5d2c383](https://github.com/BitGo/BitGoJS/commit/5d2c383454383725bb57b7e676851cdfcba86521))
* **utxo-lib:** add test comparing rpc data to parsed data ([bd5fb7a](https://github.com/BitGo/BitGoJS/commit/bd5fb7aa550d5510ff062db94d342ebddb8890ef))
* **utxo-lib:** add test fixtures for special dash transactions ([0a655ae](https://github.com/BitGo/BitGoJS/commit/0a655aee64022b6f368f867445162b1f8f3cf4cd))
* **utxo-lib:** add tests for half-signed transactions ([c8e5222](https://github.com/BitGo/BitGoJS/commit/c8e52229115846303110f24421836500b1140bc9))
* **utxo-lib:** add thirdparty fixtures ([9d48994](https://github.com/BitGo/BitGoJS/commit/9d48994887aaa094fc2ee2cd375384c154473fab))
* **utxo-lib:** add verifySignatureWithPublicKeys ([4682727](https://github.com/BitGo/BitGoJS/commit/46827273ab457c4073cd468d9a33c39b128234a3))
* **utxo-lib:** add wrappers for Transaction(Builder) constructors ([62aafa9](https://github.com/BitGo/BitGoJS/commit/62aafa98e69b88a801d0fb5bb3e751391a426f44))
* **utxo-lib:** add zcash version 450 ([8f9d332](https://github.com/BitGo/BitGoJS/commit/8f9d332e6b7517cb132c7fc749b587c6aadcc201))
* **utxo-lib:** add, use parseTransactionRoundTrip ([fc2ece4](https://github.com/BitGo/BitGoJS/commit/fc2ece41ead787a9103cb74ffdf0132a3acd3a48))
* **utxo-lib:** allow select networks in integration_local_rpc ([dfc6696](https://github.com/BitGo/BitGoJS/commit/dfc66966a0c7c6e8be5cd5fca7250e30920a9beb))
* **utxo-lib:** export address check types ([411db60](https://github.com/BitGo/BitGoJS/commit/411db60aa0df6b85e253b59d1641476bac46a4df))
* **utxo-lib:** export type NetworkName ([df27a99](https://github.com/BitGo/BitGoJS/commit/df27a9951edf9a178594a388a353f6933beee053))
* **utxo-lib:** export, use BitcoinJSNetwork ([ce85f44](https://github.com/BitGo/BitGoJS/commit/ce85f44aad5e36903d29c66d7e3ec179c9c4f887))
* **utxo-lib:** expose lower-level signature validation methods ([4a2e276](https://github.com/BitGo/BitGoJS/commit/4a2e2769f6e8c9281e050e3a6e2df3ce498bf68b))
* **utxo-lib:** implement parseSignatureScript for p2tr ([d600c42](https://github.com/BitGo/BitGoJS/commit/d600c42a0cca9163b5a6611e7e9fd4d7fd995245))
* **utxo-lib:** improve p2tr readability, types ([81faf11](https://github.com/BitGo/BitGoJS/commit/81faf110d818f648796ca4c1d078b71149577d69))
* **utxo-lib:** move outputScripts to bitgo subpackage ([c1b0fa7](https://github.com/BitGo/BitGoJS/commit/c1b0fa722243d7d6c28ae0b7762387e24d234052))
* **utxo-lib:** support import from `src/bitgo` ([f5ca9dd](https://github.com/BitGo/BitGoJS/commit/f5ca9dde4c9435d483791fd6075f4cde41931f8f))
* **utxo-lib:** support p2shP2pk inputs ([f034ead](https://github.com/BitGo/BitGoJS/commit/f034ead6d4ca5d2a11bcd7c1c7042e6de5dd04de))
* **utxo-lib:** support schnorr signature verification ([6e24fd6](https://github.com/BitGo/BitGoJS/commit/6e24fd621a4d1a0a87a1f9ecaab61ce514cad857))
* **utxo-lib:** test createTransactionBuilderFromTransaction ([9761ec7](https://github.com/BitGo/BitGoJS/commit/9761ec7c5b7bc5460a6b7134406c6d3142fc515d))
* **utxo-lib:** use `ChainCode` for `WalletUnspent['chain']` ([6c9c73b](https://github.com/BitGo/BitGoJS/commit/6c9c73b13a32f847912d944748c2ef67fca913fe))
* **utxo-lib:** use new package name and new external links ([3805eee](https://github.com/BitGo/BitGoJS/commit/3805eee8abc955b1d92da00c650c684e1662ac19))
* **utxo:** accept txBuilder in signAndVerifyWalletTransaction ([61d8335](https://github.com/BitGo/BitGoJS/commit/61d8335c527615b6f80d57eed6ce7ffadf985d61))
* **utxolib:** add bitcoingoldTestnet ([06c1dd6](https://github.com/BitGo/BitGoJS/commit/06c1dd6f7ae9e738fedd398e7665b84c03daf46c)), closes [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L332](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L332) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L329](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L329) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L326](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L326) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L327](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L327) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L328](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L328) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h#L35](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h/issues/L35)
* **utxolib:** implement padInputScript for p2wsh transactions ([f73f7ea](https://github.com/BitGo/BitGoJS/commit/f73f7eaebf1e675e9203beb383f35fc4193c130a))
* **utxo:** update createTaprootScript2of3 ([31bb3ed](https://github.com/BitGo/BitGoJS/commit/31bb3edfb2046daabeea14587cf7735c4c383783))
* **wp:** added support of cashaddr for create address ([fcdc261](https://github.com/BitGo/BitGoJS/commit/fcdc261df6187d9befb30c81ba6882056e9a9ffb))


### Bug Fixes

* **account-lib:** add hash to signable ([401266a](https://github.com/BitGo/BitGoJS/commit/401266a4094be9ab7d034565476635817fdf828b))
* **account-lib:** add input/output in stx contract call ([05f95f9](https://github.com/BitGo/BitGoJS/commit/05f95f9df5c468bd4ddbaede874cf8e9ed58a014))
* **account-lib:** add more checks and tests ([423bc26](https://github.com/BitGo/BitGoJS/commit/423bc26196d0fcb9f5f8cdf5110f446b804a051d))
* **account-lib:** add parsing for optional type in stringifyCV ([3f3fddb](https://github.com/BitGo/BitGoJS/commit/3f3fddbb37ea970eac8311585f22bb8dc6a8d0dc))
* **account-lib:** bG-29930 Update and pin hashgraph sdk version ([5654e37](https://github.com/BitGo/BitGoJS/commit/5654e37b4500f7fe8c9e81d22a6ce9c2a1e76410))
* **account-lib:** change statics version back to ^6.0.0 ([49f0a02](https://github.com/BitGo/BitGoJS/commit/49f0a02273ce1d6b0881bfa4a05eb8743780326f))
* **account-lib:** changed key validation for Solana ([274af3b](https://github.com/BitGo/BitGoJS/commit/274af3b8cd395f9969224aa2441de558514fbb8a))
* **account-lib:** check accountId for null before accessing property ([b3639d8](https://github.com/BitGo/BitGoJS/commit/b3639d86f757d840bc6433cd9968d1158b75e2ec))
* **account-lib:** dot unit test memory issue ([709266b](https://github.com/BitGo/BitGoJS/commit/709266b172bcd288e1912b9441752bd3be4545b8))
* **account-lib:** eip1559 transaction builder deserialization ([32a3151](https://github.com/BitGo/BitGoJS/commit/32a31518cf1ffcddad5225baa7073b62e4779280))
* **account-lib:** fix addSignature method of cspr transaction ([ce00564](https://github.com/BitGo/BitGoJS/commit/ce005643424f5306a60e688306194cf14bb69846))
* **account-lib:** fix amount in cspr delegate & undelegate builders ([43b0b3f](https://github.com/BitGo/BitGoJS/commit/43b0b3fcf2fbc3eb2420e943a27e0cfb28065dd1))
* **account-lib:** fix amount method unit ([8df519b](https://github.com/BitGo/BitGoJS/commit/8df519b83c08ce985b6011edf6685eafb948eea4))
* **account-lib:** fix chain name used in CSPR transactions ([a54cdab](https://github.com/BitGo/BitGoJS/commit/a54cdab2126a0b81b66029aef8ce5684c107e192))
* **account-lib:** fix CSPR address validation ([db92eb4](https://github.com/BitGo/BitGoJS/commit/db92eb45c69a37abd0a118194205208682ba32c8))
* **account-lib:** fix CSPR address validation for encoding change ([91b1ba3](https://github.com/BitGo/BitGoJS/commit/91b1ba35cfa86560aae6c0e7ec2d25b7c969b891))
* **account-lib:** fix decode signed algo transaction ([fd82efe](https://github.com/BitGo/BitGoJS/commit/fd82efee18ab186b1d14d301a99fa803edaffa7f))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([977d4df](https://github.com/BitGo/BitGoJS/commit/977d4df509101cd463d81ce2330b59ad2dc90b6e))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([94e0fa2](https://github.com/BitGo/BitGoJS/commit/94e0fa27a3b39e139f441fafc7a834a2e0007cdf))
* **account-lib:** fix get account hash method ([e321c9c](https://github.com/BitGo/BitGoJS/commit/e321c9c077aef8a8d798cf6d77b1e47d4bd8efd1))
* **account-lib:** fix getTransferId method of cspr utils ([2d3d658](https://github.com/BitGo/BitGoJS/commit/2d3d658d17cc1f4e790ba3164b014df412b4ffff))
* **account-lib:** fix isValidPublicKey to check for undefined pubKey ([9020a0f](https://github.com/BitGo/BitGoJS/commit/9020a0f26b5681eab2e2081be37862e8e8d3f782))
* **account-lib:** fix lint errors ([56b789f](https://github.com/BitGo/BitGoJS/commit/56b789f5ca161bc8c5f14e95ea81d3db67e9b9b5))
* **account-lib:** fix lint errors ([cc87263](https://github.com/BitGo/BitGoJS/commit/cc872636370ed76e39c7c5726ad9afbbdecd855d))
* **account-lib:** fix postcondition for send many builder ([7c3c70f](https://github.com/BitGo/BitGoJS/commit/7c3c70fa7d01586c3e95583f45c02f69ff8411e1))
* **account-lib:** fix processSigning method of cspr transactionBuilder ([895c643](https://github.com/BitGo/BitGoJS/commit/895c643e7af72d311b92931deed8fcccf14f2752))
* **account-lib:** fix solana isValidAddress ([0f1cd93](https://github.com/BitGo/BitGoJS/commit/0f1cd93dd30d5cc7313201f4bf2ec9f657022465))
* **account-lib:** fix test ([31763a1](https://github.com/BitGo/BitGoJS/commit/31763a1ae3183e0b908427fa9b67b2350e76cbe3))
* **account-lib:** fix trx fee limit boundary ([059cf6e](https://github.com/BitGo/BitGoJS/commit/059cf6ef80b2d69693a72e2eb7bff6db3a383d30))
* **account-lib:** fix types in algo utils and typos ([415225c](https://github.com/BitGo/BitGoJS/commit/415225ceb3ad95f63b98d4235f0dbc975dbc83e1))
* **account-lib:** fix typo on json field ([3025e83](https://github.com/BitGo/BitGoJS/commit/3025e83071f56d3fc03621aeb14a5ce473f4573a))
* **account-lib:** fix validate algo address test ([801846d](https://github.com/BitGo/BitGoJS/commit/801846dad63010c53ff7e614f7ded1aea6e4c8e3))
* **account-lib:** fix validity windows unit test ([1f39b99](https://github.com/BitGo/BitGoJS/commit/1f39b99bcfe6e921c9c69d5183925270c4468861))
* **account-lib:** fixed tobroadcastformat method ([8cf3353](https://github.com/BitGo/BitGoJS/commit/8cf335353dc0b9a9f0091ac7ced099cdddee4a35))
* **account-lib:** merge-related changes (stacks renamed to stx, etc) ([64a9597](https://github.com/BitGo/BitGoJS/commit/64a9597e6eec4e230b0e4bfcb28021f66adcc18c))
* **account-lib:** readd `es5` target and `esModuleInterop` ([f2e316d](https://github.com/BitGo/BitGoJS/commit/f2e316dd6df0eb2387516b755ce84b9c96e523c4))
* **account-lib:** remove algo utils ([ba8ea30](https://github.com/BitGo/BitGoJS/commit/ba8ea301c639bdbf3e5c033b8f854cef94498086))
* **account-lib:** remove proxy type from constants STLX-12064 ([82b1d47](https://github.com/BitGo/BitGoJS/commit/82b1d475a7c958d0d7420998e55c603f1a29f214))
* **account-lib:** remove unused import ([fe4555f](https://github.com/BitGo/BitGoJS/commit/fe4555fe5bd91ba936ae8a807153a94864bb301d))
* **account-lib:** stacks multi sig issue ([253c46d](https://github.com/BitGo/BitGoJS/commit/253c46dce8b31dc19b9cb987fbcf339652edf39e))
* **account-lib:** stx default signers to 2 ([02a6c56](https://github.com/BitGo/BitGoJS/commit/02a6c56c44983fb81b6d143783db431be2326a6f))
* **account-lib:** stx get signatures to return only signatures ([271fefb](https://github.com/BitGo/BitGoJS/commit/271fefbb6e9e74ba34e10cc14553961434c11902))
* **account-lib:** stx half sign tx ([0925fe4](https://github.com/BitGo/BitGoJS/commit/0925fe4018431f2b5db48620b8dbcc51267cecd0))
* **account-lib:** update algo decode transaction method ([e142775](https://github.com/BitGo/BitGoJS/commit/e142775f19bad0fec015fe9eb1bf73afca87f6ee))
* **account-lib:** update dot feeOption jsdoc ([dff22a8](https://github.com/BitGo/BitGoJS/commit/dff22a82012399bb95314ae31cbc52407028375d))
* **account-lib:** update static values for dot tests STLX-11678 ([773800e](https://github.com/BitGo/BitGoJS/commit/773800e47e75902b7e30d7bbbc0807f166fc73e9))
* **account-lib:** update validitiyWindow dot validation ([47d35ff](https://github.com/BitGo/BitGoJS/commit/47d35ffc23deb143e7c32b2d180fdbe584698299))
* **account-lib:** use stable version of @bitgo/blake2b ([77d035a](https://github.com/BitGo/BitGoJS/commit/77d035acaa5ff9925a891075375c91db5158811e))
* **account-lib:** yarn lock after revert ([f1b66b2](https://github.com/BitGo/BitGoJS/commit/f1b66b2959a41412b34c8f59c5981b43a139482b))
* **accountlib:** fix getStxAddressFromPubKeys to add signatures required paramater ([2d7e5ae](https://github.com/BitGo/BitGoJS/commit/2d7e5ae9ca59f592b65e15c8b06ce63db27754bd))
* **accountlib:** improve multisig in order to user any order or combination of keys ([37235fd](https://github.com/BitGo/BitGoJS/commit/37235fdfdc83133eab1db185b1598671c092a89c))
* **accountlib:** stx transactionBuilder network fix ([d966f10](https://github.com/BitGo/BitGoJS/commit/d966f1084c3cf935fc3c7e125490088a5edf530a))
* add `publishConfig` package.json of public packages ([195ac13](https://github.com/BitGo/BitGoJS/commit/195ac137d9a8da9c6c6cfe5821738ecc898b6c2c))
* add `publishConfig` package.json of public packages ([28cf439](https://github.com/BitGo/BitGoJS/commit/28cf439c49a075de7241895374ccce6318792b1c))
* add more informative error msg ([4fbb634](https://github.com/BitGo/BitGoJS/commit/4fbb634e6bfaf707322a369ab70241956a770d76))
* add new tokens ([c1db855](https://github.com/BitGo/BitGoJS/commit/c1db855ac2a0a970b4052adab86a3c261760c577))
* add to base and changes for prettify ([95035a8](https://github.com/BitGo/BitGoJS/commit/95035a82193f5c2a722463c948386723b9afb43a))
* add up-to-date node version support info to README ([6eb0962](https://github.com/BitGo/BitGoJS/commit/6eb0962a0469bafd151b7ab02940aae0ad97b857))
* address review comments ([261bc0a](https://github.com/BitGo/BitGoJS/commit/261bc0a062756e98897edfc3e2494e6ed1cb7574))
* adds wallet version support in core ([f76e71a](https://github.com/BitGo/BitGoJS/commit/f76e71a8f8b492155500ad2f429a95f7310ca897))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([931ef50](https://github.com/BitGo/BitGoJS/commit/931ef50e7cc093923c3b6a799f7d70472171bf2a))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([ef1afb8](https://github.com/BitGo/BitGoJS/commit/ef1afb8ead03e852a4a40060f7d423967b9b032f))
* **algo:** invalid signature on create wallet (bg-38048) ([c7071cc](https://github.com/BitGo/BitGoJS/commit/c7071ccbbbe1d6889cd912242addbe37c04fb0c7))
* **algo:** support for signing unsigned keyreg transaction (bg-37892) ([ffdfdf2](https://github.com/BitGo/BitGoJS/commit/ffdfdf24085f5d1b2fba262d7ac5bcfa5761126f))
* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** fix avaxctoken cannot withdraw ([a3c1dc7](https://github.com/BitGo/BitGoJS/commit/a3c1dc78a994e040df2a17b7488dae6a39090fff))
* **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
* **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))
* **bitgo:** fix verifyTransaction for near ([9d5cf1f](https://github.com/BitGo/BitGoJS/commit/9d5cf1f3363a321363bf39cdde76a99c2eae9e6a))
* **bitgojs:** fix security audit build failure ([347cc22](https://github.com/BitGo/BitGoJS/commit/347cc227f11b6efb5f5eed0277d41d2921e0ba94))
* **bitgojs:** revert revert of algo-tokens changes ([5784921](https://github.com/BitGo/BitGoJS/commit/5784921456c625340b8101a1ad9b528fc4aa1686))
* **bitgojs:** revert revert of algo-tokens changes ([a469736](https://github.com/BitGo/BitGoJS/commit/a469736ef57afa47d829d223cfd7fb4b86771c52))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* **blockapis:** use correct mocha import ([958b2c0](https://github.com/BitGo/BitGoJS/commit/958b2c093df39b5ec80ca793ba9d71d451fa7d57))
* **bls-dkg:** add publish config for public package ([c530435](https://github.com/BitGo/BitGoJS/commit/c530435a1ac863ee9d1e6b9d48b5bc73db101811))
* catch etherscan rate limit error ([d0b1b0f](https://github.com/BitGo/BitGoJS/commit/d0b1b0f4670695af7eebd41ff474d3d9edcacc74))
* change automated commit message to be conventional-commits compatible ([d824782](https://github.com/BitGo/BitGoJS/commit/d8247827775261f7b9ba3fe917751aec169c905b))
* change keyname from asset to symbol in amount ([5b23bf7](https://github.com/BitGo/BitGoJS/commit/5b23bf780adb8288336e807c45c2a745d876599d))
* change the token address for cqt ([1149bdc](https://github.com/BitGo/BitGoJS/commit/1149bdcfb02276556dea04e0ee84bdbfd4661713))
* change the token address for cqt ([2c545da](https://github.com/BitGo/BitGoJS/commit/2c545dae350b84806ba66fb9455718602420e3f9))
* check account properties before using ([9d2457f](https://github.com/BitGo/BitGoJS/commit/9d2457fb62bbf6079f55cb0125b4d714dd9cf2d7))
* **ci:** add signature to .drone.yml when it gets regenerated from the .drone.jsonnet ([00c80a9](https://github.com/BitGo/BitGoJS/commit/00c80a950682a214ff072aa36eb9c5f06cf5beb8))
* **ci:** ignore merge commits when checking commit messages ([b24707e](https://github.com/BitGo/BitGoJS/commit/b24707ee3a96304a0ab7a1f8c68f565f0309305f))
* **codeowners:** add eth-team to codeowners ([dd84a05](https://github.com/BitGo/BitGoJS/commit/dd84a0548dcebe93a9c68b7d9d13bee20e547911))
* **config:** add BSV and BCHA as recoverable coin with coincover ([76f7b40](https://github.com/BitGo/BitGoJS/commit/76f7b40e93dfbe59307e180317a2b5f94f06087e))
* **core:** accountSet txn support ([2e3b236](https://github.com/BitGo/BitGoJS/commit/2e3b2368e5a19ef1fa5feae1a65f3091ca63e0f6))
* **core:** add a "memo" field to stx's explainTransaction's displayOrder ([be8c251](https://github.com/BitGo/BitGoJS/commit/be8c251fbfc3380ff1edcd310a070002efeb962a))
* **core:** add algo seed encoding ([c0f8ea5](https://github.com/BitGo/BitGoJS/commit/c0f8ea5cd07e1f106ab17ad09399e04b1f6591af))
* **core:** add algo seed encoding ([8808b1c](https://github.com/BitGo/BitGoJS/commit/8808b1cfa228cf81d91a064b0f24e97e05670f2d))
* **core:** add base `explainTransaction` method ([4731af3](https://github.com/BitGo/BitGoJS/commit/4731af36cb4992843c4ecfde77395098afc5a10d))
* **core:** add flush threshold example ([6048485](https://github.com/BitGo/BitGoJS/commit/6048485fc255e6db8dff581e91bbfbef81aade90))
* **core:** add missing dep on `@bitgo/blockapis` ([a2cd98e](https://github.com/BitGo/BitGoJS/commit/a2cd98e3ebb65a6f0b243ec5ab1b1840342c309f))
* **core:** add multisig type param on add wallet ([2622028](https://github.com/BitGo/BitGoJS/commit/2622028bfe2b4d50aa15ae20e12e92fc27f10e5e))
* **core:** add route name as tx type for consolidate/fanout ([b6c4733](https://github.com/BitGo/BitGoJS/commit/b6c4733ae942ed893772111400e1bb56593ca03a))
* **core:** add signing params for hopTx ([987bc33](https://github.com/BitGo/BitGoJS/commit/987bc3315a45e730f1576ee6ccb6191117aa20f2))
* **core:** add transferid to list of valid tx params ([7e222db](https://github.com/BitGo/BitGoJS/commit/7e222dbfe0f1547ca28364c113e0a13b88bd6842))
* **core:** add transferid to sendmany options ([d713f4a](https://github.com/BitGo/BitGoJS/commit/d713f4a015d8167d4658f76cbf58d62fd810cb50))
* **core:** address verification should fail for uppercase bech32 addresses ([39c5d7c](https://github.com/BitGo/BitGoJS/commit/39c5d7cbdd793ade4ba939bf4c6df1b4d9ec5e79))
* **core:** algosdk typings ([80095b1](https://github.com/BitGo/BitGoJS/commit/80095b1d665282cf81d241f09364ec36c5b98a81))
* **core:** allow for ENS resolution in WP to change recipient addr(eth) ([8d8a9e5](https://github.com/BitGo/BitGoJS/commit/8d8a9e589cff5ee717b2dea9a22ddc2c7b75e26d))
* **core:** allow paygo outputs for empty verification options object ([b20405c](https://github.com/BitGo/BitGoJS/commit/b20405c36fee2681aa974ff4e5f3c6f6cd3109f3))
* **core:** always fetch full key triple for signing ([3af1ab2](https://github.com/BitGo/BitGoJS/commit/3af1ab238a5e491f1503645f09c696a4785950aa))
* **core:** body not being included in HMAC ([50babb5](https://github.com/BitGo/BitGoJS/commit/50babb5473f3c2c4b2138a411870d5f93d0997b5))
* **core:** break cyclical dependency ([0d00616](https://github.com/BitGo/BitGoJS/commit/0d00616cde5e1b7945410e4f45158f2071032163))
* **core:** bring back getECDHSecret ([922b5bf](https://github.com/BitGo/BitGoJS/commit/922b5bf3f4b34f69d3ee7c262c7f3cf09f21364d))
* **core:** bump account-lib version ([5491fd7](https://github.com/BitGo/BitGoJS/commit/5491fd708f0fb7702bb3e56f42a1037a782e6c60))
* **core:** bump stellar-sdk ([200bc3f](https://github.com/BitGo/BitGoJS/commit/200bc3f8f1593c5808b1467fdaf264c7af4625e8))
* **core:** change loop to POST /address ([d66305f](https://github.com/BitGo/BitGoJS/commit/d66305f16d65dd8f299b122fc8a81a596ab343a1))
* **core:** change stx implementation of generateKeyPair() to return xpub format ([c248936](https://github.com/BitGo/BitGoJS/commit/c2489363ba58680e8c60bc5189160dc04ca76caa))
* **core:** change the type of sendMethodName which is used for fixing erc20 unsigned sweep recovery ([66d118c](https://github.com/BitGo/BitGoJS/commit/66d118c71724ff1e7f1ba2711858ec78e5a75518)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** change type of `sequenceId` to string ([9ff64f3](https://github.com/BitGo/BitGoJS/commit/9ff64f307856a5d3b86c1597c2629a8fe824f7a1))
* **core:** client send an objet as memo but memo is treated as a string ([c631daa](https://github.com/BitGo/BitGoJS/commit/c631daae45747960f5f20dc915c4e4503d18b9eb))
* **core:** correct chainid of eos testnet ([bc128a9](https://github.com/BitGo/BitGoJS/commit/bc128a91a0a3349af792aa2a88c46b279b0cbc29))
* **core:** correct type of `allTokens` property on `TransfersOptions` ([401aa09](https://github.com/BitGo/BitGoJS/commit/401aa093121ee7acbc97468e995e1f308830a09a))
* **core:** correct typo when address parameter is missing ([9cf7e90](https://github.com/BitGo/BitGoJS/commit/9cf7e903cadc3c2fe5adca25d24b4977c9643ffe))
* **core:** correctly handle ECPair case in `getAddressP2PKH` ([a386bb4](https://github.com/BitGo/BitGoJS/commit/a386bb4983ae9c9aa209e9e4dfced832de88899c))
* **core:** correctly pass `pubs` ([159f6f1](https://github.com/BitGo/BitGoJS/commit/159f6f1116bc637808f02ec9349d5d93b5f3163e))
* **core:** deduplicate repetitive `abstractUtxoCoin` parse tx tests ([be39c40](https://github.com/BitGo/BitGoJS/commit/be39c4087215e1b1e694196467e5e00edcda828c))
* **core:** default goerli for etherscan ([f4fadbf](https://github.com/BitGo/BitGoJS/commit/f4fadbfa9256ef58d4f4f56b511faaea739ab9ca))
* **core:** defer application of authorization headers ([8a26071](https://github.com/BitGo/BitGoJS/commit/8a26071fec8c290c68f5920dad69be545813118b))
* **core:** disable `esModuleInterop` ([619769c](https://github.com/BitGo/BitGoJS/commit/619769cbfb53a550b18b04643514f1fdbecccfe8))
* **core:** disable p2tr for btg ([cc70f26](https://github.com/BitGo/BitGoJS/commit/cc70f260035268ed0707e3c31be5d4ac1afa4046))
* **core:** disable verification for hop transactions ([2515a9c](https://github.com/BitGo/BitGoJS/commit/2515a9c9aeba6d0f2f10cbce39f094a059e40a20))
* **core:** don't add extra `0x` prefix when formatting for offline vault ([3555d50](https://github.com/BitGo/BitGoJS/commit/3555d5056963c3e6d4035f125a4fecb41f8cd761))
* **core:** don't log wallet upon tx prebuild validation failure ([0c5c5c3](https://github.com/BitGo/BitGoJS/commit/0c5c5c3f097638629348e7104ddc66fa61ecf295))
* **core:** don't pick individual tx verification options ([d1fdc36](https://github.com/BitGo/BitGoJS/commit/d1fdc3699289f4fb850845d0e543e5ce17af0cd8))
* **core:** don't require `pubs` param to `explainTransaction` ([18ad557](https://github.com/BitGo/BitGoJS/commit/18ad557759c1f32732f69bb9c67445a5a47aab1d))
* **core:** expose feeInfo when building txns from tx requests ([6000d2e](https://github.com/BitGo/BitGoJS/commit/6000d2edd14297e51fd4fbd433fe091b8bdb1d61))
* **core:** fix address validation for casper ([f0ada2e](https://github.com/BitGo/BitGoJS/commit/f0ada2e99b244373dbc0050a26a0436120b5e7e7))
* **core:** fix bip32-based `isValidPub`/`isValidPrv` ([3ab57c4](https://github.com/BitGo/BitGoJS/commit/3ab57c4ee3983377d97486cc526a836f5bec8130))
* **core:** fix broken tests ([feb63f5](https://github.com/BitGo/BitGoJS/commit/feb63f5c7f08b53ff230e8f8b408d3adc70cc769))
* **core:** fix createTransactionBuilderFromTransaction call ([0de8574](https://github.com/BitGo/BitGoJS/commit/0de8574e1b7a30f9772ce0427d782dfafc9eae9d))
* **core:** fix cspr address validation to account for transferId ([89f1990](https://github.com/BitGo/BitGoJS/commit/89f1990c44289e5fc4a94c99fe5c2136b7b775c9))
* **core:** fix default sigHash for p2tr ([595d957](https://github.com/BitGo/BitGoJS/commit/595d957f61f3d10ba78219c68fa2b5a8952c6323))
* **core:** fix ENS resolution for eth sends ([8ca5d2f](https://github.com/BitGo/BitGoJS/commit/8ca5d2fb6978b62ba1d425f17468ec345fb464ef))
* **core:** fix failing tests after coroutine removal in test code ([6b8bbe2](https://github.com/BitGo/BitGoJS/commit/6b8bbe2762e97aafa93e885742030a01c56f61d0))
* **core:** fix fromBase58() in legacyBitcoin ([f563fd4](https://github.com/BitGo/BitGoJS/commit/f563fd4196e79d4961840f11bb5673b6040a9726))
* **core:** fix getExtraPrebuildParams ([6486c9f](https://github.com/BitGo/BitGoJS/commit/6486c9fc7308cdaa02ddcaaae9a829e50e61c2c9))
* **core:** fix hbar webpack ([7bc465a](https://github.com/BitGo/BitGoJS/commit/7bc465afca300f7e3eec5af92e9254e820eec555))
* **core:** fix import for Bluebird library on cspr ([324c484](https://github.com/BitGo/BitGoJS/commit/324c4845f8da8e0e4150ec60e22b9fd0394130c6))
* **core:** fix incorrect return type on presignTransaction ([b9dc27c](https://github.com/BitGo/BitGoJS/commit/b9dc27c0d8550b8d59066151f125c9f8958ef0a1))
* **core:** fix issue of erc20 token recovery using unsigned sweep ([0de956f](https://github.com/BitGo/BitGoJS/commit/0de956fd77253d351a35f215ccd747ca6c562c66)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** fix issue while signing eos transaction using OVC ([5c25580](https://github.com/BitGo/BitGoJS/commit/5c25580442721a6784645e1383b0e435ccd418aa))
* **core:** fix key pair generation methods ([fa16f19](https://github.com/BitGo/BitGoJS/commit/fa16f1932f026ee334b7eaa700bf7a0ff9112ea4))
* **core:** fix lint error ([7abc0e2](https://github.com/BitGo/BitGoJS/commit/7abc0e219b5afb51ccf4c62d544db40dd3b30130))
* **core:** fix memoid check for eos txn ([145bea7](https://github.com/BitGo/BitGoJS/commit/145bea753da193fa17c7351a4fa46f2b529063b0))
* **core:** fix method name to TRX.xpubToUncompressedPub ([b45b882](https://github.com/BitGo/BitGoJS/commit/b45b882b0db02b61f59e03d78a6000b72290ef64))
* **core:** fix nock body types ([465acf0](https://github.com/BitGo/BitGoJS/commit/465acf00bfa3c36af840cd6956179879b045bd61))
* **core:** fix prebuild transaction for tron contractCalls ([9d0edea](https://github.com/BitGo/BitGoJS/commit/9d0edeaffd39b23ba5fd07a134df030c3d622902))
* **core:** fix regression in `addAccessToken` when using v1 auth ([e58e86b](https://github.com/BitGo/BitGoJS/commit/e58e86bc00b6f6582d5d527044dbc87cf4086a51))
* **core:** fix sol send tx ([012d702](https://github.com/BitGo/BitGoJS/commit/012d7023e9fe32d8d7d2aa13cef94dceae176d43))
* **core:** fix tests which were broken after coroutine removal ([deb6698](https://github.com/BitGo/BitGoJS/commit/deb66982cd4c898665399fbd5dd8288d74502331))
* **core:** fix token unit test which expected Bluebird promise ([9c39873](https://github.com/BitGo/BitGoJS/commit/9c3987335a1371a4c5f579fca5caa875358563ee))
* **core:** fix tss pending approvals ([e686536](https://github.com/BitGo/BitGoJS/commit/e686536679f2a1729d531c3430c7456402345803))
* **core:** fix tss wallet creation ([ac06c62](https://github.com/BitGo/BitGoJS/commit/ac06c624710f2fff49430b6bb0b32a66892aaa8e))
* **core:** fix txPrebuild param in CSPR signTransaction method ([85cdc87](https://github.com/BitGo/BitGoJS/commit/85cdc87d6b09a6826b2a363503dc6f12313548ec))
* **core:** fix verify sign parameters for Algorand ([47348cd](https://github.com/BitGo/BitGoJS/commit/47348cd4297b54c66377f6afa52edff6c1a8473b))
* **core:** fix verify tx for solana ([0085ddc](https://github.com/BitGo/BitGoJS/commit/0085ddc26644231a3c8a0dcaef18d8b32db3dda9))
* **core:** fix verityTransaction for sol ([ac98a34](https://github.com/BitGo/BitGoJS/commit/ac98a34b9935477a8c3a2a6c24f9eca9ebfd7c0e))
* **core:** fix wallet creation for CSPR ([667917e](https://github.com/BitGo/BitGoJS/commit/667917e9b41690eb7b501419d2890857bcf453e7))
* **core:** fix xpubToEthAddress ([aabaa51](https://github.com/BitGo/BitGoJS/commit/aabaa51322066dc8b8a7f9e7ca7d71b3cc434b36))
* **core:** fixed TAT issues ([378d76e](https://github.com/BitGo/BitGoJS/commit/378d76e2b6ee7a071fcb244c47237ca2a59c2306))
* **core:** fixed TAT issues ([c648262](https://github.com/BitGo/BitGoJS/commit/c64826249e22c4ebb017e2e47ff740fdfa57d7ee))
* **core:** follow up improvements from PR [#1292](https://github.com/BitGo/BitGoJS/issues/1292) ([7ee6fdb](https://github.com/BitGo/BitGoJS/commit/7ee6fdb05508992761afd50f906b860e9e3096e0))
* **core:** get appropriate signing keys for all signing calls ([1a4d60c](https://github.com/BitGo/BitGoJS/commit/1a4d60cdd2b63f8ffaf796c514eeeb4aeb8e7710))
* **core:** handle script sigs without signature property in `explainTransaction` ([76028f5](https://github.com/BitGo/BitGoJS/commit/76028f58a6cc5b8a390a6d16d5a696ced368e6cc))
* **core:** hard code zcash transaction version ([5ff20c5](https://github.com/BitGo/BitGoJS/commit/5ff20c5b5ea491701e74288480dbb9f1e5020fcd))
* **core:** ignore algo token from browser tests ([d0104ed](https://github.com/BitGo/BitGoJS/commit/d0104ed1dd90f62f89fe9ceeff4e45cb465e6dca))
* **core:** ignore typescript errors from incompatible `@types/ethereumjs-util` ([a52de1b](https://github.com/BitGo/BitGoJS/commit/a52de1b9417f9cac392a91482b1715074415c064))
* **core:** implement explainTransaction for p2tr ([8ef2d6a](https://github.com/BitGo/BitGoJS/commit/8ef2d6ac44738a5f5cd23dc29f244e84deb14727))
* **core:** implement isWalletAddress for ALGO ([262a1ec](https://github.com/BitGo/BitGoJS/commit/262a1ecea7d3bb6055c7aee465ba70bb7202546a))
* **core:** implement verify transaction for eos ([8cd3051](https://github.com/BitGo/BitGoJS/commit/8cd3051465cd013a22424a9708419dd4e2f9f3ff))
* **core:** improve documentation in hashForSignatureByNetwork ([081c573](https://github.com/BitGo/BitGoJS/commit/081c573b810c7e847c68990381bebe1d445847c9))
* **core:** improve error response string creation ([43e10e3](https://github.com/BitGo/BitGoJS/commit/43e10e3490d0d2196d5f5a7cd1792248fe299256))
* **core:** improve GenerateAddressOptions type ([b0dbb6a](https://github.com/BitGo/BitGoJS/commit/b0dbb6aea5076afbc801d25614298166c61cc708))
* **core:** improve logging when encountering prebuild validation error ([75ffd0c](https://github.com/BitGo/BitGoJS/commit/75ffd0c1f4c1df673201f04faa8815bdadecce9e))
* **core:** load all keychains for taproot signing ([1e34120](https://github.com/BitGo/BitGoJS/commit/1e34120de798e2597bf6ead6e661c3c2301cf824))
* **core:** Recreate XLM integration test wallets ([4603039](https://github.com/BitGo/BitGoJS/commit/4603039131900c6405d845c307156298fdaf3386))
* **core:** remove coroutines from v2/coins/dot and fix tests ([9ea55e8](https://github.com/BitGo/BitGoJS/commit/9ea55e814e825f077832d3772fd784e1d697573b))
* **core:** remove custom getTxInfoFromExplorer in LTC ([491358f](https://github.com/BitGo/BitGoJS/commit/491358fa0e8d73387a8a47b93a4c9efb60d52e6f))
* **core:** removed signingKey capability ([14346fa](https://github.com/BitGo/BitGoJS/commit/14346fae2e5459467cc8c89b1c70a3f17d91cb42))
* **core:** rename feeInfo param in explain tx method for Casper ([5b02e13](https://github.com/BitGo/BitGoJS/commit/5b02e13f735328087c6d1aac437089a789b221e1))
* **core:** rename HalfSignedTransaction to HalfSignedAccountTransaction ([5a6dedd](https://github.com/BitGo/BitGoJS/commit/5a6deddec240ab722b553aab11e473758d7de827))
* **core:** Rename import instead of colliding with declared interface ([8b55707](https://github.com/BitGo/BitGoJS/commit/8b55707487d719459597a5314d2de1f9e295b283))
* **core:** rename token to tokenName, possible clash with auth token for algo ([46cfcf2](https://github.com/BitGo/BitGoJS/commit/46cfcf2564f4d1d350987bd1ce6dbdb947033802))
* **core:** rename verifyAddress and remove invalid implementations ([3d6d5d0](https://github.com/BitGo/BitGoJS/commit/3d6d5d07fcc4d228d39b7634e8f3349a6d623ded))
* **core:** repair replay protection input signing ([8c6b069](https://github.com/BitGo/BitGoJS/commit/8c6b069ddfcdc71a9fb8477ec95cd159cb2f8dc1))
* **core:** replace bitcoin-abc with ecash in blockchair apis ([c8e9c56](https://github.com/BitGo/BitGoJS/commit/c8e9c566310b9f31cc43380a42b283d801d15b3f))
* **core:** restore `async` on `explainTransaction` in `AbstractUtxoCoin` ([d8d7a0a](https://github.com/BitGo/BitGoJS/commit/d8d7a0af7f1d7c613bd02c3b8e63cc9b028bf96a))
* **core:** run tests against btg ([2805bd5](https://github.com/BitGo/BitGoJS/commit/2805bd56cfdba8ef33db66a2ba5e79c5ab1f91f4))
* **core:** send `derivedFromParentWithSeed` when generating wallet ([b81f31d](https://github.com/BitGo/BitGoJS/commit/b81f31d1c7629e8b2eb74c9117ff74e15aabb6df))
* **core:** sign multi-input p2tr script path txs ([885a91f](https://github.com/BitGo/BitGoJS/commit/885a91fe410dcff16e1f771cdc43ad78d2384691))
* **core:** stacks changed prv param type in StxSignTransactionOptions ([52138ea](https://github.com/BitGo/BitGoJS/commit/52138ead3ea1067706803c3fd6a7720e8cc8afbf))
* **core:** support eip-1559 and eip-155 in wrw ([e88b8e1](https://github.com/BitGo/BitGoJS/commit/e88b8e11a8f469be527a770972132aee5c9ec2a8))
* **core:** support password reset and enterprise with MPC ([2434ee6](https://github.com/BitGo/BitGoJS/commit/2434ee644b0c1c111dc6df32f5e061b61ca2bd50))
* **core:** token transactions does build correctly ([178d4e2](https://github.com/BitGo/BitGoJS/commit/178d4e219df22d42f31b9fcbad6d8f10181a17fa))
* **core:** transactionBuilder: ignore `walletSubPath === 'm'` ([5bbf8d1](https://github.com/BitGo/BitGoJS/commit/5bbf8d143a6e99ee2958ae764889ecd7f46ebdd8))
* **core:** transfer id is not stored to in mongodb in entries and coin specific ([17d44a6](https://github.com/BitGo/BitGoJS/commit/17d44a6ce192142608fcc41e4d5cc7e8c157c7b1))
* **core:** tss backup keychain output prv ([e7facc7](https://github.com/BitGo/BitGoJS/commit/e7facc792b7cfe8b36f71cc662d7504316fa88fd))
* **core:** update `vm2` by uninstalling/reinstalling `superagent-proxy` ([66f4ad3](https://github.com/BitGo/BitGoJS/commit/66f4ad3c8bcec0649cde34e724945f4076e431dd))
* **core:** update codeowners to remove previous staff ([67b3245](https://github.com/BitGo/BitGoJS/commit/67b3245de1e257f6841c9417bec988c33838fc27))
* **core:** update statics version to latest ([2f8bc0d](https://github.com/BitGo/BitGoJS/commit/2f8bc0db4743df8b1b97207d92a9b123239dcaa1))
* **core:** update yarn resolutions to temporarily resolve audit issues ([77feec3](https://github.com/BitGo/BitGoJS/commit/77feec3bcb71968f76e8b0ff7cbfc1ddc3b29d7a))
* **core:** use `@bitgo/blockapis@1.0.0-rc.0` ([7717447](https://github.com/BitGo/BitGoJS/commit/7717447a6598840d7dacbefb070d62f4d0736154))
* **core:** use `buildIncomplete()` in utxo recovery ([60e99c9](https://github.com/BitGo/BitGoJS/commit/60e99c9d74941d8332ae67cca6530967bd058007))
* **core:** use `derivedFromParentWithSeed` from user keychain if present ([c55800e](https://github.com/BitGo/BitGoJS/commit/c55800e49b63da365a77ec22136fe53e1a229352))
* **core:** use AbstractUtxoCoin type in btc tests ([956fef1](https://github.com/BitGo/BitGoJS/commit/956fef11ba024ed40f5ce5e5caaf73d37c6dd9db))
* **core:** use hashForSignatureByNetwork in core ([3b210f0](https://github.com/BitGo/BitGoJS/commit/3b210f0fc44a2e4eb85627a7b5d9e9054b553db2))
* **core:** use ltc explorer to get unspents during cross chain recovery ([4c5d19f](https://github.com/BitGo/BitGoJS/commit/4c5d19f8e349adcde42bfd1272f54c4dc683e749))
* **core:** use mempool.space instead of earn.com for recovery fee ([5338f4e](https://github.com/BitGo/BitGoJS/commit/5338f4efda4b6b7705d9c1fb0d1a6914606b7314)), closes [#1126](https://github.com/BitGo/BitGoJS/issues/1126)
* **core:** use signAndVerifyWalletTransaction ([3811b42](https://github.com/BitGo/BitGoJS/commit/3811b42a6866fe3e3f89b314a2287bc80a0bd408))
* **core:** use wallet keys in explainTransaction ([2c3b494](https://github.com/BitGo/BitGoJS/commit/2c3b494792ae52e4e2f61c0ba0f59cab955ce2e7))
* correctly regenerate .drone.yml ([eaf6aaa](https://github.com/BitGo/BitGoJS/commit/eaf6aaa67c5293a2e2083cc224172c6eacd9fab5))
* do not not strip out null values from the stx transaction memo field ([e028517](https://github.com/BitGo/BitGoJS/commit/e0285172522aff9fd7b5b618b31b716c4d84bfbf))
* don't run unit tests on node 8 ([7fa7510](https://github.com/BitGo/BitGoJS/commit/7fa7510bf2107e540d2e2975b5ea0578717509b5))
* enable TEST token for testnet ofc ([bfe12c6](https://github.com/BitGo/BitGoJS/commit/bfe12c670ab879c445103a2d62e7202b6d32aeef))
* **eos:** can accept addresses with memoId when making recovery ([8001e7e](https://github.com/BitGo/BitGoJS/commit/8001e7e592d48b0c0097384e7395838adde9e8b5))
* **eos:** fix deserialize transaction with OVC ([b4d8821](https://github.com/BitGo/BitGoJS/commit/b4d8821773e182560e206ffc48cde2d5e5d640b3))
* **eos:** fix incorrect explorerUrl for teos ([3a5914d](https://github.com/BitGo/BitGoJS/commit/3a5914dab2427c9924c8b332c4189a98d10a4dbd))
* **eos:** fix issue verifying EOS transactions ([79dd073](https://github.com/BitGo/BitGoJS/commit/79dd0736c999bbeeaa663f3054769ff86c1f1ca7))
* **eos:** moved eos fixures to the currect directory ([e64aed4](https://github.com/BitGo/BitGoJS/commit/e64aed4c70586f98808c67477c4c0603c47351ca))
* **eos:** removed unnecessary assertions in eos unit test cases ([205c695](https://github.com/BitGo/BitGoJS/commit/205c695df5d5517851151293aedb7baa2acc6176))
* **eos:** sinon sandbox restored after use in test case ([6cfef71](https://github.com/BitGo/BitGoJS/commit/6cfef71c4fdb5fc9da5699059c74ef7dc187489f))
* **eth-lhf:** set default hf to lhf if lhf params present ([06a9f7b](https://github.com/BitGo/BitGoJS/commit/06a9f7b03798df4a957a28cf23174929fbdc2f35))
* **eth2:** fix eth2 lib initialization and key signatures ([d171404](https://github.com/BitGo/BitGoJS/commit/d1714044bef8afe3f8b9166dc49f28ef3451bda8))
* **eth:** goerli coins now set to gteth in core/src/config.ts ([3ea10f6](https://github.com/BitGo/BitGoJS/commit/3ea10f64ca02d89db500904a9acc1c3511931e62))
* **ethlike:** add chainid to statics ([56a769e](https://github.com/BitGo/BitGoJS/commit/56a769e2fe9a9e7a1808d5a499941d42461d006e))
* **eth:** make replay protection optional ([061f2c6](https://github.com/BitGo/BitGoJS/commit/061f2c64f55eac31a162986ee2ac3df7da047978))
* **eth:** move gasLimit to base params ([6a1f108](https://github.com/BitGo/BitGoJS/commit/6a1f10867e87db853cad38ba62fdc9ca26bff946))
* **eth:** restore fixed hop transaction verification ([7b2420a](https://github.com/BitGo/BitGoJS/commit/7b2420aaf6fd684fe8847c27c7cd1aa5882fb8db))
* **eth:** update tx with signature in recover ([3fa3de4](https://github.com/BitGo/BitGoJS/commit/3fa3de43cc21618deda3be5183b2b21878367576))
* exclude ripple-address-codec 4.2 ([8178095](https://github.com/BitGo/BitGoJS/commit/8178095b9e672ea3df0f05f974083fac8f56a31f))
* **express:** add error logs in tx signing fns ([dc22bae](https://github.com/BitGo/BitGoJS/commit/dc22bae196b47a2a531e9bdc579046d9d6c62d17))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([0c835b8](https://github.com/BitGo/BitGoJS/commit/0c835b8d010c1cd3f843daf8dfeb6fc74d71c459))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([1b96bfe](https://github.com/BitGo/BitGoJS/commit/1b96bfec6c8ccc3f68ec253595dd07e523bd10ef))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([58ea46e](https://github.com/BitGo/BitGoJS/commit/58ea46ecafa13766be26e25ad8a8fbc8b06b1f9f))
* **express:** always prefer command line arguments to env var args ([b8aeee1](https://github.com/BitGo/BitGoJS/commit/b8aeee132658c0839ede81b1da6bf48609a12069))
* **express:** always use bitgo object http methods to proxy requests ([5153a96](https://github.com/BitGo/BitGoJS/commit/5153a9637725bac6b3c36888f21ca44e1ac21da6))
* **express:** build express outside TS Build systm ([4c59ff8](https://github.com/BitGo/BitGoJS/commit/4c59ff87a4a03f4a324d0a126e00dd19c5acf44d))
* **express:** correctly handle failed proxy calls ([d36bf9c](https://github.com/BitGo/BitGoJS/commit/d36bf9c30dc799e087e9b42a4fd30d9ebe407509))
* **express:** Deprecate older forms of environment variable config ([2c88e69](https://github.com/BitGo/BitGoJS/commit/2c88e69983acea4da9b09994f38d49c99a73548c))
* **express:** do not access `_promise` ([8cd097e](https://github.com/BitGo/BitGoJS/commit/8cd097e76cc4e3de8b8b769f39c3bbe9bb79f96e))
* **express:** don't store false when boolean flags are not given ([4194ae1](https://github.com/BitGo/BitGoJS/commit/4194ae17f91d1174f096aeb1a0a85819762b9ae8))
* **express:** don't use bluebird methods on native promise returning functions ([b5b3782](https://github.com/BitGo/BitGoJS/commit/b5b37822e8b0814ad63433e1580255416c645ec1))
* **express:** enable tezos consolidations route in express ([fdf2c8a](https://github.com/BitGo/BitGoJS/commit/fdf2c8a8a8c0503728825ebaa2b16f7a1e5fec70))
* **express:** lock to y18n@^4.0.3 ([044da56](https://github.com/BitGo/BitGoJS/commit/044da56c6832492a83af07af77c4001521b8271b))
* **express:** log bitgo-express and bitgojs versions on error ([f21178f](https://github.com/BitGo/BitGoJS/commit/f21178f8dc40a8d93895463823acbe5bd320ba5d))
* **express:** pass POST body for proxy requests ([f5113ea](https://github.com/BitGo/BitGoJS/commit/f5113ea07ecfaa265d18a48f32143d3045ac7e27))
* **express:** re-add `typescript` to express dev deps ([75c1601](https://github.com/BitGo/BitGoJS/commit/75c16011029a5de624363396a0047a3564ec85dd))
* **express:** remove gcompat, switch to alpine build container ([d4a9cca](https://github.com/BitGo/BitGoJS/commit/d4a9ccab1b3c6773c1d81503bd55c7376f40f8db))
* **express:** remove gcompat, switch to alpine build container ([969dd49](https://github.com/BitGo/BitGoJS/commit/969dd4913ad5f26c9e2b1a9e823412cce2c6c27f))
* **express:** run prettier on `test/integration/bitgoExpress` ([e105d3a](https://github.com/BitGo/BitGoJS/commit/e105d3aa0054f1ed7428fd1d935ff1eada8d9800))
* **express:** update lodash and ini to fix npm audit issues ([36c3d0b](https://github.com/BitGo/BitGoJS/commit/36c3d0b3a68d86772a6b1a872dde398ca53dec84))
* **express:** update to typescript 4.2.2 ([460e898](https://github.com/BitGo/BitGoJS/commit/460e898edc30205f6b5edfa100b818c20a7af58b))
* **express:** use gcompat instead of libc6-compat ([4636f8d](https://github.com/BitGo/BitGoJS/commit/4636f8df7dd0bfe15e8e736d8029b08f4a55d5c1))
* **express:** use gcompat instead of libc6-compat ([df5f84b](https://github.com/BitGo/BitGoJS/commit/df5f84bdc02a65c22097680d072553e079997fdc))
* **express:** use gcompat instead of libc6-compat ([e72b9b9](https://github.com/BitGo/BitGoJS/commit/e72b9b9b7b213ceb5aaf5bb985ba30a498280df4))
* **express:** use yarn to run build script ([e2b7cad](https://github.com/BitGo/BitGoJS/commit/e2b7cad4a8f8bf0273240d6a015839a97837c38e))
* **express:** use yarn to run commands installed at root ([4795b06](https://github.com/BitGo/BitGoJS/commit/4795b062c2f92d02053cfb931dbefc4daf579d00))
* **express:** use yarn to run commands installed at root ([3c2acef](https://github.com/BitGo/BitGoJS/commit/3c2acef7b72bfde1bfd6becfff4fb6d9349f0c02))
* fix 1inch in coins.ts ([ef338c9](https://github.com/BitGo/BitGoJS/commit/ef338c907f5ca78851ea0b39a7b97c34fd381d0e))
* fix build ([4a19ae6](https://github.com/BitGo/BitGoJS/commit/4a19ae67b003a39982551c9615a7a4ef217bc15b))
* fix EOS testnet fullnode URLs ([55cb375](https://github.com/BitGo/BitGoJS/commit/55cb37526bdf80c431392f8a1a6af9dad01d3be8))
* fix Etherscan Testnet URL ([f83b5cd](https://github.com/BitGo/BitGoJS/commit/f83b5cd742149f81d2a9a2074f22d8aa812a964c))
* fix failing unit test nocks ([c5fb6e3](https://github.com/BitGo/BitGoJS/commit/c5fb6e30fccb2799cda730504e18806576f01290))
* fix signing for Tezos ([290df65](https://github.com/BitGo/BitGoJS/commit/290df6525095a7f4e5cad6a634202197fa16c5c5))
* fix urijs vuln ([957c618](https://github.com/BitGo/BitGoJS/commit/957c6185f912cf74792cfcbc4e3bd20b14ab5de3))
* fix wei to gwei conversion ([89af10d](https://github.com/BitGo/BitGoJS/commit/89af10d710da3cf6e1b8fc4ffea593d386628b76))
* fixed consolidation and added express route ([81a4c6d](https://github.com/BitGo/BitGoJS/commit/81a4c6d1763feea6432bf7d564e41c8eb125eff9))
* force secure urls unless disabled ([3b9edd5](https://github.com/BitGo/BitGoJS/commit/3b9edd593016f82fa69a4fe740ea706fe1daeee7))
* getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
* **gterc-tokens:** add missing gterc tokens ([724406b](https://github.com/BitGo/BitGoJS/commit/724406b5113dc00246d839c13d623b64c47012c8))
* **gterc-tokens:** add missing gterc tokens ([27a86db](https://github.com/BitGo/BitGoJS/commit/27a86db9f5c6d2a3f93eea74f71c2b7a15e5523a))
* hard-code current ZEC consensus branch ID using updated utxo-lib ([93798ba](https://github.com/BitGo/BitGoJS/commit/93798ba3629dcfdb7440778c1dcb3c09ab578bae))
* **hbar-validateaddress:** add validation for hedera addresses fix case where hex address were valid ([eb7c1eb](https://github.com/BitGo/BitGoJS/commit/eb7c1eb02d973acfa97cfd613816b365ea29d567))
* **hbar:** add missing validateKeySignatures method ([870fc6e](https://github.com/BitGo/BitGoJS/commit/870fc6eb463f5c177a312163fac532ba5ceb5723))
* **hbar:** add new hashTx impl ([44498e3](https://github.com/BitGo/BitGoJS/commit/44498e37ee3a39a7537ce51ccbf61040e3ffd5bf))
* **hbar:** fix sign and verify for hex encoded hbar message ([c3ef546](https://github.com/BitGo/BitGoJS/commit/c3ef546b68dac87339f39197bf798c899d881bdf))
* **hbar:** fix sign and verify for hex encoded hbar message ([b82dae2](https://github.com/BitGo/BitGoJS/commit/b82dae2ec89bf55f5d891b9887069c5c66b07157))
* **hbar:** key validation ([113fa3c](https://github.com/BitGo/BitGoJS/commit/113fa3cbe0c5aa31acd6d93dbf22d9319a3749e4))
* **hbar:** modify validation for keys ([af57749](https://github.com/BitGo/BitGoJS/commit/af5774900d6bbc0a6a29020f11b68f532af2f12c))
* **hbar:** update test ([fadce41](https://github.com/BitGo/BitGoJS/commit/fadce418c188e895813d83c9a2ddb8009b458c74))
* improve Etherscan Error Handling ([4e90aed](https://github.com/BitGo/BitGoJS/commit/4e90aedbf489e4accc0a0b96b4d222722321023c))
* keyreg type changed to wallet init ([78beac5](https://github.com/BitGo/BitGoJS/commit/78beac58d2dfb0dd13c41a1e8e884fca19cbe20c))
* **ltc:** update block explorer link for ltc ([1a501da](https://github.com/BitGo/BitGoJS/commit/1a501da07df6796e7215c20800bcb865270b13a6))
* **lumina:** update full name for rbtc ([4bf0098](https://github.com/BitGo/BitGoJS/commit/4bf0098efd6e0ce5f2e9a70b680e64ec7b031235))
* **release:** upgrade lerna to 3.21.0 ([ae6ff7e](https://github.com/BitGo/BitGoJS/commit/ae6ff7eade463ee95fec03460f5a1a552740a9cb))
* remove `gitHead` from module package.jsons ([66e9809](https://github.com/BitGo/BitGoJS/commit/66e9809d6a36f03c8a334f9b8bbcfa82aca426b0))
* remove `gitHead` property from package.jsons ([e6b7fdd](https://github.com/BitGo/BitGoJS/commit/e6b7fdd4e4e16c4a07a9a7ad39cc70f08854486e))
* **remove logs:** remove logs ([f439bfa](https://github.com/BitGo/BitGoJS/commit/f439bfacbe6953b54f7492e4400e780d8d7769ac))
* remove non existing testnet OFC tokens and fix asset for TERC ([a70860e](https://github.com/BitGo/BitGoJS/commit/a70860e16fcdf831c589a38b6479657d7eea0344))
* remove ripple-lib due to node issues ([ecf34a4](https://github.com/BitGo/BitGoJS/commit/ecf34a4b2402799b77b641172832357a45b6a8aa))
* removing extra space ([261b87e](https://github.com/BitGo/BitGoJS/commit/261b87eb102d12b4e8b66683590bef29954a9bf5))
* replace sed with js function for replacing unsafe evals ([f8c089a](https://github.com/BitGo/BitGoJS/commit/f8c089ae10b8732565fbc8ed1a9209c7b7ac42ec))
* reset core package json back to master ([5ad8684](https://github.com/BitGo/BitGoJS/commit/5ad86846805b94eec3f125f33a8579286c3fc7d8))
* **root:** add package-lock.json to .gitignore ([754ef40](https://github.com/BitGo/BitGoJS/commit/754ef401fb6c9bfa1f5c5daa0d10cdce86a4de45))
* **root:** disable eslint `no-undef` rule for typescript files ([597e468](https://github.com/BitGo/BitGoJS/commit/597e4688a2bfbbdbf8ae6235c420cd35adf701ad))
* **root:** removed buffer library and fallback from webpack config for account-lib and core ([a5c9fec](https://github.com/BitGo/BitGoJS/commit/a5c9fecd17d0fedced34fad9434eb1f0f36bd0d5))
* **root:** resolve `axios` to `^0.21.2` ([04d63f9](https://github.com/BitGo/BitGoJS/commit/04d63f9bb1e8a74692b5d54668a79999abc23c64))
* **root:** resolve `follow-redirects` to version ^1.14.7 ([d81b77f](https://github.com/BitGo/BitGoJS/commit/d81b77f2b8184b18d63b6d504cd33592ee9c8b69))
* **root:** resolve `node-fetch` to version 2.6.7 ([da8e05b](https://github.com/BitGo/BitGoJS/commit/da8e05bfee6c5fc1d3e29166a1f85ecafb704fd3))
* **root:** update `@celo/contractkit` deps to fix audit issues ([fba7595](https://github.com/BitGo/BitGoJS/commit/fba7595cb3c5bed76294cb9fae6241ab497e72a5))
* **root:** update lerna deps to fix audit issues ([08315ba](https://github.com/BitGo/BitGoJS/commit/08315baec81cef7098d645183ba742ae2b93c395))
* **sdk:** add avaxc family ([85d945d](https://github.com/BitGo/BitGoJS/commit/85d945d252f3446de50204c77e3110ef81847abe))
* **SERV-593:** Correctly handle undefined boolean config items ([770d7c1](https://github.com/BitGo/BitGoJS/commit/770d7c1e22e502a3e5de00085aeab7285c99a1c9)), closes [#599](https://github.com/BitGo/BitGoJS/issues/599)
* **SERV-597:** Ensure `Error.captureStackTrace` is defined before call ([fe35e3e](https://github.com/BitGo/BitGoJS/commit/fe35e3e0fd2b487d96c50c9a64a0890942192814))
* **sol:** fix deserializing signed sol transaction ([1da611a](https://github.com/BitGo/BitGoJS/commit/1da611ac9f830ed4303d4425a0391c4bc13c9f8c))
* **sol:** get signature data from a Sol transaction ([5249a6e](https://github.com/BitGo/BitGoJS/commit/5249a6e5da74ceb43a2b47ca439495d62c280f07))
* **statics:** add unique token types to goerli testnet tokens ([306df63](https://github.com/BitGo/BitGoJS/commit/306df6341767b4b58031fce2aca9057b10400d94))
* **statics:** adding ofcmcdai, ofcaxsv2, ofclrcv2, and ofcxsushi ([d472e9d](https://github.com/BitGo/BitGoJS/commit/d472e9d63e3cddf7cd416f606c60426013e0d109))
* **statics:** apply prettier to full project ([9ae3e15](https://github.com/BitGo/BitGoJS/commit/9ae3e157a84afebe495bab105fac6fbcfee2b0ee))
* **statics:** avaxc token name to lower case ([de49cb3](https://github.com/BitGo/BitGoJS/commit/de49cb30be27dad05e958e7a7eceacd6ec2e0c33))
* **statics:** change Goerli ETH underlying asset from ETH to GTETH ([7fafd32](https://github.com/BitGo/BitGoJS/commit/7fafd3281a00c5596cf506a1476e96f2df7db6d7))
* **statics:** delete invalid testnet URL ([77ae3ab](https://github.com/BitGo/BitGoJS/commit/77ae3ab434fcc05c16b44126ad46833cd6053533))
* **statics:** ensure UnderlyingAssets values are unique ([d297246](https://github.com/BitGo/BitGoJS/commit/d2972468cf90c0166a2ae3dd49e58da20dac1f1a))
* **statics:** fix BitcoinGoldTestnet derivation ([dfd097c](https://github.com/BitGo/BitGoJS/commit/dfd097c76ac2f1983af9bb02f6b15cb9d491b9ee))
* **statics:** fix etc statics ([4970253](https://github.com/BitGo/BitGoJS/commit/497025350595716c21d77bf5e1c420abc3bc6851))
* **statics:** fix GDT contract ([12e8258](https://github.com/BitGo/BitGoJS/commit/12e8258428b371657c33794c4651f5a4d617f1a4))
* **statics:** fix import/exports ([29d02b9](https://github.com/BitGo/BitGoJS/commit/29d02b9a5f97f1a78bce2313c5e95dc07240a3db))
* **statics:** fix precision for ofcterc ([75e465a](https://github.com/BitGo/BitGoJS/commit/75e465ac812ea0d59b2f05af9059debdb8a472ba))
* **statics:** fix send many memo contract address for prod ([3a1396d](https://github.com/BitGo/BitGoJS/commit/3a1396d17a15737bbc57a9f7803fe7fc2b47e6c5))
* **statics:** fix Solana transactions explorers ([c1f4e62](https://github.com/BitGo/BitGoJS/commit/c1f4e62e683e932af21b7238777c73a6fc7ef2d2))
* **statics:** fix stx explorer url ([cfa4998](https://github.com/BitGo/BitGoJS/commit/cfa499829f41ee791d5a0f7cc79bae801fdc1b73))
* **statics:** fix typo on testnet casper coin ([86488dd](https://github.com/BitGo/BitGoJS/commit/86488ddcc139eca3945d15c639ea9e63b9b5965e))
* **statics:** inherit BitcoinTestnet from Testnet ([246135c](https://github.com/BitGo/BitGoJS/commit/246135c4a4b78c9092cee8d08d5a79b8bf737a75))
* **statics:** remove duplicate tokens ([35e445a](https://github.com/BitGo/BitGoJS/commit/35e445aa92a56e0c14dbdb72b987d9a07c1e6d96))
* **statics:** remove invalid BIP32 constants ([e1d66ba](https://github.com/BitGo/BitGoJS/commit/e1d66ba4a8992e72279c5581591f5885bf6e5540)), closes [/github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp#L142-L143](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp/issues/L142-L143) [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L306-L309](https://github.com/BitGo//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L306-L309)
* **statics:** remove invalid wif constants ([3b633a9](https://github.com/BitGo/BitGoJS/commit/3b633a9e0c52ca17078bfe8a5440a84980fd0261)), closes [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L486-L487](https://github.com/BitGo//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L486-L487) [/github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp#L248](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp/issues/L248)
* **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))
* **statics:** update CODEOWNERS ([02b03fe](https://github.com/BitGo/BitGoJS/commit/02b03fe4549cc176731357f328301a9b88ff6c0f))
* **statics:** update deprecated explorer url ([391219a](https://github.com/BitGo/BitGoJS/commit/391219a37806d08ae56b52a84d2c3e69938140cb))
* **statics:** update deprecated explorer url for BCH ([1bfaf3a](https://github.com/BitGo/BitGoJS/commit/1bfaf3a950a3c7c2dc342146b174629bc8bf420c))
* **statics:** update zcash explorer url ([6bfb111](https://github.com/BitGo/BitGoJS/commit/6bfb1117deaaaefe32faf07cdef88cfd869ac16d))
* **statics:** use `utxolibName` instead of redefining constants ([b54c30a](https://github.com/BitGo/BitGoJS/commit/b54c30ae8e88dfe9701237a3316edf5f6c71483c))
* **stx-core:** parse stx transactions ([5ad70c8](https://github.com/BitGo/BitGoJS/commit/5ad70c854e1b37231abd106169f01eef36f6f351))
* **stx:** resolves toJSON for stx ([4b66b78](https://github.com/BitGo/BitGoJS/commit/4b66b78fa69eef4e55377fd64f439343a804edc8))
* **tdash:** fix incorrect explorerUrl for tdash ([e84b9db](https://github.com/BitGo/BitGoJS/commit/e84b9db96f5db161f5dd2ccac5109a05c34c1eda))
* temporarily remove AVAXC from failing SDK test for Secp256k1 coins ([a602eaa](https://github.com/BitGo/BitGoJS/commit/a602eaa8fd6c0b0f66c070b4e26091bfc32780dc))
* Test case should throw exception ([4b5b0b2](https://github.com/BitGo/BitGoJS/commit/4b5b0b25939c6f20a5ae794a692c1c63e9ef875c))
* **test:** remove illegal use of `bufferutils` ([4bb33a1](https://github.com/BitGo/BitGoJS/commit/4bb33a19e28f7351b0040fb2eee8ac898a7e3e8c)), closes [/github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f#diff-73e64645f9c04dc17e67b782cb9342](https://github.com/BitGo//github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f/issues/diff-73e64645f9c04dc17e67b782cb9342)
* **teth:** add terc tokens with 2,6,18 decimals ([3be4597](https://github.com/BitGo/BitGoJS/commit/3be4597e18fe3fa21eb123160e1528d3630e0be9))
* **teth:** add terc tokens with 2,6,18 decimals ([846f758](https://github.com/BitGo/BitGoJS/commit/846f758aff7cb03a68c25ed93af112f83538bed7))
* **tltc:** update block explorer link for tltc ([7323ccf](https://github.com/BitGo/BitGoJS/commit/7323ccf8aa2e0a2ced76f5218db20b25bd0658fb))
* **trx:** asign trx builder acording to each transaction type ([3454ee1](https://github.com/BitGo/BitGoJS/commit/3454ee1f4d5f187d48fa4c4aeef5a9327d89e6ec))
* **unspents:** add `readonly` modifier to Dimensions fields ([4cc973e](https://github.com/BitGo/BitGoJS/commit/4cc973e345b63cdde57c0bef4a53c0a02de6e625))
* **unspents:** fix nInputs ([e5e54e7](https://github.com/BitGo/BitGoJS/commit/e5e54e796995254d479f39e044635169547ad69b))
* **unspents:** fix package.json ([7edf5fe](https://github.com/BitGo/BitGoJS/commit/7edf5fe71f9b844947378e154ea5ba48b70806ed))
* **unspents:** use latest rc as version instead of 2.3.0 ([b0ae190](https://github.com/BitGo/BitGoJS/commit/b0ae190b955ab25b7c33236f7f81861008b8f4df))
* update dot to address breaking changes in 7.15.1 ([a949618](https://github.com/BitGo/BitGoJS/commit/a949618de00b944b2d9729485f6b9ac4e6fced3f))
* update freeze request to include sending params ([2b61a2a](https://github.com/BitGo/BitGoJS/commit/2b61a2a5869c5dc985eafb2368ea51bc233d54fe))
* update package-lock.json and clientRoutes ([a3433ea](https://github.com/BitGo/BitGoJS/commit/a3433ea0e86af35a26ae24bcb2e3f9c7adede91f))
* update package-lock.json and clientRoutes ([9ed9bb4](https://github.com/BitGo/BitGoJS/commit/9ed9bb44727611cf3d9b67284b1d7dd6ec10772f))
* update test for ZEC ([e17eea0](https://github.com/BitGo/BitGoJS/commit/e17eea0eeeca90909783e92fef021b364ee66283))
* update utxo-lib to published version 1.7.3 ([1798510](https://github.com/BitGo/BitGoJS/commit/1798510690766438e4faa30bbb0c3f4188d99e91))
* update ZEC consensusBranchId for Caopy hardfork ~Nov 18 2020 ([574a7c7](https://github.com/BitGo/BitGoJS/commit/574a7c77accc8182f30e7385859e57ed82864538))
* use correct kovan testnet explorer urls ([e86723c](https://github.com/BitGo/BitGoJS/commit/e86723c46a22d2790bad7b43d8e6bc5feaa700ee))
* **utxo-lib:** always verify ECDSA in strict mode ([4fcaf53](https://github.com/BitGo/BitGoJS/commit/4fcaf53f18f74a68f37a0513a549fea1c5c1ffb8)), closes [/github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts#L215](https://github.com/BitGo//github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts/issues/L215) [/github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts#L1212](https://github.com/BitGo//github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts/issues/L1212)
* **utxo-lib:** default to `version: 2` for BTG transactions ([c4047ed](https://github.com/BitGo/BitGoJS/commit/c4047ed24a80904f39f2d598ba6b67722ce8de7b))
* **utxo-lib:** do not throw on unsigned inputs ([69dddb6](https://github.com/BitGo/BitGoJS/commit/69dddb6ae077c6093d048fe91b0521e74ab5055e))
* **utxo-lib:** eslint fix ([a17d3c0](https://github.com/BitGo/BitGoJS/commit/a17d3c09aef4124edb4541dc03cd316e0826f6ac))
* **utxo-lib:** fix `addForkId` evaluation ([2d5f7e6](https://github.com/BitGo/BitGoJS/commit/2d5f7e6bf7592447cd6ca35ad320202343595227))
* **utxo-lib:** fix fixture generation for bitcoingold ([b3067ec](https://github.com/BitGo/BitGoJS/commit/b3067ec02f40489f3c99989e3a507e28775bb7dd))
* **utxo-lib:** fix imports in test ([204e404](https://github.com/BitGo/BitGoJS/commit/204e4044b5a487c3a687f2514e148f5cb318b3c7))
* **utxo-lib:** fix missing word in local rpc parse test ([7336ee2](https://github.com/BitGo/BitGoJS/commit/7336ee22200fe8c0e9f0144fadb571cfa7b1836e))
* **utxo-lib:** fix setConsensusBranchId ([4efa636](https://github.com/BitGo/BitGoJS/commit/4efa63670ae4e1bf17895b85c8559df33ac319ab))
* **utxo-lib:** fix sighash for dash transactions ([c171435](https://github.com/BitGo/BitGoJS/commit/c1714357eab3f8fc961e75ad0af8e49f967e801b))
* **utxo-lib:** improve ParsedSignatureScriptTaproot ([b809bb2](https://github.com/BitGo/BitGoJS/commit/b809bb2779a2e498fd0ba76437a198ad20ec1536))
* **utxo-lib:** increase test coverage for signature.ts ([49a1a48](https://github.com/BitGo/BitGoJS/commit/49a1a4805f7c69ee873243525fba4b9037f890fc))
* **utxo-lib:** make compatible with node 10, 12 ([dd8d8f9](https://github.com/BitGo/BitGoJS/commit/dd8d8f9a903c46549742512c30f5ce540b1c1e75))
* **utxo-lib:** pass 0 offset to `readUInt16BE` for zcash `fromBase58Check` ([ff99d32](https://github.com/BitGo/BitGoJS/commit/ff99d32110f23dfe2f1f41b9942f33ccc39deaac))
* **utxo-lib:** pass buffer to `hash256` ([602936a](https://github.com/BitGo/BitGoJS/commit/602936adfed547edd6254c915a9500e80c943bda))
* **utxo-lib:** remove debugger ([ac6e7ed](https://github.com/BitGo/BitGoJS/commit/ac6e7edbd8f28fc6afae7bc28dae2f2754d3e0d6))
* **utxo-lib:** remove trailing comma ([67dac1d](https://github.com/BitGo/BitGoJS/commit/67dac1d9e3d47352eab46b1ceccb203a7024718d))
* **utxo-lib:** respond to comments ([a2a5808](https://github.com/BitGo/BitGoJS/commit/a2a580815c2c8fa76822a8255b9cdd8028c8db77))
* **utxo-lib:** update mocha and test `.ts` files ([fb0e7d0](https://github.com/BitGo/BitGoJS/commit/fb0e7d0b4aed2e72a8b269f93c8c7ed8f0367ed0))
* **utxo-lib:** use different bitcoinjs-lib specifier ([a629eec](https://github.com/BitGo/BitGoJS/commit/a629eec182910e41e339bfebfa6faecffac01305))
* **utxo-lib:** use NU5_BRANCH_ID when parsing zcashTest v4 ([ae2ded6](https://github.com/BitGo/BitGoJS/commit/ae2ded6d35f807409eacd575b8b91f6451cdfdc8))
* **utxo-lib:** use OP_CHECKSIG for 2nd p2tr opcode ([a5fdf02](https://github.com/BitGo/BitGoJS/commit/a5fdf02795fcde78d85e94f51f9ac92db620aa67))
* **utxo-lib:** write `version` as `Int32` ([d3e337a](https://github.com/BitGo/BitGoJS/commit/d3e337ab997c81a2c2c4c1a7ee678777a571f89a))
* **utxolib:** use `debug` package ([68113bb](https://github.com/BitGo/BitGoJS/commit/68113bbd64411c71fa1c274eb8ff6d0ff1757d1d))
* **utxolib:** use path package for path operations ([75f6fab](https://github.com/BitGo/BitGoJS/commit/75f6fab78ee3d1d0493be407e4c05257712dfddd))
* v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))
* Validation is a part of builder ([641810b](https://github.com/BitGo/BitGoJS/commit/641810b7cce14ab34268fde7d93893d04b158ede))
* wait a second between 2 subsequent API calls ([62ec37d](https://github.com/BitGo/BitGoJS/commit/62ec37daba171cfc3bb5c97c19b58bb6d3e230c6))
* **wallet-platform:** whitelist messageKey param ([081e486](https://github.com/BitGo/BitGoJS/commit/081e486cc9b64cc3ba568bce6aec675f5f2e3ea6))
* whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))
* **wp:** split mocha test from outputScripts impl ([01053c9](https://github.com/BitGo/BitGoJS/commit/01053c9a5f754b884c665e485d613d964055053a))
* **wrw recoveries:** enable unsigned sweeps for recovery of erc20 tokens ([0c108eb](https://github.com/BitGo/BitGoJS/commit/0c108eb7f26fd6a0d22ee7d3bbe743c8f8cf4c35))
* **xrp:** fix incorrect explorerUrl for txrp ([67f9fbf](https://github.com/BitGo/BitGoJS/commit/67f9fbf16476dbd5f59014647ee47d16c56f4064))
* **xrp:** incorrect types for ledgerSequenceDelta ([03c2860](https://github.com/BitGo/BitGoJS/commit/03c28605c4d5a141203e9d247200778ddb19899c))


### Reverts

* Revert "Revert "feat(account-lib): dot implementation"" ([0519e38](https://github.com/BitGo/BitGoJS/commit/0519e381222f8d5b8841114bdc0a34ec79c73950))
* Revert "chore(core): remove insecure modules from webpack" ([23143ca](https://github.com/BitGo/BitGoJS/commit/23143cac90e247f7f90286485cae7e5e741190e6))
* Revert "fix(account-lib): revert algorand tokens changes" ([cdb5539](https://github.com/BitGo/BitGoJS/commit/cdb5539bc0a68f6df112c7229c938b87f5bf6625))
* Revert "Revert "fix(core): use more correct edge case value in abstract utxo test"" ([5ca7405](https://github.com/BitGo/BitGoJS/commit/5ca7405acef847cd93269c671a60ce37274e34e4))
* Revert "Revert "feat(core): allow disabling paygo outputs during utxo tx verification"" ([85b7e1c](https://github.com/BitGo/BitGoJS/commit/85b7e1c6c82b7073ceea699973ea7ffdb2078b23))
* Revert "fix(core): set minimal required node version to 10.22.0" ([eec236f](https://github.com/BitGo/BitGoJS/commit/eec236f28c2d33647a329d253097222d1ab6fb35))
* Revert "feat: add STX coin to statics and core" ([90eee7b](https://github.com/BitGo/BitGoJS/commit/90eee7b247d8b05cada93104888097a13f681425))
* Revert "Fixed toJson usage in core module" ([c029984](https://github.com/BitGo/BitGoJS/commit/c0299847d72c4b0a744fb6a4cce40708bb226d34))
* Revert "BGA-297 Compose transaction/transactionBuilder for HBAR using" ([9a38f4d](https://github.com/BitGo/BitGoJS/commit/9a38f4dbdb450dbdeff8a1d29549b43de58a6424))
* Revert "BGA-324 Update toJson method" ([43170e2](https://github.com/BitGo/BitGoJS/commit/43170e2a4d702af1fd228476fea720ef25bbcb0a))
* Revert "BGA-324 Set body to be mandatory" ([8201971](https://github.com/BitGo/BitGoJS/commit/8201971ddd696bf361056ff59aecd79def28f928))
* Revert "Update lerna to fix yarn audit finding" ([4710597](https://github.com/BitGo/BitGoJS/commit/4710597bdeef8058ace4128d89c4edfd0419f878))
* Revert "Fix: Validation is a part of builder" ([10f990e](https://github.com/BitGo/BitGoJS/commit/10f990e681ccea2a543ff631a8972a69df56b985))
* Revert "Revert "BG-11787 use updateSingleKeychainPassword instead of changeSingleKeychainPassword and fix unit tests"" ([a4873da](https://github.com/BitGo/BitGoJS/commit/a4873da71384467e66660b790f3bd17c0c7cd9fe))
* Revert "BG-8668: Add total and per-input signature counts to `explainTransaction`" ([4f4d9aa](https://github.com/BitGo/BitGoJS/commit/4f4d9aac3a04555e4c893d68f8ee2c5c4a258b1c))
* **core:** proper fix found for the stx transaction memo field test ([ca0a29e](https://github.com/BitGo/BitGoJS/commit/ca0a29ef7a953d3665daced83e5982280b20f093))
* **core:** revert isValidPub test with extended keys; needs an account-lib update ([cad98a5](https://github.com/BitGo/BitGoJS/commit/cad98a5ee0c7b4ad7d27a5477c995325b06485c4))
* don't initialize stx in the coinFactory just yet ([1ef2c5f](https://github.com/BitGo/BitGoJS/commit/1ef2c5febb8bc606fc7d51f807e0bb812b11ac58))
* return master branch package versions to non-rc versions ([5a0ca2b](https://github.com/BitGo/BitGoJS/commit/5a0ca2bda526fad472fe10290610783ae986982b))


### Code Refactoring

* **account-lib:** refactor builder to be consistent with other coins builders ([cbdc721](https://github.com/BitGo/BitGoJS/commit/cbdc721ebbb81752071f8731db4d11afc47539fa))
* **core:** add, use signAndVerifyWalletTransaction for utxo ([1070021](https://github.com/BitGo/BitGoJS/commit/1070021e38720824e0564dc729f25e273f3ea754))
* **core:** remove bluebird from bitgo object http methods ([be6c9b6](https://github.com/BitGo/BitGoJS/commit/be6c9b6f0436dd8aa2c0a5710cbfcb419dde746a))
* **utxo-lib:** improve `network` exports ([d1d6091](https://github.com/BitGo/BitGoJS/commit/d1d6091186800fa8aad0c906101ad266ebebe3ce))

### [2.1.3](https://github.com/BitGo/BitGoJS/compare/4.34.0...v2.1.3) (2018-08-10)

## [4.24.0](https://github.com/BitGo/BitGoJS/compare/4.23.0...4.24.0) (2018-04-10)

## [4.23.0](https://github.com/BitGo/BitGoJS/compare/4.22.0...4.23.0) (2018-03-28)

## [4.22.0](https://github.com/BitGo/BitGoJS/compare/4.21.0...4.22.0) (2018-03-14)

## [4.20.0](https://github.com/BitGo/BitGoJS/compare/4.19.0...4.20.0) (2018-02-14)

### [1.1.7](https://github.com/BitGo/BitGoJS/compare/v1.1.6...v1.1.7) (2018-01-22)

### [1.1.6](https://github.com/BitGo/BitGoJS/compare/v1.1.5...v1.1.6) (2018-01-22)

### [1.1.5](https://github.com/BitGo/BitGoJS/compare/4.18.1...v1.1.5) (2018-01-20)

### [4.17.1](https://github.com/BitGo/BitGoJS/compare/4.17.0...4.17.1) (2018-01-02)

## [4.17.0](https://github.com/BitGo/BitGoJS/compare/4.16.0...4.17.0) (2017-12-21)

## [4.16.0](https://github.com/BitGo/BitGoJS/compare/4.15.0...4.16.0) (2017-12-19)

## [4.15.0](https://github.com/BitGo/BitGoJS/compare/4.13.0...4.15.0) (2017-11-17)

## [4.13.0](https://github.com/BitGo/BitGoJS/compare/4.12.0...4.13.0) (2017-11-09)

## [4.12.0](https://github.com/BitGo/BitGoJS/compare/4.11.0...4.12.0) (2017-10-30)

## [4.11.0](https://github.com/BitGo/BitGoJS/compare/4.10.0...4.11.0) (2017-10-20)

## [4.10.0](https://github.com/BitGo/BitGoJS/compare/4.9.0...4.10.0) (2017-10-10)

## [4.9.0](https://github.com/BitGo/BitGoJS/compare/v4.9.0...4.9.0) (2017-10-05)

## [4.9.0](https://github.com/BitGo/BitGoJS/compare/4.8.0...v4.9.0) (2017-10-05)

## [4.8.0](https://github.com/BitGo/BitGoJS/compare/4.7.0...4.8.0) (2017-10-05)

## [4.7.0](https://github.com/BitGo/BitGoJS/compare/4.6.0...4.7.0) (2017-10-04)

## [4.6.0](https://github.com/BitGo/BitGoJS/compare/4.4.3...4.6.0) (2017-09-30)


### Reverts

* Revert "Improved error message" ([2c4b5d1](https://github.com/BitGo/BitGoJS/commit/2c4b5d1f6acf8462f2f130e9be9bf6cdcadbe288))

### [4.4.3](https://github.com/BitGo/BitGoJS/compare/4.4.2...4.4.3) (2017-09-21)

### [4.4.2](https://github.com/BitGo/BitGoJS/compare/v1.1.4...4.4.2) (2017-09-20)

### [1.1.4](https://github.com/BitGo/BitGoJS/compare/v4.4.1...v1.1.4) (2017-09-15)

### [4.4.1](https://github.com/BitGo/BitGoJS/compare/4.4.1...v4.4.1) (2017-09-13)

## [4.4.0](https://github.com/BitGo/BitGoJS/compare/v4.4.0...4.4.0) (2017-09-13)

## [4.4.0](https://github.com/BitGo/BitGoJS/compare/4.3.1...v4.4.0) (2017-09-13)

### [4.3.1](https://github.com/BitGo/BitGoJS/compare/4.3.0...4.3.1) (2017-09-11)

## [4.3.0](https://github.com/BitGo/BitGoJS/compare/4.2.2...4.3.0) (2017-09-09)

### [4.2.2](https://github.com/BitGo/BitGoJS/compare/4.2.1...4.2.2) (2017-09-06)

### [4.2.1](https://github.com/BitGo/BitGoJS/compare/4.1.3...4.2.1) (2017-09-06)

### [4.1.3](https://github.com/BitGo/BitGoJS/compare/4.1.2...4.1.3) (2017-09-05)

### [4.1.2](https://github.com/BitGo/BitGoJS/compare/4.1.0...4.1.2) (2017-09-04)

## [4.1.0](https://github.com/BitGo/BitGoJS/compare/4.0.0...4.1.0) (2017-08-28)

## [4.0.0](https://github.com/BitGo/BitGoJS/compare/3.5.1...4.0.0) (2017-08-23)

### [3.5.1](https://github.com/BitGo/BitGoJS/compare/3.5.0...3.5.1) (2017-08-10)

## [3.5.0](https://github.com/BitGo/BitGoJS/compare/3.4.15...3.5.0) (2017-08-08)

### [3.4.15](https://github.com/BitGo/BitGoJS/compare/3.4.14...3.4.15) (2017-08-08)

### [3.4.14](https://github.com/BitGo/BitGoJS/compare/3.4.11...3.4.14) (2017-08-07)

### [3.4.11](https://github.com/BitGo/BitGoJS/compare/3.4.10...3.4.11) (2017-08-04)

### [3.4.10](https://github.com/BitGo/BitGoJS/compare/3.4.9...3.4.10) (2017-08-03)

### [3.4.9](https://github.com/BitGo/BitGoJS/compare/3.4.8...3.4.9) (2017-07-28)

### [3.4.8](https://github.com/BitGo/BitGoJS/compare/3.4.7...3.4.8) (2017-07-25)

### [3.4.7](https://github.com/BitGo/BitGoJS/compare/3.4.6...3.4.7) (2017-07-24)

### [3.4.6](https://github.com/BitGo/BitGoJS/compare/3.4.4...3.4.6) (2017-07-14)

### [3.4.4](https://github.com/BitGo/BitGoJS/compare/3.4.3...3.4.4) (2017-07-07)

### [3.4.3](https://github.com/BitGo/BitGoJS/compare/3.4.2...3.4.3) (2017-07-07)

### [3.4.2](https://github.com/BitGo/BitGoJS/compare/3.4.1...3.4.2) (2017-07-06)

### [3.4.1](https://github.com/BitGo/BitGoJS/compare/3.4.0...3.4.1) (2017-07-05)

## [3.4.0](https://github.com/BitGo/BitGoJS/compare/v1.1.3...3.4.0) (2017-06-16)

### [1.1.3](https://github.com/BitGo/BitGoJS/compare/3.3.6...v1.1.3) (2017-06-15)


### Reverts

* Revert "2.0.0" - WASM too big to load sync in browser ([70db5d3](https://github.com/BitGo/BitGoJS/commit/70db5d328428aa2eba0c2b9738a47d23d138bb69))
* Revert "use sync wasm loading" ([a4b3217](https://github.com/BitGo/BitGoJS/commit/a4b32178ee94299416d28f0db65cc4a613c68f11))

### [3.3.6](https://github.com/BitGo/BitGoJS/compare/3.3.5...3.3.6) (2017-06-14)

### [3.3.5](https://github.com/BitGo/BitGoJS/compare/v1.1.2...3.3.5) (2017-06-14)

### [1.1.2](https://github.com/BitGo/BitGoJS/compare/v1.1.1...v1.1.2) (2017-06-11)

### [1.1.1](https://github.com/BitGo/BitGoJS/compare/v2.1.2...v1.1.1) (2017-06-11)

### [2.1.2](https://github.com/BitGo/BitGoJS/compare/v2.1.1...v2.1.2) (2017-06-11)

### [2.1.1](https://github.com/BitGo/BitGoJS/compare/v2.1.0...v2.1.1) (2017-06-11)

## [2.1.0](https://github.com/BitGo/BitGoJS/compare/v2.0.1...v2.1.0) (2017-06-11)

### [2.0.1](https://github.com/BitGo/BitGoJS/compare/v2.0.0...v2.0.1) (2017-06-11)

## [2.0.0](https://github.com/BitGo/BitGoJS/compare/3.3.3...v2.0.0) (2017-06-11)

### [3.3.3](https://github.com/BitGo/BitGoJS/compare/v1.2.0...3.3.3) (2017-06-08)

## [1.2.0](https://github.com/BitGo/BitGoJS/compare/v1.1.0...v1.2.0) (2017-06-06)

## [1.1.0](https://github.com/BitGo/BitGoJS/compare/3.3.1...v1.1.0) (2017-06-06)

### [3.3.1](https://github.com/BitGo/BitGoJS/compare/3.3.0...3.3.1) (2017-06-02)

## [3.3.0](https://github.com/BitGo/BitGoJS/compare/3.2.10...3.3.0) (2017-06-02)

### [3.2.10](https://github.com/BitGo/BitGoJS/compare/3.2.9...3.2.10) (2017-06-01)

### [3.2.9](https://github.com/BitGo/BitGoJS/compare/v1.0.0...3.2.9) (2017-06-01)

## [1.0.0](https://github.com/BitGo/BitGoJS/compare/3.2.8...v1.0.0) (2017-05-29)

### [3.2.8](https://github.com/BitGo/BitGoJS/compare/3.2.7...3.2.8) (2017-05-18)

### [3.2.7](https://github.com/BitGo/BitGoJS/compare/3.2.5...3.2.7) (2017-05-17)

### [3.2.5](https://github.com/BitGo/BitGoJS/compare/3.2.3...3.2.5) (2017-05-16)

### [3.2.3](https://github.com/BitGo/BitGoJS/compare/3.2.2...3.2.3) (2017-05-15)

### [3.2.2](https://github.com/BitGo/BitGoJS/compare/3.2.1...3.2.2) (2017-05-15)

### [3.2.1](https://github.com/BitGo/BitGoJS/compare/3.2.0...3.2.1) (2017-05-12)

## [3.2.0](https://github.com/BitGo/BitGoJS/compare/3.1.2...3.2.0) (2017-05-12)

### [3.1.2](https://github.com/BitGo/BitGoJS/compare/3.1.0...3.1.2) (2017-05-09)

## [3.1.0](https://github.com/BitGo/BitGoJS/compare/3.0.6...3.1.0) (2017-05-01)

### [3.0.6](https://github.com/BitGo/BitGoJS/compare/3.0.5...3.0.6) (2017-04-28)

### [3.0.5](https://github.com/BitGo/BitGoJS/compare/3.0.3...3.0.5) (2017-04-27)

### [3.0.3](https://github.com/BitGo/BitGoJS/compare/2.2.4...3.0.3) (2017-04-20)

### [2.2.4](https://github.com/BitGo/BitGoJS/compare/2.2.3...2.2.4) (2017-04-03)

### [2.2.3](https://github.com/BitGo/BitGoJS/compare/2.2.2...2.2.3) (2017-03-26)

### [2.2.2](https://github.com/BitGo/BitGoJS/compare/2.2.1...2.2.2) (2017-03-24)

### [2.2.1](https://github.com/BitGo/BitGoJS/compare/2.2.0...2.2.1) (2017-03-21)

## [2.2.0](https://github.com/BitGo/BitGoJS/compare/2.1.11...2.2.0) (2017-03-02)

### [2.1.11](https://github.com/BitGo/BitGoJS/compare/2.1.10...2.1.11) (2017-03-02)

### [2.1.10](https://github.com/BitGo/BitGoJS/compare/2.1.8...2.1.10) (2017-02-24)

### [2.1.8](https://github.com/BitGo/BitGoJS/compare/2.1.7...2.1.8) (2017-02-22)

### [2.1.7](https://github.com/BitGo/BitGoJS/compare/2.1.6...2.1.7) (2017-02-08)

### [2.1.6](https://github.com/BitGo/BitGoJS/compare/2.1.5...2.1.6) (2017-02-06)

### [2.1.5](https://github.com/BitGo/BitGoJS/compare/2.1.4...2.1.5) (2017-01-06)

### [2.1.4](https://github.com/BitGo/BitGoJS/compare/2.1.2...2.1.4) (2017-01-04)

### [2.1.2](https://github.com/BitGo/BitGoJS/compare/2.1.1...2.1.2) (2016-12-27)

### [2.1.1](https://github.com/BitGo/BitGoJS/compare/2.1.0...2.1.1) (2016-12-22)

## [2.1.0](https://github.com/BitGo/BitGoJS/compare/2.0.5...2.1.0) (2016-12-16)

### [2.0.5](https://github.com/BitGo/BitGoJS/compare/2.0.4...2.0.5) (2016-12-01)

### [2.0.4](https://github.com/BitGo/BitGoJS/compare/2.0.3...2.0.4) (2016-10-17)

### [2.0.3](https://github.com/BitGo/BitGoJS/compare/2.0.2...2.0.3) (2016-08-26)

### [2.0.2](https://github.com/BitGo/BitGoJS/compare/2.0.1...2.0.2) (2016-08-19)

### [2.0.1](https://github.com/BitGo/BitGoJS/compare/2.0.0...2.0.1) (2016-07-26)

## [2.0.0](https://github.com/BitGo/BitGoJS/compare/1.8.0...2.0.0) (2016-07-02)

## [1.8.0](https://github.com/BitGo/BitGoJS/compare/1.7.0...1.8.0) (2016-05-27)

## [1.7.0](https://github.com/BitGo/BitGoJS/compare/1.6.1...1.7.0) (2016-05-21)

### [1.6.1](https://github.com/BitGo/BitGoJS/compare/1.6.0...1.6.1) (2016-05-10)

## [1.6.0](https://github.com/BitGo/BitGoJS/compare/1.5.4...1.6.0) (2016-05-10)

### [1.5.4](https://github.com/BitGo/BitGoJS/compare/1.5.3...1.5.4) (2016-05-02)

### [1.5.3](https://github.com/BitGo/BitGoJS/compare/1.5.1...1.5.3) (2016-04-27)

### [1.5.1](https://github.com/BitGo/BitGoJS/compare/1.5.0...1.5.1) (2016-04-27)

## [1.5.0](https://github.com/BitGo/BitGoJS/compare/1.4.0...1.5.0) (2016-04-27)

## [1.4.0](https://github.com/BitGo/BitGoJS/compare/1.3.0...1.4.0) (2016-04-20)

## [1.3.0](https://github.com/BitGo/BitGoJS/compare/1.2.1...1.3.0) (2016-04-12)

### [1.2.1](https://github.com/BitGo/BitGoJS/compare/1.0.0...1.2.1) (2016-04-11)

## [1.0.0](https://github.com/BitGo/BitGoJS/compare/0.13.0...1.0.0) (2016-03-22)

## [0.13.0](https://github.com/BitGo/BitGoJS/compare/0.12.0...0.13.0) (2016-03-18)

## [0.12.0](https://github.com/BitGo/BitGoJS/compare/0.11.72...0.12.0) (2016-03-07)

### [0.11.72](https://github.com/BitGo/BitGoJS/compare/0.11.70...0.11.72) (2016-03-04)

### [0.11.70](https://github.com/BitGo/BitGoJS/compare/0.11.68...0.11.70) (2016-03-02)

### [0.11.68](https://github.com/BitGo/BitGoJS/compare/0.11.67...0.11.68) (2016-03-01)

### [0.11.67](https://github.com/BitGo/BitGoJS/compare/0.11.66...0.11.67) (2016-02-25)

### [0.11.66](https://github.com/BitGo/BitGoJS/compare/0.11.65...0.11.66) (2016-02-23)

### [0.11.65](https://github.com/BitGo/BitGoJS/compare/0.11.64...0.11.65) (2016-02-18)

### [0.11.64](https://github.com/BitGo/BitGoJS/compare/0.11.63...0.11.64) (2016-01-16)

### [0.11.63](https://github.com/BitGo/BitGoJS/compare/0.11.62...0.11.63) (2016-01-16)

### [0.11.62](https://github.com/BitGo/BitGoJS/compare/0.11.60...0.11.62) (2015-12-22)

### [0.11.60](https://github.com/BitGo/BitGoJS/compare/0.11.59...0.11.60) (2015-12-18)

### [0.11.59](https://github.com/BitGo/BitGoJS/compare/0.11.58...0.11.59) (2015-12-18)

### [0.11.58](https://github.com/BitGo/BitGoJS/compare/0.11.57...0.11.58) (2015-12-17)

### [0.11.57](https://github.com/BitGo/BitGoJS/compare/0.11.47...0.11.57) (2015-12-17)

### [0.11.47](https://github.com/BitGo/BitGoJS/compare/0.11.45...0.11.47) (2015-11-17)

### [0.11.45](https://github.com/BitGo/BitGoJS/compare/0.11.42...0.11.45) (2015-10-30)

### [0.11.42](https://github.com/BitGo/BitGoJS/compare/0.11.41...0.11.42) (2015-09-23)

### [0.11.41](https://github.com/BitGo/BitGoJS/compare/0.11.40...0.11.41) (2015-09-23)

### [0.11.40](https://github.com/BitGo/BitGoJS/compare/0.11.38...0.11.40) (2015-09-22)

### [0.11.38](https://github.com/BitGo/BitGoJS/compare/0.11.36...0.11.38) (2015-09-21)

### [0.11.36](https://github.com/BitGo/BitGoJS/compare/0.11.35...0.11.36) (2015-09-14)

### [0.11.35](https://github.com/BitGo/BitGoJS/compare/0.11.34...0.11.35) (2015-09-10)

### [0.11.34](https://github.com/BitGo/BitGoJS/compare/0.11.33...0.11.34) (2015-09-02)

### [0.11.33](https://github.com/BitGo/BitGoJS/compare/0.11.32...0.11.33) (2015-08-28)

### [0.11.32](https://github.com/BitGo/BitGoJS/compare/0.11.31...0.11.32) (2015-08-20)

### [0.11.31](https://github.com/BitGo/BitGoJS/compare/0.11.30...0.11.31) (2015-08-17)

### [0.11.30](https://github.com/BitGo/BitGoJS/compare/0.11.29...0.11.30) (2015-08-14)

### [0.11.29](https://github.com/BitGo/BitGoJS/compare/0.11.28...0.11.29) (2015-08-14)

### [0.11.28](https://github.com/BitGo/BitGoJS/compare/0.11.27...0.11.28) (2015-08-14)

### [0.11.27](https://github.com/BitGo/BitGoJS/compare/0.11.26...0.11.27) (2015-07-31)

### [0.11.26](https://github.com/BitGo/BitGoJS/compare/0.11.25...0.11.26) (2015-07-31)

### [0.11.25](https://github.com/BitGo/BitGoJS/compare/0.11.24...0.11.25) (2015-07-21)

### [0.11.24](https://github.com/BitGo/BitGoJS/compare/0.11.23...0.11.24) (2015-07-17)

### [0.11.23](https://github.com/BitGo/BitGoJS/compare/0.11.22...0.11.23) (2015-07-16)

### [0.11.22](https://github.com/BitGo/BitGoJS/compare/0.11.21...0.11.22) (2015-07-08)

### [0.11.21](https://github.com/BitGo/BitGoJS/compare/0.11.20...0.11.21) (2015-07-08)

### [0.11.20](https://github.com/BitGo/BitGoJS/compare/0.11.19...0.11.20) (2015-07-08)

### [0.11.19](https://github.com/BitGo/BitGoJS/compare/0.11.18...0.11.19) (2015-06-26)

### [0.11.18](https://github.com/BitGo/BitGoJS/compare/0.11.17...0.11.18) (2015-06-22)

### [0.11.17](https://github.com/BitGo/BitGoJS/compare/0.11.16...0.11.17) (2015-06-12)

### [0.11.16](https://github.com/BitGo/BitGoJS/compare/0.11.15...0.11.16) (2015-06-05)

### [0.11.15](https://github.com/BitGo/BitGoJS/compare/0.11.14...0.11.15) (2015-06-05)

### [0.11.14](https://github.com/BitGo/BitGoJS/compare/0.11.13...0.11.14) (2015-06-04)

### [0.11.13](https://github.com/BitGo/BitGoJS/compare/0.11.12...0.11.13) (2015-06-02)

### [0.11.12](https://github.com/BitGo/BitGoJS/compare/0.11.11...0.11.12) (2015-06-02)

### [0.11.11](https://github.com/BitGo/BitGoJS/compare/0.11.10...0.11.11) (2015-05-29)

### [0.11.10](https://github.com/BitGo/BitGoJS/compare/0.11.9...0.11.10) (2015-05-28)

### [0.11.9](https://github.com/BitGo/BitGoJS/compare/0.11.8...0.11.9) (2015-05-28)

### [0.11.8](https://github.com/BitGo/BitGoJS/compare/0.11.7...0.11.8) (2015-05-24)

### [0.11.7](https://github.com/BitGo/BitGoJS/compare/0.11.6...0.11.7) (2015-05-20)

### [0.11.6](https://github.com/BitGo/BitGoJS/compare/0.11.5...0.11.6) (2015-05-16)

### [0.11.5](https://github.com/BitGo/BitGoJS/compare/0.11.3...0.11.5) (2015-05-07)

### [0.11.3](https://github.com/BitGo/BitGoJS/compare/0.11.2...0.11.3) (2015-05-06)

### [0.11.2](https://github.com/BitGo/BitGoJS/compare/0.11.1...0.11.2) (2015-05-04)

### [0.11.1](https://github.com/BitGo/BitGoJS/compare/v0.11.0...0.11.1) (2015-04-20)

## [0.11.0](https://github.com/BitGo/BitGoJS/compare/v0.10.0...v0.11.0) (2015-04-15)

## [0.10.0](https://github.com/BitGo/BitGoJS/compare/0.9.26...v0.10.0) (2015-04-10)

### [0.9.26](https://github.com/BitGo/BitGoJS/compare/0.9.25...0.9.26) (2015-02-19)

### [0.9.25](https://github.com/BitGo/BitGoJS/compare/0.9.24...0.9.25) (2015-02-18)

### [0.9.24](https://github.com/BitGo/BitGoJS/compare/0.9.23...0.9.24) (2015-02-18)

### [0.9.23](https://github.com/BitGo/BitGoJS/compare/0.9.22...0.9.23) (2015-02-13)

### [0.9.22](https://github.com/BitGo/BitGoJS/compare/0.9.21...0.9.22) (2015-02-11)

### [0.9.21](https://github.com/BitGo/BitGoJS/compare/0.9.20...0.9.21) (2015-02-04)

### [0.9.20](https://github.com/BitGo/BitGoJS/compare/0.9.19...0.9.20) (2015-02-03)

### [0.9.19](https://github.com/BitGo/BitGoJS/compare/0.9.18...0.9.19) (2015-02-03)

### [0.9.18](https://github.com/BitGo/BitGoJS/compare/0.9.16...0.9.18) (2015-01-30)

### [0.9.16](https://github.com/BitGo/BitGoJS/compare/v0.9.15...0.9.16) (2015-01-29)

### [0.9.15](https://github.com/BitGo/BitGoJS/compare/v0.9.13...v0.9.15) (2015-01-29)

### [0.9.13](https://github.com/BitGo/BitGoJS/compare/v0.9.11...v0.9.13) (2015-01-27)

### [0.9.11](https://github.com/BitGo/BitGoJS/compare/v0.9.10...v0.9.11) (2015-01-16)

### [0.9.10](https://github.com/BitGo/BitGoJS/compare/v0.9.9...v0.9.10) (2015-01-16)

### [0.9.9](https://github.com/BitGo/BitGoJS/compare/v0.9.8...v0.9.9) (2015-01-13)

### [0.9.8](https://github.com/BitGo/BitGoJS/compare/v0.9.5...v0.9.8) (2015-01-10)

### [0.9.5](https://github.com/BitGo/BitGoJS/compare/v0.9.4...v0.9.5) (2015-01-09)

### [0.9.4](https://github.com/BitGo/BitGoJS/compare/v0.9.3...v0.9.4) (2015-01-09)

### [0.9.3](https://github.com/BitGo/BitGoJS/compare/v0.9.2...v0.9.3) (2015-01-08)

### [0.9.2](https://github.com/BitGo/BitGoJS/compare/v0.9.1...v0.9.2) (2015-01-08)

### [0.9.1](https://github.com/BitGo/BitGoJS/compare/v0.9.0...v0.9.1) (2015-01-08)

## 0.9.0 (2014-12-31)

## [14.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0...bitgo@14.0.0) (2022-04-12)


### ⚠ BREAKING CHANGES

* **account-lib:** Builder method changing

STLX-14028
* **core:** Methods that previously implemented `verifyAddress` incorrectly will
now throw `MethodNotImplementedError()` instead.

Issue: BG-43225

### Features

* **account-lib:** add claim for dot staking ([34ca211](https://github.com/BitGo/BitGoJS/commit/34ca2116304ed638871f9b294befcfecbeb1854d))
* **account-lib:** add deposit and stake builder for near ([10d6d1e](https://github.com/BitGo/BitGoJS/commit/10d6d1e0c63d01e192e8ea4979bf8386736eaee8))
* **account-lib:** add explain transaction for Near ([adfa88b](https://github.com/BitGo/BitGoJS/commit/adfa88b46a1312c9c9f02cff650f761e27da37b6))
* **account-lib:** add NEAR transaction builder ([3badcbd](https://github.com/BitGo/BitGoJS/commit/3badcbdb974a62c26aa96a10d627aea27a5d7123))
* **account-lib:** add NEAR tss signing ([d8ee226](https://github.com/BitGo/BitGoJS/commit/d8ee226f2aad5e75328e0f0c8836282c993d054b))
* **account-lib:** add solana tokens STLX-11959 ([1902efb](https://github.com/BitGo/BitGoJS/commit/1902efbf3dcee72879d0bec2676a97961caba24d))
* **account-lib:** add solana util functions for use in wp, refactor ([460adfa](https://github.com/BitGo/BitGoJS/commit/460adfa7576712d9eab184bbd7e55f8c19e41131))
* **account-lib:** add staking deactivate builder ([35bb996](https://github.com/BitGo/BitGoJS/commit/35bb9965513a87b63ca89c0e3d05298230248079))
* **account-lib:** add staking withdraw builder ([34c7a75](https://github.com/BitGo/BitGoJS/commit/34c7a75a6755480c2a62606562002f645f90c65f))
* **account-lib:** add stateproofkey param ([46111c9](https://github.com/BitGo/BitGoJS/commit/46111c90df78b735d1c1d8da391857975c5bf6f5))
* **account-lib:** add support for offline kr txn ([4fad380](https://github.com/BitGo/BitGoJS/commit/4fad380967effc80deb650626519d30b05933e0e))
* **account-lib:** add withdrawUnstaked for dot ([984e412](https://github.com/BitGo/BitGoJS/commit/984e412f88eb6060182c144bf6fc2b8dee12899e))
* **account-lib:** adding NFT support to BitGo SDK ([39b7a4f](https://github.com/BitGo/BitGoJS/commit/39b7a4f6e4707a172cc506312f7930f8bc0a1603))
* **account-lib:** allow dot key pair init with bs58 pub key ([d40ef28](https://github.com/BitGo/BitGoJS/commit/d40ef28af3edc77aaa61265512b07b61ee378065))
* **account-lib:** avaxc upgrade common fork to london ([9028b75](https://github.com/BitGo/BitGoJS/commit/9028b7543f9e8322598c2225eefc4dff7d5ea5dd))
* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** change NEAR transfer builder interface ([ac4bf46](https://github.com/BitGo/BitGoJS/commit/ac4bf4605e2cbae191c4cbac252b76a8a8c49bef))
* **account-lib:** export AtaInitializationBuilder STLX-11958 ([c0ec45b](https://github.com/BitGo/BitGoJS/commit/c0ec45ba1690e44b28e7439e7bbe487b91dd6ac9))
* **account-lib:** export token transfer builder STLX-11959 ([b757aa8](https://github.com/BitGo/BitGoJS/commit/b757aa89c6fd535740b732556df2ec53e281396e))
* **account-lib:** fixing coins.ts tsol mint addresses STLX-11959 ([f973924](https://github.com/BitGo/BitGoJS/commit/f973924eb29a53570de67861f44d270cdf35a1cd))
* **account-lib:** implement add signature for sol ([451e58a](https://github.com/BitGo/BitGoJS/commit/451e58a1f1a34e54c7d493a2dac6621c777da783))
* **account-lib:** improve and export NEAR util methods ([7ad569e](https://github.com/BitGo/BitGoJS/commit/7ad569e631ca8a5f8737c199bfdb190d92af9c61))
* **account-lib:** include rent exempt amount in solana ata init transaction STLX-11958 ([25c7eeb](https://github.com/BitGo/BitGoJS/commit/25c7eebce629b0d9de6a52946bc4b3f91b34fe22))
* **account-lib:** load inputs and outputs of solana create ata instruction STLX-11958 ([a3a2ab1](https://github.com/BitGo/BitGoJS/commit/a3a2ab1a6fb885a9aecc5c648529bfc9f313622c))
* **account-lib:** recover signature from raw tx ([113f132](https://github.com/BitGo/BitGoJS/commit/113f132f3219c752938b40a56eb90fca937b223d))
* **account-lib:** refactor mintAddress -> tokenName 3 STLX-11959 ([a1455a3](https://github.com/BitGo/BitGoJS/commit/a1455a36eab968503691928d2ac8daef1a00797d))
* **account-lib:** refactor mintAddress -> tokenName 4 STLX-11959 ([eeeaecd](https://github.com/BitGo/BitGoJS/commit/eeeaecdffb2ae00e2c01e5b14e52995c934f8998))
* **account-lib:** refactor mintAddress -> tokenName STLX-11959 ([6ca2d10](https://github.com/BitGo/BitGoJS/commit/6ca2d1065e76c26f0d2aac8a08ed536bbba9bbad))
* **account-lib:** spl-token encode/decode rework STLX-11959 ([e1db449](https://github.com/BitGo/BitGoJS/commit/e1db449d2094ea9f85f8af479f83f14f0371b99b))
* **account-lib:** support HD MPC key generation and signing ([be934d3](https://github.com/BitGo/BitGoJS/commit/be934d34fb75020d78618ef9fdf2976041346be8))
* **account-lib:** supporting adding signatures to transactions ([00cd566](https://github.com/BitGo/BitGoJS/commit/00cd5662bf9f89c9c4bdab948f6548107c9ef696))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **account-lib:** token transfer support STLX-11959 ([1687234](https://github.com/BitGo/BitGoJS/commit/16872349fc25bffce07eda515728aff250d1a25d))
* **account-lib:** validate ValidityWindows in baseBuildTransaction ([dd1dfc4](https://github.com/BitGo/BitGoJS/commit/dd1dfc41ac2a5fa9489f0472b31ad584b868b9d7))
* add fetchEncryptedPrivKeys.ts ([136fbab](https://github.com/BitGo/BitGoJS/commit/136fbabb6220b7e5620d6705b0ceb1819f45dcac))
* add nft tokens to statics ([9f42cc4](https://github.com/BitGo/BitGoJS/commit/9f42cc4b8dc4f81bcff6fa6d7da58b07df5b8c2a))
* add retry logic to external signer ([05e198a](https://github.com/BitGo/BitGoJS/commit/05e198a64f43afbf035fee406f27e0b35cb90721))
* add signing functionality to external signer mode ([ee26c72](https://github.com/BitGo/BitGoJS/commit/ee26c727931a2ae08613f173bd34a1092c5915fc))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* **bitgo:** add emergency param to whitelist ([3e0b615](https://github.com/BitGo/BitGoJS/commit/3e0b6155c750da431ffc8062a4ccf7c0bad639f2))
* **bitgo:** add nonce in prebuild whitelisted params ([bbf4084](https://github.com/BitGo/BitGoJS/commit/bbf4084912bb0b29c048bbc192d83b1ce4bdf156))
* **bitgo:** update tss hd wallet sharing ([d416f1e](https://github.com/BitGo/BitGoJS/commit/d416f1e65794f1be2a0d908b0d2d43b5f0589355))
* check config when running in external signer mode ([3c0e9a1](https://github.com/BitGo/BitGoJS/commit/3c0e9a12f2ae652a95defc289cb32a9589369bb0))
* check that signerFileSystemPath path contains a private key ([fe78332](https://github.com/BitGo/BitGoJS/commit/fe78332784edcff6f897ef05d315f2106a1308f4))
* **core:** add createTss func to keychains ([954a148](https://github.com/BitGo/BitGoJS/commit/954a148a324acaadfdf28a0b570ecb4a8a817076))
* **core:** add examples of enable and disable token ([1aeeeb3](https://github.com/BitGo/BitGoJS/commit/1aeeeb3c6b87fa0c7b3a1ff9de131be74d6d8286))
* **core:** add function in SDK and write examples for deploy/flush forwarder. Ticket: STLX-12550 ([c4cd0b4](https://github.com/BitGo/BitGoJS/commit/c4cd0b4710b8405add0104c289eb145a45983636))
* **core:** add hop to signTransaction and unit tests ([9d58b26](https://github.com/BitGo/BitGoJS/commit/9d58b261ddeb24bfbbb5cb6ebf2e18b8ec94e550))
* **core:** add tss flow on pending approval ([22313ff](https://github.com/BitGo/BitGoJS/commit/22313ff47dcea31340eee3e83c9d09ad641e02e4))
* **core:** added node urls for Near ([4102c56](https://github.com/BitGo/BitGoJS/commit/4102c56fb4bc7ddbb57ef3e928b3f3e4c95c4073))
* **core:** enable hop transactions in avaxc ([4395c47](https://github.com/BitGo/BitGoJS/commit/4395c4791a64eca7500dd7c0658a6f9a5690e0af))
* **core:** impelement tss wallet creation ([d5dfe3a](https://github.com/BitGo/BitGoJS/commit/d5dfe3a83c235ec1c30fbf8afc14e2bb46168218))
* **core:** implement getSignablePayload for baseCoin and sol ([c584437](https://github.com/BitGo/BitGoJS/commit/c584437485922af67940b807afde2bee348e158c))
* **core:** implement sign transaction for NEAR ([6da463a](https://github.com/BitGo/BitGoJS/commit/6da463a35a97a328985cdd0b3e3f173956884424))
* **core:** support BLS-DKG key generation flow for ETH2 hot wallet creation ([356eee7](https://github.com/BitGo/BitGoJS/commit/356eee7b9fc090de6dda03a864c405e464701988))
* **core:** support creating algo wallets with seed ([41837ad](https://github.com/BitGo/BitGoJS/commit/41837ad8645285a157d1b565abfbe88f7ee15bf4))
* **core:** support creating solana ATA with sdk ([40ee96f](https://github.com/BitGo/BitGoJS/commit/40ee96ff0804f140b027cf9c7034b295a876a86d))
* **core:** support tss wallet sharing ([249f424](https://github.com/BitGo/BitGoJS/commit/249f424f56d5ea2ecd4a4546986133e95d693fc1))
* **core:** tss wallet sharing tests ([3a5923b](https://github.com/BitGo/BitGoJS/commit/3a5923b13883d9022a86a7b8621b8dd488a7d85c))
* **core:** verify and prebuild hop transactions ([bac9bde](https://github.com/BitGo/BitGoJS/commit/bac9bde745371804357fa3cd673fa0572442f1b9))
* **core:** verify tss transactions ([319515f](https://github.com/BitGo/BitGoJS/commit/319515f91200fab7b96954c0b1687dbef7092308))
* enable external signer mode for production ([077d2de](https://github.com/BitGo/BitGoJS/commit/077d2de7e477a2563b64b7d9be2fb7d4a594949b))
* external signer to read encrypted privkeys ([32176e7](https://github.com/BitGo/BitGoJS/commit/32176e78edefa4cf3f5a853c33640604e812a42d))
* external signer to read private key from walletid ([735dcd9](https://github.com/BitGo/BitGoJS/commit/735dcd9cc0a00745405740d728c27da9aba993b3))
* only allow external signing feature to run in test mode ([7b00932](https://github.com/BitGo/BitGoJS/commit/7b009324446b0b0546ca68832767afc5ef92f5c5))
* **root:** add unit-test-all to ci ([3d0efa4](https://github.com/BitGo/BitGoJS/commit/3d0efa49b3fb64dd658829e45c557152e8b7ae43))
* **root:** implement isWalletAddress for HBAR ([dc8d5fc](https://github.com/BitGo/BitGoJS/commit/dc8d5fca2c41881d97ffab084a1e6232f9a1c426))
* **root:** implement isWalletAddress for STX ([1828397](https://github.com/BitGo/BitGoJS/commit/1828397d1eedab1afde6e04ad64894437698cfa5))
* **root:** update SDK sendMany to use TSS ([6fef741](https://github.com/BitGo/BitGoJS/commit/6fef741913d6afb86ec3c73b6cdefe8a7c831afc))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* **statics:** add 2nd batch Feb tokens ([53aa64d](https://github.com/BitGo/BitGoJS/commit/53aa64d33ebb90bea1186ac39c2c4fce9464130f))
* **statics:** add erc20 tokens ([fc496c3](https://github.com/BitGo/BitGoJS/commit/fc496c34a1b538ad1e31fbe6b4ab3a159590d40e))
* **statics:** add gteth support for trading ([53e5680](https://github.com/BitGo/BitGoJS/commit/53e56803407f54803e0c456bb32be87210a7cf59))
* **statics:** add matic coin config ([c6514c9](https://github.com/BitGo/BitGoJS/commit/c6514c98d494e7bc1a8ab110024d68abc51ae8f3))
* **statics:** add new tokens ([9328422](https://github.com/BitGo/BitGoJS/commit/93284228b12627efaa0e2f0c770f9dd733b9fc9f))
* **statics:** add ofc casper coins support for trading ([a88406f](https://github.com/BitGo/BitGoJS/commit/a88406f444022d29ad6b5d746280025059a00217))
* **statics:** add ofc stacks coins support for trading ([3fa7ee4](https://github.com/BitGo/BitGoJS/commit/3fa7ee45a05dd873ca39aec9d1d452069ca19780))
* **statics:** add ofcavaxc and ofctavaxc support for trading ([c06f72c](https://github.com/BitGo/BitGoJS/commit/c06f72cb5a291f1badbf5374f88bbfba923ea208))
* **statics:** add token traxx ([752f2a3](https://github.com/BitGo/BitGoJS/commit/752f2a391bc5d23d4ae5b7eb3cfc70b2c3251f64))
* **statics:** create FIAT currency in Testnet ([4b3bfcb](https://github.com/BitGo/BitGoJS/commit/4b3bfcb07c95cd9ca5cdf7d745fd5f56a3217652))
* **statics:** create FIAT tokens in Testnet ([9a4d727](https://github.com/BitGo/BitGoJS/commit/9a4d7275e1a65dd2cda54e8d4c8918f36f7952a8))
* **statics:** create fiat-usdc-tusdc ([a9a1d60](https://github.com/BitGo/BitGoJS/commit/a9a1d6058da72b1b1eebeec556d2af984ec660b6))
* **statics:** rename burp token ([762fb19](https://github.com/BitGo/BitGoJS/commit/762fb198b8ca381cd8a5a9c1b92e159cd4130781))
* **statics:** support new Algo token name format ([47a1cd7](https://github.com/BitGo/BitGoJS/commit/47a1cd7a66530795f853f7d775da5a4153c975a0))
* **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))
* **statics:** update token contract addresses ([85744bf](https://github.com/BitGo/BitGoJS/commit/85744bf3c66141cd3841259acb91d4f2eab1a958))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))
* support validation of  base58 dot public keys ([a8fae0d](https://github.com/BitGo/BitGoJS/commit/a8fae0d0e69154327625a523afdc2b5f4e512cda))
* tss keychain creation ([93c33be](https://github.com/BitGo/BitGoJS/commit/93c33be9bdf62ef2bb676f04a509e564cf5c7725))
* unhardened derivation with tss ([ce29c26](https://github.com/BitGo/BitGoJS/commit/ce29c26bfcdbf9b1e015d8ef759ec1b2b29ccda9))
* update params to post /signatureshares ([49cdcdd](https://github.com/BitGo/BitGoJS/commit/49cdcdd9fb1af3f3cb316251fd0682740e31b390))
* update tss key creation to support hd ([9611e5d](https://github.com/BitGo/BitGoJS/commit/9611e5dce0460d0fae691fbc90c887d3f8e720fd))
* update tss signing to support hd ([a3b3b3f](https://github.com/BitGo/BitGoJS/commit/a3b3b3fed18a462d85d11a6f0fd498edf0f699e2))
* **utxo-bin:** add support for odd transactions ([4c44297](https://github.com/BitGo/BitGoJS/commit/4c442974b5638f97db2ca013ecd887adaa9f8707))


### Bug Fixes

* **account-lib:** add hash to signable ([401266a](https://github.com/BitGo/BitGoJS/commit/401266a4094be9ab7d034565476635817fdf828b))
* **account-lib:** dot unit test memory issue ([709266b](https://github.com/BitGo/BitGoJS/commit/709266b172bcd288e1912b9441752bd3be4545b8))
* **account-lib:** fix amount method unit ([8df519b](https://github.com/BitGo/BitGoJS/commit/8df519b83c08ce985b6011edf6685eafb948eea4))
* **account-lib:** fix validity windows unit test ([1f39b99](https://github.com/BitGo/BitGoJS/commit/1f39b99bcfe6e921c9c69d5183925270c4468861))
* **account-lib:** update algo decode transaction method ([e142775](https://github.com/BitGo/BitGoJS/commit/e142775f19bad0fec015fe9eb1bf73afca87f6ee))
* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** fix avaxctoken cannot withdraw ([a3c1dc7](https://github.com/BitGo/BitGoJS/commit/a3c1dc78a994e040df2a17b7488dae6a39090fff))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* **blockapis:** use correct mocha import ([958b2c0](https://github.com/BitGo/BitGoJS/commit/958b2c093df39b5ec80ca793ba9d71d451fa7d57))
* change keyname from asset to symbol in amount ([5b23bf7](https://github.com/BitGo/BitGoJS/commit/5b23bf780adb8288336e807c45c2a745d876599d))
* **core:** add multisig type param on add wallet ([2622028](https://github.com/BitGo/BitGoJS/commit/2622028bfe2b4d50aa15ae20e12e92fc27f10e5e))
* **core:** add signing params for hopTx ([987bc33](https://github.com/BitGo/BitGoJS/commit/987bc3315a45e730f1576ee6ccb6191117aa20f2))
* **core:** change loop to POST /address ([d66305f](https://github.com/BitGo/BitGoJS/commit/d66305f16d65dd8f299b122fc8a81a596ab343a1))
* **core:** default goerli for etherscan ([f4fadbf](https://github.com/BitGo/BitGoJS/commit/f4fadbfa9256ef58d4f4f56b511faaea739ab9ca))
* **core:** expose feeInfo when building txns from tx requests ([6000d2e](https://github.com/BitGo/BitGoJS/commit/6000d2edd14297e51fd4fbd433fe091b8bdb1d61))
* **core:** fix tss pending approvals ([e686536](https://github.com/BitGo/BitGoJS/commit/e686536679f2a1729d531c3430c7456402345803))
* **core:** fix tss wallet creation ([ac06c62](https://github.com/BitGo/BitGoJS/commit/ac06c624710f2fff49430b6bb0b32a66892aaa8e))
* **core:** implement isWalletAddress for ALGO ([262a1ec](https://github.com/BitGo/BitGoJS/commit/262a1ecea7d3bb6055c7aee465ba70bb7202546a))
* **core:** rename token to tokenName, possible clash with auth token for algo ([46cfcf2](https://github.com/BitGo/BitGoJS/commit/46cfcf2564f4d1d350987bd1ce6dbdb947033802))
* **core:** rename verifyAddress and remove invalid implementations ([3d6d5d0](https://github.com/BitGo/BitGoJS/commit/3d6d5d07fcc4d228d39b7634e8f3349a6d623ded))
* **core:** support eip-1559 and eip-155 in wrw ([e88b8e1](https://github.com/BitGo/BitGoJS/commit/e88b8e11a8f469be527a770972132aee5c9ec2a8))
* **core:** support password reset and enterprise with MPC ([2434ee6](https://github.com/BitGo/BitGoJS/commit/2434ee644b0c1c111dc6df32f5e061b61ca2bd50))
* **core:** tss backup keychain output prv ([e7facc7](https://github.com/BitGo/BitGoJS/commit/e7facc792b7cfe8b36f71cc662d7504316fa88fd))
* fix build ([4a19ae6](https://github.com/BitGo/BitGoJS/commit/4a19ae67b003a39982551c9615a7a4ef217bc15b))
* fix urijs vuln ([957c618](https://github.com/BitGo/BitGoJS/commit/957c6185f912cf74792cfcbc4e3bd20b14ab5de3))
* force secure urls unless disabled ([3b9edd5](https://github.com/BitGo/BitGoJS/commit/3b9edd593016f82fa69a4fe740ea706fe1daeee7))
* remove `gitHead` property from package.jsons ([e6b7fdd](https://github.com/BitGo/BitGoJS/commit/e6b7fdd4e4e16c4a07a9a7ad39cc70f08854486e))
* **statics:** adding ofcmcdai, ofcaxsv2, ofclrcv2, and ofcxsushi ([d472e9d](https://github.com/BitGo/BitGoJS/commit/d472e9d63e3cddf7cd416f606c60426013e0d109))
* **statics:** avaxc token name to lower case ([de49cb3](https://github.com/BitGo/BitGoJS/commit/de49cb30be27dad05e958e7a7eceacd6ec2e0c33))
* **statics:** fix import/exports ([29d02b9](https://github.com/BitGo/BitGoJS/commit/29d02b9a5f97f1a78bce2313c5e95dc07240a3db))
* **statics:** fix Solana transactions explorers ([c1f4e62](https://github.com/BitGo/BitGoJS/commit/c1f4e62e683e932af21b7238777c73a6fc7ef2d2))
* **statics:** fix stx explorer url ([cfa4998](https://github.com/BitGo/BitGoJS/commit/cfa499829f41ee791d5a0f7cc79bae801fdc1b73))
* update dot to address breaking changes in 7.15.1 ([a949618](https://github.com/BitGo/BitGoJS/commit/a949618de00b944b2d9729485f6b9ac4e6fced3f))
* update package-lock.json and clientRoutes ([a3433ea](https://github.com/BitGo/BitGoJS/commit/a3433ea0e86af35a26ae24bcb2e3f9c7adede91f))
* update package-lock.json and clientRoutes ([9ed9bb4](https://github.com/BitGo/BitGoJS/commit/9ed9bb44727611cf3d9b67284b1d7dd6ec10772f))
* **utxo-lib:** always verify ECDSA in strict mode ([4fcaf53](https://github.com/BitGo/BitGoJS/commit/4fcaf53f18f74a68f37a0513a549fea1c5c1ffb8)), closes [/github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts#L215](https://github.com/BitGo//github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts/issues/L215) [/github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts#L1212](https://github.com/BitGo//github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts/issues/L1212)
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))


### Code Refactoring

* **account-lib:** refactor builder to be consistent with other coins builders ([cbdc721](https://github.com/BitGo/BitGoJS/commit/cbdc721ebbb81752071f8731db4d11afc47539fa))

## [14.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.26...bitgo@14.0.0) (2022-02-08)

## [14.0.0-rc.26](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.25...bitgo@14.0.0-rc.26) (2022-02-07)


### Features

* **core:** add method to aggregate ETH2 BLS shares ([953ddfb](https://github.com/BitGo/BitGoJS/commit/953ddfb92cacb3239ec994979d02481775f88f22))
* **core:** sign consolidate txns ([8aeeb3e](https://github.com/BitGo/BitGoJS/commit/8aeeb3e705aa1720dde1db0d85515364d8141e12))
* enable consolidation support for solana ([1b8fcca](https://github.com/BitGo/BitGoJS/commit/1b8fcca3e6c6ce2125d6027834e50017c34e09a6))
* **statics:** onboard february tokens ([5493311](https://github.com/BitGo/BitGoJS/commit/549331175e3f42925c0c2a45c7c3fc12326c92cd))

## [14.0.0-rc.25](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.24...bitgo@14.0.0-rc.25) (2022-02-04)


### ⚠ BREAKING CHANGES

* **account-lib:** BlsKeyPair is not just a default prv and pub object, instead it has an array of
secretShares and a publicShare which should be merged with the other BLS key pairs to get the common
public key and the private key of each keypair.

BG-35989

### Features

* **account-lib:** add NEAR util ([9bbbb08](https://github.com/BitGo/BitGoJS/commit/9bbbb08595d433106a40733a04dc0d2c83d7a603))
* **account-lib:** create ataInitBuilder to initialize solana associated token account STLX-11958 ([e060add](https://github.com/BitGo/BitGoJS/commit/e060add6cb98e7950e56b6e1a0442b2a7fbe3dca))
* **account-lib:** migrate BLS key pair from @bitgo/bls to @bitgo/bls-dkg lib ([c95877f](https://github.com/BitGo/BitGoJS/commit/c95877fda2201a5d71618ad68ba14cc73308f4f7))
* add custom signing function url to requests ([2a0aca5](https://github.com/BitGo/BitGoJS/commit/2a0aca5123547635ab97d25befd4ef5b4bcc5dc1))
* **blockapis:** add OutputSpends, TransactionStatus queries ([53bd87e](https://github.com/BitGo/BitGoJS/commit/53bd87e2128598e4321654a58e647bab88e82325))
* **core:** add rel prefix to github actions branch list ([0519d66](https://github.com/BitGo/BitGoJS/commit/0519d6686a6cab57a43df2662402adef02837dff))
* **statics:** implement iterator for CoinMap ([a4a2f4b](https://github.com/BitGo/BitGoJS/commit/a4a2f4b830084a136840abbaf3b30fe5852a60e1))
* **utxo-bin:** use prevOutputs, spend status ([9f8bbfb](https://github.com/BitGo/BitGoJS/commit/9f8bbfbe7479e7bfde21532efb64c00379e485bd))


### Bug Fixes

* **core:** client send an objet as memo but memo is treated as a string ([c631daa](https://github.com/BitGo/BitGoJS/commit/c631daae45747960f5f20dc915c4e4503d18b9eb))
* **core:** fix nock body types ([465acf0](https://github.com/BitGo/BitGoJS/commit/465acf00bfa3c36af840cd6956179879b045bd61))
* **core:** update codeowners to remove previous staff ([67b3245](https://github.com/BitGo/BitGoJS/commit/67b3245de1e257f6841c9417bec988c33838fc27))
* **express:** correctly handle failed proxy calls ([d36bf9c](https://github.com/BitGo/BitGoJS/commit/d36bf9c30dc799e087e9b42a4fd30d9ebe407509))
* **express:** pass POST body for proxy requests ([f5113ea](https://github.com/BitGo/BitGoJS/commit/f5113ea07ecfaa265d18a48f32143d3045ac7e27))
* **express:** run prettier on `test/integration/bitgoExpress` ([e105d3a](https://github.com/BitGo/BitGoJS/commit/e105d3aa0054f1ed7428fd1d935ff1eada8d9800))

## [14.0.0-rc.24](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.23...bitgo@14.0.0-rc.24) (2022-01-31)


### Features

* **account-lib:** add NEAR keypair ([8586b10](https://github.com/BitGo/BitGoJS/commit/8586b10f51147f2c9862614ec8eff9d95163a73b))
* **account-lib:** implement a field for transaction material ([42fd74c](https://github.com/BitGo/BitGoJS/commit/42fd74c709e0e726cfc75b38707a08a5483532af))
* **core:** add NEAR core skeleton ([16bc15d](https://github.com/BitGo/BitGoJS/commit/16bc15d5ce80b53c14b54a5cd9faa6fe71912b70))
* **core:** update createAddress to perform hardened derivation ([356dbaa](https://github.com/BitGo/BitGoJS/commit/356dbaa9503e002c5151e1497e0c1c583098b853))
* **core:** update forwarder flags ([670bde5](https://github.com/BitGo/BitGoJS/commit/670bde508bc75520ff540bf78e560f17abbf20b9))
* include feature flag for external signing API ([fedba73](https://github.com/BitGo/BitGoJS/commit/fedba7383214c6183261166c744a377547eaab74)), closes [#BG-38025](https://github.com/BitGo/BitGoJS/issues/BG-38025)
* **statics:** onboard tokens for prime trading ([681c4dd](https://github.com/BitGo/BitGoJS/commit/681c4dd40778ec8a542c7a9125c5d33c6a85c9cc))


### Bug Fixes

* **core:** add flush threshold example ([6048485](https://github.com/BitGo/BitGoJS/commit/6048485fc255e6db8dff581e91bbfbef81aade90))

## [14.0.0-rc.23](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.22...bitgo@14.0.0-rc.23) (2022-01-27)


### Bug Fixes

* **core:** use `@bitgo/blockapis@1.0.0-rc.0` ([7717447](https://github.com/BitGo/BitGoJS/commit/7717447a6598840d7dacbefb070d62f4d0736154))

## [14.0.0-rc.22](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.21...bitgo@14.0.0-rc.22) (2022-01-27)


### Features

* **core:** add support for user-provided custom signing function ([672f1a8](https://github.com/BitGo/BitGoJS/commit/672f1a83f5690a03e36309eaeff19b7daeb13044))


### Bug Fixes

* add `publishConfig` package.json of public packages ([28cf439](https://github.com/BitGo/BitGoJS/commit/28cf439c49a075de7241895374ccce6318792b1c))
* **core:** add missing dep on `@bitgo/blockapis` ([a2cd98e](https://github.com/BitGo/BitGoJS/commit/a2cd98e3ebb65a6f0b243ec5ab1b1840342c309f))
* remove `gitHead` from module package.jsons ([66e9809](https://github.com/BitGo/BitGoJS/commit/66e9809d6a36f03c8a334f9b8bbcfa82aca426b0))

## [14.0.0-rc.21](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.20...bitgo@14.0.0-rc.21) (2022-01-26)


### Features

* **account-lib:** add batch txn builder for DOT ([c259b9d](https://github.com/BitGo/BitGoJS/commit/c259b9d815da67c7e21cda59b53412417d27e3ee))
* **account-lib:** add unnominate for dot staking ([8a1a5e2](https://github.com/BitGo/BitGoJS/commit/8a1a5e26ac453baedeeb44bbdd8ed47e9e7ab6a8))
* add module `@bitgo/blockapis` ([2bc8991](https://github.com/BitGo/BitGoJS/commit/2bc8991df6eabbe5775663f1169e90d599e6b87d))
* **statics:** onboard erc-20 coins in groups 1-3 ([92c184e](https://github.com/BitGo/BitGoJS/commit/92c184e2db02cdf21e8e4265fc0b304a72601b43))
* **utxo-bin:** add package `utxo-bin` ([149f81c](https://github.com/BitGo/BitGoJS/commit/149f81c7452c93c2a0b7c221eb4a9dcd99befafd))
* **utxo-lib:** export type NetworkName ([df27a99](https://github.com/BitGo/BitGoJS/commit/df27a9951edf9a178594a388a353f6933beee053))


### Bug Fixes

* add `publishConfig` package.json of public packages ([195ac13](https://github.com/BitGo/BitGoJS/commit/195ac137d9a8da9c6c6cfe5821738ecc898b6c2c))
* **core:** fix verityTransaction for sol ([ac98a34](https://github.com/BitGo/BitGoJS/commit/ac98a34b9935477a8c3a2a6c24f9eca9ebfd7c0e))
* **statics:** apply prettier to full project ([9ae3e15](https://github.com/BitGo/BitGoJS/commit/9ae3e157a84afebe495bab105fac6fbcfee2b0ee))
* **statics:** update CODEOWNERS ([02b03fe](https://github.com/BitGo/BitGoJS/commit/02b03fe4549cc176731357f328301a9b88ff6c0f))

## [14.0.0-rc.20](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.19...bitgo@14.0.0-rc.20) (2022-01-25)


### Features

* **account-lib:** add deactivate builder ([eeab032](https://github.com/BitGo/BitGoJS/commit/eeab03288a6fd35f4db7f9627f85bfd696e32680))
* **account-lib:** add staking activate builder ([b23e5c3](https://github.com/BitGo/BitGoJS/commit/b23e5c3c7e4900173bbecb02e56ebf61a7a11fb9))
* **account-lib:** add withdraw staking builder ([6a4b9a5](https://github.com/BitGo/BitGoJS/commit/6a4b9a56cfdca3780f83addf077b2e152fc65385))
* **account-lib:** near coin skeleton ([5fda33d](https://github.com/BitGo/BitGoJS/commit/5fda33da57e2037f0b9e2c81b98fe7b5fc2a35e9))
* **statics:** add NEAR config ([61a74c1](https://github.com/BitGo/BitGoJS/commit/61a74c1749de1d9d7c5135451fcc8758efd4037b))
* **statics:** change name to gHDO and gHCN ([0112296](https://github.com/BitGo/BitGoJS/commit/011229645d474bfaf0e7529ac71d31e100285447))


### Bug Fixes

* **account-lib:** fix isValidPublicKey to check for undefined pubKey ([9020a0f](https://github.com/BitGo/BitGoJS/commit/9020a0f26b5681eab2e2081be37862e8e8d3f782))
* **core:** correct type of `allTokens` property on `TransfersOptions` ([401aa09](https://github.com/BitGo/BitGoJS/commit/401aa093121ee7acbc97468e995e1f308830a09a))
* **core:** fix sol send tx ([012d702](https://github.com/BitGo/BitGoJS/commit/012d7023e9fe32d8d7d2aa13cef94dceae176d43))
* **core:** fix verify tx for solana ([0085ddc](https://github.com/BitGo/BitGoJS/commit/0085ddc26644231a3c8a0dcaef18d8b32db3dda9))
* **core:** token transactions does build correctly ([178d4e2](https://github.com/BitGo/BitGoJS/commit/178d4e219df22d42f31b9fcbad6d8f10181a17fa))
* **root:** removed buffer library and fallback from webpack config for account-lib and core ([a5c9fec](https://github.com/BitGo/BitGoJS/commit/a5c9fecd17d0fedced34fad9434eb1f0f36bd0d5))
* **root:** resolve `node-fetch` to version 2.6.7 ([da8e05b](https://github.com/BitGo/BitGoJS/commit/da8e05bfee6c5fc1d3e29166a1f85ecafb704fd3))

## [14.0.0-rc.19](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.18...bitgo@14.0.0-rc.19) (2022-01-19)


### Features

* **core:** support signing single sig dot transactions ([4ab0219](https://github.com/BitGo/BitGoJS/commit/4ab02195c5bf5e478e057a8568674b04f830bf1b))

## [14.0.0-rc.18](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.17...bitgo@14.0.0-rc.18) (2022-01-18)

## [14.0.0-rc.17](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.16...bitgo@14.0.0-rc.17) (2022-01-18)


### Features

* **statics:** wtk token contract update ([eadb5eb](https://github.com/BitGo/BitGoJS/commit/eadb5eb6f51a868411d2253b7525462e0e196f26))

## [14.0.0-rc.16](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.15...bitgo@14.0.0-rc.16) (2022-01-18)


### Bug Fixes

* **core:** fix hbar webpack ([7bc465a](https://github.com/BitGo/BitGoJS/commit/7bc465afca300f7e3eec5af92e9254e820eec555))
* **utxo-lib:** use NU5_BRANCH_ID when parsing zcashTest v4 ([ae2ded6](https://github.com/BitGo/BitGoJS/commit/ae2ded6d35f807409eacd575b8b91f6451cdfdc8))

## [14.0.0-rc.15](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.14...bitgo@14.0.0-rc.15) (2022-01-13)


### Features

* **statics:** update USDC and USDT name and address ([83c9b06](https://github.com/BitGo/BitGoJS/commit/83c9b0684499d0482b99301f74e69ff796123075))


### Bug Fixes

* **account-lib:** remove proxy type from constants STLX-12064 ([82b1d47](https://github.com/BitGo/BitGoJS/commit/82b1d475a7c958d0d7420998e55c603f1a29f214))
* **account-lib:** update dot feeOption jsdoc ([dff22a8](https://github.com/BitGo/BitGoJS/commit/dff22a82012399bb95314ae31cbc52407028375d))
* **root:** resolve `follow-redirects` to version ^1.14.7 ([d81b77f](https://github.com/BitGo/BitGoJS/commit/d81b77f2b8184b18d63b6d504cd33592ee9c8b69))

## [14.0.0-rc.14](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.13...bitgo@14.0.0-rc.14) (2022-01-10)


### Features

* **account-lib:** add key factory for coins ([82be006](https://github.com/BitGo/BitGoJS/commit/82be006dde732cfba53f72aa46c6350d53b80e14))
* **account-lib:** add util factory for coins ([4233e2d](https://github.com/BitGo/BitGoJS/commit/4233e2d05dca961e79b907cb75af81e91c9bc1c9))
* **core:** add AvaxcToken coins in sdk ([8beb7bf](https://github.com/BitGo/BitGoJS/commit/8beb7bf2b52090fc04b43800cc328951a509417d))
* **core:** add Avaxctokens coins in sdk ([9f74b40](https://github.com/BitGo/BitGoJS/commit/9f74b406751044a5ded33b6763ca2df7f125b4dc))
* **statics:** add tokens jan batch 2nd ([0eb6d2c](https://github.com/BitGo/BitGoJS/commit/0eb6d2c7dbfab8ccdd89d81773b207412b96fa03))
* **statics:** update westend metadata ([a057ed5](https://github.com/BitGo/BitGoJS/commit/a057ed51b84819ad455469f29bf1774ed756ffe0))
* **utxo-lib:** add zcash version 450 ([8f9d332](https://github.com/BitGo/BitGoJS/commit/8f9d332e6b7517cb132c7fc749b587c6aadcc201))


### Bug Fixes

* **core:** fix ENS resolution for eth sends ([8ca5d2f](https://github.com/BitGo/BitGoJS/commit/8ca5d2fb6978b62ba1d425f17468ec345fb464ef))
* **core:** removed signingKey capability ([14346fa](https://github.com/BitGo/BitGoJS/commit/14346fae2e5459467cc8c89b1c70a3f17d91cb42))
* **statics:** fix send many memo contract address for prod ([3a1396d](https://github.com/BitGo/BitGoJS/commit/3a1396d17a15737bbc57a9f7803fe7fc2b47e6c5))
* **statics:** update zcash explorer url ([6bfb111](https://github.com/BitGo/BitGoJS/commit/6bfb1117deaaaefe32faf07cdef88cfd869ac16d))

## [14.0.0-rc.13](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.12...bitgo@14.0.0-rc.13) (2022-01-05)


### Features

* **account-lib:** add anonymous proxy txn builder STLX-11137 ([692c062](https://github.com/BitGo/BitGoJS/commit/692c062beb5b8e9df856c1f1cba3829f073b1641))
* **account-lib:** implement validityWindow and sequenceId for Sol ([0677955](https://github.com/BitGo/BitGoJS/commit/06779551b6b21a0f38d809c03a6870c309b83d21))
* **core:** implement verify transaction function for sol ([aeaaf50](https://github.com/BitGo/BitGoJS/commit/aeaaf50577ff6d131654e283f8c23901825736fe))
* **statics:** hot fix address FDT AND FET1 ([153b3b3](https://github.com/BitGo/BitGoJS/commit/153b3b39b4b6b2716fc1f909c9cf5519ee71fec8))
* **statics:** update decimal places for c8p token ([b5604ca](https://github.com/BitGo/BitGoJS/commit/b5604ca1f3af09e61cd9bf28cb16d08b74e06958))


### Bug Fixes

* **account-lib:** changed key validation for Solana ([274af3b](https://github.com/BitGo/BitGoJS/commit/274af3b8cd395f9969224aa2441de558514fbb8a))
* **account-lib:** update static values for dot tests STLX-11678 ([773800e](https://github.com/BitGo/BitGoJS/commit/773800e47e75902b7e30d7bbbc0807f166fc73e9))
* **core:** allow for ENS resolution in WP to change recipient addr(eth) ([8d8a9e5](https://github.com/BitGo/BitGoJS/commit/8d8a9e589cff5ee717b2dea9a22ddc2c7b75e26d))

## [14.0.0-rc.12](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.11...bitgo@14.0.0-rc.12) (2022-01-04)


### Features

* **account-lib:** solana - implement derive address function ([3dbdf6c](https://github.com/BitGo/BitGoJS/commit/3dbdf6cdc3a89883d86ba7237e958cc3bd475d58))
* **c8p token:** update decimal places ([85d7cfe](https://github.com/BitGo/BitGoJS/commit/85d7cfef5a40d4b818b62e79daff7c38965b961f))
* **statics:** onboarding  jan batch ([3753850](https://github.com/BitGo/BitGoJS/commit/375385035ce30b6202576a79e229355e49e3ee93))
* **utxo-lib:** add support for Zcash version 5 "NU5" ([5d2c383](https://github.com/BitGo/BitGoJS/commit/5d2c383454383725bb57b7e676851cdfcba86521))

## [14.0.0-rc.11](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.10...bitgo@14.0.0-rc.11) (2021-12-23)


### Features

* **account-lib:** export Solana builders and transaction ([597734f](https://github.com/BitGo/BitGoJS/commit/597734f364fe575f4cd361daaf2257551155ef54))
* add TSS key generation and signing functions ([3d1dce5](https://github.com/BitGo/BitGoJS/commit/3d1dce5e2c225acd08d5018f53c43727eba19632))


### Bug Fixes

* **account-lib:** fix postcondition for send many builder ([7c3c70f](https://github.com/BitGo/BitGoJS/commit/7c3c70fa7d01586c3e95583f45c02f69ff8411e1))
* **statics:** update deprecated explorer url ([391219a](https://github.com/BitGo/BitGoJS/commit/391219a37806d08ae56b52a84d2c3e69938140cb))
* **statics:** update deprecated explorer url for BCH ([1bfaf3a](https://github.com/BitGo/BitGoJS/commit/1bfaf3a950a3c7c2dc342146b174629bc8bf420c))
* **unspents:** add `readonly` modifier to Dimensions fields ([4cc973e](https://github.com/BitGo/BitGoJS/commit/4cc973e345b63cdde57c0bef4a53c0a02de6e625))
* **unspents:** fix nInputs ([e5e54e7](https://github.com/BitGo/BitGoJS/commit/e5e54e796995254d479f39e044635169547ad69b))

## [14.0.0-rc.10](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.9...bitgo@14.0.0-rc.10) (2021-12-21)


### Features

* **statics:** coin feature custody ([448b45c](https://github.com/BitGo/BitGoJS/commit/448b45c072be055a1cf13974d0fc171a9a4e7350))


### Bug Fixes

* **core:** correctly pass `pubs` ([159f6f1](https://github.com/BitGo/BitGoJS/commit/159f6f1116bc637808f02ec9349d5d93b5f3163e))

## [14.0.0-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.8...bitgo@14.0.0-rc.9) (2021-12-18)


### Features

* **account-lib:** add getTxHash to dot utils ([3798123](https://github.com/BitGo/BitGoJS/commit/379812358f523227627dd45b657b3dc0eb7067af))

## [14.0.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.7...bitgo@14.0.0-rc.8) (2021-12-16)


### Features

* **account-lib:** add send-many in Account-Lib ([974a43e](https://github.com/BitGo/BitGoJS/commit/974a43e2ecd3783a06c2ee00e06928d7cfb6f6cb))
* **account-lib:** add unit test for avaxToken ([699d542](https://github.com/BitGo/BitGoJS/commit/699d542307cc61e2bc522842868ecee99bad0e40))
* **account-lib:** add utils to validate tx and block hash ([e59cb7c](https://github.com/BitGo/BitGoJS/commit/e59cb7c03f31eb9c1c7d5a3b35eab87972d324cc))
* **core:** enhanced address verification in sdk ([fa951d5](https://github.com/BitGo/BitGoJS/commit/fa951d5d6b4bf1ee914f2a74a94a7c92ba80d0e6))
* **statics:** add new tokens ERC20 ([4306190](https://github.com/BitGo/BitGoJS/commit/4306190a4d0a6f0dbfee413fc9bf88d0f431dde1))


### Bug Fixes

* **account-lib:** add more checks and tests ([423bc26](https://github.com/BitGo/BitGoJS/commit/423bc26196d0fcb9f5f8cdf5110f446b804a051d))
* **account-lib:** fix solana isValidAddress ([0f1cd93](https://github.com/BitGo/BitGoJS/commit/0f1cd93dd30d5cc7313201f4bf2ec9f657022465))
* **core:** add base `explainTransaction` method ([4731af3](https://github.com/BitGo/BitGoJS/commit/4731af36cb4992843c4ecfde77395098afc5a10d))

## [14.0.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.6...bitgo@14.0.0-rc.7) (2021-12-15)


### ⚠ BREAKING CHANGES

* **utxo-lib:** * The namespace `utxolib.coins` is removed

Issue: BG-40432

### Features

* **statics:** new tokens being added ([1491060](https://github.com/BitGo/BitGoJS/commit/1491060833c9c9bba2934191fa532a563999340a))
* **utxo-lib:** add addressFormats ([c1bd457](https://github.com/BitGo/BitGoJS/commit/c1bd45796e0bae9c2fdd4964f2771812147f14d3))


### Code Refactoring

* **utxo-lib:** improve `network` exports ([d1d6091](https://github.com/BitGo/BitGoJS/commit/d1d6091186800fa8aad0c906101ad266ebebe3ce))

## [14.0.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.5...bitgo@14.0.0-rc.6) (2021-12-14)


### Bug Fixes

* **core:** restore `async` on `explainTransaction` in `AbstractUtxoCoin` ([d8d7a0a](https://github.com/BitGo/BitGoJS/commit/d8d7a0af7f1d7c613bd02c3b8e63cc9b028bf96a))

## [14.0.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.4...bitgo@14.0.0-rc.5) (2021-12-14)


### ⚠ BREAKING CHANGES

* **utxo-lib:** Removes these methods from AbstractUtxoCoin:

* `supportsP2sh()`
* `supportsP2shP2wsh()`
* `supportsP2wsh()`
* `supportsP2tr()`

Use `supportsAddressType(ScriptType2Of3)` instead.

Issue: BG-38773

### Features

* **core:** added ETH V1 examples ([32153d2](https://github.com/BitGo/BitGoJS/commit/32153d252765f3aedb1802d456886920bc75c5db))
* **dot:** implement signMessage ([f0169d8](https://github.com/BitGo/BitGoJS/commit/f0169d8f03c9aee4ddb61998a36beba54dcdb063))
* **statics:** add arc20token and implementation ([ec6cf30](https://github.com/BitGo/BitGoJS/commit/ec6cf30349b6bf21af60bb37aa3dc2962a96a12a))
* **utxo-lib:** add `bitgo/wallet` package ([78aff6c](https://github.com/BitGo/BitGoJS/commit/78aff6c1260266ab4c7e1b84d07177e5237d2eaa))
* **utxo-lib:** add `wallet/chains` ([0439a0d](https://github.com/BitGo/BitGoJS/commit/0439a0d4ffe4a15a9932ed70f98cc5745cc6526f))
* **utxo-lib:** add isSupportedScriptType(network, scriptType) ([ae53ab8](https://github.com/BitGo/BitGoJS/commit/ae53ab868c2bc9c9a64d628c5538861c08abef6f))
* **utxo-lib:** support import from `src/bitgo` ([f5ca9dd](https://github.com/BitGo/BitGoJS/commit/f5ca9dde4c9435d483791fd6075f4cde41931f8f))
* **utxo-lib:** use `ChainCode` for `WalletUnspent['chain']` ([6c9c73b](https://github.com/BitGo/BitGoJS/commit/6c9c73b13a32f847912d944748c2ef67fca913fe))


### Bug Fixes

* **account-lib:** update validitiyWindow dot validation ([47d35ff](https://github.com/BitGo/BitGoJS/commit/47d35ffc23deb143e7c32b2d180fdbe584698299))
* **core:** don't require `pubs` param to `explainTransaction` ([18ad557](https://github.com/BitGo/BitGoJS/commit/18ad557759c1f32732f69bb9c67445a5a47aab1d))
* **core:** fix failing tests after coroutine removal in test code ([6b8bbe2](https://github.com/BitGo/BitGoJS/commit/6b8bbe2762e97aafa93e885742030a01c56f61d0))
* **core:** fix token unit test which expected Bluebird promise ([9c39873](https://github.com/BitGo/BitGoJS/commit/9c3987335a1371a4c5f579fca5caa875358563ee))
* **core:** remove coroutines from v2/coins/dot and fix tests ([9ea55e8](https://github.com/BitGo/BitGoJS/commit/9ea55e814e825f077832d3772fd784e1d697573b))

## [14.0.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.3...bitgo@14.0.0-rc.4) (2021-12-08)


### Features

* **account-lib:** dot private key fix STLX-10448 ([08cc8f5](https://github.com/BitGo/BitGoJS/commit/08cc8f5e14fc5180f3d952e2b02dd6e685c288c0))
* **core:** allow alphanumeric memoid for eos ([ab4d3f2](https://github.com/BitGo/BitGoJS/commit/ab4d3f2ce838a8c80b9d6a9cbe5c7c91fc184854))
* **sol:** implement parse transaction ([5a1f262](https://github.com/BitGo/BitGoJS/commit/5a1f262df2f9c4b250fc42d44626e59a39ad3b70))
* **statics:** onboarding BXXV1 token ([d05ec73](https://github.com/BitGo/BitGoJS/commit/d05ec73078c101dfd1fab48bf23511900b4c860f))


### Bug Fixes

* **core:** fix incorrect return type on presignTransaction ([b9dc27c](https://github.com/BitGo/BitGoJS/commit/b9dc27c0d8550b8d59066151f125c9f8958ef0a1))
* **core:** fix tests which were broken after coroutine removal ([deb6698](https://github.com/BitGo/BitGoJS/commit/deb66982cd4c898665399fbd5dd8288d74502331))
* **hbar-validateaddress:** add validation for hedera addresses fix case where hex address were valid ([eb7c1eb](https://github.com/BitGo/BitGoJS/commit/eb7c1eb02d973acfa97cfd613816b365ea29d567))

## [14.0.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.2...bitgo@14.0.0-rc.3) (2021-12-07)


### Features

* **account-lib:** dot explain transaction ([97a2f21](https://github.com/BitGo/BitGoJS/commit/97a2f21251f81ca2b9113ffabc2dd2ade7410ff4))
* **core:** add support for p2tr recoveries ([286469f](https://github.com/BitGo/BitGoJS/commit/286469ffe9ad6868b926a63bc9c4cb1a55ae11d8))
* **core:** add verifyWalletTransactionWithUnspents ([93e3292](https://github.com/BitGo/BitGoJS/commit/93e3292276c203b82e264ac19719699d5b3b6285))
* **sol:** address fee and id in explain transaction ([c494568](https://github.com/BitGo/BitGoJS/commit/c494568ceefa48b956fca6bc90bfdf707bf1b568))
* **statics:** fix address ([97d80a0](https://github.com/BitGo/BitGoJS/commit/97d80a090d2a25fbeabaedc244f537d7071d3830))
* **statics:** fix BXX address ([fa12160](https://github.com/BitGo/BitGoJS/commit/fa12160625c24161edf2ecbcafadf8cdd776408f))
* **utxo-lib:** add verifySignatureWithPublicKeys ([4682727](https://github.com/BitGo/BitGoJS/commit/46827273ab457c4073cd468d9a33c39b128234a3))
* **utxo:** accept txBuilder in signAndVerifyWalletTransaction ([61d8335](https://github.com/BitGo/BitGoJS/commit/61d8335c527615b6f80d57eed6ce7ffadf985d61))


### Bug Fixes

* **core:** use signAndVerifyWalletTransaction ([3811b42](https://github.com/BitGo/BitGoJS/commit/3811b42a6866fe3e3f89b314a2287bc80a0bd408))
* **core:** use wallet keys in explainTransaction ([2c3b494](https://github.com/BitGo/BitGoJS/commit/2c3b494792ae52e4e2f61c0ba0f59cab955ce2e7))

## [14.0.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.1...bitgo@14.0.0-rc.2) (2021-12-03)


### Features

* **core:** add class WalletKeys ([4417bb0](https://github.com/BitGo/BitGoJS/commit/4417bb0de33c2233ed640a472fb6abb0ab93c522))
* **core:** add parseOutputId to utxo/unspent.ts ([ec77d11](https://github.com/BitGo/BitGoJS/commit/ec77d1172d7d8f6f93b415f6c280397e36f57ace))
* **core:** implement message signing ([0c2ba7e](https://github.com/BitGo/BitGoJS/commit/0c2ba7e8bfc89e8acbc5b8d6d0c50e2aa7f1905b))
* **sol:** initial implementation of explain transaction ([3e27360](https://github.com/BitGo/BitGoJS/commit/3e273608d70edf75faef4d62c59e7e1486fb3739))


### Bug Fixes

* **core:** implement explainTransaction for p2tr ([8ef2d6a](https://github.com/BitGo/BitGoJS/commit/8ef2d6ac44738a5f5cd23dc29f244e84deb14727))
* **ltc:** update block explorer link for ltc ([1a501da](https://github.com/BitGo/BitGoJS/commit/1a501da07df6796e7215c20800bcb865270b13a6))
* **sol:** fix deserializing signed sol transaction ([1da611a](https://github.com/BitGo/BitGoJS/commit/1da611ac9f830ed4303d4425a0391c4bc13c9f8c))

## [14.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0-rc.0...bitgo@14.0.0-rc.1) (2021-12-02)


### Features

* **account-lib:** dot optimization ([82dd145](https://github.com/BitGo/BitGoJS/commit/82dd1457793624e4c9ba1b880b5bfe4fdf19c740))
* **core:** dot core sign tx ([4691678](https://github.com/BitGo/BitGoJS/commit/469167876a08928924a10b9406bc3a703eb19b51))
* **core:** dot review fixes ([4593a7a](https://github.com/BitGo/BitGoJS/commit/4593a7a5a01dada29d6bcab28587ba24fac187c5))
* **core:** implement transaction signing methods ([739e72f](https://github.com/BitGo/BitGoJS/commit/739e72f30c101b9fe2c03f9b46ee67c854597a02))


### Bug Fixes

* **account-lib:** fix types in algo utils and typos ([415225c](https://github.com/BitGo/BitGoJS/commit/415225ceb3ad95f63b98d4235f0dbc975dbc83e1))
* **sol:** get signature data from a Sol transaction ([5249a6e](https://github.com/BitGo/BitGoJS/commit/5249a6e5da74ceb43a2b47ca439495d62c280f07))
* **statics:** inherit BitcoinTestnet from Testnet ([246135c](https://github.com/BitGo/BitGoJS/commit/246135c4a4b78c9092cee8d08d5a79b8bf737a75))

## [14.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@13.2.0-rc.0...bitgo@14.0.0-rc.0) (2021-12-01)


### ⚠ BREAKING CHANGES

* **core:** * `AbstractUtxoCoin.prototype.signTransaction()` now requires the
  parameter `pubs` (wallet xpub triple)
* `Wallet.prototype.signTransaction()` drops properties
  `userKeychain`/`backupKeychain`/`bitgoKeychain`. It accepts the
  optional parameter `pubs` instead (wallet xpub triple).

Issue: BG-38773

### Features

* **account-lib:** dot fee error fix ([1a91cae](https://github.com/BitGo/BitGoJS/commit/1a91caee176357e69d4dd5e14830a7402a7bf204))
* **account-lib:** dot final review fixes ([520ed78](https://github.com/BitGo/BitGoJS/commit/520ed78d0240469d754633d536c6ef5bab4b61e7))
* **account-lib:** implement keypair, transaction, builder and builder factory for solana ([c8493f6](https://github.com/BitGo/BitGoJS/commit/c8493f6b19d3aa01eb03ead7c514b79a0b58161b))
* **core:** dot core helpers ([161d66a](https://github.com/BitGo/BitGoJS/commit/161d66a362b3e4f64a90fdf30ef97db9be9b7f0e))
* **core:** fix version of core dependecies ([7af586a](https://github.com/BitGo/BitGoJS/commit/7af586a7f6c4bdb261492a09ace651bdfb16f599))
* **statics:** add TOken MVI and WLUNA ([dbf3b0b](https://github.com/BitGo/BitGoJS/commit/dbf3b0b4cd92d7d0e2d8fda370ccb9a4a001d26a))
* **unspents:** add p2tr tests ([8a0f084](https://github.com/BitGo/BitGoJS/commit/8a0f0841eabd07478b6f40129e15e83954743fc9))
* **utxo-lib:** add scriptPathLevel to ParsedSignatureScriptTaproot ([27cf563](https://github.com/BitGo/BitGoJS/commit/27cf563f7121f7306f39c9e3b3477c70c485f69d))


### Bug Fixes

* **account-lib:** fix CSPR address validation for encoding change ([91b1ba3](https://github.com/BitGo/BitGoJS/commit/91b1ba35cfa86560aae6c0e7ec2d25b7c969b891))
* **core:** always fetch full key triple for signing ([3af1ab2](https://github.com/BitGo/BitGoJS/commit/3af1ab238a5e491f1503645f09c696a4785950aa))
* **core:** break cyclical dependency ([0d00616](https://github.com/BitGo/BitGoJS/commit/0d00616cde5e1b7945410e4f45158f2071032163))
* **core:** remove custom getTxInfoFromExplorer in LTC ([491358f](https://github.com/BitGo/BitGoJS/commit/491358fa0e8d73387a8a47b93a4c9efb60d52e6f))
* **statics:** fix BitcoinGoldTestnet derivation ([dfd097c](https://github.com/BitGo/BitGoJS/commit/dfd097c76ac2f1983af9bb02f6b15cb9d491b9ee))
* **statics:** use `utxolibName` instead of redefining constants ([b54c30a](https://github.com/BitGo/BitGoJS/commit/b54c30ae8e88dfe9701237a3316edf5f6c71483c))
* **utxo-lib:** do not throw on unsigned inputs ([69dddb6](https://github.com/BitGo/BitGoJS/commit/69dddb6ae077c6093d048fe91b0521e74ab5055e))
* **utxo-lib:** improve ParsedSignatureScriptTaproot ([b809bb2](https://github.com/BitGo/BitGoJS/commit/b809bb2779a2e498fd0ba76437a198ad20ec1536))


### Reverts

* Revert "Revert "chore(node): update node version"" ([37fffa6](https://github.com/BitGo/BitGoJS/commit/37fffa68d8e450b20132a90a09a10f510d77363d))
* Revert "Revert "feat(account-lib): dot implementation"" ([0519e38](https://github.com/BitGo/BitGoJS/commit/0519e381222f8d5b8841114bdc0a34ec79c73950))


### Code Refactoring

* **core:** add, use signAndVerifyWalletTransaction for utxo ([1070021](https://github.com/BitGo/BitGoJS/commit/1070021e38720824e0564dc729f25e273f3ea754))

## [13.2.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0...bitgo@13.2.0-rc.0) (2021-11-23)


### Features

* **account-lib:** add skeleton for solana ([660d244](https://github.com/BitGo/BitGoJS/commit/660d24472d73ab30f2e40006692319ab774578df))
* **account-lib:** adding unit test for eth2 staking contract ([3fb5116](https://github.com/BitGo/BitGoJS/commit/3fb51166d3064ae806ffd75390a6328313d5278c))
* **account-lib:** implement basic util methods for solana ([6fb3746](https://github.com/BitGo/BitGoJS/commit/6fb37465fa4be552dcda0f63729214339d8bb913))
* **account-lib:** updating after comments ([13726e8](https://github.com/BitGo/BitGoJS/commit/13726e81920af88b4cc40a6e5bed39823d62e10a))
* **core:** add amount to refund eos txn ([f3e5a67](https://github.com/BitGo/BitGoJS/commit/f3e5a676112252b4ab746f2ed0678e9bf316992c))
* **core:** add send support for XLM muxed addresses ([fdaf489](https://github.com/BitGo/BitGoJS/commit/fdaf489e7fa26b6963b5157c59ecdffff3bcde4f))
* **core:** add signWalletTransactionWithUnspent ([834c505](https://github.com/BitGo/BitGoJS/commit/834c50586b37a864b54a0ac0f291980b6ec8191e))
* **core:** improve type signatures for recovery methods ([106a31d](https://github.com/BitGo/BitGoJS/commit/106a31db4cae439356fd3d6fcdb7f4d15166bfe3))
* **statics:** dot ignore coin init ([40b9015](https://github.com/BitGo/BitGoJS/commit/40b9015c262165e9d9d9f92f157964d60b3fe4d0))
* **statics:** dot statics addition ([60a0ecd](https://github.com/BitGo/BitGoJS/commit/60a0ecd008246706793d643078a979cf0497e68c))
* **statics:** polkadot unit tests and exporer url ([1842a1f](https://github.com/BitGo/BitGoJS/commit/1842a1f98c3f8ee9057469d417a8da70889bddd0))
* **statics:** update Token Gog ([b3dde20](https://github.com/BitGo/BitGoJS/commit/b3dde20d5fbc2e768f4bfc23fad949e6dfdd7005))
* **unspents:** use `parsed.scriptType` parameter in fromInput ([84dd467](https://github.com/BitGo/BitGoJS/commit/84dd4670aaadb11fd966d4d3637f02b54d2c5ffc))
* **utxo-lib:** add property `scriptType` to ParsedSignatureScript ([c0b678f](https://github.com/BitGo/BitGoJS/commit/c0b678f2b28cf81e41399902a6bdb5e1592c4e3a))


### Bug Fixes

* exclude ripple-address-codec 4.2 ([8178095](https://github.com/BitGo/BitGoJS/commit/8178095b9e672ea3df0f05f974083fac8f56a31f))
* **express:** enable tezos consolidations route in express ([fdf2c8a](https://github.com/BitGo/BitGoJS/commit/fdf2c8a8a8c0503728825ebaa2b16f7a1e5fec70))
* **lumina:** update full name for rbtc ([4bf0098](https://github.com/BitGo/BitGoJS/commit/4bf0098efd6e0ce5f2e9a70b680e64ec7b031235))
* **statics:** ensure UnderlyingAssets values are unique ([d297246](https://github.com/BitGo/BitGoJS/commit/d2972468cf90c0166a2ae3dd49e58da20dac1f1a))
* **tltc:** update block explorer link for tltc ([7323ccf](https://github.com/BitGo/BitGoJS/commit/7323ccf8aa2e0a2ced76f5218db20b25bd0658fb))


### Reverts

* Revert "chore(node): update node version" ([0998f1d](https://github.com/BitGo/BitGoJS/commit/0998f1d95e9d1570e17734d2c145760bfd0647da))

## [13.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.6...bitgo@13.1.0) (2021-11-12)

## [13.1.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.5...bitgo@13.1.0-rc.6) (2021-11-11)


### Features

* **core:** add core skeleton for solana ([2269db4](https://github.com/BitGo/BitGoJS/commit/2269db4ada70549df295002f652838ffaa647938))
* **stx:** remove 0 in memo ([7f5d531](https://github.com/BitGo/BitGoJS/commit/7f5d53159a6f54760799fb36d776f541c29d765e))

## [13.1.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.4...bitgo@13.1.0-rc.5) (2021-11-10)


### Features

* **statics:** add testnet tokens ([62c3273](https://github.com/BitGo/BitGoJS/commit/62c3273fa769f26b1304d9a7078d21308c81a02a))
* **statics:** define coin sol in statics ([619d359](https://github.com/BitGo/BitGoJS/commit/619d359bebcbcca4cac6bf6a801eb89feb0b5997))
* **statics:** new tokens ([bbdf990](https://github.com/BitGo/BitGoJS/commit/bbdf990b660499333fdbf3b895c34137f2ab7298))
* **unspents:** classify p2tr script path sigs ([28d6860](https://github.com/BitGo/BitGoJS/commit/28d6860e1beedf0dd2ba0bb708530fd9032071fe))

## [13.1.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.3...bitgo@13.1.0-rc.4) (2021-11-09)


### Features

* **account-lib:** initial setup ([63be9dd](https://github.com/BitGo/BitGoJS/commit/63be9dd76bef92423b41c57d628b4e093fa5e2cc))


### Bug Fixes

* **core:** get appropriate signing keys for all signing calls ([1a4d60c](https://github.com/BitGo/BitGoJS/commit/1a4d60cdd2b63f8ffaf796c514eeeb4aeb8e7710))
* **core:** load all keychains for taproot signing ([1e34120](https://github.com/BitGo/BitGoJS/commit/1e34120de798e2597bf6ead6e661c3c2301cf824))

## [13.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.2...bitgo@13.1.0-rc.3) (2021-11-09)


### Features

* **core:** improve type signature for Unspent ([e0dfd6f](https://github.com/BitGo/BitGoJS/commit/e0dfd6f862ec5cdeab29763348a4430a4a837e0c))
* **utxo-lib:** add support for PrevOutput[] in TransactionBuilder ([cdf1899](https://github.com/BitGo/BitGoJS/commit/cdf1899da3db97e6229e23373e1921b4634f44cf))


### Bug Fixes

* **core:** fix default sigHash for p2tr ([595d957](https://github.com/BitGo/BitGoJS/commit/595d957f61f3d10ba78219c68fa2b5a8952c6323))
* **core:** repair replay protection input signing ([8c6b069](https://github.com/BitGo/BitGoJS/commit/8c6b069ddfcdc71a9fb8477ec95cd159cb2f8dc1))
* **unspents:** use latest rc as version instead of 2.3.0 ([b0ae190](https://github.com/BitGo/BitGoJS/commit/b0ae190b955ab25b7c33236f7f81861008b8f4df))
* **utxo-lib:** fix setConsensusBranchId ([4efa636](https://github.com/BitGo/BitGoJS/commit/4efa63670ae4e1bf17895b85c8559df33ac319ab))


### Reverts

* Revert "chore(core): remove insecure modules from webpack" ([23143ca](https://github.com/BitGo/BitGoJS/commit/23143cac90e247f7f90286485cae7e5e741190e6))

## [13.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.1...bitgo@13.1.0-rc.2) (2021-11-09)


### Features

* add unspents module from BitGo/unspents ([47acb1e](https://github.com/BitGo/BitGoJS/commit/47acb1eff7f00cadde40eb480c7c19342ee126e8))
* **core:** add fixture-based parameteric utxo tests ([444888f](https://github.com/BitGo/BitGoJS/commit/444888f9f0ba5a5ec5d6ed941c968cf29efa8e52))
* **core:** add supportsAddressChain(), supportsAddressType() ([89cb98f](https://github.com/BitGo/BitGoJS/commit/89cb98f6a9dbe9801df6feb238d33e5659d69243))
* **core:** use scriptTypeForChain in abstractUtxoCoin ([4d675cc](https://github.com/BitGo/BitGoJS/commit/4d675ccdebb57a793468cb891b180b2db5d6a938))
* **utxo-lib:** add scriptTypeForChain() ([e11cabe](https://github.com/BitGo/BitGoJS/commit/e11cabe06ef98311270131462142d78f13c73063))


### Bug Fixes

* **core:** disable p2tr for btg ([cc70f26](https://github.com/BitGo/BitGoJS/commit/cc70f260035268ed0707e3c31be5d4ac1afa4046))
* **core:** fix memoid check for eos txn ([145bea7](https://github.com/BitGo/BitGoJS/commit/145bea753da193fa17c7351a4fa46f2b529063b0))
* **core:** improve GenerateAddressOptions type ([b0dbb6a](https://github.com/BitGo/BitGoJS/commit/b0dbb6aea5076afbc801d25614298166c61cc708))
* **unspents:** fix package.json ([7edf5fe](https://github.com/BitGo/BitGoJS/commit/7edf5fe71f9b844947378e154ea5ba48b70806ed))

## [13.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@13.1.0-rc.0...bitgo@13.1.0-rc.1) (2021-11-05)


### Features

* add support for generating p2tr addresses ([2cd462c](https://github.com/BitGo/BitGoJS/commit/2cd462cb7b13aa2b9c6b09e667abe128c1c9262f))
* **core:** create wallet with eip1559 ([3cfc343](https://github.com/BitGo/BitGoJS/commit/3cfc343ade54bb25a2b318adc2b4c94f3b78ca46))


### Bug Fixes

* **core:** sign multi-input p2tr script path txs ([885a91f](https://github.com/BitGo/BitGoJS/commit/885a91fe410dcff16e1f771cdc43ad78d2384691))

## [13.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.10...bitgo@13.1.0-rc.0) (2021-11-04)


### Features

* **core:** add support for p2tr script path sign ([99b0453](https://github.com/BitGo/BitGoJS/commit/99b04535b57703ca37cf2dfc0553de03f9a51c51))
* **core:** add unspent address check ([0bb42c2](https://github.com/BitGo/BitGoJS/commit/0bb42c205e28715a0e43ebbb374e61528db2aee2))

### [13.0.2-rc.10](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.9...bitgo@13.0.2-rc.10) (2021-11-04)


### Features

* **utxo-lib:** add ParsedSignatureScriptTaproot ([206c860](https://github.com/BitGo/BitGoJS/commit/206c860a98fa6393399a8d9d56cee63d9dbc5c72))
* **utxo-lib:** add scriptType argument for getDefaultSigHash ([87d5b7f](https://github.com/BitGo/BitGoJS/commit/87d5b7f521bffaf76885ab76c83be427cb6811be))
* **utxo-lib:** add signInput2Of3(), signInputP2shP2pk() ([e3927c0](https://github.com/BitGo/BitGoJS/commit/e3927c010bae3e8e142da15b2975493768135a3e))
* **utxo-lib:** add support for p2tr in signInput2Of3 ([7890854](https://github.com/BitGo/BitGoJS/commit/78908547f27ab52baa4f6e7c5d5561ecaf422863))
* **utxo-lib:** implement parseSignatureScript for p2tr ([d600c42](https://github.com/BitGo/BitGoJS/commit/d600c42a0cca9163b5a6611e7e9fd4d7fd995245))
* **utxo-lib:** improve p2tr readability, types ([81faf11](https://github.com/BitGo/BitGoJS/commit/81faf110d818f648796ca4c1d078b71149577d69))
* **utxo-lib:** support schnorr signature verification ([6e24fd6](https://github.com/BitGo/BitGoJS/commit/6e24fd621a4d1a0a87a1f9ecaab61ce514cad857))
* **utxo:** update createTaprootScript2of3 ([31bb3ed](https://github.com/BitGo/BitGoJS/commit/31bb3edfb2046daabeea14587cf7735c4c383783))


### Bug Fixes

* **eos:** fix deserialize transaction with OVC ([b4d8821](https://github.com/BitGo/BitGoJS/commit/b4d8821773e182560e206ffc48cde2d5e5d640b3))
* **utxo-lib:** remove debugger ([ac6e7ed](https://github.com/BitGo/BitGoJS/commit/ac6e7edbd8f28fc6afae7bc28dae2f2754d3e0d6))
* **xrp:** incorrect types for ledgerSequenceDelta ([03c2860](https://github.com/BitGo/BitGoJS/commit/03c28605c4d5a141203e9d247200778ddb19899c))

### [13.0.2-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.8...bitgo@13.0.2-rc.9) (2021-11-02)


### Features

* **account-lib:** addition txType on account-lib ([8046424](https://github.com/BitGo/BitGoJS/commit/80464248402815413dacc2aa4095da72141c7fc3))

### [13.0.2-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.7...bitgo@13.0.2-rc.8) (2021-11-02)

### [13.0.2-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.6...bitgo@13.0.2-rc.7) (2021-11-02)


### Features

* **core:** add eos explain refund txn ([d1231c0](https://github.com/BitGo/BitGoJS/commit/d1231c0b98f6d340790cfed5352893b5867d78b8))
* **core:** explain unstake eos transaction ([a09501d](https://github.com/BitGo/BitGoJS/commit/a09501dd9cb5dc5f2b943c663c5c001299040099))
* **defi:** add support for building, signing and sending meta transactions ([c1833cd](https://github.com/BitGo/BitGoJS/commit/c1833cd4568affec14886893afe43cc4f5132d76))
* **statics:** define coin sol in statics ([7d98009](https://github.com/BitGo/BitGoJS/commit/7d9800956bb10c14b2c377566ef8b3343a79b11c))


### Bug Fixes

* **account-lib:** fix test ([31763a1](https://github.com/BitGo/BitGoJS/commit/31763a1ae3183e0b908427fa9b67b2350e76cbe3))
* **eos:** fix incorrect explorerUrl for teos ([3a5914d](https://github.com/BitGo/BitGoJS/commit/3a5914dab2427c9924c8b332c4189a98d10a4dbd))
* **eos:** fix issue verifying EOS transactions ([79dd073](https://github.com/BitGo/BitGoJS/commit/79dd0736c999bbeeaa663f3054769ff86c1f1ca7))
* **xrp:** fix incorrect explorerUrl for txrp ([67f9fbf](https://github.com/BitGo/BitGoJS/commit/67f9fbf16476dbd5f59014647ee47d16c56f4064))

### [13.0.2-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.5...bitgo@13.0.2-rc.6) (2021-10-26)


### Features

* **account-lib and core:** fix commets  and refactor ([d1f6859](https://github.com/BitGo/BitGoJS/commit/d1f6859ee81d2997bb11810405b577f33729c5e4))
* **statics:** add  new tokens ([805d911](https://github.com/BitGo/BitGoJS/commit/805d9111c08f8ce771f3ca02020ca92472b9d889))


### Bug Fixes

* **account-lib:** eip1559 transaction builder deserialization ([32a3151](https://github.com/BitGo/BitGoJS/commit/32a31518cf1ffcddad5225baa7073b62e4779280))
* **core:** improve error response string creation ([43e10e3](https://github.com/BitGo/BitGoJS/commit/43e10e3490d0d2196d5f5a7cd1792248fe299256))
* **express:** add error logs in tx signing fns ([dc22bae](https://github.com/BitGo/BitGoJS/commit/dc22bae196b47a2a531e9bdc579046d9d6c62d17))
* **express:** always use bitgo object http methods to proxy requests ([5153a96](https://github.com/BitGo/BitGoJS/commit/5153a9637725bac6b3c36888f21ca44e1ac21da6))

### [13.0.2-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.4...bitgo@13.0.2-rc.5) (2021-10-25)


### Features

* **core:** added closeReminderTo into whitelist for cold enable token tx ([c7b725b](https://github.com/BitGo/BitGoJS/commit/c7b725b73681a74e1f3abcf1341c2fb5469b53e4))


### Bug Fixes

* **algo:** invalid signature on create wallet (bg-38048) ([c7071cc](https://github.com/BitGo/BitGoJS/commit/c7071ccbbbe1d6889cd912242addbe37c04fb0c7))
* **codeowners:** add eth-team to codeowners ([dd84a05](https://github.com/BitGo/BitGoJS/commit/dd84a0548dcebe93a9c68b7d9d13bee20e547911))

### [13.0.2-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.3...bitgo@13.0.2-rc.4) (2021-10-22)


### Bug Fixes

* **eth-lhf:** set default hf to lhf if lhf params present ([06a9f7b](https://github.com/BitGo/BitGoJS/commit/06a9f7b03798df4a957a28cf23174929fbdc2f35))

### [13.0.2-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.2...bitgo@13.0.2-rc.3) (2021-10-22)


### Features

* **utxo-lib:** support p2shP2pk inputs ([f034ead](https://github.com/BitGo/BitGoJS/commit/f034ead6d4ca5d2a11bcd7c1c7042e6de5dd04de))


### Bug Fixes

* **core:** implement verify transaction for eos ([8cd3051](https://github.com/BitGo/BitGoJS/commit/8cd3051465cd013a22424a9708419dd4e2f9f3ff))

### [13.0.2-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.1...bitgo@13.0.2-rc.2) (2021-10-20)


### Features

* **account-lib:** add USDT USDC as testnet tokens ([f4d372b](https://github.com/BitGo/BitGoJS/commit/f4d372b3cdccc68aa9ce5e2c35b1cced127b6145))


### Bug Fixes

* **algo:** support for signing unsigned keyreg transaction (bg-37892) ([ffdfdf2](https://github.com/BitGo/BitGoJS/commit/ffdfdf24085f5d1b2fba262d7ac5bcfa5761126f))
* **core:** update `vm2` by uninstalling/reinstalling `superagent-proxy` ([66f4ad3](https://github.com/BitGo/BitGoJS/commit/66f4ad3c8bcec0649cde34e724945f4076e431dd))

### [13.0.2-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.2-rc.0...bitgo@13.0.2-rc.1) (2021-10-19)


### Features

* add github actions CI workflow ([e90bef1](https://github.com/BitGo/BitGoJS/commit/e90bef1c3b646d81b962bc92bf63c97fd286cb64))
* add support for node 16 and add to test matrix ([9fab886](https://github.com/BitGo/BitGoJS/commit/9fab886fab10eeacdd91d294f1c5deeb5cd03a28))
* **statics:** add imxv2 token ([68a7338](https://github.com/BitGo/BitGoJS/commit/68a733851cb393ad9f05510eda221ad2d6e19a45))


### Bug Fixes

* **eth:** move gasLimit to base params ([6a1f108](https://github.com/BitGo/BitGoJS/commit/6a1f10867e87db853cad38ba62fdc9ca26bff946))
* **utxo-lib:** fix sighash for dash transactions ([c171435](https://github.com/BitGo/BitGoJS/commit/c1714357eab3f8fc961e75ad0af8e49f967e801b))

### [13.0.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.1...bitgo@13.0.2-rc.0) (2021-10-15)


### Features

* add support for sign(signParams: TxbSignArg) ([f15fb36](https://github.com/BitGo/BitGoJS/commit/f15fb36e6a1aa7515dfbf0c1f2c36620a9ba8eab))
* **terc token:** update decimal places for terc token ([d9d2de6](https://github.com/BitGo/BitGoJS/commit/d9d2de685296f3ec6e3ad40e53d04158540cd516))


### Bug Fixes

* **account-lib:** add parsing for optional type in stringifyCV ([3f3fddb](https://github.com/BitGo/BitGoJS/commit/3f3fddbb37ea970eac8311585f22bb8dc6a8d0dc))
* **sdk:** add avaxc family ([85d945d](https://github.com/BitGo/BitGoJS/commit/85d945d252f3446de50204c77e3110ef81847abe))

### [13.0.1](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.1-rc.8...bitgo@13.0.1) (2021-10-08)

### [13.0.1-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@13.0.1-rc.6...bitgo@13.0.1-rc.8) (2021-10-08)


### Features

* **express:** add route for create address ([cdd3fec](https://github.com/BitGo/BitGoJS/commit/cdd3feca35881538bf83c01051792b86de6d9a11))
* **statics:** update EOS with SUPPORTS_TOKENS feature ([241630c](https://github.com/BitGo/BitGoJS/commit/241630c8f36c6c6441cda2dc01331de816196e39))


### Bug Fixes

* **eth:** update tx with signature in recover ([3fa3de4](https://github.com/BitGo/BitGoJS/commit/3fa3de43cc21618deda3be5183b2b21878367576))
* **root:** resolve `axios` to `^0.21.2` ([04d63f9](https://github.com/BitGo/BitGoJS/commit/04d63f9bb1e8a74692b5d54668a79999abc23c64))
* **utxo-lib:** pass 0 offset to `readUInt16BE` for zcash `fromBase58Check` ([ff99d32](https://github.com/BitGo/BitGoJS/commit/ff99d32110f23dfe2f1f41b9942f33ccc39deaac))
* **utxo-lib:** use OP_CHECKSIG for 2nd p2tr opcode ([a5fdf02](https://github.com/BitGo/BitGoJS/commit/a5fdf02795fcde78d85e94f51f9ac92db620aa67))

### [13.0.1-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.6...bitgo@13.0.1-rc.6) (2021-10-07)


### ⚠ BREAKING CHANGES

* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript

### Features

* **account lib:** add new fee model to transaction builder ([6ae88c0](https://github.com/BitGo/BitGoJS/commit/6ae88c057565f23e5c4aca39d7e01bf58aa4fa0a))
* **account lib:** adding multisigAddress ([547518c](https://github.com/BitGo/BitGoJS/commit/547518cbdecdbec4c1a368052e274e8f288f41d0))
* **account lib:** get trx fee limit from statics ([55f43b1](https://github.com/BitGo/BitGoJS/commit/55f43b1547f7f30fb2c5dd26587745b07b9694e6))
* **account-lib:** add close remainder to ([2c5694f](https://github.com/BitGo/BitGoJS/commit/2c5694ff275b2042697447ef44311fde9c21ddb6))
* **account-lib:** add encodeAddress in account-lib and unit test ([90ae1ab](https://github.com/BitGo/BitGoJS/commit/90ae1ab9225955812d1b468bd16d3158fc794c63))
* **account-lib:** add genesisID and genesisHash to toJson() ([ea54d43](https://github.com/BitGo/BitGoJS/commit/ea54d4330df09e21d90e1480c30ff3a449db6d93))
* **account-lib:** add signers check on account lib and add unit test ([44d68b6](https://github.com/BitGo/BitGoJS/commit/44d68b6aa5789ae2f0d586a5e76b981d5797a120))
* **account-lib:** add test unit getTrasactionByteSize ([a6a3062](https://github.com/BitGo/BitGoJS/commit/a6a3062c6cb406bf7c178fafe2d5607ea797ed23))
* **account-lib:** added Algo encodeObj support on account lib ([e9a3e2e](https://github.com/BitGo/BitGoJS/commit/e9a3e2e7c20cd8a73b64ae8b603db750f6bfeb4f))
* **account-lib:** addition of getTxId method for multisig txn ([ad22216](https://github.com/BitGo/BitGoJS/commit/ad222163171b3fd4fed5a20bc7fef8289cee1e69))
* **account-lib:** addition of getTxId method for multisig txn ([4240477](https://github.com/BitGo/BitGoJS/commit/4240477845c6404a7eee1ad477ade28674818bb8))
* **account-lib:** algo key dilution fix ([faebb5c](https://github.com/BitGo/BitGoJS/commit/faebb5c401a38be21d96f3736315ef852fe8e76d))
* **account-lib:** allow creating ETH Keypair from provided or random seed ([e96e4bb](https://github.com/BitGo/BitGoJS/commit/e96e4bb915a14b014efd04f873af4b75f1cf09c9))
* **account-lib:** attempt webpack with ecma 6 ([37ace8c](https://github.com/BitGo/BitGoJS/commit/37ace8c0eb1b9c3920c296719e841a5c35634959))
* **account-lib:** determine how to use contract method IDs ([ecbcb8a](https://github.com/BitGo/BitGoJS/commit/ecbcb8a22065058d376bade7eed8ddf775805152))
* **account-lib:** implementation of generateAccoutn() in account-lib ([7737024](https://github.com/BitGo/BitGoJS/commit/7737024d04187cd8432473d17354543d4d35aba0))
* **account-lib:** implementation of the functionality secretKeyToMnemonic with unit test ([0c80d0a](https://github.com/BitGo/BitGoJS/commit/0c80d0a65dd5ab09c196421c9d25022174c89a24))
* **account-lib:** implemetion stellerpub to algoaddress and encodeAddress ([a636bc0](https://github.com/BitGo/BitGoJS/commit/a636bc01dca47e51663a99b8dee843e3ba28b4c6))
* **account-lib:** move buildFeeInfo logic to AL and add unit test ([9c7ae4e](https://github.com/BitGo/BitGoJS/commit/9c7ae4ec9e5f0ecc751372375b1a83a7be4c1e7c))
* **account-lib:** rebase account-lib in the bitgoJs and fixing errors ([cf5baaf](https://github.com/BitGo/BitGoJS/commit/cf5baaf577cd9c151be40d4efb6257ba47c03889))
* **account-lib:** remove KeyExclusionBuilder from account-lib ([3950c7b](https://github.com/BitGo/BitGoJS/commit/3950c7bf68c19dfdf46490f8c3c5d79f6ffb38d6))
* **account-lib:** remove question mark from genesisID and genesisHash ([14c961e](https://github.com/BitGo/BitGoJS/commit/14c961e658f114da34e107871d4021997cf7f586))
* **account-lib:** support new fee model in EthTransactionData ([c4b2e38](https://github.com/BitGo/BitGoJS/commit/c4b2e38e517d06ad91ff1a060d78ec7322c2a312))
* **account-lib:** transation hash is calclated wrongly ([15628a2](https://github.com/BitGo/BitGoJS/commit/15628a20b4feef9d4b77debb5359158ccc99f821))
* **account-lib:** unit test for non participation in keyRegistrationBuilder ([540774b](https://github.com/BitGo/BitGoJS/commit/540774b40dd1406d7b8d9e6d6fa573f1bb723318))
* **account-lib:** update eth behavior require by hsm3 ([062eba1](https://github.com/BitGo/BitGoJS/commit/062eba1232083bf40ed66f69eebda7a73b7bbded))
* **account-lib:** update verification methods ([af93730](https://github.com/BitGo/BitGoJS/commit/af937306b61286ab813e4410b65079659883e93b))
* **accountlib:** add closeremaindeto and unit tests ([69917a0](https://github.com/BitGo/BitGoJS/commit/69917a0074e382a900df71bc247cc9eadfd0533d))
* **accountlib:** add testing ([8f4e3a0](https://github.com/BitGo/BitGoJS/commit/8f4e3a0f0fb2743f14211565c1f1e4e6bfcc144e))
* **algo:** misc updates for platform migration to use account lib ([b310c57](https://github.com/BitGo/BitGoJS/commit/b310c57d5ff497aff76fe5859a3baef6466915c5))
* **bitgojs:** update algo sdk to last stable version ([87e258a](https://github.com/BitGo/BitGoJS/commit/87e258aa69c72a339f9a911e512aa447ff77dc32))
* **bitgojs:** update algo sdk to last stable version ([291f166](https://github.com/BitGo/BitGoJS/commit/291f166447cd29dac463b0cf2d4851ac21b00684))
* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript ([a5b80b2](https://github.com/BitGo/BitGoJS/commit/a5b80b274ce4d3d38c4e4396d5f313a6192c4652))
* **core:** add `ecdhXprv` to serialized SDK JSON object ([3112c72](https://github.com/BitGo/BitGoJS/commit/3112c72f735e319d25f885c446ea8b1e8b30f0f3))
* **core:** add distinct "unit-test" target ([079b1fb](https://github.com/BitGo/BitGoJS/commit/079b1fb3890f8ea55d3303eb674cf09bfc5843f5))
* **core:** add enable and disable token txs to explain transaction method ([8d99fdc](https://github.com/BitGo/BitGoJS/commit/8d99fdca1ec854d199c28ba1e26a9be533985c81))
* **core:** add function for verifying eth address ([32d5714](https://github.com/BitGo/BitGoJS/commit/32d5714d7e4b2b0e2537da42e6f2448f0488c973))
* **core:** add toBase58Check to legacyBitcoin ([c220d7d](https://github.com/BitGo/BitGoJS/commit/c220d7d45b8533d343c1e2425109caa94da7a0da))
* **core:** added algo token config on core ([45bcf2f](https://github.com/BitGo/BitGoJS/commit/45bcf2f4c949995f126b06118b20c48d7b864bc1))
* **core:** added support for send on cashaddr ([0457b6d](https://github.com/BitGo/BitGoJS/commit/0457b6da7200aa8e298e8708830a76be1edf8454))
* **core:** allowed amount 0 on recipients for enable token ([29948a4](https://github.com/BitGo/BitGoJS/commit/29948a42492a9ce9e0ec2d16c8dfc8c34d594e89))
* **core:** eos token configuration ([adbb0ae](https://github.com/BitGo/BitGoJS/commit/adbb0ae3d954b5c8dba88e31e1c2fc82528b1d46))
* **core:** expose compatibility layer at `require('bitgo').bitcoin` ([48cbfe3](https://github.com/BitGo/BitGoJS/commit/48cbfe33c867d0bd5e60dea6f132e5ad9f6c7a82))
* **eos-tokens:** update explain transaction to support EOS tokens ([deab70b](https://github.com/BitGo/BitGoJS/commit/deab70b14be6ca1941588aae41e6cc0691d50aaf))
* **eos-tokens:** update explain transaction to support EOS tokens ([c8b7a24](https://github.com/BitGo/BitGoJS/commit/c8b7a24093a9e011b62e4a08b83eaa0782fb9752))
* **eos:** add eos token support ([6fb1319](https://github.com/BitGo/BitGoJS/commit/6fb1319cbf4dd076412d95fa1f93e7d2fca96305))
* **eth:** enable eip1559 transactions for recovery ([f2b73ee](https://github.com/BitGo/BitGoJS/commit/f2b73ee9723b44de5ad874d13fe54291099ea41e))
* **root:** use lib "es2017" ([16ad3e4](https://github.com/BitGo/BitGoJS/commit/16ad3e4521ded7d5ef0f6da7e851d4c15e691d82))
* **statics:** add eos mainnet token config ([1ab6ee1](https://github.com/BitGo/BitGoJS/commit/1ab6ee1c0b47756b53705b7dbec9133cdd52738f))
* **statics:** add name property to networks ([6aebdd4](https://github.com/BitGo/BitGoJS/commit/6aebdd4a1a3b8972e890231a513fcd227cb53602))
* **statics:** add new tokens ([b10781f](https://github.com/BitGo/BitGoJS/commit/b10781f075e69f2c6cd0f6ac5917f53dd031c090))
* **statics:** add new tokens ([c8d787c](https://github.com/BitGo/BitGoJS/commit/c8d787c0ad559c63dd75c6a504be086d50008833))
* **statics:** add trx fee limit to statics ([50d01b8](https://github.com/BitGo/BitGoJS/commit/50d01b85de121c44825acb6fe21b69960d7431b7))
* **statics:** add usdc and usdt to config ([f96d622](https://github.com/BitGo/BitGoJS/commit/f96d622ba1f6244482f6cebc199f0ae783482fcd))
* **statics:** add usdc and usdt to config ([80934b7](https://github.com/BitGo/BitGoJS/commit/80934b7e0f168d5ef8d87470d96df850fa45e4e0))
* **statics:** revert DYNS token to DYN ([a2a7f5b](https://github.com/BitGo/BitGoJS/commit/a2a7f5b6e6de05bbcbe1643ca5b4c630bdac92cf))
* **utxo-lib:** add createTransactionFromHex() ([a7c6032](https://github.com/BitGo/BitGoJS/commit/a7c6032c5f947c372d9a18fb44343c4e53b5ba27))
* **utxo-lib:** add p2tr output scripts support ([3aebc5b](https://github.com/BitGo/BitGoJS/commit/3aebc5b77052e02b2cd688d01935c7e199e25902))
* **utxo-lib:** add p2tr output scripts support ([7af9d9e](https://github.com/BitGo/BitGoJS/commit/7af9d9e6da4d6f2ba83b26794ba58ccaf4b738a9))
* **utxo-lib:** add padInputScript ([0c1be6e](https://github.com/BitGo/BitGoJS/commit/0c1be6e7bf37ef1bd6392b8492624cefc83e4f8c))
* **utxo-lib:** add test comparing rpc data to parsed data ([bd5fb7a](https://github.com/BitGo/BitGoJS/commit/bd5fb7aa550d5510ff062db94d342ebddb8890ef))
* **utxo-lib:** add test fixtures for special dash transactions ([0a655ae](https://github.com/BitGo/BitGoJS/commit/0a655aee64022b6f368f867445162b1f8f3cf4cd))
* **utxo-lib:** add, use parseTransactionRoundTrip ([fc2ece4](https://github.com/BitGo/BitGoJS/commit/fc2ece41ead787a9103cb74ffdf0132a3acd3a48))
* **utxo-lib:** export address check types ([411db60](https://github.com/BitGo/BitGoJS/commit/411db60aa0df6b85e253b59d1641476bac46a4df))
* **utxo-lib:** export, use BitcoinJSNetwork ([ce85f44](https://github.com/BitGo/BitGoJS/commit/ce85f44aad5e36903d29c66d7e3ec179c9c4f887))
* **utxo-lib:** expose lower-level signature validation methods ([4a2e276](https://github.com/BitGo/BitGoJS/commit/4a2e2769f6e8c9281e050e3a6e2df3ce498bf68b))
* **utxo-lib:** test createTransactionBuilderFromTransaction ([9761ec7](https://github.com/BitGo/BitGoJS/commit/9761ec7c5b7bc5460a6b7134406c6d3142fc515d))
* **utxolib:** implement padInputScript for p2wsh transactions ([f73f7ea](https://github.com/BitGo/BitGoJS/commit/f73f7eaebf1e675e9203beb383f35fc4193c130a))
* **wp:** added support of cashaddr for create address ([fcdc261](https://github.com/BitGo/BitGoJS/commit/fcdc261df6187d9befb30c81ba6882056e9a9ffb))


### Bug Fixes

* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([977d4df](https://github.com/BitGo/BitGoJS/commit/977d4df509101cd463d81ce2330b59ad2dc90b6e))
* **account-lib:** fix decodeAlgoTxn to maintain backward compatibility with old txs ([94e0fa2](https://github.com/BitGo/BitGoJS/commit/94e0fa27a3b39e139f441fafc7a834a2e0007cdf))
* **account-lib:** fix lint errors ([56b789f](https://github.com/BitGo/BitGoJS/commit/56b789f5ca161bc8c5f14e95ea81d3db67e9b9b5))
* **account-lib:** remove unused import ([fe4555f](https://github.com/BitGo/BitGoJS/commit/fe4555fe5bd91ba936ae8a807153a94864bb301d))
* **accountlib:** stx transactionBuilder network fix ([d966f10](https://github.com/BitGo/BitGoJS/commit/d966f1084c3cf935fc3c7e125490088a5edf530a))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([931ef50](https://github.com/BitGo/BitGoJS/commit/931ef50e7cc093923c3b6a799f7d70472171bf2a))
* **algo tokens:** update also tokens to use base chain as identifier for explainTransaction ([ef1afb8](https://github.com/BitGo/BitGoJS/commit/ef1afb8ead03e852a4a40060f7d423967b9b032f))
* **bitgojs:** revert revert of algo-tokens changes ([5784921](https://github.com/BitGo/BitGoJS/commit/5784921456c625340b8101a1ad9b528fc4aa1686))
* **bitgojs:** revert revert of algo-tokens changes ([a469736](https://github.com/BitGo/BitGoJS/commit/a469736ef57afa47d829d223cfd7fb4b86771c52))
* **core:** add algo seed encoding ([c0f8ea5](https://github.com/BitGo/BitGoJS/commit/c0f8ea5cd07e1f106ab17ad09399e04b1f6591af))
* **core:** add algo seed encoding ([8808b1c](https://github.com/BitGo/BitGoJS/commit/8808b1cfa228cf81d91a064b0f24e97e05670f2d))
* **core:** correct chainid of eos testnet ([bc128a9](https://github.com/BitGo/BitGoJS/commit/bc128a91a0a3349af792aa2a88c46b279b0cbc29))
* **core:** correctly handle ECPair case in `getAddressP2PKH` ([a386bb4](https://github.com/BitGo/BitGoJS/commit/a386bb4983ae9c9aa209e9e4dfced832de88899c))
* **core:** fix createTransactionBuilderFromTransaction call ([0de8574](https://github.com/BitGo/BitGoJS/commit/0de8574e1b7a30f9772ce0427d782dfafc9eae9d))
* **core:** fix fromBase58() in legacyBitcoin ([f563fd4](https://github.com/BitGo/BitGoJS/commit/f563fd4196e79d4961840f11bb5673b6040a9726))
* **core:** fix key pair generation methods ([fa16f19](https://github.com/BitGo/BitGoJS/commit/fa16f1932f026ee334b7eaa700bf7a0ff9112ea4))
* **core:** fix lint error ([7abc0e2](https://github.com/BitGo/BitGoJS/commit/7abc0e219b5afb51ccf4c62d544db40dd3b30130))
* **core:** fix verify sign parameters for Algorand ([47348cd](https://github.com/BitGo/BitGoJS/commit/47348cd4297b54c66377f6afa52edff6c1a8473b))
* **core:** fix xpubToEthAddress ([aabaa51](https://github.com/BitGo/BitGoJS/commit/aabaa51322066dc8b8a7f9e7ca7d71b3cc434b36))
* **core:** fixed TAT issues ([378d76e](https://github.com/BitGo/BitGoJS/commit/378d76e2b6ee7a071fcb244c47237ca2a59c2306))
* **core:** fixed TAT issues ([c648262](https://github.com/BitGo/BitGoJS/commit/c64826249e22c4ebb017e2e47ff740fdfa57d7ee))
* **core:** handle script sigs without signature property in `explainTransaction` ([76028f5](https://github.com/BitGo/BitGoJS/commit/76028f58a6cc5b8a390a6d16d5a696ced368e6cc))
* **core:** ignore algo token from browser tests ([d0104ed](https://github.com/BitGo/BitGoJS/commit/d0104ed1dd90f62f89fe9ceeff4e45cb465e6dca))
* **core:** rename HalfSignedTransaction to HalfSignedAccountTransaction ([5a6dedd](https://github.com/BitGo/BitGoJS/commit/5a6deddec240ab722b553aab11e473758d7de827))
* **core:** use `buildIncomplete()` in utxo recovery ([60e99c9](https://github.com/BitGo/BitGoJS/commit/60e99c9d74941d8332ae67cca6530967bd058007))
* correctly regenerate .drone.yml ([eaf6aaa](https://github.com/BitGo/BitGoJS/commit/eaf6aaa67c5293a2e2083cc224172c6eacd9fab5))
* **gterc-tokens:** add missing gterc tokens ([724406b](https://github.com/BitGo/BitGoJS/commit/724406b5113dc00246d839c13d623b64c47012c8))
* **gterc-tokens:** add missing gterc tokens ([27a86db](https://github.com/BitGo/BitGoJS/commit/27a86db9f5c6d2a3f93eea74f71c2b7a15e5523a))
* **hbar:** fix sign and verify for hex encoded hbar message ([c3ef546](https://github.com/BitGo/BitGoJS/commit/c3ef546b68dac87339f39197bf798c899d881bdf))
* **hbar:** fix sign and verify for hex encoded hbar message ([b82dae2](https://github.com/BitGo/BitGoJS/commit/b82dae2ec89bf55f5d891b9887069c5c66b07157))
* **statics:** change Goerli ETH underlying asset from ETH to GTETH ([7fafd32](https://github.com/BitGo/BitGoJS/commit/7fafd3281a00c5596cf506a1476e96f2df7db6d7))
* **tdash:** fix incorrect explorerUrl for tdash ([e84b9db](https://github.com/BitGo/BitGoJS/commit/e84b9db96f5db161f5dd2ccac5109a05c34c1eda))
* **teth:** add terc tokens with 2,6,18 decimals ([3be4597](https://github.com/BitGo/BitGoJS/commit/3be4597e18fe3fa21eb123160e1528d3630e0be9))
* **teth:** add terc tokens with 2,6,18 decimals ([846f758](https://github.com/BitGo/BitGoJS/commit/846f758aff7cb03a68c25ed93af112f83538bed7))
* **utxo-lib:** default to `version: 2` for BTG transactions ([c4047ed](https://github.com/BitGo/BitGoJS/commit/c4047ed24a80904f39f2d598ba6b67722ce8de7b))
* **utxo-lib:** eslint fix ([a17d3c0](https://github.com/BitGo/BitGoJS/commit/a17d3c09aef4124edb4541dc03cd316e0826f6ac))
* **utxo-lib:** fix imports in test ([204e404](https://github.com/BitGo/BitGoJS/commit/204e4044b5a487c3a687f2514e148f5cb318b3c7))
* **utxo-lib:** pass buffer to `hash256` ([602936a](https://github.com/BitGo/BitGoJS/commit/602936adfed547edd6254c915a9500e80c943bda))
* **utxo-lib:** use different bitcoinjs-lib specifier ([a629eec](https://github.com/BitGo/BitGoJS/commit/a629eec182910e41e339bfebfa6faecffac01305))

## [12.1.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.5...bitgo@12.1.0-rc.6) (2021-08-26)


### Features

* **statics:** add tesnet tokenes ([de9d5b5](https://github.com/BitGo/BitGoJS/commit/de9d5b529b47c925f6e5741d599b06006bf58951))
* **utxo-lib:** add wrappers for Transaction(Builder) constructors ([62aafa9](https://github.com/BitGo/BitGoJS/commit/62aafa98e69b88a801d0fb5bb3e751391a426f44))


### Bug Fixes

* **stx:** resolves toJSON for stx ([4b66b78](https://github.com/BitGo/BitGoJS/commit/4b66b78fa69eef4e55377fd64f439343a804edc8))

## [12.1.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.4...bitgo@12.1.0-rc.5) (2021-08-26)

## [12.1.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.3...bitgo@12.1.0-rc.4) (2021-08-26)


### Features

* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([ee826bd](https://github.com/BitGo/BitGoJS/commit/ee826bd8f6ef96ad0b1f1986ac648f9498634ba8))
* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([5ea5758](https://github.com/BitGo/BitGoJS/commit/5ea5758fbadfc4d474d7fca627f2dde85e9d3514))

## [12.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.2...bitgo@12.1.0-rc.3) (2021-08-26)


### Features

* **account-lib:** add AvaxWalletSimple.sol ABI to walletUtil.ts ([28e5007](https://github.com/BitGo/BitGoJS/commit/28e50073061222627795e4dfdcd6a9351919ffcf))
* fixing halfSigned in SubmitTransactionOptions ([2603199](https://github.com/BitGo/BitGoJS/commit/2603199283e5598fd22318ec97d6983cca06c656))
* **utxo-lib:** add thirdparty fixtures ([9d48994](https://github.com/BitGo/BitGoJS/commit/9d48994887aaa094fc2ee2cd375384c154473fab))


### Bug Fixes

* **account-lib:** fix lint errors ([cc87263](https://github.com/BitGo/BitGoJS/commit/cc872636370ed76e39c7c5726ad9afbbdecd855d))
* **core:** use AbstractUtxoCoin type in btc tests ([956fef1](https://github.com/BitGo/BitGoJS/commit/956fef11ba024ed40f5ce5e5caaf73d37c6dd9db))
* **utxo-lib:** fix `addForkId` evaluation ([2d5f7e6](https://github.com/BitGo/BitGoJS/commit/2d5f7e6bf7592447cd6ca35ad320202343595227))
* **utxo-lib:** respond to comments ([a2a5808](https://github.com/BitGo/BitGoJS/commit/a2a580815c2c8fa76822a8255b9cdd8028c8db77))
* **utxo-lib:** write `version` as `Int32` ([d3e337a](https://github.com/BitGo/BitGoJS/commit/d3e337ab997c81a2c2c4c1a7ee678777a571f89a))

## [12.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.1...bitgo@12.1.0-rc.2) (2021-08-24)


### Features

* **statics:** add priority tokens ([3b2b44b](https://github.com/BitGo/BitGoJS/commit/3b2b44bcd3f634da74b3b39c1cbee151e15ab67a))
* **utxo-lib:** add createSpendTransaction match test ([436104a](https://github.com/BitGo/BitGoJS/commit/436104aabcb256e1045afc263473a808af8467ca))
* **utxo-lib:** add getDefaultSigHash(network) ([bdb5ace](https://github.com/BitGo/BitGoJS/commit/bdb5acebf94bf91540c6491489c69c8f41a40cca))
* **utxo-lib:** add tests for half-signed transactions ([c8e5222](https://github.com/BitGo/BitGoJS/commit/c8e52229115846303110f24421836500b1140bc9))

## [12.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@12.1.0-rc.0...bitgo@12.1.0-rc.1) (2021-08-24)


### Features

* **account-lib:** stx ContractBuilder functionArgs add optionl ([1e5e725](https://github.com/BitGo/BitGoJS/commit/1e5e725152bc75fd58358474f3cbbfedbbbd403b))
* **core:** add support for avaxc ([a30e29c](https://github.com/BitGo/BitGoJS/commit/a30e29cc4bd0a134186bc76e3afb5e3f49c4f03f))


### Bug Fixes

* **account-lib:** readd `es5` target and `esModuleInterop` ([f2e316d](https://github.com/BitGo/BitGoJS/commit/f2e316dd6df0eb2387516b755ce84b9c96e523c4))
* **accountlib:** improve multisig in order to user any order or combination of keys ([37235fd](https://github.com/BitGo/BitGoJS/commit/37235fdfdc83133eab1db185b1598671c092a89c))
* **core:** disable `esModuleInterop` ([619769c](https://github.com/BitGo/BitGoJS/commit/619769cbfb53a550b18b04643514f1fdbecccfe8))
* **core:** fix broken tests ([feb63f5](https://github.com/BitGo/BitGoJS/commit/feb63f5c7f08b53ff230e8f8b408d3adc70cc769))
* **core:** improve documentation in hashForSignatureByNetwork ([081c573](https://github.com/BitGo/BitGoJS/commit/081c573b810c7e847c68990381bebe1d445847c9))
* **core:** use hashForSignatureByNetwork in core ([3b210f0](https://github.com/BitGo/BitGoJS/commit/3b210f0fc44a2e4eb85627a7b5d9e9054b553db2))
* **eth:** make replay protection optional ([061f2c6](https://github.com/BitGo/BitGoJS/commit/061f2c64f55eac31a162986ee2ac3df7da047978))
* **root:** disable eslint `no-undef` rule for typescript files ([597e468](https://github.com/BitGo/BitGoJS/commit/597e4688a2bfbbdbf8ae6235c420cd35adf701ad))
* **stx-core:** parse stx transactions ([5ad70c8](https://github.com/BitGo/BitGoJS/commit/5ad70c854e1b37231abd106169f01eef36f6f351))
* **utxo-lib:** fix fixture generation for bitcoingold ([b3067ec](https://github.com/BitGo/BitGoJS/commit/b3067ec02f40489f3c99989e3a507e28775bb7dd))

## [12.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.1-rc.0...bitgo@12.1.0-rc.0) (2021-08-17)


### Features

* **account-lib:** avalanche C implement transactionBuilder, transferBuilder, tests ([dbac92b](https://github.com/BitGo/BitGoJS/commit/dbac92b442554984bf994456d63e247312341a67))
* add ERC20 OFC "token" support to statics ([4473ef9](https://github.com/BitGo/BitGoJS/commit/4473ef99d7cadbbb58ac6f88cdfff1be4a7ef577))
* **root:** set tsconfig target to `es6` ([8c92c12](https://github.com/BitGo/BitGoJS/commit/8c92c12634722d4137d1c12c7e1e2f464973fae9))
* **utxo-lib:** add signature helpers, tests ([5ea779e](https://github.com/BitGo/BitGoJS/commit/5ea779e2983a7421d4ac9aeb02708aa414c7cc9a))
* **utxo-lib:** allow select networks in integration_local_rpc ([dfc6696](https://github.com/BitGo/BitGoJS/commit/dfc66966a0c7c6e8be5cd5fca7250e30920a9beb))


### Bug Fixes

* **core:** change the type of sendMethodName which is used for fixing erc20 unsigned sweep recovery ([66d118c](https://github.com/BitGo/BitGoJS/commit/66d118c71724ff1e7f1ba2711858ec78e5a75518)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **core:** change type of `sequenceId` to string ([9ff64f3](https://github.com/BitGo/BitGoJS/commit/9ff64f307856a5d3b86c1597c2629a8fe824f7a1))
* **core:** don't add extra `0x` prefix when formatting for offline vault ([3555d50](https://github.com/BitGo/BitGoJS/commit/3555d5056963c3e6d4035f125a4fecb41f8cd761))
* **core:** fix issue of erc20 token recovery using unsigned sweep ([0de956f](https://github.com/BitGo/BitGoJS/commit/0de956fd77253d351a35f215ccd747ca6c562c66)), closes [#30057](https://github.com/BitGo/BitGoJS/issues/30057)
* **utxo-lib:** fix missing word in local rpc parse test ([7336ee2](https://github.com/BitGo/BitGoJS/commit/7336ee22200fe8c0e9f0144fadb571cfa7b1836e))
* **utxo-lib:** increase test coverage for signature.ts ([49a1a48](https://github.com/BitGo/BitGoJS/commit/49a1a4805f7c69ee873243525fba4b9037f890fc))

### [12.0.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0...bitgo@12.0.1-rc.0) (2021-08-12)


### Features

* **account-lib:** avax key pair support ([27c562f](https://github.com/BitGo/BitGoJS/commit/27c562fa1d557f50c7128308666987dab5c48231))
* **utxo-lib:** add more assertions to createOutputScript2of3 ([29e5735](https://github.com/BitGo/BitGoJS/commit/29e5735410e09a77ad6a178ffd5488fdd97a8828))
* **utxo-lib:** move outputScripts to bitgo subpackage ([c1b0fa7](https://github.com/BitGo/BitGoJS/commit/c1b0fa722243d7d6c28ae0b7762387e24d234052))


### Bug Fixes

* **accountlib:** fix getStxAddressFromPubKeys to add signatures required paramater ([2d7e5ae](https://github.com/BitGo/BitGoJS/commit/2d7e5ae9ca59f592b65e15c8b06ce63db27754bd))
* **express:** do not access `_promise` ([8cd097e](https://github.com/BitGo/BitGoJS/commit/8cd097e76cc4e3de8b8b769f39c3bbe9bb79f96e))

## [12.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.9...bitgo@12.0.0) (2021-08-10)

## [12.0.0-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.8...bitgo@12.0.0-rc.9) (2021-08-10)


### Features

* **account-lib:** skeleton code for avalanche c-chain in account-lib ([8c5382b](https://github.com/BitGo/BitGoJS/commit/8c5382b1e51e453b60e7127b2cc18467f4a0f952))
* **core:** add, use getKrsProvider ([c839f08](https://github.com/BitGo/BitGoJS/commit/c839f088dca16cbc1d19c09241641f63518df444))
* **core:** return bip32 in getBip32Keys ([82b0ba2](https://github.com/BitGo/BitGoJS/commit/82b0ba2beef8018b79c42524fd43035743a87f67))
* **statics:** add new tokens ([db83f77](https://github.com/BitGo/BitGoJS/commit/db83f77e34054031496517d85f3517c4207edd74))


### Bug Fixes

* **core:** bring back getECDHSecret ([922b5bf](https://github.com/BitGo/BitGoJS/commit/922b5bf3f4b34f69d3ee7c262c7f3cf09f21364d))
* **core:** fix bip32-based `isValidPub`/`isValidPrv` ([3ab57c4](https://github.com/BitGo/BitGoJS/commit/3ab57c4ee3983377d97486cc526a836f5bec8130))
* **core:** fix issue while signing eos transaction using OVC ([5c25580](https://github.com/BitGo/BitGoJS/commit/5c25580442721a6784645e1383b0e435ccd418aa))
* **core:** fix prebuild transaction for tron contractCalls ([9d0edea](https://github.com/BitGo/BitGoJS/commit/9d0edeaffd39b23ba5fd07a134df030c3d622902))
* **eth:** goerli coins now set to gteth in core/src/config.ts ([3ea10f6](https://github.com/BitGo/BitGoJS/commit/3ea10f64ca02d89db500904a9acc1c3511931e62))


### Reverts

* return master branch package versions to non-rc versions ([5a0ca2b](https://github.com/BitGo/BitGoJS/commit/5a0ca2bda526fad472fe10290610783ae986982b))

## [12.0.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.7...bitgo@12.0.0-rc.8) (2021-08-09)


### Bug Fixes

* **core:** defer application of authorization headers ([8a26071](https://github.com/BitGo/BitGoJS/commit/8a26071fec8c290c68f5920dad69be545813118b))
* **core:** fix regression in `addAccessToken` when using v1 auth ([e58e86b](https://github.com/BitGo/BitGoJS/commit/e58e86bc00b6f6582d5d527044dbc87cf4086a51))

## [12.0.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.6...bitgo@12.0.0-rc.7) (2021-08-06)


### Features

* **core:** add bip32path.fromLegacyPath() ([b95c55f](https://github.com/BitGo/BitGoJS/commit/b95c55f73ecc75b2e946353c4a01856279a916e2))
* **core:** add bip32util with signMessage/verifyMessage ([43178f2](https://github.com/BitGo/BitGoJS/commit/43178f2cf9da0e812fdae2057e597c5dc8bc5660))
* **core:** use sanitizeLegacyPath in transactionBuilder ([46543aa](https://github.com/BitGo/BitGoJS/commit/46543aa07a5194a857297f3f34c242b0435e8874))


### Bug Fixes

* **core:** address verification should fail for uppercase bech32 addresses ([39c5d7c](https://github.com/BitGo/BitGoJS/commit/39c5d7cbdd793ade4ba939bf4c6df1b4d9ec5e79))
* **core:** bump stellar-sdk ([200bc3f](https://github.com/BitGo/BitGoJS/commit/200bc3f8f1593c5808b1467fdaf264c7af4625e8))
* **core:** fix method name to TRX.xpubToUncompressedPub ([b45b882](https://github.com/BitGo/BitGoJS/commit/b45b882b0db02b61f59e03d78a6000b72290ef64))
* **core:** transactionBuilder: ignore `walletSubPath === 'm'` ([5bbf8d1](https://github.com/BitGo/BitGoJS/commit/5bbf8d143a6e99ee2958ae764889ecd7f46ebdd8))
* **root:** update `@celo/contractkit` deps to fix audit issues ([fba7595](https://github.com/BitGo/BitGoJS/commit/fba7595cb3c5bed76294cb9fae6241ab497e72a5))
* **root:** update lerna deps to fix audit issues ([08315ba](https://github.com/BitGo/BitGoJS/commit/08315baec81cef7098d645183ba742ae2b93c395))

## [12.0.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.5...bitgo@12.0.0-rc.6) (2021-08-04)


### Bug Fixes

* **core:** fix getExtraPrebuildParams ([6486c9f](https://github.com/BitGo/BitGoJS/commit/6486c9fc7308cdaa02ddcaaae9a829e50e61c2c9))

## [12.0.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.4...bitgo@12.0.0-rc.5) (2021-08-03)


### Features

* **core:** move secp256k1 to regular dependencies ([d43b363](https://github.com/BitGo/BitGoJS/commit/d43b363aecb8164d0c6b5fca6b0cbf010bfb67fb))
* **statics:** add AVAXC coin to statics ([0b8b1d6](https://github.com/BitGo/BitGoJS/commit/0b8b1d6e9198c63c910d3551d522db8996e3cc6a))


### Bug Fixes

* temporarily remove AVAXC from failing SDK test for Secp256k1 coins ([a602eaa](https://github.com/BitGo/BitGoJS/commit/a602eaa8fd6c0b0f66c070b4e26091bfc32780dc))

## [12.0.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.3...bitgo@12.0.0-rc.4) (2021-08-03)


### Bug Fixes

* **account-lib:** stx get signatures to return only signatures ([271fefb](https://github.com/BitGo/BitGoJS/commit/271fefbb6e9e74ba34e10cc14553961434c11902))
* **root:** add package-lock.json to .gitignore ([754ef40](https://github.com/BitGo/BitGoJS/commit/754ef401fb6c9bfa1f5c5daa0d10cdce86a4de45))

## [12.0.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.2...bitgo@12.0.0-rc.3) (2021-07-30)


### Bug Fixes

* **core:** ignore typescript errors from incompatible `@types/ethereumjs-util` ([a52de1b](https://github.com/BitGo/BitGoJS/commit/a52de1b9417f9cac392a91482b1715074415c064))

## [12.0.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.1...bitgo@12.0.0-rc.2) (2021-07-30)


### Features

* **account-lib:** upgrade celo to 1.2.4 ([c7ed64d](https://github.com/BitGo/BitGoJS/commit/c7ed64d3c21d77c62a015f126c59843d39866214))
* pass eip1559 fee params in send and sendmany ([73ef7fc](https://github.com/BitGo/BitGoJS/commit/73ef7fcca3f3559476063b4c16547e0314c42f13))
* **sdk:** add feeLimit parameter to Send options ([c10d6fa](https://github.com/BitGo/BitGoJS/commit/c10d6fa384dc352aa082f1c4079dfa10fcde4e88))


### Bug Fixes

* **core:** body not being included in HMAC ([50babb5](https://github.com/BitGo/BitGoJS/commit/50babb5473f3c2c4b2138a411870d5f93d0997b5))
* **remove logs:** remove logs ([f439bfa](https://github.com/BitGo/BitGoJS/commit/f439bfacbe6953b54f7492e4400e780d8d7769ac))
* **utxo-lib:** make compatible with node 10, 12 ([dd8d8f9](https://github.com/BitGo/BitGoJS/commit/dd8d8f9a903c46549742512c30f5ce540b1c1e75))

## [12.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@12.0.0-rc.0...bitgo@12.0.0-rc.1) (2021-07-27)


### Features

* **core:** add `considerMigratedFromAddressInternal` verification flag ([288c6f1](https://github.com/BitGo/BitGoJS/commit/288c6f15e11c908849047f4f995d4ba20f4da958))
* **utxo-lib:** add captured test fixtures ([0f98933](https://github.com/BitGo/BitGoJS/commit/0f98933cb21a501967ebc78411fb093221b51aa9))
* **utxo-lib:** add RPC tests ([1a9a9c5](https://github.com/BitGo/BitGoJS/commit/1a9a9c519e38d6eecaed572ff47f33d9dc25e50a))


### Bug Fixes

* **account-lib:** stx default signers to 2 ([02a6c56](https://github.com/BitGo/BitGoJS/commit/02a6c56c44983fb81b6d143783db431be2326a6f))
* **core:** deduplicate repetitive `abstractUtxoCoin` parse tx tests ([be39c40](https://github.com/BitGo/BitGoJS/commit/be39c4087215e1b1e694196467e5e00edcda828c))
* **core:** follow up improvements from PR [#1292](https://github.com/BitGo/BitGoJS/issues/1292) ([7ee6fdb](https://github.com/BitGo/BitGoJS/commit/7ee6fdb05508992761afd50f906b860e9e3096e0))
* **core:** replace bitcoin-abc with ecash in blockchair apis ([c8e9c56](https://github.com/BitGo/BitGoJS/commit/c8e9c566310b9f31cc43380a42b283d801d15b3f))
* **utxo-lib:** update mocha and test `.ts` files ([fb0e7d0](https://github.com/BitGo/BitGoJS/commit/fb0e7d0b4aed2e72a8b269f93c8c7ed8f0367ed0))
* **utxolib:** use `debug` package ([68113bb](https://github.com/BitGo/BitGoJS/commit/68113bbd64411c71fa1c274eb8ff6d0ff1757d1d))
* **utxolib:** use path package for path operations ([75f6fab](https://github.com/BitGo/BitGoJS/commit/75f6fab78ee3d1d0493be407e4c05257712dfddd))
* **wp:** split mocha test from outputScripts impl ([01053c9](https://github.com/BitGo/BitGoJS/commit/01053c9a5f754b884c665e485d613d964055053a))

## [12.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.18.1-rc.0...bitgo@12.0.0-rc.0) (2021-07-22)


### ⚠ BREAKING CHANGES

* **core:** bluebird-specific promise methods are no longer present
on the `get`/`post`/`put`/`del`/`patch` request helper methods on BitGo
objects.
* **core:** remove support for callbacks to async fns

Native promises don't support the `asCallback` or `nodeify` helpers that
are on Bluebird promises. We will need to add a compatiblity layer for
these since we don't (yet) want to entirely deprecate support for
callback style usage of Bitgo object methods, but for now let's remove
all the callback params and make everything work correctly as regular
async functions.

We still want the current API surface to remain callback compatible for
the moment, so convert from raw promises to bluebird promises where
callbacks are needed.

Ticket; BG-31214

### Bug Fixes

* **express:** don't use bluebird methods on native promise returning functions ([b5b3782](https://github.com/BitGo/BitGoJS/commit/b5b37822e8b0814ad63433e1580255416c645ec1))
* **statics:** remove duplicate tokens ([35e445a](https://github.com/BitGo/BitGoJS/commit/35e445aa92a56e0c14dbdb72b987d9a07c1e6d96))


### Code Refactoring

* **core:** remove bluebird from bitgo object http methods ([be6c9b6](https://github.com/BitGo/BitGoJS/commit/be6c9b6f0436dd8aa2c0a5710cbfcb419dde746a))

### [11.18.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.18.0...bitgo@11.18.1-rc.0) (2021-07-22)


### Features

* **statics:** add new erc20s for goerli london hard fork testing ([d566b39](https://github.com/BitGo/BitGoJS/commit/d566b39d3850eb69adc36ee7ad393faca1730dfd))


### Bug Fixes

* **statics:** add unique token types to goerli testnet tokens ([306df63](https://github.com/BitGo/BitGoJS/commit/306df6341767b4b58031fce2aca9057b10400d94))

## [11.18.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.18.0-rc.1...bitgo@11.18.0) (2021-07-22)

## [11.18.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.18.0-rc.0...bitgo@11.18.0-rc.1) (2021-07-21)


### Features

* **statics:** add add new tokens erc20 ([3e652ad](https://github.com/BitGo/BitGoJS/commit/3e652ad96946a51c25fbba9c8e5e9b3ee8a6b500))
* **statics:** add NPXS token again ([f258b41](https://github.com/BitGo/BitGoJS/commit/f258b414616b58e838c17cb8ca4758ca44132ceb))
* **utxolib:** add bitcoingoldTestnet ([06c1dd6](https://github.com/BitGo/BitGoJS/commit/06c1dd6f7ae9e738fedd398e7665b84c03daf46c)), closes [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L332](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L332) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L329](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L329) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L326](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L326) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L327](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L327) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L328](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L328) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h#L35](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h/issues/L35)


### Bug Fixes

* **core:** use ltc explorer to get unspents during cross chain recovery ([4c5d19f](https://github.com/BitGo/BitGoJS/commit/4c5d19f8e349adcde42bfd1272f54c4dc683e749))
* **eth:** restore fixed hop transaction verification ([7b2420a](https://github.com/BitGo/BitGoJS/commit/7b2420aaf6fd684fe8847c27c7cd1aa5882fb8db))

## [11.18.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0...bitgo@11.18.0-rc.0) (2021-07-15)


### Bug Fixes

* **account-lib:** add input/output in stx contract call ([05f95f9](https://github.com/BitGo/BitGoJS/commit/05f95f9df5c468bd4ddbaede874cf8e9ed58a014))
* **account-lib:** fix trx fee limit boundary ([059cf6e](https://github.com/BitGo/BitGoJS/commit/059cf6ef80b2d69693a72e2eb7bff6db3a383d30))

## [11.17.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.8...bitgo@11.17.0) (2021-07-13)

## [11.17.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.7...bitgo@11.17.0-rc.8) (2021-07-13)


### Features

* **account-lib:** stx contract call args ([b482b72](https://github.com/BitGo/BitGoJS/commit/b482b724b4647bd677a2f2082825a1c410cffb1f))

## [11.17.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.6...bitgo@11.17.0-rc.7) (2021-07-13)


### Bug Fixes

* **core:** disable verification for hop transactions ([2515a9c](https://github.com/BitGo/BitGoJS/commit/2515a9c9aeba6d0f2f10cbce39f094a059e40a20))

## [11.17.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.5...bitgo@11.17.0-rc.6) (2021-07-12)


### Bug Fixes

* **account-lib:** remove algo utils ([ba8ea30](https://github.com/BitGo/BitGoJS/commit/ba8ea301c639bdbf3e5c033b8f854cef94498086))
* **core:** don't pick individual tx verification options ([d1fdc36](https://github.com/BitGo/BitGoJS/commit/d1fdc3699289f4fb850845d0e543e5ce17af0cd8))

## [11.17.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.4...bitgo@11.17.0-rc.5) (2021-07-08)


### Features

* **account-lib:** add estimate size ([b9f6752](https://github.com/BitGo/BitGoJS/commit/b9f67525eccf67d37de8ae5eed456342737a3ff1))
* **account-lib:** add support for "memoId" field for STX addresses ([dd712e0](https://github.com/BitGo/BitGoJS/commit/dd712e03a22d27c30848634859eaa5508310800b))
* **account-lib:** algo removal ([e8121d4](https://github.com/BitGo/BitGoJS/commit/e8121d4a08d1a2cd0b37c777da3e6f5d37e5c27d))
* **core:** add support for verifying STX addresses with an optional "memoId" field ([5627877](https://github.com/BitGo/BitGoJS/commit/5627877b1a98f3d8b49a6e2c084da75afc1d5c4f))
* **eth:** verify pre-built eth txns ([f6a39c1](https://github.com/BitGo/BitGoJS/commit/f6a39c1205623149a26b543de3ec866cd5d2c860))
* **statics:** add new erc20 tokens to base.ts and coins.ts ([0e0e2c7](https://github.com/BitGo/BitGoJS/commit/0e0e2c763b2afa85d2a4acda80a3dec3b94e1d42))

## [11.17.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.3...bitgo@11.17.0-rc.4) (2021-07-06)


### Features

* **account-lib:** add validation for cspr address with transferId ([5a1ecd9](https://github.com/BitGo/BitGoJS/commit/5a1ecd95a0bb364fc6011dba369474d59ec728b8))


### Bug Fixes

* **core:** fix cspr address validation to account for transferId ([89f1990](https://github.com/BitGo/BitGoJS/commit/89f1990c44289e5fc4a94c99fe5c2136b7b775c9))

## [11.17.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.2...bitgo@11.17.0-rc.3) (2021-07-02)


### Bug Fixes

* **account-lib:** fix amount in cspr delegate & undelegate builders ([43b0b3f](https://github.com/BitGo/BitGoJS/commit/43b0b3fcf2fbc3eb2420e943a27e0cfb28065dd1))

## [11.17.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.1...bitgo@11.17.0-rc.2) (2021-07-01)


### Features

* **statics:** add wec token ([b514252](https://github.com/BitGo/BitGoJS/commit/b51425253f22bc4ff8582a2292441ea2eaf55094))


### Bug Fixes

* **eos:** can accept addresses with memoId when making recovery ([8001e7e](https://github.com/BitGo/BitGoJS/commit/8001e7e592d48b0c0097384e7395838adde9e8b5))
* **eos:** moved eos fixures to the currect directory ([e64aed4](https://github.com/BitGo/BitGoJS/commit/e64aed4c70586f98808c67477c4c0603c47351ca))
* **eos:** removed unnecessary assertions in eos unit test cases ([205c695](https://github.com/BitGo/BitGoJS/commit/205c695df5d5517851151293aedb7baa2acc6176))
* **eos:** sinon sandbox restored after use in test case ([6cfef71](https://github.com/BitGo/BitGoJS/commit/6cfef71c4fdb5fc9da5699059c74ef7dc187489f))

## [11.17.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.17.0-rc.0...bitgo@11.17.0-rc.1) (2021-06-28)


### Features

* adding comment to SubmitTransactionOptions ([ac32498](https://github.com/BitGo/BitGoJS/commit/ac324988fe37f256a901d71761ad908f95f72f29))
* **core:** add request method to auth v3 hmac subject ([74e5b1f](https://github.com/BitGo/BitGoJS/commit/74e5b1f659c832bb848172745251a9ef93ee9fa2))


### Bug Fixes

* **core:** correct typo when address parameter is missing ([9cf7e90](https://github.com/BitGo/BitGoJS/commit/9cf7e903cadc3c2fe5adca25d24b4977c9643ffe))
* removing extra space ([261b87e](https://github.com/BitGo/BitGoJS/commit/261b87eb102d12b4e8b66683590bef29954a9bf5))

## [11.17.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.16.0...bitgo@11.17.0-rc.0) (2021-06-24)


### Features

* **account-lib:** add asset transfer builder implementation ([8919ce5](https://github.com/BitGo/BitGoJS/commit/8919ce50d0b91c0b6073c0b9abe17a90d3f32700))
* **account-lib:** algo support for half sign tx ([e063c03](https://github.com/BitGo/BitGoJS/commit/e063c03ad4760d6f90a151ba29cdb65a83f89c19))
* **account-lib:** keyreg linting fix ([29f2cb5](https://github.com/BitGo/BitGoJS/commit/29f2cb5b4f150eab9870ec941589ba9553303775))
* **account-lib:** package json  fix ([dc14fc6](https://github.com/BitGo/BitGoJS/commit/dc14fc6b679590c08cdc6528c10e822158072cdf))
* **algo:** add algo token support ([740d064](https://github.com/BitGo/BitGoJS/commit/740d06493b76e82b16f7be746d623616d7082220))
* **core:** explain transaction for transfer builder and keyreg builder ([9ce76ef](https://github.com/BitGo/BitGoJS/commit/9ce76efdf5a51ebf6f334f8593b9367258b1d6e4))
* **core:** implement algo sign txn ([1af84ea](https://github.com/BitGo/BitGoJS/commit/1af84ea225e0d9d35b1d0ef52baf35dd1e0a526c))
* **statics:** add new tokens ([4c113d3](https://github.com/BitGo/BitGoJS/commit/4c113d3e1b6436b70f645454656801a6ceb9f725))


### Bug Fixes

* **account-lib:** yarn lock after revert ([f1b66b2](https://github.com/BitGo/BitGoJS/commit/f1b66b2959a41412b34c8f59c5981b43a139482b))
* change the token address for cqt ([1149bdc](https://github.com/BitGo/BitGoJS/commit/1149bdcfb02276556dea04e0ee84bdbfd4661713))
* **express:** use yarn to run commands installed at root ([4795b06](https://github.com/BitGo/BitGoJS/commit/4795b062c2f92d02053cfb931dbefc4daf579d00))
* **express:** use yarn to run commands installed at root ([3c2acef](https://github.com/BitGo/BitGoJS/commit/3c2acef7b72bfde1bfd6becfff4fb6d9349f0c02))
* keyreg type changed to wallet init ([78beac5](https://github.com/BitGo/BitGoJS/commit/78beac58d2dfb0dd13c41a1e8e884fca19cbe20c))
* **statics:** fix GDT contract ([12e8258](https://github.com/BitGo/BitGoJS/commit/12e8258428b371657c33794c4651f5a4d617f1a4))


### Reverts

* Revert "fix(account-lib): revert algorand tokens changes" ([cdb5539](https://github.com/BitGo/BitGoJS/commit/cdb5539bc0a68f6df112c7229c938b87f5bf6625))

## [11.16.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.16.0-rc.1...bitgo@11.16.0) (2021-06-15)

## [11.16.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.16.0-rc.0...bitgo@11.16.0-rc.1) (2021-06-15)


### Bug Fixes

* change the token address for cqt ([2c545da](https://github.com/BitGo/BitGoJS/commit/2c545dae350b84806ba66fb9455718602420e3f9))

## [11.16.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0...bitgo@11.16.0-rc.0) (2021-06-08)


### Features

* **account-lib:** add utility function to convert algo pk to addr ([b1348dd](https://github.com/BitGo/BitGoJS/commit/b1348dde965f255cf07977bb008c7ccb12fbf4ac))
* **algo:** bG-31598-Add-ALGO-Token-Support ([29eb2a0](https://github.com/BitGo/BitGoJS/commit/29eb2a0ff320cc83727a54fe8a932e25359c831d))


### Bug Fixes

* **account-lib:** revert algorand tokens changes ([b752c8c](https://github.com/BitGo/BitGoJS/commit/b752c8cdd47fbc0c30bf7b22e5352d8b5ef607c4))
* **express:** re-add `typescript` to express dev deps ([75c1601](https://github.com/BitGo/BitGoJS/commit/75c16011029a5de624363396a0047a3564ec85dd))
* **express:** use yarn to run build script ([e2b7cad](https://github.com/BitGo/BitGoJS/commit/e2b7cad4a8f8bf0273240d6a015839a97837c38e))

## [11.15.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.6...bitgo@11.15.0) (2021-06-07)


### Features

* **account-lib:** add keyreg builder ([f055d2d](https://github.com/BitGo/BitGoJS/commit/f055d2d928009a36edebb8c0fce53e3e998bbe62))
* **account-lib:** add support for decoding signed algo txns ([bcc4929](https://github.com/BitGo/BitGoJS/commit/bcc4929fe7f76a01d614a83a94b7744faafca889))
* add new token ([8a60853](https://github.com/BitGo/BitGoJS/commit/8a60853f3988faa1eedfce777cc40cb6244ae027))
* **eth:** update ethereumjs libs ([0bb3ada](https://github.com/BitGo/BitGoJS/commit/0bb3ada9eeb42aaa285dee277bf12ca49f5e4b6e))
* **statics:** update contract addresses ([db652bf](https://github.com/BitGo/BitGoJS/commit/db652bfa9d3cc1128a4ff04ebc07145ab97e508a))


### Bug Fixes

* **account-lib:** fix decode signed algo transaction ([fd82efe](https://github.com/BitGo/BitGoJS/commit/fd82efee18ab186b1d14d301a99fa803edaffa7f))
* **core:** stacks changed prv param type in StxSignTransactionOptions ([52138ea](https://github.com/BitGo/BitGoJS/commit/52138ead3ea1067706803c3fd6a7720e8cc8afbf))
* update freeze request to include sending params ([2b61a2a](https://github.com/BitGo/BitGoJS/commit/2b61a2a5869c5dc985eafb2368ea51bc233d54fe))

## [11.15.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.5...bitgo@11.15.0-rc.6) (2021-06-02)


### Features

* **account-lib:** add algo transfer builder ([89f238a](https://github.com/BitGo/BitGoJS/commit/89f238a39271674173f57e7b5feedd56b3acf7cf))
* **account-lib:** add algo txn validation methods to txn builder ([b43b8b2](https://github.com/BitGo/BitGoJS/commit/b43b8b2c7b76ab30b48cec5f7768beb7001e8ed0))
* **account-lib:** add implementation methods to txn builder ([102db02](https://github.com/BitGo/BitGoJS/commit/102db02a30cd4e74b061a91dd89e711519712810))
* **account-lib:** add method to retrieve algosdk suggested params ([fde7c33](https://github.com/BitGo/BitGoJS/commit/fde7c33856c7d1388d778ba230aa9f170afd4b6a))
* **account-lib:** add number of signers setter to algo ([d12a089](https://github.com/BitGo/BitGoJS/commit/d12a0898de2057eeacfa0ae47dbf48159426cd51))
* **account-lib:** add support for algo flat fees ([d7d0029](https://github.com/BitGo/BitGoJS/commit/d7d00294ccebb147c89152a3a0ba23ffe5122662))
* **account-lib:** enable offline transaction building for algo ([95f6f95](https://github.com/BitGo/BitGoJS/commit/95f6f957511fc0572311039b4ce8c324cd3211c8))
* **core:** export txEnumTypes from core ([ace20bb](https://github.com/BitGo/BitGoJS/commit/ace20bb3b01171c144dd577c216f6d3830800f09))
* **statics:** add support for several ERC20 tokens ([bfd95c2](https://github.com/BitGo/BitGoJS/commit/bfd95c2da0a2dc6acce093d0fa1e722a6d7a55db))


### Bug Fixes

* **account-lib:** fix validate algo address test ([801846d](https://github.com/BitGo/BitGoJS/commit/801846dad63010c53ff7e614f7ded1aea6e4c8e3))

## [11.15.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.4...bitgo@11.15.0-rc.5) (2021-05-25)


### Features

* **account-lib:** add algo transaction ([5d180bc](https://github.com/BitGo/BitGoJS/commit/5d180bcec8aaaac459a3257d31bacae7b73b40c3))
* **account-lib:** add setters for algo txn builder ([07ff195](https://github.com/BitGo/BitGoJS/commit/07ff195843c35862a86bdbd358a24c6039595053))
* **account-lib:** initial algorand keypair support ([fd00e5b](https://github.com/BitGo/BitGoJS/commit/fd00e5b204c08c73c5da3e60545f90d0b3c0257e))
* **core:** add stacking to explain tx ([d637154](https://github.com/BitGo/BitGoJS/commit/d637154d11e45f195bb0b75fd664a16338bd268c))
* **core:** implement support for auth v3 ([9de7ffa](https://github.com/BitGo/BitGoJS/commit/9de7ffa560f323f8c71821fe39ea631812d58a5b))
* **core:** stx sign tx multisig ([873b006](https://github.com/BitGo/BitGoJS/commit/873b006307bc394d73e699280e3a20fb6683dcfe))
* **utxo-lib:** use new package name and new external links ([3805eee](https://github.com/BitGo/BitGoJS/commit/3805eee8abc955b1d92da00c650c684e1662ac19))


### Bug Fixes

* **core:** allow paygo outputs for empty verification options object ([b20405c](https://github.com/BitGo/BitGoJS/commit/b20405c36fee2681aa974ff4e5f3c6f6cd3109f3))


### Reverts

* Revert "Revert "fix(core): use more correct edge case value in abstract utxo test"" ([5ca7405](https://github.com/BitGo/BitGoJS/commit/5ca7405acef847cd93269c671a60ce37274e34e4))
* Revert "Revert "feat(core): allow disabling paygo outputs during utxo tx verification"" ([85b7e1c](https://github.com/BitGo/BitGoJS/commit/85b7e1c6c82b7073ceea699973ea7ffdb2078b23))

## [11.15.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.3...bitgo@11.15.0-rc.4) (2021-05-21)


### Reverts

* Revert "feat(core): allow disabling paygo outputs during utxo tx verification" ([e6e4415](https://github.com/BitGo/BitGoJS/commit/e6e44154fec98078e635b30229a2df9b843304a4))
* Revert "fix(core): use more correct edge case value in abstract utxo test" ([baf01a3](https://github.com/BitGo/BitGoJS/commit/baf01a3c8882cafd200f38898b9bd46d7f70323f))

## [11.15.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.2...bitgo@11.15.0-rc.3) (2021-05-18)


### Bug Fixes

* **core:** algosdk typings ([80095b1](https://github.com/BitGo/BitGoJS/commit/80095b1d665282cf81d241f09364ec36c5b98a81))

## [11.15.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.1...bitgo@11.15.0-rc.2) (2021-05-18)


### Features

* **account-lib:** add latest version of algo-sdk ([871641c](https://github.com/BitGo/BitGoJS/commit/871641cd590f16d953b125c7a2d1bb377baac108))
* **account-lib:** add skeleton implementation for Algorand ([9ad5c60](https://github.com/BitGo/BitGoJS/commit/9ad5c60fd246e3d7dca0058d05f61ec0dce989f5))
* **core:** allow disabling paygo outputs during utxo tx verification ([db79e95](https://github.com/BitGo/BitGoJS/commit/db79e9500298563586a1febe1820ed245dda8fd7))
* **cspr:** update CSPR explorer URLs ([db7d1c1](https://github.com/BitGo/BitGoJS/commit/db7d1c1819d31632c8d2a89387003f944443362a))


### Bug Fixes

* **account-lib:** stx half sign tx ([0925fe4](https://github.com/BitGo/BitGoJS/commit/0925fe4018431f2b5db48620b8dbcc51267cecd0))
* **core:** bump account-lib version ([5491fd7](https://github.com/BitGo/BitGoJS/commit/5491fd708f0fb7702bb3e56f42a1037a782e6c60))
* **core:** use more correct edge case value in abstract utxo test ([63f9118](https://github.com/BitGo/BitGoJS/commit/63f9118081f5d357075223a64737f3ce71c93206))
* **trx:** asign trx builder acording to each transaction type ([3454ee1](https://github.com/BitGo/BitGoJS/commit/3454ee1f4d5f187d48fa4c4aeef5a9327d89e6ec))

## [11.15.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.15.0-rc.0...bitgo@11.15.0-rc.1) (2021-05-13)


### Features

* **core & account-lib:** adapt tron to receive data for a contract call ([8bbcac0](https://github.com/BitGo/BitGoJS/commit/8bbcac05215c6eb14edb103ea241f72ae934ec7e))

## [11.15.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0...bitgo@11.15.0-rc.0) (2021-05-11)


### Features

* **account-lib:** add verifySignature() for stx with test cases ([f9a8724](https://github.com/BitGo/BitGoJS/commit/f9a8724825f3e3b35b15dc77c8853fb5059aa368))
* **account-lib:** make chainname parameterizable in txBuilder ([2115d96](https://github.com/BitGo/BitGoJS/commit/2115d96da9299deb6490ee447612326be5d67a17))


### Bug Fixes

* **account-lib:** check accountId for null before accessing property ([b3639d8](https://github.com/BitGo/BitGoJS/commit/b3639d86f757d840bc6433cd9968d1158b75e2ec))

## [11.14.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.9...bitgo@11.14.0) (2021-05-05)

## [11.14.0-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.8...bitgo@11.14.0-rc.9) (2021-05-05)


### Features

* **statics:** add new ERC20 and Stellar Tokens ([bad95cc](https://github.com/BitGo/BitGoJS/commit/bad95cc3ecbc7283fd131e50c7275b5fc2532d3e))


### Bug Fixes

* **account-lib:** stacks multi sig issue ([253c46d](https://github.com/BitGo/BitGoJS/commit/253c46dce8b31dc19b9cb987fbcf339652edf39e))
* **express:** lock to y18n@^4.0.3 ([044da56](https://github.com/BitGo/BitGoJS/commit/044da56c6832492a83af07af77c4001521b8271b))
* **wrw recoveries:** enable unsigned sweeps for recovery of erc20 tokens ([0c108eb](https://github.com/BitGo/BitGoJS/commit/0c108eb7f26fd6a0d22ee7d3bbe743c8f8cf4c35))

## [11.14.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.7...bitgo@11.14.0-rc.8) (2021-05-01)


### Bug Fixes

* **account-lib:** fix CSPR address validation ([db92eb4](https://github.com/BitGo/BitGoJS/commit/db92eb45c69a37abd0a118194205208682ba32c8))

## [11.14.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.6...bitgo@11.14.0-rc.7) (2021-05-01)


### Bug Fixes

* **account-lib:** fix chain name used in CSPR transactions ([a54cdab](https://github.com/BitGo/BitGoJS/commit/a54cdab2126a0b81b66029aef8ce5684c107e192))

## [11.14.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.5...bitgo@11.14.0-rc.6) (2021-04-30)


### Bug Fixes

* **core:** add transferid to sendmany options ([d713f4a](https://github.com/BitGo/BitGoJS/commit/d713f4a015d8167d4658f76cbf58d62fd810cb50))
* **core:** hard code zcash transaction version ([5ff20c5](https://github.com/BitGo/BitGoJS/commit/5ff20c5b5ea491701e74288480dbb9f1e5020fcd))

## [11.14.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.4...bitgo@11.14.0-rc.5) (2021-04-30)


### Bug Fixes

* **core:** add transferid to list of valid tx params ([7e222db](https://github.com/BitGo/BitGoJS/commit/7e222dbfe0f1547ca28364c113e0a13b88bd6842))

## [11.14.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.3...bitgo@11.14.0-rc.4) (2021-04-30)


### Features

* **core:** implement parseTransaction for CSPR ([9a81b62](https://github.com/BitGo/BitGoJS/commit/9a81b62dc577bf8f99a48f26b741d7223ddd8971))
* **eth:** generalize chain id configuration ([e97a7ce](https://github.com/BitGo/BitGoJS/commit/e97a7ce9b0134545b18825fc6be3d65c5f5fb1b0))


### Bug Fixes

* **core:** transfer id is not stored to in mongodb in entries and coin specific ([17d44a6](https://github.com/BitGo/BitGoJS/commit/17d44a6ce192142608fcc41e4d5cc7e8c157c7b1))

## [11.14.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.2...bitgo@11.14.0-rc.3) (2021-04-29)


### Features

* **account-lib:** stx toBroadcastFormat does not prefix with 0x ([3d0749f](https://github.com/BitGo/BitGoJS/commit/3d0749f8be7749e89c84494a5db59b2647433273))
* **core:** add publicKeys optional param to stx's explainTransaction call options ([6581839](https://github.com/BitGo/BitGoJS/commit/6581839d4d0cebf97d8c770ac981290d4bb9ee48))

## [11.14.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.1...bitgo@11.14.0-rc.2) (2021-04-29)


### Bug Fixes

* **core:** fix address validation for casper ([f0ada2e](https://github.com/BitGo/BitGoJS/commit/f0ada2e99b244373dbc0050a26a0436120b5e7e7))

## [11.14.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.14.0-rc.0...bitgo@11.14.0-rc.1) (2021-04-29)


### Features

* **account-lib:** add transactionSize() to stx, for fee calculation ([9118362](https://github.com/BitGo/BitGoJS/commit/91183621307383192e8ebb359f1519e1e91ed5d1))

## [11.14.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.13.0...bitgo@11.14.0-rc.0) (2021-04-27)


### ⚠ BREAKING CHANGES

* **networks:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16466

### Features

* **account-lib:** fix multisig signing issue ([e445dc4](https://github.com/BitGo/BitGoJS/commit/e445dc475bcd8486d2bfab9559123cb6898d63c6))
* **src/coins:** add isSameCoin(Network, Network) ([e1dd2cb](https://github.com/BitGo/BitGoJS/commit/e1dd2cb597a0065295286da70177083e19371ec2))
* **test:** add test for test count ([f08ffdd](https://github.com/BitGo/BitGoJS/commit/f08ffddac4fb3cb95f73a4a1c9a0799930203870))


### Bug Fixes

* **account-lib:** use stable version of @bitgo/blake2b ([77d035a](https://github.com/BitGo/BitGoJS/commit/77d035acaa5ff9925a891075375c91db5158811e))
* add up-to-date node version support info to README ([6eb0962](https://github.com/BitGo/BitGoJS/commit/6eb0962a0469bafd151b7ab02940aae0ad97b857))
* **bufferutils:** remove pushdata re-exports ([f48669e](https://github.com/BitGo/BitGoJS/commit/f48669e57ef19c4592c12caaaea1d499f2a524d7))
* **bufferutils:** remove varInt functions ([84851f0](https://github.com/BitGo/BitGoJS/commit/84851f033fdd8274f917b4a8647f494def9b4a79))
* **core:** use mempool.space instead of earn.com for recovery fee ([5338f4e](https://github.com/BitGo/BitGoJS/commit/5338f4efda4b6b7705d9c1fb0d1a6914606b7314)), closes [#1126](https://github.com/BitGo/BitGoJS/issues/1126)
* do not not strip out null values from the stx transaction memo field ([e028517](https://github.com/BitGo/BitGoJS/commit/e0285172522aff9fd7b5b618b31b716c4d84bfbf))
* **networks:** BIP32 constants for litecoin ([69d0244](https://github.com/BitGo/BitGoJS/commit/69d0244b21df92098f8df80e91b69af74a2b8e2c)), closes [/github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp#L142-L143](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp/issues/L142-L143) [/github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp#L249-L250](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp/issues/L249-L250)
* **src/networks.js:** litecoinTest WIF prefix ([b08089a](https://github.com/BitGo/BitGoJS/commit/b08089a69e335f748139a6f4d209424adf65725b)), closes [/github.com/litecoin-project/litecoin/blob/1b6c4807/src/chainparams.cpp#L248](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/1b6c4807/src/chainparams.cpp/issues/L248)
* **test:** use `--recursive` in coverage ([49b2a0e](https://github.com/BitGo/BitGoJS/commit/49b2a0e5bb1bce5322edd9bd11cc5ccb4193bf1f))
* **utxo-lib:** remove trailing comma ([67dac1d](https://github.com/BitGo/BitGoJS/commit/67dac1d9e3d47352eab46b1ceccb203a7024718d))


### Reverts

* Revert "fix(core): set minimal required node version to 10.22.0" ([eec236f](https://github.com/BitGo/BitGoJS/commit/eec236f28c2d33647a329d253097222d1ab6fb35))
* Revert "travis: node 0.12 only" ([50a0d94](https://github.com/BitGo/BitGoJS/commit/50a0d94303b72f542c9c2cb67e6b15ae75c8ca6c))
* Revert "bufferutils: remove equal, use Buffer.compare" ([d7019e7](https://github.com/BitGo/BitGoJS/commit/d7019e7492e3675d9d90158e42a90808f11ef7c3))
* Revert "Add Justcoin Exchange to README.md" ([08634d4](https://github.com/BitGo/BitGoJS/commit/08634d4c33e190e46b0da8d9f39282f6f7ed78e2))
* **core:** proper fix found for the stx transaction memo field test ([ca0a29e](https://github.com/BitGo/BitGoJS/commit/ca0a29ef7a953d3665daced83e5982280b20f093))

## [11.13.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.13.0-rc.4...bitgo@11.13.0) (2021-04-22)


### Features

* **account-lib:** update casper sdk version ([b0bc77a](https://github.com/BitGo/BitGoJS/commit/b0bc77a2c59606e0dbd0ae25bbe15970af13fb37))
* **core:** add explainTransaction for STX ([b69cc82](https://github.com/BitGo/BitGoJS/commit/b69cc82ff66ce5bb10fe3b787b79f5dd923e75f7))
* **core:** add signTransactions method in stx ([bdd669f](https://github.com/BitGo/BitGoJS/commit/bdd669fbc67ae67696659c85ce8454cc59e919e7))
* **core:** implement verifyAddress for stx coin ([d0a11b9](https://github.com/BitGo/BitGoJS/commit/d0a11b981d74534a4571210e592e48c86f3fe7f3))
* **statics:** eRC20 Token Support ([062b09c](https://github.com/BitGo/BitGoJS/commit/062b09c8eef4bee05eadfb4eef6ab1999de20e07))


### Bug Fixes

* **core:** add a "memo" field to stx's explainTransaction's displayOrder ([be8c251](https://github.com/BitGo/BitGoJS/commit/be8c251fbfc3380ff1edcd310a070002efeb962a))

## [11.13.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.13.0-rc.3...bitgo@11.13.0-rc.4) (2021-04-14)


### Bug Fixes

* **core:** fix txPrebuild param in CSPR signTransaction method ([85cdc87](https://github.com/BitGo/BitGoJS/commit/85cdc87d6b09a6826b2a363503dc6f12313548ec))
* **ethlike:** add chainid to statics ([56a769e](https://github.com/BitGo/BitGoJS/commit/56a769e2fe9a9e7a1808d5a499941d42461d006e))

## [11.13.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.13.0-rc.2...bitgo@11.13.0-rc.3) (2021-04-12)

## [11.13.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.13.0-rc.0...bitgo@11.13.0-rc.2) (2021-04-12)


### Features

* **account-lib:** add from publicKey in stx contract buidler ([5e78a9d](https://github.com/BitGo/BitGoJS/commit/5e78a9df615d8a04a01f7cebc9d34954d2838b88))
* **account-lib:** add signMessage method ([1b16350](https://github.com/BitGo/BitGoJS/commit/1b16350ad7e4204cfec9f133a75eb74f88b6570d))


### Reverts

* Revert "2.0.0" - WASM too big to load sync in browser ([70db5d3](https://github.com/BitGo/BitGoJS/commit/70db5d328428aa2eba0c2b9738a47d23d138bb69))
* Revert "use sync wasm loading" ([a4b3217](https://github.com/BitGo/BitGoJS/commit/a4b32178ee94299416d28f0db65cc4a613c68f11))

## [11.13.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.12.0...bitgo@11.13.0-rc.0) (2021-04-08)


### Features

* **account-lib:** add fromPubKey in stx transactionBuilder ([ff7a534](https://github.com/BitGo/BitGoJS/commit/ff7a534e5b5e59b8fb31c52f4159f025fe6a7903))
* **account-lib:** add getSTXAddressFromPubKeys -- generate an address for multisig transactions ([b58d55e](https://github.com/BitGo/BitGoJS/commit/b58d55eea84055d9a5781f674afcfc398b38185b))
* **account-lib:** export AddressVersion and AddressHashMode for STX ([8779deb](https://github.com/BitGo/BitGoJS/commit/8779deb6737183b67340cc8de3e0ed3e8ab82f24))
* **account-lib:** sTX getSTXAddressFromPubKeys takes an optional AddressHashMode param ([7dc694d](https://github.com/BitGo/BitGoJS/commit/7dc694dab04c45f44d363c0b6938ec37ac3b78c0))
* **core:** add support for node 12, 14, 15 ([0085455](https://github.com/BitGo/BitGoJS/commit/0085455dd22640994db627877c23c48fc5c9e18f))
* **hbar:** add check for key length ([b516bd0](https://github.com/BitGo/BitGoJS/commit/b516bd0559fbeaaca5415b24d0ff289819c3bbf4))
* **hbar:** update HBAR lib and protobufs ([425dbe5](https://github.com/BitGo/BitGoJS/commit/425dbe534984dc6da442c5f680608ed61d13f252))
* **hbar:** update hbar sdk ([b4bef77](https://github.com/BitGo/BitGoJS/commit/b4bef77c18c1ccf6933b1a4f853416375b10c4f1))
* **statics:** add requires reserve ([28f4a6e](https://github.com/BitGo/BitGoJS/commit/28f4a6efefc8e71fb615eb5430dd4fc58b37dc21))


### Bug Fixes

* **hbar:** add new hashTx impl ([44498e3](https://github.com/BitGo/BitGoJS/commit/44498e37ee3a39a7537ce51ccbf61040e3ffd5bf))
* **hbar:** key validation ([113fa3c](https://github.com/BitGo/BitGoJS/commit/113fa3cbe0c5aa31acd6d93dbf22d9319a3749e4))
* **hbar:** modify validation for keys ([af57749](https://github.com/BitGo/BitGoJS/commit/af5774900d6bbc0a6a29020f11b68f532af2f12c))
* **hbar:** update test ([fadce41](https://github.com/BitGo/BitGoJS/commit/fadce418c188e895813d83c9a2ddb8009b458c74))

## [11.12.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.2-rc.2...bitgo@11.12.0) (2021-04-06)

### [11.11.2-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.2-rc.1...bitgo@11.11.2-rc.2) (2021-04-06)


### Features

* **account-lib:** add functions to validate and pad transactions memos for STX ([b8a8a85](https://github.com/BitGo/BitGoJS/commit/b8a8a8518023a7529f25361706c7d1f97c662383))
* **account-lib:** add stacks coin keypair + utils implementation ([97d413a](https://github.com/BitGo/BitGoJS/commit/97d413a2719296855558cccdf6ff44740dd860ad))
* **account-lib:** add stacks smart contracts ([8ea73c9](https://github.com/BitGo/BitGoJS/commit/8ea73c9db315c36ac6a531e3db131bffef2b1b91))
* **account-lib:** add stx to account-lib's coinBuilderMap ([2b9bffc](https://github.com/BitGo/BitGoJS/commit/2b9bffc07907e066ea1e22d46a5c02655a17c634))
* **account-lib:** add validations for contract name, address and function ([42d51a9](https://github.com/BitGo/BitGoJS/commit/42d51a97f7758473ad1c7f7b0bbec01ff590628b))
* **account-lib:** sTX's transaction builder checks if the provided memo string is valid ([c4c2fac](https://github.com/BitGo/BitGoJS/commit/c4c2fac63dbee5087851281afa97f7f8b86fc5d7))
* **statics:** add WETH and WBTC on tron ([5e2a631](https://github.com/BitGo/BitGoJS/commit/5e2a6316a48850b3a5df05018e768bf53b7573f2))
* **statics:** eRC20 Token Support ([ba2d870](https://github.com/BitGo/BitGoJS/commit/ba2d8707fff934fe5124163bd78e52bf9a1730da))


### Bug Fixes

* **account-lib:** merge-related changes (stacks renamed to stx, etc) ([64a9597](https://github.com/BitGo/BitGoJS/commit/64a9597e6eec4e230b0e4bfcb28021f66adcc18c))
* **core:** change stx implementation of generateKeyPair() to return xpub format ([c248936](https://github.com/BitGo/BitGoJS/commit/c2489363ba58680e8c60bc5189160dc04ca76caa))
* **core:** don't log wallet upon tx prebuild validation failure ([0c5c5c3](https://github.com/BitGo/BitGoJS/commit/0c5c5c3f097638629348e7104ddc66fa61ecf295))
* **core:** send `derivedFromParentWithSeed` when generating wallet ([b81f31d](https://github.com/BitGo/BitGoJS/commit/b81f31d1c7629e8b2eb74c9117ff74e15aabb6df))
* **core:** set minimal required node version to 10.22.0 ([53d5e26](https://github.com/BitGo/BitGoJS/commit/53d5e26d10f5b1f6c96db9a23300b0280ae8aed0))
* **core:** use `derivedFromParentWithSeed` from user keychain if present ([c55800e](https://github.com/BitGo/BitGoJS/commit/c55800e49b63da365a77ec22136fe53e1a229352))


### Reverts

* **core:** revert isValidPub test with extended keys; needs an account-lib update ([cad98a5](https://github.com/BitGo/BitGoJS/commit/cad98a5ee0c7b4ad7d27a5477c995325b06485c4))

### [11.11.2-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.2-rc.0...bitgo@11.11.2-rc.1) (2021-03-31)


### Features

* **account-lib:** add support for generating stx keypairs using extended public/private keys ([21f38cb](https://github.com/BitGo/BitGoJS/commit/21f38cb897497c38b4a64082749aafa47d60126f))
* **account-lib:** refactor casper addresses format ([cb8a30c](https://github.com/BitGo/BitGoJS/commit/cb8a30c47f199ef889946e411dfb8738e2621e55))
* **account-lib:** remove asynchronicity from some methods and improved jsdoc ([cb1636f](https://github.com/BitGo/BitGoJS/commit/cb1636f885a0ba752803ad4bc412cc6f68689755))


### Bug Fixes

* **core:** update yarn resolutions to temporarily resolve audit issues ([77feec3](https://github.com/BitGo/BitGoJS/commit/77feec3bcb71968f76e8b0ff7cbfc1ddc3b29d7a))
* **express:** don't store false when boolean flags are not given ([4194ae1](https://github.com/BitGo/BitGoJS/commit/4194ae17f91d1174f096aeb1a0a85819762b9ae8))
* reset core package json back to master ([5ad8684](https://github.com/BitGo/BitGoJS/commit/5ad86846805b94eec3f125f33a8579286c3fc7d8))

### [11.11.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.1...bitgo@11.11.2-rc.0) (2021-03-25)


### Bug Fixes

* **account-lib:** fix get account hash method ([e321c9c](https://github.com/BitGo/BitGoJS/commit/e321c9c077aef8a8d798cf6d77b1e47d4bd8efd1))
* **account-lib:** fix typo on json field ([3025e83](https://github.com/BitGo/BitGoJS/commit/3025e83071f56d3fc03621aeb14a5ce473f4573a))

### [11.11.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.1-rc.0...bitgo@11.11.1) (2021-03-25)


### Features

* **account-lib:** add DelegateBuilder and UndelegateBuilder ([6b7a083](https://github.com/BitGo/BitGoJS/commit/6b7a083818e51c5530ad4bc65bf08c22d83cea83))
* **account-lib:** add unit tests related to extended keys support ([d4841d2](https://github.com/BitGo/BitGoJS/commit/d4841d284fb87a2a9dee07ad04f912df6bd37820))
* **account-lib:** add verifySignature Method ([260edfc](https://github.com/BitGo/BitGoJS/commit/260edfcb32db05fefb75b426662fd30ce0601a8d))
* **account-lib:** refactor to control over minimum transfer amount ([2ae3ac1](https://github.com/BitGo/BitGoJS/commit/2ae3ac18bdde24909f4275f9b3796796cb9cd0c5))
* **statics:** add new token ([fdf96bb](https://github.com/BitGo/BitGoJS/commit/fdf96bbb368b7a58e04f48edabbdace552212913))


### Bug Fixes

* **core:** update statics version to latest ([2f8bc0d](https://github.com/BitGo/BitGoJS/commit/2f8bc0db4743df8b1b97207d92a9b123239dcaa1))
* **hbar:** add missing validateKeySignatures method ([870fc6e](https://github.com/BitGo/BitGoJS/commit/870fc6eb463f5c177a312163fac532ba5ceb5723))

### [11.11.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.0...bitgo@11.11.1-rc.0) (2021-03-19)


### Bug Fixes

* **core:** rename feeInfo param in explain tx method for Casper ([5b02e13](https://github.com/BitGo/BitGoJS/commit/5b02e13f735328087c6d1aac437089a789b221e1))


### Reverts

* Revert "feat: add STX coin to statics and core" ([90eee7b](https://github.com/BitGo/BitGoJS/commit/90eee7b247d8b05cada93104888097a13f681425))

## [11.11.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.0-rc.3...bitgo@11.11.0) (2021-03-18)

## [11.11.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.0-rc.2...bitgo@11.11.0-rc.3) (2021-03-18)


### Features

* add STX coin to statics and core ([9559b13](https://github.com/BitGo/BitGoJS/commit/9559b136ffe5e1c8ac6205a6f01f1d703f0e37e2))
* **core:** implement explain transaction method for Casper ([6a607ec](https://github.com/BitGo/BitGoJS/commit/6a607ec7370b6c799472a58df043452ee76fc10f))


### Bug Fixes

* **core:** add route name as tx type for consolidate/fanout ([b6c4733](https://github.com/BitGo/BitGoJS/commit/b6c4733ae942ed893772111400e1bb56593ca03a))


### Reverts

* don't initialize stx in the coinFactory just yet ([1ef2c5f](https://github.com/BitGo/BitGoJS/commit/1ef2c5febb8bc606fc7d51f807e0bb812b11ac58))

## [11.11.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.0-rc.1...bitgo@11.11.0-rc.2) (2021-03-16)


### Features

* **account-lib:** add stx coin (blockstack) and supporting utils ([a65b3eb](https://github.com/BitGo/BitGoJS/commit/a65b3eb47d60a5fd326dab1c75a0e736d94e12bc))
* **account-lib:** add transaction type argument ([3c112ed](https://github.com/BitGo/BitGoJS/commit/3c112ed9f5f16af799bfc57291fa252c375982fb))
* add log for xpub during tx signing ([c0bba72](https://github.com/BitGo/BitGoJS/commit/c0bba72de81e21223f03b0b6ea90782262fcab14))
* **core:** sign functions for casper ([9242aab](https://github.com/BitGo/BitGoJS/commit/9242aabaf3d362e03d341be1bfb924a23ed3b5e8))
* **eth:** build contract call transactions ([d6098fc](https://github.com/BitGo/BitGoJS/commit/d6098fcfcc1ff9657e6d85522c84af9fd3c10cd9))


### Bug Fixes

* **ci:** add signature to .drone.yml when it gets regenerated from the .drone.jsonnet ([00c80a9](https://github.com/BitGo/BitGoJS/commit/00c80a950682a214ff072aa36eb9c5f06cf5beb8))
* **ci:** ignore merge commits when checking commit messages ([b24707e](https://github.com/BitGo/BitGoJS/commit/b24707ee3a96304a0ab7a1f8c68f565f0309305f))
* use correct kovan testnet explorer urls ([e86723c](https://github.com/BitGo/BitGoJS/commit/e86723c46a22d2790bad7b43d8e6bc5feaa700ee))

## [11.11.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.11.0-rc.0...bitgo@11.11.0-rc.1) (2021-03-08)


### Features

* **account-lib:** add function to remove prefix from signature algorithm ([958003a](https://github.com/BitGo/BitGoJS/commit/958003aa58ce9ac7c38c6fe673967ac0ad0e1e72))
* **account-lib:** sign message and verify sign for casper ([80cfbb9](https://github.com/BitGo/BitGoJS/commit/80cfbb93395ac9e62ae5a770272c3b16068176c5))
* **express:** log request method and url upon failed request ([5a22ede](https://github.com/BitGo/BitGoJS/commit/5a22ede922509bd92fca09bf5be68dc3cff3445f))
* **modules/bls-dkg:** add BLS-DKG module ([124a18b](https://github.com/BitGo/BitGoJS/commit/124a18bbc42c02345e7cc10cf79737f2d0d6481d))


### Bug Fixes

* **account-lib:** fix addSignature method of cspr transaction ([ce00564](https://github.com/BitGo/BitGoJS/commit/ce005643424f5306a60e688306194cf14bb69846))
* **account-lib:** fix getTransferId method of cspr utils ([2d3d658](https://github.com/BitGo/BitGoJS/commit/2d3d658d17cc1f4e790ba3164b014df412b4ffff))
* **account-lib:** fix processSigning method of cspr transactionBuilder ([895c643](https://github.com/BitGo/BitGoJS/commit/895c643e7af72d311b92931deed8fcccf14f2752))
* **bls-dkg:** add publish config for public package ([c530435](https://github.com/BitGo/BitGoJS/commit/c530435a1ac863ee9d1e6b9d48b5bc73db101811))

## [11.11.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0...bitgo@11.11.0-rc.0) (2021-02-26)


### Features

* **trx account lib:** inputs and outputs complement ([be2d51f](https://github.com/BitGo/BitGoJS/commit/be2d51fcc03c9945c25cd7c48d10dc774f9acfad))


### Bug Fixes

* **account-lib:** bG-29930 Update and pin hashgraph sdk version ([5654e37](https://github.com/BitGo/BitGoJS/commit/5654e37b4500f7fe8c9e81d22a6ce9c2a1e76410))
* **account-lib:** fixed tobroadcastformat method ([8cf3353](https://github.com/BitGo/BitGoJS/commit/8cf335353dc0b9a9f0091ac7ced099cdddee4a35))
* **express:** update to typescript 4.2.2 ([460e898](https://github.com/BitGo/BitGoJS/commit/460e898edc30205f6b5edfa100b818c20a7af58b))

## [11.10.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.8...bitgo@11.10.0) (2021-02-24)

## [11.10.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.7...bitgo@11.10.0-rc.8) (2021-02-24)


### Features

* **core:** bG-29057: Add non participant keyreg transaction support for Algorand ([e6b36c4](https://github.com/BitGo/BitGoJS/commit/e6b36c4a1e7e1175d32d6b8396f1a2f29790c273))

## [11.10.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.6...bitgo@11.10.0-rc.7) (2021-02-24)


### Features

* **add tokens:** add tokens (lowcase) ([5c5612e](https://github.com/BitGo/BitGoJS/commit/5c5612e600bab01adc40c973696ed788ac679f2a))
* **trx account lib:** add contract call builder ([01137d2](https://github.com/BitGo/BitGoJS/commit/01137d2be9ce535dd30482cd5d143f335e3369e1))


### Bug Fixes

* **core:** improve logging when encountering prebuild validation error ([75ffd0c](https://github.com/BitGo/BitGoJS/commit/75ffd0c1f4c1df673201f04faa8815bdadecce9e))

## [11.10.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.5...bitgo@11.10.0-rc.6) (2021-02-23)


### Bug Fixes

* **core:** accountSet txn support ([2e3b236](https://github.com/BitGo/BitGoJS/commit/2e3b2368e5a19ef1fa5feae1a65f3091ca63e0f6))

## [11.10.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.4...bitgo@11.10.0-rc.5) (2021-02-22)


### Features

* **account-lib:** update casper sdk to version 20 ([34996e4](https://github.com/BitGo/BitGoJS/commit/34996e4879e966fb2511e20cccb84d01c96b24d6))


### Bug Fixes

* fix wei to gwei conversion ([89af10d](https://github.com/BitGo/BitGoJS/commit/89af10d710da3cf6e1b8fc4ffea593d386628b76))

## [11.10.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.3...bitgo@11.10.0-rc.4) (2021-02-19)


### Bug Fixes

* add more informative error msg ([4fbb634](https://github.com/BitGo/BitGoJS/commit/4fbb634e6bfaf707322a369ab70241956a770d76))
* fix Etherscan Testnet URL ([f83b5cd](https://github.com/BitGo/BitGoJS/commit/f83b5cd742149f81d2a9a2074f22d8aa812a964c))
* improve Etherscan Error Handling ([4e90aed](https://github.com/BitGo/BitGoJS/commit/4e90aedbf489e4accc0a0b96b4d222722321023c))

## [11.10.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.2...bitgo@11.10.0-rc.3) (2021-02-12)


### Features

* **account-lib:** add pub key validation and address validation for CSPR ([d4ec859](https://github.com/BitGo/BitGoJS/commit/d4ec8594d865640dcef677ca5b9d7564f0964073))
* **account-lib:** from implementation for transfer builder ([d9c85f5](https://github.com/BitGo/BitGoJS/commit/d9c85f534ddb6d0891724d975279bff244a11060))
* **account-lib:** implement isValidPrivateKey() method for CSPR ([c58d44a](https://github.com/BitGo/BitGoJS/commit/c58d44abc613f26d9497f2536009cf06cb9777fa))
* **account-lib:** stlx-1458 from implementation for wallet initialization ([94395dd](https://github.com/BitGo/BitGoJS/commit/94395dd8c371dbe6e43eadd4736d1172c9a77e70))
* **account-lib:** updated casper node version ([fa2d7f6](https://github.com/BitGo/BitGoJS/commit/fa2d7f65edf416231bd8d829ce7e33c2294b65f6))
* **account-lib:** updated casper sdk version to 1.0.19 ([13806da](https://github.com/BitGo/BitGoJS/commit/13806da99039c09a7d0e13a4b0a5651293c24874))

## [11.10.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.1...bitgo@11.10.0-rc.2) (2021-02-05)


### Features

* **account-lib:** stlx-793 implemented from implementation for transaction and transaction builder ([679c1af](https://github.com/BitGo/BitGoJS/commit/679c1af134a34ff8432817768e28e05971ccf06f))
* **statics:** add casper explorer url ([fcb3a55](https://github.com/BitGo/BitGoJS/commit/fcb3a55f4db605e4e475383719e90949e63682e9))


### Bug Fixes

* catch etherscan rate limit error ([d0b1b0f](https://github.com/BitGo/BitGoJS/commit/d0b1b0f4670695af7eebd41ff474d3d9edcacc74))
* check account properties before using ([9d2457f](https://github.com/BitGo/BitGoJS/commit/9d2457fb62bbf6079f55cb0125b4d714dd9cf2d7))
* fix EOS testnet fullnode URLs ([55cb375](https://github.com/BitGo/BitGoJS/commit/55cb37526bdf80c431392f8a1a6af9dad01d3be8))
* fix failing unit test nocks ([c5fb6e3](https://github.com/BitGo/BitGoJS/commit/c5fb6e30fccb2799cda730504e18806576f01290))
* wait a second between 2 subsequent API calls ([62ec37d](https://github.com/BitGo/BitGoJS/commit/62ec37daba171cfc3bb5c97c19b58bb6d3e230c6))
* **wallet-platform:** whitelist messageKey param ([081e486](https://github.com/BitGo/BitGoJS/commit/081e486cc9b64cc3ba568bce6aec675f5f2e3ea6))

## [11.10.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.10.0-rc.0...bitgo@11.10.0-rc.1) (2021-02-03)


### Bug Fixes

* enable TEST token for testnet ofc ([bfe12c6](https://github.com/BitGo/BitGoJS/commit/bfe12c670ab879c445103a2d62e7202b6d32aeef))

## [11.10.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2...bitgo@11.10.0-rc.0) (2021-02-02)


### Features

* **account-lib:** update the casper-client-sdk dependency to v1.0.16 ([a97e235](https://github.com/BitGo/BitGoJS/commit/a97e235e267521a729fb5b87802764ee7b97ed40))
* **core:** add compatibility for @bitgo/utxo-lib 1.9.x ([1bbc4df](https://github.com/BitGo/BitGoJS/commit/1bbc4dfd6caa51acf69f39a46e7e6b901d6184cf))


### Bug Fixes

* **core:** run tests against btg ([2805bd5](https://github.com/BitGo/BitGoJS/commit/2805bd56cfdba8ef33db66a2ba5e79c5ab1f91f4))
* **express:** always prefer command line arguments to env var args ([b8aeee1](https://github.com/BitGo/BitGoJS/commit/b8aeee132658c0839ede81b1da6bf48609a12069))

### [11.9.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.8...bitgo@11.9.2) (2021-01-29)

### [11.9.2-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.7...bitgo@11.9.2-rc.8) (2021-01-29)


### Features

* **account lib:** stlx-657 implemented wallet initialization builder ([b6e5a02](https://github.com/BitGo/BitGoJS/commit/b6e5a0215137e63b30bd75206651094b1cc8fe6a))
* **express:** add support for binding to an IPC socket (unix socket) ([b76c16c](https://github.com/BitGo/BitGoJS/commit/b76c16ca6d104b4fe6e47146a7c2e2a028552945))
* **express:** add support for returning keychains with generated wallet ([e04de53](https://github.com/BitGo/BitGoJS/commit/e04de5313ca418670c900e423a434ce2b6cf9a84))


### Bug Fixes

* **bitgojs:** fix security audit build failure ([347cc22](https://github.com/BitGo/BitGoJS/commit/347cc227f11b6efb5f5eed0277d41d2921e0ba94))
* don't run unit tests on node 8 ([7fa7510](https://github.com/BitGo/BitGoJS/commit/7fa7510bf2107e540d2e2975b5ea0578717509b5))
* **express:** log bitgo-express and bitgojs versions on error ([f21178f](https://github.com/BitGo/BitGoJS/commit/f21178f8dc40a8d93895463823acbe5bd320ba5d))
* **statics:** fix etc statics ([4970253](https://github.com/BitGo/BitGoJS/commit/497025350595716c21d77bf5e1c420abc3bc6851))

### [11.9.2-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.6...bitgo@11.9.2-rc.7) (2021-01-28)


### Features

* add new tokens ([7027f50](https://github.com/BitGo/BitGoJS/commit/7027f50da97e885eb5c068d339a65953da255f04))


### Bug Fixes

* fix 1inch in coins.ts ([ef338c9](https://github.com/BitGo/BitGoJS/commit/ef338c907f5ca78851ea0b39a7b97c34fd381d0e))
* remove non existing testnet OFC tokens and fix asset for TERC ([a70860e](https://github.com/BitGo/BitGoJS/commit/a70860e16fcdf831c589a38b6479657d7eea0344))

### [11.9.2-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.5...bitgo@11.9.2-rc.6) (2021-01-27)


### Features

* **account lib:** implemented happy path for transfer transaction ([61f3bd5](https://github.com/BitGo/BitGoJS/commit/61f3bd5124ac7d2532726ec07975e5f6f545566e))
* **account-lib:** added UT over transaction ([4687e16](https://github.com/BitGo/BitGoJS/commit/4687e16083f7600a9fe3b5d62778b79a7542ce95))
* **account-lib:** refactor after code review ([27761f5](https://github.com/BitGo/BitGoJS/commit/27761f5c2e72a4a284959630cd6821d0e07e77b9))
* **account-lib:** refactor and added missing unit test ([33bae36](https://github.com/BitGo/BitGoJS/commit/33bae3646e26ebd131f3c6e0a5a84f3f3e4bbec2))
* **account-lib:** refactor code after code review ([a0d13b4](https://github.com/BitGo/BitGoJS/commit/a0d13b4bb587ef6f7b23dbcd5588e3230caded5e))
* **account-lib:** refactor due to pull request review suggestions ([e30a6ea](https://github.com/BitGo/BitGoJS/commit/e30a6eaefc1e780dab2b6d66d048fc4e75d28f6d))
* **account-lib:** update casper-client-sdk lib version ([5f74054](https://github.com/BitGo/BitGoJS/commit/5f740548b5292dbccf478837aa48083cf5ac4e0b))
* **recovery:** cusomize gasPrice and gasLimit ([f777ba8](https://github.com/BitGo/BitGoJS/commit/f777ba842f69d11fb77254cfb8cc4f89e83eafbd))

### [11.9.2-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.4...bitgo@11.9.2-rc.5) (2021-01-21)


### Bug Fixes

* **core:** fix wallet creation for CSPR ([667917e](https://github.com/BitGo/BitGoJS/commit/667917e9b41690eb7b501419d2890857bcf453e7))
* remove ripple-lib due to node issues ([ecf34a4](https://github.com/BitGo/BitGoJS/commit/ecf34a4b2402799b77b641172832357a45b6a8aa))

### [11.9.2-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.3...bitgo@11.9.2-rc.4) (2021-01-20)


### Bug Fixes

* adds wallet version support in core ([f76e71a](https://github.com/BitGo/BitGoJS/commit/f76e71a8f8b492155500ad2f429a95f7310ca897))

### [11.9.2-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.2...bitgo@11.9.2-rc.3) (2021-01-14)


### Features

* **support flush coins:** support flushing coins ([2afcddf](https://github.com/BitGo/BitGoJS/commit/2afcddffd762d9e50343b234b736735eb23c6990))

### [11.9.2-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.1...bitgo@11.9.2-rc.2) (2021-01-12)


### Bug Fixes

* **core:** fix import for Bluebird library on cspr ([324c484](https://github.com/BitGo/BitGoJS/commit/324c4845f8da8e0e4150ec60e22b9fd0394130c6))

### [11.9.2-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.2-rc.0...bitgo@11.9.2-rc.1) (2021-01-11)


### Features

* **core:** added cspr and tcspr to core module ([c7dd309](https://github.com/BitGo/BitGoJS/commit/c7dd30979e1ab222540949d2b9a0913742f51503))

### [11.9.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.1...bitgo@11.9.2-rc.0) (2021-01-04)


### Features

* **eth:** add batcher ([cc4dfc3](https://github.com/BitGo/BitGoJS/commit/cc4dfc3ccdf9f845ef132a5efe36fb0dd05315ef))
* **eth:** pass forwarderVersion flag ([9b56ab9](https://github.com/BitGo/BitGoJS/commit/9b56ab9321a3f53dcf5c7c8fc363cd7ac1b5df13))

### [11.9.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.1-rc.4...bitgo@11.9.1) (2020-12-28)

### [11.9.1-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.1-rc.3...bitgo@11.9.1-rc.4) (2020-12-22)


### Features

* implement keypair generation for casper in account-lib ([e944601](https://github.com/BitGo/BitGoJS/commit/e944601dda6182d9a2331ae2138de10afc3221cb))

### [11.9.1-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.1-rc.2...bitgo@11.9.1-rc.3) (2020-12-22)


### Features

* add new tokens ([69b320e](https://github.com/BitGo/BitGoJS/commit/69b320e5bde0724e353d2cb710b3a358808100b8))
* add SIH ([2cbd5b4](https://github.com/BitGo/BitGoJS/commit/2cbd5b4cb9c1ec01cbd8da408ecbe1406f70e17e))
* update secp256k1 in core to ^4 ([bfb3128](https://github.com/BitGo/BitGoJS/commit/bfb3128131b19d07540174e6c250ae3b353ecd54))


### Bug Fixes

* **account-lib:** change statics version back to ^6.0.0 ([49f0a02](https://github.com/BitGo/BitGoJS/commit/49f0a02273ce1d6b0881bfa4a05eb8743780326f))
* **express:** update lodash and ini to fix npm audit issues ([36c3d0b](https://github.com/BitGo/BitGoJS/commit/36c3d0b3a68d86772a6b1a872dde398ca53dec84))
* **release:** upgrade lerna to 3.21.0 ([ae6ff7e](https://github.com/BitGo/BitGoJS/commit/ae6ff7eade463ee95fec03460f5a1a552740a9cb))
* **statics:** fix typo on testnet casper coin ([86488dd](https://github.com/BitGo/BitGoJS/commit/86488ddcc139eca3945d15c639ea9e63b9b5965e))

### [11.9.1-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.1-rc.1...bitgo@11.9.1-rc.2) (2020-12-14)


### Features

* **accountlib:** add new casper coin skeleton structure ([9163b22](https://github.com/BitGo/BitGoJS/commit/9163b22b2edb8baa8c54c381b4857fac46b7e646))


### Bug Fixes

* **eth2:** fix eth2 lib initialization and key signatures ([d171404](https://github.com/BitGo/BitGoJS/commit/d1714044bef8afe3f8b9166dc49f28ef3451bda8))
* fixed consolidation and added express route ([81a4c6d](https://github.com/BitGo/BitGoJS/commit/81a4c6d1763feea6432bf7d564e41c8eb125eff9))

### [11.9.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.1-rc.0...bitgo@11.9.1-rc.1) (2020-12-10)


### Features

* **eth2:** add signMessage for ETH2 ([afbbcb2](https://github.com/BitGo/BitGoJS/commit/afbbcb2738002def0e48d06138a550b28a9b8a86))


### Bug Fixes

* replace sed with js function for replacing unsafe evals ([f8c089a](https://github.com/BitGo/BitGoJS/commit/f8c089ae10b8732565fbc8ed1a9209c7b7ac42ec))

### [11.9.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.0...bitgo@11.9.1-rc.0) (2020-12-09)


### Bug Fixes

* **express:** remove gcompat, switch to alpine build container ([d4a9cca](https://github.com/BitGo/BitGoJS/commit/d4a9ccab1b3c6773c1d81503bd55c7376f40f8db))
* fix signing for Tezos ([290df65](https://github.com/BitGo/BitGoJS/commit/290df6525095a7f4e5cad6a634202197fa16c5c5))

## [11.9.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.0-rc.2...bitgo@11.9.0) (2020-12-08)

## [11.9.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.0-rc.1...bitgo@11.9.0-rc.2) (2020-12-08)


### Features

* add eth2 to statics ([61665a3](https://github.com/BitGo/BitGoJS/commit/61665a3cdb2ba4a3700a3cc9baa803abdd17c6bf))
* **remove fee address config from eth2 statics:** remove fee address config from eth2 statics ([38f0b40](https://github.com/BitGo/BitGoJS/commit/38f0b4019f22d7d72b3533a7ebac9127f7bf8686))
* resolve failing keycurve tests ([63702af](https://github.com/BitGo/BitGoJS/commit/63702afd782f7a85e2eaf55b344c63a992bb71e4))

## [11.9.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.9.0-rc.0...bitgo@11.9.0-rc.1) (2020-12-04)


### Features

* **statics:** add Casper coin configuration to Statics ([f744b95](https://github.com/BitGo/BitGoJS/commit/f744b95b720aae1e1ddbd55a9bae5028f75e8b6a))


### Bug Fixes

* change automated commit message to be conventional-commits compatible ([d824782](https://github.com/BitGo/BitGoJS/commit/d8247827775261f7b9ba3fe917751aec169c905b))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([0c835b8](https://github.com/BitGo/BitGoJS/commit/0c835b8d010c1cd3f843daf8dfeb6fc74d71c459))
* **express:** use gcompat instead of libc6-compat ([4636f8d](https://github.com/BitGo/BitGoJS/commit/4636f8df7dd0bfe15e8e736d8029b08f4a55d5c1))

## [11.9.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0...bitgo@11.9.0-rc.0) (2020-11-21)


### Features

* add bls initialization ([f7fe3d4](https://github.com/BitGo/BitGoJS/commit/f7fe3d42be5e3e98327e346fbc57b151a826124c))
* adds eth2 coin controller in core ([8c74388](https://github.com/BitGo/BitGoJS/commit/8c74388eba50df6ce853c80cb5291e6627a94251))
* feat: add pubkey aggregation ([7259779](https://github.com/BitGo/BitGoJS/commit/725977910f265d4d8726c153ed4b761a1a17437d))


### Bug Fixes

* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([1b96bfe](https://github.com/BitGo/BitGoJS/commit/1b96bfec6c8ccc3f68ec253595dd07e523bd10ef))
* **express:** add libc6-compat alpine package to provide ld-linux-x86-64.so.2 ([58ea46e](https://github.com/BitGo/BitGoJS/commit/58ea46ecafa13766be26e25ad8a8fbc8b06b1f9f))
* **express:** remove gcompat, switch to alpine build container ([969dd49](https://github.com/BitGo/BitGoJS/commit/969dd4913ad5f26c9e2b1a9e823412cce2c6c27f))
* **express:** use gcompat instead of libc6-compat ([df5f84b](https://github.com/BitGo/BitGoJS/commit/df5f84bdc02a65c22097680d072553e079997fdc))
* **express:** use gcompat instead of libc6-compat ([e72b9b9](https://github.com/BitGo/BitGoJS/commit/e72b9b9b7b213ceb5aaf5bb985ba30a498280df4))

## [11.8.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.6...bitgo@11.8.0) (2020-11-19)

## [11.8.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.5...bitgo@11.8.0-rc.6) (2020-11-18)


### Features

* adds new tokens ([0607785](https://github.com/BitGo/BitGoJS/commit/06077852a6e97b27265826e4d877bcc53fffb3cf))


### Bug Fixes

* add to base and changes for prettify ([95035a8](https://github.com/BitGo/BitGoJS/commit/95035a82193f5c2a722463c948386723b9afb43a))

## [11.8.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.4...bitgo@11.8.0-rc.5) (2020-11-17)


### Bug Fixes

* update ZEC consensusBranchId for Caopy hardfork ~Nov 18 2020 ([574a7c7](https://github.com/BitGo/BitGoJS/commit/574a7c77accc8182f30e7385859e57ed82864538))

## [11.8.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.3...bitgo@11.8.0-rc.4) (2020-11-12)


### Features

* adds BLS key generation to account-lib. Used for ETH2 ([9fc8583](https://github.com/BitGo/BitGoJS/commit/9fc8583649b567b6b41a5ea18d536291caaf8ea0))
* make SDK derive key with address path for Tezos signing ([92ad147](https://github.com/BitGo/BitGoJS/commit/92ad1474ceaf7d43530a0581e76e43f5a38f2a01))

## [11.8.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.2...bitgo@11.8.0-rc.3) (2020-11-10)


### Features

* add BCH coin and recovery ([a74b877](https://github.com/BitGo/BitGoJS/commit/a74b877a14ab46b2bcf0955e60fbab6db4f5c302))


### Bug Fixes

* address review comments ([261bc0a](https://github.com/BitGo/BitGoJS/commit/261bc0a062756e98897edfc3e2494e6ed1cb7574))
* **config:** add BSV and BCHA as recoverable coin with coincover ([76f7b40](https://github.com/BitGo/BitGoJS/commit/76f7b40e93dfbe59307e180317a2b5f94f06087e))
* **statics:** delete invalid testnet URL ([77ae3ab](https://github.com/BitGo/BitGoJS/commit/77ae3ab434fcc05c16b44126ad46833cd6053533))

## [11.8.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.1...bitgo@11.8.0-rc.2) (2020-11-03)


### Bug Fixes

* hard-code current ZEC consensus branch ID using updated utxo-lib ([93798ba](https://github.com/BitGo/BitGoJS/commit/93798ba3629dcfdb7440778c1dcb3c09ab578bae))
* update test for ZEC ([e17eea0](https://github.com/BitGo/BitGoJS/commit/e17eea0eeeca90909783e92fef021b364ee66283))
* update utxo-lib to published version 1.7.3 ([1798510](https://github.com/BitGo/BitGoJS/commit/1798510690766438e4faa30bbb0c3f4188d99e91))

## [11.8.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.8.0-rc.0...bitgo@11.8.0-rc.1) (2020-10-29)


### Bug Fixes

* add new tokens ([c1db855](https://github.com/BitGo/BitGoJS/commit/c1db855ac2a0a970b4052adab86a3c261760c577))

## [11.8.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0...bitgo@11.8.0-rc.0) (2020-10-22)


### Features

* Fix CELO token transactionBuilder ([15b951a](https://github.com/BitGo/BitGoJS/commit/15b951a3b4a35b11e1cdafc5e98efffa8def729e))

## [11.7.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.6...bitgo@11.7.0) (2020-10-21)

## [11.7.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.5...bitgo@11.7.0-rc.6) (2020-10-15)

## [11.7.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.4...bitgo@11.7.0-rc.5) (2020-10-13)

## [11.7.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.3...bitgo@11.7.0-rc.4) (2020-10-13)

## [11.7.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.2...bitgo@11.7.0-rc.3) (2020-10-09)

## [11.7.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.1...bitgo@11.7.0-rc.2) (2020-10-07)

## [11.7.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.7.0-rc.0...bitgo@11.7.0-rc.1) (2020-10-06)

## [11.7.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.6.0...bitgo@11.7.0-rc.0) (2020-09-28)

## [11.6.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.5.1-rc.2...bitgo@11.6.0) (2020-09-25)

### [11.5.1-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.5.1-rc.1...bitgo@11.5.1-rc.2) (2020-09-23)

### [11.5.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.5.1-rc.0...bitgo@11.5.1-rc.1) (2020-09-21)

### [11.5.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.5.0...bitgo@11.5.1-rc.0) (2020-09-16)

## [11.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.22...bitgo@11.5.0) (2020-09-15)

### [11.4.1-rc.22](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.21...bitgo@11.4.1-rc.22) (2020-09-14)

### [11.4.1-rc.21](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.20...bitgo@11.4.1-rc.21) (2020-09-14)

### [11.4.1-rc.20](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.19...bitgo@11.4.1-rc.20) (2020-09-10)

### [11.4.1-rc.19](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.18...bitgo@11.4.1-rc.19) (2020-09-01)

### [11.4.1-rc.18](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.17...bitgo@11.4.1-rc.18) (2020-08-28)

### [11.4.1-rc.17](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.16...bitgo@11.4.1-rc.17) (2020-08-26)

### [11.4.1-rc.16](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.15...bitgo@11.4.1-rc.16) (2020-08-26)


### Reverts

* Revert "Fixed toJson usage in core module" ([c029984](https://github.com/BitGo/BitGoJS/commit/c0299847d72c4b0a744fb6a4cce40708bb226d34))
* Revert "BGA-297 Compose transaction/transactionBuilder for HBAR using" ([9a38f4d](https://github.com/BitGo/BitGoJS/commit/9a38f4dbdb450dbdeff8a1d29549b43de58a6424))
* Revert "BGA-324 Update toJson method" ([43170e2](https://github.com/BitGo/BitGoJS/commit/43170e2a4d702af1fd228476fea720ef25bbcb0a))
* Revert "BGA-324 Set body to be mandatory" ([8201971](https://github.com/BitGo/BitGoJS/commit/8201971ddd696bf361056ff59aecd79def28f928))

### [11.4.1-rc.15](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.14...bitgo@11.4.1-rc.15) (2020-08-24)

### [11.4.1-rc.14](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.13...bitgo@11.4.1-rc.14) (2020-08-21)

### [11.4.1-rc.13](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.12...bitgo@11.4.1-rc.13) (2020-08-19)

### [11.4.1-rc.12](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.10...bitgo@11.4.1-rc.12) (2020-08-18)

### [11.4.1-rc.10](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.9...bitgo@11.4.1-rc.10) (2020-08-12)

### [11.4.1-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.8...bitgo@11.4.1-rc.9) (2020-08-10)

### [11.4.1-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.7...bitgo@11.4.1-rc.8) (2020-08-05)

### [11.4.1-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.6...bitgo@11.4.1-rc.7) (2020-08-05)

### [11.4.1-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.3...bitgo@11.4.1-rc.6) (2020-08-05)

### [11.4.1-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.2...bitgo@11.4.1-rc.3) (2020-07-28)

### [11.4.1-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.1...bitgo@11.4.1-rc.2) (2020-07-27)

### [11.4.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.1-rc.0...bitgo@11.4.1-rc.1) (2020-07-23)

### [11.4.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0...bitgo@11.4.1-rc.0) (2020-07-23)

## [11.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.10...bitgo@11.4.0) (2020-07-21)

## [11.4.0-rc.10](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.9...bitgo@11.4.0-rc.10) (2020-07-21)

## [11.4.0-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.8...bitgo@11.4.0-rc.9) (2020-07-21)

## [11.4.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.7...bitgo@11.4.0-rc.8) (2020-07-16)

## [11.4.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.6...bitgo@11.4.0-rc.7) (2020-07-15)

## [11.4.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.5...bitgo@11.4.0-rc.6) (2020-07-14)

## [11.4.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.4...bitgo@11.4.0-rc.5) (2020-07-13)

## [11.4.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.3...bitgo@11.4.0-rc.4) (2020-07-09)

## [11.4.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.2...bitgo@11.4.0-rc.3) (2020-07-09)

## [11.4.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.1...bitgo@11.4.0-rc.2) (2020-07-09)


### Features

* **Tron TransactionBuilder:** validateKey ([b42e67e](https://github.com/BitGo/BitGoJS/commit/b42e67e8f4dab69ef9984f539db12e84e0edb3da))


### Bug Fixes

* Test case should throw exception ([4b5b0b2](https://github.com/BitGo/BitGoJS/commit/4b5b0b25939c6f20a5ae794a692c1c63e9ef875c))
* Validation is a part of builder ([641810b](https://github.com/BitGo/BitGoJS/commit/641810b7cce14ab34268fde7d93893d04b158ede))


### Reverts

* Revert "Fix: Validation is a part of builder" ([10f990e](https://github.com/BitGo/BitGoJS/commit/10f990e681ccea2a543ff631a8972a69df56b985))

## [11.4.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.4.0-rc.0...bitgo@11.4.0-rc.1) (2020-07-07)

## [11.4.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.1-rc.0...bitgo@11.4.0-rc.0) (2020-07-07)

### [11.3.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.0...bitgo@11.3.1-rc.0) (2020-07-02)

## [11.3.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.0-rc.4...bitgo@11.3.0) (2020-06-30)

## [11.3.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.0-rc.3...bitgo@11.3.0-rc.4) (2020-06-26)

## [11.3.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.0-rc.2...bitgo@11.3.0-rc.3) (2020-06-24)

## [11.3.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.0-rc.1...bitgo@11.3.0-rc.2) (2020-06-23)

## [11.3.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.3.0-rc.0...bitgo@11.3.0-rc.1) (2020-06-19)

## [11.3.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.2.1-rc.1...bitgo@11.3.0-rc.0) (2020-06-17)

### [11.2.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.2.1-rc.0...bitgo@11.2.1-rc.1) (2020-06-17)

### [11.2.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.2.0...bitgo@11.2.1-rc.0) (2020-06-17)

## [11.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.2.0-rc.0...bitgo@11.2.0) (2020-06-15)

## [11.2.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.3...bitgo@11.2.0-rc.0) (2020-06-11)

### [11.1.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.3-rc.3...bitgo@11.1.3) (2020-06-04)

### [11.1.3-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.3-rc.2...bitgo@11.1.3-rc.3) (2020-06-04)

### [11.1.3-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.3-rc.1...bitgo@11.1.3-rc.2) (2020-06-01)

### [11.1.3-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.3-rc.0...bitgo@11.1.3-rc.1) (2020-06-01)

### [11.1.3-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.2...bitgo@11.1.3-rc.0) (2020-05-29)


### Reverts

* Revert "Update lerna to fix yarn audit finding" ([4710597](https://github.com/BitGo/BitGoJS/commit/4710597bdeef8058ace4128d89c4edfd0419f878))

### [11.1.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.2-rc.0...bitgo@11.1.2) (2020-05-20)

### [11.1.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.1...bitgo@11.1.2-rc.0) (2020-05-20)

### [11.1.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.1-rc.1...bitgo@11.1.1) (2020-05-12)

### [11.1.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.1-rc.0...bitgo@11.1.1-rc.1) (2020-05-12)

### [11.1.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.0...bitgo@11.1.1-rc.0) (2020-05-12)

## [11.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.1.0-rc.0...bitgo@11.1.0) (2020-05-08)

## [11.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.3...bitgo@11.1.0-rc.0) (2020-05-08)

### [11.0.3](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.3-rc.0...bitgo@11.0.3) (2020-04-13)

### [11.0.3-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.2...bitgo@11.0.3-rc.0) (2020-04-09)

### [11.0.2](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.2-rc.0...bitgo@11.0.2) (2020-04-09)

### [11.0.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.1...bitgo@11.0.2-rc.0) (2020-04-06)

### [11.0.1](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.1-rc.0...bitgo@11.0.1) (2020-03-31)

### [11.0.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.0...bitgo@11.0.1-rc.0) (2020-03-31)

## [11.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@11.0.0-rc.0...bitgo@11.0.0) (2020-03-24)

## [11.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@10.0.0...bitgo@11.0.0-rc.0) (2020-03-23)

## [10.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@10.0.0-rc.2...bitgo@10.0.0) (2020-03-20)

## [10.0.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@10.0.0-rc.1...bitgo@10.0.0-rc.2) (2020-03-17)

## [10.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@10.0.0-rc.0...bitgo@10.0.0-rc.1) (2020-03-16)

## [10.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.2...bitgo@10.0.0-rc.0) (2020-03-16)

### [9.6.2](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.2-rc.0...bitgo@9.6.2) (2020-03-12)

### [9.6.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.1...bitgo@9.6.2-rc.0) (2020-03-11)

### [9.6.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.1-rc.0...bitgo@9.6.1) (2020-03-10)

### [9.6.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.0...bitgo@9.6.1-rc.0) (2020-03-09)

## [9.6.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.0-rc.1...bitgo@9.6.0) (2020-03-03)

## [9.6.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.6.0-rc.0...bitgo@9.6.0-rc.1) (2020-02-26)

## [9.6.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.3...bitgo@9.6.0-rc.0) (2020-02-24)

### [9.5.3](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.2...bitgo@9.5.3) (2020-02-14)

### [9.5.2](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.2-rc.0...bitgo@9.5.2) (2020-02-11)

### [9.5.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.1...bitgo@9.5.2-rc.0) (2020-02-06)


### Bug Fixes

* **core:** Recreate XLM integration test wallets ([4603039](https://github.com/BitGo/BitGoJS/commit/4603039131900c6405d845c307156298fdaf3386))
* **express:** Deprecate older forms of environment variable config ([2c88e69](https://github.com/BitGo/BitGoJS/commit/2c88e69983acea4da9b09994f38d49c99a73548c))

### [9.5.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.1-rc.0...bitgo@9.5.1) (2020-02-04)

### [9.5.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.0...bitgo@9.5.1-rc.0) (2020-01-31)

### [9.4.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.1-rc.0...bitgo@9.4.1) (2020-01-21)

### [9.4.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.0...bitgo@9.4.1-rc.0) (2020-01-17)

## [9.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.5.0-rc.0...bitgo@9.5.0) (2020-01-29)

## [9.5.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.1...bitgo@9.5.0-rc.0) (2020-01-24)


### Bug Fixes

* **test:** remove illegal use of `bufferutils` ([4bb33a1](https://github.com/BitGo/BitGoJS/commit/4bb33a19e28f7351b0040fb2eee8ac898a7e3e8c)), closes [/github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f#diff-73e64645f9c04dc17e67b782cb9342](https://github.com/BitGo//github.com/BitGo/bitgo-utxo-lib/commit/29a865788d30b8b776cc1a1a2fd042d70085ec5f/issues/diff-73e64645f9c04dc17e67b782cb9342)

### [9.4.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.1-rc.0...bitgo@9.4.1) (2020-01-21)

### [9.4.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.0...bitgo@9.4.1-rc.0) (2020-01-17)


### ⚠ BREAKING CHANGES

* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992
* **statics:** While this is a breaking change, I don't think these values were
actually used anywhere.

Issue: BG-16992

### Bug Fixes

* **core:** Rename import instead of colliding with declared interface ([8b55707](https://github.com/BitGo/BitGoJS/commit/8b55707487d719459597a5314d2de1f9e295b283))
* **statics:** remove invalid BIP32 constants ([e1d66ba](https://github.com/BitGo/BitGoJS/commit/e1d66ba4a8992e72279c5581591f5885bf6e5540)), closes [/github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp#L142-L143](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/1b6c480/src/chainparams.cpp/issues/L142-L143) [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L306-L309](https://github.com/BitGo//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L306-L309)
* **statics:** remove invalid wif constants ([3b633a9](https://github.com/BitGo/BitGoJS/commit/3b633a9e0c52ca17078bfe8a5440a84980fd0261)), closes [/github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp#L486-L487](https://github.com/BitGo//github.com/dashpay/dash/blob/2ae1ce4/src/chainparams.cpp/issues/L486-L487) [/github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp#L248](https://github.com/BitGo//github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp/issues/L248)

## [9.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.0-rc.1...bitgo@9.4.0) (2020-01-15)

## [9.4.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.4.0-rc.0...bitgo@9.4.0-rc.1) (2020-01-13)

## [9.4.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.2.0...bitgo@9.4.0-rc.0) (2020-01-09)


### Bug Fixes

* **SERV-593:** Correctly handle undefined boolean config items ([770d7c1](https://github.com/BitGo/BitGoJS/commit/770d7c1e22e502a3e5de00085aeab7285c99a1c9)), closes [#599](https://github.com/BitGo/BitGoJS/issues/599)
* **SERV-597:** Ensure `Error.captureStackTrace` is defined before call ([fe35e3e](https://github.com/BitGo/BitGoJS/commit/fe35e3e0fd2b487d96c50c9a64a0890942192814))

### [9.0.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.1-rc.1...bitgo@9.0.1) (2019-11-27)

### [9.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.1-rc.0...bitgo@9.0.1-rc.1) (2019-11-27)

### [9.0.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.0...bitgo@9.0.1-rc.0) (2019-11-20)

## [9.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.0-rc.1...bitgo@9.0.0) (2019-11-20)

## [9.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.0-rc.0...bitgo@9.0.0-rc.1) (2019-11-19)

## [9.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.6.0-rc.0...bitgo@9.0.0-rc.0) (2019-11-18)

## [8.6.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.2...bitgo@8.6.0-rc.0) (2019-11-14)

## [9.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.2.0-rc.0...bitgo@9.2.0) (2019-12-11)

## [9.2.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.1.0...bitgo@9.2.0-rc.0) (2019-12-10)

## [9.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.1.0-rc.0...bitgo@9.1.0) (2019-12-04)

## [9.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.1...bitgo@9.1.0-rc.0) (2019-11-27)

### [9.0.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.1-rc.1...bitgo@9.0.1) (2019-11-27)

### [9.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.1-rc.0...bitgo@9.0.1-rc.1) (2019-11-27)

### [9.0.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.0...bitgo@9.0.1-rc.0) (2019-11-20)

## [9.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.0-rc.1...bitgo@9.0.0) (2019-11-20)

## [9.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@9.0.0-rc.0...bitgo@9.0.0-rc.1) (2019-11-19)

## [9.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.6.0-rc.0...bitgo@9.0.0-rc.0) (2019-11-18)

## [8.6.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.2...bitgo@8.6.0-rc.0) (2019-11-14)

### [8.5.2](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.2-rc.0...bitgo@8.5.2) (2019-11-13)

### [8.5.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.1...bitgo@8.5.2-rc.0) (2019-11-13)

### [8.5.1](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.1-rc.0...bitgo@8.5.1) (2019-11-08)

### [8.5.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.0...bitgo@8.5.1-rc.0) (2019-11-08)

## [8.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.0-rc.3...bitgo@8.5.0) (2019-11-06)

## [8.5.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.0-rc.2...bitgo@8.5.0-rc.3) (2019-11-05)

## [8.5.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@8.5.0-rc.1...bitgo@8.5.0-rc.2) (2019-11-01)

## [8.5.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@8.4.0...bitgo@8.5.0-rc.1) (2019-10-31)

## [8.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.4.0-rc.2...bitgo@8.4.0) (2019-10-25)

## [8.4.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@8.4.0-rc.1...bitgo@8.4.0-rc.2) (2019-10-22)

## [8.4.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@8.4.0-rc.0...bitgo@8.4.0-rc.1) (2019-10-18)

## [8.4.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.2...bitgo@8.4.0-rc.0) (2019-10-17)

### [8.2.2](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.2-rc.0...bitgo@8.2.2) (2019-09-27)

### [8.2.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.1...bitgo@8.2.2-rc.0) (2019-09-26)

### [8.2.1](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.1-rc.2...bitgo@8.2.1) (2019-09-24)

### [8.2.1-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.1-rc.1...bitgo@8.2.1-rc.2) (2019-09-23)

### [8.2.1-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.1-rc.0...bitgo@8.2.1-rc.1) (2019-09-23)

### [8.2.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.2.0...bitgo@8.2.1-rc.0) (2019-09-20)

## [8.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.1.2...bitgo@8.2.0) (2019-09-19)

### [8.1.2](https://github.com/BitGo/BitGoJS/compare/bitgo@8.1.2-rc.0...bitgo@8.1.2) (2019-09-19)

### [8.1.2-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.1.1...bitgo@8.1.2-rc.0) (2019-09-18)

### 8.1.1 (2019-09-11)

### [8.1.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.1.0...bitgo@8.1.1-rc.0) (2019-09-10)

## [8.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.1.0-rc.0...bitgo@8.1.0) (2019-09-10)

## [8.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.0.0...bitgo@8.1.0-rc.0) (2019-09-05)

## [8.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@8.0.0-rc.0...bitgo@8.0.0) (2019-08-28)

## [8.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@6.1.1...bitgo@8.0.0-rc.0) (2019-08-22)

### [6.1.1](https://github.com/BitGo/BitGoJS/compare/bitgo@6.1.1-rc.0...bitgo@6.1.1) (2019-07-05)

### [6.1.1-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@6.1.0...bitgo@6.1.1-rc.0) (2019-07-03)

## [6.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@6.1.0-rc.2...bitgo@6.1.0) (2019-07-02)

## [6.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/bitgo@6.1.0-rc.1...bitgo@6.1.0-rc.2) (2019-07-02)

## [6.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@6.1.0-rc.0...bitgo@6.1.0-rc.1) (2019-06-28)

## [6.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/bitgo@6.0.0...bitgo@6.1.0-rc.0) (2019-06-27)

## [6.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@6.0.0-rc.1...bitgo@6.0.0) (2019-06-19)

## [6.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@6.0.0-rc.0...bitgo@6.0.0-rc.1) (2019-06-17)

## [6.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/2c4b5d1f6acf8462f2f130e9be9bf6cdcadbe288...bitgo@6.0.0-rc.0) (2019-06-13)


### Reverts

* Revert "BG-8668: Add total and per-input signature counts to `explainTransaction`" ([4f4d9aa](https://github.com/BitGo/BitGoJS/commit/4f4d9aac3a04555e4c893d68f8ee2c5c4a258b1c))
* Revert "Improved error message" ([2c4b5d1](https://github.com/BitGo/BitGoJS/commit/2c4b5d1f6acf8462f2f130e9be9bf6cdcadbe288))

