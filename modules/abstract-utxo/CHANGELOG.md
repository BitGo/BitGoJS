# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.6.1...@bitgo/abstract-utxo@8.7.0) (2024-06-14)

### Bug Fixes

- correctly parse the response of `/fees/recommended` from Mempool ([e7455a8](https://github.com/BitGo/BitGoJS/commit/e7455a8057a6ece91b73fe373ecd1742282a8c28))

### Features

- add `recover` function for v1 btc wallets ([16e3b25](https://github.com/BitGo/BitGoJS/commit/16e3b2550baab6d15795ee8314935ee3f13c5af1))

## [8.6.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.6.0...@bitgo/abstract-utxo@8.6.1) (2024-06-11)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.5.0...@bitgo/abstract-utxo@8.6.0) (2024-06-05)

### Features

- **utxo-lib:** add signPsbtFromOVC ([59db80f](https://github.com/BitGo/BitGoJS/commit/59db80fcd2d07d145049b6f2dfbdccb6c1931606))

### Reverts

- Revert "feat: use psbt format for hot and custodial wallets" ([4d027c8](https://github.com/BitGo/BitGoJS/commit/4d027c8c218fca8228544f22f1b413e2ba507463))

# [8.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.4.0...@bitgo/abstract-utxo@8.5.0) (2024-05-31)

### Features

- use cashaddr address format for ecash recovery ([072f11f](https://github.com/BitGo/BitGoJS/commit/072f11f9e2b8b10c91d9ddf4e0503dc3a1e13563))
- use psbt format for hot and custodial wallets ([7b66a58](https://github.com/BitGo/BitGoJS/commit/7b66a584ce304093e03a372dafad9152ef875e7b))

# [8.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.3.1...@bitgo/abstract-utxo@8.4.0) (2024-05-28)

### Features

- add p2tr as the last option ([673c7d8](https://github.com/BitGo/BitGoJS/commit/673c7d8444be8147ca2b3803e641ab35890e6521))
- remove p2tr from changeAddressType list ([561a8bd](https://github.com/BitGo/BitGoJS/commit/561a8bdd4f785a4e8ef483e0271a40a4a5c192d9))

## [8.3.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.3.0...@bitgo/abstract-utxo@8.3.1) (2024-05-22)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.2.1...@bitgo/abstract-utxo@8.3.0) (2024-05-17)

### Features

- remove conditional p2trMusig2 check ([9683f33](https://github.com/BitGo/BitGoJS/commit/9683f3325fd454a804a60894c618ee0212acc6b2))
- send changeAddressType preferences array ([bd18c9e](https://github.com/BitGo/BitGoJS/commit/bd18c9e5e897655036676db49070858e11b6e028))

## [8.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.2.0...@bitgo/abstract-utxo@8.2.1) (2024-05-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.3...@bitgo/abstract-utxo@8.2.0) (2024-05-08)

### Features

- use canonical address when checking if owned by wallet ([82a13bd](https://github.com/BitGo/BitGoJS/commit/82a13bdaed9cf4f7ae5a1aa87e6ff7d92bf989eb))

### Reverts

- Revert "Revert "feat(abstract-utxo): support trustless change outputs from explaintx"" ([03896f6](https://github.com/BitGo/BitGoJS/commit/03896f65ecaaa85f6a5a9be9d45012d848329938))

## [8.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.2...@bitgo/abstract-utxo@8.1.3) (2024-05-01)

### Reverts

- Revert "feat(abstract-utxo): support trustless change outputs from explaintx" ([23442a9](https://github.com/BitGo/BitGoJS/commit/23442a9873ae432c1d5efee8a3b3d4c0c3a772e2))

## [8.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.1...@bitgo/abstract-utxo@8.1.2) (2024-04-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.1.0...@bitgo/abstract-utxo@8.1.1) (2024-04-24)

### Bug Fixes

- superagent upgrade to 9.0 ([6e9aa43](https://github.com/BitGo/BitGoJS/commit/6e9aa43a6d2999298abd450ceb168d664b8b926d))

# [8.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.6...@bitgo/abstract-utxo@8.1.0) (2024-04-22)

### Features

- **abstract-utxo:** support trustless change outputs from explaintx ([445ed53](https://github.com/BitGo/BitGoJS/commit/445ed5357c24357b5f9137669551e146bf2f2e60))
- only query unspents for wallet owned addresses ([5beaff5](https://github.com/BitGo/BitGoJS/commit/5beaff54e8fc11b642c13e3ac17ffd6b6ff4752c))

## [8.0.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.5...@bitgo/abstract-utxo@8.0.6) (2024-04-17)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.4...@bitgo/abstract-utxo@8.0.5) (2024-04-12)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.3...@bitgo/abstract-utxo@8.0.4) (2024-04-10)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.2...@bitgo/abstract-utxo@8.0.3) (2024-04-09)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.1...@bitgo/abstract-utxo@8.0.2) (2024-04-08)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [8.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@8.0.0...@bitgo/abstract-utxo@8.0.1) (2024-04-05)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [8.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.4...@bitgo/abstract-utxo@8.0.0) (2024-03-28)

### Features

- **root:** deprecate node 16 ([d3ec624](https://github.com/BitGo/BitGoJS/commit/d3ec6240bddae2a4ab7fa80c4a16efecc36210bd))

### BREAKING CHANGES

- **root:** Node 16 is no longer supported in bitgojs.
  TICKET: WP-1100

## [7.0.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.3...@bitgo/abstract-utxo@7.0.4) (2024-03-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [7.0.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.2...@bitgo/abstract-utxo@7.0.3) (2024-03-11)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [7.0.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.1...@bitgo/abstract-utxo@7.0.2) (2024-02-28)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [7.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@7.0.0...@bitgo/abstract-utxo@7.0.1) (2024-02-22)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [7.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@7.0.0) (2024-02-19)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- pass down `includeRbf: true` while fetching tx to be replaced ([4a5d9f0](https://github.com/BitGo/BitGoJS/commit/4a5d9f02db9a45a179bcaa3369493e2c57ecdf40))
- rectify the external/internal recipients handling for RBF ([6f0be13](https://github.com/BitGo/BitGoJS/commit/6f0be13918ac7afbeddb222819a243a44a46fd5b))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [6.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@6.0.0) (2024-01-30)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [5.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@5.0.0) (2024-01-26)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [4.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@4.0.0) (2024-01-26)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** assert locking script before signing ([92eedd9](https://github.com/BitGo/BitGoJS/commit/92eedd93b3e9696842c2cf2b51868ae4a6218a28))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- allow replacement transaction verification after prebuild ([c81fba8](https://github.com/BitGo/BitGoJS/commit/c81fba89a90f4e74289fd1580914d63a7d86da35))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- rename the `findMissingOutputs` func to `outputDifference` ([d4c7eb4](https://github.com/BitGo/BitGoJS/commit/d4c7eb4baeb216e8165fd2cb452de9f4c6cb613e))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

### BREAKING CHANGES

- renames the `findMissingOutputs` to `outputDifference`
  in `AbstractUtxoCoin` class

BTC-820

# [3.32.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.32.0) (2024-01-25)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.31.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.31.0) (2024-01-22)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** support webauthn decryption in abstract utxo fn ([e9dd17a](https://github.com/BitGo/BitGoJS/commit/e9dd17a87211732a5287144df5a3fb766e6c1142))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.30.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.30.0) (2024-01-09)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- add walletFlags property, helper methods ([f0fd760](https://github.com/BitGo/BitGoJS/commit/f0fd760122334d86b0d4239bc3b23e0983a1d524))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- handle musigKp flag in wallet ([b79b77c](https://github.com/BitGo/BitGoJS/commit/b79b77c4e0d64d85951724946206a5ded4fdd7b2))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.29.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.29.0) (2024-01-03)

### Bug Fixes

- **abstract-utxo:** add changeAddress to change params ([3df744d](https://github.com/BitGo/BitGoJS/commit/3df744dbfe8de6ff846aec13669c38454dd5139f))
- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** do not override changeAddressType or txFormat ([9494255](https://github.com/BitGo/BitGoJS/commit/94942559b0be8f9789c7afbb3740924aaab76ab3))
- **abstract-utxo:** revert to addressType ([5e45e62](https://github.com/BitGo/BitGoJS/commit/5e45e62d512c2794a517030027b1f9f66b20e048))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.28.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.28.0) (2023-12-18)

### Bug Fixes

- **abstract-utxo:** add changeAddressType to change params ([b05b278](https://github.com/BitGo/BitGoJS/commit/b05b278a7148b5a5bfb61b17f60b81c7477b6b31))
- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.27.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.27.0) (2023-12-12)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** enable segwit override when flagged ([bdf723c](https://github.com/BitGo/BitGoJS/commit/bdf723ce51d245e97b217941a21b02084b2473cf))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.26.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.26.0) (2023-12-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.25.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.25.0) (2023-12-05)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **abstract-utxo:** this enables psbt unless explicitly disabled for ([9a1722e](https://github.com/BitGo/BitGoJS/commit/9a1722e21e2a2fb3068d2940f439f72a6cbcb421))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.24.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.24.0) (2023-11-28)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.23.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.23.0) (2023-11-24)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.22.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.22.0) (2023-11-17)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- **unspents:** default unspents dimensions to recovery path ([361eb62](https://github.com/BitGo/BitGoJS/commit/361eb62641aac19c876576a65da7f6777dc532a0))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.21.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.21.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.20.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.20.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.19.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.19.0) (2023-11-13)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))
- use psbt for prebuild when wallet is distributedCustody ([10f5e1a](https://github.com/BitGo/BitGoJS/commit/10f5e1ab37d2bea6acd93f94defbe786e4a027b9))

# [3.18.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.18.0) (2023-10-20)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.17.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.17.0) (2023-10-18)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.16.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.16.0) (2023-09-25)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.15.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.15.0) (2023-09-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.14.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.14.0) (2023-09-09)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.13.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.13.0) (2023-09-07)

### Bug Fixes

- **abstract-utxo:** upper case address should return false ([f0b6c46](https://github.com/BitGo/BitGoJS/commit/f0b6c467daaa0e43bb2923993fb238c7a4ce6f59))

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.12.0) (2023-09-05)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.11.0) (2023-09-01)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.10.0) (2023-08-29)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.9.0) (2023-08-25)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.8.0) (2023-08-24)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.7.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.7.0) (2023-08-16)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.5.0...@bitgo/abstract-utxo@3.6.0) (2023-08-16)

### Features

- **abstract-utxo:** change api used for bitcoin recovery from blockstream to blockchair ([6da5791](https://github.com/BitGo/BitGoJS/commit/6da5791bce2fc73d5d77c1eee6cb581b60da2079))
- **bitgo:** calculate fees explicitly for psbts ([7a7e288](https://github.com/BitGo/BitGoJS/commit/7a7e288c63718a112abf633b842e7538d1e25693))

# [3.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.3.0...@bitgo/abstract-utxo@3.5.0) (2023-08-04)

### Features

- **abstract-utxo:** add psbt support backup recovery ([b312a86](https://github.com/BitGo/BitGoJS/commit/b312a86091c1320b4d7a02bd1ca5c3d2056c00c6))
- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))
- **utxo-lib:** extract half signed tx from psbt ([3145474](https://github.com/BitGo/BitGoJS/commit/31454748fcea6df7fbbf886937abc48b36fb9cbd))

# [3.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.3.0...@bitgo/abstract-utxo@3.4.0) (2023-07-28)

### Features

- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))
- **utxo-lib:** extract half signed tx from psbt ([3145474](https://github.com/BitGo/BitGoJS/commit/31454748fcea6df7fbbf886937abc48b36fb9cbd))

# [3.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.2.0...@bitgo/abstract-utxo@3.3.0) (2023-07-18)

### Features

- **abstract-utxo:** always use bitcoin network for validating secondary key signatures ([d9b7022](https://github.com/BitGo/BitGoJS/commit/d9b7022832ed38d8661b842add34caa97f340d31))
- **abstract-utxo:** move keysSignatures test to separate file ([b9fa5c5](https://github.com/BitGo/BitGoJS/commit/b9fa5c57ae6207974612c96c4cf0941665703a4e))

# [3.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.1.2...@bitgo/abstract-utxo@3.2.0) (2023-06-21)

### Features

- **abstract-utxo:** support express external signer for musig2 inputs ([4401367](https://github.com/BitGo/BitGoJS/commit/44013673d564c976ae7b55788369dc48acbec64f))
- **utxo-lib:** add extractTransaction to UtxoPsbt ([0c41982](https://github.com/BitGo/BitGoJS/commit/0c41982de5b9397e69b314272c4e0f38bb6f69c3))

## [3.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.1.1...@bitgo/abstract-utxo@3.1.2) (2023-06-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [3.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.1.0...@bitgo/abstract-utxo@3.1.1) (2023-06-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [3.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@3.0.0...@bitgo/abstract-utxo@3.1.0) (2023-06-07)

### Features

- **abstract-utxo:** make walletId param optional for signtx ([f5aff50](https://github.com/BitGo/BitGoJS/commit/f5aff5087727fb1842dc7cda64756553ab364c2b))

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.3.0...@bitgo/abstract-utxo@3.0.0) (2023-06-05)

### Bug Fixes

- **utxo-lib:** use PsbtInput instead of UtxoPsbt ([1f73539](https://github.com/BitGo/BitGoJS/commit/1f73539409cf69fc55ab8aedb9d8873bb82bc375))

### Features

- **abstract-utxo:** add psbt support to explain and verify Tx ([4189659](https://github.com/BitGo/BitGoJS/commit/41896593cdc180cb5a60145a8d31fdf55dba6bb2))

### BREAKING CHANGES

- **utxo-lib:** functions signature is changed

# [2.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.2.1...@bitgo/abstract-utxo@2.3.0) (2023-05-25)

### Features

- **abstract-utxo:** add psbt and musig2 support for sdk-api ([7a23991](https://github.com/BitGo/BitGoJS/commit/7a23991079e5609d43d7483f8137189163943dfc))

## [2.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.2.0...@bitgo/abstract-utxo@2.2.1) (2023-05-17)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [2.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.3...@bitgo/abstract-utxo@2.2.0) (2023-05-10)

### Features

- **sdk-coin-btc:** find & use supplementary unspents in case ([fc321ee](https://github.com/BitGo/BitGoJS/commit/fc321ee1fccfae2d6676070fb32d8d4dee531aaf))

## [2.1.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.2...@bitgo/abstract-utxo@2.1.3) (2023-05-03)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [2.1.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.1...@bitgo/abstract-utxo@2.1.2) (2023-04-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [2.1.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.1.0...@bitgo/abstract-utxo@2.1.1) (2023-04-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [2.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.0.1...@bitgo/abstract-utxo@2.1.0) (2023-04-13)

### Bug Fixes

- **sdk-coin-btc:** get rootwalletkeys for inscription transfer ([b160186](https://github.com/BitGo/BitGoJS/commit/b16018643273e20ea6908f51149139def7209932))

### Features

- **utxo-lib:** create p2tr address using musig2 ([699e829](https://github.com/BitGo/BitGoJS/commit/699e8291f4a205ba0b2071c6369f2c8843b8a945))

## [2.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@2.0.0...@bitgo/abstract-utxo@2.0.1) (2023-02-17)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [2.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.5...@bitgo/abstract-utxo@2.0.0) (2023-02-16)

### Bug Fixes

- accept apiKey for recoverFromWrongChain ([3f27775](https://github.com/BitGo/BitGoJS/commit/3f2777506326ae08d0e5d211146522af0d15c3f2))
- convert addr to canonical addr during wrongChainRecovery ([2089596](https://github.com/BitGo/BitGoJS/commit/20895964eeac1eedc9f859f0ce9b607313cc6568))
- **sdk-core:** mark pub as optional in Keychain interface ([7d6012c](https://github.com/BitGo/BitGoJS/commit/7d6012cf1058e43d96e129dc2b1607b5316dca1c))

### Features

- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))
- use UtxoApi to facilitate cross chain recoveries ([61151aa](https://github.com/BitGo/BitGoJS/commit/61151aa2634b7fa89f995a85940fd680f87cf854))

### BREAKING CHANGES

- **sdk-core:** Keychain.pub is now optional

# [1.12.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.5...@bitgo/abstract-utxo@1.12.0) (2023-02-08)

### Bug Fixes

- accept apiKey for recoverFromWrongChain ([3f27775](https://github.com/BitGo/BitGoJS/commit/3f2777506326ae08d0e5d211146522af0d15c3f2))
- convert addr to canonical addr during wrongChainRecovery ([2089596](https://github.com/BitGo/BitGoJS/commit/20895964eeac1eedc9f859f0ce9b607313cc6568))

### Features

- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))
- use UtxoApi to facilitate cross chain recoveries ([61151aa](https://github.com/BitGo/BitGoJS/commit/61151aa2634b7fa89f995a85940fd680f87cf854))

# [1.11.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.5...@bitgo/abstract-utxo@1.11.0) (2023-01-30)

### Features

- update tests for crossChainRecovery ([6cdd3a9](https://github.com/BitGo/BitGoJS/commit/6cdd3a94baa4427412d06e3e151096feea5e26ff))
- use UtxoApi to facilitate cross chain recoveries ([61151aa](https://github.com/BitGo/BitGoJS/commit/61151aa2634b7fa89f995a85940fd680f87cf854))

## [1.10.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.4...@bitgo/abstract-utxo@1.10.5) (2023-01-25)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.3...@bitgo/abstract-utxo@1.10.4) (2022-12-23)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.2...@bitgo/abstract-utxo@1.10.3) (2022-12-20)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.1...@bitgo/abstract-utxo@1.10.2) (2022-12-09)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.10.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.10.0...@bitgo/abstract-utxo@1.10.1) (2022-12-06)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.10.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.9.0...@bitgo/abstract-utxo@1.10.0) (2022-12-01)

### Features

- **abstract-utxo:** add valueString to unspents for doge recovery flow ([439f95c](https://github.com/BitGo/BitGoJS/commit/439f95c4e337e33a0812ac28b03e46b52e4a9fde))

# [1.9.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.9.0) (2022-11-29)

### Bug Fixes

- fix unit-test-all errors ([4adab4d](https://github.com/BitGo/BitGoJS/commit/4adab4dd363cdd4c21bd964fd3b6d5581bd63e46))
- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **abstract-utxo:** allow for override in isValidAddress ([1d02d98](https://github.com/BitGo/BitGoJS/commit/1d02d988401b6abc00336f67687a7b01d682989e))
- **root:** add support for cross chain recovery for bcha ([f9ab941](https://github.com/BitGo/BitGoJS/commit/f9ab941055eaf79f6623b40e9aac982124f78843))
- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))
- **utxo-lib:** simplify isValidAddress ([cf826fe](https://github.com/BitGo/BitGoJS/commit/cf826fe4d0a32f09888d2218028b24ce33a6aa92))

# [1.8.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.8.0) (2022-11-04)

### Bug Fixes

- fix unit-test-all errors ([4adab4d](https://github.com/BitGo/BitGoJS/commit/4adab4dd363cdd4c21bd964fd3b6d5581bd63e46))
- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.6.0) (2022-10-27)

### Bug Fixes

- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.4.0...@bitgo/abstract-utxo@1.5.0) (2022-10-25)

### Bug Fixes

- **sdk-coin-doge:** minor change in types ([db18dd9](https://github.com/BitGo/BitGoJS/commit/db18dd9f8a62432c89db76a9dbd81c7b3c586fc2))
- **utxo-lib:** fixed unchecked cast to Number ([2f1d962](https://github.com/BitGo/BitGoJS/commit/2f1d9628bd9ec51a12d0c8dc0adeb60e94f32b1d))

### Features

- **utxo-lib:** bigintify dogecoin specific functions ([d5830a6](https://github.com/BitGo/BitGoJS/commit/d5830a6d6c17de5cefb138a639b94c0cbb37f5f0))

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.6...@bitgo/abstract-utxo@1.4.0) (2022-10-18)

### Bug Fixes

- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))

### Features

- **abstract-utxo:** add support for bigints from new utxo-lib ([77c60dd](https://github.com/BitGo/BitGoJS/commit/77c60ddd4d0ddd1e82a8b1bb041686a9c7f39fae))
- **abstract-utxo:** backup key recovery service for doge ([612be53](https://github.com/BitGo/BitGoJS/commit/612be533836f33fdecb9584ddc0f5674df31dcb0))
- **abstract-utxo:** cross chain recovery support for bigint coins (doge) ([ad6bf71](https://github.com/BitGo/BitGoJS/commit/ad6bf71f58a4bae79f3bb014ee947a878f4b89d2))
- **sdk-core:** added large value support while calling WP ([870621e](https://github.com/BitGo/BitGoJS/commit/870621e2bc93d15ed6f040379353d039eb17e609))
- **utxo-lib:** export BIP32/ECPair interfaces ([8628507](https://github.com/BitGo/BitGoJS/commit/862850781b2e8b36c71608c5ae71424b9ebe9dee))

# [1.1.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.6...@bitgo/abstract-utxo@1.1.0) (2022-07-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.4...@bitgo/abstract-utxo@1.1.0-rc.6) (2022-07-19)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.4...@bitgo/abstract-utxo@1.1.0-rc.5) (2022-07-18)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.3...@bitgo/abstract-utxo@1.1.0-rc.4) (2022-07-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.1...@bitgo/abstract-utxo@1.1.0-rc.3) (2022-07-15)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.1...@bitgo/abstract-utxo@1.1.0-rc.2) (2022-07-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.1.0-rc.0...@bitgo/abstract-utxo@1.1.0-rc.1) (2022-07-12)

**Note:** Version bump only for package @bitgo/abstract-utxo

# [1.1.0-rc.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.15...@bitgo/abstract-utxo@1.1.0-rc.0) (2022-07-11)

### Features

- check network argument in AbstractUtxoCoin constructor ([4a36223](https://github.com/BitGo/BitGoJS/commit/4a3622341ed4011ba04acab0a5d799b79941d1c4))

## [1.0.1-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.14...@bitgo/abstract-utxo@1.0.1-rc.15) (2022-07-07)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.13...@bitgo/abstract-utxo@1.0.1-rc.14) (2022-07-05)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.12...@bitgo/abstract-utxo@1.0.1-rc.13) (2022-07-01)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.11...@bitgo/abstract-utxo@1.0.1-rc.12) (2022-06-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.10...@bitgo/abstract-utxo@1.0.1-rc.11) (2022-06-30)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.8...@bitgo/abstract-utxo@1.0.1-rc.10) (2022-06-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.8...@bitgo/abstract-utxo@1.0.1-rc.9) (2022-06-29)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.7...@bitgo/abstract-utxo@1.0.1-rc.8) (2022-06-27)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.6...@bitgo/abstract-utxo@1.0.1-rc.7) (2022-06-23)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.5...@bitgo/abstract-utxo@1.0.1-rc.6) (2022-06-22)

### Bug Fixes

- add dependency check to fix current and future dependency resolutions ([3074335](https://github.com/BitGo/BitGoJS/commit/30743356cff4ebb6d9e185f1a493b187614a1ea9))

## [1.0.1-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.4...@bitgo/abstract-utxo@1.0.1-rc.5) (2022-06-21)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.3...@bitgo/abstract-utxo@1.0.1-rc.4) (2022-06-16)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.2...@bitgo/abstract-utxo@1.0.1-rc.3) (2022-06-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.1...@bitgo/abstract-utxo@1.0.1-rc.2) (2022-06-14)

**Note:** Version bump only for package @bitgo/abstract-utxo

## [1.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-utxo@1.0.1-rc.0...@bitgo/abstract-utxo@1.0.1-rc.1) (2022-06-13)

**Note:** Version bump only for package @bitgo/abstract-utxo

## 1.0.1-rc.0 (2022-06-10)

### Bug Fixes

- **abstract-utxo:** add bsv replay protection case ([5e166cb](https://github.com/BitGo/BitGoJS/commit/5e166cbbc89ff10bd59308debf8f43dd18de0c47))
