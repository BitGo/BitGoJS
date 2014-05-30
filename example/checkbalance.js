//
// Check the balance of a testnet bitcoin address
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
  console.log("Balance is: " + (wallet.balance / 1e8).toFixed(4));
});
