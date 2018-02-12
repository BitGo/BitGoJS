//
// Get detailed transaction information prior to sending
//
// This example can be used to retrieve information regarding a transaction for a
// particular amount prior to sending. It can be helpful to know the estimated fee,
// or number of inputs needed to send a particular amount. This example can be used
// to retrieve such information.
//
// Copyright 2016, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length < 8) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] +
    ' <user> <pass> <otp> <walletId> <destinationAddress> <amountSatoshis> <feeRate>');

  console.log('user: user email (on test.bitgo.com)');
  console.log('pass: password');
  console.log('otp: one-time password, 0000000 on test');
  console.log('walletId: wallet ID (first address on the wallet)');
  console.log('destinationAddress: the bitcoin address to send coins to');
  console.log('amountSatoshis: number of satoshis to send');
  console.log('feeRate: The fee rate to use in satoshis / kb [optional]');
  process.exit(-1);
}

const user = process.argv[2];
const password = process.argv[3];
const otp = process.argv[4];
const walletId = process.argv[5];
const destinationAddress = process.argv[6];
const amountSatoshis = parseInt(process.argv[7], 10);
let feeRate = undefined;

if (!!process.argv[8]) {
  feeRate = parseInt(process.argv[8], 10);
}

const bitgo = new BitGoJS.BitGo({ env: 'test' });

const getTransactionInfo = function() {

  return bitgo.authenticate({ username: user, password: password, otp: otp })
  .then(function() {
    return bitgo.unlock({ otp: otp });
  })
  .then(function() {

    // Fetch the specified wallet
    return bitgo.wallets().get({ id: walletId });
  })
  .then(function(wallet) {

    // Set recipients
    const recipients = {};
    recipients[destinationAddress] = amountSatoshis;

    // Create the transaction
    return wallet.createTransaction({ recipients: recipients, feeRate: feeRate });
  }).then(function(transaction) {
    console.log('\nEstimated Transaction Info:\n');
    console.log('\tSending from:                        ' + walletId);
    console.log('\tSending to:                          ' + destinationAddress);
    console.log('\tAmount:                              ' + amountSatoshis + ' satoshis');
    console.log('\n\tTotal number of inputs:              ' + transaction.unspents.length);
    console.log('\tTotal number of outputs:             ' + transaction.txInfo.nOutputs);
    console.log('\tBitcoin network fee rate:            ' + transaction.feeRate + ' (satoshis / kb)');
    console.log('\tEstimated transaction size:          ' + transaction.estimatedSize + ' bytes');
    console.log('\tEstimated Bitcoin network fee:       ' + transaction.fee + ' satoshis');
    console.log('\tBitGo fee:                           ' + (transaction.bitgoFee && transaction.bitgoFee.amount || 0) + ' satoshis');
    process.exit(-1);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(-1);
  });
};

getTransactionInfo();
