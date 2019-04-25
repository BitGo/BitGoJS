//
// List the transactions of an address on the bitcoin blockchain.
// Does not require authentication or have a notion on which user the address belongs to on the BitGo platform.
// We recommend the use of the wallet object for that purpose.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length < 2) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <address>');
  process.exit(-1);
}

let address = '2N4Xz4itCdKKUREiySS7oBzoXUKnuxP4nRD';
if (process.argv.length > 2) {
  address = process.argv[2];
}

const bitgo = new BitGoJS.BitGo();

// Now get the transactions
bitgo.blockchain().getAddressTransactions({ address: address }, function(err, response) {
  if (err) { console.log(err); process.exit(-1); }
  console.log('Transactions: ');
  console.log(JSON.stringify(response, null, 4));
});
