# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 6.0.0 (2023-12-09)

### Bug Fixes

- **sdk-coin-polygon:** fix issues ([85e9396](https://github.com/BitGo/BitGoJS/commit/85e93967abd056f5054198f385a1b109246a281f))
- **statics:** make corrections for arbeth and opeth ([5dfc405](https://github.com/BitGo/BitGoJS/commit/5dfc405a36fc97b2c902fec44562b169d8013a18))

### Code Refactoring

- **abstract-eth:** add common method to abstract-eth ([df6eea5](https://github.com/BitGo/BitGoJS/commit/df6eea5d299c415b30263d1713335c14e5abef4a))

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

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

# 5.0.0 (2023-12-05)

### Bug Fixes

- **sdk-coin-polygon:** fix issues ([85e9396](https://github.com/BitGo/BitGoJS/commit/85e93967abd056f5054198f385a1b109246a281f))
- **statics:** make corrections for arbeth and opeth ([5dfc405](https://github.com/BitGo/BitGoJS/commit/5dfc405a36fc97b2c902fec44562b169d8013a18))

### Code Refactoring

- **abstract-eth:** add common method to abstract-eth ([df6eea5](https://github.com/BitGo/BitGoJS/commit/df6eea5d299c415b30263d1713335c14e5abef4a))

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

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

# 4.0.0 (2023-11-28)

### Bug Fixes

- **sdk-coin-polygon:** fix issues ([85e9396](https://github.com/BitGo/BitGoJS/commit/85e93967abd056f5054198f385a1b109246a281f))
- **statics:** make corrections for arbeth and opeth ([5dfc405](https://github.com/BitGo/BitGoJS/commit/5dfc405a36fc97b2c902fec44562b169d8013a18))

### Code Refactoring

- **abstract-eth:** add common method to abstract-eth ([df6eea5](https://github.com/BitGo/BitGoJS/commit/df6eea5d299c415b30263d1713335c14e5abef4a))

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

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

# 3.0.0 (2023-11-24)

### Bug Fixes

- **sdk-coin-polygon:** fix issues ([85e9396](https://github.com/BitGo/BitGoJS/commit/85e93967abd056f5054198f385a1b109246a281f))
- **statics:** make corrections for arbeth and opeth ([5dfc405](https://github.com/BitGo/BitGoJS/commit/5dfc405a36fc97b2c902fec44562b169d8013a18))

### Code Refactoring

- **abstract-eth:** add common method to abstract-eth ([df6eea5](https://github.com/BitGo/BitGoJS/commit/df6eea5d299c415b30263d1713335c14e5abef4a))

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

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

# 2.0.0 (2023-11-17)

### Bug Fixes

- **sdk-coin-polygon:** fix issues ([85e9396](https://github.com/BitGo/BitGoJS/commit/85e93967abd056f5054198f385a1b109246a281f))
- **statics:** make corrections for arbeth and opeth ([5dfc405](https://github.com/BitGo/BitGoJS/commit/5dfc405a36fc97b2c902fec44562b169d8013a18))

### Code Refactoring

- **abstract-eth:** add common method to abstract-eth ([df6eea5](https://github.com/BitGo/BitGoJS/commit/df6eea5d299c415b30263d1713335c14e5abef4a))

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

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

# 1.5.0 (2023-11-13)

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

# 1.4.0 (2023-11-13)

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

# 1.3.0 (2023-11-13)

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

# 1.2.0 (2023-10-20)

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))

# 1.1.0 (2023-10-18)

### Features

- **sdk-coin-opeth:** add opeth sdk skeleton ([42fbefa](https://github.com/BitGo/BitGoJS/commit/42fbefa54f22fa5bdaef4150ef3a643843ec8684))
