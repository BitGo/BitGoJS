## 2.19.0 or 3.0.0 ()

* Update [dependency versions](modules/account-lib/package.json)
* Added exports for base utilities and curve logic (Ed25519BIP32)
* Added methods for crypto utilities
* Updated tests

### Algorand
* Add optional `stateProofKey` for base coin
* Add export for interfaces
* Update JSDocs documentation
* Add/Update key registration methods
* Update transaction validation
* Update transaction schema validation
* Update util validation

### Avalanche
* Update import paths
* Add transaction methods

### Base Coin
* Refactor keypair return value reconciliation
* Export additional ERC types (721, 1155)
* Add additional Error extensions
* Export BlsKeyPair for library usage

### Polkadot
* Add claims builder class
* Export Polkadot Hexstring for library usage
* Add additional [interface options](modules/account-lib/src/coin/dot/iface.ts)
* Update TxMethod interface enum values
* Export additional usable methods for withdrawal, claims, and transactions
* Refactor keypair function inner logic
* Add singleton registry
* Add/Update transaction methods
* Add methods for stake withdrawals

### Ethereum
* Update import paths
* Add support for tokens: ERC721, ERC1155
* Add transaction logic for ERC721 and ERC1155
* Add NFT transaction builder

### Ethereum 2
* Refactor function inner logic for keypairs

### Hedera
* Update import paths
* Add Errors, Address interfaces and validation to utilities

### Near
* Add contract method names
* Add contract call class
* Add validation errors
* Add additoinal interfaces
* Add staking activation, deactivation, and withdrawal builders
* Update base transaction methods from not implemented to active use

### Wrapped Bitcoin
* Update import paths

### Solana
* Add mint and general validation
* Add Ata Initialization class
* Add token transfer constant, interface, and interface enum
* Export new classes for external usage of library
* Add TokenTransfer for Instructions
* Add functionality for encoding and decoding token data
* Add TokenTransfer transaction builder
* Add TokenTransfer to Solana's base transaction class methods
* Add additional utilities for token address

### Stacks
* Add utility methods and validation for library usage
