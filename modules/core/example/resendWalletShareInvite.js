//
// Resend the invitation email for sharing a BitGo wallet
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

// TODO: set your user account name and password
const username = null;
const password = null;

// TODO: set your OTP code, or '0000000' if using test environment
const otp = null;

// TODO: set your wallet share ID here
// you can get this using the listShares() convienence method
const walletShareId = null;

const bitgo = new BitGoJS.BitGo({ env: 'test' });

bitgo.authenticate({ username, password, otp })
.then(function(result) {
  console.log('logged in!');
  return bitgo.wallets().resendShareInvite({ walletShareId });
})
.then(function(shareResult) {
  console.log('Share invite resent successfully');
  console.dir(shareResult);
})
.catch(function(err) {
  console.log('err');
  console.dir(err);
});

