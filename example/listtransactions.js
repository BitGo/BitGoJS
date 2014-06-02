//
// Show recent transactions within a wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index.js');

var addressToCheck = 'mwfZSo1rwkxvU5axMEYQJkgEb1qgw8geQ9';
if (process.argv.length > 2) {
  addressToCheck = process.argv[2];
}

var bitgo = new BitGoJS.BitGo();
bitgo.wallets().get({type: 'bitcoin', address: addressToCheck}, function(err, wallet) {
  if (err) { console.log(err); process.exit(-1); }
  console.log("Balance is: " + (wallet.balance() / 1e8).toFixed(4));

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
