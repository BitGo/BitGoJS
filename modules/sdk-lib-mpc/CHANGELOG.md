# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
