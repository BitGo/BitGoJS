# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
