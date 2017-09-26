//
// Get information about a transaction on the Bitcoin blockchain.
// Does not require authentication or have a notion on which BitGo user the transaction belongs to.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length < 2) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <transactionId>');
  process.exit(-1);
}

let txId = '951aea423c6ba55ac4e6aba953c1dc08e4854bcdf07cb505c4c69447a3f9712e';
if (process.argv.length > 2) {
  txId = process.argv[2];
}

const bitgo = new BitGoJS.BitGo();

// Now get the Address information
bitgo.blockchain().getTransaction({ id: txId }, function(err, response) {
  if (err) { console.log(err); process.exit(-1); }
  console.log('Transaction info: ');
  console.log(JSON.stringify(response, null, 4));
});

