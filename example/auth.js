//
// Trivial example of using the BitGo SDK
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

var bitgo = new BitGoJS.BitGo();
if (process.argv.length < 5) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <otp>");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = process.argv[4];

console.log("BitGoJS library version: " + bitgo.version());
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) {
    return console.dir(err);
  }
  console.dir(result);
});

