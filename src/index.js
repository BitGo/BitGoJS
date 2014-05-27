//
// index.js - Module definition for BitGoJS
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BigInteger = require('./bitcoin/jsbn/jsbn2.js');

// TODO:  CLEAN THIS UP.
//   REMOVE THE UNNECESSARY GARBAGE
/*
    $SRCDIR/src/crypto-js/src/Crypto.js \
    $SRCDIR/src/crypto-js/src/CryptoMath.js \
    $SRCDIR/src/crypto-js/src/BlockModes.js \
    $SRCDIR/src/crypto-js/src/SHA256.js \
    $SRCDIR/src/crypto-js/src/AES.js \
    $SRCDIR/src/crypto-js/src/PBKDF2.js \
    $SRCDIR/src/crypto-js/src/HMAC.js \
    $SRCDIR/src/sha512.js \

    $SRCDIR/src/crypto-js-etc/ripemd160.js \

    $SRCDIR/src/node-scrypt.js \

    $SRCDIR/src/events/eventemitter.js \
    $SRCDIR/src/bip38.js \
    $SRCDIR/src/transaction.js \
    $SRCDIR/src/bitcoin.js"
*/

var Transactions = require('./bitcoin/transaction');

module.exports = {
  Address: require('./bitcoin/address'),
  BitGo: require('./bitgo.js'),
  Base58: require('./bitcoin/base58'),
  BIP32: require('./bitcoin/bip32'),
  BigInteger: BigInteger,
  ECDSA: require('./bitcoin/ecdsa'),
  ECKey: require('./bitcoin/eckey'),
  Opcode: require('./bitcoin/opcode'),
  Script: require('./bitcoin/script'),
  SecureRandom: require('./bitcoin/jsbn/rng'),
  Transaction: Transactions.Transaction,
  TransactionIn: Transactions.TransactionIn,
  TransactionOut: Transactions.TransactionOut,
  Util: require('./bitcoin/util')
}

// Initialize the library


var Bitcoin = module.exports;

/*
 * BitGo additions for globally selecting network type
 */
Bitcoin.setNetwork = function(network) {
  if (network == 'prod') {
    Bitcoin.network = 'prod';
    Bitcoin.Address.pubKeyHashVersion = 0x00;
    Bitcoin.Address.p2shVersion    = 0x5;
    Bitcoin.ECKey.privateKeyPrefix = 0x80;
  } else {
    // test network
    Bitcoin.network = 'testnet';
    Bitcoin.Address.pubKeyHashVersion = 0x6f;
    Bitcoin.Address.p2shVersion    = 0xc4;
    Bitcoin.ECKey.privateKeyPrefix = 0xef;
  }
}
Bitcoin.setNetwork('testnet');

// Add randomness from the OS if we're loaded in node.js.
var sjcl = require('./bitcoin/sjcl.min');
var systemCrypto = require('crypto');
if (systemCrypto) {
  var buf = Bitcoin.Util.hexToBytes(systemCrypto.randomBytes(1024/8).toString('hex'));
  sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes");
}

// Start randomness collectors if loaded in the browser.
if (typeof(window) != 'undefined') {
  var rng = new Bitcoin.SecureRandom();
  rng.clientSideRandomInit();
}
