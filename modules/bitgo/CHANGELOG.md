# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [38.11.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.10.0...bitgo@38.11.0) (2024-06-14)

### Bug Fixes

- **sdk-coin-xrp:** better error handling ([dcf7de4](https://github.com/BitGo/BitGoJS/commit/dcf7de4e0bfed6f3af2f87f8215e18c130cb8107))

### Features

- **sdk-coin-ethlike:** add new eth like coin packages ([ba305cb](https://github.com/BitGo/BitGoJS/commit/ba305cb7f7b564d499d0f931f50919058e85652f))
- **sdk-core:** added propagation of reqId to sendMany ([411efa7](https://github.com/BitGo/BitGoJS/commit/411efa76673fa1fb4b3e24fef4a6bf10bbd63af8))

# [38.10.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.9.0...bitgo@38.10.0) (2024-06-11)

### Bug Fixes

- **abstract-eth:** use correct derivation path in wrw recover function ([5018147](https://github.com/BitGo/BitGoJS/commit/50181478d487c8871f94da2fb92e7327098b2370))

### Features

- **sdk-core:** added unit tests ([f77473f](https://github.com/BitGo/BitGoJS/commit/f77473fe3fb7536842df67226fbffb0d8aca1272))
- **statics:** added ofc support for Polygon tokens ([baa8fbd](https://github.com/BitGo/BitGoJS/commit/baa8fbd9d269f4eb103f746a5b7afb0402102332))

# [38.9.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.8.0...bitgo@38.9.0) (2024-06-05)

### Features

- **sdk-core:** supply isMPCv2 for MPCv2 key creation ([64bd55a](https://github.com/BitGo/BitGoJS/commit/64bd55ac018797645b719f1bc8e4886ee7ed9443))

# [38.8.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.7.0...bitgo@38.8.0) (2024-05-31)

### Features

- **abstract-eth:** add recovery support for bsc and polygon mpcv2 ([820e7b4](https://github.com/BitGo/BitGoJS/commit/820e7b40574add1bc7a05954961c7e7473972168))
- use cashaddr address format for ecash recovery ([072f11f](https://github.com/BitGo/BitGoJS/commit/072f11f9e2b8b10c91d9ddf4e0503dc3a1e13563))

# [38.7.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.6.0...bitgo@38.7.0) (2024-05-28)

### Bug Fixes

- should be able to generate onchain custodial wallet with express ([355dc8c](https://github.com/BitGo/BitGoJS/commit/355dc8cabe1b4432020947c22a663fd1e22eb1ac))

### Features

- add p2tr as the last option ([673c7d8](https://github.com/BitGo/BitGoJS/commit/673c7d8444be8147ca2b3803e641ab35890e6521))
- remove p2tr from changeAddressType list ([561a8bd](https://github.com/BitGo/BitGoJS/commit/561a8bdd4f785a4e8ef483e0271a40a4a5c192d9))
- **statics:** adding test token for solana tokens for go account ([e89757d](https://github.com/BitGo/BitGoJS/commit/e89757d12a1540b433a856acb0aef6ee22c88ebe))
- **statics:** enable cosmosLike MPCv2 ([231d25e](https://github.com/BitGo/BitGoJS/commit/231d25eccaeb8e4cd96a3b5b79ae3c11e73ea991))
- **statics:** enable mpcv2 for bsc and polygon ([e8cbbb8](https://github.com/BitGo/BitGoJS/commit/e8cbbb8d2e4fa1e079298faa5ccac17e19228aff))
- update @bitgo/public-types to latest ([4ce79f1](https://github.com/BitGo/BitGoJS/commit/4ce79f1e812478ac5f2eaffdb5d0bed39d90cb8b))
- use settings API to switch between MPCv2 and v1 ([85e2df2](https://github.com/BitGo/BitGoJS/commit/85e2df2856fd0b673bae29b9d6e9aabaa8c8a932))

# [38.6.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.5.0...bitgo@38.6.0) (2024-05-22)

### Features

- **abstract-eth:** wrw recovery for dkls wallet ([bf374e8](https://github.com/BitGo/BitGoJS/commit/bf374e89522c9688619d9b20ed66d3873b55d75e))
- **sdk-core:** support smaller mpcv2 keycard ([63512d4](https://github.com/BitGo/BitGoJS/commit/63512d4279d012c0a151720cffb195b198d25e21))

# [38.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.4.2...bitgo@38.5.0) (2024-05-17)

### Features

- send changeAddressType preferences array ([bd18c9e](https://github.com/BitGo/BitGoJS/commit/bd18c9e5e897655036676db49070858e11b6e028))
- **statics:** add ofc token to represent Erc20 token on avalance chain ([abc09c2](https://github.com/BitGo/BitGoJS/commit/abc09c2009883e535a91a95c235801da87ce87e1))
- **statics:** adding support for solana tokens for go account ([076ff13](https://github.com/BitGo/BitGoJS/commit/076ff133de149de8e6c6a1382b9f082f7f838316))

## [38.4.2](https://github.com/BitGo/BitGoJS/compare/bitgo@38.4.1...bitgo@38.4.2) (2024-05-13)

### Bug Fixes

- **sdk-coin-xlm:** fix returned data from recover function ([77b1eba](https://github.com/BitGo/BitGoJS/commit/77b1eba312b08ce846e240e7e64cf560204b786b))

## [38.4.1](https://github.com/BitGo/BitGoJS/compare/bitgo@38.4.0...bitgo@38.4.1) (2024-05-08)

### Bug Fixes

- **root:** fix keychains updatePassword for tss ([4cc09a8](https://github.com/BitGo/BitGoJS/commit/4cc09a8882194e19b55c10f21937ef0ffff39465))
- **sdk-core:** fix ci check issue ([d0eb311](https://github.com/BitGo/BitGoJS/commit/d0eb311141bee9b52919178a5f033212a299ddcf))

### Reverts

- Revert "Revert "feat(abstract-utxo): support trustless change outputs from explaintx"" ([03896f6](https://github.com/BitGo/BitGoJS/commit/03896f65ecaaa85f6a5a9be9d45012d848329938))

# [38.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.3.0...bitgo@38.4.0) (2024-05-01)

### Bug Fixes

- **root:** fix tests ([1324cda](https://github.com/BitGo/BitGoJS/commit/1324cdad62f64da99b645b3c6bd9c4e53639611d))

### Features

- **sdk-core:** add MPCv2 wallet creation ([3b15e71](https://github.com/BitGo/BitGoJS/commit/3b15e715a5cdb165ce671bd216d1191170ee8980))
- **sdk-core:** create dkls wallets with version 3 as well ([a14151a](https://github.com/BitGo/BitGoJS/commit/a14151a34047326334ed434ea3b16454f61c12a5))
- **sdk-core:** switch tss signing b/w mpc v1/v2 ([c3d05f8](https://github.com/BitGo/BitGoJS/commit/c3d05f80b45faacea8e588b91633c1594ffc1070))
- **wp:** update public-types and pass signatureR ([b0dba88](https://github.com/BitGo/BitGoJS/commit/b0dba888413230b6727713c0a8aec73959d62915))

### Reverts

- Revert "feat(abstract-utxo): support trustless change outputs from explaintx" ([23442a9](https://github.com/BitGo/BitGoJS/commit/23442a9873ae432c1d5efee8a3b3d4c0c3a772e2))

# [38.3.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.2.1...bitgo@38.3.0) (2024-04-25)

### Features

- **sdk-core:** modify accept share method ([74cba44](https://github.com/BitGo/BitGoJS/commit/74cba44bc994ead576ac7d03a7b8171df9298f4b))

## [38.2.1](https://github.com/BitGo/BitGoJS/compare/bitgo@38.2.0...bitgo@38.2.1) (2024-04-24)

### Bug Fixes

- superagent upgrade to 9.0 ([6e9aa43](https://github.com/BitGo/BitGoJS/commit/6e9aa43a6d2999298abd450ceb168d664b8b926d))

# [38.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.1.0...bitgo@38.2.0) (2024-04-22)

### Features

- **abstract-utxo:** support trustless change outputs from explaintx ([445ed53](https://github.com/BitGo/BitGoJS/commit/445ed5357c24357b5f9137669551e146bf2f2e60))

# [38.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@38.0.5...bitgo@38.1.0) (2024-04-17)

### Features

- **statics:** add ofc token to represent Erc20 token on arbitrun chain ([32ccf68](https://github.com/BitGo/BitGoJS/commit/32ccf682b4329fd53f06c6466585af58dacc4a57))
- **statics:** remove test on addressCoin ([c5356b9](https://github.com/BitGo/BitGoJS/commit/c5356b92fe9099babaee0085da63a440436b7220))

## [38.0.5](https://github.com/BitGo/BitGoJS/compare/bitgo@38.0.4...bitgo@38.0.5) (2024-04-12)

### Bug Fixes

- pending approvals for txRequestLite should not use multiSig flow ([7802998](https://github.com/BitGo/BitGoJS/commit/7802998082594a970c8ef71a794cf48b748cc555))

## [38.0.4](https://github.com/BitGo/BitGoJS/compare/bitgo@38.0.3...bitgo@38.0.4) (2024-04-10)

**Note:** Version bump only for package bitgo

## [38.0.3](https://github.com/BitGo/BitGoJS/compare/bitgo@38.0.2...bitgo@38.0.3) (2024-04-09)

**Note:** Version bump only for package bitgo

## [38.0.2](https://github.com/BitGo/BitGoJS/compare/bitgo@38.0.1...bitgo@38.0.2) (2024-04-08)

**Note:** Version bump only for package bitgo

## [38.0.1](https://github.com/BitGo/BitGoJS/compare/bitgo@38.0.0...bitgo@38.0.1) (2024-04-05)

**Note:** Version bump only for package bitgo

# [38.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@37.1.3...bitgo@38.0.0) (2024-03-28)

### Bug Fixes

- **sdk-core:** remove onToken validation when creating address ([75f7fb7](https://github.com/BitGo/BitGoJS/commit/75f7fb7d3a98995f8086743d9db1662808d2315f))

### Features

- **root:** deprecate node 16 ([d3ec624](https://github.com/BitGo/BitGoJS/commit/d3ec6240bddae2a4ab7fa80c4a16efecc36210bd))

### BREAKING CHANGES

- **root:** Node 16 is no longer supported in bitgojs.
  TICKET: WP-1100

## [37.1.3](https://github.com/BitGo/BitGoJS/compare/bitgo@37.1.2...bitgo@37.1.3) (2024-03-19)

### Bug Fixes

- factor gas and eip1559 params on ethlike token recovery ([7744d83](https://github.com/BitGo/BitGoJS/commit/7744d831f7d974802501245312787b81f8abae47))

## [37.1.2](https://github.com/BitGo/BitGoJS/compare/bitgo@37.1.1...bitgo@37.1.2) (2024-03-11)

**Note:** Version bump only for package bitgo

## [37.1.1](https://github.com/BitGo/BitGoJS/compare/bitgo@37.1.0...bitgo@37.1.1) (2024-02-28)

**Note:** Version bump only for package bitgo

# [37.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@37.0.0...bitgo@37.1.0) (2024-02-22)

### Features

- **sdk-core:** implement root key creation for eddsa multisig ([69bcaac](https://github.com/BitGo/BitGoJS/commit/69bcaac18a8ad049ea47fb43f09a0e3bc4457d9a))

# [37.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@36.1.0-reset...bitgo@37.0.0) (2024-02-19)

### Bug Fixes

- **sdk-core:** allow v4 forwarders ([90104b8](https://github.com/BitGo/BitGoJS/commit/90104b820d6d128990b1c2f907cd09ed9ebd29c6))

### Features

- **sdk-core:** add delegationId to claim reward options ([c6007cf](https://github.com/BitGo/BitGoJS/commit/c6007cf52dc06ccbbc8f79a1be4a9c1e354f8381))
- **sdk-core:** support authenticated encryption using pgp detached signatures ([1b3b925](https://github.com/BitGo/BitGoJS/commit/1b3b92507c5160817dc37f705b00a64bcbc5e666))
- **sdk-lib-mpc:** support DKLS DKG primitives ([ccd6e66](https://github.com/BitGo/BitGoJS/commit/ccd6e660120c7a0456c1e9f2f950d8c557ec9f75))

### BREAKING CHANGES

- **sdk-lib-mpc:** moves and renames authenticated encryption utility functions to sdk-lib-mpc

# [36.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@36.0.0) (2024-01-30)

### Bug Fixes

- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- add pendingApprovaId in prebuildTxTss response ([049466b](https://github.com/BitGo/BitGoJS/commit/049466b56b5353899b6f9172a369f2d3dad58003))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- add rbf params to accelerateTransaction ([605dd31](https://github.com/BitGo/BitGoJS/commit/605dd317321279f320c17460df12f5ac2c959960))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **bitgo:** use holesky etherscan url instead of goerli ([61962f6](https://github.com/BitGo/BitGoJS/commit/61962f6e273fd654575d3c93d9faf1a46bd361e4))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

- **bitgo:** changed default eth testnet etherscan url to holesky
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [35.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@35.0.0) (2024-01-26)

### Bug Fixes

- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- add pendingApprovaId in prebuildTxTss response ([049466b](https://github.com/BitGo/BitGoJS/commit/049466b56b5353899b6f9172a369f2d3dad58003))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- add rbf params to accelerateTransaction ([605dd31](https://github.com/BitGo/BitGoJS/commit/605dd317321279f320c17460df12f5ac2c959960))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **bitgo:** use holesky etherscan url instead of goerli ([61962f6](https://github.com/BitGo/BitGoJS/commit/61962f6e273fd654575d3c93d9faf1a46bd361e4))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

- **bitgo:** changed default eth testnet etherscan url to holesky
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [34.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@34.0.0) (2024-01-26)

### Bug Fixes

- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- add pendingApprovaId in prebuildTxTss response ([049466b](https://github.com/BitGo/BitGoJS/commit/049466b56b5353899b6f9172a369f2d3dad58003))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- add rbf params to accelerateTransaction ([605dd31](https://github.com/BitGo/BitGoJS/commit/605dd317321279f320c17460df12f5ac2c959960))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **bitgo:** use holesky etherscan url instead of goerli ([61962f6](https://github.com/BitGo/BitGoJS/commit/61962f6e273fd654575d3c93d9faf1a46bd361e4))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

- **bitgo:** changed default eth testnet etherscan url to holesky
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [33.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@33.0.0) (2024-01-25)

### Bug Fixes

- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- add pendingApprovaId in prebuildTxTss response ([049466b](https://github.com/BitGo/BitGoJS/commit/049466b56b5353899b6f9172a369f2d3dad58003))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- add rbf params to accelerateTransaction ([605dd31](https://github.com/BitGo/BitGoJS/commit/605dd317321279f320c17460df12f5ac2c959960))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **bitgo:** use holesky etherscan url instead of goerli ([61962f6](https://github.com/BitGo/BitGoJS/commit/61962f6e273fd654575d3c93d9faf1a46bd361e4))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- **bitgo:** changed default eth testnet etherscan url to holesky
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [32.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@32.0.0) (2024-01-22)

### Bug Fixes

- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- add pendingApprovaId in prebuildTxTss response ([049466b](https://github.com/BitGo/BitGoJS/commit/049466b56b5353899b6f9172a369f2d3dad58003))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- add rbf params to accelerateTransaction ([605dd31](https://github.com/BitGo/BitGoJS/commit/605dd317321279f320c17460df12f5ac2c959960))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **bitgo:** use holesky etherscan url instead of goerli ([61962f6](https://github.com/BitGo/BitGoJS/commit/61962f6e273fd654575d3c93d9faf1a46bd361e4))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- **bitgo:** changed default eth testnet etherscan url to holesky
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [31.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@31.0.0) (2024-01-09)

### Bug Fixes

- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **bitgo:** use holesky etherscan url instead of goerli ([61962f6](https://github.com/BitGo/BitGoJS/commit/61962f6e273fd654575d3c93d9faf1a46bd361e4))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- **bitgo:** changed default eth testnet etherscan url to holesky
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [30.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@30.0.0) (2024-01-03)

### Bug Fixes

- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-coin-zketh:** add zketh sdk skeleton ([dd2952f](https://github.com/BitGo/BitGoJS/commit/dd2952fb82127482f4d3d89a445a07f8592a4a5d))
- **sdk-coin-zketh:** add zketh token support ([086b86c](https://github.com/BitGo/BitGoJS/commit/086b86c7886174997a01bea04617256f66e08720))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))
- **statics:** add zketh coin config ([0afeee2](https://github.com/BitGo/BitGoJS/commit/0afeee2250d7738ec4cec14d1e14b03e81b04983))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [29.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@29.0.0) (2023-12-18)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add function to transfer nfts ([b77b386](https://github.com/BitGo/BitGoJS/commit/b77b386bf77408d4b1617ba3bc44e5899a65f2e0))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [28.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@28.0.0) (2023-12-12)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-opeth:** add opeth tokens ([1e50329](https://github.com/BitGo/BitGoJS/commit/1e503292d26cb46ca3e2336a8514018ab09f6759))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** provide skipKeychain to wallet share API request ([4fcc705](https://github.com/BitGo/BitGoJS/commit/4fcc705e04de4c6beed541b096f2fe65b44c0a53))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [27.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@27.0.0) (2023-12-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [26.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@26.0.0) (2023-12-05)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** improve error handling for consolidateAccount ([0d74c2a](https://github.com/BitGo/BitGoJS/commit/0d74c2aaca1076ad6b9ca9bd2de38ade56c886e3))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [25.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@25.0.0) (2023-11-28)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** add source to tss smc wallet creation ([316ff20](https://github.com/BitGo/BitGoJS/commit/316ff200f5eb8803f3591ab28a5c1b1f27f28e38))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add custodial and smc tss wallet to generateWallet method ([ea80f4f](https://github.com/BitGo/BitGoJS/commit/ea80f4fa208ca6874fdd7d99d597c347e4628ecc))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [24.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@24.0.0) (2023-11-24)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [23.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@23.0.0) (2023-11-17)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))
- use whitelisted send params for tx initiate ([0cf9f4c](https://github.com/BitGo/BitGoJS/commit/0cf9f4c4aeb8a74cd81aad4b0da08d1de30d73a0))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- deprecate old settlement code ([550380d](https://github.com/BitGo/BitGoJS/commit/550380d7838586a407bfb805d2ac7e99c6cf1cec))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** add support for bulk unspent consolidation ([daee9f0](https://github.com/BitGo/BitGoJS/commit/daee9f0a3480bbae08a5b06d1c7c683ce979210a))
- **sdk-core:** allow tss signing with unencrypted prv ([306dd37](https://github.com/BitGo/BitGoJS/commit/306dd37d61f8648b65be6ca99b0f4014fdc5a61b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [22.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@22.0.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [21.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@21.0.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [20.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@20.0.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** fix issue related to bignumber version ([519fe47](https://github.com/BitGo/BitGoJS/commit/519fe479ef51a72ddc1e94f87c10e031c0fd2c3f))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Code Refactoring

- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- rename coin 'core' to 'coreum' ([baecc01](https://github.com/BitGo/BitGoJS/commit/baecc013ff7243ce78ebd767bffdb0763b8b4cdb))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- rename coin module, coin name, named exports for coreum

# [19.20.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.20.0) (2023-10-20)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **account-lib:** add holesky testnet coin ([0aaefc0](https://github.com/BitGo/BitGoJS/commit/0aaefc0e53a5a48b2c701ca3c6d5e1c6ec7c19d2))
- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

# [19.19.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.19.0) (2023-10-18)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- ensure no pending mocks linger after test ([1a4e0e9](https://github.com/BitGo/BitGoJS/commit/1a4e0e9cba2a3ad8cd7af74c34e18e113f195a3c))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** add Ton skeleton ([fa49bde](https://github.com/BitGo/BitGoJS/commit/fa49bde246d3b4f22de25a1da9e079aad9f2551d))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- improve logic and add unit test ([722d729](https://github.com/BitGo/BitGoJS/commit/722d729600ff6de2a04e93329d27e406f51a456b))
- **sdk-coin-algo:** support for token enablement ([af718c9](https://github.com/BitGo/BitGoJS/commit/af718c992d0663722fe951f0a29a20825ba0e91c))
- **sdk-coin-arbeth:** add arbeth sdk skeleton ([f86018e](https://github.com/BitGo/BitGoJS/commit/f86018eef56adf22b5539bfb8716175eb1fb152e))
- **sdk-coin-arbeth:** add arbeth token support ([b55961b](https://github.com/BitGo/BitGoJS/commit/b55961bf474fe09d017c21d3d0169020fff1820f))
- **sdk-coin-bera:** add Berachain skeleton ([b3d43c5](https://github.com/BitGo/BitGoJS/commit/b3d43c52c7fd10d5fdc40123b3ad61cfe4784e5d))
- **sdk-coin-core:** add coreum sdk ([af73ccd](https://github.com/BitGo/BitGoJS/commit/af73ccd445b52dcf378ebd18260e628de0687043))
- **sdk-coin-islm:** add Islamic Coin ([c49bdd1](https://github.com/BitGo/BitGoJS/commit/c49bdd18df36a20d6e27cdd2686ec687bf653596))
- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** add new method to sign tss txs ([3e2654d](https://github.com/BitGo/BitGoJS/commit/3e2654d31baae8723d5a449ed79be14980410e1b))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))
- **statics:** add arbeth coin config ([2d84aa4](https://github.com/BitGo/BitGoJS/commit/2d84aa4cee970aab91bb27a391390e7d257d6349))
- **statics:** add Berachain & Haqq ([988cfd4](https://github.com/BitGo/BitGoJS/commit/988cfd4cd40d0f3fc72b6c080ec19a0acf1b55b4))
- **statics:** add opeth coin config ([c242760](https://github.com/BitGo/BitGoJS/commit/c2427602b3e8a49b5f1fb98bcd4489ed83d7c278))

# [19.18.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.18.0) (2023-09-25)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

## [19.17.1](https://github.com/BitGo/BitGoJS/compare/bitgo@19.17.0...bitgo@19.17.1) (2023-09-11)

**Note:** Version bump only for package bitgo

# [19.17.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.17.0) (2023-09-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.16.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.16.0) (2023-09-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.15.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.15.0) (2023-09-07)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))
- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.14.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.14.0) (2023-09-05)

### Bug Fixes

- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.13.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.13.0) (2023-09-01)

### Bug Fixes

- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-coin-trx:** consolidate to base address ([d3b7558](https://github.com/BitGo/BitGoJS/commit/d3b75585471ca22441acffc58b2f94d192e8c2a1))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.12.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.12.0) (2023-08-29)

### Bug Fixes

- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-core:** add helpers to support resigning ent challenges ([e9bb150](https://github.com/BitGo/BitGoJS/commit/e9bb1505af331f6caa7b0bcda2037483f57238fd))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.11.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.11.0) (2023-08-25)

### Bug Fixes

- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **sdk-core:** use BuildParams codec in Wallet.sendAccountConsolidation ([7d340ec](https://github.com/BitGo/BitGoJS/commit/7d340ec674116badf3b05aadf1d9aae130a8c69d))

# [19.10.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.10.0) (2023-08-24)

### Bug Fixes

- remove .nvmrc file ([a3edcc3](https://github.com/BitGo/BitGoJS/commit/a3edcc3725570d65154d541a932025bc3ad4416b))
- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))
- **sdk-core:** handle txRequest full PA before signing ([9de0eae](https://github.com/BitGo/BitGoJS/commit/9de0eae7cab1ad406e80a818555a7c8557b47eb3))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [19.9.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.9.0) (2023-08-16)

### Bug Fixes

- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [19.8.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.7.0...bitgo@19.8.0) (2023-08-16)

### Bug Fixes

- **sdk-coin-trx:** use a safer fee for sweep ([a7575e0](https://github.com/BitGo/BitGoJS/commit/a7575e081e18e4c9128449e736d970b813a5b021))

### Features

- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [19.7.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.5.0...bitgo@19.7.0) (2023-08-04)

### Bug Fixes

- **sdk-core:** include paillier in tests ([1de3bc2](https://github.com/BitGo/BitGoJS/commit/1de3bc2cd6a8eb2164f975f317c53dd23af68b96))
- **sdk-core:** use prebuilt-tx with tss full sendmany ([4adebcb](https://github.com/BitGo/BitGoJS/commit/4adebcba016d4ea163da4346f07af931daefaf43))

### Features

- **abstract-utxo:** add psbt support backup recovery ([b312a86](https://github.com/BitGo/BitGoJS/commit/b312a86091c1320b4d7a02bd1ca5c3d2056c00c6))
- **express:** support ECDSA TSS in external signer ([03356c1](https://github.com/BitGo/BitGoJS/commit/03356c15f6ddb274c1e529f0efe21ed62168c807))
- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))
- **sdk-coin-zeta:** zeta sdk init along with testcases ([b92d793](https://github.com/BitGo/BitGoJS/commit/b92d793a59ee1116e8f202b0f97c6720f6a76ab5))
- **sdk-core:** add util to get public key from commonKeychain ([289fba0](https://github.com/BitGo/BitGoJS/commit/289fba02eaa137cb3f8f0cfd81d9e886a5ae3f7d))

# [19.6.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.5.0...bitgo@19.6.0) (2023-07-28)

### Bug Fixes

- **sdk-core:** include paillier in tests ([1de3bc2](https://github.com/BitGo/BitGoJS/commit/1de3bc2cd6a8eb2164f975f317c53dd23af68b96))
- **sdk-core:** use prebuilt-tx with tss full sendmany ([4adebcb](https://github.com/BitGo/BitGoJS/commit/4adebcba016d4ea163da4346f07af931daefaf43))

### Features

- **express:** support ECDSA TSS in external signer ([03356c1](https://github.com/BitGo/BitGoJS/commit/03356c15f6ddb274c1e529f0efe21ed62168c807))
- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))
- **sdk-coin-zeta:** zeta sdk init along with testcases ([b92d793](https://github.com/BitGo/BitGoJS/commit/b92d793a59ee1116e8f202b0f97c6720f6a76ab5))
- **sdk-core:** add util to get public key from commonKeychain ([289fba0](https://github.com/BitGo/BitGoJS/commit/289fba02eaa137cb3f8f0cfd81d9e886a5ae3f7d))

# [19.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.4.0...bitgo@19.5.0) (2023-07-18)

### Bug Fixes

- **bitgo:** remove flag after adding coin specific module ([4629e74](https://github.com/BitGo/BitGoJS/commit/4629e748214c775e4d363b0637d518a5a377fa8e))
- **sdk-core:** fix createTssBitGoKeyFromOvcShares method ([70e3e13](https://github.com/BitGo/BitGoJS/commit/70e3e136b3a6217d2c543a101d4e6068371d82a1))
- **sdk-core:** make amount optional in stake options ([19039a5](https://github.com/BitGo/BitGoJS/commit/19039a58987c2bfadd7466af6cb9c2397e56188f))

### Features

- **abstract-utxo:** always use bitcoin network for validating secondary key signatures ([d9b7022](https://github.com/BitGo/BitGoJS/commit/d9b7022832ed38d8661b842add34caa97f340d31))
- **abstract-utxo:** move keysSignatures test to separate file ([b9fa5c5](https://github.com/BitGo/BitGoJS/commit/b9fa5c57ae6207974612c96c4cf0941665703a4e))
- **sdk-coin-ada:** split claim rewards and claim unstaked ([271ccca](https://github.com/BitGo/BitGoJS/commit/271ccca2be0d562cb8f204002f229c11f1f80094))
- **sdk-coin-injective:** injective sdk init along with testcases ([5064a10](https://github.com/BitGo/BitGoJS/commit/5064a10b4c36addf904b0d3772e3592224f05250))
- **sdk-coin-injective:** injective sdk init along with testcases ([3cf36cc](https://github.com/BitGo/BitGoJS/commit/3cf36cc94eee7439109516e344c6d278443ff019))
- **sdk-core:** add stakeMany to stake options ([0a8772a](https://github.com/BitGo/BitGoJS/commit/0a8772a4980a97b32c2117ae7a191ebd1933be83))

### Reverts

- Revert "chore(sdk-coin-bnb): create new bnb module" ([e998a04](https://github.com/BitGo/BitGoJS/commit/e998a04de3df1069a7cc59a7f6d9fc7ca7f515d0))

# [19.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.3.0...bitgo@19.4.0) (2023-06-21)

### Bug Fixes

- **sdk-core:** recreate tx for account coins ([16d1244](https://github.com/BitGo/BitGoJS/commit/16d1244ce79a72474ce21dee5ec79499c5cc2963))

### Features

- **abstract-utxo:** support express external signer for musig2 inputs ([4401367](https://github.com/BitGo/BitGoJS/commit/44013673d564c976ae7b55788369dc48acbec64f))
- **sdk-coin-bld:** agoric sdk along with testcases ([ed60702](https://github.com/BitGo/BitGoJS/commit/ed607029abc9f85babbe05475248b2d2718cf667))
- **sdk-coin-bld:** agoric sdk along with testcases ([3cba328](https://github.com/BitGo/BitGoJS/commit/3cba3289ea2d37122ff5274c8d373986c53b33d2))
- **sdk-coin-hash:** provenance sdk init along with testcases ([7ab7cca](https://github.com/BitGo/BitGoJS/commit/7ab7ccad66e394298befdbb993abc182943ecf5c))
- **sdk-coin-sei:** sei sdk init along with testcases ([d7fac3f](https://github.com/BitGo/BitGoJS/commit/d7fac3f17ca99535a9d0aa81acd6d1d84bf5d54d))

# [19.3.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.2.0...bitgo@19.3.0) (2023-06-14)

### Features

- **root:** use eddsa commitment for tss utils and signing ([b14b64f](https://github.com/BitGo/BitGoJS/commit/b14b64fbcb4cf65880154586b777992be0e49d37))
- **sdk-core:** remove ecdsa tss feature flag ([1382684](https://github.com/BitGo/BitGoJS/commit/1382684250102d13ff829f84d724331f8c8dd073))

# [19.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.1.0...bitgo@19.2.0) (2023-06-13)

### Features

- **sdk-coin-tia:** celestia sdk along with testcases ([1d104e0](https://github.com/BitGo/BitGoJS/commit/1d104e0d0ac0c813d16cd6da759b1a904bab4641))
- **sdk-core:** accelerateTransaction always uses txFormat=psbt ([41da856](https://github.com/BitGo/BitGoJS/commit/41da85613862753e301f57163f3e5c10ed7477de))
- **sdk-core:** make paillier proofs mandatory ([4c62dd8](https://github.com/BitGo/BitGoJS/commit/4c62dd8bae41b0a66a4aa840c16f2cdf5abc9997))
- **sdk-core:** manageUnspents overrides txFormat during bss ([1f53a9d](https://github.com/BitGo/BitGoJS/commit/1f53a9d91767c8e0c3deca74a66b881f92a2d2b6))
- **sdk-core:** sendMany always builds with psbt format for non-tss ([8c894b2](https://github.com/BitGo/BitGoJS/commit/8c894b2adef167abb1e8eb57b5643e1eaf69cc77))
- **sdk-core:** sweepWallet uses txFormat='psbt' ([bc80b3d](https://github.com/BitGo/BitGoJS/commit/bc80b3db5d917961bd5f8446bba8bef2f89f5c8e))

# [19.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@19.0.0...bitgo@19.1.0) (2023-06-07)

### Features

- **abstract-utxo:** make walletId param optional for signtx ([f5aff50](https://github.com/BitGo/BitGoJS/commit/f5aff5087727fb1842dc7cda64756553ab364c2b))
- **statics:** add Injective config ([750e817](https://github.com/BitGo/BitGoJS/commit/750e8178f50c6814e7dc92148b70beb287719b8a))

# [19.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@18.5.0...bitgo@19.0.0) (2023-06-05)

### Bug Fixes

- **sdk-coin-stx:** fix trx recovery ([8c28f2f](https://github.com/BitGo/BitGoJS/commit/8c28f2ff2c2b29be1e27617f6fb830a5f18b7ced))
- **sdk-core:** fix pending approval for consolidation ([3589434](https://github.com/BitGo/BitGoJS/commit/35894347a5e03e67ae97c37f921f803878b89396))
- **sdk-core:** retrieve bitgo modulus for ecdsa signing ([b43279b](https://github.com/BitGo/BitGoJS/commit/b43279beecba52fa21a480d994d01b3706bdf583))
- **utxo-lib:** use PsbtInput instead of UtxoPsbt ([1f73539](https://github.com/BitGo/BitGoJS/commit/1f73539409cf69fc55ab8aedb9d8873bb82bc375))

### Features

- **abstract-utxo:** add psbt support to explain and verify Tx ([4189659](https://github.com/BitGo/BitGoJS/commit/41896593cdc180cb5a60145a8d31fdf55dba6bb2))
- **root:** add optional paillier proof plumbing ([18093bf](https://github.com/BitGo/BitGoJS/commit/18093bfc370745130958075349814d493d5a8c72))
- **sdk-coin-osmo:** osmosis sdk init ([cc20a59](https://github.com/BitGo/BitGoJS/commit/cc20a5908528d2ad6bcc4a588acd7b1c8b0af379))
- **sdk-coin-trx:** add receive address tron recovery ([2a120fe](https://github.com/BitGo/BitGoJS/commit/2a120fef44345c270f2fa0ff5749f78f821e0d1b))
- **sdk-core:** refactor signConvert to steps ([94e2cae](https://github.com/BitGo/BitGoJS/commit/94e2cae6e1292a4e9684c3c2ab7141221137d52e))
- **sdk-core:** simplify mpc.appendChallenge ([67bee8f](https://github.com/BitGo/BitGoJS/commit/67bee8f1b4f37cd12d6d14ea4d51ddcfde679563))
- **sdk-lib-mpc:** make rangeProof challenges mandatory for appendChallenge ([1f68b30](https://github.com/BitGo/BitGoJS/commit/1f68b30676966720cb1a42c039e35d3ddeea4974))

### BREAKING CHANGES

- **utxo-lib:** functions signature is changed

# [18.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@18.4.0...bitgo@18.5.0) (2023-05-25)

### Bug Fixes

- **bitgo:** should skip password validation in external signing ([a0cde4d](https://github.com/BitGo/BitGoJS/commit/a0cde4dacf7a48669f487d17f896e414fb5ee9df))
- **sdk-core:** fix time issue when checking gpg wallet signatures from bitgo ([a7fa97b](https://github.com/BitGo/BitGoJS/commit/a7fa97b5b483168ad2385f4d4590d39f1476ed94))

### Features

- **abstract-utxo:** add psbt and musig2 support for sdk-api ([7a23991](https://github.com/BitGo/BitGoJS/commit/7a23991079e5609d43d7483f8137189163943dfc))
- **root:** implement eddsa signing with commitment ([d67ac81](https://github.com/BitGo/BitGoJS/commit/d67ac81f5b77451de1e03eba3c93a9b0e11e7b7c))

# [18.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@18.3.0...bitgo@18.4.0) (2023-05-17)

### Bug Fixes

- **bitgo:** drone is no longer used in this repo so can safely be removed ([badc0de](https://github.com/BitGo/BitGoJS/commit/badc0ded6870f56a0dc3925eba639b0fdb313c2b)), closes [#3554](https://github.com/BitGo/BitGoJS/issues/3554) [#3554](https://github.com/BitGo/BitGoJS/issues/3554)

### Features

- **sdk-core:** method to parse json from OVC to create TSS bitgo key ([c045934](https://github.com/BitGo/BitGoJS/commit/c04593412b5988dbb27769500c64feed27c1a75a))

# [18.3.0](https://github.com/BitGo/BitGoJS/compare/bitgo@18.2.1...bitgo@18.3.0) (2023-05-10)

### Bug Fixes

- **sdk-coin-eth:** fix eth multisig recoveries ([6e49792](https://github.com/BitGo/BitGoJS/commit/6e49792bfdb670a9e10dad10df932767b8ac6cdd))

### Features

- **sdk-core:** pre validate wallet pass phrase ([77f37e6](https://github.com/BitGo/BitGoJS/commit/77f37e6e811aa61a8ba577136f01fab073ef8fe4))
- **sdk-core:** stop calling staking service send api for full version ([49d13f1](https://github.com/BitGo/BitGoJS/commit/49d13f1c4a3660bfd75b7072f19f612fe040b0e4))

## [18.2.1](https://github.com/BitGo/BitGoJS/compare/bitgo@18.2.0...bitgo@18.2.1) (2023-05-03)

### Bug Fixes

- **sdk-core:** fix url path of fetching tss config API ([0d61a31](https://github.com/BitGo/BitGoJS/commit/0d61a31f3dfd6b5e892bbeb38889f56540a12cda))

# [18.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@18.1.1...bitgo@18.2.0) (2023-04-25)

### Features

- **sdk-coin-xrp:** change xrp unsigned sweep recovery to return json body ([936846f](https://github.com/BitGo/BitGoJS/commit/936846f6803bfd8b012fc2401da2927ec86e1bd8))
- **sdk-core:** initate, sign and verify ecdsa challenges for enterprise ([529ad9e](https://github.com/BitGo/BitGoJS/commit/529ad9e43e5123359c7417f3af2f5766e752474e))
- **sdk-core:** update ecdsa signing to use enterprise challenge ([c626f00](https://github.com/BitGo/BitGoJS/commit/c626f00e141db2ef4147b3e0c4badf1776729465))

## [18.1.1](https://github.com/BitGo/BitGoJS/compare/bitgo@18.1.0...bitgo@18.1.1) (2023-04-20)

### Bug Fixes

- **bitgo:** restrict receive address withdrawals ([8257552](https://github.com/BitGo/BitGoJS/commit/8257552085e8fd7a6e41865db902d10a3f1c8cc8)), closes [#3486](https://github.com/BitGo/BitGoJS/issues/3486)
- **bitgo:** restrict receive address withdrawals ([c563742](https://github.com/BitGo/BitGoJS/commit/c5637420dea8904f45bf9b75ced69839301ee315))
- **root:** update tests using safe primes ([5a275ff](https://github.com/BitGo/BitGoJS/commit/5a275ffbf3eecf351dfbb0b4538d62dd0a2f2a43))

# [18.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@18.0.1...bitgo@18.1.0) (2023-04-13)

### Bug Fixes

- **bitgo:** add argument to create address on ofc wallets ([b1a212d](https://github.com/BitGo/BitGoJS/commit/b1a212d05962719822c8420acf4f01dc6e012d16))
- **bitgo:** modified failing unit tests ([9b3ec66](https://github.com/BitGo/BitGoJS/commit/9b3ec66d886b1db936df678cdcb4e3ca6ed785b2))
- **sdk-core:** fix parameter misordering for user gpg key ([225246e](https://github.com/BitGo/BitGoJS/commit/225246e7d52974c216e3b4ff7cfaf9edb213eb3e))

### Features

- **sdk-coin-trx:** add tokens to tron recovery method ([1aec210](https://github.com/BitGo/BitGoJS/commit/1aec2109bbd52a5c77d9df529ec73184c9babc85))
- **sdk-core:** add `switchValidator` for stakingWallet ([c067695](https://github.com/BitGo/BitGoJS/commit/c0676959b9f103ef45439ce32412cca27bf81642))
- **sdk-core:** enable fillNonce and acceleration tx for receive address ([09f05f3](https://github.com/BitGo/BitGoJS/commit/09f05f3f18994e5bd0600ba2f98f2f860ea85bd0))
- **utxo-lib:** create p2tr address using musig2 ([699e829](https://github.com/BitGo/BitGoJS/commit/699e8291f4a205ba0b2071c6369f2c8843b8a945))
- **utxo-lib:** fix for noble ecc wrapper buffer to bigint conversion ([ba58297](https://github.com/BitGo/BitGoJS/commit/ba582975d63c5a3f2584a0bd3cb12ab8a3209d7f))
- **utxo-lib:** improve signature of `createTransactionFromBuffer` ([b896944](https://github.com/BitGo/BitGoJS/commit/b89694442e060cac35b3fc558dc6f87d93f74db3))
- **utxo-lib:** introduce ParsedScriptType ([3c28bbc](https://github.com/BitGo/BitGoJS/commit/3c28bbc4baada5b614ef5893301059b51b324ce2))

## [18.0.1](https://github.com/BitGo/BitGoJS/compare/bitgo@18.0.0...bitgo@18.0.1) (2023-02-17)

### Bug Fixes

- polygon recovery with range proof ([19317f7](https://github.com/BitGo/BitGoJS/commit/19317f709354e61b3e4947870049e99f85556029))
- use post on get challenge end-point ([f2a8320](https://github.com/BitGo/BitGoJS/commit/f2a8320ea985132e052ab81472043a47ec7f57c1))

# [18.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.3.0...bitgo@18.0.0) (2023-02-16)

### Bug Fixes

- **bitgo:** remove enforcement of HMAC verification on all non-prod environments ([118722c](https://github.com/BitGo/BitGoJS/commit/118722c80bfcf8cfc850e07d575ecf10aacb3fd2))
- convert addr to canonical addr during wrongChainRecovery ([2089596](https://github.com/BitGo/BitGoJS/commit/20895964eeac1eedc9f859f0ce9b607313cc6568))
- **sdk-core:** correct ecdsa verifyWalletSigs() ([3b1476c](https://github.com/BitGo/BitGoJS/commit/3b1476cab6ae9a4888a03e15685e70f539df02c2))
- **sdk-core:** eddsa signing vss share ([ae40423](https://github.com/BitGo/BitGoJS/commit/ae404230eec93c0eb2ddfc386fdb18fc42e17c12))
- **sdk-core:** get low balance forwarder ([6b8205c](https://github.com/BitGo/BitGoJS/commit/6b8205c449e2f5fe3dca0247d92dfdf2fdb6ef58))
- **sdk-core:** make derivation play nicely with rangeproofs ([26ad5b5](https://github.com/BitGo/BitGoJS/commit/26ad5b58ff72caa1859a9e6d9c8376f140e8213b))
- **sdk-core:** mark pub as optional in Keychain interface ([7d6012c](https://github.com/BitGo/BitGoJS/commit/7d6012cf1058e43d96e129dc2b1607b5316dca1c))
- **sdk-core:** reduce size of beta0 and nu0 per revised whitepaper ([94d50c9](https://github.com/BitGo/BitGoJS/commit/94d50c91b375aa8155eae71f1ad41d66ffbd37c5))
- **sdk-core:** update fixtures and fix tests ([c936478](https://github.com/BitGo/BitGoJS/commit/c9364786d7d11c9fbb621109efb1fb43a894e9d4))
- **sdk-core:** use hex toString() verify ecdsa ([aead4a4](https://github.com/BitGo/BitGoJS/commit/aead4a4e02842b552e7fc21927fedc8320148cb5))
- use new mock for cross chain recovery test ([d54db09](https://github.com/BitGo/BitGoJS/commit/d54db099d1a3fbdeb0dcc1526858e6f195946a78))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))
- **bitgo:** remove unused dev dependency ([134955b](https://github.com/BitGo/BitGoJS/commit/134955b7d6a52fb5531fbcef1c89580a72e33069))
- **sdk-core:** add ecdsa to verifyShareProof() ([9be664b](https://github.com/BitGo/BitGoJS/commit/9be664b8ee4267e20e0a40d30653d3bd3795b205))
- **sdk-core:** add ecdsa wallet sig verification ([375be2d](https://github.com/BitGo/BitGoJS/commit/375be2d86002258ba11012888fea41094dabc39b))
- **sdk-core:** add type property to Keychain ([5092b29](https://github.com/BitGo/BitGoJS/commit/5092b29a653ae5e5abb7320f65a7d926a7e4cc9f))
- **sdk-core:** allow consolidateUnspents method to only build the tx also ([790f2d1](https://github.com/BitGo/BitGoJS/commit/790f2d1d1451c3ce4ffade7609eb0cd23424f43c))
- **sdk-core:** ecdsa signing use derivation path ([f4ca720](https://github.com/BitGo/BitGoJS/commit/f4ca720587822fd295b1a97f78c9127c2576a46d))
- **sdk-core:** include keyShares in third party backup tss keychain ([c5997de](https://github.com/BitGo/BitGoJS/commit/c5997de87f85bb012665cfe538705eeadbb522cc))
- **sdk-core:** rename type ([c81221f](https://github.com/BitGo/BitGoJS/commit/c81221f3961abe3d73f4bf3c8801fb7f1b4f9b27))
- **sdk-core:** use trust backup gpg for encrypting ([400a9af](https://github.com/BitGo/BitGoJS/commit/400a9af34a5eb1933965bfc675911cd24b8c605b))
- send enterprise id to backupkeys end-point ([701ff7c](https://github.com/BitGo/BitGoJS/commit/701ff7c1aa41ea82ce06b09b36613f0781ad5e9d))
- **statics:** add ofc algorand usdc token ([9450360](https://github.com/BitGo/BitGoJS/commit/9450360e828253ee633acaae8cc0ec57d386a7dc))
- **statics:** add ofc hedera usdc token ([67f1c5d](https://github.com/BitGo/BitGoJS/commit/67f1c5da5b92f228e02451071bacdcbe482c06fd))
- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))

### BREAKING CHANGES

- **sdk-core:** Keychain.pub is now optional
- **sdk-core:** rename type backupGpgKey to BackupGpgKey
- **sdk-core:** The `verifyEdShareProof` function is renamed to
  `verifyShareProof` and now expects a 4th parameter which must be a
  string of either `eddsa` or `ecdsa`.

# [17.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.3.0...bitgo@17.0.0) (2023-02-08)

### Bug Fixes

- **bitgo:** remove enforcement of HMAC verification on all non-prod environments ([118722c](https://github.com/BitGo/BitGoJS/commit/118722c80bfcf8cfc850e07d575ecf10aacb3fd2))
- convert addr to canonical addr during wrongChainRecovery ([2089596](https://github.com/BitGo/BitGoJS/commit/20895964eeac1eedc9f859f0ce9b607313cc6568))
- **sdk-core:** correct ecdsa verifyWalletSigs() ([3b1476c](https://github.com/BitGo/BitGoJS/commit/3b1476cab6ae9a4888a03e15685e70f539df02c2))
- **sdk-core:** get low balance forwarder ([6b8205c](https://github.com/BitGo/BitGoJS/commit/6b8205c449e2f5fe3dca0247d92dfdf2fdb6ef58))
- **sdk-core:** make derivation play nicely with rangeproofs ([26ad5b5](https://github.com/BitGo/BitGoJS/commit/26ad5b58ff72caa1859a9e6d9c8376f140e8213b))
- **sdk-core:** update fixtures and fix tests ([c936478](https://github.com/BitGo/BitGoJS/commit/c9364786d7d11c9fbb621109efb1fb43a894e9d4))
- **sdk-core:** use hex toString() verify ecdsa ([aead4a4](https://github.com/BitGo/BitGoJS/commit/aead4a4e02842b552e7fc21927fedc8320148cb5))
- use new mock for cross chain recovery test ([d54db09](https://github.com/BitGo/BitGoJS/commit/d54db099d1a3fbdeb0dcc1526858e6f195946a78))

### Features

- **account-lib:** make rangeproof stuff async ([380f288](https://github.com/BitGo/BitGoJS/commit/380f288e9cc5f6e98834e118bad65787e836c5a2))
- **bitgo:** remove unused dev dependency ([134955b](https://github.com/BitGo/BitGoJS/commit/134955b7d6a52fb5531fbcef1c89580a72e33069))
- **sdk-core:** add ecdsa to verifyShareProof() ([9be664b](https://github.com/BitGo/BitGoJS/commit/9be664b8ee4267e20e0a40d30653d3bd3795b205))
- **sdk-core:** add ecdsa wallet sig verification ([375be2d](https://github.com/BitGo/BitGoJS/commit/375be2d86002258ba11012888fea41094dabc39b))
- **sdk-core:** add type property to Keychain ([5092b29](https://github.com/BitGo/BitGoJS/commit/5092b29a653ae5e5abb7320f65a7d926a7e4cc9f))
- **sdk-core:** ecdsa signing use derivation path ([f4ca720](https://github.com/BitGo/BitGoJS/commit/f4ca720587822fd295b1a97f78c9127c2576a46d))
- **sdk-core:** include keyShares in third party backup tss keychain ([c5997de](https://github.com/BitGo/BitGoJS/commit/c5997de87f85bb012665cfe538705eeadbb522cc))
- **sdk-core:** rename type ([c81221f](https://github.com/BitGo/BitGoJS/commit/c81221f3961abe3d73f4bf3c8801fb7f1b4f9b27))
- **sdk-core:** use trust backup gpg for encrypting ([400a9af](https://github.com/BitGo/BitGoJS/commit/400a9af34a5eb1933965bfc675911cd24b8c605b))
- send enterprise id to backupkeys end-point ([701ff7c](https://github.com/BitGo/BitGoJS/commit/701ff7c1aa41ea82ce06b09b36613f0781ad5e9d))
- **statics:** add ofc algorand usdc token ([9450360](https://github.com/BitGo/BitGoJS/commit/9450360e828253ee633acaae8cc0ec57d386a7dc))
- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))

### BREAKING CHANGES

- **sdk-core:** rename type backupGpgKey to BackupGpgKey
- **sdk-core:** The `verifyEdShareProof` function is renamed to
  `verifyShareProof` and now expects a 4th parameter which must be a
  string of either `eddsa` or `ecdsa`.

# [16.4.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.3.0...bitgo@16.4.0) (2023-01-30)

### Bug Fixes

- **bitgo:** remove enforcement of HMAC verification on all non-prod environments ([118722c](https://github.com/BitGo/BitGoJS/commit/118722c80bfcf8cfc850e07d575ecf10aacb3fd2))
- **sdk-core:** get low balance forwarder ([6b8205c](https://github.com/BitGo/BitGoJS/commit/6b8205c449e2f5fe3dca0247d92dfdf2fdb6ef58))
- use new mock for cross chain recovery test ([d54db09](https://github.com/BitGo/BitGoJS/commit/d54db099d1a3fbdeb0dcc1526858e6f195946a78))

### Features

- **sdk-core:** add ecdsa wallet sig verification ([375be2d](https://github.com/BitGo/BitGoJS/commit/375be2d86002258ba11012888fea41094dabc39b))
- **statics:** add ofc algorand usdc token ([9450360](https://github.com/BitGo/BitGoJS/commit/9450360e828253ee633acaae8cc0ec57d386a7dc))
- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))

# [16.3.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.2.1...bitgo@16.3.0) (2023-01-25)

### Bug Fixes

- **sdk-coin-eth:** fix recovery flow, add unit test ([49fc287](https://github.com/BitGo/BitGoJS/commit/49fc287403345a710244a5efa53ade30a829a13b))
- **sdk-coin-eth:** fix unit test ([c26015c](https://github.com/BitGo/BitGoJS/commit/c26015c7819b061a4bd8f7acfc5175af30d06b17))
- **sdk-core:** remove generic typing from typeddata associated with eip712 ([ac1047e](https://github.com/BitGo/BitGoJS/commit/ac1047ea482f7751dd145d538de3412e738e30e9))

### Features

- **sdk-coin-atom:** create atom module ([88d9971](https://github.com/BitGo/BitGoJS/commit/88d99714275e98c3997451776c9eec3b21645ffa))
- **sdk-core:** add extra params for addKey ([43e095e](https://github.com/BitGo/BitGoJS/commit/43e095efa52fefd25dd977ed8cd271fb146780ca))
- **sdk-core:** add u value proof for ecdsa ([1ae0107](https://github.com/BitGo/BitGoJS/commit/1ae01076e503d57729a528a21044940526bfe917))
- **sdk-core:** forwarder version 3 ([82e6deb](https://github.com/BitGo/BitGoJS/commit/82e6debac071486435c51ce3f52f8352bdb8a8fb))
- **sdk-core:** get bitgo public key based on coin and feature flags ([c5cee95](https://github.com/BitGo/BitGoJS/commit/c5cee95fa8005a8a83cf5c5afc01f35e3235d970))
- **statics:** add ofc stellar usdc token ([2c2735d](https://github.com/BitGo/BitGoJS/commit/2c2735d602c09cbbbeda78ef27a050ca08d3dc42))
- **statics:** fix the keycurve testcase ([b1bc356](https://github.com/BitGo/BitGoJS/commit/b1bc35642f58469e153782932586b79ad4ef0cf8))

## [16.2.1](https://github.com/BitGo/BitGoJS/compare/bitgo@16.2.0...bitgo@16.2.1) (2022-12-23)

**Note:** Version bump only for package bitgo

# [16.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.1.2...bitgo@16.2.0) (2022-12-20)

### Bug Fixes

- **sdk-core:** fix generate wallets isCold param ([ff22908](https://github.com/BitGo/BitGoJS/commit/ff229088405cf09be4bc86bdbdee340b37b551a6))

### Features

- added eip712 sign typed data ([6d2cbea](https://github.com/BitGo/BitGoJS/commit/6d2cbeaa04de80c12b41dcd1e88f886011f46b30))
- **sdk-coin-eth:** add support for tss recoveries ([5954c7d](https://github.com/BitGo/BitGoJS/commit/5954c7dd1d32b2f60e8c41d31d7b205ccc51ecc4))
- **sdk-core:** allow forwarder version 2 ([7b9a05b](https://github.com/BitGo/BitGoJS/commit/7b9a05b89f68ac13858911e002be7adf3304646f))

## [16.1.2](https://github.com/BitGo/BitGoJS/compare/bitgo@16.1.1...bitgo@16.1.2) (2022-12-09)

### Bug Fixes

- enable cookie propagation gating for test and prod ([da6ddb3](https://github.com/BitGo/BitGoJS/commit/da6ddb30d99cb50f1434399a967f7d99e9fc5187))

## [16.1.1](https://github.com/BitGo/BitGoJS/compare/bitgo@16.1.0...bitgo@16.1.1) (2022-12-06)

**Note:** Version bump only for package bitgo

# [16.1.0](https://github.com/BitGo/BitGoJS/compare/bitgo@16.0.0...bitgo@16.1.0) (2022-12-01)

### Features

- **abstract-utxo:** add valueString to unspents for doge recovery flow ([439f95c](https://github.com/BitGo/BitGoJS/commit/439f95c4e337e33a0812ac28b03e46b52e4a9fde))
- **bitgo:** add api version input ([42f353f](https://github.com/BitGo/BitGoJS/commit/42f353f0b33857963d66739d34b0d0cac85e82db))
- **sdk-core:** add keyDerive to ECDSA TSS implementation ([9ff1d89](https://github.com/BitGo/BitGoJS/commit/9ff1d89ba0e42d53640f0fe7b71c53d1a2eb4a10))

# [16.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@16.0.0) (2022-11-29)

### Bug Fixes

- disable vss verification ([5cdc53b](https://github.com/BitGo/BitGoJS/commit/5cdc53b2e2440524c6ba11109f50eb41222c3f3e))
- multiple issues with message signing ([d703b9a](https://github.com/BitGo/BitGoJS/commit/d703b9a6149c4fe26ad16001f5f681389c8f8aba))
- remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
- **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
- **sdk-core:** disabling vss for eddsa ([7c91d14](https://github.com/BitGo/BitGoJS/commit/7c91d1485f879ebe7a3435871f1d8dafc8f1eef8))
- **sdk-core:** ecdsa tss wallet creation ([2fd5f41](https://github.com/BitGo/BitGoJS/commit/2fd5f4143f4586bb770d9c508316490d57753a32))
- **sdk-core:** eddsa vss ([de1fbd6](https://github.com/BitGo/BitGoJS/commit/de1fbd6179190cc0dae4054088cfb50402286589))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))
- **sdk-core:** vss ([01be344](https://github.com/BitGo/BitGoJS/commit/01be34475a036640a9d842f3f657f46d49a45517))
- update express configurations ([d434ece](https://github.com/BitGo/BitGoJS/commit/d434ece0ce942473064d0ba2009d4f11dd43bb96))

### Features

- add cancel staking request ([7e053fd](https://github.com/BitGo/BitGoJS/commit/7e053fddd93888ff73a5c03924cc1c42623bff32))
- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
- allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
- **bitgo:** ada staking and unstaking tests ([5334d0b](https://github.com/BitGo/BitGoJS/commit/5334d0bfb7bcbf23cc556c3257174bd6ba866dcc))
- **bitgo:** sdk script to get token balance from wallet ([67086f8](https://github.com/BitGo/BitGoJS/commit/67086f8bf844a91ef4ecebead004fb63f520a23f))
- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
- **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
- **root:** add support for cross chain recovery for bcha ([f9ab941](https://github.com/BitGo/BitGoJS/commit/f9ab941055eaf79f6623b40e9aac982124f78843))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-coin-trx:** add tron token skeleton ([03198b0](https://github.com/BitGo/BitGoJS/commit/03198b0e23e6c87ce2d34d08973abca301f88252))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add function to verify wallet signatures for TSS ([0e6840e](https://github.com/BitGo/BitGoJS/commit/0e6840e4b9a89aea30e784e0acede2377937fe6c))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))
- **sdk-core:** added get payments method for lightning ([fd22577](https://github.com/BitGo/BitGoJS/commit/fd22577755be722ac98ddae21108787adf7d4c13))
- **sdk-core:** change sendMany to work for custodial wallets ([45eb658](https://github.com/BitGo/BitGoJS/commit/45eb65883cb5a5f28fca486fec31215cddae8f69))
- **sdk-core:** expect txid response for lightning withdrawal ([22dfeab](https://github.com/BitGo/BitGoJS/commit/22dfeabda3923a104a4f86e820375c32d05d6879))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

### BREAKING CHANGES

- **sdk-core:** Key shares require a `v` value for combination.
  ISSUE: BG-57633

# [15.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@15.0.0) (2022-11-04)

### Bug Fixes

- disable vss verification ([5cdc53b](https://github.com/BitGo/BitGoJS/commit/5cdc53b2e2440524c6ba11109f50eb41222c3f3e))
- remove encoding from message sent to bitgo ([d300963](https://github.com/BitGo/BitGoJS/commit/d300963da1333dc5b970fd3afe9f3dedb3fe9896))
- **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))
- update express configurations ([d434ece](https://github.com/BitGo/BitGoJS/commit/d434ece0ce942473064d0ba2009d4f11dd43bb96))

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
- allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
- **bitgo:** ada staking and unstaking tests ([5334d0b](https://github.com/BitGo/BitGoJS/commit/5334d0bfb7bcbf23cc556c3257174bd6ba866dcc))
- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
- **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** add VSS share generation and verification ([619f254](https://github.com/BitGo/BitGoJS/commit/619f2542f9c44f8468460864f78b975a2ccb7b7f))
- **sdk-core:** allow preBuildTransaction to accept wallet id ([a797e38](https://github.com/BitGo/BitGoJS/commit/a797e38b0269bc0ea6e4834f0aca4605ef297265))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

### BREAKING CHANGES

- **sdk-core:** Key shares require a `v` value for combination.
  ISSUE: BG-57633

# [14.7.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@14.7.0) (2022-10-27)

### Bug Fixes

- **sdk-core:** add chaincode to user->backup public shares ([fef4a1a](https://github.com/BitGo/BitGoJS/commit/fef4a1a4c3a71b97e15fea4502e07f05de4501e3))
- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
- allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- pass custodianTransaction and messageId ([35b7953](https://github.com/BitGo/BitGoJS/commit/35b795395d1f8fc142bf852ea2b211921671225b))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

# [14.6.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.5.0...bitgo@14.6.0) (2022-10-25)

### Bug Fixes

- **sdk-core:** properly translate tx type to transferToken intent BG-60250 ([eb518f9](https://github.com/BitGo/BitGoJS/commit/eb518f97ab973661493170421ad91b18cd370d89))
- **sdk-core:** update the staging Environment ([e8477be](https://github.com/BitGo/BitGoJS/commit/e8477be3d182cd6e3cbfd7fe5e231bcfbcbd0f2d))
- **sdk-core:** use correct api param name for user gpg pubkey ([ccc3237](https://github.com/BitGo/BitGoJS/commit/ccc3237e348f74baf5df7944f7efcd0d06d1eae7))

### Features

- add token enablement support in express ([4bd5f9e](https://github.com/BitGo/BitGoJS/commit/4bd5f9ef2388d0e615c1bfbe523f6d75ff223b7a))
- allow the sdk to optionally send cookies with the request to custom domains ([e40349e](https://github.com/BitGo/BitGoJS/commit/e40349e8e36e946fe8630e94b0796e34b4aee51b))
- create txrequest for message signing ([4ee1a9c](https://github.com/BitGo/BitGoJS/commit/4ee1a9ceb748984cbd3b243fbba3ac0b54564e34))
- **sdk-coin-eth:** add fillnonce capability to sdk ([6d9a965](https://github.com/BitGo/BitGoJS/commit/6d9a9657cbd1ee273294e1ed4e44ed192915648b))
- **sdk-core:** add fetchCrossChainUTXOs in wallet ([cf3a51b](https://github.com/BitGo/BitGoJS/commit/cf3a51bd9ddbbda38f241d4570ce26936a4c16ca))
- **sdk-core:** add support for ETH TSS staking ([a8afdb6](https://github.com/BitGo/BitGoJS/commit/a8afdb64d9081ba62ed51bf3050d668868d14843))
- **sdk-core:** tss ecdsa key creation flow with 3rd party backup ([08d2065](https://github.com/BitGo/BitGoJS/commit/08d206527df42bdd0cc42270fb19a9d828ba219c))

# [14.5.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.42...bitgo@14.5.0) (2022-10-18)

### Bug Fixes

- **bitgo:** remove address param from lightning().deposit ([b49ec63](https://github.com/BitGo/BitGoJS/commit/b49ec638e130633508cdc64fe6a3bdaaafed5aef))
- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
- **core:** regenerate p2tr test vectors ([8d0611a](https://github.com/BitGo/BitGoJS/commit/8d0611a53f76ac2f81d6eeac5404e1fd77a6703d))
- **sdk-coin-eos:** fix precision for EOS:CHEX tokens ([0e60ec9](https://github.com/BitGo/BitGoJS/commit/0e60ec9e92a9c737fd65d89476f080b99a0fa842))
- **sdk-coin-eth:** fix convert signature share to/from ([9aed51e](https://github.com/BitGo/BitGoJS/commit/9aed51ee96aefef29ef1cf11b0ce821b996ce08e))
- **sdk-core:** allow for optional passphrase on tss wallets ([f334232](https://github.com/BitGo/BitGoJS/commit/f3342328a85c78ab9d886478bfd027239f2251d8))
- **sdk-core:** allow undefined for amtPaidSats ([7e9e9ea](https://github.com/BitGo/BitGoJS/commit/7e9e9eac7cab9ef41bc08e82704b90a8aeb46de9))
- **sdk-core:** default wallet to non tss ([26febd4](https://github.com/BitGo/BitGoJS/commit/26febd42bc12fe417fecb1896e8ff5313be9fc18))
- **sdk-core:** ecdsa keychain creation types mach ([1224de3](https://github.com/BitGo/BitGoJS/commit/1224de3f707759f4ef22836a80c3b834ec04b98d))
- **sdk-core:** ecdsa send signing bitgo's n share u ([1cb1e93](https://github.com/BitGo/BitGoJS/commit/1cb1e933c692f454de538b3b189ef2feb1b39475))
- **sdk-core:** ecdsa sign serializedTxHex ([2fda8fc](https://github.com/BitGo/BitGoJS/commit/2fda8fc364f357a66645665b7793182baf2efbcb))
- **sdk-core:** ecdsa signing get user share ([acbc700](https://github.com/BitGo/BitGoJS/commit/acbc7002c9ffd62c78e6dd2e72feac0c3ff4fe45))
- **sdk-core:** ecdsa tss signing flow update ([226586c](https://github.com/BitGo/BitGoJS/commit/226586ce2f1af6f5593bb97c3a297f332aee3b34))
- **sdk-core:** fix send token enablements by writing in buildParams in prebuildTx ([9dc933a](https://github.com/BitGo/BitGoJS/commit/9dc933a878b2a70adc69cd329883f668a8943aa0))
- **sdk-core:** fix tss ecdsa keychain encryption ([95f9c2d](https://github.com/BitGo/BitGoJS/commit/95f9c2d7d1018d387dc6cabd89e5c0d14b9f07d3))
- **sdk-core:** tss tx signing ([ab7eb80](https://github.com/BitGo/BitGoJS/commit/ab7eb8079ea37e347727db106d01fe9362f36374))
- **sdk-core:** tss wallet creation related bugs ([500c735](https://github.com/BitGo/BitGoJS/commit/500c73527edd902b65cfd784ea1022a21e0f6319))
- **utxo-lib:** use safe version of bitcoinjs-lib ([8f2226b](https://github.com/BitGo/BitGoJS/commit/8f2226b6276fe47413759bf7462b8429d9e69f90))

### Features

- **abstract-utxo:** add support for bigints from new utxo-lib ([77c60dd](https://github.com/BitGo/BitGoJS/commit/77c60ddd4d0ddd1e82a8b1bb041686a9c7f39fae))
- **abstract-utxo:** add support for bigints from new utxo-lib ([8e5bbe5](https://github.com/BitGo/BitGoJS/commit/8e5bbe5e158254d34abb87f6d000e5afd9bb6b9d))
- **abstract-utxo:** backup key recovery service for doge ([612be53](https://github.com/BitGo/BitGoJS/commit/612be533836f33fdecb9584ddc0f5674df31dcb0))
- **abstract-utxo:** cross chain recovery support for bigint coins (doge) ([ad6bf71](https://github.com/BitGo/BitGoJS/commit/ad6bf71f58a4bae79f3bb014ee947a878f4b89d2))
- add message signing support for polygon ([ab2bac1](https://github.com/BitGo/BitGoJS/commit/ab2bac13dad55ce8571d014796298aa52a24a5f2))
- add u value proof during tss eddssa key creation ([79d2c91](https://github.com/BitGo/BitGoJS/commit/79d2c91ea5b101f8cad9b107b9e4426939333c5f))
- adding support for message signing ([01c6303](https://github.com/BitGo/BitGoJS/commit/01c63032d067e6ba5aef78804ea747b5e62709fe))
- **bitgo:** add lightning and lnurl examples ([8894bac](https://github.com/BitGo/BitGoJS/commit/8894bac0fd47eb9841e545011dc25d516dd72e9c))
- **bitgo:** adding example for tx-build ([c967e26](https://github.com/BitGo/BitGoJS/commit/c967e2630bb7768278572361c61667c0452af1ba))
- **bitgo:** expose Ethw in core bitgo module ([183cda4](https://github.com/BitGo/BitGoJS/commit/183cda433f8c683722843e2c30bf46101a1cd677))
- **bitgo:** support chaincodes on BLS-DKG keychains creation ([bfaa380](https://github.com/BitGo/BitGoJS/commit/bfaa380551d2fe90e041975b392d4398c781074a))
- **sdk-coin-ada:** create wallet script ([6263411](https://github.com/BitGo/BitGoJS/commit/626341127af23d7033261eed16a61b615fbc70d4))
- **sdk-coin-ada:** incorporate sdk-coin-ada back into bitgo ([99d141b](https://github.com/BitGo/BitGoJS/commit/99d141be06fa98f77ea88dc6f7cbae7aa1f9e002))
- **sdk-coin-bsc:** create bsc module ([b55ca71](https://github.com/BitGo/BitGoJS/commit/b55ca7173e27ee2d75d342b6706698769f11734f))
- **sdk-coin-bsc:** support tokens for bsc ([44d2af8](https://github.com/BitGo/BitGoJS/commit/44d2af8f3f14bc61d31e6a0b8482a68db2a7d23e))
- **sdk-coin-eth:** add acceleration capability for eth ([436ba8c](https://github.com/BitGo/BitGoJS/commit/436ba8ceb478c4028d5b05dc34bb623be6fc581f))
- **sdk-coin-ethw:** add ethw sdk module ([63e9850](https://github.com/BitGo/BitGoJS/commit/63e9850c27039d1b614d14426a1d9b090d454b76))
- **sdk-coin-polygon:** support tokens ([8870307](https://github.com/BitGo/BitGoJS/commit/8870307b63f460031019aecf30c60df4f2c0a112))
- **sdk-coin-sui:** create sui module ([8ba86b7](https://github.com/BitGo/BitGoJS/commit/8ba86b7a10720a14ff1efa9c4616c1f26d27d8e4))
- **sdk-core:** add createDepositAddress to lightning ([e7056dc](https://github.com/BitGo/BitGoJS/commit/e7056dc48448d69328d29bd223c179eb6486a40e))
- **sdk-core:** add createInvoice to lightning ([293a5d6](https://github.com/BitGo/BitGoJS/commit/293a5d6badd73def299b4f8420bc3380bb862cb2))
- **sdk-core:** add deposit() to lightning object ([aeb483d](https://github.com/BitGo/BitGoJS/commit/aeb483d2cd2baf49659674f9b9ad7a9d37fcf672))
- **sdk-core:** add enable token support for sol ([dde3a95](https://github.com/BitGo/BitGoJS/commit/dde3a952b45f9e49d61bdc92d7cddaff1a646c08))
- **sdk-core:** add getBalance for lightning ([ccd2e81](https://github.com/BitGo/BitGoJS/commit/ccd2e817cddda09709ae3d65a91d7fd122661f5c))
- **sdk-core:** add getInvoices to lightning object ([232bea3](https://github.com/BitGo/BitGoJS/commit/232bea30d95a4b6f9554cc0416c54f0f73a979ad))
- **sdk-core:** add helper to create backup TSS key share held by BitGo ([d5921ad](https://github.com/BitGo/BitGoJS/commit/d5921ad6c0a90b9a0e5ec7d60b86fd8741550b5c))
- **sdk-core:** add helper to finish backup TSS key share held by BitGo ([f2d85b5](https://github.com/BitGo/BitGoJS/commit/f2d85b5132c9466a70dea645598dbbf95c677c4d))
- **sdk-core:** add includeTokens wallet.addresses parameter ([8c03d83](https://github.com/BitGo/BitGoJS/commit/8c03d8363e3e3b56b6c7f18b0e098d68f25d54c2))
- **sdk-core:** add more ecdsa helper methods ([aa57eac](https://github.com/BitGo/BitGoJS/commit/aa57eacdc97f2ecac4179f76461d798226178ba8))
- **sdk-core:** add payInvoice to lightning object ([eaaa48d](https://github.com/BitGo/BitGoJS/commit/eaaa48d10a8d0cc74b2ac97e0d0d97feba88d72a))
- **sdk-core:** add recid to fully constructed signature ([a8adcd9](https://github.com/BitGo/BitGoJS/commit/a8adcd9c3f452f1dfc85454668c19103cec7160d))
- **sdk-core:** add specialized enable token functions ([3e60cef](https://github.com/BitGo/BitGoJS/commit/3e60cef71a0ae76b378356508338738eac49a920))
- **sdk-core:** add withdraw to lightning object ([99474b5](https://github.com/BitGo/BitGoJS/commit/99474b581023b228ce6f2713f5b5d58c8d1186d6))
- **sdk-core:** added large value support while calling WP ([870621e](https://github.com/BitGo/BitGoJS/commit/870621e2bc93d15ed6f040379353d039eb17e609))
- **sdk-core:** added verification of private share proofs ([66d6c63](https://github.com/BitGo/BitGoJS/commit/66d6c63bd102da49727e3bdb275cfa6231859ce5))
- **sdk-core:** allow getting a staking wallet for any coin ([cfae0fe](https://github.com/BitGo/BitGoJS/commit/cfae0feeb14c1bcb30dad2840abd8489372bfbc8))
- **sdk-core:** ecdsa type converters ([800b01b](https://github.com/BitGo/BitGoJS/commit/800b01b02194011bc0ac608a5d75094f935d6235))
- **sdk-core:** implement signing flow ecdsa ([68aa561](https://github.com/BitGo/BitGoJS/commit/68aa561193fe0574bd7b7080bb51d1d795cf31f9))
- **sdk-core:** parse zero value lightning invoices ([78cab72](https://github.com/BitGo/BitGoJS/commit/78cab722387bd6348cb81951c2e611db231484e0))
- **sdk-core:** support lnurl pay ([6df91a3](https://github.com/BitGo/BitGoJS/commit/6df91a3eac28bf55600d5e856a297dde6b56c826))
- **sdk-core:** support transfertoken type transactions ([6579785](https://github.com/BitGo/BitGoJS/commit/65797851062fb7beb3b1eb6a1db00e23f0a3c209))
- **sdk-core:** use eth wallet for building and signing token txs ([82dd4a9](https://github.com/BitGo/BitGoJS/commit/82dd4a9a19f144dfdf83afd40155532d4df3163c))
- **statics:** add ETHw statics ([f49ef42](https://github.com/BitGo/BitGoJS/commit/f49ef4233ffb788765eac5b5d20232334fbd6203))
- **statics:** add ofc for near ([4ecde82](https://github.com/BitGo/BitGoJS/commit/4ecde82919019aa8bdacbe7958acb8ec6a5bf50f))
- **statics:** add solana ([b46780e](https://github.com/BitGo/BitGoJS/commit/b46780ef7188b0f4451632c2fe2c3be86cdef9a7))
- the client needs to generate a gpg key for their backup key share and share it with bitgo ([fb10fae](https://github.com/BitGo/BitGoJS/commit/fb10fae409761363fd8a3bb489011c34f041140c))
- **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))

### Reverts

- Revert "feat(sdk-coin-aca): add sdk-coin-aca module BG-52862" ([e97716e](https://github.com/BitGo/BitGoJS/commit/e97716e487977617c205ec96fea68467857ab8de))

### BREAKING CHANGES

- **sdk-core:** The SShare type's `r` field is now `R` (33 bytes encoded as 66 hex characters).
  ISSUE: BG-56664
- **sdk-core:** We need to deal with the new enableToken intent type for solana on wp.
- **bitgo:** This breaks the current ETH2 Hot Wallet creation flow. Needs BG-46182 to be
  implemented and deployed too.

BG-46184

# [14.2.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.42...bitgo@14.2.0) (2022-07-19)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.42](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.40...bitgo@14.2.0-rc.42) (2022-07-19)

### Features

- **sdk-coin-ada:** implement key pair and utils for ada sdk ([9a1aabb](https://github.com/BitGo/BitGoJS/commit/9a1aabb8a07b5787ab3fa645c29be1b940694892))

# [14.2.0-rc.41](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.40...bitgo@14.2.0-rc.41) (2022-07-18)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.40](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.39...bitgo@14.2.0-rc.40) (2022-07-15)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.39](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.37...bitgo@14.2.0-rc.39) (2022-07-15)

### Features

- **account-lib:** get rid of old ethereum lib ([abd2247](https://github.com/BitGo/BitGoJS/commit/abd2247047218d8cbd8ec7067d227721357f5fcc))

# [14.2.0-rc.38](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.37...bitgo@14.2.0-rc.38) (2022-07-14)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.36](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.35...bitgo@14.2.0-rc.36) (2022-07-12)

### Features

- **account-lib:** update hbar txData and explainTx to support diff instructions ([b604de6](https://github.com/BitGo/BitGoJS/commit/b604de6dad4d31cb83a673257e0c88a6c5934242))

# [14.2.0-rc.35](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.34...bitgo@14.2.0-rc.35) (2022-07-11)

### Bug Fixes

- update invalid files for depcheck ([6aae9aa](https://github.com/BitGo/BitGoJS/commit/6aae9aaf1cb70d65a75fa6d208eaa26d371443a6))

### Features

- **bitgo:** create skeleton for hbar tokens ([d156a51](https://github.com/BitGo/BitGoJS/commit/d156a5188fa4923142964284276431fe8a0d4267))
- **sdk-coin-stx:** refactor stx to its own module ([80866b4](https://github.com/BitGo/BitGoJS/commit/80866b4161349efa513f801c0830029e5d5f36a3))
- **sdk-coin-xtz:** refactor xtz to its own module ([241f580](https://github.com/BitGo/BitGoJS/commit/241f580c6711a186e36b11ec4ac3452b874bcacb))
- **utxo-lib:** add network configuration for DOGE ([442e7e9](https://github.com/BitGo/BitGoJS/commit/442e7e9df3acd00edde3a0512de363164a377bb5))

# [14.2.0-rc.34](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.33...bitgo@14.2.0-rc.34) (2022-07-07)

### Features

- **account-lib:** cardano ada coin skeleton ([68f7fe7](https://github.com/BitGo/BitGoJS/commit/68f7fe708d27dba55885da32e4be07aa1e1bbf00))
- **account-lib:** hbar token transfer builder and serialization ([0bc7287](https://github.com/BitGo/BitGoJS/commit/0bc72870b02a29e67df134022bde2c3750107a9b))
- **sdk-coin-bcha:** refactor bcha to its own module ([6fb1a70](https://github.com/BitGo/BitGoJS/commit/6fb1a704d2365cc7e212860a81dbd47b70f59d6f))
- **sdk-coin-bch:** refactor bch to its own module ([3d3c2ed](https://github.com/BitGo/BitGoJS/commit/3d3c2eda2115fe136050f06a02c6c12cb1827707))
- **sdk-coin-bsv:** refactor bsv to its own module ([9f6b6e8](https://github.com/BitGo/BitGoJS/commit/9f6b6e8bc0aeba956646bd7be0466e934d477b26))
- **sdk-coin-btg:** refactor btg to its own module ([ebebe70](https://github.com/BitGo/BitGoJS/commit/ebebe70f8c103f7ddddcc878204e686eb04d786a))
- **sdk-coin-ltc:** refactor ltc to its own module ([7bb56a4](https://github.com/BitGo/BitGoJS/commit/7bb56a44f4099d6caf853d1eeccfa6cd501a9f5e))
- **sdk-core:** tss ecdsa utility to create keychains ([0a1ab71](https://github.com/BitGo/BitGoJS/commit/0a1ab71ea981fe8bd833f1b25cc3c90e6cb89565))

# [14.2.0-rc.33](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.32...bitgo@14.2.0-rc.33) (2022-07-05)

### Features

- **sdk-coin-dash:** refactor dash to its own module ([d62f637](https://github.com/BitGo/BitGoJS/commit/d62f637ca3ac47f79c03dfaee98636e580a56020))

### Reverts

- Revert "Revert "feat(bitgo): change the names from algo tokens"" ([ea9a761](https://github.com/BitGo/BitGoJS/commit/ea9a7619ef71de008c99fa22bab14ec7aa358db6))

# [14.2.0-rc.32](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.31...bitgo@14.2.0-rc.32) (2022-07-01)

### Features

- **sdk-coin-zec:** refactor zec to its own module ([0d429c6](https://github.com/BitGo/BitGoJS/commit/0d429c60eb4d66de8c512ae5fdec8b0ceb067e2f))
- **sdk-core:** update validation to include eip1559 ([4775a84](https://github.com/BitGo/BitGoJS/commit/4775a84de1e4ba18dcbc7cd8cbfa0a40c4625e46))

# [14.2.0-rc.31](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.30...bitgo@14.2.0-rc.31) (2022-06-30)

### Bug Fixes

- **sdk-core:** fix sol send token sdk ([d5c697b](https://github.com/BitGo/BitGoJS/commit/d5c697b4f0b2e6a95eaf7a1f6e70db063f2877d2))

# [14.2.0-rc.30](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.29...bitgo@14.2.0-rc.30) (2022-06-30)

### Bug Fixes

- **bitgo:** rounded value on spendable balance ([8ce7d01](https://github.com/BitGo/BitGoJS/commit/8ce7d019c3aed6827527a02c64226c4c27403f19))
- use correct address encoding when decoding polkadot txn ([99d4bdc](https://github.com/BitGo/BitGoJS/commit/99d4bdc237fcf126238455f7201ae51696e77566))

# [14.2.0-rc.29](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.27...bitgo@14.2.0-rc.29) (2022-06-29)

### Bug Fixes

- register solana tokens ([26baa35](https://github.com/BitGo/BitGoJS/commit/26baa35b3b4d9275c85fd49490e810a517860396))

### Reverts

- Revert "feat(bitgo): change the names from algo tokens" ([81e794b](https://github.com/BitGo/BitGoJS/commit/81e794bba02f050055452481e0b87b58e68928de))

# [14.2.0-rc.28](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.27...bitgo@14.2.0-rc.28) (2022-06-29)

### Bug Fixes

- register solana tokens ([26baa35](https://github.com/BitGo/BitGoJS/commit/26baa35b3b4d9275c85fd49490e810a517860396))

### Reverts

- Revert "feat(bitgo): change the names from algo tokens" ([81e794b](https://github.com/BitGo/BitGoJS/commit/81e794bba02f050055452481e0b87b58e68928de))

# [14.2.0-rc.27](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.26...bitgo@14.2.0-rc.27) (2022-06-27)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.26](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.25...bitgo@14.2.0-rc.26) (2022-06-27)

### Reverts

- Revert "feat(bitgo): handle new response for consolidateAccount/build endpoin" ([ec5ab05](https://github.com/BitGo/BitGoJS/commit/ec5ab05e66ef238addf3e213fff63ae9263e1010))

# [14.2.0-rc.25](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.24...bitgo@14.2.0-rc.25) (2022-06-23)

### Features

- **sdk-coin-avaxp:** implement generateKeyPair and signTransaction ([52b03d2](https://github.com/BitGo/BitGoJS/commit/52b03d2a8583e1da24789c4cdd30924416e28ec2))

# [14.2.0-rc.24](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.23...bitgo@14.2.0-rc.24) (2022-06-22)

### Bug Fixes

- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))

### Features

- **bitgo:** change the names from algo tokens ([8925d4e](https://github.com/BitGo/BitGoJS/commit/8925d4e15cd973e86bc3f78ade3fa863adfde656))

# [14.2.0-rc.23](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.22...bitgo@14.2.0-rc.23) (2022-06-21)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.22](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.21...bitgo@14.2.0-rc.22) (2022-06-16)

### Features

- **sdk-core:** add staking SDK functionality ([20371c9](https://github.com/BitGo/BitGoJS/commit/20371c9e320c6a6f9c929dcdbd3cfa197b960ac9))

# [14.2.0-rc.21](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.20...bitgo@14.2.0-rc.21) (2022-06-15)

### Features

- added explainTransaction and unit tests for dot ([e5746f9](https://github.com/BitGo/BitGoJS/commit/e5746f91ac98d4583c6c743a2c3e4a0e26b9df96))

# [14.2.0-rc.20](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.19...bitgo@14.2.0-rc.20) (2022-06-14)

### Features

- **sdk-core:** tss ecdsa key gen helper methods ([ef7e13e](https://github.com/BitGo/BitGoJS/commit/ef7e13e3bb948631f1d0faa7d2e34a4445197db2))

# [14.2.0-rc.19](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.18...bitgo@14.2.0-rc.19) (2022-06-14)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.18](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.17...bitgo@14.2.0-rc.18) (2022-06-13)

### Bug Fixes

- update cspr unit tests ([cbbaf2c](https://github.com/BitGo/BitGoJS/commit/cbbaf2c731dacedc4200700d145a48669af71c40))

### Features

- **bitgo:** add doc for txn with emergency param ([ae6ec8f](https://github.com/BitGo/BitGoJS/commit/ae6ec8f763ab4e0b6def9e1eb517889d216779bf))
- **bitgo:** implements sign tx for polygon ([f687486](https://github.com/BitGo/BitGoJS/commit/f687486c2d269e6726131edca12895f0d452bba5))

# [14.2.0-rc.17](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.16...bitgo@14.2.0-rc.17) (2022-06-10)

### Bug Fixes

- **abstract-utxo:** add bsv replay protection case ([5e166cb](https://github.com/BitGo/BitGoJS/commit/5e166cbbc89ff10bd59308debf8f43dd18de0c47))

### Features

- **bitgo:** add explain tx polygon ([63c83f7](https://github.com/BitGo/BitGoJS/commit/63c83f7eede67e4cecf731435f243b3c7c27fec5))
- **bitgo:** handle new response for consolidateAccount/build endpoin ([a333c5f](https://github.com/BitGo/BitGoJS/commit/a333c5f347aeab789414945aff5ed4281f3be296))
- move coinFactory from bitgo to sdk-core ([fb7e902](https://github.com/BitGo/BitGoJS/commit/fb7e902c150a25c40310dc040ca6a8833b097cef))
- support building transactions for tss custodial wallets ([12774ca](https://github.com/BitGo/BitGoJS/commit/12774cad3fe817f582be10228025aae2a5967cbc))

# [14.2.0-rc.16](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.15...bitgo@14.2.0-rc.16) (2022-06-07)

### Bug Fixes

- **sdk-api:** api uses own version ([e2091e9](https://github.com/BitGo/BitGoJS/commit/e2091e9074f392fcebea468c8cb60cb6eb445b84))

# [14.2.0-rc.15](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.14...bitgo@14.2.0-rc.15) (2022-06-07)

### Features

- implement polygon util method, core skeleton ([562855a](https://github.com/BitGo/BitGoJS/commit/562855afea41458f9569c90914619a6d515b92c0))

# [14.2.0-rc.14](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.13...bitgo@14.2.0-rc.14) (2022-06-02)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.13](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.12...bitgo@14.2.0-rc.13) (2022-06-02)

### Bug Fixes

- **account-lib:** fix sdk avax build issues ([7991aef](https://github.com/BitGo/BitGoJS/commit/7991aef5ba8218da376f482ed9e2273f8b9a349b))

### Features

- **sdk-coin-avaxp:** add new sdk coin avaxp ([328d546](https://github.com/BitGo/BitGoJS/commit/328d546897d5df645d5bcbf6ca22c56d045bc306))

# [14.2.0-rc.12](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.11...bitgo@14.2.0-rc.12) (2022-06-01)

### Bug Fixes

- add missing examples and filters for list addresses api ([6a6ad90](https://github.com/BitGo/BitGoJS/commit/6a6ad90c670710cd169cc11aeb68f227bfd60a7c))
- **bitgo:** fix v1 wallet get address ([74c2420](https://github.com/BitGo/BitGoJS/commit/74c24206fb63ef3fbaea3ad6a17c0e2dcea6ea32))
- **utxo-lib:** always use VERSION4_BRANCH_NU5 for zcash ([ef0692c](https://github.com/BitGo/BitGoJS/commit/ef0692c6772f6d21fce3da6cc515dc74915c3c6d))

### Features

- **sdk-core:** Define new BitGoBase interface in sdk-core ([907bd9e](https://github.com/BitGo/BitGoJS/commit/907bd9e024f196bfb707f04065a47d74e0f7ce0d))

# [14.2.0-rc.11](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.10...bitgo@14.2.0-rc.11) (2022-05-23)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.10](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.9...bitgo@14.2.0-rc.10) (2022-05-19)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.9](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.8...bitgo@14.2.0-rc.9) (2022-05-19)

### Bug Fixes

- **bitgo:** getUnspentInfo to handle missing unspents ([8fe1ae9](https://github.com/BitGo/BitGoJS/commit/8fe1ae9094c728f25f0cc3a53ec170c1c348b49d))

# [14.2.0-rc.8](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.7...bitgo@14.2.0-rc.8) (2022-05-18)

### Bug Fixes

- v1 getWallet call ([0dad23c](https://github.com/BitGo/BitGoJS/commit/0dad23cf96541a49dc3e0a3135dbd099eabc7c6b))

# [14.2.0-rc.7](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.6...bitgo@14.2.0-rc.7) (2022-05-17)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.6](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.5...bitgo@14.2.0-rc.6) (2022-05-16)

### Features

- **statics:** add fiatusd and tfiatusd coins ([1750a43](https://github.com/BitGo/BitGoJS/commit/1750a4319298a839fc7dd3f418420f26b2cdb5a0))

# [14.2.0-rc.5](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.4...bitgo@14.2.0-rc.5) (2022-05-13)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.4](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.3...bitgo@14.2.0-rc.4) (2022-05-13)

### Features

- **bitgo:** add parse transaction in core ([1775c73](https://github.com/BitGo/BitGoJS/commit/1775c737f12b0fed4dfc3e927855304b928530e9))
- **statics:** create statics for dogecoin ([66e8862](https://github.com/BitGo/BitGoJS/commit/66e88626e09cf886748c2db2ce866b9a7f26cab3))

# [14.2.0-rc.3](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.2...bitgo@14.2.0-rc.3) (2022-05-12)

**Note:** Version bump only for package bitgo

# [14.2.0-rc.1](https://github.com/BitGo/BitGoJS/compare/bitgo@14.2.0-rc.0...bitgo@14.2.0-rc.1) (2022-05-06)

### Bug Fixes

- **bitgo:** attempt to sign using fallback derivation for v1 wallet ([433620d](https://github.com/BitGo/BitGoJS/commit/433620dd18865a6fe6d8df114814a0dbcf73c416))

### Features

- **bitgo:** add verify transaction in core for Near ([1fc0f7b](https://github.com/BitGo/BitGoJS/commit/1fc0f7bf0c5beb48d241357e716e26d4ccf85afa))
- **statics:** create statics for avaxp ([34776cd](https://github.com/BitGo/BitGoJS/commit/34776cd649f424a05b33481b4a582ea4cf844325))

# [14.1.0-rc.40](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0...bitgo@14.1.0-rc.40) (2022-05-04)

### Features

- add funcs to generate and verify gpg signatures ([e08c100](https://github.com/BitGo/BitGoJS/commit/e08c1008498d40b479de1654ac88b5b1338dbfe1))
- **bitgo:** add explainTransaction implemented in account lib call in core ([81d0861](https://github.com/BitGo/BitGoJS/commit/81d08613aa35911eec6acd73376e0f2e4687deb4))
- **bitgo:** modify in near.ts on core the near constructor to support static ([de7ebec](https://github.com/BitGo/BitGoJS/commit/de7ebecbdb9c0ba97c2b3732195e40e16b385713))
- support opengpg signatures ([c07b2dc](https://github.com/BitGo/BitGoJS/commit/c07b2dc78d47042ed1edbaac1f49d29fe6971c95))

# [14.1.0-rc.38](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.37...bitgo@14.1.0-rc.38) (2022-04-20)

### Bug Fixes

- **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))

# [14.1.0-rc.37](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.36...bitgo@14.1.0-rc.37) (2022-04-19)

**Note:** Version bump only for package bitgo

# [14.1.0-rc.36](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.35...bitgo@14.1.0-rc.36) (2022-04-19)

### Bug Fixes

- **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
- getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
- v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))

# [14.1.0-rc.34](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.33...bitgo@14.1.0-rc.34) (2022-04-13)

### Bug Fixes

- whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))

# [14.1.0-rc.33](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.32...bitgo@14.1.0-rc.33) (2022-04-12)

### Bug Fixes

- **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))

# [14.1.0-rc.32](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.31...bitgo@14.1.0-rc.32) (2022-04-12)

**Note:** Version bump only for package bitgo

# [14.1.0-rc.31](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.30...bitgo@14.1.0-rc.31) (2022-04-11)

**Note:** Version bump only for package bitgo

# [14.1.0-rc.30](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.30) (2022-04-08)

### Bug Fixes

- **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
- **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
- v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))

### Features

- **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
- **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
- **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
- standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
- support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))

# [14.1.0-rc.29](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.29) (2022-04-06)

### Bug Fixes

- **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
- v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))

### Features

- **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
- **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
- support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))

# [14.1.0-rc.28](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.28) (2022-04-05)

### Bug Fixes

- **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
- v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))

### Features

- **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
- support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))

# [14.1.0-rc.27](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.27) (2022-04-05)

### Bug Fixes

- **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
- v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))

### Features

- **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
- support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))

# [14.1.0-rc.26](https://github.com/BitGo/BitGoJS/compare/bitgo@14.1.0-rc.23...bitgo@14.1.0-rc.26) (2022-04-05)

### Bug Fixes

- **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
- v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))

### Features

- **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
- support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))

## 11.4.0 (07-21-2020)

### New Features

- Add support for new ERC20 tokens (FFT, IVO, LEND, UCO, XBGOLD, XEX)

### Other Changes

- Rename coin `cgld` to `celo`
- Update `@bitgo/account-lib` to version 2.0.0
- Update `@bitgo/statics` to version 5.0.0
- Use renamed `@bitgo/utxo-lib` package and update to version 1.7.1

## 11.3.0 (06-30-2020)

### New Features

- Add ability to use a custom API token when using the Etherscan API
- Implement `signTransaction`, `explainTransaction` and other functions needed for signing and recovery to `AbstractEthLikeCoin`, which unifies the logic for Ethereum forks and chains with compatible characteristics.

### Other Changes

- Update `@bitgo/account-lib` to version 1.7.0
- Update `@bitgo/statics` to version 4.3.0
- Change exported enums to be non-const

## 11.2.0 (06-15-2020)

### New Features

- Add support for new ERC20 tokens (ABT, BSX, INF, JFIN, NIAX, USG)
- Add support for `signMessage` to ETH-like coins.

### Other Changes

- Add example showing how to create a basic local backup key for BTC.
- Update `@bitgo/statics` to version 4.2.0

## 11.1.3 (06-04-2020)

### New Features

- `prod`, `test`, and `dev` environment configs now point to the corresponding app.bitgo.com URLs. The old `msProd`, `msTest`, and `msDev` environments have been deprecated and are now aliases of `prod`, `test`, and `dev` respectively.
- Add initial support for ETC, RBTC, and CGLD.

### Bug Fixes

- Allow rebuilding consolidation transactions upon approving a pending approval
- Fix bug in fanout endpoint that causes `maxNumInputsToUse` to be ignored.

### Other Changes

- Add example for consolidating Algorand from receive addresses
- Update `@bitgo/statics` to version 4.1.0
- Update `@bitgo/account-lib` to version 1.3.0

## 11.1.2 (05-20-2020)

This release fixes an build issue with bitgo@11.1.1 which caused an older version of statics to be inadvertently included in the built package available on npm.

### Other Changes

- Update `@bitgo/statics` to version 4.0.1

## 11.1.1 (05-12-2020)

### Other Changes

- Include full stack traces for `BitGoJSError` types and inheritors.
- Update `@bitgo/statics` to version 4.0.0

## 11.1.0 (05-08-2020)

### Other Changes

- Move creation of XRP wallet initialization transactions to server side in order to support the XRP DeleteableAccounts amendment.

## 11.0.3 (04-13-2020)

### Other Changes

- Update `@bitgo/account-lib` to version 1.0.3
- Fix message signing for XTZ

## 11.0.2 (04-09-2020)

### Other Changes

- Remove `@hidden` annotation from trading documentation and update to latest payload version.
- Update `@bitgo/statics` to version 3.5.0

## 11.0.1 (03-31-2020)

### Other Changes

- Update `@bitgo/statics` to version 3.4.4

## 11.0.0 (03-24-2020)

### Breaking Changes

- The `signMessage` function on coin objects has been made asynchronous. Callers of this function will have to update their code to correctly handle the returned promise.

### New Features

- Add preliminary XTZ signing support.

### Other Changes

- Update `@bitgo/account-lib` to version 1.0.2
- Update `@bitgo/statics` to version 3.4.3

## 10.0.0 (03-18-2020)

### Breaking Changes

- The `signTransaction` function on wallet objects has been made asynchronous. Callers of this function will have to update their code to correctly handle the returned promise.

### New Features

- A new parameter `offlineVerification` has been added to the `prebuildTransaction` function on wallet objects. When set to `true`, additional data useful for offline transaction verification will be fetched along with the unsigned transaction.

### Bug Fixes

- Replace bitcoin average with coingecko for retrieving market data in offline recovery scenarios.
- Fix incorrect type check on `username` and `password` parameters in `preprocessAuthenticationParams`.

### Other Changes

- Update `@bitgo/account-lib` to version 1.0.1

## 9.6.2 (03-12-2020)

### Other Changes

- Update `@bitgo/statics` to version 3.4.1

## 9.6.1 (03-10-2020)

### Other Changes

- Increase EOS recovery transaction expiration time from 1 hour to 8 hours.
- Update `@bitgo/statics` to version 3.4.1

## 9.6.0 (03-03-2020)

### New Features

- Add support for building consolidation transactions for account based coins via the new wallet methods `buildAccountConsolidation`, `sendAccountConsolidation`, and `sendAccountConsolidations` (for bulk consolidations).

### Other Changes

- Update `@bitgo/statics` to version 3.4.0

## 9.5.3 (02-14-2020)

### Other Changes

- Update `@bitgo/statics` to version 3.3.0

## 9.5.2 (02-11-2020)

### Bug Fixes

- Recreate XLM integration test wallets following quarterly XLM testnet reset.

### Other Changes

- Update `@bitgo/statics` to version 3.2.0

## 9.5.1 (02-04-2020)

### Bug Fixes

- Add missing properties `redeemScript` and `witnessScript` to typescript interface `SignTransactionOptions`.

### Other Changes

- Update `@bitgo/statics` to version 3.1.1

## 9.5.0 (01-29-2020)

### Bug Fixes

- Remove usage of deprecated bufferutils function `bufferutils.reverse`.

### Other Changes

- Update `@bitgo/statics` to version 3.1.0

## 9.4.1 (01-21-2020)

### Bug Fixes

- Fix incorrect aliasing of interface `TransactionExplanation` in Algorand implementation.

### Other Changes

- Update `@bitgo/statics` to version 3.0.1

## 9.4.0 (01-15-2020)

### New Features

- Allow creation of random EOS addresses.
- Lock transactions to next block to discourage fee sniping.

### Other Changes

- Update `@bitgo/statics` to version 3.0.0

## 9.3.0 (12-17-2019)

### New Features

- Return key registration data for Algorand's `explainTransaction()`

### Bug Fixes

- Fix circular json serialization error when using `accelerateTransaction`
- Filter out duplicate addresses when doing address lookups for cross chain recoveries
- Allow EOS addresses to begin with a number
- Properly deserialize EOS staking transactions
- Ensure `Error.captureStackTrace` is defined before using, as this is not standard and only available in V8-based Javascript runtimes.

### Other Changes

- Improve the `DEVELOPERS.md` document, which helps to onboard new developers who want to work on the BitGo SDK itself.
- Add a basic GitHub issue template

## 9.2.0 (12-10-2019)

### Other Changes

- Update `bitgo-utxo-lib` to version 1.7.0 for new ZCash chain parameters
- Check for wrapped segwit unspents in express v1 integration test

## 9.1.0 (12-04-2019)

### New Features

- Use BitGo Stellar Federation proxy for Stellar Federation lookups

### Bug Fixes

- Reject hop params for ERC20 token transaction builds, as these do not make sense

## 9.0.1 (11-27-2019)

### Bug Fixes

- Fix TRON recovery transaction object format

### Other Changes

- Include recovery amount for TRON recovery transactions

## 9.0.0 (11-20-2019)

### Breaking Changes

- Support for Node 6 has been dropped. Node 8 is now the oldest supported version.

### New Features

- Partial support for recoveries of TRON wallets

### Other Changes

- Remove deprecated v1 examples
- Update Javascript and Typescript examples
- Remove node 6 and node 11 from Drone CI

## 8.5.3 (12-17-2019)

### New Features

- Backported from 9.3.0: Return key registration data for Algorand's `explainTransaction()`

## 8.5.2 (11-13-2019)

### Bug Fixes

- Unify TRON keycard key format with other coins

## 8.5.1 (11-08-2019)

### Bug Fixes

- If given, pass seed to TRON account generation utility function provided by `bitgo-account-lib`

### Other Changes

- Resolve dependency `handlebars` to version 4.5.0
- Update dependency `bitgo-account-lib` to version 0.1.5

## 8.5.0 (11-06-2019)

### New Features

- Enable usage of new Unspent Reservation system when building transactions. Using this feature allows a transaction to temporarily have an exclusive right to spend a one or more UTXO(s). This can help prevent unspent not found errors when sending interleaved transactions.
- Allow signing TRON transactions with a raw extended private key.
- Allow explaining a TRON transaction from the raw transaction hex using `explainTransaction()`

### Bug Fixes

- Remove unimplemented and unnecessary override of `deriveKeyWithSeed` for TRON
- Allow both base58 and hex addresses for TRON
- Fix number of decimals for offchain Stellar
- Return fully signed TRON transaction in same format as other coins

### Other Changes

- Import `@bitgo/statics` library into BitGo SDK monorepo
- Update `bitgo-account-lib` to version 0.1.4
- Recreate Stellar integration test wallets following testnet reset
- Limit Stellar trustline transactions by using base units instead of native units
- Temporarily use node 10 in Drone pipelines instead of LTS

## 8.4.0 (10-25-2019)

### New Features

- Allow removing Stellar Trustlines from a wallet
- Add additional environment presets for new BitGo backend environments

### Bug Fixes

- Fix incorrect precedence in environment configurations

### Other Changes

- Resolve `https-proxy-agent` to version 3.0.0 for patch in `ripple-lib`
- _Unstable feature_: Add support for sending from TRON hot wallets
- Add missing options types in `Wallet` and `Wallets` classes
- Add new internal method `manageUnspents` to `Wallet`. This method combines the fanouts and consolidation implementations into a single method. _Note:_ There is no change to the public API.
- Enable more strict Typescript compilation options, update code which was not compatible

## 8.2.4 (10-18-2019)

**No changes**

## 8.2.3 (10-18-2019)

### Other Changes

- Update dependency `@bitgo/statics` to version 2.2.0

## 8.2.2 (09-27-2019)

### Bug Fixes

- Use `require()` instead of ES `import()` for dynamically importing ethereum dependencies. This was causing issues in browsers.

### Other Changes

- Resolve `handlebars` dependency to `^4.3.0` for patch in dev dependency

## 8.2.1 (09-24-2019)

### Bug Fixes

- Fix importing `ethereumjs-util` in browsers, where it was previously failing
- Fix hop transactions which need to go through a pending approval flow
- Fix two broken/flaky Ethereum and XRP tests

### Other Changes

- Allow custom env to use testnet server public key if network is testnet.
- Revert enabling batched Ethereum sends due to incompatibility in `validateTransaction`

## 8.2.0 (09-19-2019)

### New Features

- Generate and upload BitGo SDK documentation on each build run. See [here](https://bitgo-sdk-docs.s3.amazonaws.com/core/8.2.0/index.html) for an example.
- Improve `explainTransaction` so it can explain Stellar Trustline and Stellar Token transactions

### Bug Fixes

- Export all Typescript types which are part of the public API. If you find there is a type which is used in the public API but not exported, please open an issue.
- Fix incorrect implementation of `getChain` for Stellar Tokens
- Fix incorrect Content Type on documentation uploaded by Drone CI
- Fix inadvertent param rename instead of type specification, and duplicate identifier (thanks @workflow and @arigatodl)

### Other Changes

- Clean up and update all examples
- Separate JavaScript examples from Typescript examples
- Remove examples for removed v1 Ethereum code
- Improve error message displayed when optional Ethereum libraries could not be required
- _Unstable feature_: Allow for creation of TRON wallets

## 8.1.2 (09-19-2019)

### New Features

- Allow `gasLimit` param to be sent when prebuilding Ethereum transactions

### Bug Fixes

- Fix type custom type inclusion in bitgo module
- Move superagent type augmentation into `bitgo/types`

## 8.1.1 (09-11-2019)

### Bug Fixes

- Fix superagent typescript declaration augmentation
- Pass `gasLimit` when creating Ethereum transaction prebuilds

## 8.1.0

### New Features

- Use `@bitgo/statics` for ERC20 and OFC coin definitions

### Bug Fixes

- Fix bug in `isValidAddress` which would cause it to incorrectly return true for coins which don't support bech32.
- Remove deprecation markers for the following functions:
  - `verifyPassword()`
  - `generateRandomPassword()`
  - `extendToken()`

### Other Changes

- Upgrade `@bitgo/statics` to 2.0.0-rc.0
- Upgrade `bitgo-utxo-lib` to 1.6.0
- Enable `strictNullChecks` typescript compiler option
- More Typescript improvements across the project. `baseCoin.ts` and `bitgo.ts` in particular have seen much improvement.
- Fix HMAC errors when doing non-BitGo EOS recoveries

## 8.0.0

### Breaking Changes

#### Elimination of synchronous error behavior for async functions

- Previously, some async functions had strange error behavior where they would throw a synchronous error sometimes, and fail with a rejected promise other times. Which behavior you get for a given error is only really discoverable via source code inspection. Depending on how callers handled async calls and errors, this could break some callers.
- One example of a changed function is `bitgo.refreshToken()`, which previously would throw a synchronous error if the `params.refreshToken` were not provided. This function can also return a Bluebird promise, which will reject if there is a failure with the network request. If you are a caller who uses `.then()` to handle async behavior, some errors which previously required a surrounding `try`/`catch` will now fall through to a `.catch()` handler attached to the returned promise.

Perhaps an example will help clarify:

```javascript
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });

try {
  bitgo
    .refreshToken()
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

- There are several methods on the BitGo object which have been deprecated in this release. These methods lead to the version 1 wallet codebase, and is a common source of errors for new users of BitGoJS. To make it clear that these are not the functions recommended for normal usage, they have been deprecated. The complete list of newly deprecated functions is as follows:
  - `sendOTP()`
  - `reject()`
  - `verifyAddress()`
  - `blockchain()`
  - `keychains()`
  - `market()`
  - `wallets()`
  - `travelRule()`
  - `pendingApprovals()`
  - `registerPushToken()`
  - `verifyPushToken()`
  - `newWalletObject()`
  - `estimateFee()`
  - `instantGuarantee()`
  - `getBitGoFeeAddress()`
  - `getWalletAddress()`
  - `listWebhooks()`
  - `addWebhook()`
  - `removeWebhook()`
  - `getConstants()`
  - `calculateMinerFeeInfo()`

Additionally, `ethSignMsgHash` in `util.ts` has been deprecated. This will be relocated to an Ethereum specific part of the code in the future.

Direct usage of the `env` property of the BitGo object has also been deprecated. Please use `bitgo.getEnv()` as an alternative.

**Note:** We have no immediate plans to remove these functions. If you are relying on these functions, they will continue to work, but you should begin considering alternatives provided by the version 2 wallet API. If you find there is a feature gap which is preventing you from moving to the v2 wallet API, please send an email to support at bitgo dot com.

**Note:** The following functions have been incorrectly marked as deprecated in the source code, but in fact are NOT deprecated. This will be fixed in the next version of BitGoJS:

- `verifyPassword()`
- `generateRandomPassword()`
- `extendToken()`

**Note:** We may deprecate more functions, and these deprecations may be done without a major version bump. However, prior to any deprecated method being actually removed and made unavailable, a major version bump will be required.

### New Features

- Add support for ERC 20 tokens (CIX100, KOZ, AGWD)

### Bug Fixes

- Fix incorrect parameters in keycard.ts (thanks @DCRichards)

### Other Changes

- Refactor Settlement API and add function for calculating settlement fees. Note that this API is still experimental and is not yet ready for general usage.
- Update microservices authentication route format.
- Improve Typescript support in expressApp, Ethereum and ERC 20 token implementations, recovery and BitGo object.

## 7.1.1

### Other Changes

- Allow creation of wallets with custom addresses, where supported (currently only EOS supports this feature).

## 7.1.0

### New Features

- Add support for new ERC 20 tokens (TGBP)
- Support for applying second signature to ALGO transactions
- Update EOS transaction prebuild format
- Implement `isValidAddress` for Offchain Tokens

### Bug Fixes

### Other Changes

- Improve Typescript support in many coin implementations.

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

- Update contract address for ERC20 token LGO
- Add support for new ERC20 tokens (THKD, TCAD, EDN, EMX)

### Other Changes

- Add node version support policy to README
- Improve typescript support in many files, including `BaseCoin`, `Utils`, `AbstractUtxoCoin`, and several others
- Autoformat code upon commit and check code format during CI

## 6.2.0

### New Features

- Allow creating BitGo objects which use a custom Stellar Federation server URL.
- Add support for new ERC20 tokens (LEO, CREP, CBAT, CZRX, CUSDC, CDAI, CETH, VALOR).
- Update trade payload version to `1.1.1`.

### Bug Fixes

- Update to lodash@^4.17.4 for a vulnerability fix for CVE-2019-10744.
- Ensure amount is correctly passed through to server for Ethereum fee estimation
- Update ZEC block explorer used in recovery flows

### Other Changes

- Improve Typescript support in `webhooks.ts`, `internal.ts`, `common.ts`, and `environments.ts`

## 6.1.1

### Bug Fixes

- Fix issue where accepting a wallet share as a viewer would fail to correctly update the server.

## 6.1.0

### New Features

- Add support for deriving ed25519 hardened child public keys, used by XLM and other ed25519-based coins.
- Update documentation to point to new docker image for BitGo Express (`bitgo/express`). The `bitgo/express` image is now deprecated.
- Add support for new ERC20 tokens (DRPU, PRDX, TENX, ROOBEE, ORBS, VDX, SHR)

### Other Changes

- Preliminary support for EOS. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
- Validate Ethereum hop transaction signatures against static Platform HSM key instead of wallet BitGo key
- Improve Typescript support for `Wallet` and `Wallets` objects, as well as the XLM coin implementation
- Extract example keycard rendering logic out of `Wallet`

## 6.0.0

The BitGoJS SDK is being modularized! The code base has been split into two modules: `bitgo` and `express`.

`bitgo` contains the Javascript library that you get when you `require('bitgo')`.

`express` contains the source for the BitGo Express local signing server, and it uses the `bitgo` module to provide access to BitGoJS functionality over a REST interface.

The long term plan is to modularize based on each underlying coin library, so users of `bitgo` won't need to bring in many large dependencies for coins they aren't using. This may require additional major versions if breaking changes are required, but we will do as much as possible to maintain the current API of the BitGoJS SDK.

### Breaking Changes

- Users who pin a git hash of BitGoJS in their package.json will need to update their build steps, since the structure of the git repository has changed. If the desire is to simply use bitgo as a Javascript library outside a browser context, we recommend using a semantic version string instead of a git hash to specify which version should be installed. For development in a browser setting, a browser compatible bundle is now distrubuted in the package at `node_modules/bitgo/dist/browser/BitGoJS.min.js`. As an alternative to downloading the package from npm, a tarball of BitGoJS could also bundled in your application and used during install.
- `bitgo-express` is no longer bundled with the `bitgo` npm package. The recommended install instructions are now to install via the official Docker image `bitgo/express:latest`. If you aren't able to run bitgo-express via Docker, you can also install and run `bitgo-express` from the source code. See the [`bitgo-express` README](https://github.com/BitGo/BitGoJS/tree/master/modules/express#running-bitgo-express) for more information on how to install and run BitGo Express.
- For version 1 wallets, the bitcoin network by the BitGo object is no longer global, and is now determined by the bitgo object's environment when it was initialized.

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

- Preliminary support for BitGo Trading Account and Settlement APIs. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
- Preliminary support for Algorand. Please note that this API is not finalized, and is subject to API breaking changes in minor and/or patch version releases without warning.
- Add support for new ERC 20 Token (PDATA)

### Other Changes

- Overhaul how coins are loaded, in anticipation of a pluggable coin system in a future version of `bitgo`.
- Rework CI system to reduce test runtimes by running tests for each module in parallel
- Remove coin instantiation logic from BaseCoin and move methods to prototype instead of attaching to coin object instances.

## 5.4.0

### New Features

- Add support for verifying and signing Ethereum hop transactions
- Add support for new ERC 20 tokens (TIOX, SPO)

### Bug Fixes

- Remove duplicate ERC 20 token definition (AION)

## 5.3.0

### New Features

- Add support for new ERC 20 tokens (USX, EUX, PLX, CQX, KZE)

### Other Changes

- Improve test performance by making more requests in parallel when checking wallet funding
- Fix bitgo-express startup command on Windows where the shebang line is ignored

## 5.2.0

### New Features

- Add support for new ERC 20 tokens (WHT, AMN, BTU, TAUD)
- Add support for trade payload signing

### Bug Fixes

- Allow sharing "pseudo-cold" wallets where the encrypted user key is not held by BitGo.
- Correctly update matching wallet passphrases when the user login password is updated.
- Add missing filter parameters in `wallet.transfers`.

### Other Changes

- Update README to clarify package description and improve example snippets

## 5.1.1

### Bug Fixes

- Separate input signing and signature verification steps in `AbstractUtxoCoin.signTransaction`. This fixes an issue where Native Segwit inputs which were not the last input in the transaction were not being properly constructed.

## 5.1.0

### New Features

- Add support for counting the number of valid signatures on Native Segwit transaction inputs in `explainTransaction`.

### Bug Fixes

- Update `bitgo-express` startup command in README. Running directly from the cloned git repository is no longer recommended.
- Add install size and timing metrics to CI system.

### Other Changes

- Remove version 1 support for Ethereum wallets and associated tests. This functionality has been broken for some time due to the required server side routes being removed.

**V2 Ethereum wallets are unaffected**. If your Ethereum wallet was working before this change, it will continue functioning normally.

## 5.0.4

### Bug Fixes

- Fix `npm audit` failures caused by newly disclosed vulnerabilities in development dependencies `eslint`, `husky`, `lint-staged`, and `nyc`. This fix has been backported to the `bitgo@4` series as release `4.49.2`.

## 5.0.3

### Bug Fixes

- Fix unhanded error in `explainTransaction()` causing approval failures for transactions which require replay protection.

### Notes

- This version was not published to npm due to `npm audit` failures which would be present upon install. These issues were fixed in version 5.0.4, which was released on npm.

## 5.0.2

### Bug Fixes

- Readd ERC 20 token `NAS`

## 5.0.1

### Bug Fixes

- Fix incorrect import in test file that was causing errors on install and when running tests (#297)

## 4.49.2

This is a maintenance update to the `bitgo@4` major version.

### Bug Fixes

- Backport updates to dev dependencies `nyc` and `fsevents` to fix `npm audit` failures.

## 4.49.1

This is a maintenance update to the `bitgo@4` major version.

### Bug Fixes

- Update `@bitgo/unspents` to 0.5.1 for a fix for an incompatibility issue in `tsc@3.4`

## 5.0.0

- BitGoJS is now a typescript project!
  - `tsc` now runs as a prepublish step.
  - We have added type definitions to some of our coin specific files, and we will continue to add and improve on our published type information.

### Breaking Changes

- Dropped support for node versions below 6.12.3. We will be publishing a more detailed policy on node and npm version support soon.

### New Features

- Typescript
- Type information for XRP and TXRP
- Added support for new ERC 20 tokens (UPT, UPUSD, UPBTC, FET)

### Bug Fixes

- Removed duplicated transaction and address contants in favor of using `@bitgo/unspents` for equivalent contants.
- Fix error thrown when randomly generated private key starts with a zero byte which would cause message signing failures. Transaction signing is not affected.
- Fix bug which caused only the first consolidation transaction to be returned from `consolidateTransaction()` for v1 wallets instead of all transations.

### Other changes

- Updated the install instructions for BitGoJS to `npm install bitgo` instead of cloning the project directly. This has an effect on how to run `bitgo-express`. To install and run `bitgo-express`, the recommended command is `npm install -g bitgo && npm explore -g bitgo -- bin/bitgo-express`.
- Upgraded eslint to 5.15.1, which entails dropping support for development on BitGoJS on node versions below 6.14.0. If you need to develop on node 6.x, please use at least 6.14.0, and consider upgrading soon as [node 6 is scheduled to reach end-of-life on April 30, 2019](https://github.com/nodejs/Release#release-schedule). Only users of BitGoJS who are contributing source code changes are affected by this requirement. End users can continue using node versions >=6.12.3, but please upgrade soon.
- Remove karma browser testing framework. We will be revamping our browser testing in a future release.

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

| chain | type               | format | usage             |
| ----- | ------------------ | ------ | ----------------- |
| 0     | pay to script hash | base58 | External          |
| 1     | pay to script hash | base58 | Internal (change) |
| 10    | wrapped segwit     | base58 | External          |
| 11    | wrapped segwit     | base58 | Internal (change) |
| 20    | native segwit      | bech32 | External          |
| 21    | native segwit      | bech32 | Internal (change) |

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
