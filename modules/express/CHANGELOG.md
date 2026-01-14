# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [15.18.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.18.1...@bitgo/express@15.18.2) (2026-01-14)


### Bug Fixes

* **express:** allow string for feeRate ([aa76013](https://github.com/BitGo/BitGoJS/commit/aa76013e20f34d83858034238f805c2d85c7bc78))





## [15.18.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.18.0...@bitgo/express@15.18.1) (2026-01-07)

**Note:** Version bump only for package @bitgo/express





# [15.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.17.1...@bitgo/express@15.18.0) (2025-12-23)


### Features

* migrate handleCreateSignerMacaroon ([10d8d14](https://github.com/BitGo/BitGoJS/commit/10d8d1408d823b8663b218fddc75992dc0dcf9d4))
* **sdk-core:** support forwarderVersion 5 in createAddress ([36ffe11](https://github.com/BitGo/BitGoJS/commit/36ffe11ff6216e6fd461a4fd3633ea613cf98f1f))





## [15.17.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.17.0...@bitgo/express@15.17.1) (2025-12-17)

**Note:** Version bump only for package @bitgo/express





# [15.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.16.1...@bitgo/express@15.17.0) (2025-12-11)


### Features

* added evmKeyRingReferenceWalletId in GenerateWalletBody ([f40414b](https://github.com/BitGo/BitGoJS/commit/f40414b556f652a3595ec1522684b50638f89fff))





## [15.16.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.16.0...@bitgo/express@15.16.1) (2025-12-05)


### Bug Fixes

* **express:** support legacy EIP1559 transaction in type validation ([6c5e13f](https://github.com/BitGo/BitGoJS/commit/6c5e13f0cba9aeb15dc0304a73b9cb1d1318e9fa))





# [15.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.15.0...@bitgo/express@15.16.0) (2025-12-04)


### Bug Fixes

* fix the operation id to be according to the doc ([6bd7be3](https://github.com/BitGo/BitGoJS/commit/6bd7be391fa99bf067a4f1b78b3483e97b1f44ba))


### Features

* **express:** migrated accelerateTx to type route ([343dc5e](https://github.com/BitGo/BitGoJS/commit/343dc5e09d0323226c74e929091974170d2bc24a))
* **express:** migrated wallet enableTokens to type route ([1708658](https://github.com/BitGo/BitGoJS/commit/1708658a279ac2b0b32a871904ba13b975d08074))
* **express:** update change keychain password for ofc multi-user-key wallet ([c306c97](https://github.com/BitGo/BitGoJS/commit/c306c976befa5b235769a5fba1d37b7be82c0c17))





# [15.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.14.0...@bitgo/express@15.15.0) (2025-11-26)


### Bug Fixes

* **express:** sendMany transfers optional field ([166deae](https://github.com/BitGo/BitGoJS/commit/166deae35c50598fdd10ef0073f925bd90fcfef8))


### Features

* add isWalletAddress endpoint ([19e2f44](https://github.com/BitGo/BitGoJS/commit/19e2f4472785903b0449934506932e9bfc2c2ac4))
* **express:** consolidateAccountV2 handler return type ([c503069](https://github.com/BitGo/BitGoJS/commit/c503069abaaa6f7263989e0d4be14c5c0c6cb826))
* **express:** migrated canonicalAddress to type route ([3a4b4f7](https://github.com/BitGo/BitGoJS/commit/3a4b4f7ff682569bd445da0c2a2ed98bc07d1a89))
* **express:** migrated wallet sweep to type route ([111ebe6](https://github.com/BitGo/BitGoJS/commit/111ebe6f07d24b54ab079dc8046a94d7aa0c90d5))





# [15.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.13.1...@bitgo/express@15.14.0) (2025-11-19)


### Bug Fixes

* **express:** pendingApprovalV1 type codec ([00e4c72](https://github.com/BitGo/BitGoJS/commit/00e4c727f475c24221f8653de2710ac3ff23bab0))
* **express:** signTransactionV1 type codec ([ddc28a3](https://github.com/BitGo/BitGoJS/commit/ddc28a3ea45deaa9e1f5039a5c191b37869b1e11))
* **express:** simpleCreateV1 type codec ([3f0faf7](https://github.com/BitGo/BitGoJS/commit/3f0faf7a73c1715abf0508c984b8d60349b27bd0))


### Features

* bump public types ([bab6c62](https://github.com/BitGo/BitGoJS/commit/bab6c624682c1317456376e6bf7e6691224405b9))
* **express:** migrated lightningPayment to type route ([f1f065d](https://github.com/BitGo/BitGoJS/commit/f1f065de882d81350c5bf52ddf124afcf11c2a13))
* **express:** migrated lightningWithdraw to type route ([1feb50c](https://github.com/BitGo/BitGoJS/commit/1feb50cc2b9c48dc2dcbf903e22f5d6c0dc95688))
* **express:** migrated pendingApprovalV2 to type route ([9769ded](https://github.com/BitGo/BitGoJS/commit/9769ded8e1f651c713180ea3762ff5a98c457975))





## [15.13.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.13.0...@bitgo/express@15.13.1) (2025-11-13)

**Note:** Version bump only for package @bitgo/express





# [15.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.12.0...@bitgo/express@15.13.0) (2025-11-12)


### Bug Fixes

* add BooleanFromString codec to openapi-generator config ([ff30b3e](https://github.com/BitGo/BitGoJS/commit/ff30b3eee8f3659ac5a82ff446c3839e876eb08f))
* codec definition ([3b1a673](https://github.com/BitGo/BitGoJS/commit/3b1a67386c8698d3f35be51cec30ade057404520))
* **express:** acceptShare type codec ([8749ead](https://github.com/BitGo/BitGoJS/commit/8749eadcd30c538dd2b64c9852457669a0d2d503))
* **express:** consolidateUnspents v1 type codec ([6e500aa](https://github.com/BitGo/BitGoJS/commit/6e500aa276050e8a7343436d8a51cb5aa9a38e66))
* **express:** consolidateUnspentsV2 type codec ([e088390](https://github.com/BitGo/BitGoJS/commit/e0883901334b287c7ca7fd06bdcf4af8c019ff23))
* **express:** construct pending approval type codec ([3e5d4e1](https://github.com/BitGo/BitGoJS/commit/3e5d4e1f5c48490e5bd4b906f9829844bc40145b))
* **express:** createLocalKeyChain type codec ([b73a598](https://github.com/BitGo/BitGoJS/commit/b73a598673aa9b5a59c79bc94f25610cd417b059))
* **express:** fanoutUnspentsV1 type codec ([aa72bb2](https://github.com/BitGo/BitGoJS/commit/aa72bb2a4302ff79fc03d2ce5443dc1db6039baa))
* **express:** fanoutUnspentsV2 type codec ([fc6bb6d](https://github.com/BitGo/BitGoJS/commit/fc6bb6d8d59c78348b4c12328fe42892cbc9cdbe))
* use openapi syntax for path definition ([f39557d](https://github.com/BitGo/BitGoJS/commit/f39557d928b100d8416ab65892bcef2c8158e269))


### Features

* add audit api specs to pr checks ([d1bfac5](https://github.com/BitGo/BitGoJS/commit/d1bfac533f526b3d1f022af2cd27ce88ba526f97))
* **express:** migrated generate tssshare to type route ([44c7cf7](https://github.com/BitGo/BitGoJS/commit/44c7cf7ce09b35e758372b2e034d43d9462586ec))
* **express:** migrated ofcExtSignPayload to type route ([4058591](https://github.com/BitGo/BitGoJS/commit/40585913c9778950c2f7392b7c29e67bb9cb1527))
* **express:** migrated sendCoins to type route ([ed8125f](https://github.com/BitGo/BitGoJS/commit/ed8125f4f06f8002a91756c3ee6e489a9d3b5543))
* **express:** migrated sendmany as type route ([6ef2483](https://github.com/BitGo/BitGoJS/commit/6ef2483c54fb3d2772710d19ac2aa433f9affbbc))
* **sdk-core:** add automatic signature cleanup for Express TSS signing ([1a8eff8](https://github.com/BitGo/BitGoJS/commit/1a8eff8fb5eab0d3a3e670a57fb966684c9c8c7d))





# [15.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.11.0...@bitgo/express@15.12.0) (2025-11-06)


### Bug Fixes

* **express:** fixed type codec for coinSign ([d79df81](https://github.com/BitGo/BitGoJS/commit/d79df81a36ab5569a70c5259b4c9489273e10f82))
* **express:** fixed type codec for coinSignTx ([dfd5583](https://github.com/BitGo/BitGoJS/commit/dfd558373e56320d8f5cc7c822976ea2262e162e))
* **express:** fixed type codec for coinSignTx ([425d6ae](https://github.com/BitGo/BitGoJS/commit/425d6ae406e9f4438b0b0b2cc5c56f75af61f3c4))
* **express:** fixed type codec for prebuildSignTrans ([7b3e1e8](https://github.com/BitGo/BitGoJS/commit/7b3e1e889c928a607afad66ec824633647669f80))
* **express:** removed optional from partial type ([d67c409](https://github.com/BitGo/BitGoJS/commit/d67c409798cdcfa22409fe61137a03140deddb31))
* **express:** walletRecoverToken type codec ([e82bebb](https://github.com/BitGo/BitGoJS/commit/e82bebb3a525c020b386009fa98d3829d11a6862))
* **express:** walletSignTx type codec ([2dc3b77](https://github.com/BitGo/BitGoJS/commit/2dc3b771e9bee21601f6d63143178ff3ca0faa57))
* **express:** walletTxSignTSS type codec ([15efc22](https://github.com/BitGo/BitGoJS/commit/15efc2206eae1de5936c6f2e765f61730ad30c09))


### Features

* **express:** migrated coinSign as type route ([e53a947](https://github.com/BitGo/BitGoJS/commit/e53a947580b771868e721f9b65500512edfa57c3))
* **express:** migrated prebuildAndSignTrans as type route ([fbc0e56](https://github.com/BitGo/BitGoJS/commit/fbc0e560876b0d812d7b9b12faffa145a0541af3))





# [15.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.10.1...@bitgo/express@15.11.0) (2025-10-31)


### Bug Fixes

* **express:** fixed fanoutunspents response codec ([7e2f112](https://github.com/BitGo/BitGoJS/commit/7e2f112c7022344d423a85d94f6117b8ed17a7d3))


### Features

* **express:** migrated consolidateunspents as type route ([24a8953](https://github.com/BitGo/BitGoJS/commit/24a89532f2d5534199cc7ba751b5db650dcee3d8))
* **express:** migrated fanoutunspents as type route ([bf055ab](https://github.com/BitGo/BitGoJS/commit/bf055ab515884c3ceefe92c8cfe6bd73c6b200e2))





## [15.10.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.10.0...@bitgo/express@15.10.1) (2025-10-29)


### Bug Fixes

* revert changes from WP-4376 ([e35665a](https://github.com/BitGo/BitGoJS/commit/e35665a4e167474e550c08a1cf83797ee65b357d))





# [15.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.9.0...@bitgo/express@15.10.0) (2025-10-24)


### Features

* **express:** migrate update keychain passphrase to typed routes ([419045f](https://github.com/BitGo/BitGoJS/commit/419045f68ed5511b8681419af198abd84ab267a8))
* **sdk-core:** add typing on fetch addresses ([f3dec74](https://github.com/BitGo/BitGoJS/commit/f3dec74befc76bb305a4f9ac72975e4de43787ff))





# [15.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.8.0...@bitgo/express@15.9.0) (2025-10-21)


### Features

* **express:** migrate shareWallet to typed routes ([ba0d219](https://github.com/BitGo/BitGoJS/commit/ba0d21903c78eb1d137271d69407a79bf3ed028e))
* **express:** migrated update express wallet to typed routes ([c47d741](https://github.com/BitGo/BitGoJS/commit/c47d74101c8c091349e3332a68850a803b96ee6a))





# [15.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.7.0...@bitgo/express@15.8.0) (2025-10-16)


### Features

* bump public types ([ca817a6](https://github.com/BitGo/BitGoJS/commit/ca817a637015a33584fd68dbf5c36592b6a13608))
* **express:** setup integration test ([cae56ab](https://github.com/BitGo/BitGoJS/commit/cae56ab1195c49654a9b1e28269b09b8c1171845))
* lightning on chain intent change ([ecc0db9](https://github.com/BitGo/BitGoJS/commit/ecc0db9d8fe5b7206b5738e08504525832099a5a))





# [15.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.6.0...@bitgo/express@15.7.0) (2025-10-13)


### Bug Fixes

* req decoded params ([5cc3782](https://github.com/BitGo/BitGoJS/commit/5cc37823a0d3c7539e1130148c75f8cea9e87b1f))


### Features

* **express:** moved wallet signtxtss to typed route ([8ca5c81](https://github.com/BitGo/BitGoJS/commit/8ca5c813398f83b8548dcb118b206759f3cf2566))
* **express:** used req decoded params ([bd96647](https://github.com/BitGo/BitGoJS/commit/bd966470aa414827b583293ae3af63f7ebe860a7))





# [15.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.5.0...@bitgo/express@15.6.0) (2025-10-10)


### Features

* **express:** added type from public types ([53fe28b](https://github.com/BitGo/BitGoJS/commit/53fe28bf2f6e193174d72a3bafc0544eead9ea5c))
* **express:** migrate wallet signTx to typed routes ([335fe30](https://github.com/BitGo/BitGoJS/commit/335fe3060ac3cc21f696fc99d7b4404b6f807ef5))





# [15.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.4.0...@bitgo/express@15.5.0) (2025-10-09)


### Features

* **express:** migrate coinSignTx to typed routes ([c2638e0](https://github.com/BitGo/BitGoJS/commit/c2638e08308283f9a32b4efe78520472276d991f))





# [15.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.3.0...@bitgo/express@15.4.0) (2025-10-08)


### Features

* **express:** migrate createAddress to typed routes ([2724ac2](https://github.com/BitGo/BitGoJS/commit/2724ac2e82ac8b8713aacf1939f03e98fd04b3f0))
* **express:** migrate recover token to typed routes ([4eac889](https://github.com/BitGo/BitGoJS/commit/4eac889de60671b3fc0ae023218b3e19f490143c))
* **express:** migrated ofcSignPayload to typed routes ([cbf3084](https://github.com/BitGo/BitGoJS/commit/cbf3084f1d48b70c2bf953e06fdc4103bbcdae3e))





# [15.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.2.0...@bitgo/express@15.3.0) (2025-10-02)

### Bug Fixes

- resolve webpack-dev-server to v5.2.1 ([11c7987](https://github.com/BitGo/BitGoJS/commit/11c7987255794eabc05e63cc80cec1dd020d9424))

### Features

- **express:** migrate consolidateUnspents to typed routes ([af8f7d4](https://github.com/BitGo/BitGoJS/commit/af8f7d43058b6ab01efb6e32087dd5a967b15ff5))
- **express:** migrate fanoutunspents to typed routes ([05b3b85](https://github.com/BitGo/BitGoJS/commit/05b3b85c714a2caa5ca3eb63495e3b0a5d347ea8))

# [15.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.1.0...@bitgo/express@15.2.0) (2025-09-29)

### Bug Fixes

- **express:** remove hardcoded dockerfile labels ([69e6314](https://github.com/BitGo/BitGoJS/commit/69e6314ac0a27b9d09dc117c9ee78bf5f6bf4bc0))

### Features

- **express:** migrate constrctTx to typed routes ([df72204](https://github.com/BitGo/BitGoJS/commit/df722045f893e344a4a8eb4aa49d31179db5fe00))
- **express:** migrate createLocalKeyChain to typed routes ([912614a](https://github.com/BitGo/BitGoJS/commit/912614aab0904ef2577f28235133bef059fa1d29))
- **express:** migrate getlightningstate to typed routes ([916d430](https://github.com/BitGo/BitGoJS/commit/916d4308e67e08c9a9b1c7440c2bef0b278a92f3))
- **express:** migrate unlocklightningwallet to typed routes ([24078a5](https://github.com/BitGo/BitGoJS/commit/24078a52f475f44f358dbea1d126b01fd40a821a))

# [15.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@15.0.0...@bitgo/express@15.1.0) (2025-09-25)

### Bug Fixes

- **express:** express version update ([6d399e7](https://github.com/BitGo/BitGoJS/commit/6d399e72260c396752bcbe5f41d35de899798b96))
- **express:** signPayload API to handle stringified payload as req ([1423d8b](https://github.com/BitGo/BitGoJS/commit/1423d8b7663c1890afc58995e6febbdec374e39d))

### Features

- bumped public types ([6bd0aec](https://github.com/BitGo/BitGoJS/commit/6bd0aecb700a740f76c169b1476e1832bc3abe22))
- configure learn to skip git operations ([ee3a622](https://github.com/BitGo/BitGoJS/commit/ee3a6220496476aa7f4545b5f4a9a3bf97d9bdb9))
- **express:** migrate calculateminerfeeinfo to typed routes ([5f2771d](https://github.com/BitGo/BitGoJS/commit/5f2771d611a674197b6078deb9f2caa06ce81ec1))
- **express:** migrate deriveLocalKeyChain to typed routes ([0f07658](https://github.com/BitGo/BitGoJS/commit/0f076587673477f7e93ccd5747b1b03e5b927960))
- **express:** migrate init wallet to typed routes ([685ae3c](https://github.com/BitGo/BitGoJS/commit/685ae3c60677a84ef6598b46bfb5d3957e5cf28e))
- **express:** migrate keychainlocal to typed routes ([fd693d9](https://github.com/BitGo/BitGoJS/commit/fd693d9725722400f98347a3aba113d39aabf1c6))
- **express:** typed router for verifycoinaddress ([7b55f11](https://github.com/BitGo/BitGoJS/commit/7b55f11cf11f5746f87680ec6995fb56cf5dab42))
- **express:** typed router for verifycoinaddress ([b73c31d](https://github.com/BitGo/BitGoJS/commit/b73c31dce64e9b96c1c09c65895c6d1e2db7fe58))
- **express:** typed router for verifycoinaddress ([ed5b056](https://github.com/BitGo/BitGoJS/commit/ed5b056d9ce9ca6a49c487abd6e1cd4f2030c9d3))
- **sdk-coin-flrp:** added keypair and utils ([71846e7](https://github.com/BitGo/BitGoJS/commit/71846e7431af97736e1babe7dc0fc2953639192a))

# [15.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.6.1...@bitgo/express@15.0.0) (2025-09-03)

### Features

- adding signature in withdraw lightning ([514aaee](https://github.com/BitGo/BitGoJS/commit/514aaeebf0e6a20c78f9a3beb7715a77d2b0b9dc))
- **express:** migrate encrypt to typed routes ([48e162d](https://github.com/BitGo/BitGoJS/commit/48e162d601f95bc541386e548216768950d7c3f9))

### BREAKING CHANGES

- withdraw request changed

## [14.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.6.0...@bitgo/express@14.6.1) (2025-08-30)

**Note:** Version bump only for package @bitgo/express

# [14.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.5.0...@bitgo/express@14.6.0) (2025-08-29)

### Features

- **express:** enable esModuleInterop to align test and runtime ([8d163f9](https://github.com/BitGo/BitGoJS/commit/8d163f9bb6894a9b3b28407927ad86b7a2863df5))

# [14.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.4.0...@bitgo/express@14.5.0) (2025-08-27)

### Features

- bump public types ([e98036a](https://github.com/BitGo/BitGoJS/commit/e98036a8480aa6cfbc55b092a439ba8f80d23656))
- **express:** migrating to typed router ([d44f2c5](https://github.com/BitGo/BitGoJS/commit/d44f2c57db83f732989ea9166ca94da2e0e1707b))

# [14.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.3.1...@bitgo/express@14.4.0) (2025-08-22)

### Bug Fixes

- **express:** replace sinon stubs with proxyquire for ESM compatibility ([aad6d60](https://github.com/BitGo/BitGoJS/commit/aad6d6009cd8e8ee1b4f594256dacab54f5fe3d9))

### Features

- **root:** migrate ts-node -> tsx ([ea180b4](https://github.com/BitGo/BitGoJS/commit/ea180b43001d8e956196bc07b32798e3a7031eeb))

## [14.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.3.0...@bitgo/express@14.3.1) (2025-08-22)

### Bug Fixes

- **express:** adding jsdoc ([1baa22c](https://github.com/BitGo/BitGoJS/commit/1baa22c7f6b240c6b056c87fddfba218d6c2bd58))

# [14.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.2.0...@bitgo/express@14.3.0) (2025-08-19)

### Bug Fixes

- **express:** fix testcases and move to correct file ([bfac86e](https://github.com/BitGo/BitGoJS/commit/bfac86e0efa19e90574c80e21f5b1070fc93c65f))

### Features

- **express:** migrate v1 wallet create to typed routes ([8968cb8](https://github.com/BitGo/BitGoJS/commit/8968cb89b167213ec2e7ae095519a3b62783f758))
- **express:** typed-router for pendingApprovals ([31504f0](https://github.com/BitGo/BitGoJS/commit/31504f037a236bbdfa87f3e15219fa75ff6f56ad))

# [14.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.7...@bitgo/express@14.2.0) (2025-08-14)

### Bug Fixes

- **express:** generated xprv is permissioned only for owner ([36309f3](https://github.com/BitGo/BitGoJS/commit/36309f3badfa255e4623f352acbaea1c37b1852d))

### Features

- **express:** migrate decrypt to typed routes ([dcddaf6](https://github.com/BitGo/BitGoJS/commit/dcddaf63c3b86df72151ad96be9d64a6251058e8))
- **express:** migrate user.login to typed routes ([917dc0f](https://github.com/BitGo/BitGoJS/commit/917dc0f4876b5e77479c0872dce37e6b2f3a7fb8))
- **express:** migrate verify address to typed routes ([eacbff8](https://github.com/BitGo/BitGoJS/commit/eacbff8e533ca6cad6f170d8016ca06ba654b77a))

## [14.1.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.6...@bitgo/express@14.1.7) (2025-08-07)

**Note:** Version bump only for package @bitgo/express

## [14.1.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.5...@bitgo/express@14.1.6) (2025-07-31)

**Note:** Version bump only for package @bitgo/express

## [14.1.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.4...@bitgo/express@14.1.5) (2025-07-30)

**Note:** Version bump only for package @bitgo/express

## [14.1.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.2...@bitgo/express@14.1.4) (2025-07-25)

**Note:** Version bump only for package @bitgo/express

## [14.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.2...@bitgo/express@14.1.3) (2025-07-23)

**Note:** Version bump only for package @bitgo/express

## [14.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.1...@bitgo/express@14.1.2) (2025-07-15)

**Note:** Version bump only for package @bitgo/express

## [14.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.1.0...@bitgo/express@14.1.1) (2025-07-10)

**Note:** Version bump only for package @bitgo/express

# [14.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.0.4...@bitgo/express@14.1.0) (2025-07-03)

### Features

- added withdrawStatus in response lightning ([8666309](https://github.com/BitGo/BitGoJS/commit/866630934dfdea696d5f185e18785278999bb9cc))
- **express:** add name field with default name on error ([8987ab9](https://github.com/BitGo/BitGoJS/commit/8987ab9e1b1e426c6be92262fd7fbab01d73e504))

## [14.0.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.0.3...@bitgo/express@14.0.4) (2025-06-25)

**Note:** Version bump only for package @bitgo/express

## [14.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.0.2...@bitgo/express@14.0.3) (2025-06-24)

**Note:** Version bump only for package @bitgo/express

## [14.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.0.1...@bitgo/express@14.0.2) (2025-06-18)

**Note:** Version bump only for package @bitgo/express

## [14.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@14.0.0...@bitgo/express@14.0.1) (2025-06-10)

**Note:** Version bump only for package @bitgo/express

# [14.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.6.3...@bitgo/express@14.0.0) (2025-06-05)

### Bug Fixes

- removed InvoiceInfo codec ([9864abf](https://github.com/BitGo/BitGoJS/commit/9864abf35bc721059204377a359583c82556df92))

### Features

- **root:** support node 22 ([c4ad6af](https://github.com/BitGo/BitGoJS/commit/c4ad6af2e8896221417c303f0f6b84652b493216))

### BREAKING CHANGES

- create invoice response changed

TICKET: BTC-2155

## [13.6.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.6.2...@bitgo/express@13.6.3) (2025-06-02)

**Note:** Version bump only for package @bitgo/express

## [13.6.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.6.1...@bitgo/express@13.6.2) (2025-05-28)

**Note:** Version bump only for package @bitgo/express

## [13.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.6.0...@bitgo/express@13.6.1) (2025-05-22)

**Note:** Version bump only for package @bitgo/express

# [13.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.5.1...@bitgo/express@13.6.0) (2025-05-20)

### Features

- **express:** add enclaved express configurations ([8ca192c](https://github.com/BitGo/BitGoJS/commit/8ca192c2cdb6adce108c57431c60306d508e7812))

## [13.5.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.5.0...@bitgo/express@13.5.1) (2025-05-07)

### Bug Fixes

- making satsPerVbyte compulsory ([db457bb](https://github.com/BitGo/BitGoJS/commit/db457bb07ffbc90aab4d1f67bf525a3e438e7069))

# [13.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.4.0...@bitgo/express@13.5.0) (2025-04-29)

### Features

- added withdraw route ([3206726](https://github.com/BitGo/BitGoJS/commit/32067263f63afdc2d1eb46a118643eb1dd066e6d))

# [13.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.3.3...@bitgo/express@13.4.0) (2025-04-25)

### Features

- **express:** add support to change keychain password ([8cef8e1](https://github.com/BitGo/BitGoJS/commit/8cef8e1c0d4cf5f4980f10e49b2eadf39fd82821))

## [13.3.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.3.2...@bitgo/express@13.3.3) (2025-04-15)

**Note:** Version bump only for package @bitgo/express

## [13.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.3.1...@bitgo/express@13.3.2) (2025-04-04)

### Bug Fixes

- **express:** display corruption in markdown [#5747](https://github.com/BitGo/BitGoJS/issues/5747) ([e4620f0](https://github.com/BitGo/BitGoJS/commit/e4620f05732864eb75b080e751696089303b5e20))

## [13.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.3.0...@bitgo/express@13.3.1) (2025-04-02)

**Note:** Version bump only for package @bitgo/express

# [13.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.2.1...@bitgo/express@13.3.0) (2025-03-28)

### Features

- **abstract-lightning:** make encrypted prv key optional in get key ([be728ab](https://github.com/BitGo/BitGoJS/commit/be728ab7935fe00476647cb7b7e002a5af304d88))
- **express:** add includeBalance option when fetching lightning wallets ([832aa59](https://github.com/BitGo/BitGoJS/commit/832aa593e0b2c739d14f31bcba9fb38d51dd5950))
- **express:** encode invoice to avoid serialization error ([dcdb310](https://github.com/BitGo/BitGoJS/commit/dcdb3104291e24251cad017e077ab9bd814c2662))

## [13.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.2.0...@bitgo/express@13.2.1) (2025-03-20)

**Note:** Version bump only for package @bitgo/express

# [13.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.1.0...@bitgo/express@13.2.0) (2025-03-18)

### Bug Fixes

- move lightning routes to before the any other calls ([797e460](https://github.com/BitGo/BitGoJS/commit/797e460f6719dcaf5af4106083951380b205ffbc))

### Features

- **abstract-lightning:** add custodial lightning api functions ([16b825a](https://github.com/BitGo/BitGoJS/commit/16b825a4d052399d4360c689b24888ab327ff6c0))
- **express:** add keepAliveTimeout, headersTimeout option [#5747](https://github.com/BitGo/BitGoJS/issues/5747) ([903b842](https://github.com/BitGo/BitGoJS/commit/903b84245f12612cae63807891e0b6b58f8d2225))
- **express:** remove unneeded express routes and use subtype on wallet ([3356783](https://github.com/BitGo/BitGoJS/commit/335678378737608280f768b8306ced454d88a7c2))

# [13.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@13.0.0...@bitgo/express@13.1.0) (2025-03-06)

### Bug Fixes

- **express:** add ip caveat when flag is true ([1fed2dc](https://github.com/BitGo/BitGoJS/commit/1fed2dca7b53bc17803ba3a8e20bfbd4588e6677))

### Features

- **express:** take walletPassphrase as body parameter for /api/v2/ofc/signPayload ([ac17c31](https://github.com/BitGo/BitGoJS/commit/ac17c31b9d9470c2200db20218dccac702d3fe44))

# [13.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.7.0...@bitgo/express@13.0.0) (2025-03-04)

### Bug Fixes

- dependency fixes for secp256 lib ([826db0b](https://github.com/BitGo/BitGoJS/commit/826db0b5481435bb38b251e8bb5ba8ce9f78d017))
- **express:** correct parsing of initwallet ([9e9601d](https://github.com/BitGo/BitGoJS/commit/9e9601d3bdd5f03a9177babbac47a63360c5a546))

### Features

- **abstract-lightning:** add codecs for more lightning apis ([1b6d238](https://github.com/BitGo/BitGoJS/commit/1b6d238a3538f7059ce773f8bd218ad8b723f17c))
- **abstract-lightning:** move lnv2 logic from sdk-core ([5c9114d](https://github.com/BitGo/BitGoJS/commit/5c9114d6a4dbdd5a130bde7cb897ff6f1f8132e0))
- add express endpoints for lightning ([97a163d](https://github.com/BitGo/BitGoJS/commit/97a163dc2465fc3b64a8993ca0099431df2583d6))
- add express endpoints for lightning ([d431322](https://github.com/BitGo/BitGoJS/commit/d431322aa8d76df8f88867c554df61574fd25b7a))
- add express endpoints for lightning invoice ([01d89de](https://github.com/BitGo/BitGoJS/commit/01d89de0aaa33d47953edd3aede9b8161b734195))
- add express endpoints for lightning invoice ([563c250](https://github.com/BitGo/BitGoJS/commit/563c250f1c028f10a3a0662c9faae900d6ee137c))
- add proxyquire dev import ([112da17](https://github.com/BitGo/BitGoJS/commit/112da17a52fe68b7a6808daa47f96e17addef4de))
- **express:** decouple signer node data update from init wallet ([a99c309](https://github.com/BitGo/BitGoJS/commit/a99c3091ae7fa07aaeb5a60ae75996995bd95c37))
- **express:** get watch only external ip from wallet ([993d175](https://github.com/BitGo/BitGoJS/commit/993d17514047115d8144d6bd685220a00b3bb77a))
- **express:** move walletId to the path ([1c6b555](https://github.com/BitGo/BitGoJS/commit/1c6b55575c5e75b1292a73f346a8d2db658743d0))
- refactor of api sequence ([7da9e7d](https://github.com/BitGo/BitGoJS/commit/7da9e7d13a57255bc10161378880015e3da50e88))
- updating api handlers to use codec ([d3244aa](https://github.com/BitGo/BitGoJS/commit/d3244aa13a9b254442e9a87dfea17dc949b7b04c))

### BREAKING CHANGES

- **abstract-lightning:** Lightning v2
- **express:** changed path for lightning apis

TICKET: BTC-1846

- **abstract-lightning:** Lightning v2

# [12.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.7.0...@bitgo/express@12.0.0) (2025-02-26)

### Bug Fixes

- **express:** correct parsing of initwallet ([9e9601d](https://github.com/BitGo/BitGoJS/commit/9e9601d3bdd5f03a9177babbac47a63360c5a546))

### Features

- **abstract-lightning:** add codecs for more lightning apis ([1b6d238](https://github.com/BitGo/BitGoJS/commit/1b6d238a3538f7059ce773f8bd218ad8b723f17c))
- **abstract-lightning:** move lnv2 logic from sdk-core ([5c9114d](https://github.com/BitGo/BitGoJS/commit/5c9114d6a4dbdd5a130bde7cb897ff6f1f8132e0))
- **express:** move walletId to the path ([1c6b555](https://github.com/BitGo/BitGoJS/commit/1c6b55575c5e75b1292a73f346a8d2db658743d0))

### BREAKING CHANGES

- **abstract-lightning:** Lightning v2
- **express:** changed path for lightning apis

TICKET: BTC-1846

- **abstract-lightning:** Lightning v2

# [11.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.7.0...@bitgo/express@11.0.0) (2025-02-20)

### Bug Fixes

- **express:** correct parsing of initwallet ([9e9601d](https://github.com/BitGo/BitGoJS/commit/9e9601d3bdd5f03a9177babbac47a63360c5a546))

### Features

- **abstract-lightning:** move lnv2 logic from sdk-core ([5c9114d](https://github.com/BitGo/BitGoJS/commit/5c9114d6a4dbdd5a130bde7cb897ff6f1f8132e0))
- **express:** move walletId to the path ([1c6b555](https://github.com/BitGo/BitGoJS/commit/1c6b55575c5e75b1292a73f346a8d2db658743d0))

### BREAKING CHANGES

- **express:** changed path for lightning apis

TICKET: BTC-1846

- **abstract-lightning:** Lightning v2

# [10.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.14...@bitgo/express@10.7.0) (2025-02-19)

### Features

- make expressip macaroon caveat optional ([1d2bd03](https://github.com/BitGo/BitGoJS/commit/1d2bd033073209fea1353bea44d55ad5078296b4))
- **sdk-core:** move lightning specific wallet functions ([e63129d](https://github.com/BitGo/BitGoJS/commit/e63129dfe0e910ed44fe80bdf42dba5edc7e76a5))

## [10.6.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.13...@bitgo/express@10.6.14) (2025-02-11)

**Note:** Version bump only for package @bitgo/express

## [10.6.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.12...@bitgo/express@10.6.13) (2025-02-05)

**Note:** Version bump only for package @bitgo/express

## [10.6.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.11...@bitgo/express@10.6.12) (2025-01-28)

**Note:** Version bump only for package @bitgo/express

## [10.6.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.10...@bitgo/express@10.6.11) (2025-01-23)

**Note:** Version bump only for package @bitgo/express

## [10.6.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.9...@bitgo/express@10.6.10) (2025-01-23)

**Note:** Version bump only for package @bitgo/express

## [10.6.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.8...@bitgo/express@10.6.9) (2025-01-20)

**Note:** Version bump only for package @bitgo/express

## [10.6.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.7...@bitgo/express@10.6.8) (2025-01-15)

### Bug Fixes

- **deps:** bump public-types library ([e8679cd](https://github.com/BitGo/BitGoJS/commit/e8679cd5cccd367d26946f2ab14b82a567e39107))

## [10.6.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.6...@bitgo/express@10.6.7) (2025-01-09)

**Note:** Version bump only for package @bitgo/express

## [10.6.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.5...@bitgo/express@10.6.6) (2025-01-03)

**Note:** Version bump only for package @bitgo/express

## [10.6.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.4...@bitgo/express@10.6.5) (2024-12-24)

**Note:** Version bump only for package @bitgo/express

## [10.6.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.3...@bitgo/express@10.6.4) (2024-12-19)

**Note:** Version bump only for package @bitgo/express

## [10.6.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.1...@bitgo/express@10.6.3) (2024-12-17)

**Note:** Version bump only for package @bitgo/express

## [10.6.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.1...@bitgo/express@10.6.2) (2024-12-17)

**Note:** Version bump only for package @bitgo/express

## [10.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.6.0...@bitgo/express@10.6.1) (2024-12-12)

**Note:** Version bump only for package @bitgo/express

# [10.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.7...@bitgo/express@10.6.0) (2024-12-11)

### Features

- **sdk-api:** implement custom proxy agent support in BitGoAPI ([cab3958](https://github.com/BitGo/BitGoJS/commit/cab3958288a685f261f67f70a82c520d74a64ec9))

## [10.5.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.6...@bitgo/express@10.5.7) (2024-12-03)

**Note:** Version bump only for package @bitgo/express

## [10.5.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.5...@bitgo/express@10.5.6) (2024-11-26)

**Note:** Version bump only for package @bitgo/express

## [10.5.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.4...@bitgo/express@10.5.5) (2024-11-21)

**Note:** Version bump only for package @bitgo/express

## [10.5.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.2...@bitgo/express@10.5.4) (2024-11-19)

**Note:** Version bump only for package @bitgo/express

## [10.5.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.2...@bitgo/express@10.5.3) (2024-11-14)

**Note:** Version bump only for package @bitgo/express

## [10.5.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.1...@bitgo/express@10.5.2) (2024-11-08)

**Note:** Version bump only for package @bitgo/express

## [10.5.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.5.0...@bitgo/express@10.5.1) (2024-11-07)

**Note:** Version bump only for package @bitgo/express

# [10.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.6...@bitgo/express@10.5.0) (2024-11-01)

### Bug Fixes

- **express:** fix express overriding 2xx status ([712585c](https://github.com/BitGo/BitGoJS/commit/712585c57050057a103ad8541c1271a082e014b5))

### Features

- **express:** set ssl using env vars option ([cc41cd7](https://github.com/BitGo/BitGoJS/commit/cc41cd702889c2f9590b7900a2d51d45deb784ee))
- **sdk-core:** add tests for new pick mpc gpg pub key function ([fbcfcbf](https://github.com/BitGo/BitGoJS/commit/fbcfcbf58b852c466c8e49c35acc77119348ee50))
- update public-types ([85f8d0f](https://github.com/BitGo/BitGoJS/commit/85f8d0fcf1c1e8bf85088406b0ff3de62aab180d))

## [10.4.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.5...@bitgo/express@10.4.6) (2024-10-22)

**Note:** Version bump only for package @bitgo/express

## [10.4.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.4...@bitgo/express@10.4.5) (2024-10-15)

**Note:** Version bump only for package @bitgo/express

## [10.4.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.3...@bitgo/express@10.4.4) (2024-10-08)

**Note:** Version bump only for package @bitgo/express

## [10.4.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.2...@bitgo/express@10.4.3) (2024-10-04)

**Note:** Version bump only for package @bitgo/express

## [10.4.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.1...@bitgo/express@10.4.2) (2024-09-24)

### Bug Fixes

- **express:** adding missing external signer mode sig param ([6a69aef](https://github.com/BitGo/BitGoJS/commit/6a69aef6af99bacfa887e96a01df3574ec1017e2))
- **express:** typo in express signer param name for musig2 sign ([71e5190](https://github.com/BitGo/BitGoJS/commit/71e5190e909829e87a932f27277c9c15636b37a1))

## [10.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.4.0...@bitgo/express@10.4.1) (2024-09-19)

**Note:** Version bump only for package @bitgo/express

# [10.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.3.0...@bitgo/express@10.4.0) (2024-09-16)

### Features

- **express:** encrypt signer macaroon using ecdh ([62cbd00](https://github.com/BitGo/BitGoJS/commit/62cbd0090748a697017e9adcb49bb0cf34d044b8))

# [10.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.2.3...@bitgo/express@10.3.0) (2024-09-10)

### Features

- **express:** add apis to init lnd signer at express ([5c84196](https://github.com/BitGo/BitGoJS/commit/5c84196856194390bfda98cec64058915903da82))
- **express:** add config for lightning signer at express ([6ff3e0b](https://github.com/BitGo/BitGoJS/commit/6ff3e0b010110778935c7545508bcf092f837c70))

## [10.2.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.2.2...@bitgo/express@10.2.3) (2024-09-03)

**Note:** Version bump only for package @bitgo/express

## [10.2.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.2.1...@bitgo/express@10.2.2) (2024-08-29)

**Note:** Version bump only for package @bitgo/express

## [10.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.2.0...@bitgo/express@10.2.1) (2024-08-27)

**Note:** Version bump only for package @bitgo/express

# [10.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.1.3...@bitgo/express@10.2.0) (2024-08-20)

### Bug Fixes

- **express:** remove unused files ([3c575ee](https://github.com/BitGo/BitGoJS/commit/3c575eee023686e4390642ef22d8dcdbb2c6e22e))
- **root:** bump public-types and fix SMC MPCv2 format ([c739aa8](https://github.com/BitGo/BitGoJS/commit/c739aa8fef418276d0a5c812010153b770eac5e7))

### Features

- **express:** include test directory in build ([c3dcd21](https://github.com/BitGo/BitGoJS/commit/c3dcd2145f8e62214478a4fb616e62f34270cc78))
- **express:** move magic express Request type in types folder ([dddcf76](https://github.com/BitGo/BitGoJS/commit/dddcf76f9a79600dbfefb78bf6518ad74ab16de2))

## [10.1.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.1.3...@bitgo/express@10.1.4) (2024-08-13)

### Bug Fixes

- **root:** bump public-types and fix SMC MPCv2 format ([c739aa8](https://github.com/BitGo/BitGoJS/commit/c739aa8fef418276d0a5c812010153b770eac5e7))

## [10.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.1.2...@bitgo/express@10.1.3) (2024-08-07)

### Bug Fixes

- **root:** replace MPCv2 SMC types for public-types ([cb4c68f](https://github.com/BitGo/BitGoJS/commit/cb4c68f08035da7742a740ee7e220117a2143805))

## [10.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.1.1...@bitgo/express@10.1.2) (2024-07-30)

**Note:** Version bump only for package @bitgo/express

## [10.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.1.0...@bitgo/express@10.1.1) (2024-07-24)

**Note:** Version bump only for package @bitgo/express

# [10.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.7...@bitgo/express@10.1.0) (2024-07-16)

### Features

- **express:** add external signer base code for MPCv2 ([8fe9ce0](https://github.com/BitGo/BitGoJS/commit/8fe9ce03cf385d781941c55eb1055d496928da1e))
- **sdk-core:** implemented signing with external signer for MPCv2 ([b6cb2b0](https://github.com/BitGo/BitGoJS/commit/b6cb2b021bc64efc34dca5b97a0156719c804283))

## [10.0.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.6...@bitgo/express@10.0.7) (2024-07-04)

**Note:** Version bump only for package @bitgo/express

## [10.0.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.5...@bitgo/express@10.0.6) (2024-07-02)

**Note:** Version bump only for package @bitgo/express

## [10.0.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.4...@bitgo/express@10.0.5) (2024-06-27)

**Note:** Version bump only for package @bitgo/express

## [10.0.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.3...@bitgo/express@10.0.4) (2024-06-26)

**Note:** Version bump only for package @bitgo/express

## [10.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.1...@bitgo/express@10.0.3) (2024-06-21)

**Note:** Version bump only for package @bitgo/express

## [10.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.1...@bitgo/express@10.0.2) (2024-06-20)

**Note:** Version bump only for package @bitgo/express

## [10.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@10.0.0...@bitgo/express@10.0.1) (2024-06-14)

**Note:** Version bump only for package @bitgo/express

# [10.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.65.1...@bitgo/express@10.0.0) (2024-06-11)

### Features

- encrypt and return backup key by default ([f80d834](https://github.com/BitGo/BitGoJS/commit/f80d834984598eebfdcfa1b8252a898b30fbceec))

### BREAKING CHANGES

- changes the default behavior of generateWallet

## [9.65.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.65.0...@bitgo/express@9.65.1) (2024-06-05)

**Note:** Version bump only for package @bitgo/express

# [9.65.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.64.0...@bitgo/express@9.65.0) (2024-05-31)

### Features

- add bitgo network connection schema ([2324060](https://github.com/BitGo/BitGoJS/commit/2324060a06f0441a9c8bfa848ff24158b63e097a))

# [9.64.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.63.3...@bitgo/express@9.64.0) (2024-05-28)

### Features

- use settings API to switch between MPCv2 and v1 ([85e2df2](https://github.com/BitGo/BitGoJS/commit/85e2df2856fd0b673bae29b9d6e9aabaa8c8a932))

## [9.63.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.63.2...@bitgo/express@9.63.3) (2024-05-22)

**Note:** Version bump only for package @bitgo/express

## [9.63.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.63.1...@bitgo/express@9.63.2) (2024-05-17)

**Note:** Version bump only for package @bitgo/express

## [9.63.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.63.0...@bitgo/express@9.63.1) (2024-05-13)

**Note:** Version bump only for package @bitgo/express

# [9.63.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.62.5...@bitgo/express@9.63.0) (2024-05-08)

### Features

- add network connection encryption function ([8d43b26](https://github.com/BitGo/BitGoJS/commit/8d43b26d99ba7a07ce5e35cbf1906131e2779269))

## [9.62.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.62.4...@bitgo/express@9.62.5) (2024-05-01)

**Note:** Version bump only for package @bitgo/express

## [9.62.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.62.3...@bitgo/express@9.62.4) (2024-04-25)

**Note:** Version bump only for package @bitgo/express

## [9.62.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.62.2...@bitgo/express@9.62.3) (2024-04-24)

### Bug Fixes

- superagent upgrade to 9.0 ([6e9aa43](https://github.com/BitGo/BitGoJS/commit/6e9aa43a6d2999298abd450ceb168d664b8b926d))

## [9.62.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.62.1...@bitgo/express@9.62.2) (2024-04-22)

**Note:** Version bump only for package @bitgo/express

## [9.62.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.62.0...@bitgo/express@9.62.1) (2024-04-17)

**Note:** Version bump only for package @bitgo/express

# [9.62.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.9...@bitgo/express@9.62.0) (2024-04-12)

### Features

- **bitgo:** add PATCH and OPTIONS to redirectRequest ([4c8ba7a](https://github.com/BitGo/BitGoJS/commit/4c8ba7abb5718261774352e1a191f0ab5dc5e616))

## [9.61.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.8...@bitgo/express@9.61.9) (2024-04-10)

**Note:** Version bump only for package @bitgo/express

## [9.61.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.7...@bitgo/express@9.61.8) (2024-04-09)

**Note:** Version bump only for package @bitgo/express

## [9.61.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.6...@bitgo/express@9.61.7) (2024-04-08)

**Note:** Version bump only for package @bitgo/express

## [9.61.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.5...@bitgo/express@9.61.6) (2024-04-05)

**Note:** Version bump only for package @bitgo/express

## [9.61.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.4...@bitgo/express@9.61.5) (2024-03-28)

**Note:** Version bump only for package @bitgo/express

## [9.61.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.3...@bitgo/express@9.61.4) (2024-03-19)

**Note:** Version bump only for package @bitgo/express

## [9.61.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.2...@bitgo/express@9.61.3) (2024-03-11)

**Note:** Version bump only for package @bitgo/express

## [9.61.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.1...@bitgo/express@9.61.2) (2024-02-28)

**Note:** Version bump only for package @bitgo/express

## [9.61.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.61.0...@bitgo/express@9.61.1) (2024-02-22)

**Note:** Version bump only for package @bitgo/express

# [9.61.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.61.0) (2024-02-19)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.59.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.59.0) (2024-01-30)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.58.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.58.0) (2024-01-26)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.57.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.57.0) (2024-01-26)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.56.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.56.0) (2024-01-25)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.55.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.55.0) (2024-01-22)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.54.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.54.0) (2024-01-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.53.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.53.0) (2024-01-03)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.52.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.52.0) (2023-12-18)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- **root:** whitelist apiVersion for buildAccountConsolidations ([83003de](https://github.com/BitGo/BitGoJS/commit/83003de987b49b5c462d08623d6687501958e4b5))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.51.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.51.0) (2023-12-12)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.50.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.50.0) (2023-12-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.49.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.49.0) (2023-12-05)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.48.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.48.0) (2023-11-28)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.47.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.47.0) (2023-11-24)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.46.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.46.0) (2023-11-17)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.45.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.45.0) (2023-11-13)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.44.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.44.0) (2023-11-13)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.43.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.43.0) (2023-11-13)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- migrate docker builds ([f67e5b2](https://github.com/BitGo/BitGoJS/commit/f67e5b2ef1eff2a773906e813304ae2c75aeb483))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.42.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.42.0) (2023-10-20)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.41.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.41.0) (2023-10-18)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

# [9.40.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.40.0) (2023-09-25)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))
- update secp256k1 to 5.0.0 and keccak to 3.0.3 ([e2c37e6](https://github.com/BitGo/BitGoJS/commit/e2c37e6b0139c9f6948a22d8921bc3e1f88bed4c))

## [9.39.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.39.0...@bitgo/express@9.39.1) (2023-09-11)

**Note:** Version bump only for package @bitgo/express

# [9.39.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.39.0) (2023-09-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

# [9.38.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.38.0) (2023-09-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

# [9.37.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.37.0) (2023-09-07)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

# [9.36.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.36.0) (2023-09-05)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

# [9.35.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.35.0) (2023-09-01)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

# [9.34.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.34.0) (2023-08-29)

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

# [9.33.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.33.0) (2023-08-25)

### Features

- **express:** add external signer support for signig with derivation paths ([ceb89dd](https://github.com/BitGo/BitGoJS/commit/ceb89dd72b7f5f7c59484d5517ac32c4f499fd32))

## [9.32.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.32.3) (2023-08-24)

**Note:** Version bump only for package @bitgo/express

## [9.32.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.32.2) (2023-08-16)

**Note:** Version bump only for package @bitgo/express

## [9.32.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.32.0...@bitgo/express@9.32.1) (2023-08-16)

**Note:** Version bump only for package @bitgo/express

# [9.32.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.30.0...@bitgo/express@9.32.0) (2023-08-04)

### Bug Fixes

- **root:** upgrade nock for node 18 support ([644836e](https://github.com/BitGo/BitGoJS/commit/644836ebf5385dddb986694b3b0a2f63b53e43e2))

### Features

- **express:** support ECDSA TSS in external signer ([03356c1](https://github.com/BitGo/BitGoJS/commit/03356c15f6ddb274c1e529f0efe21ed62168c807))

# [9.31.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.30.0...@bitgo/express@9.31.0) (2023-07-28)

### Bug Fixes

- **root:** upgrade nock for node 18 support ([644836e](https://github.com/BitGo/BitGoJS/commit/644836ebf5385dddb986694b3b0a2f63b53e43e2))

### Features

- **express:** support ECDSA TSS in external signer ([03356c1](https://github.com/BitGo/BitGoJS/commit/03356c15f6ddb274c1e529f0efe21ed62168c807))

# [9.30.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.29.0...@bitgo/express@9.30.0) (2023-07-18)

### Features

- **express:** implement EdDSA commitments for external signer ([52ccfe7](https://github.com/BitGo/BitGoJS/commit/52ccfe7ee79ee78e32448eedb91a955fe56cb8b2))
- **express:** improve fetchEncryptedPrivKeys script ([8c0f569](https://github.com/BitGo/BitGoJS/commit/8c0f56914262781981686e9a028cf684c50da152))

# [9.29.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.28.0...@bitgo/express@9.29.0) (2023-06-21)

### Features

- **abstract-utxo:** support express external signer for musig2 inputs ([4401367](https://github.com/BitGo/BitGoJS/commit/44013673d564c976ae7b55788369dc48acbec64f))

# [9.28.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.27.2...@bitgo/express@9.28.0) (2023-06-14)

### Features

- **root:** use eddsa commitment for tss utils and signing ([b14b64f](https://github.com/BitGo/BitGoJS/commit/b14b64fbcb4cf65880154586b777992be0e49d37))

## [9.27.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.27.1...@bitgo/express@9.27.2) (2023-06-13)

**Note:** Version bump only for package @bitgo/express

## [9.27.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.27.0...@bitgo/express@9.27.1) (2023-06-07)

**Note:** Version bump only for package @bitgo/express

# [9.27.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.26.3...@bitgo/express@9.27.0) (2023-06-05)

### Features

- **sdk-core:** refactor signConvert to steps ([94e2cae](https://github.com/BitGo/BitGoJS/commit/94e2cae6e1292a4e9684c3c2ab7141221137d52e))
- **sdk-core:** simplify mpc.appendChallenge ([67bee8f](https://github.com/BitGo/BitGoJS/commit/67bee8f1b4f37cd12d6d14ea4d51ddcfde679563))

## [9.26.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.26.2...@bitgo/express@9.26.3) (2023-05-25)

**Note:** Version bump only for package @bitgo/express

## [9.26.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.26.1...@bitgo/express@9.26.2) (2023-05-17)

**Note:** Version bump only for package @bitgo/express

## [9.26.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.26.0...@bitgo/express@9.26.1) (2023-05-10)

**Note:** Version bump only for package @bitgo/express

# [9.26.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.25.2...@bitgo/express@9.26.0) (2023-05-03)

### Features

- express route to sign payloads in external signing mode ([f0c6c80](https://github.com/BitGo/BitGoJS/commit/f0c6c807433fcf36cff4e3d5c826438dfff07cfd))

## [9.25.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.25.1...@bitgo/express@9.25.2) (2023-04-25)

**Note:** Version bump only for package @bitgo/express

## [9.25.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.25.0...@bitgo/express@9.25.1) (2023-04-20)

**Note:** Version bump only for package @bitgo/express

# [9.25.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.24.1...@bitgo/express@9.25.0) (2023-04-13)

### Features

- express route for signing arbitrary payloads ([808acec](https://github.com/BitGo/BitGoJS/commit/808acecc68d40edeb93f8365e45a01746cf98f97))

## [9.24.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.24.0...@bitgo/express@9.24.1) (2023-02-17)

**Note:** Version bump only for package @bitgo/express

# [9.24.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.22.0...@bitgo/express@9.24.0) (2023-02-16)

### Bug Fixes

- **sdk-core:** update fixtures and fix tests ([c936478](https://github.com/BitGo/BitGoJS/commit/c9364786d7d11c9fbb621109efb1fb43a894e9d4))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))

# [9.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.22.0...@bitgo/express@9.23.0) (2023-02-08)

### Bug Fixes

- **sdk-core:** update fixtures and fix tests ([c936478](https://github.com/BitGo/BitGoJS/commit/c9364786d7d11c9fbb621109efb1fb43a894e9d4))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))

## [9.22.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.22.0...@bitgo/express@9.22.1) (2023-01-30)

**Note:** Version bump only for package @bitgo/express

# [9.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.21.5...@bitgo/express@9.22.0) (2023-01-25)

### Features

- **express:** support TSS EdDSA in sendMany express endpoint ([fa22c94](https://github.com/BitGo/BitGoJS/commit/fa22c9496e9af36ca424440182bc53c7688ae24b))

## [9.21.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.21.4...@bitgo/express@9.21.5) (2022-12-23)

**Note:** Version bump only for package @bitgo/express

## [9.21.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.21.3...@bitgo/express@9.21.4) (2022-12-20)

**Note:** Version bump only for package @bitgo/express

## [9.21.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.21.2...@bitgo/express@9.21.3) (2022-12-09)

**Note:** Version bump only for package @bitgo/express

## [9.21.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.21.1...@bitgo/express@9.21.2) (2022-12-06)

### Bug Fixes

- resolve express and qs dependencies ([5d39e37](https://github.com/BitGo/BitGoJS/commit/5d39e3767600d177529743a240499075555331fa))

## [9.21.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.21.0...@bitgo/express@9.21.1) (2022-12-01)

**Note:** Version bump only for package @bitgo/express

# [9.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.15.0...@bitgo/express@9.21.0) (2022-11-29)

### Bug Fixes

- update express configurations ([d434ece](https://github.com/BitGo/BitGoJS/commit/d434ece0ce942473064d0ba2009d4f11dd43bb96))

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
- **express:** consolidate account support in external signer ([414e0df](https://github.com/BitGo/BitGoJS/commit/414e0dfc1f33d02f740db2e2e9d5af28166d9f72))

# [9.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.19.0...@bitgo/express@9.20.0) (2022-11-08)

### Bug Fixes

- fix(express): use buster slim over alpine ([60b810d](https://github.com/BitGo/BitGoJS/commit/60b810d7c3ae02f252b98c02a688e773af90653e))

# [9.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.15.0...@bitgo/express@9.19.0) (2022-11-04)

### Bug Fixes

- update express configurations ([d434ece](https://github.com/BitGo/BitGoJS/commit/d434ece0ce942473064d0ba2009d4f11dd43bb96))

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))

# [9.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.17.0...@bitgo/express@9.18.0) (2022-11-01)

**Note:** Version bump only for package @bitgo/express

# [9.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.15.0...@bitgo/express@9.17.0) (2022-10-27)

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))

# [9.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.15.0...@bitgo/express@9.16.0) (2022-10-25)

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))

# [9.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.26...@bitgo/express@9.15.0) (2022-10-18)

### Bug Fixes

- add ability to use unencrypted private key ([803e14e](https://github.com/BitGo/BitGoJS/commit/803e14ef5e6a2c50fbb0b7408a31561850c4961e))
- specify exact platform for express docker ([e845f8f](https://github.com/BitGo/BitGoJS/commit/e845f8f3a855ead10e20195925ce1935edfa1c48))

### Features

- **express:** adding EdDSA TSS support to external signer ([dbccabc](https://github.com/BitGo/BitGoJS/commit/dbccabc7b1b2c1258108e6b38f853c676f8a6562))
- **express:** support routes to prebuildAndSignTransaction ([b7f0ec3](https://github.com/BitGo/BitGoJS/commit/b7f0ec37f6ea9a948c229003bdee023066d62b68))

## [9.12.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.26...@bitgo/express@9.12.4) (2022-07-19)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.26](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.24...@bitgo/express@9.12.4-rc.26) (2022-07-19)

### Bug Fixes

- **express:** allow account consolidations ([ede16e5](https://github.com/BitGo/BitGoJS/commit/ede16e57f5dac7319a02d10e084ae47972709591))
- update bad dependency match ([5cc3255](https://github.com/BitGo/BitGoJS/commit/5cc3255aecba1ffb112da3ba10d8d36d2074b3e3))

## [9.12.4-rc.25](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.24...@bitgo/express@9.12.4-rc.25) (2022-07-18)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.24](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.23...@bitgo/express@9.12.4-rc.24) (2022-07-15)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.23](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.21...@bitgo/express@9.12.4-rc.23) (2022-07-15)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.22](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.21...@bitgo/express@9.12.4-rc.22) (2022-07-14)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.19...@bitgo/express@9.12.4-rc.20) (2022-07-12)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.18...@bitgo/express@9.12.4-rc.19) (2022-07-11)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.17...@bitgo/express@9.12.4-rc.18) (2022-07-07)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.16...@bitgo/express@9.12.4-rc.17) (2022-07-05)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.15...@bitgo/express@9.12.4-rc.16) (2022-07-01)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.14...@bitgo/express@9.12.4-rc.15) (2022-06-30)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.13...@bitgo/express@9.12.4-rc.14) (2022-06-30)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.11...@bitgo/express@9.12.4-rc.13) (2022-06-29)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.11...@bitgo/express@9.12.4-rc.12) (2022-06-29)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.10...@bitgo/express@9.12.4-rc.11) (2022-06-27)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.9...@bitgo/express@9.12.4-rc.10) (2022-06-27)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.8...@bitgo/express@9.12.4-rc.9) (2022-06-23)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.7...@bitgo/express@9.12.4-rc.8) (2022-06-22)

### Bug Fixes

- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))

## [9.12.4-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.6...@bitgo/express@9.12.4-rc.7) (2022-06-21)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.5...@bitgo/express@9.12.4-rc.6) (2022-06-16)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.4...@bitgo/express@9.12.4-rc.5) (2022-06-15)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.3...@bitgo/express@9.12.4-rc.4) (2022-06-14)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.2...@bitgo/express@9.12.4-rc.3) (2022-06-14)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.4-rc.1...@bitgo/express@9.12.4-rc.2) (2022-06-14)

**Note:** Version bump only for package @bitgo/express

## [9.12.4-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.14...@bitgo/express@9.12.4-rc.1) (2022-06-13)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.13...@bitgo/express@9.12.2-rc.14) (2022-06-10)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.12...@bitgo/express@9.12.2-rc.13) (2022-06-07)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.11...@bitgo/express@9.12.2-rc.12) (2022-06-07)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.10...@bitgo/express@9.12.2-rc.11) (2022-06-02)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.9...@bitgo/express@9.12.2-rc.10) (2022-06-02)

### Bug Fixes

- update express package dependencies ([5db23fe](https://github.com/BitGo/BitGoJS/commit/5db23fe3c8daa0ff0613e6e37b2097774bf67fb6))

## [9.12.2-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.8...@bitgo/express@9.12.2-rc.9) (2022-06-01)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.7...@bitgo/express@9.12.2-rc.8) (2022-05-23)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.6...@bitgo/express@9.12.2-rc.7) (2022-05-19)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.5...@bitgo/express@9.12.2-rc.6) (2022-05-19)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.4...@bitgo/express@9.12.2-rc.5) (2022-05-18)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.3...@bitgo/express@9.12.2-rc.4) (2022-05-17)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.2...@bitgo/express@9.12.2-rc.3) (2022-05-16)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.1...@bitgo/express@9.12.2-rc.2) (2022-05-13)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.2-rc.0...@bitgo/express@9.12.2-rc.1) (2022-05-13)

**Note:** Version bump only for package @bitgo/express

## [9.12.2-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.1...@bitgo/express@9.12.2-rc.0) (2022-05-12)

**Note:** Version bump only for package @bitgo/express

## [9.12.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0...@bitgo/express@9.12.1) (2022-05-04)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.38](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.37...@bitgo/express@9.12.0-rc.38) (2022-04-20)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.37](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.36...@bitgo/express@9.12.0-rc.37) (2022-04-19)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.36](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.35...@bitgo/express@9.12.0-rc.36) (2022-04-19)

### Bug Fixes

- **express:** build express outside TS Build systm ([4c59ff8](https://github.com/BitGo/BitGoJS/commit/4c59ff87a4a03f4a324d0a126e00dd19c5acf44d))

# [9.12.0-rc.34](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.33...@bitgo/express@9.12.0-rc.34) (2022-04-13)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.33](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.32...@bitgo/express@9.12.0-rc.33) (2022-04-12)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.32](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.31...@bitgo/express@9.12.0-rc.32) (2022-04-12)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.31](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.30...@bitgo/express@9.12.0-rc.31) (2022-04-11)

### Bug Fixes

- force secure urls unless disabled ([3b9edd5](https://github.com/BitGo/BitGoJS/commit/3b9edd593016f82fa69a4fe740ea706fe1daeee7))

# [9.12.0-rc.30](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.30) (2022-04-08)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.29](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.29) (2022-04-06)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.28](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.28) (2022-04-05)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.27](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.27) (2022-04-05)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.26](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.26) (2022-04-05)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.25](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.25) (2022-04-05)

**Note:** Version bump only for package @bitgo/express

# [9.12.0-rc.24](https://github.com/BitGo/BitGoJS/compare/@bitgo/express@9.12.0-rc.22...@bitgo/express@9.12.0-rc.24) (2022-04-05)

**Note:** Version bump only for package @bitgo/express

## 9.7.0

### New Features

- Support for the ZCash Heartwood fork

### Other Changes

- Update to `bitgo@11.4.0`

## 9.6.15

### Other Changes

- Update to `bitgo@11.3.0`

## 9.6.14

### Other Changes

- Update to `bitgo@11.2.0`

## 9.6.13

### Other Changes

- Update to `bitgo@11.1.3`
- Update to `http-proxy@1.18.1`

## 9.6.12

### Other Changes

- Update to `bitgo@11.1.2`

## 9.6.11

### Other Changes

- Update to `bitgo@11.1.1`

## 9.6.10

### Other Changes

- Update to `bitgo@11.1.0`

## 9.6.9

### Other Changes

- Update to `bitgo@11.0.3`

## 9.6.8

### Other Changes

- Update to `bitgo@11.0.2`

## 9.6.7

### Other Changes

- Update to `bitgo@11.0.1`

## 9.6.6

### Other Changes

- Update to `bitgo@11.0.0`

## 9.6.5

### Other Changes

- Update to `bitgo@10.0.0`
- Update development dependencies `mocha` and `mochawesome`

## 9.6.4

### Other Changes

- Update to `bitgo@9.6.1`

## 9.6.3

### Other Changes

- Update to `bitgo@9.6.1`

## 9.6.2

### Other Changes

- Update to `bitgo@9.6.0`

## 9.6.1

### Other Changes

- Update to `bitgo@9.5.3`

## 9.6.0

**Important**: Version numbers of `bitgo` and `bitgo-express` are no longer synchronized, so please expect to see drift in the versions. This is being done in order to stay more aligned with semver standards, and to avoid unnecessary major version bumps in express when the version of `bitgo` increments its major version.

### New Features

- Unify all environment variable configuration options under the `BITGO_` prefix. This deprecates a few older forms of setting configuration options, but these will still work as expected, so any old code which sets these variables will still work correctly. The renamed variables are:
  ** `DISABLE_SSL` and `DISABLESSL` are now `BITGO_DISABLE_SSL`.
  ** `DISABLE_PROXY` is now `BITGO_DISABLE_PROXY`.
  \*\* `DISABLE_ENV_CHECK` is now `BITGO_DISABLE_ENV_CHECK`.

### Other Changes

- Update to `bitgo@9.5.2`.

## 9.5.1

### Other Changes

- Update to `bitgo@9.5.1`

## 9.5.0

### Other Changes

- Update to `bitgo@9.5.0`

## 9.4.1

### Other Changes

- Update to `bitgo@9.4.1`

## 9.4.0

### Other Changes

- Allow disabling SSL with either `DISABLESSL` or `DISABLE_SSL` environment variables to align with old version of express README.

## 9.3.0

### Bug Fixes

- Fix incorrect defaults for undefined config environment options `disableSSL`, `disableProxy`, `disableEnvCheck`. If unset, they will now correctly default to undefined instead of false. This was preventing overriding these options using lower-preference configuration options.

### Other Changes

## 9.2.0

### Other Changes

- Update to `bitgo@9.2.0`
- Fix flaky tests which assumed test wallet contained only pay-to-pubkey-hash and pay-to-script-hash outputs. While this was true when the test was written, it does not consider segwit unspents, which were introduced at a later time.

## 9.1.0

### Other Changes

- Update to `bitgo@9.1.0`

## 9.0.1

### Other Changes

- Update to `bitgo@9.0.1`

## 9.0.0

### Other Changes

- Update to `bitgo@9.0.0`. There were breaking changes in the `bitgo` dependency, and so the express major version is being bumped in order to keep in sync. There are no breaking changes in express itself beyond those in the underlying `bitgo` dependency.

## 8.5.3

### Other Changes

- Update to `bitgo@8.5.3`

## 8.5.2

### Other Changes

- Update to `bitgo@8.5.2`

## 8.5.1

### Other Changes

- Update to `bitgo@8.5.1`

## 8.5.0

### Other Changes

- Update to `bitgo@8.5.0`

## 8.4.0

### Other Changes

- Add instructions to README for running bitgo-express in production with a self-signed certificate.
- Use more specific types for many params and variables in `clientRoutes.ts`
- Add @deprecated marker to v1 express functions
- Update to `bitgo@8.4.0`

## 8.3.0

Version skipped

## 8.2.4

### Other Changes

- Update to `bitgo@8.2.4`

## 8.2.3

### Other Changes

- Update to `bitgo@8.2.3`

## 8.2.2

### Other Changes

- Update to `bitgo@8.2.2`

## 8.2.1

### Other Changes

- Update to `bitgo@8.2.1`

## 8.2.0

### Bug Fixes

- Fix precedence ordering for configuration gathered from command line arguments and process environment. Command line arguments should take precedence.

### Other Changes

- Update to `typescript@3.5.3`
- Update to `bitgo@8.2.0`

## 8.1.2

### Other Changes

- Update to `bitgo@8.1.2`
- Ensure test report file generated by CI exists prior to attempting upload to S3

## 8.1.1

### Other Changes

- Update to `bitgo@8.1.1`

## 8.1.0

### Other Changes

- Update to `bitgo@8.1.0`

## 8.0.0

There are no breaking changes in this version, and the major version is being bumped in order to keep versions in sync with the main `bitgo` package.

### Other Changes

- Update to `bitgo@8.0.0`

## 7.1.1

### Other Changes

- Update to `bitgo@7.1.1`

## 7.1.0

### Other Changes

- Clarify documentation for running BitGo Express in README
- Add missing dependencies to package.json
- Update to `bitgo@7.1.0`
- Copy some test utilities out of bitgo module, so we don't have to do a cross-module include from bitgo for these.

## 7.0.0

### Breaking Changes

- The way to provide command line options to BitGo Express in docker has been simplified, but users who give options this way will need to make a modification to how they start BitGo Express.

As an example, we'll set the `--debug` command line option. Before version 7 you would need to start it like this:

```bash
$ docker run -it bitgo/express:6.0.0 /var/bitgo-express/bin/bitgo-express --debug
```

In version 7 and later, that should be changed to

```
$ docker run -it bitgo/express:7.0.0 --debug
```

### New Features

- Allow all configuration options to be given by either environment variable or command line flag. Command line flags have the highest priority, followed by environment variables. If neither of these are set for a given option, an appropriate default will be used instead. Please see the [Configuration Values](https://github.com/BitGo/BitGoJS/tree/master/modules/express#configuration-values) section in the README for more information.

### Bug Fixes

- Add missing dependencies to package.json.

### Other Changes

- Improve documentation for running BitGo Express in Docker
- Simplify BitGo Express initialization script
- Update package-lock.json
- Update to BitGoJS@7.0.0

## 6.2.0

### Other Changes

- Upgrade to BitGoJS@6.2.0

## 6.1.0

### New Features

- Include BitGoJS version number in Express user agent, since in the future these may not always be the same.

### Other Changes

- Upgrade to BitGoJS@6.1.0

## 6.0.0

BitGo Express has been separated from the core `bitgo` Javascript library, and is now its own module in the BitGoJS monorepo. It's been split from the core Javascript library because it's an application which should be distributed differently than a library. By packaging and distributing separately, we have much better control over the tree of dependencies which BitGo Express needs to operate.

The recommended install instructions are now to install via the official bitgo-express Docker image `bitgo/express:latest`. If you aren't able to run bitgo-express via Docker, you can also install and run `bitgo-express` from the source code.

See the [`bitgo-express` README](https://github.com/BitGo/BitGoJS/tree/master/modules/express#running-bitgo-express) for more information on how to install and run BitGo Express.
