//
// Share wallets between users (both must be on bitgo)
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../src/index.js');

if (process.argv.length <= 1) {
  console.log('usage:\n\t' + process.argv[0] + ' ' + process.argv[1] + ' <user> <pass> <otp> <walletId>');
  process.exit(-1);
}

const walletId = '2MsaMz4tYy5RieZ8qBeW1rhsTpNAXjpofSC';

const senderUser = 'bencxr+wallettest@fragnetics.com';
const senderPassword = 'password2';
const senderOtp = '0000000';

const receiverUser = 'bencxr@fragnetics.com';
const receiverPassword = 'password1';
const receiverOtp = '0000000';

const senderSession = new BitGoJS.BitGo();
const receiverSession = new BitGoJS.BitGo();

let shareId;

// First, Authenticate sender and receiver
senderSession.authenticate({ username: senderUser, password: senderPassword, otp: senderOtp })
.then(function(result) {
  console.dir(result);
  console.log('Logged in!');

  return senderSession.unlock({ otp: senderOtp });
})
.then(function(unlocked) {
  console.dir(unlocked);
  // Unlocked, now get and share

  return senderSession.wallets().get({ id: walletId });
})
.then(function(wallet) {
  console.dir(wallet);
  console.log('Balance is: ' + (wallet.balance() / 1e8).toFixed(4));

  // Now send the share
  return wallet.shareWallet({ email: receiverUser, walletPassphrase: senderPassword });
})
.then(function(result) {
  console.log('Share successful');
  console.dir(result);
  shareId = result.id;
})
.then(function() {
  // Login as the receiver
  return receiverSession.authenticate({ username: receiverUser, password: receiverPassword, otp: receiverOtp });
})
.then(function(result) {
  console.log('Logged in as receiver!');
  console.dir(result);

  return receiverSession.unlock({ otp: receiverOtp });
})
.then(function(unlocked) {
  console.dir(unlocked);
  // Unlocked, now get list of shares
  return receiverSession.wallets().listShares();
})
.then(function(shareList) {
  console.log('list of shares');
  console.dir(shareList);

  return receiverSession.wallets().getShare({ walletShareId: shareId });
})
.then(function(walletShare) {
  console.dir(walletShare);
  console.dir(walletShare);

  return receiverSession.wallets().acceptShare({ walletShareId: shareId, newWalletPassphrase: 'chamchatka', userPassword: receiverPassword });
})
.then(function(result) {
  console.log('accepted!');
  console.dir(result);
})
.catch(function(err) {
  console.log('err');
  console.dir(err);
});
