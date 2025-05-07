# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.13.1...@bitgo/sdk-coin-icp@1.14.0) (2025-05-07)

### Bug Fixes

- **sdk-coin-icp:** update verifyTransaction to include signableHex parameter ([9153969](https://github.com/BitGo/BitGoJS/commit/91539695e0aab177196a9b527f7ec33e63c487fa))

### Features

- **sdk-coin-icp:** support setting ingressEnd ([a27e67d](https://github.com/BitGo/BitGoJS/commit/a27e67dc69793cbab6442f9cc9e0e57ecbf63ab6))

## [1.13.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.13.0...@bitgo/sdk-coin-icp@1.13.1) (2025-04-29)

**Note:** Version bump only for package @bitgo/sdk-coin-icp

# [1.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.12.0...@bitgo/sdk-coin-icp@1.13.0) (2025-04-25)

### Bug Fixes

- **sdk-coin-icp:** enhance hash functions to support Uint8Array in Utils class ([dbe8eea](https://github.com/BitGo/BitGoJS/commit/dbe8eeab6ce84d397ef606e20851259b3f207914))
- **sdk-coin-icp:** update cbor-x import to use index-no-eval ([6c3f6af](https://github.com/BitGo/BitGoJS/commit/6c3f6af3cadb23270db7feb00d6235058422862f))
- **sdk-coin-icp:** update from() method to use PayloadsData ([ea7b7e2](https://github.com/BitGo/BitGoJS/commit/ea7b7e2e3c8722f46db1b89e898ad9a1dea3450d))
- **sdk-coin-icp:** update protobufjs dependency to version 7.5.0 ([663b5ee](https://github.com/BitGo/BitGoJS/commit/663b5ee200fd9550d55005e68d2fc616b4ff219d))

### Features

- **sdk-coin-icp:** add protobuf definitions for message SendRequest ([b1b62c3](https://github.com/BitGo/BitGoJS/commit/b1b62c3875bada1a8f3d23c86685781163a63ff9))
- **sdk-coin-icp:** add transaction ID handling and related utilities ([59d20a8](https://github.com/BitGo/BitGoJS/commit/59d20a8f8033de6856b68f2382f431fa08afcfa2))
- **sdk-coin-icp:** implemented default memo as 0 and related changes ([cab3bcc](https://github.com/BitGo/BitGoJS/commit/cab3bcc609f0e23a73cb6cb7c24071dfa7742adf))
- **sdk-coin-icp:** replace protoDefinition with staticProtoDefinition for protobuf parsing ([34b8de0](https://github.com/BitGo/BitGoJS/commit/34b8de08e0e2b9151ad1e4b03b988ca982db9c68))

# [1.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.11.0...@bitgo/sdk-coin-icp@1.12.0) (2025-04-15)

### Bug Fixes

- **sdk-coin-icp:** validate pubkey only when set ([854b279](https://github.com/BitGo/BitGoJS/commit/854b279ec947019e868048d7f11e7632bb4e60ab))

### Features

- **sdk-coin-icp:** add missing function implementations ([5f99a06](https://github.com/BitGo/BitGoJS/commit/5f99a0693272427aae9bc49a400db8d2558860cf))
- **sdk-coin-icp:** implement getHashFunction ([22ddba1](https://github.com/BitGo/BitGoJS/commit/22ddba1aaaa2d90235d206e9264efaa5c9c2cffe))
- **sdk-coin-icp:** implement signTransaction method ([26a28aa](https://github.com/BitGo/BitGoJS/commit/26a28aaed67d5884107ca6817daf7734ebcc85ed))
- **sdk-coin-icp:** implemented recover() for WRW support ([d6bd979](https://github.com/BitGo/BitGoJS/commit/d6bd979f2a52b36a86366ce5f9d5f8e619df155f))
- **sdk-coin-icp:** make memo field optional in transaction interfaces and builders ([f2d2088](https://github.com/BitGo/BitGoJS/commit/f2d20886f67c12d53529064f0dc8192bc6643c49))

# [1.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.10.1...@bitgo/sdk-coin-icp@1.11.0) (2025-04-04)

### Features

- **sdk-coin-icp:** reduce the payload to 1 ([c6905ce](https://github.com/BitGo/BitGoJS/commit/c6905ce4b205c1c2a265b89e657f16d5b29c564d))

## [1.10.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.10.0...@bitgo/sdk-coin-icp@1.10.1) (2025-04-02)

**Note:** Version bump only for package @bitgo/sdk-coin-icp

# [1.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.9.0...@bitgo/sdk-coin-icp@1.10.0) (2025-03-28)

### Bug Fixes

- **sdk-coin-icp:** change combine method visibility from protected to public ([ff50dff](https://github.com/BitGo/BitGoJS/commit/ff50dff5222fe29fbd313909c97a3ad28043e49f))

### Features

- **sdk-coin-icp:** implement combine method for signed transaction generation ([9bf8d85](https://github.com/BitGo/BitGoJS/commit/9bf8d85a09c1f603227548d346e68905dafd3df0))
- **sdk-coin-icp:** improve transaction signature validation ([6c8151e](https://github.com/BitGo/BitGoJS/commit/6c8151e639143e840707b6d56636c451ac96f192))

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.8.0...@bitgo/sdk-coin-icp@1.9.0) (2025-03-20)

### Features

- **sdk-coin-icp:** enhance raw transaction handling ([d9402f4](https://github.com/BitGo/BitGoJS/commit/d9402f443f0cc70eb1cf95f692a6f91f91ffadb6))
- **sdk-coin-icp:** make from method asynchronous for improved transaction handling ([de96c9d](https://github.com/BitGo/BitGoJS/commit/de96c9d7a80da44f130df640178af12255ed1d5b))

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.7.0...@bitgo/sdk-coin-icp@1.8.0) (2025-03-18)

### Bug Fixes

- **sdk-coin-icp:** fix popup_generate_addresses - isWalletAddress validation ([cc4c5e4](https://github.com/BitGo/BitGoJS/commit/cc4c5e4f37808d288f37d6a695a03cf6b2720043))
- **sdk-coin-icp:** update payloads length and adjust interval for ingress expiries ([8d153d5](https://github.com/BitGo/BitGoJS/commit/8d153d5027c61bd547c751e8a53b4a5cffaa9138))
- **sdk-core:** set default multisig if empty ([e2727df](https://github.com/BitGo/BitGoJS/commit/e2727dfc89dd314a607b737e761e5eff824606af))

### Features

- **sdk-coin-icp:** enhance address validation and add memo ID support ([290c03e](https://github.com/BitGo/BitGoJS/commit/290c03e85ec32f13c008230593156b67fa2558d0))
- **sdk-coin-icp:** implement signing functionality and improve transaction validation ([9ec7714](https://github.com/BitGo/BitGoJS/commit/9ec77143b9350719f665876c1d748a5e0fcd7501))

# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.6.0...@bitgo/sdk-coin-icp@1.7.0) (2025-03-06)

### Bug Fixes

- **sdk-coin-icp:** correct buffer handling for sender principal and principal conversion ([b51b93c](https://github.com/BitGo/BitGoJS/commit/b51b93c0335b52293f2f3686a408c2cd7eba0fa6))

### Features

- **sdk-coin-icp:** add validation for ICP block hashes ([3037e1e](https://github.com/BitGo/BitGoJS/commit/3037e1e5c4c5a28d26ceb71bd2665976f526f7b5))
- **sdk-coin-icp:** implemented parsedTransaction for unsigned txn ([ffc2370](https://github.com/BitGo/BitGoJS/commit/ffc237069fc4061fe979cf7c1bd633e10b6f4453))
- **sdk-coin-icp:** implemented transaction parsing for signed txn ([f2d4f73](https://github.com/BitGo/BitGoJS/commit/f2d4f738128af157124707fc42855f801c724b6e))

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.3.0...@bitgo/sdk-coin-icp@1.6.0) (2025-03-04)

### Bug Fixes

- dependency fixes for secp256 lib ([826db0b](https://github.com/BitGo/BitGoJS/commit/826db0b5481435bb38b251e8bb5ba8ce9f78d017))
- **root:** replace elliptic with noble/curves/secp256k1 ([50a208d](https://github.com/BitGo/BitGoJS/commit/50a208d68d8b313ccb9b8e638212f61617daf92a))

### Features

- **sdk-coin-icp:** implemented transaction builder and validations for ICP ([ecf68b8](https://github.com/BitGo/BitGoJS/commit/ecf68b8f671944992a16e0eca77ef200e83c520c))
- **sdk-coin-icp:** refactor key pair generation to use utility function ([93d84d4](https://github.com/BitGo/BitGoJS/commit/93d84d48a3e6287959626e69bcce1c430d82df7a))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.3.0...@bitgo/sdk-coin-icp@1.5.0) (2025-02-26)

### Bug Fixes

- **root:** replace elliptic with noble/curves/secp256k1 ([50a208d](https://github.com/BitGo/BitGoJS/commit/50a208d68d8b313ccb9b8e638212f61617daf92a))

### Features

- **sdk-coin-icp:** refactor key pair generation to use utility function ([93d84d4](https://github.com/BitGo/BitGoJS/commit/93d84d48a3e6287959626e69bcce1c430d82df7a))

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.3.0...@bitgo/sdk-coin-icp@1.4.0) (2025-02-20)

### Features

- **sdk-coin-icp:** refactor key pair generation to use utility function ([93d84d4](https://github.com/BitGo/BitGoJS/commit/93d84d48a3e6287959626e69bcce1c430d82df7a))

# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.2.1...@bitgo/sdk-coin-icp@1.3.0) (2025-02-19)

### Features

- **sdk-coin-icp:** refactor getAddressFromPublicKey to use utils method ([702ffe8](https://github.com/BitGo/BitGoJS/commit/702ffe88376c7a19ec73f8e2e066cc707bcecc25))

## [1.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.2.0...@bitgo/sdk-coin-icp@1.2.1) (2025-02-11)

**Note:** Version bump only for package @bitgo/sdk-coin-icp

# [1.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.1.3...@bitgo/sdk-coin-icp@1.2.0) (2025-02-05)

### Features

- **sdk-coin-icp:** added address creation and validation logic ([5f28145](https://github.com/BitGo/BitGoJS/commit/5f28145a5a2268b4a76599b353c5a95cd409d286))

## [1.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.1.2...@bitgo/sdk-coin-icp@1.1.3) (2025-01-28)

**Note:** Version bump only for package @bitgo/sdk-coin-icp

## [1.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.1.1...@bitgo/sdk-coin-icp@1.1.2) (2025-01-23)

**Note:** Version bump only for package @bitgo/sdk-coin-icp

## [1.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-icp@1.1.0...@bitgo/sdk-coin-icp@1.1.1) (2025-01-23)

**Note:** Version bump only for package @bitgo/sdk-coin-icp

# 1.1.0 (2025-01-20)

### Features

- **sdk-coin-icp:** added ICP skeleton code ([5215ce9](https://github.com/BitGo/BitGoJS/commit/5215ce9f27c90b88cc916accd32c906ab690cf51))
