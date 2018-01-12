//
// List all wallet shares for the given account
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

// TODO: set your user account name and password
const username = null;
const password = null;

// TODO: set your OTP code, or '0000000' if using test environment
const otp = null;

const bitgo = new BitGoJS.BitGo({ env: 'test' });

// First, Authenticate user
bitgo.authenticate({ username, password, otp })
.then(function(result) {
  console.log('Logged in!');
  return bitgo.wallets().listShares();
})
.then(function(shares) {
  console.dir(shares);
})
.catch(function(err) {
  console.log('err');
  console.dir(err);
});
