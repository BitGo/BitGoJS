# BitGo UTXO library (bitgo-utxo-lib)
[![Build Status](https://travis-ci.org/BitGo/bitgo-utxo-lib.png?branch=master)](https://travis-ci.org/BitGo/bitgo-utxo-lib)
[![NPM](https://img.shields.io/npm/v/bitgo-utxo-lib.svg)](https://www.npmjs.org/package/bitgo-utxo-lib)
[![Known Vulnerabilities](https://snyk.io/test/github/BitGo/bitgo-utxo-lib/badge.svg?targetFile=package.json)](https://snyk.io/test/github/BitGo/bitgo-utxo-lib?targetFile=package.json)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Originally a fork of [bitcoinjs-lib](https://github.com/BitGo/bitcoinjs-lib); we evolved this library to support the transaction building process of different UTXO based coins.

## Supported coins
- Bitcoin
- Bitcoin Cash
- Bitcoin Gold
- Zcash (Sapling compatible)
- Dash

## Features
- Clean: Pure JavaScript, concise code, easy to read.
- Tested: Coverage > 90%, third-party integration tests.
- Compatible: Works on Node.js and all modern browsers.
- Powerful: Support for advanced features, such as multi-sig, HD Wallets.
- Secure: Strong random number generation, PGP signed releases, trusted developers.
- Principled: No support for browsers with RNG (IE < 11)
- Standardized: Node community coding style, Browserify, Node's stdlib and Buffers.
- Experiment-friendly: Mainnet and Testnet support.
- Multicoin support: Configurable behaviour based on [network](https://github.com/BitGo/bitgo-utxo-lib/blob/master/src/networks.js) objects.
- Backed by [BitGo](https://www.bitgo.com/info/)

## Installation
``` bash
npm install bitgo-utxo-lib
```

## Setup
### Node.js
``` javascript
var bitGoUTXO = require('bitgo-utxo-lib')
```

### Browser
If you're familiar with how to use browserify, ignore this and proceed normally.
These steps are advisory only,  and may not be suitable for your application.

[Browserify](https://github.com/substack/node-browserify) is assumed to be installed for these steps.

For your project, create an `index.js` file
``` javascript
let bitGoUTXO = require('bitgo-utxo-lib')

// your code here
function myFunction () {
	return bitGoUTXO.ECPair.makeRandom().toWIF()
}

module.exports = {
	myFunction
}
```

Now, to compile for the browser:
``` bash
browserify index.js --standalone foo > app.js
```

You can now put `<script src="app.js" />` in your web page,  using `foo.myFunction` to create a new Bitcoin private key.

**NOTE**: If you uglify the javascript, you must exclude the following variable names from being mangled: `BigInteger`, `ECPair`, `Point`.
This is because of the function-name-duck-typing used in [typeforce](https://github.com/dcousens/typeforce).

Example:
``` bash
uglifyjs ... --mangle --reserved 'BigInteger,ECPair,Point'
```

**NOTE**: This library tracks Node LTS features,  if you need strict ES5,  use [`--transform babelify`](https://github.com/babel/babelify) in conjunction with your `browserify` step (using an [`es2015`](http://babeljs.io/docs/plugins/preset-es2015/) preset).

**NOTE**: If you expect this library to run on an iOS 10 device, ensure that you are using [buffer@5.0.5](https://github.com/feross/buffer/pull/155) or greater.


### Typescript or VSCode users
Type declarations for Typescript are available for version `^3.0.0` of the library.
``` bash
npm install @types/bitgo-utxo-lib
```

You can now use `bitgo-utxo-lib` as a typescript compliant library.
``` javascript
import { HDNode, Transaction } from 'bitgo-utxo-lib'
```

For VSCode (and other editors), users are advised to install the type declarations, as Intellisense uses that information to help you code (autocompletion, static analysis).

## Examples
The below examples are implemented as integration tests, they should be very easy to understand.
Otherwise, pull requests are appreciated.
Some examples interact (via HTTPS) with a 3rd Party Blockchain Provider (3PBP).

### Bitcoin

- [Generate a random address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L12)
- [Generate an address from a SHA256 hash](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L19)
- [Import an address via WIF](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L29)
- [Generate a 2-of-3 P2SH multisig address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L36)
- [Generate a SegWit address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L50)
- [Generate a SegWit P2SH address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L60)
- [Generate a SegWit 3-of-4 multisig address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L71)
- [Generate a SegWit 2-of-2 P2SH multisig address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L86)
- [Support the retrieval of transactions for an address (3rd party blockchain)](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L100)
- [Generate a Testnet address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L121)
- [Generate a Litecoin address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/addresses.js#L131)
- [Create a 1-to-1 Transaction](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L14)
- [Create a 2-to-2 Transaction](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L28)
- [Create (and broadcast via 3PBP) a typical Transaction](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L46)
- [Create (and broadcast via 3PBP) a Transaction with an OP\_RETURN output](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L88)
- [Create (and broadcast via 3PBP) a Transaction with a 2-of-4 P2SH(multisig) input](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L115)
- [Create (and broadcast via 3PBP) a Transaction with a SegWit P2SH(P2WPKH) input](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L151)
- [Create (and broadcast via 3PBP) a Transaction with a SegWit 3-of-4 P2SH(P2WSH(multisig)) input](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/transactions.js#L183)
- [Import a BIP32 testnet xpriv and export to WIF](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L8)
- [Export a BIP32 xpriv, then import it](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L15)
- [Export a BIP32 xpub](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L26)
- [Create a BIP32, bitcoin, account 0, external address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L35)
- [Create a BIP44, bitcoin, account 0, external address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L50)
- [Create a BIP49, bitcoin testnet, account 0, external address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L66)
- [Use BIP39 to generate BIP32 addresses](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/bip32.js#L83)
- [Create (and broadcast via 3PBP) a Transaction where Alice can redeem the output after the expiry](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/cltv.js#L37)
- [Create (and broadcast via 3PBP) a Transaction where Alice and Bob can redeem the output at any time](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/cltv.js#L71)
- [Create (but fail to broadcast via 3PBP) a Transaction where Alice attempts to redeem before the expiry](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/cltv.js#L104)
- [Recover a private key from duplicate R values](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/crypto.js#L14)
- [Recover a BIP32 parent private key from the parent public key, and a derived, non-hardened child private key](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/crypto.js#L115)
- [Generate a single-key stealth address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/stealth.js#L70:)
- [Generate a single-key stealth address (randomly)](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/stealth.js#L89:)
- [Recover parent recipient.d, if a derived private key is leaked (and nonce was revealed)](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/stealth.js#L105)
- [Generate a dual-key stealth address](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/stealth.js#L122)
- [Generate a dual-key stealth address (randomly)](https://github.com/BitGo/bitgo-utxo-lib/blob/master/test/integration/stealth.js#L145)

If you have a use case that you feel could be listed here, please [ask for it](https://github.com/BitGo/bitgo-utxo-lib/issues/new)!

### Running the test suite

``` bash
npm test
npm run-script coverage
```

## Complementing Libraries
- [BIP21](https://github.com/bitcoinjs/bip21) - A BIP21 compatible URL encoding utility library
- [BIP38](https://github.com/bitcoinjs/bip38) - Passphrase-protected private keys
- [BIP39](https://github.com/bitcoinjs/bip39) - Mnemonic generation for deterministic keys
- [BIP32-Utils](https://github.com/bitcoinjs/bip32-utils) - A set of utilities for working with BIP32
- [BIP66](https://github.com/bitcoinjs/bip66) - Strict DER signature decoding
- [BIP69](https://github.com/bitcoinjs/bip69) - Lexicographical Indexing of Transaction Inputs and Outputs
- [Base58](https://github.com/cryptocoinjs/bs58) - Base58 encoding/decoding
- [Base58 Check](https://github.com/bitcoinjs/bs58check) - Base58 check encoding/decoding
- [Bech32](https://github.com/bitcoinjs/bech32) - A BIP173 compliant Bech32 encoding library
- [coinselect](https://github.com/bitcoinjs/coinselect) - A fee-optimizing, transaction input selection module for bitcoinjs-lib.
- [merkle-lib](https://github.com/bitcoinjs/merkle-lib) - A performance conscious library for merkle root and tree calculations.
- [minimaldata](https://github.com/bitcoinjs/minimaldata) - A module to check bitcoin policy: SCRIPT_VERIFY_MINIMALDATA


## LICENSE [MIT](LICENSE)
