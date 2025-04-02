# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@2.0.0...@bitgo/sdk-coin-apt@2.0.1) (2025-04-02)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

# [2.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.10.3...@bitgo/sdk-coin-apt@2.0.0) (2025-03-28)

### Features

- **sdk-coin-apt:** send many support fungible asset ([66a935f](https://github.com/BitGo/BitGoJS/commit/66a935f78cf8154bbca09fbdd821ad8f01b098ad))
- **sdk-coin-apt:** send many: addition of recipients ([11023bd](https://github.com/BitGo/BitGoJS/commit/11023bdce766eb75db9ddd376e7e87322d5b699e))
- **sdk-coin-apt:** sendMany multiple recipients native aptos ([6efbd37](https://github.com/BitGo/BitGoJS/commit/6efbd37a4f2f0d1ea33a9c4101bfe7f5504aef6a))

### BREAKING CHANGES

- **sdk-coin-apt:** Replaced protected `recipient` field with `recipients` in Aptos transactions.

## [1.10.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.10.2...@bitgo/sdk-coin-apt@1.10.3) (2025-03-20)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.10.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.10.1...@bitgo/sdk-coin-apt@1.10.2) (2025-03-18)

### Bug Fixes

- **sdk-core:** set default multisig if empty ([e2727df](https://github.com/BitGo/BitGoJS/commit/e2727dfc89dd314a607b737e761e5eff824606af))

## [1.10.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.10.0...@bitgo/sdk-coin-apt@1.10.1) (2025-03-06)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

# [1.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.7.2...@bitgo/sdk-coin-apt@1.10.0) (2025-03-04)

### Bug Fixes

- **sdk-coin-apt:** correction 64 bit LE to two buffer of 32 bits ([2165171](https://github.com/BitGo/BitGoJS/commit/21651716d9704ffc0e66072b6bafc3e7bd996aec))
- **sdk-coin-apt:** fetch correction transaction ([a8e9db2](https://github.com/BitGo/BitGoJS/commit/a8e9db23326a680b5e78162c21d508edf00d3f07))
- **statics:** mainnet apt token registration ([88c5b19](https://github.com/BitGo/BitGoJS/commit/88c5b19f5f80e2991f9e78d6821e0e5ba87b3f04))
- **statics:** modify gas tank factor ([4c00d68](https://github.com/BitGo/BitGoJS/commit/4c00d681687c8edc061a6d048cd367240425eabf))

### Features

- **sdk-coin-apt:** recommend min gas tank balance for next 1000 txns ([74071ab](https://github.com/BitGo/BitGoJS/commit/74071aba4c0754242fc96f7334cec74edba6c73b))
- **statics:** add GasTankAccountCoin ([b031d23](https://github.com/BitGo/BitGoJS/commit/b031d234e9acc38f3244c0407715a709a8aa28ab))

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.7.2...@bitgo/sdk-coin-apt@1.9.0) (2025-02-26)

### Bug Fixes

- **sdk-coin-apt:** correction 64 bit LE to two buffer of 32 bits ([2165171](https://github.com/BitGo/BitGoJS/commit/21651716d9704ffc0e66072b6bafc3e7bd996aec))
- **sdk-coin-apt:** fetch correction transaction ([a8e9db2](https://github.com/BitGo/BitGoJS/commit/a8e9db23326a680b5e78162c21d508edf00d3f07))

### Features

- **sdk-coin-apt:** recommend min gas tank balance for next 1000 txns ([74071ab](https://github.com/BitGo/BitGoJS/commit/74071aba4c0754242fc96f7334cec74edba6c73b))
- **statics:** add GasTankAccountCoin ([b031d23](https://github.com/BitGo/BitGoJS/commit/b031d234e9acc38f3244c0407715a709a8aa28ab))

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.7.2...@bitgo/sdk-coin-apt@1.8.0) (2025-02-20)

### Bug Fixes

- **sdk-coin-apt:** correction 64 bit LE to two buffer of 32 bits ([2165171](https://github.com/BitGo/BitGoJS/commit/21651716d9704ffc0e66072b6bafc3e7bd996aec))
- **sdk-coin-apt:** fetch correction transaction ([a8e9db2](https://github.com/BitGo/BitGoJS/commit/a8e9db23326a680b5e78162c21d508edf00d3f07))

### Features

- **sdk-coin-apt:** recommend min gas tank balance for next 1000 txns ([74071ab](https://github.com/BitGo/BitGoJS/commit/74071aba4c0754242fc96f7334cec74edba6c73b))

## [1.7.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.7.1...@bitgo/sdk-coin-apt@1.7.2) (2025-02-19)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.7.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.7.0...@bitgo/sdk-coin-apt@1.7.1) (2025-02-11)

### Bug Fixes

- **sdk-coin-apt:** generate txn hash ([a70f5ac](https://github.com/BitGo/BitGoJS/commit/a70f5ace1726a3482b98eaa8ca9eb762599f0198))
- **sdk-coin-apt:** read 64 bit little endian amount ([977310b](https://github.com/BitGo/BitGoJS/commit/977310b060f75da245d395690ed4cfbffc1f3675))
- **sdk-coin-apt:** stip hex prefix ([2a1e789](https://github.com/BitGo/BitGoJS/commit/2a1e78919eedeef3b6ad2e905c258cd1e418ef9f))
- **sdk-coin-apt:** strip hex prefix from public key ([f2c44f7](https://github.com/BitGo/BitGoJS/commit/f2c44f73ebe5265f1a961c894b73171b3c297a70))
- **sdk-coin-apt:** use NoAccountAuthenticator for transaction simulation ([7ff087c](https://github.com/BitGo/BitGoJS/commit/7ff087ca104ac47b8e370c2114631754be47404f))

# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.6.0...@bitgo/sdk-coin-apt@1.7.0) (2025-02-05)

### Bug Fixes

- **sdk-coin-apt:** exporting fungible and non fungible files ([e426aeb](https://github.com/BitGo/BitGoJS/commit/e426aebbbf45f5e837e868e6eaa139505c2ab8be))

### Features

- **sdk-coin-apt:** change fungibleAddress to assetId ([3c1bd56](https://github.com/BitGo/BitGoJS/commit/3c1bd56a05e20f1fc0bc3ad69227b021c972f919))
- **sdk-coin-apt:** changing names of classes ([937b17c](https://github.com/BitGo/BitGoJS/commit/937b17cce52fdb68670577b1b8887cee586dc4e0))
- **sdk-coin-apt:** fungible asset transfer transaction ([65cbd70](https://github.com/BitGo/BitGoJS/commit/65cbd7054728d50b1bb64f6229fd8465d8ac6b97))
- **sdk-coin-apt:** legacy coin and aptos coin transfer changes ([9db8d65](https://github.com/BitGo/BitGoJS/commit/9db8d6519f3e77525f583398853e6b90f021c4e7))
- **sdk-coin-apt:** non fungible asset transaction building ([eb84c77](https://github.com/BitGo/BitGoJS/commit/eb84c774cb3e22985a161460b39ab5e52a1af339))

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.5.1...@bitgo/sdk-coin-apt@1.6.0) (2025-01-28)

### Bug Fixes

- **sdk-coin-apt:** add getter for sender pubkey ([92a23c6](https://github.com/BitGo/BitGoJS/commit/92a23c67bea9e7843f73d6375fb096c9092ed175))
- **sdk-coin-apt:** initialize fee payer address ([358822a](https://github.com/BitGo/BitGoJS/commit/358822a4bb53685755a71760ffee0bf11aa6193a))

### Features

- **sdk-coin-apt:** add Apt Token Skeleton ([596f5e5](https://github.com/BitGo/BitGoJS/commit/596f5e506c61c7b93e8b0c24b8b29441ba3062ca))
- **sdk-coin-apt:** use transfer_coins method ([0857aea](https://github.com/BitGo/BitGoJS/commit/0857aeaab78e79e041be04081d3506ae4ead0427))
- **statics:** add apt usdt token ([37224e8](https://github.com/BitGo/BitGoJS/commit/37224e89dbfb7e0173c4d5ab30ddbc3d45ea7aba))

## [1.5.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.5.0...@bitgo/sdk-coin-apt@1.5.1) (2025-01-23)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.4.1...@bitgo/sdk-coin-apt@1.5.0) (2025-01-23)

### Bug Fixes

- **sdk-coin-apt:** aptos-labs version to 1.33.1 ([e991d8b](https://github.com/BitGo/BitGoJS/commit/e991d8b795e8de830e796f7d41a1d09a091880ee))
- **sdk-coin-apt:** make transaction getFee() method public ([15433ba](https://github.com/BitGo/BitGoJS/commit/15433ba88da586bb7e289e11201fa27ae521f131))

### Features

- **sdk-coin-apt:** added logic for fee payer signing ([444b849](https://github.com/BitGo/BitGoJS/commit/444b849f01f0ebf7b24eeed01816007408bef0aa))

## [1.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.4.0...@bitgo/sdk-coin-apt@1.4.1) (2025-01-20)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.9...@bitgo/sdk-coin-apt@1.4.0) (2025-01-15)

### Features

- **sdk-coin-apt:** transaction builder for aptos ([660e37a](https://github.com/BitGo/BitGoJS/commit/660e37a52b71c586a5911b1f1cd07826a64224c1))

## [1.3.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.8...@bitgo/sdk-coin-apt@1.3.9) (2025-01-09)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.7...@bitgo/sdk-coin-apt@1.3.8) (2025-01-03)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.6...@bitgo/sdk-coin-apt@1.3.7) (2024-12-24)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.5...@bitgo/sdk-coin-apt@1.3.6) (2024-12-19)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.3...@bitgo/sdk-coin-apt@1.3.5) (2024-12-17)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.3...@bitgo/sdk-coin-apt@1.3.4) (2024-12-17)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.2...@bitgo/sdk-coin-apt@1.3.3) (2024-12-12)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.1...@bitgo/sdk-coin-apt@1.3.2) (2024-12-11)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

## [1.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.3.0...@bitgo/sdk-coin-apt@1.3.1) (2024-12-03)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.2.1...@bitgo/sdk-coin-apt@1.3.0) (2024-11-26)

### Features

- **sdk-coin-apt:** add wallet and address support ([7ac235e](https://github.com/BitGo/BitGoJS/commit/7ac235efed34c94d28ec26a6b29c77f4cf7c1285))

## [1.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-apt@1.2.0...@bitgo/sdk-coin-apt@1.2.1) (2024-11-21)

**Note:** Version bump only for package @bitgo/sdk-coin-apt

# 1.2.0 (2024-11-19)

### Features

- **sdk-coin-apt:** new coin generation, apt skeleton ([3405799](https://github.com/BitGo/BitGoJS/commit/3405799d07096829093c590bf1506bc6b93c6e68))

# 1.1.0 (2024-11-14)

### Features

- **sdk-coin-apt:** new coin generation, apt skeleton ([3405799](https://github.com/BitGo/BitGoJS/commit/3405799d07096829093c590bf1506bc6b93c6e68))
