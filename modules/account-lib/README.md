# BitGo Account Lib

This library is responsible for building and signing transactions for
account-based coins (for example, Ethereum, Algorand, EOS, Tron, etc.). Account
Lib was developed for BitGo and BitGo's multi-sig wallets, but it can also be
used independently, outside of our wallet ecosystem.

> Account Lib can be used in an offline environment.

## Supported Coins

Below is the list of coins supported by this library -- as well as those that
are on the roadmap.

| Coin             | Mainnet Ticker | Testnet Ticker | Supported In Library |
| :--------------- | :------------- | :------------- | :------------------- |
| Alogrand         | algo           | talgo          | Yes                  |
| CELO             | celo           | tcelo          | Yes                  |
| Ethereum         | eth            | teth           | Yes                  |
| Ethereum Classic | etc            | tetc           | Yes                  |
| RSK              | rbtc           | trbtc          | Yes                  |
| Stellar          | xlm            | txlm           | Not yet...           |
| Tezos            | xtz            | txtz           | Yes                  |
| Tron             | trx            | ttrx           | Yes                  |

## Core Concepts

### TransactionBuilder

The `TranssactionBuilder` class guides a user through the construction of a
transaction. The purpose of the `TransactionBuilder` is to yield a `Transaction`
object that can broadcast to the network.

### Transaction

`Transaction` objects are JavaScript representations of blockchain transactions
that implement protocol specific validation rules. `Transactions` provide
encoding mechanisms that allow them to be validly broadcast to their respective
network.

#### Transaction Types

`TransactionBuilder` supports the following transaction types:

- **Send**: Transfers funds from a wallet.

- **Wallet Initialization**: Initializes a wallet's account on the network
  (e.g., multi-sig contract deployment).

- **Address Initialization**: Initializes a wallet's address on the network
  (e.g., forwarder contract deployment).

- **Account Update**: Updates an account on the network (e.g., public key
  revelation operation for Tezos).

### Offline Availability

Account Lib was designed to be used for offline signings in an offline
environment.

---

## Installation

Install the library with npm. If you plan on contributing to the project, you
may wish to follow different installation instructions
[outlined in this doc](DEVELOPER.md).

```
$ cd <your_project>
$ npm install @bitgo/account-lib
```

## Usage

Below is an example that demonstrates how the library can be used to build and
sign a Tron testnet transaction.

### Instantiation

Instantiate the `TransactionBuilder` for the coin you want to work with:

```javascript
// Import the package (javascript import)
const accountLib = require('@bitgo/account-lib');
// or import the pacakage using typescript
import * as accountLib from '@bitgo/account-lib';

// Instantiate the Transaction Builder for Tron (testnet)
const txBuilder = accountLib.getBuilder('ttrx');
```

### Transaction Construction and Signing

Use the transaction builder instance (created in the previous step) to sign a
transaction:

```javascript
// Define an unsigned Tron transaction object
const unsignedBuildTransaction = {
  visible: false,
  txID: '80b8b9eaed51c8bba3b49f7f0e7cc5f21ac99a6f3e2893c663b544bf2c695b1d',
  raw_data: {
    contract: [
      {
        parameter: {
          value: {
            amount: 1718,
            owner_address: '41c4530f6bfa902b7398ac773da56106a15af15f92',
            to_address: '4189ffaf9da8c6fae32189b2e6dce228249b1129aa',
          },
          type_url: 'type.googleapis.com/protocol.TransferContract',
        },
        type: 'TransferContract',
      },
    ],
    ref_block_bytes: '90e4',
    ref_block_hash: 'a018bf9892ddb138',
    expiration: 1571811468000,
    timestamp: 1571811410819,
  },
  raw_data_hex:
    '0a0290e42208a018bf9892ddb13840e0c58ebadf2d5a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541c4530f6bfa902b7398ac773da56106a15af15f9212154189ffaf9da8c6fae32189b2e6dce228249b1129aa18b60d7083878bbadf2d',
};

// Use that object to build and sign a transaction
txBuilder.from(unsignedBuildTransaction);
txBuilder.sign({
  key: 'A81B2E0C55A7E2B2E837ZZC437A6397B316536196989A6F09EE49C19AD33590W',
});
const tx = await txBuilder.build();
```

More examples:

- [Tron transaction building examples](https://github.com/BitGo/bitgo-account-lib/blob/master/test/unit/coin/trx/transactionBuilder.ts)
- [Tezos transaction building examples](https://github.com/BitGo/bitgo-account-lib/blob/master/test/unit/coin/xtz/transactionBuilder.ts)

## Developers

If you'd like to contribute to this project, see the
[developer guide](DEVELOPER.md) for contribution norms and expectations.

There is a near-term goal to move this library toward a plugin-based
architecture for coin registration. Until then, PRs adding support for new coins
will be put on hold.
