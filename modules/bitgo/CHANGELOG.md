# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
