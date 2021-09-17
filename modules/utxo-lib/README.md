# BitGo UTXO library

This library is a wrapper around [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) adding altcoin support.

## Features
- Multicoin support: Configurable behaviour based on [network](https://github.com/BitGo/bitgo-utxo-lib/blob/master/src/networks.js) objects.
- Backed by [BitGo](https://www.bitgo.com/info/)

## Installation
``` bash
npm install @bitgo/utxo-lib
```

## Setup
### Node.js
```typescript
import * as utxolib from '@bitgo/utxo-lib'
```


## Usage

Support for parsing and building altcoin transactions is provided by the following methods

* `utxolib.bitgo.createTransactionFromBuffer(buffer, network): UtxoTransaction` (similarly `createTransactionFromHex(string, network)`)
* `utxolib.bitgo.createTransactionBuilderForNetwork(network): UtxoTransactionBuilder`
* `utxolib.bitgo.createTransactionBuilderFromTransaction(tx): UtxoTransactionBuilder`

The `UtxoTransaction(Builder)` classes have the same interface as the `Transaction` type in `bitcoinjs-lib` .

## Supported coins

|Network|Mainnet|Testnet|
|---|---|---|
|Bitcoin|`utxolib.networks.bitcoin`|`utxolib.networks.testnet`|
|Bitcoin Cash|`utxolib.networks.bitcoincash`|`utxolib.networks.bitcoincashTestnet`|
|Bitcoin Gold|`utxolib.networks.bitcoingold`|`utxolib.networks.bitcoingoldTestnet`|
|Bitcoin SV (Satoshi Vision)|`utxolib.networks.bitcoinsv`|`utxolib.networks.bitcoinsvTestnet`|
|Dash|`utxolib.networks.dash`|`utxolib.networks.dash`|
|Litecoin|`utxolib.networks.litecoin`|`utxolib.networks.litecoinTest`|
|Zcash|`utxolib.networks.zcash`|`utxolib.networks.zcashTest`|

