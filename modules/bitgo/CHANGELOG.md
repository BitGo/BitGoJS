## [14.0.0](https://github.com/BitGo/BitGoJS/compare/bitgo@14.0.0...bitgo@14.0.0) (2022-05-02)


### Features

* **account-lib:** change Near broadcast format from base58 to base64 ([8346017](https://github.com/BitGo/BitGoJS/commit/8346017db51c5e999f6fd469e67c51f4657a2432))
* **account-lib:** support HD MPC key generation and signing ([be934d3](https://github.com/BitGo/BitGoJS/commit/be934d34fb75020d78618ef9fdf2976041346be8))
* **account-lib:** token transfer intent STLX-13307 ([7476e30](https://github.com/BitGo/BitGoJS/commit/7476e30f8e64868b2cc151115057bf899c720dd6))
* **bitgo:** add eip1559 params ([89a2aa2](https://github.com/BitGo/BitGoJS/commit/89a2aa21fb396ae5bbf0d7240c7ed3633b4c3b1e))
* **bitgo:** add emergency param to whitelist ([3e0b615](https://github.com/BitGo/BitGoJS/commit/3e0b6155c750da431ffc8062a4ccf7c0bad639f2))
* **bitgo:** add nonce in prebuild whitelisted params ([bbf4084](https://github.com/BitGo/BitGoJS/commit/bbf4084912bb0b29c048bbc192d83b1ce4bdf156))
* **bitgo:** update tss hd wallet sharing ([d416f1e](https://github.com/BitGo/BitGoJS/commit/d416f1e65794f1be2a0d908b0d2d43b5f0589355))
* **root:** implement isWalletAddress for HBAR ([dc8d5fc](https://github.com/BitGo/BitGoJS/commit/dc8d5fca2c41881d97ffab084a1e6232f9a1c426))
* standardize tss signing flow ([06c5b63](https://github.com/BitGo/BitGoJS/commit/06c5b63722274e2db1a19288fee3232b527f06cc))
* **statics:** create fiat-usdc-tusdc ([a9a1d60](https://github.com/BitGo/BitGoJS/commit/a9a1d6058da72b1b1eebeec556d2af984ec660b6))
* **statics:** support new Algo token name format ([47a1cd7](https://github.com/BitGo/BitGoJS/commit/47a1cd7a66530795f853f7d775da5a4153c975a0))
* support tss hd signing ([3479e84](https://github.com/BitGo/BitGoJS/commit/3479e84c4e2d54dc9be0d1d2438df60c8a9036fe))
* update tss key creation to support hd ([9611e5d](https://github.com/BitGo/BitGoJS/commit/9611e5dce0460d0fae691fbc90c887d3f8e720fd))
* update tss signing to support hd ([a3b3b3f](https://github.com/BitGo/BitGoJS/commit/a3b3b3fed18a462d85d11a6f0fd498edf0f699e2))


### Bug Fixes

* **bitgo:** avoid throwing errors in wallet sharing ([8433c53](https://github.com/BitGo/BitGoJS/commit/8433c537edc49a0191abc42b77be299cbecf8a11))
* **bitgo:** fix avaxctoken cannot withdraw ([a3c1dc7](https://github.com/BitGo/BitGoJS/commit/a3c1dc78a994e040df2a17b7488dae6a39090fff))
* **bitgo:** fix non native decimalPlaces ([58481b3](https://github.com/BitGo/BitGoJS/commit/58481b3e9d1354ad8c64f6ebeb2369d52b9ed79c))
* **bitgo:** fix sdk-api export ([8b92159](https://github.com/BitGo/BitGoJS/commit/8b9215966488cbe82e722cff1661909c3d1a64e9))
* **bitgo:** fix verifyTransaction for near ([9d5cf1f](https://github.com/BitGo/BitGoJS/commit/9d5cf1f3363a321363bf39cdde76a99c2eae9e6a))
* **bitgo:** send passcodeEncryptionCode to fix mpc wallet pw reset ([82d1fc9](https://github.com/BitGo/BitGoJS/commit/82d1fc97c5f95756dc01c91ec968f43a5fb74f97))
* change keyname from asset to symbol in amount ([5b23bf7](https://github.com/BitGo/BitGoJS/commit/5b23bf780adb8288336e807c45c2a745d876599d))
* **core:** add signing params for hopTx ([987bc33](https://github.com/BitGo/BitGoJS/commit/987bc3315a45e730f1576ee6ccb6191117aa20f2))
* getWallet should search v1 wallets if not found in v2 wallets ([fa2ff44](https://github.com/BitGo/BitGoJS/commit/fa2ff44e16e35da3d2838625d8bc5db2fe63bac4)), closes [#2180](https://github.com/BitGo/BitGoJS/issues/2180)
* **statics:** fix precision for ofcterc ([75e465a](https://github.com/BitGo/BitGoJS/commit/75e465ac812ea0d59b2f05af9059debdb8a472ba))
* **statics:** update base factor for dot and tdot ([fd4f086](https://github.com/BitGo/BitGoJS/commit/fd4f086c4e9542161631c6da1da9a26a409e7dd1))
* v1 get wallet ([8db1f53](https://github.com/BitGo/BitGoJS/commit/8db1f537e944bb1183bcc6a8d339fb258740b5ff))
* v1 wallet cross chain recovery ([3ff2cc3](https://github.com/BitGo/BitGoJS/commit/3ff2cc3c956d3cbb1c539d8e1f8d36de4afaa5b4))
* whitelist nonce as an intent param ([e162062](https://github.com/BitGo/BitGoJS/commit/e162062bf19ed1e31be0ea0905da4c59f7e27495))

