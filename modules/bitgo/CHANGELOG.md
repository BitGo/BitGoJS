# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [16.1.2](https://github.com/BitGo/BitGoJS/compare/bitgo@16.1.1...bitgo@16.1.2) (2022-12-09)


### Bug Fixes

* enable cookie propagation gating for test and prod ([da6ddb3](https://github.com/BitGo/BitGoJS/commit/da6ddb30d99cb50f1434399a967f7d99e9fc5187))





## [16.1.1](https://github.com/BitGo/BitGoJS/compare/bitgo@16.1.0...bitgo@16.1.1) (2022-12-06)

**Note:** Version bump only for package bitgo





# [16.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.0.0...bitgo@16.1.0) (2022-12-01)


### Features

* **abstract-utxo:** add valueString to unspents for doge recovery flow ([439f95c](https://github.com/BitGo/BitGoJS/commit/439f95c4e337e33a0812ac28b03e46b52e4a9fde))
* **bitgo:** add api version input ([42f353f](https://github.com/BitGo/BitGoJS/commit/42f353f0b33857963d66739d34b0d0cac85e82db))
* **sdk-core:** add keyDerive to ECDSA TSS implementation ([9ff1d89](https://github.com/BitGo/BitGoJS/commit/9ff1d89ba0e42d53640f0fe7b71c53d1a2eb4a10))





# [16.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@16.0.0) (2022-11-29)


### Bug Fixes

* disable vss verification ([5cdc53b](https://github.com/BitGo/BitGoJS/commit/5cdc53b2e2440524c6ba11109f50eb41222c3f3e))
* multiple issues with message signing ([d703b9a](https://github.com/BitGo/BitGoJS/commit/d703b9a6149c4fe26ad16001f5f681389c8f8aba))
* remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
* **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
* **sdk-core:** disabling vss for eddsa ([7c91d14](https://github.com/BitGo/BitGoJS/commit/7c91d1485f879ebe7a3435871f1d8dafc8f1eef8))
* **sdk-core:** ecdsa tss wallet creation ([2fd5f41](https://github.com/BitGo/BitGoJS/commit/2fd5f4143f4586bb770d9c508316490d57753a32))
* **sdk-core:** eddsa vss ([de1fbd6](https://github.com/BitGo/BitGoJS/commit/de1fbd6179190cc0dae4054088cfb50402286589))
* **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
* **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
* **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))
* **sdk-core:** vss ([01be344](https://github.com/BitGo/BitGoJS/commit/01be34475a036640a9d842f3f657f46d49a45517))
* update express configurations ([d434ece](https://github.com/BitGo/BitGoJS/commit/d434ece0ce942473064d0ba2009d4f11dd43bb96))


### Features

* add cancel staking request ([7e053fd](https://github.com/BitGo/BitGoJS/commit/7e053fddd93888ff73a5c03924cc1c42623bff32))
* add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
* allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
* **bitgo:** ada staking and unstaking tests ([5334d0b](https://github.com/BitGo/BitGoJS/commit/5334d0bfb7bcbf23cc556c3257174bd6ba866dcc))
* **bitgo:** sdk script to get token balance from wallet ([67086f8](https://github.com/BitGo/BitGoJS/commit/67086f8bf844a91ef4ecebead004fb63f520a23f))
* create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
* pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
* **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
* **root:** add support for cross chain recovery for bcha ([f9ab941](https://github.com/BitGo/BitGoJS/commit/f9ab941055eaf79f6623b40e9aac982124f78843))
* **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
* **sdk-coin-trx:** add tron token skeleton ([03198b0](https://github.com/BitGo/BitGoJS/commit/03198b0e23e6c87ce2d34d08973abca301f88252))
* **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
* **sdk-core:** add function to verify wallet signatures for TSS ([0e6840e](https://github.com/BitGo/BitGoJS/commit/0e6840e4b9a89aea30e784e0acede2377937fe6c))
* **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
* **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))
* **sdk-core:** added get payments method for lightning ([fd22577](https://github.com/BitGo/BitGoJS/commit/fd22577755be722ac98ddae21108787adf7d4c13))
* **sdk-core:** change sendMany to work for custodial wallets ([45eb658](https://github.com/BitGo/BitGoJS/commit/45eb65883cb5a5f28fca486fec31215cddae8f69))
* **sdk-core:** expect txid response for lightning withdrawal ([22dfeab](https://github.com/BitGo/BitGoJS/commit/22dfeabda3923a104a4f86e820375c32d05d6879))
* **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))


### BREAKING CHANGES

* **sdk-core:** Key shares require a `v` value for combination.
ISSUE: BG-57633





# [15.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@15.0.0) (2022-11-04)


### Bug Fixes

* disable vss verification ([5cdc53b](https://github.com/BitGo/BitGoJS/commit/5cdc53b2e2440524c6ba11109f50eb41222c3f3e))
* remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
* **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
* **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
* **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
* **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))
* update express configurations ([d434ece](https://github.com/BitGo/BitGoJS/commit/d434ece0ce942473064d0ba2009d4f11dd43bb96))


### Features

* add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
* allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
* **bitgo:** ada staking and unstaking tests ([5334d0b](https://github.com/BitGo/BitGoJS/commit/5334d0bfb7bcbf23cc556c3257174bd6ba866dcc))
* create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
* pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
* **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
* **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
* **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
* **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
* **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))
* **sdk-core:** allow preBuildTransaction to accept wallet id ([a797e38](https://github.com/BitGo/BitGoJS/commit/a797e38b0269bc0ea6e4834f0aca4605ef297265))
* **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))


### BREAKING CHANGES

* **sdk-core:** Key shares require a `v` value for combination.
ISSUE: BG-57633





# [14.7.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@14.7.0) (2022-10-27)


### Bug Fixes

* **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
* **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
* **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
* **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))


### Features

* add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
* allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
* create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
* pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
* **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
* **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
* **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
* **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))





# [14.6.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@14.6.0) (2022-10-25)


### Bug Fixes

* **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
* **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
* **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))


### Features

* add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
* allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
* create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
* **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
* **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
* **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
* **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))





# [14.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.42...bitgo@14.5.0) (2022-10-18)


### Bug Fixes

* **bitgo:** remove address param from lightning().deposit ([b49ec63](https://github.com/BitGo/BitGoJS/commit/b49ec638e130633508cdc64fe6a3bdaaafed5aef))
* **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
* **core:** regenerate p2tr test vectors ([8d0611a](https://github.com/BitGo/BitGoJS/commit/8d0611a53f76ac2f81d6eeac5404e1fd77a6703d))
* **sdk-coin-eos:** fix precision for EOS:CHEX tokens ([0e60ec9](https://github.com/BitGo/BitGoJS/commit/0e60ec9e92a9c737fd65d89476f080b99a0fa842))
* **sdk-coin-eth:** fix convert signature share to/from ([9aed51e](https://github.com/BitGo/BitGoJS/commit/9aed51ee96aefef29ef1cf11b0ce821b996ce08e))
* **sdk-core:** allow for optional passphrase on tss wallets ([f334232](https://github.com/BitGo/BitGoJS/commit/f3342328a85c78ab9d886478bfd027239f2251d8))
* **sdk-core:** allow undefined for amtPaidSats ([7e9e9ea](https://github.com/BitGo/BitGoJS/commit/7e9e9eac7cab9ef41bc08e82704b90a8aeb46de9))
* **sdk-core:** default wallet to non tss ([26febd4](https://github.com/BitGo/BitGoJS/commit/26febd42bc12fe417fecb1896e8ff5313be9fc18))
* **sdk-core:** ecdsa keychain creation types mach ([1224de3](https://github.com/BitGo/BitGoJS/commit/1224de3f707759f4ef22836a80c3b834ec04b98d))
* **sdk-core:** ecdsa send signing bitgo's n share u ([1cb1e93](https://github.com/BitGo/BitGoJS/commit/1cb1e933c692f454de538b3b189ef2feb1b39475))
* **sdk-core:** ecdsa sign serializedTxHex ([2fda8fc](https://github.com/BitGo/BitGoJS/commit/2fda8fc364f357a66645665b7793182baf2efbcb))
* **sdk-core:** ecdsa signing get user share ([acbc700](https://github.com/BitGo/BitGoJS/commit/acbc7002c9ffd62c78e6dd2e72feac0c3ff4fe45))
* **sdk-core:** ecdsa tss signing flow update ([226586c](https://github.com/BitGo/BitGoJS/commit/226586ce2f1af6f5593bb97c3a297f332aee3b34))
* **sdk-core:** fix send token enablements by writing in buildParams in prebuildTx ([9dc933a](https://github.com/BitGo/BitGoJS/commit/9dc933a878b2a70adc69cd329883f668a8943aa0))
* **sdk-core:** fix tss ecdsa keychain encryption ([95f9c2d](https://github.com/BitGo/BitGoJS/commit/95f9c2d7d1018d387dc6cabd89e5c0d14b9f07d3))
* **sdk-core:** tss tx signing ([ab7eb80](https://github.com/BitGo/BitGoJS/commit/ab7eb8079ea37e347727db106d01fe9362f36374))
* **sdk-core:** tss wallet creation related bugs ([500c735](https://github.com/BitGo/BitGoJS/commit/500c73527edd902b65cfd784ea1022a21e0f6319))
* **utxo-lib:** use safe version of bitcoinjs-lib ([8f2226b](https://github.com/BitGo/BitGoJS/commit/8f2226b6276fe47413759bf7462b8429d9e69f90))


### Features

* **abstract-utxo:** add support for bigints from new utxo-lib ([77c60dd](https://github.com/BitGo/BitGoJS/commit/77c60ddd4d0ddd1e82a8b1bb041686a9c7f39fae))
* **abstract-utxo:** add support for bigints from new utxo-lib ([8e5bbe5](https://github.com/BitGo/BitGoJS/commit/8e5bbe5e158254d34abb87f6d000e5afd9bb6b9d))
* **abstract-utxo:** backup key recovery service for doge ([612be53](https://github.com/BitGo/BitGoJS/commit/612be533836f33fdecb9584ddc0f5674df31dcb0))
* **abstract-utxo:** cross chain recovery support for bigint coins (doge) ([ad6bf71](https://github.com/BitGo/BitGoJS/commit/ad6bf71f58a4bae79f3bb014ee947a878f4b89d2))
* add message signing support for polygon ([ab2bac1](https://github.com/BitGo/BitGoJS/commit/ab2bac13dad55ce8571d014796298aa52a24a5f2))
* add u value proof during tss eddssa key creation ([79d2c91](https://github.com/BitGo/BitGoJS/commit/79d2c91ea5b101f8cad9b107b9e4426939333c5f))
* adding support for message signing ([01c6303](https://github.com/BitGo/BitGoJS/commit/01c63032d067e6ba5aef78804ea747b5e62709fe))
* **bitgo:** add lightning and lnurl examples ([8894bac](https://github.com/BitGo/BitGoJS/commit/8894bac0fd47eb9841e545011dc25d516dd72e9c))
* **bitgo:** adding example for tx-build ([c967e26](https://github.com/BitGo/BitGoJS/commit/c967e2630bb7768278572361c61667c0452af1ba))
* **bitgo:** expose Ethw in core bitgo module ([183cda4](https://github.com/BitGo/BitGoJS/commit/183cda433f8c683722843e2c30bf46101a1cd677))
* **bitgo:** support chaincodes on BLS-DKG keychains creation ([bfaa380](https://github.com/BitGo/BitGoJS/commit/bfaa380551d2fe90e041975b392d4398c781074a))
* **sdk-coin-ada:** create wallet script ([6263411](https://github.com/BitGo/BitGoJS/commit/626341127af23d7033261eed16a61b615fbc70d4))
* **sdk-coin-ada:** incorporate sdk-coin-ada back into bitgo ([99d141b](https://github.com/BitGo/BitGoJS/commit/99d141be06fa98f77ea88dc6f7cbae7aa1f9e002))
* **sdk-coin-bsc:** create bsc module ([b55ca71](https://github.com/BitGo/BitGoJS/commit/b55ca7173e27ee2d75d342b6706698769f11734f))
* **sdk-coin-bsc:** support tokens for bsc ([44d2af8](https://github.com/BitGo/BitGoJS/commit/44d2af8f3f14bc61d31e6a0b8482a68db2a7d23e))
* **sdk-coin-eth:** add acceleration capability for eth ([436ba8c](https://github.com/BitGo/BitGoJS/commit/436ba8ceb478c4028d5b05dc34bb623be6fc581f))
* **sdk-coin-ethw:** add ethw sdk module ([63e9850](https://github.com/BitGo/BitGoJS/commit/63e9850c27039d1b614d14426a1d9b090d454b76))
* **sdk-coin-polygon:** support tokens ([8870307](https://github.com/BitGo/BitGoJS/commit/8870307b63f460031019aecf30c60df4f2c0a112))
* **sdk-coin-sui:** create sui module ([8ba86b7](https://github.com/BitGo/BitGoJS/commit/8ba86b7a10720a14ff1efa9c4616c1f26d27d8e4))
* **sdk-core:** add createDepositAddress to lightning ([e7056dc](https://github.com/BitGo/BitGoJS/commit/e7056dc48448d69328d29bd223c179eb6486a40e))
* **sdk-core:** add createInvoice to lightning ([293a5d6](https://github.com/BitGo/BitGoJS/commit/293a5d6badd73def299b4f8420bc3380bb862cb2))
* **sdk-core:** add deposit() to lightning object ([aeb483d](https://github.com/BitGo/BitGoJS/commit/aeb483d2cd2baf49659674f9b9ad7a9d37fcf672))
* **sdk-core:** add enable token support for sol ([dde3a95](https://github.com/BitGo/BitGoJS/commit/dde3a952b45f9e49d61bdc92d7cddaff1a646c08))
* **sdk-core:** add getBalance for lightning ([ccd2e81](https://github.com/BitGo/BitGoJS/commit/ccd2e817cddda09709ae3d65a91d7fd122661f5c))
* **sdk-core:** add getInvoices to lightning object ([232bea3](https://github.com/BitGo/BitGoJS/commit/232bea30d95a4b6f9554cc0416c54f0f73a979ad))
* **sdk-core:** add helper to create backup TSS key share held by BitGo ([d5921ad](https://github.com/BitGo/BitGoJS/commit/d5921ad6c0a90b9a0e5ec7d60b86fd8741550b5c))
* **sdk-core:** add helper to finish backup TSS key share held by BitGo ([f2d85b5](https://github.com/BitGo/BitGoJS/commit/f2d85b5132c9466a70dea645598dbbf95c677c4d))
* **sdk-core:** add includeTokens wallet.addresses parameter ([8c03d83](https://github.com/BitGo/BitGoJS/commit/8c03d8363e3e3b56b6c7f18b0e098d68f25d54c2))
* **sdk-core:** add more ecdsa helper methods ([aa57eac](https://github.com/BitGo/BitGoJS/commit/aa57eacdc97f2ecac4179f76461d798226178ba8))
* **sdk-core:** add payInvoice to lightning object ([eaaa48d](https://github.com/BitGo/BitGoJS/commit/eaaa48d10a8d0cc74b2ac97e0d0d97feba88d72a))
* **sdk-core:** add recid to fully constructed signature ([a8adcd9](https://github.com/BitGo/BitGoJS/commit/a8adcd9c3f452f1dfc85454668c19103cec7160d))
* **sdk-core:** add specialized enable token functions ([3e60cef](https://github.com/BitGo/BitGoJS/commit/3e60cef71a0ae76b378356508338738eac49a920))
* **sdk-core:** add withdraw to lightning object ([99474b5](https://github.com/BitGo/BitGoJS/commit/99474b581023b228ce6f2713f5b5d58c8d1186d6))
* **sdk-core:** added large value support while calling WP ([870621e](https://github.com/BitGo/BitGoJS/commit/870621e2bc93d15ed6f040379353d039eb17e609))
* **sdk-core:** added verification of private share proofs ([66d6c63](https://github.com/BitGo/BitGoJS/commit/66d6c63bd102da49727e3bdb275cfa6231859ce5))
* **sdk-core:** allow getting a staking wallet for any coin ([cfae0fe](https://github.com/BitGo/BitGoJS/commit/cfae0feeb14c1bcb30dad2840abd8489372bfbc8))
* **sdk-core:** ecdsa type converters ([800b01b](https://github.com/BitGo/BitGoJS/commit/800b01b02194011bc0ac608a5d75094f935d6235))
* **sdk-core:** implement signing flow ecdsa ([68aa561](https://github.com/BitGo/BitGoJS/commit/68aa561193fe0574bd7b7080bb51d1d795cf31f9))
* **sdk-core:** parse zero value lightning invoices ([78cab72](https://github.com/BitGo/BitGoJS/commit/78cab722387bd6348cb81951c2e611db231484e0))
* **sdk-core:** support lnurl pay ([6df91a3](https://github.com/BitGo/BitGoJS/commit/6df91a3eac28bf55600d5e856a297dde6b56c826))
* **sdk-core:** support transfertoken type transactions ([6579785](https://github.com/BitGo/BitGoJS/commit/65797851062fb7beb3b1eb6a1db00e23f0a3c209))
* **sdk-core:** use eth wallet for building and signing token txs ([82dd4a9](https://github.com/BitGo/BitGoJS/commit/82dd4a9a19f144dfdf83afd40155532d4df3163c))
* **statics:** add ETHw statics ([f49ef42](https://github.com/BitGo/BitGoJS/commit/f49ef4233ffb788765eac5b5d20232334fbd6203))
* **statics:** add ofc for near ([4ecde82](https://github.com/BitGo/BitGoJS/commit/4ecde82919019aa8bdacbe7958acb8ec6a5bf50f))
* **statics:** add solana ([b46780e](https://github.com/BitGo/BitGoJS/commit/b46780ef7188b0f4451632c2fe2c3be86cdef9a7))
* the client needs to generate a gpg key for their backup key share and share it with bitgo ([fb10fae](https://github.com/BitGo/BitGoJS/commit/fb10fae409761363fd8a3bb489011c34f041140c))
* **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))


### Reverts

* Revert "feat(sdk-coin-aca): add sdk-coin-aca module BG-52862" ([e97716e](https://github.com/BitGo/BitGoJS/commit/e97716e487977617c205ec96fea68467857ab8de))


### BREAKING CHANGES

* **sdk-core:** The SShare type's `r` field is now `R` (33 bytes encoded as 66 hex characters).
ISSUE: BG-56664
* **sdk-core:** We need to deal with the new enableToken intent type for solana on wp.
* **bitgo:** This breaks the current ETH2 Hot Wallet creation flow. Needs BG-46182 to be
implemented and deployed too.

BG-46184





# [14.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.42...bitgo@14.2.0) (2022-07-19)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.42](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.40...bitgo@14.2.0-rc.42) (2022-07-19)


### Features

* **sdk-coin-ada:** implement key pair and utils for ada sdk ([9a1aabb](https://github.com/BitGo/BitGoJS/commit/9a1aabb8a07b5787ab3fa645c29be1b940694892))





# [14.2.0-rc.41](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.40...bitgo@14.2.0-rc.41) (2022-07-18)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.40](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.39...bitgo@14.2.0-rc.40) (2022-07-15)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.39](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.37...bitgo@14.2.0-rc.39) (2022-07-15)


### Features

* **account-lib:** get rid of old ethereum lib ([abd2247](https://github.com/BitGo/BitGoJS/commit/abd2247047218d8cbd8ec7067d227721357f5fcc))





# [14.2.0-rc.38](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.37...bitgo@14.2.0-rc.38) (2022-07-14)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.36](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.35...bitgo@14.2.0-rc.36) (2022-07-12)


### Features

* **account-lib:** update hbar txData and explainTx to support diff instructions ([b604de6](https://github.com/BitGo/BitGoJS/commit/b604de6dad4d31cb83a673257e0c88a6c5934242))





# [14.2.0-rc.35](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.34...bitgo@14.2.0-rc.35) (2022-07-11)


### Bug Fixes

* update invalid files for depcheck ([6aae9aa](https://github.com/BitGo/BitGoJS/commit/6aae9aaf1cb70d65a75fa6d208eaa26d371443a6))


### Features

* **bitgo:** create skeleton for hbar tokens ([d156a51](https://github.com/BitGo/BitGoJS/commit/d156a5188fa4923142964284276431fe8a0d4267))
* **sdk-coin-stx:** refactor stx to its own module ([80866b4](https://github.com/BitGo/BitGoJS/commit/80866b4161349efa513f801c0830029e5d5f36a3))
* **sdk-coin-xtz:** refactor xtz to its own module ([241f580](https://github.com/BitGo/BitGoJS/commit/241f580c6711a186e36b11ec4ac3452b874bcacb))
* **utxo-lib:** add network configuration for DOGE ([442e7e9](https://github.com/BitGo/BitGoJS/commit/442e7e9df3acd00edde3a0512de363164a377bb5))





# [14.2.0-rc.34](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.33...bitgo@14.2.0-rc.34) (2022-07-07)


### Features

* **account-lib:** cardano ada coin skeleton ([68f7fe7](https://github.com/BitGo/BitGoJS/commit/68f7fe708d27dba55885da32e4be07aa1e1bbf00))
* **account-lib:** hbar token transfer builder and serialization ([0bc7287](https://github.com/BitGo/BitGoJS/commit/0bc72870b02a29e67df134022bde2c3750107a9b))
* **sdk-coin-bcha:** refactor bcha to its own module ([6fb1a70](https://github.com/BitGo/BitGoJS/commit/6fb1a704d2365cc7e212860a81dbd47b70f59d6f))
* **sdk-coin-bch:** refactor bch to its own module ([3d3c2ed](https://github.com/BitGo/BitGoJS/commit/3d3c2eda2115fe136050f06a02c6c12cb1827707))
* **sdk-coin-bsv:** refactor bsv to its own module ([9f6b6e8](https://github.com/BitGo/BitGoJS/commit/9f6b6e8bc0aeba956646bd7be0466e934d477b26))
* **sdk-coin-btg:** refactor btg to its own module ([ebebe70](https://github.com/BitGo/BitGoJS/commit/ebebe70f8c103f7ddddcc878204e686eb04d786a))
* **sdk-coin-ltc:** refactor ltc to its own module ([7bb56a4](https://github.com/BitGo/BitGoJS/commit/7bb56a44f4099d6caf853d1eeccfa6cd501a9f5e))
* **sdk-core:** tss ecdsa utility to create keychains ([0a1ab71](https://github.com/BitGo/BitGoJS/commit/0a1ab71ea981fe8bd833f1b25cc3c90e6cb89565))





# [14.2.0-rc.33](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.32...bitgo@14.2.0-rc.33) (2022-07-05)


### Features

* **sdk-coin-dash:** refactor dash to its own module ([d62f637](https://github.com/BitGo/BitGoJS/commit/d62f637ca3ac47f79c03dfaee98636e580a56020))


### Reverts

* Revert "Revert "feat(bitgo): change the names from algo tokens"" ([ea9a761](https://github.com/BitGo/BitGoJS/commit/ea9a7619ef71de008c99fa22bab14ec7aa358db6))





# [14.2.0-rc.32](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.31...bitgo@14.2.0-rc.32) (2022-07-01)


### Features

* **sdk-coin-zec:** refactor zec to its own module ([0d429c6](https://github.com/BitGo/BitGoJS/commit/0d429c60eb4d66de8c512ae5fdec8b0ceb067e2f))
* **sdk-core:** update validation to include eip1559 ([4775a84](https://github.com/BitGo/BitGoJS/commit/4775a84de1e4ba18dcbc7cd8cbfa0a40c4625e46))





# [14.2.0-rc.31](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.30...bitgo@14.2.0-rc.31) (2022-06-30)


### Bug Fixes

* **sdk-core:** fix sol send token sdk ([d5c697b](https://github.com/BitGo/BitGoJS/commit/d5c697b4f0b2e6a95eaf7a1f6e70db063f2877d2))





# [14.2.0-rc.30](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.29...bitgo@14.2.0-rc.30) (2022-06-30)


### Bug Fixes

* **bitgo:** rounded value on spendable balance ([8ce7d01](https://github.com/BitGo/BitGoJS/commit/8ce7d019c3aed6827527a02c64226c4c27403f19))
* use correct address encoding when decoding polkadot txn ([99d4bdc](https://github.com/BitGo/BitGoJS/commit/99d4bdc237fcf126238455f7201ae51696e77566))





# [14.2.0-rc.29](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.27...bitgo@14.2.0-rc.29) (2022-06-29)


### Bug Fixes

* register solana tokens ([26baa35](https://github.com/BitGo/BitGoJS/commit/26baa35b3b4d9275c85fd49490e810a517860396))


### Reverts

* Revert "feat(bitgo): change the names from algo tokens" ([81e794b](https://github.com/BitGo/BitGoJS/commit/81e794bba02f050055452481e0b87b58e68928de))





# [14.2.0-rc.28](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.27...bitgo@14.2.0-rc.28) (2022-06-29)


### Bug Fixes

* register solana tokens ([26baa35](https://github.com/BitGo/BitGoJS/commit/26baa35b3b4d9275c85fd49490e810a517860396))


### Reverts

* Revert "feat(bitgo): change the names from algo tokens" ([81e794b](https://github.com/BitGo/BitGoJS/commit/81e794bba02f050055452481e0b87b58e68928de))





# [14.2.0-rc.27](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.26...bitgo@14.2.0-rc.27) (2022-06-27)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.26](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.25...bitgo@14.2.0-rc.26) (2022-06-27)


### Reverts

* Revert "feat(bitgo): handle new response for consolidateAccount/build endpoin" ([ec5ab05](https://github.com/BitGo/BitGoJS/commit/ec5ab05e66ef238addf3e213fff63ae9263e1010))





# [14.2.0-rc.25](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.24...bitgo@14.2.0-rc.25) (2022-06-23)


### Features

* **sdk-coin-avaxp:** implement generateKeyPair and signTransaction ([52b03d2](https://github.com/BitGo/BitGoJS/commit/52b03d2a8583e1da24789c4cdd30924416e28ec2))





# [14.2.0-rc.24](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.23...bitgo@14.2.0-rc.24) (2022-06-22)


### Bug Fixes

* add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))


### Features

* **bitgo:** change the names from algo tokens ([8925d4e](https://github.com/BitGo/BitGoJS/commit/8925d4e15cd973e86bc3f78ade3fa863adfde656))





# [14.2.0-rc.23](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.22...bitgo@14.2.0-rc.23) (2022-06-21)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.22](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.21...bitgo@14.2.0-rc.22) (2022-06-16)


### Features

* **sdk-core:** add staking SDK functionality ([20371c9](https://github.com/BitGo/BitGoJS/commit/20371c9e320c6a6f9c929dcdbd3cfa197b960ac9))





# [14.2.0-rc.21](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.20...bitgo@14.2.0-rc.21) (2022-06-15)


### Features

* added explainTransaction and unit tests for dot ([e5746f9](https://github.com/BitGo/BitGoJS/commit/e5746f91ac98d4583c6c743a2c3e4a0e26b9df96))





# [14.2.0-rc.20](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.19...bitgo@14.2.0-rc.20) (2022-06-14)


### Features

* **sdk-core:** tss ecdsa key gen helper methods ([ef7e13e](https://github.com/BitGo/BitGoJS/commit/ef7e13e3bb948631f1d0faa7d2e34a4445197db2))





# [14.2.0-rc.19](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.18...bitgo@14.2.0-rc.19) (2022-06-14)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.18](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.17...bitgo@14.2.0-rc.18) (2022-06-13)


### Bug Fixes

* update cspr unit tests ([cbbaf2c](https://github.com/BitGo/BitGoJS/commit/cbbaf2c731dacedc4200700d145a48669af71c40))


### Features

* **bitgo:** add doc for txn with emergency param ([ae6ec8f](https://github.com/BitGo/BitGoJS/commit/ae6ec8f763ab4e0b6def9e1eb517889d216779bf))
* **bitgo:** implements sign tx for polygon ([f687486](https://github.com/BitGo/BitGoJS/commit/f687486c2d269e6726131edca12895f0d452bba5))





# [14.2.0-rc.17](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.16...bitgo@14.2.0-rc.17) (2022-06-10)


### Bug Fixes

* **abstract-utxo:** add bsv replay protection case ([5e166cb](https://github.com/BitGo/BitGoJS/commit/5e166cbbc89ff10bd59308debf8f43dd18de0c47))


### Features

* **bitgo:** add explain tx polygon ([63c83f7](https://github.com/BitGo/BitGoJS/commit/63c83f7eede67e4cecf731435f243b3c7c27fec5))
* **bitgo:** handle new response for consolidateAccount/build endpoin ([a333c5f](https://github.com/BitGo/BitGoJS/commit/a333c5f347aeab789414945aff5ed4281f3be296))
* move coinFactory from bitgo to sdk-core ([fb7e902](https://github.com/BitGo/BitGoJS/commit/fb7e902c150a25c40310dc040ca6a8833b097cef))
* support building transactions for tss custodial wallets ([12774ca](https://github.com/BitGo/BitGoJS/commit/12774cad3fe817f582be10228025aae2a5967cbc))





# [14.2.0-rc.16](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.15...bitgo@14.2.0-rc.16) (2022-06-07)


### Bug Fixes

* **sdk-api:** api uses own version ([e2091e9](https://github.com/BitGo/BitGoJS/commit/e2091e9074f392fcebea468c8cb60cb6eb445b84))





# [14.2.0-rc.15](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.14...bitgo@14.2.0-rc.15) (2022-06-07)


### Features

* implement polygon util method, core skeleton ([562855a](https://github.com/BitGo/BitGoJS/commit/562855afea41458f9569c90914619a6d515b92c0))





# [14.2.0-rc.14](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.13...bitgo@14.2.0-rc.14) (2022-06-02)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.13](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.12...bitgo@14.2.0-rc.13) (2022-06-02)


### Bug Fixes

* **account-lib:** fix sdk avax build issues ([7991aef](https://github.com/BitGo/BitGoJS/commit/7991aef5ba8218da376f482ed9e2273f8b9a349b))


### Features

* **sdk-coin-avaxp:** add new sdk coin avaxp ([328d546](https://github.com/BitGo/BitGoJS/commit/328d546897d5df645d5bcbf6ca22c56d045bc306))





# [14.2.0-rc.12](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.11...bitgo@14.2.0-rc.12) (2022-06-01)


### Bug Fixes

* add missing examples and filters for list addresses api ([6a6ad90](https://github.com/BitGo/BitGoJS/commit/6a6ad90c670710cd169cc11aeb68f227bfd60a7c))
* **bitgo:** fix v1 wallet get address ([74c2420](https://github.com/BitGo/BitGoJS/commit/74c24206fb63ef3fbaea3ad6a17c0e2dcea6ea32))
* **utxo-lib:** always use VERSION4_BRANCH_NU5 for zcash ([ef0692c](https://github.com/BitGo/BitGoJS/commit/ef0692c6772f6d21fce3da6cc515dc74915c3c6d))


### Features

* **sdk-core:** Define new BitGoBase interface in sdk-core ([907bd9e](https://github.com/BitGo/BitGoJS/commit/907bd9e024f196bfb707f04065a47d74e0f7ce0d))





# [14.2.0-rc.11](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.10...bitgo@14.2.0-rc.11) (2022-05-23)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.10](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.9...bitgo@14.2.0-rc.10) (2022-05-19)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.8...bitgo@14.2.0-rc.9) (2022-05-19)


### Bug Fixes

* **bitgo:** getUnspentInfo to handle missing unspents ([8fe1ae9](https://github.com/BitGo/BitGoJS/commit/8fe1ae9094c728f25f0cc3a53ec170c1c348b49d))





# [14.2.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.7...bitgo@14.2.0-rc.8) (2022-05-18)


### Bug Fixes

* v1 getWallet call ([0dad23c](https://github.com/BitGo/BitGoJS/commit/0dad23cf96541a49dc3e0a3135dbd099eabc7c6b))





# [14.2.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.6...bitgo@14.2.0-rc.7) (2022-05-17)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.5...bitgo@14.2.0-rc.6) (2022-05-16)


### Features

* **statics:** add fiatusd and tfiatusd coins ([1750a43](https://github.com/BitGo/BitGoJS/commit/1750a4319298a839fc7dd3f418420f26b2cdb5a0))





# [14.2.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.4...bitgo@14.2.0-rc.5) (2022-05-13)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.3...bitgo@14.2.0-rc.4) (2022-05-13)


### Features

* **bitgo:** add parse transaction in core ([1775c73](https://github.com/BitGo/BitGoJS/commit/1775c737f12b0fed4dfc3e927855304b928530e9))
* **statics:** create statics for dogecoin ([66e8862](https://github.com/BitGo/BitGoJS/commit/66e88626e09cf886748c2db2ce866b9a7f26cab3))





# [14.2.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.2...bitgo@14.2.0-rc.3) (2022-05-12)

**Note:** Version bump only for package bitgo





# [14.2.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.0...bitgo@14.2.0-rc.1) (2022-05-06)


### Bug Fixes

* **bitgo:** attempt to sign using fallback derivation for v1 wallet ([433620d](https://github.com/BitGo/BitGoJS/commit/433620dd18865a6fe6d8df114814a0dbcf73c416))


### Features

* **bitgo:** add verify transaction in core for Near ([1fc0f7b](https://github.com/BitGo/BitGoJS/commit/1fc0f7bf0c5beb48d241357e716e26d4ccf85afa))
* **statics:** create statics for avaxp ([34776cd](https://github.com/BitGo/BitGoJS/commit/34776cd649f424a05b33481b4a582ea4cf844325))





# [14.1.0-rc.40](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0...bitgo@14.1.0-rc.40) (2022-05-04)


### Features

* add funcs to generate and verify gpg signatures ([e08c100](https://github.com/BitGo/BitGoJS/commit/e08c1008498d40b479de1654ac88b5b1338dbfe1))
* **bitgo:** add explainTransaction implemented in account lib call in core ([81d0861](https://github.com/BitGo/BitGoJS/commit/81d08613aa35911eec6acd73376e0f2e4687deb4))
* **bitgo:** modify in near.ts on core the near constructor to support static ([de7ebec](https://github.com/BitGo/BitGoJS/commit/de7ebecbdb9c0ba97c2b3732195e40e16b385713))
* support opengpg signatures ([c07b2dc](https://github.com/BitGo/BitGoJS/commit/c07b2dc78d47042ed1edbaac1f49d29fe6971c95))





# [14.1.0-rc.38](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.37...bitgo@14.1.0-rc.38) (2022-04-20)


### Bug Fixes

* **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))





# [14.1.0-rc.37](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.36...bitgo@14.1.0-rc.37) (2022-04-19)

**Note:** Version bump only for package bitgo





# [14.1.0-rc.36](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.35...bitgo@14.1.0-rc.36) (2022-04-19)


### Bug Fixes

* **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
* getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
* v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))





# [14.1.0-rc.34](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.33...bitgo@14.1.0-rc.34) (2022-04-13)


### Bug Fixes

* whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))





# [14.1.0-rc.33](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.32...bitgo@14.1.0-rc.33) (2022-04-12)


### Bug Fixes

* **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))





# [14.1.0-rc.32](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.31...bitgo@14.1.0-rc.32) (2022-04-12)

**Note:** Version bump only for package bitgo





# [14.1.0-rc.31](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.30...bitgo@14.1.0-rc.31) (2022-04-11)

**Note:** Version bump only for package bitgo





# [14.1.0-rc.30](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.30) (2022-04-08)


### Bug Fixes

* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))


### Features

* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))





# [14.1.0-rc.29](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.29) (2022-04-06)


### Bug Fixes

* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))


### Features

* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))





# [14.1.0-rc.28](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.28) (2022-04-05)


### Bug Fixes

* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))


### Features

* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))





# [14.1.0-rc.27](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.27) (2022-04-05)


### Bug Fixes

* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))


### Features

* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))





# [14.1.0-rc.26](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.26) (2022-04-05)


### Bug Fixes

* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))


### Features

* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))

## 11.4.0 (07-21-2020)

### New Features
* Add support for new ERC20 tokens (FFT, IVO, LEND, UCO, XBGOLD, XEX)

### Other Changes
* Rename coin `cgld` to `celo`
* Update `@bitgo/account-lib` to version 2.0.0
* Update `@bitgo/statics` to version 5.0.0
* Use renamed `@bitgo/utxo-lib` package and update to version 1.7.1

## 11.3.0 (06-30-2020)

### New Features
* Add ability to use a custom API token when using the Etherscan API
* Implement `signTransaction`, `explainTransaction` and other functions needed for signing and recovery to `AbstractEthLikeCoin`, which unifies the logic for Ethereum forks and chains with compatible characteristics.

### Other Changes
* Update `@bitgo/account-lib` to version 1.7.0
* Update `@bitgo/statics` to version 4.3.0
* Change exported enums to be non-const

## 11.2.0 (06-15-2020)

### New Features
* Add support for new ERC20 tokens (ABT, BSX, INF, JFIN, NIAX, USG)
* Add support for `signMessage` to ETH-like coins.

### Other Changes
* Add example showing how to create a basic local backup key for BTC.
* Update `@bitgo/statics` to version 4.2.0

## 11.1.3 (06-04-2020)

### New Features
* `prod`, `test`, and `dev` environment configs now point to the corresponding app.bitgo.com URLs. The old `msProd`, `msTest`, and `msDev` environments have been deprecated and are now aliases of `prod`, `test`, and `dev` respectively.
* Add initial support for ETC, RBTC, and CGLD.

### Bug Fixes
* Allow rebuilding consolidation transactions upon approving a pending approval
* Fix bug in fanout endpoint that causes `maxNumInputsToUse` to be ignored.

### Other Changes
* Add example for consolidating Algorand from receive addresses
* Update `@bitgo/statics` to version 4.1.0
* Update `@bitgo/account-lib` to version 1.3.0

## 11.1.2 (05-20-2020)

This release fixes an build issue with bitgo@11.1.1 which caused an older version of statics to be inadvertently included in the built package available on npm.

### Other Changes
* Update `@bitgo/statics` to version 4.0.1

## 11.1.1 (05-12-2020)

### Other Changes
* Include full stack traces for `BitGoJSError` types and inheritors.
* Update `@bitgo/statics` to version 4.0.0

## 11.1.0 (05-08-2020)

### Other Changes
* Move creation of XRP wallet initialization transactions to server side in order to support the XRP DeleteableAccounts amendment.

## 11.0.3 (04-13-2020)

### Other Changes
* Update `@bitgo/account-lib` to version 1.0.3
* Fix message signing for XTZ

## 11.0.2 (04-09-2020)

### Other Changes
* Remove `@hidden` annotation from trading documentation and update to latest payload version.
* Update `@bitgo/statics` to version 3.5.0

## 11.0.1 (03-31-2020)

### Other Changes
* Update `@bitgo/statics` to version 3.4.4

## 11.0.0 (03-24-2020)

### Breaking Changes
* The `signMessage` function on coin objects has been made asynchronous. Callers of this function will have to update their code to correctly handle the returned promise.

### New Features
* Add preliminary XTZ signing support.

### Other Changes
* Update `@bitgo/account-lib` to version 1.0.2
* Update `@bitgo/statics` to version 3.4.3

## 10.0.0 (03-18-2020)

### Breaking Changes
* The `signTransaction` function on wallet objects has been made asynchronous. Callers of this function will have to update their code to correctly handle the returned promise.

### New Features
* A new parameter `offlineVerification` has been added to the `prebuildTransaction` function on wallet objects. When set to `true`, additional data useful for offline transaction verification will be fetched along with the unsigned transaction.

### Bug Fixes
* Replace bitcoin average with coingecko for retrieving market data in offline recovery scenarios.
* Fix incorrect type check on `username` and `password` parameters in `preprocessAuthenticationParams`.

### Other Changes
* Update `@bitgo/account-lib` to version 1.0.1

## 9.6.2 (03-12-2020)

### Other Changes
* Update `@bitgo/statics` to version 3.4.1

## 9.6.1 (03-10-2020)

### Other Changes
* Increase EOS recovery transaction expiration time from 1 hour to 8 hours.
* Update `@bitgo/statics` to version 3.4.1

## 9.6.0 (03-03-2020)

### New Features
* Add support for building consolidation transactions for account based coins via the new wallet methods `buildAccountConsolidation`, `sendAccountConsolidation`, and `sendAccountConsolidations` (for bulk consolidations).

### Other Changes
* Update `@bitgo/statics` to version 3.4.0

## 9.5.3 (02-14-2020)

### Other Changes
* Update `@bitgo/statics` to version 3.3.0

## 9.5.2 (02-11-2020)

### Bug Fixes
* Recreate XLM integration test wallets following quarterly XLM testnet reset.

### Other Changes
* Update `@bitgo/statics` to version 3.2.0

## 9.5.1 (02-04-2020)

### Bug Fixes
* Add missing properties `redeemScript` and `witnessScript` to typescript interface `SignTransactionOptions`.

### Other Changes
* Update `@bitgo/statics` to version 3.1.1

## 9.5.0 (01-29-2020)

### Bug Fixes
* Remove usage of deprecated bufferutils function `bufferutils.reverse`.

### Other Changes
* Update `@bitgo/statics` to version 3.1.0

## 9.4.1 (01-21-2020)

### Bug Fixes
* Fix incorrect aliasing of interface `TransactionExplanation` in Algorand implementation.

### Other Changes
* Update `@bitgo/statics` to version 3.0.1

## 9.4.0 (01-15-2020)

### New Features
* Allow creation of random EOS addresses.
* Lock transactions to next block to discourage fee sniping.

### Other Changes
* Update `@bitgo/statics` to version 3.0.0

## 9.3.0 (12-17-2019)

### New Features
* Return key registration data for Algorand's `explainTransaction()`

### Bug Fixes
* Fix circular json serialization error when using `accelerateTransaction`
* Filter out duplicate addresses when doing address lookups for cross chain recoveries
* Allow EOS addresses to begin with a number
* Properly deserialize EOS staking transactions
* Ensure `Error.captureStackTrace` is defined before using, as this is not standard and only available in V8-based Javascript runtimes.

### Other Changes
* Improve the `DEVELOPERS.md` document, which helps to onboard new developers who want to work on the BitGo SDK itself.
* Add a basic GitHub issue template

## 9.2.0 (12-10-2019)

### Other Changes
* Update `bitgo-utxo-lib` to version 1.7.0 for new ZCash chain parameters
* Check for wrapped segwit unspents in express v1 integration test

## 9.1.0 (12-04-2019)

### New Features
* Use BitGo Stellar Federation proxy for Stellar Federation lookups

### Bug Fixes
* Reject hop params for ERC20 token transaction builds, as these do not make sense

## 9.0.1 (11-27-2019)

### Bug Fixes
* Fix TRON recovery transaction object format

### Other Changes
* Include recovery amount for TRON recovery transactions

## 9.0.0 (11-20-2019)

### Breaking Changes
* Support for Node 6 has been dropped. Node 8 is now the oldest supported version.

### New Features
* Partial support for recoveries of TRON wallets

### Other Changes
* Remove deprecated v1 examples
* Update Javascript and Typescript examples
* Remove node 6 and node 11 from Drone CI

## 8.5.3 (12-17-2019)

### New Features
* Backported from 9.3.0: Return key registration data for Algorand's `explainTransaction()`

## 8.5.2 (11-13-2019)

### Bug Fixes
* Unify TRON keycard key format with other coins

## 8.5.1 (11-08-2019)

### Bug Fixes
* If given, pass seed to TRON account generation utility function provided by `bitgo-account-lib`

### Other Changes
* Resolve dependency `handlebars` to version 4.5.0
* Update dependency `bitgo-account-lib` to  version 0.1.5

## 8.5.0 (11-06-2019)

### New Features
* Enable usage of new Unspent Reservation system when building transactions. Using this feature allows a transaction to temporarily have an exclusive right to spend a one or more UTXO(s). This can help prevent unspent not found errors when sending interleaved transactions.
* Allow signing TRON transactions with a raw extended private key.
* Allow explaining a TRON transaction from the raw transaction hex using `explainTransaction()`

### Bug Fixes
* Remove unimplemented and unnecessary override of `deriveKeyWithSeed` for TRON
* Allow both base58 and hex addresses for TRON
* Fix number of decimals for offchain Stellar
* Return fully signed TRON transaction in same format as other coins

### Other Changes
* Import `@bitgo/statics` library into BitGo SDK monorepo
* Update `bitgo-account-lib` to version 0.1.4
* Recreate Stellar integration test wallets following testnet reset
* Limit Stellar trustline transactions by using base units instead of native units
* Temporarily use node 10 in Drone pipelines instead of LTS

## 8.4.0 (10-25-2019)

### New Features
* Allow removing Stellar Trustlines from a wallet
* Add additional environment presets for new BitGo backend environments

### Bug Fixes
* Fix incorrect precedence in environment configurations

### Other Changes
* Resolve `https-proxy-agent` to version 3.0.0 for patch in `ripple-lib`
* *Unstable feature*: Add support for sending from TRON hot wallets
* Add missing options types in `Wallet` and `Wallets` classes
* Add new internal method `manageUnspents` to `Wallet`. This method combines the fanouts and consolidation implementations into a single method. *Note:* There is no change to the public API.
* Enable more strict Typescript compilation options, update code which was not compatible

## 8.2.4 (10-18-2019)

__No changes__

## 8.2.3 (10-18-2019)

### Other Changes
* Update dependency `@bitgo/statics` to version 2.2.0

## 8.2.2 (09-27-2019)

### Bug Fixes
* Use `require()` instead of ES `import()` for dynamically importing ethereum dependencies. This was causing issues in browsers.

### Other Changes
* Resolve `handlebars` dependency to `^4.3.0` for patch in dev dependency

## 8.2.1 (09-24-2019)

### Bug Fixes
* Fix importing `ethereumjs-util` in browsers, where it was previously failing
* Fix hop transactions which need to go through a pending approval flow
* Fix two broken/flaky Ethereum and XRP tests

### Other Changes
* Allow custom env to use testnet server public key if network is testnet.
* Revert enabling batched Ethereum sends due to incompatibility in `validateTransaction`

## 8.2.0 (09-19-2019)

### New Features
* Generate and upload BitGo SDK documentation on each build run. See [here](https://bitgo-sdk-docs.s3.amazonaws.com/core/8.2.0/index.html) for an example.
* Improve `explainTransaction` so it can explain Stellar Trustline and Stellar Token transactions

### Bug Fixes
* Export all Typescript types which are part of the public API. If you find there is a type which is used in the public API but not exported, please open an issue.
* Fix incorrect implementation of `getChain` for Stellar Tokens
* Fix incorrect Content Type on documentation uploaded by Drone CI
* Fix inadvertent param rename instead of type specification, and duplicate identifier (thanks @workflow and @arigatodl)

### Other Changes
* Clean up and update all examples
* Separate JavaScript examples from Typescript examples
* Remove examples for removed v1 Ethereum code
* Improve error message displayed when optional Ethereum libraries could not be required
* *Unstable feature*: Allow for creation of TRON wallets

## 8.1.2 (09-19-2019)

### New Features
* Allow `gasLimit` param to be sent when prebuilding Ethereum transactions

### Bug Fixes
* Fix type custom type inclusion in bitgo module
* Move superagent type augmentation into `bitgo/types`

## 8.1.1 (09-11-2019)

### Bug Fixes
* Fix superagent typescript declaration augmentation
* Pass `gasLimit` when creating Ethereum transaction prebuilds

## 8.1.0

### New Features
* Use `@bitgo/statics` for ERC20 and OFC coin definitions

### Bug Fixes
* Fix bug in `isValidAddress` which would cause it to incorrectly return true for coins which don't support bech32.
* Remove deprecation markers for the following functions:
  * `verifyPassword()`
  * `generateRandomPassword()`
  * `extendToken()`

### Other Changes
* Upgrade `@bitgo/statics` to 2.0.0-rc.0
* Upgrade `bitgo-utxo-lib` to 1.6.0
* Enable `strictNullChecks` typescript compiler option
* More Typescript improvements across the project. `baseCoin.ts` and `bitgo.ts` in particular have seen much improvement.
* Fix HMAC errors when doing non-BitGo EOS recoveries

## 8.0.0

### Breaking Changes

#### Elimination of synchronous error behavior for async functions
* Previously, some async functions had strange error behavior where they would throw a synchronous error sometimes, and fail with a rejected promise other times. Which behavior you get for a given error is only really discoverable via source code inspection. Depending on how callers handled async calls and errors, this could break some callers.
* One example of a changed function is `bitgo.refreshToken()`, which previously would throw a synchronous error if the `params.refreshToken` were not provided. This function can also return a Bluebird promise, which will reject if there is a failure with the network request. If you are a caller who uses `.then()` to handle async behavior, some errors which previously required a surrounding `try`/`catch` will now fall through to a `.catch()` handler attached to the returned promise.

Perhaps an example will help clarify:

```javascript
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });

try {
  bitgo.refreshToken()
    .then(() => console.log('then'))
    .catch(() => console.log('async catch'));
} catch (e) {
  console.log('sync catch');
}
```

Previous to version 8, the string `sync catch` would have been printed for some errors, and `async catch` would have been printed for others. In version 8 and later, `async catch` should be printed regardless of the error encountered. If you find this is not the case, then this is a bug and please open issue so we can correct it. We may alter more async functions to match this behavior if needed, and this major version bump will cover those changes as well (there will not be another major version bump for similar changes in the future).

By eliminating one error channel, correct error handling is greatly simplified for callers. The goal here is to make all async functions always return a promise and never throw directly (instead, the returned promise would be rejected).

If you are relying on synchronous error behavior from an async function, this breaking change may require fixes in calling code.

**Note:** If you are using `async/await` syntax, or a helper library like Bluebird which turns async promise rejections into sync errors, this change will not affect you. We currently recommend using `async/await` syntax for new code written against BitGoJS.

If you believe you may be affected by this breaking change, and would like more information or a complete list of functions which have been altered in this way, please send an email to support at bitgo dot com.

#### Deprecation of v1 methods on BitGo object
* There are several methods on the BitGo object which have been deprecated in this release. These methods lead to the version 1 wallet codebase, and is a common source of errors for new users of BitGoJS. To make it clear that these are not the functions recommended for normal usage, they have been deprecated. The complete list of newly deprecated functions is as follows:
  * `sendOTP()`
  * `reject()`
  * `verifyAddress()`
  * `blockchain()`
  * `keychains()`
  * `market()`
  * `wallets()`
  * `travelRule()`
  * `pendingApprovals()`
  * `registerPushToken()`
  * `verifyPushToken()`
  * `newWalletObject()`
  * `estimateFee()`
  * `instantGuarantee()`
  * `getBitGoFeeAddress()`
  * `getWalletAddress()`
  * `listWebhooks()`
  * `addWebhook()`
  * `removeWebhook()`
  * `getConstants()`
  * `calculateMinerFeeInfo()`

Additionally, `ethSignMsgHash` in `util.ts` has been deprecated. This will be relocated to an Ethereum specific part of the code in the future.

Direct usage of the `env` property of the BitGo object has also been deprecated. Please use `bitgo.getEnv()` as an alternative.

**Note:** We have no immediate plans to remove these functions. If you are relying on these functions, they will continue to work, but you should begin considering alternatives provided by the version 2 wallet API. If you find there is a feature gap which is preventing you from moving to the v2 wallet API, please send an email to support at bitgo dot com.

**Note:** The following functions have been incorrectly marked as deprecated in the source code, but in fact are NOT deprecated. This will be fixed in the next version of BitGoJS:
* `verifyPassword()`
* `generateRandomPassword()`
* `extendToken()`

**Note:** We may deprecate more functions, and these deprecations may be done without a major version bump. However, prior to any deprecated method being actually removed and made unavailable, a major version bump will be required.

### New Features
* Add support for ERC 20 tokens (CIX100, KOZ, AGWD)

### Bug Fixes
* Fix incorrect parameters in keycard.ts (thanks @DCRichards)

### Other Changes
* Refactor Settlement API and add function for calculating settlement fees. Note that this API is still experimental and is not yet ready for general usage.
* Update microservices authentication route format.
* Improve Typescript support in expressApp, Ethereum and ERC 20 token implementations, recovery and BitGo object.

## 7.1.1

### Other Changes
* Allow creation of wallets with custom addresses, where supported (currently only EOS supports this feature).

## 7.1.0

### New Features
* Add support for new ERC 20 tokens (TGBP)
* Support for applying second signature to ALGO transactions
* Update EOS transaction prebuild format
* Implement `isValidAddress` for Offchain Tokens

### Bug Fixes

### Other Changes
* Improve Typescript support in many coin implementations.

## 7.0.0

### Breaking Changes
The `explainTransaction` method on in BaseCoin is now asynchronous. Callers of this method will need to resolve the returned promise in order to make use of the return value.

As an example, before the behavior of `explainTransaction` was as follows (parameters omitted for brevity):
```typescript
const explanation = bitgo.coin('tbtc').explainTransaction(...);
console.dir(explanation);
```

In version 7 and later, the behavior is now:
```typescript
const explanation = await bitgo.coin('tbtc').explainTransaction(...);
console.dir(explanation);
```

or, if you can't use async/await:
```typescript
bitgo.coin('tbtc').explainTransaction(...)
.then(explanation => {
  console.dir(explanation);
});
```

This breaking change was required since some of the coins we are considering adding in the future are unable to implement `explainTransaction` in a synchronous way.

### New Features
* Update contract address for ERC20 token LGO
* Add support for new ERC20 tokens (THKD, TCAD, EDN, EMX)

### Other Changes
* Add node version support policy to README
* Improve typescript support in many files, including `BaseCoin`, `Utils`, `AbstractUtxoCoin`, and several others
* Autoformat code upon commit and check code format during CI

## 6.2.0

### New Features
* Allow creating BitGo objects which use a custom Stellar Federation server URL.
* Add support for new ERC20 tokens (LEO, CREP, CBAT, CZRX, CUSDC, CDAI, CETH, VALOR).
* Update trade payload version to `1.1.1`.

### Bug Fixes
* Update to lodash@^4.17.4 for a vulnerability fix for CVE-2019-10744.
* Ensure amount is correctly passed through to server for Ethereum fee estimation
* Update ZEC block explorer used in recovery flows

### Other Changes
* Improve Typescript support in `webhooks.ts`, `internal.ts`, `common.ts`, and `environments.ts`

## 6.1.1

### Bug Fixes
* Fix issue where accepting a wallet share as a viewer would fail to correctly update the server.

## 6.1.0

### New Features
* Add support for deriving ed25519 hardened child public keys, used by XLM and other ed25519-based coins.
* Update documentation to point to new docker image for BitGo Express (`bitgo/express`). The `bitgo/express` image is now deprecated.
* Add support for new ERC20 tokens (DRPU, PRDX, TENX, ROOBEE, ORBS, VDX, SHR)

### Other Changes
* Preliminary support for EOS. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
* Validate Ethereum hop transaction signatures against static Platform HSM key instead of wallet BitGo key
* Improve Typescript support for `Wallet` and `Wallets` objects, as well as the XLM coin implementation
* Extract example keycard rendering logic out of `Wallet`

## 6.0.0
The BitGoJS SDK is being modularized! The code base has been split into two modules: `bitgo` and `express`.

`bitgo` contains the Javascript library that you get when you `require('bitgo')`.

`express` contains the source for the BitGo Express local signing server, and it uses the `bitgo` module to provide access to BitGoJS functionality over a REST interface.

The long term plan is to modularize based on each underlying coin library, so users of `bitgo` won't need to bring in many large dependencies for coins they aren't using. This may require additional major versions if breaking changes are required, but we will do as much as possible to maintain the current API of the BitGoJS SDK.

### Breaking Changes
* Users who pin a git hash of BitGoJS in their package.json will need to update their build steps, since the structure of the git repository has changed. If the desire is to simply use bitgo as a Javascript library outside a browser context, we recommend using a semantic version string instead of a git hash to specify which version should be installed. For development in a browser setting, a browser compatible bundle is now distrubuted in the package at `node_modules/bitgo/dist/browser/BitGoJS.min.js`. As an alternative to downloading the package from npm, a tarball of BitGoJS could also bundled in your application and used during install.
* `bitgo-express` is no longer bundled with the `bitgo` npm package. The recommended install instructions are now to install via the official Docker image `bitgo/express:latest`. If you aren't able to run bitgo-express via Docker, you can also install and run `bitgo-express` from the source code. See the [`bitgo-express` README](https://github.com/BitGo/BitGoJS/tree/master/modules/express#running-bitgo-express) for more information on how to install and run BitGo Express.
* For version 1 wallets, the bitcoin network by the BitGo object is no longer global, and is now determined by the bitgo object's environment when it was initialized.

As an example, before the behavior was as follows:
```typescript
const BitGoJS = require('bitgo');
// create a new bitgo object using the default (test) environment
const bitgo = new BitGoJS.BitGo();

// BAD: Global network is checked by all bitgo objects, but this
// leads to race conditions when multiple bitgo objects are setting the
// global bitcoin network unpredictably
BitGoJS.setNetwork('bitcoin');
// verify a main net address using bitgo object using test environment
bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();
```

After version 6, the behavior will change to this:
```typescript
const BitGoJS = require('bitgo');

// create a new bitgo object using the default (test) environment
const bitgo = new BitGoJS.BitGo();

// BREAKING CHANGE: returns false since this bitgo object is using
// the test environment and cannot verify a main net address
bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();

// create a new bitgo object using the production environment
const prodBitgo = new BitGoJS.BitGo({ env: 'prod' });

// OK: Able to verify main net address with bitgo using production environment
prodBitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }).should.be.true();
```

To switch to another bitcoin network, a new bitgo object should be constructed in the correct environment.

### New Features
* Preliminary support for BitGo Trading Account and Settlement APIs. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
* Preliminary support for Algorand. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
* Add support for new ERC 20 Token (PDATA)

### Other Changes
* Overhaul how coins are loaded, in anticipation of a pluggable coin system in a future version of `bitgo`.
* Rework CI system to reduce test runtimes by running tests for each module in parallel
* Remove coin instantiation logic from BaseCoin and move methods to prototype instead of attaching to coin object instances.

## 5.4.0

### New Features
* Add support for verifying and signing Ethereum hop transactions
* Add support for new ERC 20 tokens (TIOX, SPO)

### Bug Fixes
* Remove duplicate ERC 20 token definition (AION)

## 5.3.0

### New Features
* Add support for new ERC 20 tokens (USX, EUX, PLX, CQX, KZE)

### Other Changes
* Improve test performance by making more requests in parallel when checking wallet funding
* Fix bitgo-express startup command on Windows where the shebang line is ignored

## 5.2.0

### New Features
* Add support for new ERC 20 tokens (WHT, AMN, BTU, TAUD)
* Add support for trade payload signing

### Bug Fixes
* Allow sharing "pseudo-cold" wallets where the encrypted user key is not held by BitGo.
* Correctly update matching wallet passphrases when the user login password is updated.
* Add missing filter parameters in `wallet.transfers`.

### Other Changes
* Update README to clarify package description and improve example snippets

## 5.1.1

### Bug Fixes
* Separate input signing and signature verification steps in `AbstractUtxoCoin.signTransaction`. This fixes an issue where Native Segwit inputs which were not the last input in the transaction were not being properly constructed.

## 5.1.0

### New Features
* Add support for counting the number of valid signatures on Native Segwit transaction inputs in `explainTransaction`.

### Bug Fixes
* Update `bitgo-express` startup command in README. Running directly from the cloned git repository is no longer recommended.
* Add install size and timing metrics to CI system.

### Other Changes
* Remove version 1 support for Ethereum wallets and associated tests. This functionality has been broken for some time due to the required server side routes being removed.

**V2 Ethereum wallets are unaffected**. If your Ethereum wallet was working before this change, it will continue functioning normally.

## 5.0.4

### Bug Fixes
* Fix `npm audit` failures caused by newly disclosed vulnerabilities in development dependencies `eslint`, `husky`, `lint-staged`, and `nyc`. This fix has been backported to the `bitgo@4` series as release `4.49.2`.

## 5.0.3

### Bug Fixes
* Fix unhanded error in `explainTransaction()` causing approval failures for transactions which require replay protection.

### Notes
* This version was not published to npm due to `npm audit` failures which would be present upon install. These issues were fixed in version 5.0.4, which was released on npm.

## 5.0.2

### Bug Fixes
* Readd ERC 20 token `NAS`

## 5.0.1

### Bug Fixes
* Fix incorrect import in test file that was causing errors on install and when running tests (#297)

## 4.49.2
This is a maintenance update to the `bitgo@4` major version.

### Bug Fixes
* Backport updates to dev dependencies `nyc` and `fsevents` to fix `npm audit` failures.

## 4.49.1
This is a maintenance update to the `bitgo@4` major version.

### Bug Fixes
* Update `@bitgo/unspents` to 0.5.1 for a fix for an incompatibility issue in `tsc@3.4`

## 5.0.0
* BitGoJS is now a typescript project!
  * `tsc` now runs as a prepublish step.
  * We have added type definitions to some of our coin specific files, and we will continue to add and improve on our published type information.

### Breaking Changes
* Dropped support for node versions below 6.12.3. We will be publishing a more detailed policy on node and npm version support soon.

### New Features
* Typescript
* Type information for XRP and TXRP
* Added support for new ERC 20 tokens (UPT, UPUSD, UPBTC, FET)

### Bug Fixes
* Removed duplicated transaction and address contants in favor of using `@bitgo/unspents` for equivalent contants.
* Fix error thrown when randomly generated private key starts with a zero byte which would cause message signing failures. Transaction signing is not affected.
* Fix bug which caused only the first consolidation transaction to be returned from `consolidateTransaction()` for v1 wallets instead of all transations.

### Other changes
* Updated the install instructions for BitGoJS to `npm install bitgo` instead of cloning the project directly. This has an effect on how to run `bitgo-express`. To install and run `bitgo-express`, the recommended command is `npm install -g bitgo && npm explore -g bitgo -- bin/bitgo-express`.
* Upgraded eslint to 5.15.1, which entails dropping support for development on BitGoJS on node versions below 6.14.0. If you need to develop on node 6.x, please use at least 6.14.0, and consider upgrading soon as [node 6 is scheduled to reach end-of-life on April 30, 2019](https://github.com/nodejs/Release#release-schedule). Only users of BitGoJS who are contributing source code changes are affected by this requirement. End users can continue using node versions >=6.12.3, but please upgrade soon.
* Remove karma browser testing framework. We will be revamping our browser testing in a future release.

### Common Issues when Upgrading

#### Warning on installation

You may notice a warning when installing BitGoJS about using a deprecated script type:
```
npm WARN prepublish-on-install As of npm@5, `prepublish` scripts are deprecated.
npm WARN prepublish-on-install Use `prepare` for build steps and `prepublishOnly` for upload-only.
npm WARN prepublish-on-install See the deprecation note in `npm help scripts` for more information.
```

This is expected, and we cannot yet change to using a prepare script because this script type is not yet available in some of our supported npm versions.

#### Potential error when starting `bitgo-express`
If you see the following error when running `bin/bitgo-express`, it means the typescript files have not been compiled.
```
module.js:478
    throw err;
    ^

Error: Cannot find module '../dist/src/expressApp'
    at Function.Module._resolveFilename (module.js:476:15)
    at Function.Module._load (module.js:424:25)
    at Module.require (module.js:504:17)
    at require (internal/module.js:20:19)
    at Object.<anonymous> (/bitgo-dep/node_modules/bitgo/bin/bitgo-express:5:66)
    at Module._compile (module.js:577:32)
    at Object.Module._extensions..js (module.js:586:10)
    at Module.load (module.js:494:32)
    at tryModuleLoad (module.js:453:12)
    at Function.Module._load (module.js:445:3)
    at Module.runMain (module.js:611:10)
    at run (bootstrap_node.js:394:7)
    at startup (bootstrap_node.js:160:9)
    at bootstrap_node.js:507:3
```
To fix this, You can compile the typescript source manually by running `npm explore bitgo -- npm run prepublish`.

#### Installing as root
`npm` does not run prepublish scripts if it is running as root. This means the typescript source will not be compiled and an error will be thrown when attempting to require bitgo. This includes installing bitgojs as a dependency in the node_modules of another project.

When this happens, you will see this message when running `npm install`:
```
npm WARN lifecycle bitgo@5.0.0~prepublish: cannot run in wd %s %s (wd=%s) bitgo@5.0.0 tsc /bitgojs
```

If you really need to install BitGoJS as root, you'll have to install it using `npm install --unsafe-perm`.

## 4.49.0
### New Features
- Complete support for native segwit address generation and verification
- Ensure match between addressType and chain parameters when calling `generateAddress()`
- Use `@bitgo/unspents` for address chain information
- Add support for overriding the server extended public key used by BitGoJS
- Add support for new ERC 20 tokens (SLOT, ETHOS, LBA, CDAG)

### Bug Fixes
- Get latest block height and transaction prebuild in parallel

### Deprecation Notices
The following parameters to the `generateAddress()` function on `Wallet` objects have been deprecated, and will be removed in a future version of BitGoJS:
- `addressType`
- `segwit`
- `bech32`

Instead, the address type will be determined by the `chain` parameter, with the following behavior:

| chain | type | format | usage    |
| ----- | ---- | ------ | -------- |
| 0     | pay to script hash | base58 | External |
| 1     | pay to script hash | base58 | Internal (change) |
| 10    | wrapped segwit | base58 | External |
| 11    | wrapped segwit | base58 | Internal (change) |
| 20    | native segwit | bech32 | External |
| 21    | native segwit | bech32 | Internal (change) |

## 4.48.1
### Bug Fixes
- Treat errors thrown from `verifySignature` as an invalid signature

## 4.48.0
### New Features
- Add ability to count signatures on a utxo transaction to `explainTransaction()`
- Add support for generating unsigned sweep transactions for Stellar Lumens (XLM) and Ripple XRP (XRP)
- Add support for recovering Bitcoin Satoshi Vision (BSV) inadvertently sent to a Bitcoin (BTC) address
- Add support for new ERC 20 Tokens (BAX, HXRO, RFR, CPLT, CSLV, CGLD, NZDX, JPYX, RUBX, CNYX, CHFX, USDX, EURX, GBPX, AUDX, CADX, GLDX, SLVX, SLOT, TCAT, TFMF)

### Bug Fixes
- Improve handling proxy request timeouts from bitgo-express
- Prevent rebuilding OFC transactions upon transaction approval
- Allow creation of new addresses on wallets returned from `wallets().list()`
- Return actual fee used from `wallet.sendMany()` instead of fee estimate
- Fix date and name on LICENSE
- Update dev-dependency karma to 4.0.1 to fix minor upstream vulnerability
- Allow accessing `oauth/token` route from bitgo-express
- Add `.nvmrc` with version set to `lts/carbon`
- Fix ERC 20 Token BID decimal places

### API changes
- Remove `bech32` parameter option from `createAddress`
- Add `strategy` parameter option to `prebuildTransaction` for setting the preferred unspent selection strategy

## 4.47.0
### New Features
- Add support for new ERC 20 Token (BAX)
- Allow passing custom unspent fetch parameters to `createTransaction`
- Handle missing optional Ethereum dependencies more gracefully
- Allow fetching of SegWit unspents for Ledger-backed wallets

### Bug Fixes
- Specify exact versions of dependencies
- Update token contract hash for ERC20 Token (BID)

## 4.46.0
### New Features
- Add support for new ERC 20 Tokens (AMON, CRPT, AXPR, GOT, EURS)

### Bug Fixes
- Use normalized amount field for recovery amounts for UTXO coins

## 4.45.1
### Bug Fixes
- Do not sign replay protection inputs for TBSV

## 4.45.0
### New Features
- Add support for recovering BTC segwit unspents
- Add support for new ERC 20 Tokens (HEDG, HQT, HLC, WBTC)
- Add some plumbing for BSV and OFC support
- Support coinless API routes in Bitgo Express

### Bug Fixes
- Allow XLM recovery to previously unfunded addresses
- Correctly handle sends with a custom change address

## 4.44.0
### New Features
- CPFP support for v2 BTC wallets
- New function on v2 keychains prototype (`updateSingleKeychainPassword`) to change a keychain's password
- Improve sequenced request ID support to cover more requests

### Bug Fixes
- Fix an issue involving approving multiple pending approvals whose transactions spent the same unspent.
- Improve formatting for large numbers used in `baseUnitsToBigUnits`
- Disallow proxying of non-API requests through BitGo Express
- Check for both `txHex` and `halfSigned` parameters in Wallet `prebuildAndSignTransaction`
- Improve handling of failed stellar federation lookups
