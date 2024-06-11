# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [9.8.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.8.0...@bitgo/sdk-lib-mpc@9.8.1) (2024-06-11)

### Bug Fixes

- **sdk-lib-mpc:** improve mpcv2 error handling ([00a57ad](https://github.com/BitGo/BitGoJS/commit/00a57add1f505075d58acb13e8e10465b26b699b))
- **sdk-lib-mpc:** replace @noble/secp256k1 with @noble/curves ([c89064d](https://github.com/BitGo/BitGoJS/commit/c89064de0ddbe097b5ccb6caba33680da75980d9))

# [9.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.7.0...@bitgo/sdk-lib-mpc@9.8.0) (2024-05-22)

### Features

- **abstract-eth:** wrw recovery for dkls wallet ([bf374e8](https://github.com/BitGo/BitGoJS/commit/bf374e89522c9688619d9b20ed66d3873b55d75e))
- **sdk-core:** support smaller mpcv2 keycard ([63512d4](https://github.com/BitGo/BitGoJS/commit/63512d4279d012c0a151720cffb195b198d25e21))

# [9.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.6.0...@bitgo/sdk-lib-mpc@9.7.0) (2024-05-08)

### Features

- make openssl prime gen non-breaking change ([e74357f](https://github.com/BitGo/BitGoJS/commit/e74357fa7ed64721d024c45f0105f6f87731de83))
- **sdk-lib-mpc:** support mpcv1 to mpcv2 retrofit ([b54a465](https://github.com/BitGo/BitGoJS/commit/b54a46575be40a51b4791cfc082695591dfd5d14))

### Reverts

- Revert "feat(sdk-lib-mpc): use crypto module for safe prime" ([1b69c40](https://github.com/BitGo/BitGoJS/commit/1b69c4096d183e6515d77e95e775aa44b386a809))

# [9.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.5.0...@bitgo/sdk-lib-mpc@9.6.0) (2024-05-01)

### Bug Fixes

- **sdk-lib-mpc:** fix mpcv2 sig combine to pad signatures to 64 bytes ([421698d](https://github.com/BitGo/BitGoJS/commit/421698d3ccd8eaab22ba5e0989474421d11bd773))
- **sdk-lib-mpc:** fix wasm init in mpcv2 wallets ([efbe63a](https://github.com/BitGo/BitGoJS/commit/efbe63a147000f3c0b601f065b70e4fa0e71eb58))

### Features

- **sdk-core:** add MPCv2 wallet creation ([3b15e71](https://github.com/BitGo/BitGoJS/commit/3b15e715a5cdb165ce671bd216d1191170ee8980))

# [9.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.4.0...@bitgo/sdk-lib-mpc@9.5.0) (2024-04-25)

### Features

- **sdk-lib-mpc:** add derivation to verify mpcv2 signature ([672b6fb](https://github.com/BitGo/BitGoJS/commit/672b6fbcfca926b2275ec7cc4d9f5b1d5f717f42))

# [9.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.3.0...@bitgo/sdk-lib-mpc@9.4.0) (2024-04-22)

### Bug Fixes

- **sdk-lib-mpc:** fix mpcv2 commitment and signatureR serialization ([89efa0c](https://github.com/BitGo/BitGoJS/commit/89efa0c1dbcc2aa6cb587692e989a0e8a6c7a984))

### Features

- **sdk-lib-mpc:** add utility to verify dkls signatures ([eb0824d](https://github.com/BitGo/BitGoJS/commit/eb0824dfaf7e9c2c9bb85df08b2e9012d1bf657b))

# [9.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.2.0...@bitgo/sdk-lib-mpc@9.3.0) (2024-04-17)

### Features

- **sdk-lib-mpc:** add dkls utils ([3a198d4](https://github.com/BitGo/BitGoJS/commit/3a198d453c46bc9a7217c34111fae85add6f13a1))
- **sdk-lib-mpc:** combine partial signatures util support ([c7f126f](https://github.com/BitGo/BitGoJS/commit/c7f126f68f9ebfed370248daa3321fb14145c5c0))

# [9.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.1.1...@bitgo/sdk-lib-mpc@9.2.0) (2024-04-05)

### Features

- **sdk-lib-mpc:** use crypto module for safe prime ([3113e6a](https://github.com/BitGo/BitGoJS/commit/3113e6ad2e536a5c16cefa60bb318543895c8497))

## [9.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.1.0...@bitgo/sdk-lib-mpc@9.1.1) (2024-03-19)

### Bug Fixes

- **sdk-lib-mpc:** add derivation path signing tests to dkls module ([7ab038f](https://github.com/BitGo/BitGoJS/commit/7ab038f1b8e54d93d600f3be4e1aa7c1d75426c4))

# [9.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.0.1...@bitgo/sdk-lib-mpc@9.1.0) (2024-03-11)

### Features

- **sdk-lib-mpc:** support DSG Dkls primitives ([899082f](https://github.com/BitGo/BitGoJS/commit/899082f3bb99b4e8a5bcfb5bf19a20e4c40d5023))

## [9.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@9.0.0...@bitgo/sdk-lib-mpc@9.0.1) (2024-02-28)

### Bug Fixes

- **sdk-lib-mpc:** expose dkls functions from tss module ([fd1da88](https://github.com/BitGo/BitGoJS/commit/fd1da8843c63f110201f42f0b8c9c5690332dc25))

# [9.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@9.0.0) (2024-02-19)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))
- **sdk-lib-mpc:** support DKLS DKG primitives ([ccd6e66](https://github.com/BitGo/BitGoJS/commit/ccd6e660120c7a0456c1e9f2f950d8c557ec9f75))

### BREAKING CHANGES

- **sdk-lib-mpc:** moves and renames authenticated encryption utility functions to sdk-lib-mpc

# [8.32.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.32.0) (2024-01-30)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.31.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.31.0) (2024-01-26)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.30.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.30.0) (2024-01-26)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.29.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.29.0) (2024-01-25)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.28.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.28.0) (2024-01-22)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.27.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.27.0) (2024-01-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.26.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.26.0) (2024-01-03)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.25.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.25.0) (2023-12-18)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.24.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.24.0) (2023-12-12)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.23.0) (2023-12-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.22.0) (2023-12-05)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.21.0) (2023-11-28)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.20.0) (2023-11-24)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.19.0) (2023-11-17)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.18.0) (2023-11-13)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.17.0) (2023-11-13)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.16.0) (2023-11-13)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.15.0) (2023-10-20)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.14.0) (2023-10-18)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.13.0) (2023-09-25)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-core:** phase 5 of gg18 signing ([d8ab3df](https://github.com/BitGo/BitGoJS/commit/d8ab3df38c7f0dc445117f68340cd3f17dfc9a68))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.12.0) (2023-09-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.11.0) (2023-09-09)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.10.0) (2023-09-07)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.9.0) (2023-09-05)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.8.0) (2023-09-01)

### Bug Fixes

- **root:** update @types/node ([cedc1a0](https://github.com/BitGo/BitGoJS/commit/cedc1a0035e79bb42fda57bf6ac29d606242f50b))
- **sdk-lib-mpc:** fix 0 values attack on range proof ([4a689dc](https://github.com/BitGo/BitGoJS/commit/4a689dcfcf0345132e54ddfd3e8a10e2452b0997))

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.7.0) (2023-08-29)

### Features

- **sdk-core:** add getDerivationPath method for smc wallets ([e0be65f](https://github.com/BitGo/BitGoJS/commit/e0be65f4c8904be313b4f453996f86326d2005e8))
- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.5.0...@bitgo/sdk-lib-mpc@8.6.0) (2023-08-25)

### Features

- **sdk-lib-mpc:** convert interface to type ([e1c1065](https://github.com/BitGo/BitGoJS/commit/e1c1065928691a1f9d43522aeafa8751c2424d3e))
- **sdk-lib-mpc:** move ecdsa hdtree from core ([f0311a8](https://github.com/BitGo/BitGoJS/commit/f0311a8606b1a6aa82309ef7bb9a349782819c28))
- **sdk-lib-mpc:** move shamir ([42fc946](https://github.com/BitGo/BitGoJS/commit/42fc946c8a5c4a1f7a09e5a9cb6c64a0b266a2a7))
- **sdk-lib-mpc:** move types to types.ts ([cf2f482](https://github.com/BitGo/BitGoJS/commit/cf2f4821792172b1657fbcecd8886df5bacd817a))

# [8.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.4.0...@bitgo/sdk-lib-mpc@8.5.0) (2023-06-13)

### Features

- **sdk-core:** make paillier proofs mandatory ([4c62dd8](https://github.com/BitGo/BitGoJS/commit/4c62dd8bae41b0a66a4aa840c16f2cdf5abc9997))

# [8.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.3.1...@bitgo/sdk-lib-mpc@8.4.0) (2023-06-05)

### Bug Fixes

- **sdk-lib-mpc:** add retry to generateModulus fn ([95b1598](https://github.com/BitGo/BitGoJS/commit/95b1598b32743a69fea3b4cd9365216b693b6c59))
- **sdk-lib-mpc:** pallier -> paillier ([e4182d4](https://github.com/BitGo/BitGoJS/commit/e4182d4457b1fb14d0df71d7db769e61970864fe))
- **sdk-lib-mpc:** pallier -> paillier ([9d0a12d](https://github.com/BitGo/BitGoJS/commit/9d0a12dd1d2e1d6e3107f62e2757263fb2fd258e))

### Features

- **root:** add optional paillier proof plumbing ([18093bf](https://github.com/BitGo/BitGoJS/commit/18093bfc370745130958075349814d493d5a8c72))
- **sdk-core:** paillier proof user<>backup ([8c0a381](https://github.com/BitGo/BitGoJS/commit/8c0a381318be2088572e06e34c3627323d7bfe38))
- **sdk-lib-mpc:** add proof of paillier correctness ([e759a13](https://github.com/BitGo/BitGoJS/commit/e759a13ea0aaf6d88b5ca26c6c75ffa6a27819f1)), closes [#3502](https://github.com/BitGo/BitGoJS/issues/3502)
- **sdk-lib-mpc:** add tests for palierproof and utils ([7c4674b](https://github.com/BitGo/BitGoJS/commit/7c4674b430741ccb33f4b447b4efca7942ee70e7))
- **sdk-lib-mpc:** make rangeProof challenges mandatory for appendChallenge ([1f68b30](https://github.com/BitGo/BitGoJS/commit/1f68b30676966720cb1a42c039e35d3ddeea4974))
- **sdk-lib-mpc:** move randomCoPrimeLessThan to utils ([5c2f7f2](https://github.com/BitGo/BitGoJS/commit/5c2f7f233858ff695081e86f827e0e72f99c27f7))
- **sdk-lib-mpc:** optimize pallier proof prove,verify ([c1a9c1e](https://github.com/BitGo/BitGoJS/commit/c1a9c1eff5d65c89341351b9dbc5750b3e5bd4a6))

## [8.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-lib-mpc@8.3.0...@bitgo/sdk-lib-mpc@8.3.1) (2023-05-25)

**Note:** Version bump only for package @bitgo/sdk-lib-mpc

# 8.3.0 (2023-05-17)

### Features

- **sdk-lib-mpc:** init module with range proof ([bfd8368](https://github.com/BitGo/BitGoJS/commit/bfd836823f6dd7596924421b9066f5186b0df186))
