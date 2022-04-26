### [2.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.2.1...@bitgo/utxo-lib@2.2.1) (2022-05-02)


### Bug Fixes

* remove `gitHead` property from package.jsons ([e6b7fdd](https://github.com/BitGo/BitGoJS/commit/e6b7fdd4e4e16c4a07a9a7ad39cc70f08854486e))
* **utxo-lib:** always verify ECDSA in strict mode ([4fcaf53](https://github.com/BitGo/BitGoJS/commit/4fcaf53f18f74a68f37a0513a549fea1c5c1ffb8)), closes [/github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts#L215](https://github.com/BitGo//github.com/bitcoinjs/ecpair/blob/d35a64c/ts_src/ecpair.ts/issues/L215) [/github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts#L1212](https://github.com/BitGo//github.com/paulmillr/noble-secp256k1/blob/97aa518/index.ts/issues/L1212)

### 2.2.1 (2022-02-08)

### 2.2.1-rc.10 (2022-01-26)


### Features

* **utxo-lib:** export type NetworkName ([df27a99](https://github.com/BitGo/BitGoJS/commit/df27a9951edf9a178594a388a353f6933beee053))


### Bug Fixes

* add `publishConfig` package.json of public packages ([195ac13](https://github.com/BitGo/BitGoJS/commit/195ac137d9a8da9c6c6cfe5821738ecc898b6c2c))

### 2.2.1-rc.9 (2022-01-18)


### Bug Fixes

* **utxo-lib:** use NU5_BRANCH_ID when parsing zcashTest v4 ([ae2ded6](https://github.com/BitGo/BitGoJS/commit/ae2ded6d35f807409eacd575b8b91f6451cdfdc8))

### 2.2.1-rc.8 (2022-01-10)


### Features

* **utxo-lib:** add zcash version 450 ([8f9d332](https://github.com/BitGo/BitGoJS/commit/8f9d332e6b7517cb132c7fc749b587c6aadcc201))

### 2.2.1-rc.7 (2022-01-04)


### Features

* **utxo-lib:** add support for Zcash version 5 "NU5" ([5d2c383](https://github.com/BitGo/BitGoJS/commit/5d2c383454383725bb57b7e676851cdfcba86521))

### 2.2.1-rc.6 (2021-12-23)

### 2.2.1-rc.5 (2021-12-18)

### 2.2.1-rc.4 (2021-12-15)


### ⚠ BREAKING CHANGES

* **utxo-lib:** * The namespace `utxolib.coins` is removed

Issue: BG-40432

### Features

* **utxo-lib:** add addressFormats ([c1bd457](https://github.com/BitGo/BitGoJS/commit/c1bd45796e0bae9c2fdd4964f2771812147f14d3))


### Code Refactoring

* **utxo-lib:** improve `network` exports ([d1d6091](https://github.com/BitGo/BitGoJS/commit/d1d6091186800fa8aad0c906101ad266ebebe3ce))

### 2.2.1-rc.3 (2021-12-14)


### ⚠ BREAKING CHANGES

* **utxo-lib:** Removes these methods from AbstractUtxoCoin:

* `supportsP2sh()`
* `supportsP2shP2wsh()`
* `supportsP2wsh()`
* `supportsP2tr()`

Use `supportsAddressType(ScriptType2Of3)` instead.

Issue: BG-38773

### Features

* **utxo-lib:** add `bitgo/wallet` package ([78aff6c](https://github.com/BitGo/BitGoJS/commit/78aff6c1260266ab4c7e1b84d07177e5237d2eaa))
* **utxo-lib:** add `wallet/chains` ([0439a0d](https://github.com/BitGo/BitGoJS/commit/0439a0d4ffe4a15a9932ed70f98cc5745cc6526f))
* **utxo-lib:** add isSupportedScriptType(network, scriptType) ([ae53ab8](https://github.com/BitGo/BitGoJS/commit/ae53ab868c2bc9c9a64d628c5538861c08abef6f))
* **utxo-lib:** support import from `src/bitgo` ([f5ca9dd](https://github.com/BitGo/BitGoJS/commit/f5ca9dde4c9435d483791fd6075f4cde41931f8f))
* **utxo-lib:** use `ChainCode` for `WalletUnspent['chain']` ([6c9c73b](https://github.com/BitGo/BitGoJS/commit/6c9c73b13a32f847912d944748c2ef67fca913fe))

### 2.2.1-rc.2 (2021-12-07)


### Features

* **utxo-lib:** add verifySignatureWithPublicKeys ([4682727](https://github.com/BitGo/BitGoJS/commit/46827273ab457c4073cd468d9a33c39b128234a3))

### 2.2.1-rc.1 (2021-12-01)


### Features

* **utxo-lib:** add scriptPathLevel to ParsedSignatureScriptTaproot ([27cf563](https://github.com/BitGo/BitGoJS/commit/27cf563f7121f7306f39c9e3b3477c70c485f69d))


### Bug Fixes

* **utxo-lib:** do not throw on unsigned inputs ([69dddb6](https://github.com/BitGo/BitGoJS/commit/69dddb6ae077c6093d048fe91b0521e74ab5055e))
* **utxo-lib:** improve ParsedSignatureScriptTaproot ([b809bb2](https://github.com/BitGo/BitGoJS/commit/b809bb2779a2e498fd0ba76437a198ad20ec1536))

### 2.2.1-rc.0 (2021-11-23)


### Features

* **utxo-lib:** add property `scriptType` to ParsedSignatureScript ([c0b678f](https://github.com/BitGo/BitGoJS/commit/c0b678f2b28cf81e41399902a6bdb5e1592c4e3a))

## 2.2.0 (2021-11-12)

## 2.2.0-rc.8 (2021-11-10)


### Features

* **unspents:** classify p2tr script path sigs ([28d6860](https://github.com/BitGo/BitGoJS/commit/28d6860e1beedf0dd2ba0bb708530fd9032071fe))

## 2.2.0-rc.7 (2021-11-09)


### Features

* **utxo-lib:** add support for PrevOutput[] in TransactionBuilder ([cdf1899](https://github.com/BitGo/BitGoJS/commit/cdf1899da3db97e6229e23373e1921b4634f44cf))


### Bug Fixes

* **unspents:** use latest rc as version instead of 2.3.0 ([b0ae190](https://github.com/BitGo/BitGoJS/commit/b0ae190b955ab25b7c33236f7f81861008b8f4df))
* **utxo-lib:** fix setConsensusBranchId ([4efa636](https://github.com/BitGo/BitGoJS/commit/4efa63670ae4e1bf17895b85c8559df33ac319ab))

## 2.2.0-rc.6 (2021-11-09)


### Features

* **utxo-lib:** add scriptTypeForChain() ([e11cabe](https://github.com/BitGo/BitGoJS/commit/e11cabe06ef98311270131462142d78f13c73063))

## 2.2.0-rc.5 (2021-11-04)


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

* **utxo-lib:** remove debugger ([ac6e7ed](https://github.com/BitGo/BitGoJS/commit/ac6e7edbd8f28fc6afae7bc28dae2f2754d3e0d6))

## 2.2.0-rc.4 (2021-10-22)

## 2.2.0-rc.3 (2021-10-22)


### Features

* **utxo-lib:** support p2shP2pk inputs ([f034ead](https://github.com/BitGo/BitGoJS/commit/f034ead6d4ca5d2a11bcd7c1c7042e6de5dd04de))

## 2.2.0-rc.2 (2021-10-20)


### Bug Fixes

* **core:** update `vm2` by uninstalling/reinstalling `superagent-proxy` ([66f4ad3](https://github.com/BitGo/BitGoJS/commit/66f4ad3c8bcec0649cde34e724945f4076e431dd))

## 2.2.0-rc.1 (2021-10-19)


### Features

* add support for node 16 and add to test matrix ([9fab886](https://github.com/BitGo/BitGoJS/commit/9fab886fab10eeacdd91d294f1c5deeb5cd03a28))


### Bug Fixes

* **utxo-lib:** fix sighash for dash transactions ([c171435](https://github.com/BitGo/BitGoJS/commit/c1714357eab3f8fc961e75ad0af8e49f967e801b))

## 2.2.0-rc.0 (2021-10-15)


### Features

* add support for sign(signParams: TxbSignArg) ([f15fb36](https://github.com/BitGo/BitGoJS/commit/f15fb36e6a1aa7515dfbf0c1f2c36620a9ba8eab))

## 2.1.0 (2021-10-08)

## 2.1.0-rc.3 (2021-10-08)


### Bug Fixes

* **utxo-lib:** pass 0 offset to `readUInt16BE` for zcash `fromBase58Check` ([ff99d32](https://github.com/BitGo/BitGoJS/commit/ff99d32110f23dfe2f1f41b9942f33ccc39deaac))
* **utxo-lib:** use OP_CHECKSIG for 2nd p2tr opcode ([a5fdf02](https://github.com/BitGo/BitGoJS/commit/a5fdf02795fcde78d85e94f51f9ac92db620aa67))

## 2.1.0-rc.1 (2021-10-07)


### ⚠ BREAKING CHANGES

* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript

### Features

* **core,utxo-lib:** use bitcoinjs-lib as dependency, export typescript ([a5b80b2](https://github.com/BitGo/BitGoJS/commit/a5b80b274ce4d3d38c4e4396d5f313a6192c4652))
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


### Bug Fixes

* **core:** handle script sigs without signature property in `explainTransaction` ([76028f5](https://github.com/BitGo/BitGoJS/commit/76028f58a6cc5b8a390a6d16d5a696ced368e6cc))
* **utxo-lib:** default to `version: 2` for BTG transactions ([c4047ed](https://github.com/BitGo/BitGoJS/commit/c4047ed24a80904f39f2d598ba6b67722ce8de7b))
* **utxo-lib:** eslint fix ([a17d3c0](https://github.com/BitGo/BitGoJS/commit/a17d3c09aef4124edb4541dc03cd316e0826f6ac))
* **utxo-lib:** fix imports in test ([204e404](https://github.com/BitGo/BitGoJS/commit/204e4044b5a487c3a687f2514e148f5cb318b3c7))
* **utxo-lib:** use different bitcoinjs-lib specifier ([a629eec](https://github.com/BitGo/BitGoJS/commit/a629eec182910e41e339bfebfa6faecffac01305))

## 1.10.0-rc.7 (2021-08-26)


### Features

* **utxo-lib:** add wrappers for Transaction(Builder) constructors ([62aafa9](https://github.com/BitGo/BitGoJS/commit/62aafa98e69b88a801d0fb5bb3e751391a426f44))

## 1.10.0-rc.6 (2021-08-26)

## 1.10.0-rc.5 (2021-08-26)


### Features

* **utxo-lib:** add `cashaddr` constants to bch and bchTest networks ([ee826bd](https://github.com/BitGo/BitGoJS/commit/ee826bd8f6ef96ad0b1f1986ac648f9498634ba8))

## 1.10.0-rc.4 (2021-08-26)


### Features

* **utxo-lib:** add thirdparty fixtures ([9d48994](https://github.com/BitGo/BitGoJS/commit/9d48994887aaa094fc2ee2cd375384c154473fab))


### Bug Fixes

* **utxo-lib:** fix `addForkId` evaluation ([2d5f7e6](https://github.com/BitGo/BitGoJS/commit/2d5f7e6bf7592447cd6ca35ad320202343595227))
* **utxo-lib:** respond to comments ([a2a5808](https://github.com/BitGo/BitGoJS/commit/a2a580815c2c8fa76822a8255b9cdd8028c8db77))
* **utxo-lib:** write `version` as `Int32` ([d3e337a](https://github.com/BitGo/BitGoJS/commit/d3e337ab997c81a2c2c4c1a7ee678777a571f89a))

## 1.10.0-rc.3 (2021-08-24)


### Features

* **utxo-lib:** add createSpendTransaction match test ([436104a](https://github.com/BitGo/BitGoJS/commit/436104aabcb256e1045afc263473a808af8467ca))
* **utxo-lib:** add getDefaultSigHash(network) ([bdb5ace](https://github.com/BitGo/BitGoJS/commit/bdb5acebf94bf91540c6491489c69c8f41a40cca))
* **utxo-lib:** add tests for half-signed transactions ([c8e5222](https://github.com/BitGo/BitGoJS/commit/c8e52229115846303110f24421836500b1140bc9))

## 1.10.0-rc.2 (2021-08-24)


### Bug Fixes

* **core:** improve documentation in hashForSignatureByNetwork ([081c573](https://github.com/BitGo/BitGoJS/commit/081c573b810c7e847c68990381bebe1d445847c9))
* **utxo-lib:** fix fixture generation for bitcoingold ([b3067ec](https://github.com/BitGo/BitGoJS/commit/b3067ec02f40489f3c99989e3a507e28775bb7dd))

## 1.10.0-rc.1 (2021-08-17)


### Features

* **utxo-lib:** add signature helpers, tests ([5ea779e](https://github.com/BitGo/BitGoJS/commit/5ea779e2983a7421d4ac9aeb02708aa414c7cc9a))
* **utxo-lib:** allow select networks in integration_local_rpc ([dfc6696](https://github.com/BitGo/BitGoJS/commit/dfc66966a0c7c6e8be5cd5fca7250e30920a9beb))


### Bug Fixes

* **utxo-lib:** fix missing word in local rpc parse test ([7336ee2](https://github.com/BitGo/BitGoJS/commit/7336ee22200fe8c0e9f0144fadb571cfa7b1836e))
* **utxo-lib:** increase test coverage for signature.ts ([49a1a48](https://github.com/BitGo/BitGoJS/commit/49a1a4805f7c69ee873243525fba4b9037f890fc))

## 1.10.0-rc.0 (2021-08-12)


### Features

* **utxo-lib:** add more assertions to createOutputScript2of3 ([29e5735](https://github.com/BitGo/BitGoJS/commit/29e5735410e09a77ad6a178ffd5488fdd97a8828))
* **utxo-lib:** move outputScripts to bitgo subpackage ([c1b0fa7](https://github.com/BitGo/BitGoJS/commit/c1b0fa722243d7d6c28ae0b7762387e24d234052))

### 1.9.6 (2021-08-10)

### 1.9.6-rc.3 (2021-08-06)

### 1.9.6-rc.2 (2021-07-30)


### Bug Fixes

* **utxo-lib:** make compatible with node 10, 12 ([dd8d8f9](https://github.com/BitGo/BitGoJS/commit/dd8d8f9a903c46549742512c30f5ce540b1c1e75))

### 1.9.6-rc.1 (2021-07-27)


### Features

* **utxo-lib:** add captured test fixtures ([0f98933](https://github.com/BitGo/BitGoJS/commit/0f98933cb21a501967ebc78411fb093221b51aa9))
* **utxo-lib:** add RPC tests ([1a9a9c5](https://github.com/BitGo/BitGoJS/commit/1a9a9c519e38d6eecaed572ff47f33d9dc25e50a))


### Bug Fixes

* **utxo-lib:** update mocha and test `.ts` files ([fb0e7d0](https://github.com/BitGo/BitGoJS/commit/fb0e7d0b4aed2e72a8b269f93c8c7ed8f0367ed0))
* **utxolib:** use `debug` package ([68113bb](https://github.com/BitGo/BitGoJS/commit/68113bbd64411c71fa1c274eb8ff6d0ff1757d1d))
* **utxolib:** use path package for path operations ([75f6fab](https://github.com/BitGo/BitGoJS/commit/75f6fab78ee3d1d0493be407e4c05257712dfddd))
* **wp:** split mocha test from outputScripts impl ([01053c9](https://github.com/BitGo/BitGoJS/commit/01053c9a5f754b884c665e485d613d964055053a))

### 1.9.6-rc.0 (2021-07-22)

### 1.9.5-rc.0 (2021-07-21)


### Features

* **utxolib:** add bitcoingoldTestnet ([06c1dd6](https://github.com/BitGo/BitGoJS/commit/06c1dd6f7ae9e738fedd398e7665b84c03daf46c)), closes [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L332](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L332) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L329](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L329) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L326](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L326) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L327](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L327) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp#L328](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/chainparams.cpp/issues/L328) [/github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h#L35](https://github.com/BitGo//github.com/BTCGPU/BTCGPU/blob/163928af/src/script/interpreter.h/issues/L35)

### 1.9.4 (2021-06-15)

### 1.9.4-rc.0 (2021-06-15)

### 1.9.3 (2021-06-07)

### 1.9.3-rc.0 (2021-05-25)


### Features

* **utxo-lib:** use new package name and new external links ([3805eee](https://github.com/BitGo/BitGoJS/commit/3805eee8abc955b1d92da00c650c684e1662ac19))

### 1.9.2 (2021-05-05)

### 1.9.2-rc.0 (2021-04-27)


### Bug Fixes

* **utxo-lib:** remove trailing comma ([67dac1d](https://github.com/BitGo/BitGoJS/commit/67dac1d9e3d47352eab46b1ceccb203a7024718d))

