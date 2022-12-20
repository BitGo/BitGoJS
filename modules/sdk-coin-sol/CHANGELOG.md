# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.3.1...@bitgo/sdk-coin-sol@2.3.2) (2022-12-09)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [2.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.3.0...@bitgo/sdk-coin-sol@2.3.1) (2022-12-06)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

# [2.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.2.5...@bitgo/sdk-coin-sol@2.3.0) (2022-12-01)

### Features

- **bitgo:** add api version input ([42f353f](https://github.com/BitGo/BitGoJS/commit/42f353f0b33857963d66739d34b0d0cac85e82db))
- **sdk-coin-sol:** add support for partially unstaking ([bc9680b](https://github.com/BitGo/BitGoJS/commit/bc9680b819045b89b0e8e833e3a8d90bdc302497))

## [2.2.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.2.0...@bitgo/sdk-coin-sol@2.2.5) (2022-11-29)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [2.2.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.2.0...@bitgo/sdk-coin-sol@2.2.4) (2022-11-04)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [2.2.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.2.0...@bitgo/sdk-coin-sol@2.2.2) (2022-10-27)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [2.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@2.2.0...@bitgo/sdk-coin-sol@2.2.1) (2022-10-25)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

# [2.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.5...@bitgo/sdk-coin-sol@2.2.0) (2022-10-18)

### Bug Fixes

- **account-lib:** fix sol token source address ([284cdec](https://github.com/BitGo/BitGoJS/commit/284cdec5dc2c7ccf7f27feebd900824f1ac6d2a2))
- add max transfer amount limits for sol transactions ([5fe7dd3](https://github.com/BitGo/BitGoJS/commit/5fe7dd384511586f27f7541edc4f0a70407d8175))
- add support for durable nonces for sol ata init txns ([acf7cb8](https://github.com/BitGo/BitGoJS/commit/acf7cb86c16d58c735f623b7e6df34628f25ac01))
- add support for durable nonces for Solana transactions ([ea666a9](https://github.com/BitGo/BitGoJS/commit/ea666a97f3ccecda85995d243c84709ed4c2f973))
- **sdk-coin-sol:** added missing member transferBuilderV2 ([cb47e5f](https://github.com/BitGo/BitGoJS/commit/cb47e5f26e019386d693a08a41b0c93c22c7a1e6))
- **sdk-coin-sol:** fix incorrect sender ([4515123](https://github.com/BitGo/BitGoJS/commit/4515123325491db73898c944e24431ce2bee5eae))
- **sdk-coin-sol:** fix sol deserialize incorrect feePayer ([d1557b4](https://github.com/BitGo/BitGoJS/commit/d1557b41cdd290678bb674d0fd610625601a6349))
- **sdk-coin-sol:** update validateTransaction for leading zero transfer amounts ([861fed8](https://github.com/BitGo/BitGoJS/commit/861fed8458ed491f7f57b4459f9919eac51a385f))
- **sdk-core:** eth supports tss ([c0ec96f](https://github.com/BitGo/BitGoJS/commit/c0ec96fac7c5b4131d4f32d09463a78c0e1f8900))
- **sdk-core:** tss wallet creation related bugs ([500c735](https://github.com/BitGo/BitGoJS/commit/500c73527edd902b65cfd784ea1022a21e0f6319))

### chore

- **statics:** update Sol coin name to Solana BG-52979 ([f7c36bf](https://github.com/BitGo/BitGoJS/commit/f7c36bf206330d317d39c11fa22fbdf638870d60))

### Code Refactoring

- **statics:** update sol token asset ([47260f9](https://github.com/BitGo/BitGoJS/commit/47260f9dd768ee29ce96df3abce58c3abbdb0e1b))

### Features

- **sdk-coin-near:** unsigned sweep recovery ([70d9e24](https://github.com/BitGo/BitGoJS/commit/70d9e2401166e6981c2bc5b8c7ace4b00189cfd7))
- **sdk-coin-sol:** add default value for balance edge case, need to throw error ([a72dec4](https://github.com/BitGo/BitGoJS/commit/a72dec4d40cd95058b2d44e2782702f757c136d6))
- **sdk-coin-sol:** add test for edge case of starting and ending index of 0 ([3acd73f](https://github.com/BitGo/BitGoJS/commit/3acd73fb4d2d875370ba5a4b97680bb64fd3967b))
- **sdk-coin-sol:** deserialize transferBuilderV2 tx ([4a72472](https://github.com/BitGo/BitGoJS/commit/4a724725c46c8d3472e4e41e98109f057845f3c9))
- **sdk-coin-sol:** enable Solana staking ([d3a1226](https://github.com/BitGo/BitGoJS/commit/d3a1226e4daa79bf186518c5b5d39a661741e9b0))
- **sdk-coin-sol:** fixed bug with signature path for wallet ([efcc210](https://github.com/BitGo/BitGoJS/commit/efcc210e75672f1c67a8c8699e448d7e7e44157c))
- **sdk-coin-sol:** implement transferBuilderV2 ([26bc306](https://github.com/BitGo/BitGoJS/commit/26bc30616ad0b4d5a81e6bd1665fd3b61ee97cf0))
- **sdk-coin-sol:** implemented recover function for solana ([f043033](https://github.com/BitGo/BitGoJS/commit/f0430338371c58bebb53dbc8a7cf45ce51599fc7))
- **sdk-coin-sol:** make walletpassphrase optional ([6dc65a7](https://github.com/BitGo/BitGoJS/commit/6dc65a78077430b75cd91d9dc2838fe4279f484c))
- **sdk-coin-sol:** refactor ([d6a4984](https://github.com/BitGo/BitGoJS/commit/d6a498459545b70f5a2a2b9365a14aedb4b36b52))
- **sdk-coin-sol:** refactored recover params, flow for unsigned sweep into easier format ([eb9915d](https://github.com/BitGo/BitGoJS/commit/eb9915db0b29cedeb7929a543dbb8790e1825370))
- **sdk-coin-sol:** remove unecessary ternary ([b13281b](https://github.com/BitGo/BitGoJS/commit/b13281b7a073ce6c45e2602d5edd9e384c43b899))
- **sdk-coin-sol:** removed unused unit test ([7575304](https://github.com/BitGo/BitGoJS/commit/7575304e9dad7f8fcb08940cee91a96941a8835a))
- **sdk-coin-sol:** require token enablement for solana ([cf8785e](https://github.com/BitGo/BitGoJS/commit/cf8785ede22127f838ff8747013f3b72bda58eef))
- **sdk-coin-sol:** revert unit test change to remove temp send txn ([8959312](https://github.com/BitGo/BitGoJS/commit/89593124d66c571b5178f4e413720b8d872ea61e))
- **sdk-coin-sol:** sol token multi ata init ([736318f](https://github.com/BitGo/BitGoJS/commit/736318fff36f074fa841b97f3bc0c8cd95fae001))
- **sdk-coin-sol:** unsigned sweep recovery flow, unit tests ([dcfcebe](https://github.com/BitGo/BitGoJS/commit/dcfcebeca2ea24c66841206eac78d44412259918))
- **sdk-coin-sol:** update checks for undefined, removed redundant check ([135eb5c](https://github.com/BitGo/BitGoJS/commit/135eb5cdf20289c46afba0ea9044301ad663f614))
- **sdk-coin-sol:** update naming, add edge case error handling for wallet indices ([5039b8e](https://github.com/BitGo/BitGoJS/commit/5039b8e53b5fb06e6f58e1a68644273150e41ddc))
- **sdk-coin-sol:** update naming, wallet address loop, param checking ([622853b](https://github.com/BitGo/BitGoJS/commit/622853b18c9c6ece13f7c1b9a6fd9d8e2056b222))
- **sdk-coin-sol:** update package.json ([7394cce](https://github.com/BitGo/BitGoJS/commit/7394cceb2c0e96e557b311f9c6d8455628c21a69))
- **sdk-coin-sol:** update recover to support derived wallet address ([f167e79](https://github.com/BitGo/BitGoJS/commit/f167e790a98f0f70e13aa62550305cbff3a5e861))
- **sdk-coin-sol:** updated broken unit tests, added more checks ([5338dea](https://github.com/BitGo/BitGoJS/commit/5338deabefc3cf95da94a8934d139113cbb00c63))
- **sdk-coin-sol:** updated naming for param ([77b2cf8](https://github.com/BitGo/BitGoJS/commit/77b2cf833beba576f395e62593e6ef58bab0a18f))
- **sdk-coin-sol:** updated test documentation ([0b1749a](https://github.com/BitGo/BitGoJS/commit/0b1749abf5d8f267a8768d182fd950581cf9d258))
- **sdk-coin-sol:** updated unit test to do set-up and teardown ([a7a3659](https://github.com/BitGo/BitGoJS/commit/a7a36594c507c9a200def1b16a6986aaf2fc876e))
- **sdk-coin-sol:** updated unit tests to include error/edge cases ([9aca29d](https://github.com/BitGo/BitGoJS/commit/9aca29d1e8af16e8b044eb07561636562e77c907))
- **sdk-coin-sol:** using refactored tss signature functions ([91c5cf3](https://github.com/BitGo/BitGoJS/commit/91c5cf397820fdf3a297811cb8c3800811a4a2fd))
- **sdk-coin-sol:** verifyTransaction allow native token txs ([e69f0e5](https://github.com/BitGo/BitGoJS/commit/e69f0e5fee560bf661b63d7082b2ab49e1712ebb))
- **sdk-core:** allow getting a staking wallet for any coin ([cfae0fe](https://github.com/BitGo/BitGoJS/commit/cfae0feeb14c1bcb30dad2840abd8489372bfbc8))

### BREAKING CHANGES

- **statics:** This breaks the provided token asset used for wp in bitgo-ms,
  will require to change available solana token asset in wp once this merged.
  BG-52918
- **statics:** updates coin names from `Sol` and `Testnet Sol` to `Solana` and `Testnet Solana`.
  TICKET: BG-52979

## [1.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.5...@bitgo/sdk-coin-sol@1.0.1) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [1.0.1-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.3...@bitgo/sdk-coin-sol@1.0.1-rc.5) (2022-07-19)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [1.0.1-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.3...@bitgo/sdk-coin-sol@1.0.1-rc.4) (2022-07-18)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [1.0.1-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.2...@bitgo/sdk-coin-sol@1.0.1-rc.3) (2022-07-15)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [1.0.1-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.0...@bitgo/sdk-coin-sol@1.0.1-rc.2) (2022-07-15)

**Note:** Version bump only for package @bitgo/sdk-coin-sol

## [1.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-sol@1.0.1-rc.0...@bitgo/sdk-coin-sol@1.0.1-rc.1) (2022-07-14)

**Note:** Version bump only for package @bitgo/sdk-coin-sol
