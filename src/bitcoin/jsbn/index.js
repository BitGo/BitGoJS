//
// index.js - Module definition for JSBN
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BigInteger = require('./jsbn2.js');
var ec = require('./ec.js');
var rng = require('./rng.js');

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

*/


module.exports = {
  BigInteger: BigInteger,
  ECCurveFp: ec.ECCurveFP,
  ECFieldElementFp: ec.ECFieldElementFp,
  SecureRandom: rng
}
