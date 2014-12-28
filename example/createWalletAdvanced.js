//
// Create a multi-sig wallet at bitgo (advanced version)
// This tool will help you see how to use the BitGo API to easily create a wallet.
//
// In this form, it creates 2 keys on the host which runs this example.
// It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES!!
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
    // Create the user and backup key. Remember to back these up!!
    var userKey = bitgo.keychains().create();
    var backupKey = bitgo.keychains().create();

    // Add keychains to BitGo
    var options = {
      label: 'key1',
      xpub: userKey.xpub,
      encryptedXprv: bitgo.encrypt({ password: password, input: userKey.xprv })
    };
    bitgo.keychains().add(options, function(err, keychain) {
      if (err) {
        console.dir(err);
        throw new Error("Could not create the user keychain");
      }
      console.log("User keychain xPub: " + userKey.xpub);

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
          bitgo.wallets().add(options, function (err, result) {
            if (err) {
              console.dir(err);
              throw new Error("Could not add wallet on BitGo");
            }
            console.log("Wallet Created!");
            console.dir(result.wallet);
            console.log("\n\nBACK THIS UP: ");
            console.log("User keychain encrypted xPrv - WRITE IT DOWN: " + bitgo.encrypt({ password: password, input: userKey.xprv }));
            console.log("Backup keychain encrypted xPrv - WRITE IT DOWN: " + bitgo.encrypt({ password: password, input: userKey.xprv }));
          });
        });
      });
    });
  } catch(e) {
    console.dir(e.message);
  }
};

// Authenticate first
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error("Could not authenticate!");
  }
  console.log("Unlocking account.. " );
  bitgo.unlock({otp: otp}, function(err) {
    if (err) { console.dir(err); throw new Error("Could not unlock!"); }
    console.log("Creating wallet.. " );
    createWallet();
  });
});
