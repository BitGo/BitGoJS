//
// Send money from a wallet on BitGo
// Defaults to work on BitGo test environment at https://test.bitgo.com
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

if (process.argv.length < 7) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] +
    " <user> <pass> <otp> <walletId> <walletPassphrase>");

  console.log("user: user email (on test.bitgo.com)");
  console.log("pass: password");
  console.log("otp: one-time password, 0000000 on test");
  console.log("walletId: wallet ID (first address on the wallet)");
  console.log("walletPassphrase: passphrase to decrypt the user key");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = process.argv[4];
var walletId = process.argv[5];
var walletPassphrase = process.argv[6];

var bitgo = new BitGoJS.BitGo();

var sendBitcoin = function() {
  console.log("Getting wallet..");
  var recipients = {};
  recipients['2N4Xz4itCdKKUREiySS7oBzoXUKnuxP4nRD'] = 0.1 * 1e8;
  recipients['2NB5G2jmqSswk7C427ZiHuwuAt1GPs5WeGa'] = 0.2 * 1e8;

  bitgo.wallets().get({id: walletId}, function(err, wallet) {
    if (err) { console.log("Error getting wallet!"); console.dir(err); return process.exit(-1); }
    console.log("Balance is: " + (wallet.balance() / 1e8).toFixed(4));

    wallet.sendMany({ recipients: recipients, walletPassphrase: walletPassphrase }, function(err, result) {
      if (err) { console.log("Error sending coins!"); console.dir(err); return process.exit(-1); }

      console.dir(result);
    });
  });
};

// Authenticate first
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) { console.dir(err); throw new Error("Could not authenticate!"); }
  console.log("Unlocking account.." );
  bitgo.unlock({ otp: otp }, function(err) {
    if (err) { console.dir(err); throw new Error("Could not unlock!"); }
    sendBitcoin();
  });
});
