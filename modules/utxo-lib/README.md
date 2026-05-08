# BitGo UTXO library

This library is a wrapper around [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) adding altcoin support.

## Features

- Multicoin support: Configurable behaviour based on [network](https://github.com/BitGo/bitgo-utxo-lib/blob/master/src/networks.js) objects.
- Backed by [BitGo](https://www.bitgo.com/info/)

## Installation

```bash
# using npm
npm install @bitgo/utxo-lib

# using yarn
yarn add @bitgo/utxo-lib
```

## Setup

JavaScript (ESM)

```javascript
import * as utxolib from '@bitgo/utxo-lib';
```

NodeJS (CJS)

```javascript
const utxolib = require('@bitgo/utxo-lib');
```

## Usage

Support for parsing and building altcoin transactions is provided by the following methods

```typescript
utxolib.bitgo.createTransactionFromBuffer(buffer, network): UtxoTransaction
// (similarly `createTransactionFromHex(string, network)`)

utxolib.bitgo.createTransactionBuilderForNetwork(network): UtxoTransactionBuilder

utxolib.bitgo.createTransactionBuilderFromTransaction(tx): UtxoTransactionBuilder
```

The `UtxoTransaction(Builder)` classes have the same interface as the `Transaction` type in `bitcoinjs-lib` .

## Supported coins

| Network                     | Mainnet                        | Testnet                               |
| --------------------------- | ------------------------------ | ------------------------------------- |
| Bitcoin                     | `utxolib.networks.bitcoin`     | `utxolib.networks.testnet`            |
| Bitcoin Cash                | `utxolib.networks.bitcoincash` | `utxolib.networks.bitcoincashTestnet` |
| Bitcoin Gold                | `utxolib.networks.bitcoingold` | `utxolib.networks.bitcoingoldTestnet` |
| Bitcoin SV (Satoshi Vision) | `utxolib.networks.bitcoinsv`   | `utxolib.networks.bitcoinsvTestnet`   |
| Dash                        | `utxolib.networks.dash`        | `utxolib.networks.dash`               |
| eCash                       | `utxolib.networks.ecash`       | `utxolib.networks.ecashTestnet`       |
| Litecoin                    | `utxolib.networks.litecoin`    | `utxolib.networks.litecoinTest`       |
| Zcash                       | `utxolib.networks.zcash`       | `utxolib.networks.zcashTest`          |

> [Bitcoin SV](https://blog.bitgo.com/bsv-deprecation-6b3fff4df34c) no longer supports sending funds to BitGo wallets. Existing customers with Bitcoin SV in BitGo wallets will still be able to access and sweep funds to an external Bitcoin SV wallet.
