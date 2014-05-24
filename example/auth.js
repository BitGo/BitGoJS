//
// Trivial example of using the BitGo SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

var bitgo = new BitGoJS.BitGo();
console.log(bitgo.version());

