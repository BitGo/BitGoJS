# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@5.0.0) (2023-11-17)

### Bug Fixes

- **sdk-coin-polygon:** fix issues ([85e9396](https://github.com/BitGo/BitGoJS/commit/85e93967abd056f5054198f385a1b109246a281f))

### Code Refactoring

- **abstract-eth:** add common method to abstract-eth ([df6eea5](https://github.com/BitGo/BitGoJS/commit/df6eea5d299c415b30263d1713335c14e5abef4a))
- **abstract-eth:** delete mpc related classes ([52396ed](https://github.com/BitGo/BitGoJS/commit/52396ed5aae8b27f0cc6caee7011a7c6882b9dea))
- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- **abstract-eth:** move txbuilder to abstract-eth ([a093f16](https://github.com/BitGo/BitGoJS/commit/a093f16465b691d82b2709245cc806fc0eb66212))

### Features

- **abstract-eth:** add abstractethliketsscoin class ([eb99545](https://github.com/BitGo/BitGoJS/commit/eb995457d7787af073f0a9eafe6e4d420228f5f0))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- **abstract-eth:** AbstractEthLikeMPCCoin and EthLikeMPCToken classes are removed as we have instead added
  a new class AbstractEthLikeNewCoins which will be having both multisig
  and MPC related methods

TICKET: WIN-1021

- **abstract-eth:** getTransactionBuilder method is removed from EthLikeToken
  class in abstract-eth module because TransactionBuilder in the
  abstract-eth module is abstract class and hence cannot be instantiated. Hence the implementation of TransactionBuilder can
  be added to the class that will inherit EthLikeToken class

TransactionPrebuild from new class AbstractEthLikeNewCoins is being
exported now instead of TransactionPrebuild from AbstractEthLikeCoin
class as the TransactionPrebuild from AbstractEthLikeNewCoins also has
support for hop transactions, batch transactions, etc

TICKET: WIN-1021

# [4.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@4.0.0) (2023-11-13)

### Code Refactoring

- **abstract-eth:** delete mpc related classes ([52396ed](https://github.com/BitGo/BitGoJS/commit/52396ed5aae8b27f0cc6caee7011a7c6882b9dea))
- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- **abstract-eth:** move txbuilder to abstract-eth ([a093f16](https://github.com/BitGo/BitGoJS/commit/a093f16465b691d82b2709245cc806fc0eb66212))

### Features

- **abstract-eth:** add abstractethliketsscoin class ([eb99545](https://github.com/BitGo/BitGoJS/commit/eb995457d7787af073f0a9eafe6e4d420228f5f0))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- **abstract-eth:** AbstractEthLikeMPCCoin and EthLikeMPCToken classes are removed as we have instead added
  a new class AbstractEthLikeNewCoins which will be having both multisig
  and MPC related methods

TICKET: WIN-1021

- **abstract-eth:** getTransactionBuilder method is removed from EthLikeToken
  class in abstract-eth module because TransactionBuilder in the
  abstract-eth module is abstract class and hence cannot be instantiated. Hence the implementation of TransactionBuilder can
  be added to the class that will inherit EthLikeToken class

TransactionPrebuild from new class AbstractEthLikeNewCoins is being
exported now instead of TransactionPrebuild from AbstractEthLikeCoin
class as the TransactionPrebuild from AbstractEthLikeNewCoins also has
support for hop transactions, batch transactions, etc

TICKET: WIN-1021

# [3.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@3.0.0) (2023-11-13)

### Code Refactoring

- **abstract-eth:** delete mpc related classes ([52396ed](https://github.com/BitGo/BitGoJS/commit/52396ed5aae8b27f0cc6caee7011a7c6882b9dea))
- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- **abstract-eth:** move txbuilder to abstract-eth ([a093f16](https://github.com/BitGo/BitGoJS/commit/a093f16465b691d82b2709245cc806fc0eb66212))

### Features

- **abstract-eth:** add abstractethliketsscoin class ([eb99545](https://github.com/BitGo/BitGoJS/commit/eb995457d7787af073f0a9eafe6e4d420228f5f0))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- **abstract-eth:** AbstractEthLikeMPCCoin and EthLikeMPCToken classes are removed as we have instead added
  a new class AbstractEthLikeNewCoins which will be having both multisig
  and MPC related methods

TICKET: WIN-1021

- **abstract-eth:** getTransactionBuilder method is removed from EthLikeToken
  class in abstract-eth module because TransactionBuilder in the
  abstract-eth module is abstract class and hence cannot be instantiated. Hence the implementation of TransactionBuilder can
  be added to the class that will inherit EthLikeToken class

TransactionPrebuild from new class AbstractEthLikeNewCoins is being
exported now instead of TransactionPrebuild from AbstractEthLikeCoin
class as the TransactionPrebuild from AbstractEthLikeNewCoins also has
support for hop transactions, batch transactions, etc

TICKET: WIN-1021

# [2.0.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@2.0.0) (2023-11-13)

### Code Refactoring

- **abstract-eth:** delete mpc related classes ([52396ed](https://github.com/BitGo/BitGoJS/commit/52396ed5aae8b27f0cc6caee7011a7c6882b9dea))
- **abstract-eth:** move methods to abstract-eth ([af8bd10](https://github.com/BitGo/BitGoJS/commit/af8bd10e24c8d58fc227494de6a614098265580a))
- **abstract-eth:** move txbuilder to abstract-eth ([a093f16](https://github.com/BitGo/BitGoJS/commit/a093f16465b691d82b2709245cc806fc0eb66212))

### Features

- **abstract-eth:** add abstractethliketsscoin class ([eb99545](https://github.com/BitGo/BitGoJS/commit/eb995457d7787af073f0a9eafe6e4d420228f5f0))

### BREAKING CHANGES

- **abstract-eth:** Type of nextContractSequenceId field in TransactionPrebuild
  interface is changed from string to number in AbstractEthLikeCoin and AbstractEthLikeNewCoins classes.
  getCustomChainName method is removed from Polygon class because a common
  method getCustomChainCommon has been added to AbstractEthLikeNewCoins
  class for all EthLike coins. replayProtectionOptions is not optional in buildTransaction method in AbstractEthLikeNewCoins
  and needs to be passed to derive the Eth common object from the chainId.
  signFinalPolygon method name from Polygon class is updated to signFinalEthLike so that
  it can be used for other EthLike coins. getBaseFactor method in Eth
  and Polygon class returns number instead of string just to align with
  AbstractEthLikeCoin
  Ticket: WIN-1012
- **abstract-eth:** AbstractEthLikeMPCCoin and EthLikeMPCToken classes are removed as we have instead added
  a new class AbstractEthLikeNewCoins which will be having both multisig
  and MPC related methods

TICKET: WIN-1021

- **abstract-eth:** getTransactionBuilder method is removed from EthLikeToken
  class in abstract-eth module because TransactionBuilder in the
  abstract-eth module is abstract class and hence cannot be instantiated. Hence the implementation of TransactionBuilder can
  be added to the class that will inherit EthLikeToken class

TransactionPrebuild from new class AbstractEthLikeNewCoins is being
exported now instead of TransactionPrebuild from AbstractEthLikeCoin
class as the TransactionPrebuild from AbstractEthLikeNewCoins also has
support for hop transactions, batch transactions, etc

TICKET: WIN-1021

# [1.6.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.6.0) (2023-10-20)

### Features

- **abstract-eth:** add abstractethliketsscoin class ([eb99545](https://github.com/BitGo/BitGoJS/commit/eb995457d7787af073f0a9eafe6e4d420228f5f0))

# [1.5.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.5.0) (2023-10-18)

### Features

- **abstract-eth:** add abstractethliketsscoin class ([eb99545](https://github.com/BitGo/BitGoJS/commit/eb995457d7787af073f0a9eafe6e4d420228f5f0))

## [1.4.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.11) (2023-09-25)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.10) (2023-09-09)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.9) (2023-09-09)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.8) (2023-09-07)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.7) (2023-09-05)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.6) (2023-09-01)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.5) (2023-08-29)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.4) (2023-08-25)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.3) (2023-08-24)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.2) (2023-08-16)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.4.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.4.0...@bitgo/abstract-eth@1.4.1) (2023-08-16)

**Note:** Version bump only for package @bitgo/abstract-eth

# [1.4.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.28...@bitgo/abstract-eth@1.4.0) (2023-08-04)

### Features

- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))

# [1.3.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.28...@bitgo/abstract-eth@1.3.0) (2023-07-28)

### Features

- **root:** add node 18 to engines and CI ([9cc6a70](https://github.com/BitGo/BitGoJS/commit/9cc6a70ba807161b7c6a0ebe3d7c47f25c7c8eca))
- **root:** remove node 14 from engines ([6ec47cb](https://github.com/BitGo/BitGoJS/commit/6ec47cbd7996cc78bbf2cf7f16595c24fe43cd41))

## [1.2.28](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.27...@bitgo/abstract-eth@1.2.28) (2023-07-18)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.27](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.26...@bitgo/abstract-eth@1.2.27) (2023-06-21)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.26](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.25...@bitgo/abstract-eth@1.2.26) (2023-06-14)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.25](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.24...@bitgo/abstract-eth@1.2.25) (2023-06-13)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.24](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.23...@bitgo/abstract-eth@1.2.24) (2023-06-07)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.23](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.22...@bitgo/abstract-eth@1.2.23) (2023-06-05)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.22](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.21...@bitgo/abstract-eth@1.2.22) (2023-05-25)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.20...@bitgo/abstract-eth@1.2.21) (2023-05-17)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.19...@bitgo/abstract-eth@1.2.20) (2023-05-10)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.18...@bitgo/abstract-eth@1.2.19) (2023-05-03)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.18](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.17...@bitgo/abstract-eth@1.2.18) (2023-04-25)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.16...@bitgo/abstract-eth@1.2.17) (2023-04-20)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.15...@bitgo/abstract-eth@1.2.16) (2023-04-13)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.14...@bitgo/abstract-eth@1.2.15) (2023-02-17)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.11...@bitgo/abstract-eth@1.2.14) (2023-02-16)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.11...@bitgo/abstract-eth@1.2.13) (2023-02-08)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.11...@bitgo/abstract-eth@1.2.12) (2023-01-30)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.10...@bitgo/abstract-eth@1.2.11) (2023-01-25)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.9...@bitgo/abstract-eth@1.2.10) (2022-12-23)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.8...@bitgo/abstract-eth@1.2.9) (2022-12-20)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.7...@bitgo/abstract-eth@1.2.8) (2022-12-09)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.6...@bitgo/abstract-eth@1.2.7) (2022-12-06)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.5...@bitgo/abstract-eth@1.2.6) (2022-12-01)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.0...@bitgo/abstract-eth@1.2.5) (2022-11-29)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.0...@bitgo/abstract-eth@1.2.4) (2022-11-04)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.0...@bitgo/abstract-eth@1.2.2) (2022-10-27)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.2.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.2.0...@bitgo/abstract-eth@1.2.1) (2022-10-25)

**Note:** Version bump only for package @bitgo/abstract-eth

# [1.2.0](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.23...@bitgo/abstract-eth@1.2.0) (2022-10-18)

### Bug Fixes

- **core:** fix bip32/ecpair, API vs Interface ([bec9c1e](https://github.com/BitGo/BitGoJS/commit/bec9c1e6ff0c23108dc27e171abdd3e4d2cfdfb1))

### Features

- **abstract-eth:** validate istss for evms ([29f0b5a](https://github.com/BitGo/BitGoJS/commit/29f0b5aa875c4a6a727f9b3e9a073740230c4fb8))

## [1.0.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.23...@bitgo/abstract-eth@1.0.1) (2022-07-19)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.23](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.21...@bitgo/abstract-eth@1.0.1-rc.23) (2022-07-19)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.22](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.21...@bitgo/abstract-eth@1.0.1-rc.22) (2022-07-18)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.21](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.20...@bitgo/abstract-eth@1.0.1-rc.21) (2022-07-15)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.20](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.18...@bitgo/abstract-eth@1.0.1-rc.20) (2022-07-15)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.19](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.18...@bitgo/abstract-eth@1.0.1-rc.19) (2022-07-14)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.17](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.16...@bitgo/abstract-eth@1.0.1-rc.17) (2022-07-12)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.16](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.15...@bitgo/abstract-eth@1.0.1-rc.16) (2022-07-11)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.15](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.14...@bitgo/abstract-eth@1.0.1-rc.15) (2022-07-07)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.14](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.13...@bitgo/abstract-eth@1.0.1-rc.14) (2022-07-05)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.13](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.12...@bitgo/abstract-eth@1.0.1-rc.13) (2022-07-01)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.12](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.11...@bitgo/abstract-eth@1.0.1-rc.12) (2022-06-30)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.11](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.10...@bitgo/abstract-eth@1.0.1-rc.11) (2022-06-30)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.10](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.8...@bitgo/abstract-eth@1.0.1-rc.10) (2022-06-29)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.9](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.8...@bitgo/abstract-eth@1.0.1-rc.9) (2022-06-29)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.8](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.7...@bitgo/abstract-eth@1.0.1-rc.8) (2022-06-27)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.7](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.6...@bitgo/abstract-eth@1.0.1-rc.7) (2022-06-23)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.6](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.5...@bitgo/abstract-eth@1.0.1-rc.6) (2022-06-22)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.5](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.4...@bitgo/abstract-eth@1.0.1-rc.5) (2022-06-21)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.4](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.3...@bitgo/abstract-eth@1.0.1-rc.4) (2022-06-16)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.3](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.2...@bitgo/abstract-eth@1.0.1-rc.3) (2022-06-14)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.2](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.1...@bitgo/abstract-eth@1.0.1-rc.2) (2022-06-14)

**Note:** Version bump only for package @bitgo/abstract-eth

## [1.0.1-rc.1](https://github.com/BitGo/BitGoJS/compare/@bitgo/abstract-eth@1.0.1-rc.0...@bitgo/abstract-eth@1.0.1-rc.1) (2022-06-13)

**Note:** Version bump only for package @bitgo/abstract-eth

## 1.0.1-rc.0 (2022-06-10)

**Note:** Version bump only for package @bitgo/abstract-eth
