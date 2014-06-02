//
// Create a multi-sig wallet at bitgo
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

if (process.argv.length < 5) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <otp>");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = process.argv[4];

var bitgo = new BitGoJS.BitGo();

var createWallet = function() {
  try {
    var userKey = bitgo.keychains().create();
    var backupKey = bitgo.keychains().create();

    var options = {
      label: 'key1',
      xpub: userKey.xpub,
      encryptedXprv: bitgo.encrypt(password, userKey.xprv)
    };
    bitgo.keychains().add(options, function(err, keychain) {
      if (err) { throw err; }
      var options = {
        label: 'key2',
        xpub: backupKey.xpub
      };
      bitgo.keychains().add(options, function(err, keychain) {
        if (err) { throw err; }
        var options = {
          label: 'new wallet',
          m: 2,
          n: 3,
          keychains: [userKey.xpub, backupKey.xpub]
        };
        bitgo.wallets().add(options, function(err, wallet) {
          if (err) { throw err; }
          console.log("Wallet Created!");
          console.dir(wallet);
        });
      });
    });
  } catch(e) {
    console.dir(e.message);
  }
}

bitgo.authenticate(user, password, otp, function(err, result) {
  if (err) {
    console.dir(err);
  }
  console.log("Creating wallet: " );
  createWallet();
});
