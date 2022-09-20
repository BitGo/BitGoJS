# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.0.0-rc.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.20...@bitgo/statics@8.0.0-rc.21) (2022-09-20)


### Features

* **statics:** add solana ([b46780e](https://github.com/BitGo/BitGoJS/commit/b46780ef7188b0f4451632c2fe2c3be86cdef9a7))
* **statics:** adds new tokens ([83ebf4a](https://github.com/BitGo/BitGoJS/commit/83ebf4a65962afed6c071300d80610645f3f0be8))





# [8.0.0-rc.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.19...@bitgo/statics@8.0.0-rc.20) (2022-09-16)


### Bug Fixes

* **sdk-coin-polygon:** staking features ([41a3959](https://github.com/BitGo/BitGoJS/commit/41a3959ab737155a7c06a499fd19e9182e06863e))


### Features

* **sdk-coin-dot:** enable DOT staking ([0e9209b](https://github.com/BitGo/BitGoJS/commit/0e9209bd9c6f855cbc11e5d602253509fd0099c3))





# [8.0.0-rc.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.18...@bitgo/statics@8.0.0-rc.19) (2022-09-16)


### Features

* **sdk-coin-ada:** add cardano token config ([00fcd72](https://github.com/BitGo/BitGoJS/commit/00fcd72d5feed500d69f208254c6b61815f51a16))





# [8.0.0-rc.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.17...@bitgo/statics@8.0.0-rc.18) (2022-09-15)


### Features

* **statics:** fix decimals token CHO ([e7bb6fb](https://github.com/BitGo/BitGoJS/commit/e7bb6fba337dfe58354c535c2dc65964248d8cd7))





# [8.0.0-rc.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.16...@bitgo/statics@8.0.0-rc.17) (2022-09-14)


### Features

* **statics:** fix erc20 token ([27edf13](https://github.com/BitGo/BitGoJS/commit/27edf13dfe66962f61014821a74ed52d0922c3d3))





# [8.0.0-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.15...@bitgo/statics@8.0.0-rc.16) (2022-09-14)


### Bug Fixes

* **sdk-coin-ethw:** update chainid for EthW ([4b5339c](https://github.com/BitGo/BitGoJS/commit/4b5339c19bb17f11b9453b188e5afd35f619e749))


### Features

* **statics:** fix bpt, seth-h and reth-h tokens ([d864033](https://github.com/BitGo/BitGoJS/commit/d864033d745ba81e33efcc64b80520ab13954ca4))





# [8.0.0-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.13...@bitgo/statics@8.0.0-rc.14) (2022-09-08)


### Features

* **statics:** adds test polygon as erc20 token for goerli ([ec5ea83](https://github.com/BitGo/BitGoJS/commit/ec5ea83bb1cef8bbf045dd5c2d42bb8e17c90ff8))
* **statics:** adds test polygon as erc20 token for goerli and staking feature ([629cd1b](https://github.com/BitGo/BitGoJS/commit/629cd1b7d6889f2cda0112f6a7d7e317941ca5a9))


### BREAKING CHANGES

* **statics:** adds test polygon as erc20 token for goerli because we are deprecating kovan
BOS-556

staking feature for matic





# [8.0.0-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.12...@bitgo/statics@8.0.0-rc.13) (2022-09-07)


### Features

* add tokens to trading ([33887f7](https://github.com/BitGo/BitGoJS/commit/33887f73ca40136edaa02a2cf8bf346be63339a8))





# [8.0.0-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.11...@bitgo/statics@8.0.0-rc.12) (2022-09-06)


### chore

* **statics:** update fullname for ada coin ([39ec376](https://github.com/BitGo/BitGoJS/commit/39ec3761d013bcfec718535a6f86039a42651205))


### Features

* **sdk-coin-avaxp:** implement export tx builder ([483d9ce](https://github.com/BitGo/BitGoJS/commit/483d9ce67b75ca5eb4c1330f59820b18043cdb6c))


### BREAKING CHANGES

* **statics:** updates coin names from `ADA`to `Cardano ADA`
Ticket: BG-56343
.





# [8.0.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.10...@bitgo/statics@8.0.0-rc.11) (2022-08-26)


### Features

* **sdk-coin-bsc:** support tokens for bsc ([44d2af8](https://github.com/BitGo/BitGoJS/commit/44d2af8f3f14bc61d31e6a0b8482a68db2a7d23e))





# [8.0.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.9...@bitgo/statics@8.0.0-rc.10) (2022-08-25)


### Features

* **statics:** add testnet Polygon as ERC20 ([b0b4160](https://github.com/BitGo/BitGoJS/commit/b0b4160e2669171d65c7f589ce09f920d16e1442))





# [8.0.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.8...@bitgo/statics@8.0.0-rc.9) (2022-08-23)


### Features

* adds new tokens ([078851d](https://github.com/BitGo/BitGoJS/commit/078851dadacf9d0e18539e7757ce189ba090969d))
* **bitgo:** expose Ethw in core bitgo module ([183cda4](https://github.com/BitGo/BitGoJS/commit/183cda433f8c683722843e2c30bf46101a1cd677))
* **statics:** add ETHw statics ([f49ef42](https://github.com/BitGo/BitGoJS/commit/f49ef4233ffb788765eac5b5d20232334fbd6203))
* **statics:** added offchain tokens DAO, DENT, DEP, DFI ([c0257cf](https://github.com/BitGo/BitGoJS/commit/c0257cf86c5369f0db936acb990b3235b69dafcf))





# [8.0.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.7...@bitgo/statics@8.0.0-rc.8) (2022-08-22)


### Bug Fixes

* **sdk-coin-polygon:** update polygon token names ([8bb61cf](https://github.com/BitGo/BitGoJS/commit/8bb61cf2112a668255746366a32f8e5c8105a481))


### Features

* **statics:** add trading tokens ([4ca3558](https://github.com/BitGo/BitGoJS/commit/4ca35584ee1429d510a5bd708e3985ec5e23bda1))
* **statics:** bg-55026 enable sol staking flag ([f8b21a3](https://github.com/BitGo/BitGoJS/commit/f8b21a36a476750fc11205ffb9913bcb819e3452))


### Reverts

* Revert "chore: export AcaCoin in statics" ([a4d573e](https://github.com/BitGo/BitGoJS/commit/a4d573e816813280cf37b6b984bd2dd782c2e84d))
* Revert "feat: add acala token config" ([9085421](https://github.com/BitGo/BitGoJS/commit/90854210ae82c41224c436ab9c6e3b4a4b606d29))





# [8.0.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.6...@bitgo/statics@8.0.0-rc.7) (2022-08-17)


### Features

* **sdk-coin-polygon:** support tokens ([8870307](https://github.com/BitGo/BitGoJS/commit/8870307b63f460031019aecf30c60df4f2c0a112))





# [8.0.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.5...@bitgo/statics@8.0.0-rc.6) (2022-08-15)


### Bug Fixes

* **statics:** fix terc tokens to use goerli network ([024483d](https://github.com/BitGo/BitGoJS/commit/024483d3892d6ea05b11e63bb86dfdd0a1fe715a))





# [8.0.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.4...@bitgo/statics@8.0.0-rc.5) (2022-08-10)


### Features

* add acala token config ([dd4739f](https://github.com/BitGo/BitGoJS/commit/dd4739f94ebeb199069a63712e4e9f83bba61907))
* **statics:** add ERC20 tokens ([7d800f0](https://github.com/BitGo/BitGoJS/commit/7d800f0fe6e7a5da6e8e71030f5584e7df2965d5))
* **statics:** adding tokens for trading ([1241a66](https://github.com/BitGo/BitGoJS/commit/1241a66a9cc280399ac8f28a5bb840c52bb0009f))


### BREAKING CHANGES

* **statics:** modfiy symbol 'seth-h' to 'Staked ETH Harbour' and ofcholo to ocfhot
BG-53319





# [8.0.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.1...@bitgo/statics@8.0.0-rc.2) (2022-08-02)


### Code Refactoring

* **statics:** update sol token asset ([47260f9](https://github.com/BitGo/BitGoJS/commit/47260f9dd768ee29ce96df3abce58c3abbdb0e1b))


### BREAKING CHANGES

* **statics:** This breaks the provided token asset used for wp in bitgo-ms,
will require to change available solana token asset in wp once this merged.
BG-52918





# [8.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@8.0.0-rc.0...@bitgo/statics@8.0.0-rc.1) (2022-07-27)


### Features

* **statics:** add prime tokens ofc ([308bdab](https://github.com/BitGo/BitGoJS/commit/308bdab2cd9ad0738b3dac173dabaa1cd9b3b74c))





# [8.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.1.0...@bitgo/statics@8.0.0-rc.0) (2022-07-26)


### chore

* **statics:** update Sol coin name to Solana BG-52979 ([f7c36bf](https://github.com/BitGo/BitGoJS/commit/f7c36bf206330d317d39c11fa22fbdf638870d60))


### Features

* **sdk-coin-bsc:** create bsc module ([b55ca71](https://github.com/BitGo/BitGoJS/commit/b55ca7173e27ee2d75d342b6706698769f11734f))
* **statics:** add coin feature for NEAR ([cf1a2f2](https://github.com/BitGo/BitGoJS/commit/cf1a2f278124813bcae33c6e141ceba6920e823e))
* **statics:** add new tokens ([db11934](https://github.com/BitGo/BitGoJS/commit/db119349da8385784074b6cbf56879c0899e2471))
* **statics:** add ofc for near ([4ecde82](https://github.com/BitGo/BitGoJS/commit/4ecde82919019aa8bdacbe7958acb8ec6a5bf50f))


### BREAKING CHANGES

* **statics:** updates coin names from `Sol` and `Testnet Sol` to `Solana` and `Testnet Solana`.
TICKET: BG-52979





# [7.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.1.0-rc.0...@bitgo/statics@7.1.0) (2022-07-21)

**Note:** Version bump only for package @bitgo/statics





# [7.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0...@bitgo/statics@7.1.0-rc.0) (2022-07-20)


### Features

* **statics:** add acala to statics ([f30b2f5](https://github.com/BitGo/BitGoJS/commit/f30b2f58443efe5a992469a377ebfce1680f2c08))





# [7.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0-rc.4...@bitgo/statics@7.0.0) (2022-07-19)

**Note:** Version bump only for package @bitgo/statics





# [7.0.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0-rc.2...@bitgo/statics@7.0.0-rc.4) (2022-07-19)

**Note:** Version bump only for package @bitgo/statics

# [7.0.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0-rc.2...@bitgo/statics@7.0.0-rc.4) (2022-07-19)

### Features

- **statics:** add toekn MWT ([1bd223d](https://github.com/BitGo/BitGoJS/commit/1bd223d4e0bf24544c57b8f7023a46135f46a632))
- **statics:** remove 'kind' parameter from FIAT factory and FiatCoin class ([ace31ac](https://github.com/BitGo/BitGoJS/commit/ace31acbb43e1e1f04798f398af28ca8e8aadfc6))

# [7.0.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0-rc.2...@bitgo/statics@7.0.0-rc.3) (2022-07-18)

### Features

- **statics:** add toekn MWT ([1bd223d](https://github.com/BitGo/BitGoJS/commit/1bd223d4e0bf24544c57b8f7023a46135f46a632))

# [7.0.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0-rc.0...@bitgo/statics@7.0.0-rc.2) (2022-07-15)

### Bug Fixes

- **statics:** update avaxp network to use string instead of bigint ([f6505b7](https://github.com/BitGo/BitGoJS/commit/f6505b711e81de7d4ab0c3ee74f33ec7ab07c671))

### Reverts

- Revert "feat(statics): update terra a classic" ([ddfa942](https://github.com/BitGo/BitGoJS/commit/ddfa942ee1559e430d6ee3775724b20869a8b1ba))

### BREAKING CHANGES

- **statics:** This change could break calling code as it changes the type.

Ticket: STLX-17918

# [7.0.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@7.0.0-rc.0...@bitgo/statics@7.0.0-rc.1) (2022-07-14)

### Bug Fixes

- **statics:** update avaxp network to use string instead of bigint ([f6505b7](https://github.com/BitGo/BitGoJS/commit/f6505b711e81de7d4ab0c3ee74f33ec7ab07c671))

### BREAKING CHANGES

- **statics:** This change could break calling code as it changes the type.

Ticket: STLX-17918

# [7.0.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.24...@bitgo/statics@7.0.0-rc.0) (2022-07-11)

### Features

- **bitgo:** create skeleton for hbar tokens ([d156a51](https://github.com/BitGo/BitGoJS/commit/d156a5188fa4923142964284276431fe8a0d4267))
- **statics:** update terra a classic ([d28bf44](https://github.com/BitGo/BitGoJS/commit/d28bf4498a14be960330cc4fd531ba3acbfd1b3d))

### BREAKING CHANGES

- **statics:** We are replacing the symbol of ust to usdtc same contract

BG-51357

# [6.18.0-rc.24](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.23...@bitgo/statics@6.18.0-rc.24) (2022-07-07)

### Features

- **account-lib:** token associate transaction builder for hedera accounts ([417c720](https://github.com/BitGo/BitGoJS/commit/417c7201b55c1fc546d52d5fd4daaf9390a3c480))
- **statics:** add euroc test token ([ad64797](https://github.com/BitGo/BitGoJS/commit/ad64797757fdbda2d9816bb43fe97398476b3f53))
- **statics:** add polygon testnet contract address ([61edfa8](https://github.com/BitGo/BitGoJS/commit/61edfa8de1b883be805c4d9686716d97480c8aa2))
- **statics:** add tokens iceth and wlxt ([d2ed8dc](https://github.com/BitGo/BitGoJS/commit/d2ed8dc9ff6ba9fa14fc77132e5f887fe7006b16))
- **statics:** update prime trading tokens ([eca20c1](https://github.com/BitGo/BitGoJS/commit/eca20c119529c48620438014071d52638e5724ea))

# [6.18.0-rc.23](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.22...@bitgo/statics@6.18.0-rc.23) (2022-07-05)

### Reverts

- Revert "Revert "feat(bitgo): change the names from algo tokens"" ([ea9a761](https://github.com/BitGo/BitGoJS/commit/ea9a7619ef71de008c99fa22bab14ec7aa358db6))

# [6.18.0-rc.22](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.21...@bitgo/statics@6.18.0-rc.22) (2022-07-01)

### Features

- **statics:** add cardano ada statics ([12c7785](https://github.com/BitGo/BitGoJS/commit/12c7785ff0986edecd4055f8ed277f3fc9d1186e))

# [6.18.0-rc.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.20...@bitgo/statics@6.18.0-rc.21) (2022-06-30)

**Note:** Version bump only for package @bitgo/statics

# [6.18.0-rc.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.18...@bitgo/statics@6.18.0-rc.20) (2022-06-29)

### Reverts

- Revert "feat(bitgo): change the names from algo tokens" ([81e794b](https://github.com/BitGo/BitGoJS/commit/81e794bba02f050055452481e0b87b58e68928de))

# [6.18.0-rc.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.18...@bitgo/statics@6.18.0-rc.19) (2022-06-29)

### Reverts

- Revert "feat(bitgo): change the names from algo tokens" ([81e794b](https://github.com/BitGo/BitGoJS/commit/81e794bba02f050055452481e0b87b58e68928de))

# [6.18.0-rc.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.17...@bitgo/statics@6.18.0-rc.18) (2022-06-27)

### Features

- **statics:** tokens june pt2 ([e98a176](https://github.com/BitGo/BitGoJS/commit/e98a176b8081ac512d27530e8cf4c0200b5884d2))

# [6.18.0-rc.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.16...@bitgo/statics@6.18.0-rc.17) (2022-06-23)

**Note:** Version bump only for package @bitgo/statics

# [6.18.0-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.15...@bitgo/statics@6.18.0-rc.16) (2022-06-22)

### Features

- **bitgo:** change the names from algo tokens ([8925d4e](https://github.com/BitGo/BitGoJS/commit/8925d4e15cd973e86bc3f78ade3fa863adfde656))
- onboard solana GMT token ([e0d0e56](https://github.com/BitGo/BitGoJS/commit/e0d0e563246e7b3c339ee3121aa58f09d07750b6))

# [6.18.0-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.14...@bitgo/statics@6.18.0-rc.15) (2022-06-21)

**Note:** Version bump only for package @bitgo/statics

# [6.18.0-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.13...@bitgo/statics@6.18.0-rc.14) (2022-06-14)

### Features

- **sdk-coin-avaxp:** implemented builder for AddValidatorTx ([7cb8b2f](https://github.com/BitGo/BitGoJS/commit/7cb8b2fcaa31ff0dc165abcddd1f8383a7ecef5a))

# [6.18.0-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.12...@bitgo/statics@6.18.0-rc.13) (2022-06-13)

### Features

- **statics:** add hbar token support + added hedera usdc token ([c844536](https://github.com/BitGo/BitGoJS/commit/c84453683cdfa9c412f3825ec104e406db502b63))

# [6.18.0-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.11...@bitgo/statics@6.18.0-rc.12) (2022-06-10)

### Features

- **statics:** add TSS as a coin feature ([f8a274b](https://github.com/BitGo/BitGoJS/commit/f8a274b453da826ce37d0d02fd1ad3d656164d10))
- **statics:** tokens begin june ([3fda3e3](https://github.com/BitGo/BitGoJS/commit/3fda3e3dabccbe78b29ab92aa9f0288854c99983))

# [6.18.0-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.10...@bitgo/statics@6.18.0-rc.11) (2022-06-07)

### Bug Fixes

- **statics:** fix tsol token decimal ([3b66d7e](https://github.com/BitGo/BitGoJS/commit/3b66d7e5fa5277d63eb810b1c7b70607ce9ce663))

# [6.18.0-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.9...@bitgo/statics@6.18.0-rc.10) (2022-06-07)

### Features

- implement polygon util method, core skeleton ([562855a](https://github.com/BitGo/BitGoJS/commit/562855afea41458f9569c90914619a6d515b92c0))

# [6.18.0-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.8...@bitgo/statics@6.18.0-rc.9) (2022-06-01)

### Features

- **statics:** add tokens of end of may ([21d895d](https://github.com/BitGo/BitGoJS/commit/21d895de437600e9cdfcbc45e1f920e0065f83cb))

# [6.18.0-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.7...@bitgo/statics@6.18.0-rc.8) (2022-05-23)

### Features

- **statics:** update new wxrp ([ba6ff5d](https://github.com/BitGo/BitGoJS/commit/ba6ff5dd310f1b3738e303c58f122621481f5fb0))

# [6.18.0-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.6...@bitgo/statics@6.18.0-rc.7) (2022-05-17)

### Bug Fixes

- **statics:** remove bn.js dependency ([d473aa1](https://github.com/BitGo/BitGoJS/commit/d473aa1958ee405c35d4e86ed520082fd5cb64b1))

### Features

- **statics:** add fly coin ([4ee0b05](https://github.com/BitGo/BitGoJS/commit/4ee0b0556a3358999fe5f9986882ca3e2389038c))
- **statics:** add polygon coin config ([fc7f9b3](https://github.com/BitGo/BitGoJS/commit/fc7f9b3ee22849cf615ca49dc32ac2fcac687ec7))

# [6.18.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.5...@bitgo/statics@6.18.0-rc.6) (2022-05-16)

### Features

- **statics:** add fiatusd and tfiatusd coins ([1750a43](https://github.com/BitGo/BitGoJS/commit/1750a4319298a839fc7dd3f418420f26b2cdb5a0))

# [6.18.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.4...@bitgo/statics@6.18.0-rc.5) (2022-05-13)

**Note:** Version bump only for package @bitgo/statics

# [6.18.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.3...@bitgo/statics@6.18.0-rc.4) (2022-05-13)

### Features

- **statics:** create statics for dogecoin ([66e8862](https://github.com/BitGo/BitGoJS/commit/66e88626e09cf886748c2db2ce866b9a7f26cab3))

# [6.18.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.2...@bitgo/statics@6.18.0-rc.3) (2022-05-12)

### Bug Fixes

- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([e88d8b9](https://github.com/BitGo/BitGoJS/commit/e88d8b93cf24617094f8f0a892083f2e15a35019))
- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([c2f90b7](https://github.com/BitGo/BitGoJS/commit/c2f90b7e7522bd245b9f20b8fe6755b50f087815))
- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([44dcff6](https://github.com/BitGo/BitGoJS/commit/44dcff68c2b03a70094e2e744039c3cc9c7fe505))
- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([438c7cc](https://github.com/BitGo/BitGoJS/commit/438c7ccb48375ae081f39225810094b4283acb3e))
- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([64bde49](https://github.com/BitGo/BitGoJS/commit/64bde499a6ed71a015cf3baa51c2e07d3d7fbaf7))
- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([fce2d8e](https://github.com/BitGo/BitGoJS/commit/fce2d8e70bef87096fe185ebcfb4df3e391ac1d4))
- **statics:** change the display of BitGo DAI to SAI to reduce entry errors ([7b39d92](https://github.com/BitGo/BitGoJS/commit/7b39d9298a937ce1bc1bc2606bf5c87883269398))

### Features

- **statics:** cFX token deletion from bitgo wallet ([e7e32d6](https://github.com/BitGo/BitGoJS/commit/e7e32d6051aa2f2316dcd796d12b44b957f96d08))

# [6.18.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.18.0-rc.0...@bitgo/statics@6.18.0-rc.1) (2022-05-06)

### Features

- **statics:** create statics for avaxp ([34776cd](https://github.com/BitGo/BitGoJS/commit/34776cd649f424a05b33481b4a582ea4cf844325))

# [6.17.0-rc.24](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0...@bitgo/statics@6.17.0-rc.24) (2022-05-04)

### Features

- **statics:** add new tokens for may BOBA, OKB and PYR ([07d9ed2](https://github.com/BitGo/BitGoJS/commit/07d9ed2bbc82cd946cd5dd7c28d7713d16f01d05))

# [6.17.0-rc.22](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0-rc.21...@bitgo/statics@6.17.0-rc.22) (2022-04-19)

### Features

- **statics:** add april tokens ERC20 and algo token ([a0cb164](https://github.com/BitGo/BitGoJS/commit/a0cb164d01872abc47925df97ddf43c35b58c7f1))

# [6.17.0-rc.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0-rc.20...@bitgo/statics@6.17.0-rc.21) (2022-04-19)

**Note:** Version bump only for package @bitgo/statics

# [6.17.0-rc.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0-rc.18...@bitgo/statics@6.17.0-rc.19) (2022-04-12)

**Note:** Version bump only for package @bitgo/statics

# [6.17.0-rc.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0-rc.15...@bitgo/statics@6.17.0-rc.18) (2022-04-08)

### Features

- **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))

# [6.17.0-rc.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0-rc.15...@bitgo/statics@6.17.0-rc.17) (2022-04-06)

### Features

- **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))

# [6.17.0-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/statics@6.17.0-rc.15...@bitgo/statics@6.17.0-rc.16) (2022-04-05)

### Features

- **statics:** update contract nym erc20 token ([84cd360](https://github.com/BitGo/BitGoJS/commit/84cd3609a9c5533635082d22bd42eb96ff1642fc))
