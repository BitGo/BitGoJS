//
// Create a multi-sig wallet at bitgo
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

if (process.argv.length < 5) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <otp> <label>");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = process.argv[4];

var label = 'New API Wallet';
if (process.argv.length > 5) {
   label = process.argv[5];
}

var bitgo = new BitGoJS.BitGo();

var createWallet = function() {
  try {
    var userKey = bitgo.keychains().create();
    var backupKey = bitgo.keychains().create();

    // First create the user key
    var options = {
      label: 'key1',
      xpub: userKey.xpub,
      encryptedXprv: bitgo.encrypt(password, userKey.xprv)
    };
    bitgo.keychains().add(options, function(err, keychain) {
      if (err) {
        console.dir(err);
        throw new Error("Could not create the user keychain");
      }
      console.log("User keychain xPub: " + userKey.xpub);

      // Now create the backup key
      var options = {
        label: 'key2',
        xpub: backupKey.xpub
      };
      bitgo.keychains().add(options, function(err, keychain) {
        if (err) {
          console.dir(err);
          throw new Error("Could not create the backup keychain");
        }
        console.log("Backup keychain xPub: " + backupKey.xpub);

        // Now tell BitGo to create their server side key
        bitgo.keychains().createBitGo({}, function(err, keychain) {
          if (err) {
            throw new Error("Could not create 3rd keychain on BitGo");
          }
          console.log("BitGo service keychain xPub: " + keychain.xpub);

          var options = {
            label: label,
            m: 2,
            n: 3,
            keychains: [
              { xpub: userKey.xpub },
              { xpub: backupKey.xpub },
              { xpub: keychain.xpub} ]
          };
          bitgo.wallets().add(options, function (err, wallet) {
            if (err) {
              console.dir(err);
              throw new Error("Could not add wallet on BitGo");
            }
            console.log("Wallet Created!");
            console.dir(wallet);
          });
        });
      });
    });
  } catch(e) {
    console.dir(e.message);
  }
}

// Authenticate first
bitgo.authenticate(user, password, otp, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error("Could not authenticate!");
  }

  console.log("Unlock account: " );
  bitgo.unlock(otp, function(err) {
    if (err) {
      console.dir(err);
      throw new Error("Could not unlock!");
    }

    console.log("Creating wallet: " );
    // Actually create wallet here
    createWallet();
  })

});
