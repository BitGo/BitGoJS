//
// Show recent transactions within a wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');


if (process.argv.length < 5) {
  console.log("usage:\n\t" + process.argv[0] + " " + process.argv[1] + " <user> <pass> <otp> <address>");
  process.exit(-1);
}

var user = process.argv[2];
var password = process.argv[3];
var otp = process.argv[4];

var addressToCheck = 'mwfZSo1rwkxvU5axMEYQJkgEb1qgw8geQ9';
if (process.argv.length > 5) {
  addressToCheck = process.argv[5];
}

var bitgo = new BitGoJS.BitGo();

// First, Authenticate
bitgo.authenticate(user, password, otp, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error("Could not auth!");
  }
  console.log("Logged in!" );

  // Now get the wallet
  bitgo.wallets().get({type: 'bitcoin', address: addressToCheck}, function(err, wallet) {
    if (err) { console.log(err); process.exit(-1); }
    console.log("Balance is: " + (wallet.balance() / 1e8).toFixed(4));

    // Now get the transactions
    wallet.transactions({}, function(err, result) {
      if (err) { console.log(err); process.exit(-1); }
      for (var index = 0; index < result.transactions.length; ++index) {
        var tx = result.transactions[index];
        var output = tx.date;

        var value = 0;
        for (var entriesIndex = 0; entriesIndex < tx.entries.length; ++entriesIndex) {
          if (tx.entries[entriesIndex].account === wallet.address()) {
            value += tx.entries[entriesIndex].value;
          }
        }

        var verb = (value > 0) ? 'received' : 'sent';

        output += ' ' + verb + ' ' + (value / 1e8).toFixed(8) + 'BTC';
        console.log(output);
      }
    });
  });
});