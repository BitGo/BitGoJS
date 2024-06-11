# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [9.38.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.37.0...@bitgo/utxo-lib@9.38.0) (2024-06-11)

### Features

- **utxo-lib:** is psbt-lite ([fc0642a](https://github.com/BitGo/BitGoJS/commit/fc0642a5085872514f9e6c0366a0264335afa810))

# [9.37.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.36.1...@bitgo/utxo-lib@9.37.0) (2024-05-08)

### Features

- **utxo-lib:** remove TransactionBuilder warning ([521af3e](https://github.com/BitGo/BitGoJS/commit/521af3efd4c09c1d1bb9371810ef2de0d155620a))

### Reverts

- Revert "Revert "feat(abstract-utxo): support trustless change outputs from explaintx"" ([03896f6](https://github.com/BitGo/BitGoJS/commit/03896f65ecaaa85f6a5a9be9d45012d848329938))

## [9.36.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.36.0...@bitgo/utxo-lib@9.36.1) (2024-05-01)

### Reverts

- Revert "feat(abstract-utxo): support trustless change outputs from explaintx" ([23442a9](https://github.com/BitGo/BitGoJS/commit/23442a9873ae432c1d5efee8a3b3d4c0c3a772e2))

# [9.36.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.35.0...@bitgo/utxo-lib@9.36.0) (2024-04-22)

### Bug Fixes

- **utxo-lib:** psbt clone should use valid create tx function ([c251cfb](https://github.com/BitGo/BitGoJS/commit/c251cfb9a1cf4cf8ab68aad2e0aee8d6feaf9d91))

### Features

- **abstract-utxo:** support trustless change outputs from explaintx ([445ed53](https://github.com/BitGo/BitGoJS/commit/445ed5357c24357b5f9137669551e146bf2f2e60))

# [9.35.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.35.0) (2024-04-10)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** correct logic for unsafe segwit unspent update ([a4839b9](https://github.com/BitGo/BitGoJS/commit/a4839b90cb45940cfd768115bdde2ec889a498dd))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** find psbt outputs of internal and external bitgo wallets ([5b0d259](https://github.com/BitGo/BitGoJS/commit/5b0d2592b344b4a9fdb6a2395b94d75b311abb55))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.33.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.33.0) (2024-01-30)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.32.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.32.0) (2024-01-26)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.31.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.31.0) (2024-01-26)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.30.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.30.0) (2024-01-25)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.29.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.29.0) (2024-01-22)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.28.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.28.0) (2024-01-09)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.27.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.27.0) (2024-01-03)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add sighash to replay protection update ([3cf9002](https://github.com/BitGo/BitGoJS/commit/3cf900295df95b484b17e1ae8db936c67d5859fe))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.26.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.26.0) (2023-12-18)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.25.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.25.0) (2023-12-12)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add correct sighashes to non-HD signing ([4ef66d9](https://github.com/BitGo/BitGoJS/commit/4ef66d9efd636057465034ad65561f9a032f2edc))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.24.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.24.0) (2023-12-09)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** disable warning on nonsafe sign segwit ([16a8cc4](https://github.com/BitGo/BitGoJS/commit/16a8cc43a685a11f1ebda6a5ff9d8ce6eb8c7916))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.23.0) (2023-12-05)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** parse basic info from the psbt ([d1cd4a8](https://github.com/BitGo/BitGoJS/commit/d1cd4a82432b386e52ebd783c72f3d9dddc79143))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.22.0) (2023-11-28)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.21.0) (2023-11-24)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))
- **utxo-lib:** remove p2tr sigh hash default from sig ([dc285d2](https://github.com/BitGo/BitGoJS/commit/dc285d2129cf86f413a676b0ced256c694afc2de))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.20.0) (2023-11-17)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.19.0) (2023-11-13)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.18.0) (2023-11-13)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.17.0) (2023-11-13)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** check prevout script against computed for non-taproot inputs ([c789a70](https://github.com/BitGo/BitGoJS/commit/c789a7057d34bc6592ddc29911ccf3e5a9d1d10c))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** accept isReplaceable flag while adding unspents to PSBT ([cd46d67](https://github.com/BitGo/BitGoJS/commit/cd46d670795304fa113428980b55b4c648baac8b))
- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow a custom sequenceNumber to be added in tx creation ([8753e05](https://github.com/BitGo/BitGoJS/commit/8753e0574309f4053e641ce9d6d80167a5cfb396))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** build transaction without nonWitnessUtxo when specified ([871ad91](https://github.com/BitGo/BitGoJS/commit/871ad9141ff9a2b529d1a589d6294a7c1d2c5128))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.16.0) (2023-10-20)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.15.0) (2023-10-18)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** assert p2tr sig hash type ([bc41ee6](https://github.com/BitGo/BitGoJS/commit/bc41ee6effa0e3a88d84a3e5409eb0da1042f84f))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.14.0) (2023-09-25)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.13.0) (2023-09-09)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.12.0) (2023-09-09)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.11.0) (2023-09-07)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.10.0) (2023-09-05)

### Bug Fixes

- loosen unspent type from WalletUnspent to Unspent ([340a04b](https://github.com/BitGo/BitGoJS/commit/340a04b1c3efe0ebb65285d6cfc7c9d6a22498c8))
- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.9.0) (2023-09-01)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.8.0) (2023-08-29)

### Bug Fixes

- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.7.0) (2023-08-25)

### Bug Fixes

- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

# [9.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.6.0) (2023-08-24)

### Bug Fixes

- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

### Features

- **utxo-lib:** add tests for v1 safe wallets with uncompressed ([4ac75f0](https://github.com/BitGo/BitGoJS/commit/4ac75f0031a40aa17de37f176e3493284cba4cac))
- **utxo-lib:** allow both compressed & uncompressed pubkeys ([8db0785](https://github.com/BitGo/BitGoJS/commit/8db0785ecf7e5cfa05460a12c9c6943d0df0e033))
- **utxo-lib:** remove prev tx from psbt ([69bb9a1](https://github.com/BitGo/BitGoJS/commit/69bb9a1a7bcddb685045e43113926a7a7e6169bd))

## [9.5.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.5.2) (2023-08-16)

### Bug Fixes

- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

## [9.5.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.5.0...@bitgo/utxo-lib@9.5.1) (2023-08-16)

### Bug Fixes

- **utxo-lib:** p2tr fails to check pubkey against script ([09376da](https://github.com/BitGo/BitGoJS/commit/09376da5c621ec3a1d259b1bfd32b5377f18a2f9))

# [9.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.3.0...@bitgo/utxo-lib@9.5.0) (2023-08-04)

### Bug Fixes

- **utxo-lib:** allow uncompressed pubkeys in utxo-lib ([dd46f0d](https://github.com/BitGo/BitGoJS/commit/dd46f0d9f8b721e73b9e55f598d07ecb6e4f3a62))

### Features

- **abstract-utxo:** add psbt support backup recovery ([b312a86](https://github.com/BitGo/BitGoJS/commit/b312a86091c1320b4d7a02bd1ca5c3d2056c00c6))
- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **utxo-lib:** add public key conversions b/w compressed & ([ff5c119](https://github.com/BitGo/BitGoJS/commit/ff5c11900443764b14cb1f90be916b200711086f))
- **utxo-lib:** create output scripts for legacy safe wallets ([edf5ea7](https://github.com/BitGo/BitGoJS/commit/edf5ea7ffb39e4eeda981f6871d0ebd6dd85f863))
- **utxo-lib:** extract half signed tx from psbt ([3145474](https://github.com/BitGo/BitGoJS/commit/31454748fcea6df7fbbf886937abc48b36fb9cbd))

# [9.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.3.0...@bitgo/utxo-lib@9.4.0) (2023-07-28)

### Bug Fixes

- **utxo-lib:** allow uncompressed pubkeys in utxo-lib ([dd46f0d](https://github.com/BitGo/BitGoJS/commit/dd46f0d9f8b721e73b9e55f598d07ecb6e4f3a62))

### Features

- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **utxo-lib:** add public key conversions b/w compressed & ([ff5c119](https://github.com/BitGo/BitGoJS/commit/ff5c11900443764b14cb1f90be916b200711086f))
- **utxo-lib:** create output scripts for legacy safe wallets ([edf5ea7](https://github.com/BitGo/BitGoJS/commit/edf5ea7ffb39e4eeda981f6871d0ebd6dd85f863))
- **utxo-lib:** extract half signed tx from psbt ([3145474](https://github.com/BitGo/BitGoJS/commit/31454748fcea6df7fbbf886937abc48b36fb9cbd))

# [9.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.2.0...@bitgo/utxo-lib@9.3.0) (2023-07-18)

### Features

- **utxo-lib:** add updateWalletOutputForPsbt ([72996f7](https://github.com/BitGo/BitGoJS/commit/72996f70e42e2c1be9d3e0eae821cd1c5a7525ce))
- **utxo-lib:** efficiently get output script at index ([2a2d76c](https://github.com/BitGo/BitGoJS/commit/2a2d76c9b9336d7c5a76d149ecf4d9eaf3d762d6))

# [9.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.1.1...@bitgo/utxo-lib@9.2.0) (2023-06-21)

### Bug Fixes

- **utxo-lib:** add parameter `ignoreY` to deriveKeyPair ([9bec630](https://github.com/BitGo/BitGoJS/commit/9bec6303a079c19644d626be3182ce6ecf5360fc))
- **utxo-lib:** add sighashType to PSBT inputs ([4ca668b](https://github.com/BitGo/BitGoJS/commit/4ca668bc98e82a8bde1642ee92fffbc7daf41479))
- **utxo-lib:** handle p2trMusig2 script type for default sighash ([888c083](https://github.com/BitGo/BitGoJS/commit/888c08318845b5729cd16cf79208c526f8b0bea6))
- **utxo-lib:** use deterministic keys in testutil/mock.ts ([9de9ddd](https://github.com/BitGo/BitGoJS/commit/9de9dddefc5edb6104ebb5a200d447bc0ce8feb5))

### Features

- **utxo-lib:** add extractTransaction to UtxoPsbt ([0c41982](https://github.com/BitGo/BitGoJS/commit/0c41982de5b9397e69b314272c4e0f38bb6f69c3))
- **utxo-lib:** add, use equalPublicKey in UtxoPsbt ([4bf8b78](https://github.com/BitGo/BitGoJS/commit/4bf8b78e2688e030c232d4c87e52254e3df7e093))
- **utxo-lib:** export PsbtInput, PsbtOutput from index.ts ([14fe1af](https://github.com/BitGo/BitGoJS/commit/14fe1af73f56a73281fb3c1adbe2ffa588f74958))
- **utxo-lib:** improve type signatures for `createTransactionFrom*` ([4ac347b](https://github.com/BitGo/BitGoJS/commit/4ac347b80242d738e289385b22d496f632be6aa7))

## [9.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.1.0...@bitgo/utxo-lib@9.1.1) (2023-06-13)

### Bug Fixes

- **utxo-lib:** use utxolib toOutputScript when adding outputs ([2b1480e](https://github.com/BitGo/BitGoJS/commit/2b1480e9fd4bb0addd092f79e2248b73f21caacf))

# [9.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@9.0.0...@bitgo/utxo-lib@9.1.0) (2023-06-07)

### Bug Fixes

- **utxo-lib:** correctly get indices for setMusig2NoncesInner ([0b841cf](https://github.com/BitGo/BitGoJS/commit/0b841cf8bf02adf8919f0e8366017d3b77b10a78))

### Features

- **utxo-lib:** refactor psbt input update from adding ([5f38384](https://github.com/BitGo/BitGoJS/commit/5f38384b0b9420217e608d082c35b90206054f34))

# [9.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.4.0...@bitgo/utxo-lib@9.0.0) (2023-06-05)

### Bug Fixes

- **utxo-lib:** use PsbtInput instead of UtxoPsbt ([1f73539](https://github.com/BitGo/BitGoJS/commit/1f73539409cf69fc55ab8aedb9d8873bb82bc375))

### Features

- **utxo-lib:** move getSignatureValidationArrayPsbt from WP ([6283b21](https://github.com/BitGo/BitGoJS/commit/6283b219c4a2fe0dae4854dc08ef023e0d4c75ea))

### BREAKING CHANGES

- **utxo-lib:** functions signature is changed

# [8.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.3.0...@bitgo/utxo-lib@8.4.0) (2023-05-25)

### Features

- **utxo-lib:** add utils for sdk-api support musig2 ([1104f13](https://github.com/BitGo/BitGoJS/commit/1104f13f418e50c82634c7e936ee32b041cc15ba))

# [8.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.2.0...@bitgo/utxo-lib@8.3.0) (2023-05-17)

### Bug Fixes

- **utxo-lib:** calculate signature count for psbt and tx ([1110d20](https://github.com/BitGo/BitGoJS/commit/1110d204160ff88778a2aded084dcf4fc1848930))
- **utxo-lib:** improve taproot input check ([5ab10bf](https://github.com/BitGo/BitGoJS/commit/5ab10bfbfe3248d69d669197364a0508885c0f93))
- **utxo-lib:** specify tapTweaks as xOnly for deterministic ([defda9f](https://github.com/BitGo/BitGoJS/commit/defda9f0791707c82bcea353fffde138283f3b97))
- **utxo-lib:** unwrap parseSignatureScript from try/catch ([9eed2dc](https://github.com/BitGo/BitGoJS/commit/9eed2dcdb634c55ab0a1f82808fadae760fe1f5f))
- **utxo-lib:** wrap parseSignatureScript in try/catch ([6a5c902](https://github.com/BitGo/BitGoJS/commit/6a5c9026d802a74cb0a862498c73e1c764703794))

### Features

- **utxo-lib:** verify fully signed MUSIGKP as tx ([65ce04c](https://github.com/BitGo/BitGoJS/commit/65ce04c5973c7e467d39d38f4752dffc41033c50))

# [8.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.1.0...@bitgo/utxo-lib@8.2.0) (2023-05-10)

### Bug Fixes

- **utxo-lib:** witness utxo should not be added for non-segwit PSBT input ([5921045](https://github.com/BitGo/BitGoJS/commit/59210451ff32ef6f9dea1a4d008a7a8b80c58b23))

### Features

- **utxo-lib:** add musig2 nonce at input index ([9991d3f](https://github.com/BitGo/BitGoJS/commit/9991d3ff4fbecc326c8fc67e523a5108843a0f9d))
- **utxo-lib:** migrate deterministic signing into utxopsbt ([535ba30](https://github.com/BitGo/BitGoJS/commit/535ba30e1478c6809cf255d4a45a50cfe18969e6))
- **utxo-lib:** verify fully signed musig2 tx signature ([dc8174e](https://github.com/BitGo/BitGoJS/commit/dc8174e59184818a58920cc2149fbd359c57a490))

# [8.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.0.2...@bitgo/utxo-lib@8.1.0) (2023-05-03)

### Features

- **utxo-lib:** add ease of use fns for HSM testing ([5e82bab](https://github.com/BitGo/BitGoJS/commit/5e82bab7d54b9b405c2436b8df83b436e9542852))
- **utxo-lib:** add index file for create psbt util function ([cc3e8db](https://github.com/BitGo/BitGoJS/commit/cc3e8db2440f08bc0fd7f47f3970d368d6ac05d0))
- **utxo-lib:** add test util function to create psbt ([d052beb](https://github.com/BitGo/BitGoJS/commit/d052beb6f6fa6c65be4b97ccfc61881117bdf61c))
- **utxo-lib:** deterministic sign and nonce gen for psbts ([9399291](https://github.com/BitGo/BitGoJS/commit/939929195337a6380fc6376b80b425d089de21df))
- **utxo-lib:** fix "Argument must be a Buffer" bug in the frontend ([bd0bda8](https://github.com/BitGo/BitGoJS/commit/bd0bda8cabb54dc4964619375dbf7067006134f7))
- **utxo-lib:** implement mweb parsing for ltc ([1a77f01](https://github.com/BitGo/BitGoJS/commit/1a77f01ae8f1fd8bb4bcfbf220f89294bea55ff7))
- **utxo-lib:** signature validates only with low S ([389c4f9](https://github.com/BitGo/BitGoJS/commit/389c4f969bc5c9cbbbae26c574279d7320e9cdad))
- **utxo-lib:** use chronological musig2 key order ([c63ac4e](https://github.com/BitGo/BitGoJS/commit/c63ac4e630bf5db39a32c9e2f0a446a3e6c4a6b7))

## [8.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.0.1...@bitgo/utxo-lib@8.0.2) (2023-04-25)

**Note:** Version bump only for package @bitgo/utxo-lib

## [8.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@8.0.0...@bitgo/utxo-lib@8.0.1) (2023-04-20)

### Bug Fixes

- **utxo-lib:** finalizeAllInputs finalises half signed p2tr ([c822670](https://github.com/BitGo/BitGoJS/commit/c822670ec2176a54ba9818afdae184107549488c))
- **utxo-lib:** getSignatureValidationArray throws error for unsigned ([ec3d0f6](https://github.com/BitGo/BitGoJS/commit/ec3d0f6846caba8b2f673ae69fc0a333974e3a01))

# [8.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.7.0...@bitgo/utxo-lib@8.0.0) (2023-04-13)

### Bug Fixes

- correct ecash testnet address prefix Issue: BG-3163 ([ecf0b8a](https://github.com/BitGo/BitGoJS/commit/ecf0b8a9792be1677b08da823b73ffcc5bf80c28))
- support correct ecash transaction version Issues: [#3161](https://github.com/BitGo/BitGoJS/issues/3161) re-running maint.ts Issue: BG-0 ([e95fd1c](https://github.com/BitGo/BitGoJS/commit/e95fd1c6dcf99d82fb5696a07c08a96eb907afd5))
- support correct ecash transaction version Issues: Bitgo[#3161](https://github.com/BitGo/BitGoJS/issues/3161) Issue: BG-0 ([07f1da3](https://github.com/BitGo/BitGoJS/commit/07f1da3bae47bf7ee659fae6e0011dfb85e9a225))
- support correct ecash transaction version Issues: BitGo[#3161](https://github.com/BitGo/BitGoJS/issues/3161) Issue: BG-0 ([f031824](https://github.com/BitGo/BitGoJS/commit/f031824558a0f600954583d97a9e7d5c4398825b))
- **utxo-lib:** remove default `spec` from '.mocharc.js` ([52818cc](https://github.com/BitGo/BitGoJS/commit/52818cc17cb1289082006e467f4b7b91ccbd166f))
- **utxo-lib:** remove unused parameter in `getTaprootHashForSig()` ([163ed04](https://github.com/BitGo/BitGoJS/commit/163ed041f63ce81bbb29cc27d8bf76eddbe0e000))
- **utxo-lib:** rename getScriptPathLevel to getLeafVersion ([3a0c535](https://github.com/BitGo/BitGoJS/commit/3a0c5358de13456b4f0800a9b85b0010116bb58b))

### Features

- add inscription builder class ([214eafe](https://github.com/BitGo/BitGoJS/commit/214eafe48e8d12fd5d58efac289bab33bbd46fd3))
- add support finalizeAllInputs for reveal transactions ([3b3050e](https://github.com/BitGo/BitGoJS/commit/3b3050e793a65e6af1453fb55fd1c2da0dd7446f))
- prepare and sign inscription reveal transaction ([7a1280d](https://github.com/BitGo/BitGoJS/commit/7a1280dfed15d3710198fda028722a627c5f7fb2))
- support ordinary key musig aggregation ([29a95f7](https://github.com/BitGo/BitGoJS/commit/29a95f78f3097ac2b2caf955d99b8094e752d4a6))
- **utxo-lib:** add `clone()` implementation for UtxoPsbt ([4fb4f0b](https://github.com/BitGo/BitGoJS/commit/4fb4f0b120e1ed27194ac8d3c10ffcb23def92b2))
- **utxo-lib:** add `network` property to `UtxoPsbt` ([fb6e77f](https://github.com/BitGo/BitGoJS/commit/fb6e77f7d295bca11d261ea98fc59b9c0259b688))
- **utxo-lib:** add `utxolib/src/ord` with some basic classes ([05931cf](https://github.com/BitGo/BitGoJS/commit/05931cfe887c51d6ea37bb8775f58f10d2911ff2))
- **utxo-lib:** add basic layout code for inscription txs ([261b18a](https://github.com/BitGo/BitGoJS/commit/261b18aef43ae457c252abf83dcf044ef79272df))
- **utxo-lib:** add default template parameter for UtxoPsbt ([2937364](https://github.com/BitGo/BitGoJS/commit/2937364285cc6aeb4451b0b8d14433cdd20461e8))
- **utxo-lib:** add integration test for p2trMusig2 ([fd7a43c](https://github.com/BitGo/BitGoJS/commit/fd7a43c0559ea088811a72740ef55d1d8311dc0b))
- **utxo-lib:** add SatPoint type to ord/ subdir ([058a038](https://github.com/BitGo/BitGoJS/commit/058a038d138bf31db4223d386e5268a76b2a58a0))
- **utxo-lib:** add sorted musig2 participant pub keys in PSBT ([5e2b021](https://github.com/BitGo/BitGoJS/commit/5e2b021afc492a2b4dda1989835539ee41317303))
- **utxo-lib:** add splitWithParams ([978419c](https://github.com/BitGo/BitGoJS/commit/978419cc865646338dd5e6f43bb1dda3368b3410))
- **utxo-lib:** allow `bigint` in some SatRange methods ([886a4bd](https://github.com/BitGo/BitGoJS/commit/886a4bd028ec37a13befea82738ea03a786ed578))
- **utxo-lib:** correct input index to psbt ([78899b2](https://github.com/BitGo/BitGoJS/commit/78899b258d174eb6366ef5f6b32fe7ba0aebd615))
- **utxo-lib:** create p2tr address using musig2 ([699e829](https://github.com/BitGo/BitGoJS/commit/699e8291f4a205ba0b2071c6369f2c8843b8a945))
- **utxo-lib:** create p2trMusig2 nonce using derived key ([8993c09](https://github.com/BitGo/BitGoJS/commit/8993c096cebf13d09055f1cd989c2a7f2f6993d1))
- **utxo-lib:** create p2trMusig2 nonce using derived key ([a0cd1f1](https://github.com/BitGo/BitGoJS/commit/a0cd1f1b67b4e013a53362d3e01aa8818a1a9b33))
- **utxo-lib:** enable psbt for musig2 nonce creation ([86a5d79](https://github.com/BitGo/BitGoJS/commit/86a5d790ef302e316c3a7cd96faa88b10aca3074))
- **utxo-lib:** fix for noble ecc wrapper buffer to bigint conversion ([ba58297](https://github.com/BitGo/BitGoJS/commit/ba582975d63c5a3f2584a0bd3cb12ab8a3209d7f))
- **utxo-lib:** fix p2tr prevout and output script mismatch case ([dfba435](https://github.com/BitGo/BitGoJS/commit/dfba4350be1651880d64bf281bef4bca4e0be3b3))
- **utxo-lib:** improve signature of `createTransactionFromBuffer` ([b896944](https://github.com/BitGo/BitGoJS/commit/b89694442e060cac35b3fc558dc6f87d93f74db3))
- **utxo-lib:** introduce ParsedScriptType ([3c28bbc](https://github.com/BitGo/BitGoJS/commit/3c28bbc4baada5b614ef5893301059b51b324ce2))
- **utxo-lib:** move some testutils to `src/` ([f517a26](https://github.com/BitGo/BitGoJS/commit/f517a26c525255074d4c4d5cf2ea8db2a97b0f2d))
- **utxo-lib:** new function getTaprootOutputKey ([b29ab33](https://github.com/BitGo/BitGoJS/commit/b29ab33317a261d2fd2a547bbafa41623478fbd3))
- **utxo-lib:** parse p2trMusig2 key path witness ([ecb4c31](https://github.com/BitGo/BitGoJS/commit/ecb4c3127343b613cc6ae02bc1cd971d2e032954))
- **utxo-lib:** parse psbt for p2trMusig2 ([4dff11f](https://github.com/BitGo/BitGoJS/commit/4dff11f2c411a76f9495e8cb9ba2505f7be8294d))
- **utxo-lib:** refactor p2trMusig2 psbt code ([609ea27](https://github.com/BitGo/BitGoJS/commit/609ea27621e442ed32efa5e3286a28fd49d0e1d5))
- **utxo-lib:** refactor p2trMusig2 psbt validate code ([a648600](https://github.com/BitGo/BitGoJS/commit/a6486005f87e53058e0583dac9fdad32aa3822d9))
- **utxo-lib:** refactor validation and fix sigValArray ([29a18bf](https://github.com/BitGo/BitGoJS/commit/29a18bf586ccbde403edc68151ca6c686700567d))
- **utxo-lib:** refactoring create musig2 nonce ([fc3003b](https://github.com/BitGo/BitGoJS/commit/fc3003b0720f0e6eb5f08f919e643c91f30c20d1))
- **utxo-lib:** sort public keys before musig2 key aggregation ([720105f](https://github.com/BitGo/BitGoJS/commit/720105fd90ea9e230fa382f8dd48f23f8ea549e1))
- **utxo-lib:** support p2shP2pk psbt parsing ([8e1a1cb](https://github.com/BitGo/BitGoJS/commit/8e1a1cb0668d53a5519c634f451773fa0ca7f9fe))
- **utxo-lib:** support p2trMusig2 key path finalize ([b5228fe](https://github.com/BitGo/BitGoJS/commit/b5228fe2b2372dcd3e31d9e1d4743f1e00a57e59))
- **utxo-lib:** support p2trMusig2 key path sig verification ([674ee9a](https://github.com/BitGo/BitGoJS/commit/674ee9af4f29e0bd6299d7c0534ed154dce85718))
- **utxo-lib:** support psbt to musig2 partial sign for p2tr musig2 ([9aabe94](https://github.com/BitGo/BitGoJS/commit/9aabe9488a7973819df143095ba4477c86dddfa4))
- **utxo-lib:** test p2trMusig2 psbt serialise and deserialise ([5b53c1b](https://github.com/BitGo/BitGoJS/commit/5b53c1b70607d9c8d39bc5e004240bff18e4dd09))
- **utxo-ord:** add package `utxo-ord/` ([444bd4d](https://github.com/BitGo/BitGoJS/commit/444bd4dc3a7f0cc4ca0c62b55fb8689b2250dd94))

### BREAKING CHANGES

- `ecashtest` will no longer be returned as the prefix for `networks.ecashTest`
- **utxo-lib:** changes UtxoPsbt

Issue: BG-68135

# [7.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.4.0...@bitgo/utxo-lib@7.7.0) (2023-02-16)

### Bug Fixes

- **utxo-lib:** fix UtxoPsbt (de)serialization ([f49c443](https://github.com/BitGo/BitGoJS/commit/f49c4436f193d1bbd75dddbe6f28e5e9dd872ee3))

### Features

- **utxo-lib:** sigvalarray derived from globalXpubs ([64b3f2a](https://github.com/BitGo/BitGoJS/commit/64b3f2a64f595d30bcc12225e6f2bb0ed88d1a46))
- **utxo-lib:** zcash non-segwit unspents can be signed ([5050546](https://github.com/BitGo/BitGoJS/commit/5050546cd7eaccb09c7fe0a5d70457a32148dcce))

# [7.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.4.0...@bitgo/utxo-lib@7.6.0) (2023-02-08)

### Bug Fixes

- **utxo-lib:** fix UtxoPsbt (de)serialization ([f49c443](https://github.com/BitGo/BitGoJS/commit/f49c4436f193d1bbd75dddbe6f28e5e9dd872ee3))

### Features

- **utxo-lib:** zcash non-segwit unspents can be signed ([5050546](https://github.com/BitGo/BitGoJS/commit/5050546cd7eaccb09c7fe0a5d70457a32148dcce))

# [7.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.4.0...@bitgo/utxo-lib@7.5.0) (2023-01-30)

### Bug Fixes

- **utxo-lib:** fix UtxoPsbt (de)serialization ([f49c443](https://github.com/BitGo/BitGoJS/commit/f49c4436f193d1bbd75dddbe6f28e5e9dd872ee3))

### Features

- **utxo-lib:** zcash non-segwit unspents can be signed ([5050546](https://github.com/BitGo/BitGoJS/commit/5050546cd7eaccb09c7fe0a5d70457a32148dcce))

# [7.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.3.0...@bitgo/utxo-lib@7.4.0) (2023-01-25)

### Bug Fixes

- **utxo-lib:** fix zcash psbt from buffer ([8cc3573](https://github.com/BitGo/BitGoJS/commit/8cc35737e5a3bf224c2bcfa502c0fc11d6e09873))
- **utxo-lib:** implement toHex for ZcashPsbt ([bd90435](https://github.com/BitGo/BitGoJS/commit/bd90435c27a82cd689db093d6c7d7359f3c646b5))
- **utxo-lib:** small fixes in signatureModify test ([90316d6](https://github.com/BitGo/BitGoJS/commit/90316d6dd6ea6d7490323ba3253c1fc6a67df069))

### Features

- **utxo-lib:** add replay protection unspent to psbt ([a328797](https://github.com/BitGo/BitGoJS/commit/a32879785a60eab4511a5f073d0dc9e1eccb26e3))
- **utxo-lib:** do not require previous transactions for zcash ([5253f39](https://github.com/BitGo/BitGoJS/commit/5253f39a69ccf2ad4a8dbe40c0da6cf8e6852879))

# [7.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.2.0...@bitgo/utxo-lib@7.3.0) (2022-12-23)

### Features

- **utxo-lib:** support for unsigned tx with pub scripts ([17fdc06](https://github.com/BitGo/BitGoJS/commit/17fdc06403d56bd037fdf0b926ac97bf94e8c3f9))

# [7.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.1.0...@bitgo/utxo-lib@7.2.0) (2022-12-20)

### Features

- **utxo-lib:** adding psbt parser to index ([12e1f6b](https://github.com/BitGo/BitGoJS/commit/12e1f6b552e249abfabebb3e297194b736a2052e))
- **utxo-lib:** function for bitgo psbt parsing ([0a1fda3](https://github.com/BitGo/BitGoJS/commit/0a1fda32d6b6aa6f36cb57c7138dc3d06fff4813))
- **utxo-lib:** issue with psbt taproot signing is fixed ([82d2d8b](https://github.com/BitGo/BitGoJS/commit/82d2d8b7e133f833bced8396a3ae8756bf6ba2f5))
- **utxo-lib:** make psbt taproot pub keys parsing a function ([f6cd15c](https://github.com/BitGo/BitGoJS/commit/f6cd15c2ec7e9fa690b4ee4f5fe271c8236cc684))
- **utxo-lib:** new psbt parser is used for p2tr pub key ([305c6b7](https://github.com/BitGo/BitGoJS/commit/305c6b748e59146811b799eae55836f860e7c6cb))
- **utxo-lib:** one function for transaction to psbt ([bb94dd8](https://github.com/BitGo/BitGoJS/commit/bb94dd85ca35b056f483fcfb1bb0c82ac0f44f71))

# [7.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@7.0.0...@bitgo/utxo-lib@7.1.0) (2022-12-06)

### Bug Fixes

- **utxo-lib:** hit correct function in zec psbt setup ([05ff530](https://github.com/BitGo/BitGoJS/commit/05ff530d80a1fff51e5c1aae6afc011702c03d59))
- **utxo-lib:** use network byte order for ZEC consensusBranchId ([221cb06](https://github.com/BitGo/BitGoJS/commit/221cb0611a6f0269a83dc8805dc00f611f8b8f0a))
- **utxo-lib:** ZEC PSBT version defaults ([29a2c82](https://github.com/BitGo/BitGoJS/commit/29a2c8206865ae6db4521b7c23add3ec58ae45db))

### Features

- **utxo-lib:** add psbt getSignatureValidationArray function ([480f743](https://github.com/BitGo/BitGoJS/commit/480f74337e931edc76f158dce5fd6b0431a399f7))

# [7.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@7.0.0) (2022-11-29)

### Bug Fixes

- add test paths to tsconfig.json ([68cd7e8](https://github.com/BitGo/BitGoJS/commit/68cd7e8119914fe4a78ab1f5def5490f7a493118))
- **utxo-bin:** change signature of `getNetworkName()` ([6e673c6](https://github.com/BitGo/BitGoJS/commit/6e673c60548a784cc71bdecf487249b441c1d5ea))
- **utxo-lib:** bump bitcoinjs-lib for PSBT fix ([633df05](https://github.com/BitGo/BitGoJS/commit/633df05eec6beed4b2e9ee271d3609261f816c97))
- **utxo-lib:** fix testFixtureArray ([83109e4](https://github.com/BitGo/BitGoJS/commit/83109e406320ffe771c4ba662f010422f7df8387))
- **utxo-lib:** sanitize signer.pubkey in signTaprootInput ([3ddc36c](https://github.com/BitGo/BitGoJS/commit/3ddc36c2a1b7f4070157811f218d3f82517c06fc))
- **utxo-lib:** update links in network docs ([ea47851](https://github.com/BitGo/BitGoJS/commit/ea47851142b1a511aeded55943db59090b34ea8d))

### Code Refactoring

- rename addChangeOutputToPsbt to addWalletOutputToPsbt, move ([189a129](https://github.com/BitGo/BitGoJS/commit/189a1294a947964336b7694832bd0bb5edd1752a))
- tweak names of some Unspent types ([8a43518](https://github.com/BitGo/BitGoJS/commit/8a4351897089c74caab440aa3633ab933a28a245))
- **utxo-lib:** deprecate p2pkh parsing ([21bc364](https://github.com/BitGo/BitGoJS/commit/21bc36453df30f09af66e4d8d6fa5b44a185d454))
- **utxo-lib:** remove unused props from ParsedSignatureScript ([ddc6ab7](https://github.com/BitGo/BitGoJS/commit/ddc6ab7e5c4fc7f12175d850f4ebd68d54cd509b))
- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt ([c271386](https://github.com/BitGo/BitGoJS/commit/c27138602636b563b5fa2f2d4dc710a09a597288))

### Features

- **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
- **utxo-lib:** add `getTapleafHash` method to outputScripts.ts ([cc283ca](https://github.com/BitGo/BitGoJS/commit/cc283ca54b7de260c3e9c74c5daf07cc89eefaee))
- **utxo-lib:** add method `getSignaturesWithPublicKeys` ([2e53327](https://github.com/BitGo/BitGoJS/commit/2e53327ed4f23f28840782b39e5e3f1d76a345b0))
- **utxo-lib:** add method hasWitnessData(scriptType) ([db7f5d2](https://github.com/BitGo/BitGoJS/commit/db7f5d270e47f153347569a66d4ca5bd4c5e2f88))
- **utxo-lib:** add methods fromOutput, fromOutputWithPrevTx ([77d90e2](https://github.com/BitGo/BitGoJS/commit/77d90e2ea8991a0216c52467d387fb1e4e6b642e))
- **utxo-lib:** add more precise capture groups ([dd93180](https://github.com/BitGo/BitGoJS/commit/dd93180396deb72dcccf38b08736d30ca75590ae))
- **utxo-lib:** add replay protection unspent tests to WalletUnspent ([cbcaf76](https://github.com/BitGo/BitGoJS/commit/cbcaf7605d3f505906d604dd00acbaa61f8563cc))
- **utxo-lib:** add replay protection unspent utils to wallet/util.ts ([b1188c3](https://github.com/BitGo/BitGoJS/commit/b1188c3247fe72ee679398ec0dd593793c4f7185))
- **utxo-lib:** add test for Psbt full signing ([56a767e](https://github.com/BitGo/BitGoJS/commit/56a767eb679d872338e1fbd3b3d21f552c7751e3))
- **utxo-lib:** add tests for getInputUpdate ([a0c3efc](https://github.com/BitGo/BitGoJS/commit/a0c3efc735fb475bc9b85153807e6eb2e9d73d24))
- **utxo-lib:** allow passing `prevTx` in getInputUpdate ([b1c91bc](https://github.com/BitGo/BitGoJS/commit/b1c91bcda40e4a8caed8302ff0206d3dfce85f9f))
- **utxo-lib:** allow passing `prevTx` in getPrevOutput(s) ([8df4fb6](https://github.com/BitGo/BitGoJS/commit/8df4fb65953080f01c01c6d5e045a7bce46f7b7d))
- **utxo-lib:** compute getTapleafHash only once per signature ([571241a](https://github.com/BitGo/BitGoJS/commit/571241a8104b61588ef5c2fcb25763776655dff6))
- **utxo-lib:** parse leafVersion in parseInput.ts ([854d7fc](https://github.com/BitGo/BitGoJS/commit/854d7fcc6010a784e12a952e9b4fbe9c4b9942cc))
- **utxo-lib:** parse pubkey and signature in parseP2PK ([8dc189a](https://github.com/BitGo/BitGoJS/commit/8dc189a5da5541b0860f81c2071f1f7013b4ba7a))
- **utxo-lib:** parse redeemScript, witnessScritpt ([793689d](https://github.com/BitGo/BitGoJS/commit/793689d5f16f7ae64dc7be6a8370d9764b1240a3))
- **utxo-lib:** remove dependency on `classify` in parseSignatureScript ([460ce6a](https://github.com/BitGo/BitGoJS/commit/460ce6aa2a2b9b5958910076007546807efc23c2))
- **utxo-lib:** test getInputUpdate for unsigned tx ([dbfd08a](https://github.com/BitGo/BitGoJS/commit/dbfd08a64f44a9ddd3da314068f81e6d3087cd94))
- **utxo-lib:** use MatchError instead of `undefined` in parseInput ([ac699ea](https://github.com/BitGo/BitGoJS/commit/ac699eaaa8803b549f8224d40b1d17072be168f1))

### BREAKING CHANGES

- **utxo-lib:** remove some properties of ParsedSignatureScript
  Issue: BG-57748
- **utxo-lib:** deprecate p2pkh parsing
- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt
- addChangeOutputToPsbt renamed to addWalletOutputToPsbt
- function and type rename

# [6.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@6.0.0) (2022-11-04)

### Bug Fixes

- add test paths to tsconfig.json ([68cd7e8](https://github.com/BitGo/BitGoJS/commit/68cd7e8119914fe4a78ab1f5def5490f7a493118))
- **utxo-bin:** change signature of `getNetworkName()` ([6e673c6](https://github.com/BitGo/BitGoJS/commit/6e673c60548a784cc71bdecf487249b441c1d5ea))
- **utxo-lib:** fix testFixtureArray ([83109e4](https://github.com/BitGo/BitGoJS/commit/83109e406320ffe771c4ba662f010422f7df8387))
- **utxo-lib:** update links in network docs ([ea47851](https://github.com/BitGo/BitGoJS/commit/ea47851142b1a511aeded55943db59090b34ea8d))

### Code Refactoring

- rename addChangeOutputToPsbt to addWalletOutputToPsbt, move ([189a129](https://github.com/BitGo/BitGoJS/commit/189a1294a947964336b7694832bd0bb5edd1752a))
- tweak names of some Unspent types ([8a43518](https://github.com/BitGo/BitGoJS/commit/8a4351897089c74caab440aa3633ab933a28a245))
- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt ([c271386](https://github.com/BitGo/BitGoJS/commit/c27138602636b563b5fa2f2d4dc710a09a597288))

### Features

- **root:** add ecash network configuration & use in tests ([55c6963](https://github.com/BitGo/BitGoJS/commit/55c69632de8823473880a9fc216de9191bcdfd3e))
- **utxo-lib:** add methods fromOutput, fromOutputWithPrevTx ([77d90e2](https://github.com/BitGo/BitGoJS/commit/77d90e2ea8991a0216c52467d387fb1e4e6b642e))
- **utxo-lib:** add replay protection unspent tests to WalletUnspent ([cbcaf76](https://github.com/BitGo/BitGoJS/commit/cbcaf7605d3f505906d604dd00acbaa61f8563cc))
- **utxo-lib:** add replay protection unspent utils to wallet/util.ts ([b1188c3](https://github.com/BitGo/BitGoJS/commit/b1188c3247fe72ee679398ec0dd593793c4f7185))

### BREAKING CHANGES

- **utxo-lib:** rename addToPsbt to addWalletUnspentToPsbt
- addChangeOutputToPsbt renamed to addWalletOutputToPsbt
- function and type rename

# [4.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@4.0.0) (2022-10-27)

### Code Refactoring

- tweak names of some Unspent types ([8a43518](https://github.com/BitGo/BitGoJS/commit/8a4351897089c74caab440aa3633ab933a28a245))

### BREAKING CHANGES

- function and type rename

## [3.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@3.2.0...@bitgo/utxo-lib@3.2.1) (2022-10-25)

**Note:** Version bump only for package @bitgo/utxo-lib

# [3.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.11...@bitgo/utxo-lib@3.2.0) (2022-10-18)

### Bug Fixes

- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))
- format imported files ([2ba3302](https://github.com/BitGo/BitGoJS/commit/2ba330275e2149fce0e01f5fbc61592bca7453e3))
- remove references to bitcoinjs.Network ([84c7fd9](https://github.com/BitGo/BitGoJS/commit/84c7fd9bccd71b2f7429690481dc3104d2ae0928))
- **utxo-lib:** [dash] fix fromBuffer tx type ([7469ad0](https://github.com/BitGo/BitGoJS/commit/7469ad04fdacd4064262139757974970ee9fc614))
- **utxo-lib:** [psbt] always set witness utxo ([0104b02](https://github.com/BitGo/BitGoJS/commit/0104b0286b3f74ee3adbd802b22a1b416789343e))
- **utxo-lib:** [psbt] reduce use of hackish `this.tx` ([60e2289](https://github.com/BitGo/BitGoJS/commit/60e2289b2fe91065caf9ee80604053759231c380))
- **utxo-lib:** accept psbtopts when creating a PSBT ([bb6774a](https://github.com/BitGo/BitGoJS/commit/bb6774afbcba28374136020d041f6275fe49c4f7))
- **utxo-lib:** add TODO ([805074c](https://github.com/BitGo/BitGoJS/commit/805074c21b034d542ec952890b0136db536995a1))
- **utxo-lib:** clone witness array when cloning tx ([eecfbd7](https://github.com/BitGo/BitGoJS/commit/eecfbd7b4a4a084a75ca6f5ce7db9e1e2b38263e))
- **utxo-lib:** create PSBTs with proper inner TX class ([0c537e1](https://github.com/BitGo/BitGoJS/commit/0c537e1825642feeee09b28f6929400721fa4229))
- **utxo-lib:** export {Dash,Zcash}Psbt ([c47046e](https://github.com/BitGo/BitGoJS/commit/c47046efdfa82d319b29e4fa20e5a92737268739))
- **utxo-lib:** export UtxoPsbt ([b943679](https://github.com/BitGo/BitGoJS/commit/b94367942b1ded663dffd4f4b85a159c4db54469))
- **utxo-lib:** fix lint ([24bcf05](https://github.com/BitGo/BitGoJS/commit/24bcf05b1c6502c4788f6c95b6f63c096df09898))
- **utxo-lib:** import describe/it from `parse.ts` ([5aba693](https://github.com/BitGo/BitGoJS/commit/5aba693b078faa33cd2b525fbd0c44701e771df8))
- **utxo-lib:** include all bip32 derivations for non-taproot ([ef76bf3](https://github.com/BitGo/BitGoJS/commit/ef76bf3fac1f65adfe4f7c75893d8576203371db))
- **utxo-lib:** move getValueScaled->test + rename ([c605480](https://github.com/BitGo/BitGoJS/commit/c6054802cf44096546f7e44138d7bd540b409d66))
- **utxo-lib:** pin noble-secp256k1 ([92727bf](https://github.com/BitGo/BitGoJS/commit/92727bf173aee1437f03af542ecd4e8a153a8841))
- **utxo-lib:** remove unnecessary asyncs ([a4306ed](https://github.com/BitGo/BitGoJS/commit/a4306eddcee80ff33c735b5f259506252df8bd41))
- **utxo-lib:** tx/tx builder improvements ([0a4545a](https://github.com/BitGo/BitGoJS/commit/0a4545a0889cda154bc0ee017f479278da32cb72))
- **utxo-lib:** use BitGo published ecpair dep ([02b3c31](https://github.com/BitGo/BitGoJS/commit/02b3c31c605986ab915e88984de92630b1cd4ab7))
- **utxo-lib:** use published bitcoinjs-lib ([f9a625c](https://github.com/BitGo/BitGoJS/commit/f9a625c8ec6996813356f5edcebe1e78fe4a38f4))
- **utxo-lib:** use safe version of bitcoinjs-lib ([8f2226b](https://github.com/BitGo/BitGoJS/commit/8f2226b6276fe47413759bf7462b8429d9e69f90))

### Features

- import transaction_builder, classify, etc. ([e08776e](https://github.com/BitGo/BitGoJS/commit/e08776ea8e20b50d879bf25909db31b0451bb029))
- update to work with bitcoinjs-lib@6 ([1950934](https://github.com/BitGo/BitGoJS/commit/1950934d9426385ee12b204cc7456327e4480618))
- **utxo-lib:** [psbt] separate adding input and nonWitnessUtxo ([b16855c](https://github.com/BitGo/BitGoJS/commit/b16855ce76576cdbd973083dfc817926b41ad64e))
- **utxo-lib:** Add Dash/Zcash PSBT ([990de06](https://github.com/BitGo/BitGoJS/commit/990de06a7b1f666d2cb00e2d9205c3dc8e6bced8))
- **utxo-lib:** add maximumFeeRate for PsbtOpts ([367f72c](https://github.com/BitGo/BitGoJS/commit/367f72cb6017861fdd1a141062fb973d1e7528bb))
- **utxo-lib:** add PSBT creation funcs like txbuilder ([80880a0](https://github.com/BitGo/BitGoJS/commit/80880a0469e013586e2e35b1836670c848ca8734))
- **utxo-lib:** add PSBT from transaction ([65cc050](https://github.com/BitGo/BitGoJS/commit/65cc050adbd0507c6214baa2fd2b5076b2889007))
- **utxo-lib:** add round-trip test with high-precision values ([9c2bb77](https://github.com/BitGo/BitGoJS/commit/9c2bb7785656c2c22fb23e6c3516b9b351145744))
- **utxo-lib:** add UtxoPsbt w/BitGO P2TR signing ([1f35902](https://github.com/BitGo/BitGoJS/commit/1f35902fa6348da6b0d9dc70fc1367f3119181ef))
- **utxo-lib:** addChangeOutputToPsbt ([88e37c9](https://github.com/BitGo/BitGoJS/commit/88e37c90cc1327b70a007a20db79ac2de7c9f6c8))
- **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))
- **utxo-lib:** export ECPairAPI, BIP32API ([8f960fd](https://github.com/BitGo/BitGoJS/commit/8f960fd0adc61392ad7f40e4970e069267cd6f98))
- **utxo-lib:** full 64 bit support w/ bigints ([3186934](https://github.com/BitGo/BitGoJS/commit/3186934f8af3a3d50d3b8890446008e7bee06d90))
- **utxo-lib:** return unsigned tx ([6174bd3](https://github.com/BitGo/BitGoJS/commit/6174bd33cdda0f4b9fb84ec6c961f3deb6b51f63))
- **utxo-lib:** set default version for zcash and dash ([dc5015a](https://github.com/BitGo/BitGoJS/commit/dc5015aa0dc3b283e9afef68a113fd26036d96db))
- **utxo-lib:** store consensus branch id on psbt for zcash ([e078cf3](https://github.com/BitGo/BitGoJS/commit/e078cf3227abaa1919c677474debd46fea782fa2))

### BREAKING CHANGES

- **utxo-lib:** UtxoTransaction.fromBuffer interface - new optional param `amountType` inserted
  BG-54862

## [2.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.11...@bitgo/utxo-lib@2.4.1) (2022-07-19)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.10...@bitgo/utxo-lib@2.3.0-rc.11) (2022-07-11)

### Features

- **utxo-lib:** add network configuration for DOGE ([442e7e9](https://github.com/BitGo/BitGoJS/commit/442e7e9df3acd00edde3a0512de363164a377bb5))

# [2.3.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.9...@bitgo/utxo-lib@2.3.0-rc.10) (2022-06-23)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.8...@bitgo/utxo-lib@2.3.0-rc.9) (2022-06-22)

### Bug Fixes

- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))

# [2.3.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.7...@bitgo/utxo-lib@2.3.0-rc.8) (2022-06-16)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.6...@bitgo/utxo-lib@2.3.0-rc.7) (2022-06-13)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.5...@bitgo/utxo-lib@2.3.0-rc.6) (2022-06-07)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.4...@bitgo/utxo-lib@2.3.0-rc.5) (2022-06-01)

### Bug Fixes

- **utxo-lib:** always use VERSION4_BRANCH_NU5 for zcash ([ef0692c](https://github.com/BitGo/BitGoJS/commit/ef0692c6772f6d21fce3da6cc515dc74915c3c6d))

# [2.3.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.3...@bitgo/utxo-lib@2.3.0-rc.4) (2022-05-17)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.2...@bitgo/utxo-lib@2.3.0-rc.3) (2022-05-16)

**Note:** Version bump only for package @bitgo/utxo-lib

# [2.3.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/utxo-lib@2.3.0-rc.1...@bitgo/utxo-lib@2.3.0-rc.2) (2022-05-12)

**Note:** Version bump only for package @bitgo/utxo-lib

# Changelog

## Versioning

This is a forked version of bitcoinjs-lib `3.1.1` that also contains some changes from
later upstream bitcoinjs-lib versions up to `3.3.1`.

Version `1.0.0` of bitgo-utxo-lib is roughly equivalent of bitcoinjs-lib `3.3.1`. For the a changelog up to this point please refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/CHANGELOG.md#331

This document contains the Changelog starting with release 1.8.0

## 2.0.0 (2021-09-13)

- Rewrite `bitcoinjs-lib` to be a wrapper instead of a fork. Uses minimal fork of `bitcoinjs-lib@5.2.0` as a dependency and
  re-exports most symbols verbatim. Altcoin support and some bitgo-specific methods are available at `utxolib.bitgo.*`.

## 1.9.0 (2020-01-16)

- fix(bufferutils): remove pushdata re-exports ([f48669e](https://github.com/BitGo/bitgo-utxo-lib/commit/f48669e))
- fix(bufferutils): remove varInt functions ([84851f0](https://github.com/BitGo/bitgo-utxo-lib/commit/84851f0))
- fix(networks): BIP32 constants for litecoin ([69d0244](https://github.com/BitGo/bitgo-utxo-lib/commit/69d0244))
- fix(test): use `--recursive` in coverage ([49b2a0e](https://github.com/BitGo/bitgo-utxo-lib/commit/49b2a0e))
- bitcoincash test: move to test/forks/bitcoincash ([d65a9bf](https://github.com/BitGo/bitgo-utxo-lib/commit/d65a9bf))
- feat(src/coins): add isSameCoin(Network, Network) ([e1dd2cb](https://github.com/BitGo/bitgo-utxo-lib/commit/e1dd2cb))
- Fix test/bitcoincash.test.js ([a6930c5](https://github.com/BitGo/bitgo-utxo-lib/commit/a6930c5))
- fix(src/networks.js): litecoinTest WIF prefix ([b08089a](https://github.com/BitGo/bitgo-utxo-lib/commit/b08089a))
- Replace CHANGELOG.md ([f7cbb0f](https://github.com/BitGo/bitgo-utxo-lib/commit/f7cbb0f))
- src/coins.js: add getMainnet/getTestnet ([8ddc032](https://github.com/BitGo/bitgo-utxo-lib/commit/8ddc032))
- src/coins.js: add isDash to isValidNetwork ([4827e8a](https://github.com/BitGo/bitgo-utxo-lib/commit/4827e8a))
- src/coins.js: isValidCoin -> isValidNetwork ([9556784](https://github.com/BitGo/bitgo-utxo-lib/commit/9556784))
- src/networks.js: add tests ([c9f367a](https://github.com/BitGo/bitgo-utxo-lib/commit/c9f367a))
- src/networks.js: define coin network names ([06f0b92](https://github.com/BitGo/bitgo-utxo-lib/commit/06f0b92))
- src/networks.js: fix references ([0ec6b0b](https://github.com/BitGo/bitgo-utxo-lib/commit/0ec6b0b))
- src/networks.js: reorder networks ([4e3c4ad](https://github.com/BitGo/bitgo-utxo-lib/commit/4e3c4ad))
- test/forks: rename tests ([67c0cb2](https://github.com/BitGo/bitgo-utxo-lib/commit/67c0cb2))
- Use standard naming scheme for test titles ([98c53f0](https://github.com/BitGo/bitgo-utxo-lib/commit/98c53f0))

## 1.8.0 (2020-01-09)

- Add src/bitgo/keyutil ([1bfd335](https://github.com/BitGo/bitgo-utxo-lib/commit/1bfd335))
- ECPair: simplify `fromPrivateKeyBuffer` ([288f662](https://github.com/BitGo/bitgo-utxo-lib/commit/288f662))
- ECPair: simplify `getPublicKeyBuffer` ([fdf2d22](https://github.com/BitGo/bitgo-utxo-lib/commit/fdf2d22))
- src/coins.js: add getMainnet/getTestnet ([8ddc032](https://github.com/BitGo/bitgo-utxo-lib/commit/8ddc032))
- src/coins.js: add isDash to isValidNetwork ([4827e8a](https://github.com/BitGo/bitgo-utxo-lib/commit/4827e8a))
- src/coins.js: isValidCoin -> isValidNetwork ([9556784](https://github.com/BitGo/bitgo-utxo-lib/commit/9556784))

### Deprecation Notice: ECPair functions

Commit ([1bfd335](https://github.com/BitGo/bitgo-utxo-lib/commit/1bfd335)) adds deprecation notices for two custom `ECPair` functions which are not present in upstream bitcoinjs-lib:

- `ECPair.fromPrivateKeyBuffer`: use `utxolib.bitgo.keyutil.privateKeyBufferToECPair` instead
- `ECPair.prototype.getPrivateKeyBuffer`: use `utxolib.bitgo.keyutil.privateKeyBufferFromECPair` instead

These methods will be removed in a future major version.
