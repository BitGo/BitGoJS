//
// Show recent transactions within a wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length <= 5) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <user> <pass> <otp> <walletId>');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = process.argv[4];
const id = process.argv[5];

const bitgo = new BitGoJS.BitGo();

// First, Authenticate
bitgo.authenticate({ username: user, password: password, otp: otp }, function(err, result) {
  if (err) {
    console.dir(err);
    throw new Error('Could not auth!');
  }
  console.log('Logged in!' );

  // Now get the wallet
  bitgo.wallets().get({ type: 'bitcoin', id: id }, function(err, wallet) {
    if (err) { console.log(err); process.exit(-1); }
    console.log('Balance is: ' + (wallet.balance() / 1e8).toFixed(4));

    // Now get the transactions
    wallet.transactions({}, function(err, result) {
      if (err) { console.log(err); process.exit(-1); }
      for (let index = 0; index < result.transactions.length; ++index) {
        const tx = result.transactions[index];

        let value = 0;
        for (let entriesIndex = 0; entriesIndex < tx.entries.length; ++entriesIndex) {
          if (tx.entries[entriesIndex].account === wallet.id()) {
            value += tx.entries[entriesIndex].value;
          }
        }

        const verb = (value > 0) ? 'Received' : 'Sent';

        const output = tx.id + ': ' + verb + ' ' + (value / 1e8).toFixed(8) + 'BTC on ' + tx.date;
        console.log(output);
      }
    });
  });
});
