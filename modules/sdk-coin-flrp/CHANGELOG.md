# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.8.0...@bitgo/sdk-coin-flrp@1.9.0) (2026-02-12)


### Features

* **sdk-coin-flrp:** add TxBuilder for P-chain staking ([c04f75f](https://github.com/BitGo/BitGoJS/commit/c04f75f083ad3db5c7451fe8f6845c1b4a9d1b13))





# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.7.2...@bitgo/sdk-coin-flrp@1.8.0) (2026-01-30)


### Bug Fixes

* **sdk-coin-flrp:** correct change output thresholds for multisig wallets ([289e1c9](https://github.com/BitGo/BitGoJS/commit/289e1c9a5ec7f53490952ecabfea8d9b525ee23b))
* **sdk-coin-flrp:** signature ordering according to flareJS lib ([415f7c5](https://github.com/BitGo/BitGoJS/commit/415f7c5ebcce1ec8a73340d942b3afbf1d1353fc))
* **sdk-coin-flrp:** update address index computation and signing logic in txn builders ([facc354](https://github.com/BitGo/BitGoJS/commit/facc354ba8b6a5109ba2cb7677869d1f19406a61))


### Features

* **sdk-coin-flrp:** implement UTXO address sorting to ensure signature verification ([003ec57](https://github.com/BitGo/BitGoJS/commit/003ec578d2139f16ebbbdaea982667966e1e1efc))
* support node 24 ([b998bd1](https://github.com/BitGo/BitGoJS/commit/b998bd1bdb7e267e8e2f33b3599643a5c85c21d2))





## [1.7.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.7.1...@bitgo/sdk-coin-flrp@1.7.2) (2026-01-22)


### Bug Fixes

* **sdk-coin-flrp:** update UTXO matching logic ([5fde79f](https://github.com/BitGo/BitGoJS/commit/5fde79ffa6c1e2b8acc9f72219e035ec0f45890e))





## [1.7.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.7.0...@bitgo/sdk-coin-flrp@1.7.1) (2026-01-19)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





# [1.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.6.2...@bitgo/sdk-coin-flrp@1.7.0) (2026-01-19)


### Bug Fixes

* **sdk-coin-flr:** update import transaction fee validation ([8281d49](https://github.com/BitGo/BitGoJS/commit/8281d4925f5b7b98e68289b491d9c5e863f91a8b))


### Features

* **sdk-coin-flrp:** enhance transaction builders with addressesIndex handling ([46512e9](https://github.com/BitGo/BitGoJS/commit/46512e90646275fc71b9c648fc863633b09daa67))





## [1.6.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.6.1...@bitgo/sdk-coin-flrp@1.6.2) (2026-01-14)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.6.0...@bitgo/sdk-coin-flrp@1.6.1) (2026-01-07)


### Bug Fixes

* **sdk-coin-flrp:** fix flrp import to P fee value ([0cb5695](https://github.com/BitGo/BitGoJS/commit/0cb569532a1868f7992e60babb323a7ebc4bea1c))
* **sdk-coin-flrp:** implement dynamic fee calculation for C-chain import transactions ([689738d](https://github.com/BitGo/BitGoJS/commit/689738d8d21e3c7e41aed02bf75f77075418db3c))
* **sdk-coin-flrp:** update AddressMap creation to match UTXO address order ([cebeb07](https://github.com/BitGo/BitGoJS/commit/cebeb07be61895e8f37ea7573b5f368c6a531b5b))
* **sdk-coin-flrp:** update fee calculation for export transactions ([4e891a8](https://github.com/BitGo/BitGoJS/commit/4e891a85f1896d12839d286efee46d5dbfa0e16b))
* **sdk-coin-flrp:** update tx ID calculation and test data ([780df7b](https://github.com/BitGo/BitGoJS/commit/780df7b436c000d6f16021f2f9bb464dbad185d3))





# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.5.1...@bitgo/sdk-coin-flrp@1.6.0) (2025-12-23)


### Bug Fixes

* **sdk-coin-flr:** set default transaction fee for export in P txn ([046c92a](https://github.com/BitGo/BitGoJS/commit/046c92a6fd38247e7e5bfcf0556e6621e5399159))


### Features

* **sdk-coin-flrp:** add sourceChain and destinationChain properties ([df8e16d](https://github.com/BitGo/BitGoJS/commit/df8e16d6541df78dd94a07a14e84f4f4cf5200a1))
* **sdk-coin-flrp:** implement dynamic credential ordering based ([143830f](https://github.com/BitGo/BitGoJS/commit/143830f0c68612ae4ab82e5e6c71b6904a42a5ce))





## [1.5.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.5.0...@bitgo/sdk-coin-flrp@1.5.1) (2025-12-17)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.4.1...@bitgo/sdk-coin-flrp@1.5.0) (2025-12-11)


### Features

* **sdk-coin-flrp:** add transaction validation utility ([8d09223](https://github.com/BitGo/BitGoJS/commit/8d09223f277152e75ab7cb59ec6eeeef6a033da5))
* **sdk-coin-flrp:** export TransactionBuilder from transactionBuilder module ([5b426f5](https://github.com/BitGo/BitGoJS/commit/5b426f5e7f493a0c77a65a4bc83f84d60afe2285))





## [1.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.4.0...@bitgo/sdk-coin-flrp@1.4.1) (2025-12-05)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.3.4...@bitgo/sdk-coin-flrp@1.4.0) (2025-12-04)


### Bug Fixes

* **sdk-coin-flrp:** update fee calculation and address sorting in ExportInCTxBuilder ([32f7b43](https://github.com/BitGo/BitGoJS/commit/32f7b437dd207f814b1fea64452b4ea079152053))


### Features

* **sdk-coin-flrp:** add ExportInP transaction data and builder tests ([db6a4a4](https://github.com/BitGo/BitGoJS/commit/db6a4a41f05c7ecf787567323304d4f0ca59e632))
* **sdk-coin-flrp:** add recoverySignature method for public key recovery from signature ([926f361](https://github.com/BitGo/BitGoJS/commit/926f36136a4353c7f38d8829a0ad1015f3614b00))
* **sdk-coin-flrp:** enhance ImportInPTxBuilder for P-chain transactions ([2f11726](https://github.com/BitGo/BitGoJS/commit/2f117267d1b9d16895275a4b864c61819ece9155))
* **sdk-coin-flrp:** implement ImportInCTxBuilder for C-chain transactions ([aba135f](https://github.com/BitGo/BitGoJS/commit/aba135fc0f26050ba0543a3fad90c257ebf285af))
* **sdk-coin-flrp:** refactored and implemented export C to P builder with test cases\ ([764be80](https://github.com/BitGo/BitGoJS/commit/764be80e9ccd6e20c8fe185711c657cd62eddc8b))





## [1.3.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.3.3...@bitgo/sdk-coin-flrp@1.3.4) (2025-11-26)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.3.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.3.2...@bitgo/sdk-coin-flrp@1.3.3) (2025-11-19)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.3.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.3.1...@bitgo/sdk-coin-flrp@1.3.2) (2025-11-13)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.3.0...@bitgo/sdk-coin-flrp@1.3.1) (2025-11-12)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.2.2...@bitgo/sdk-coin-flrp@1.3.0) (2025-11-06)


### Features

* **sdk-coin-flrp:** fixed Utils and KeyPair and added test cases ([61e2ef5](https://github.com/BitGo/BitGoJS/commit/61e2ef5293af73499ba51e557d18f1bd0880239d))





## [1.2.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.2.1...@bitgo/sdk-coin-flrp@1.2.2) (2025-10-31)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.2.0...@bitgo/sdk-coin-flrp@1.2.1) (2025-10-29)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





# [1.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.7...@bitgo/sdk-coin-flrp@1.2.0) (2025-10-24)


### Features

* **secp256k1:** implement public key recovery in recoverySignature method and add unit tests ([b963e1f](https://github.com/BitGo/BitGoJS/commit/b963e1f0e0d8a1c2e2127dc6b2cefd3524f96a9f))





## [1.1.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.6...@bitgo/sdk-coin-flrp@1.1.7) (2025-10-21)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.1.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.5...@bitgo/sdk-coin-flrp@1.1.6) (2025-10-16)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.1.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.4...@bitgo/sdk-coin-flrp@1.1.5) (2025-10-13)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp





## [1.1.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.3...@bitgo/sdk-coin-flrp@1.1.4) (2025-10-09)


### Bug Fixes

* run check-fmt on code files only ([9745196](https://github.com/BitGo/BitGoJS/commit/9745196b02b9678c740d290a4638ceb153a8fd75))





## [1.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.2...@bitgo/sdk-coin-flrp@1.1.3) (2025-10-08)


### Bug Fixes

* add explicit 'files' in package json ([3b00373](https://github.com/BitGo/BitGoJS/commit/3b0037396f6ac16bb9380bd85bf37f2b133068f4))





## [1.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.1...@bitgo/sdk-coin-flrp@1.1.2) (2025-10-02)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp

## [1.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/sdk-coin-flrp@1.1.0...@bitgo/sdk-coin-flrp@1.1.1) (2025-09-29)

**Note:** Version bump only for package @bitgo/sdk-coin-flrp

# 1.1.0 (2025-09-25)

### Bug Fixes

- **sdk-coin-flrp:** fix build due to dependency conflict ([28fa71b](https://github.com/BitGo/BitGoJS/commit/28fa71bd78061d478f58ef118ba137c952ead160))

### Features

- (skeleton) export in c chain ([f86f215](https://github.com/BitGo/BitGoJS/commit/f86f21527ed6130cdf5fdbcdffacd241385e88fc))
- configure learn to skip git operations ([ee3a622](https://github.com/BitGo/BitGoJS/commit/ee3a6220496476aa7f4545b5f4a9a3bf97d9bdb9))
- flrp txn builder ([2b47130](https://github.com/BitGo/BitGoJS/commit/2b471308e7a9ec3e57e49b04b7d75fcb404eb33f))
- flrp validators and delegator ([f0baf64](https://github.com/BitGo/BitGoJS/commit/f0baf64859d6d019ac31175befe5066fcc2d0744))
- flrp validators and delegator ([6c16b3d](https://github.com/BitGo/BitGoJS/commit/6c16b3dc53cf625aa646ab64e87558e5193ef824))
- flrp validators and delegator ([4cbc0e5](https://github.com/BitGo/BitGoJS/commit/4cbc0e502f7d0958ef2fa91c78b106f1585a77c4))
- flrp validators and delegator ([87694a1](https://github.com/BitGo/BitGoJS/commit/87694a14851c260053605f6ab761dbf6edd012d5))
- flrp validators and delegator ([5658080](https://github.com/BitGo/BitGoJS/commit/5658080cab9691cb0c8340ba5c40da5381fc4286))
- **sdk-coin-flrp:** added keypair and utils ([71846e7](https://github.com/BitGo/BitGoJS/commit/71846e7431af97736e1babe7dc0fc2953639192a))
- skeleton export tx builder for p chain ([6a910fd](https://github.com/BitGo/BitGoJS/commit/6a910fd62640ba26a6038fa84cdce3a40f1c3cb4))
