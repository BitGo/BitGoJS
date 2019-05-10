//
// Share a BitGo multi-sig wallet with another BitGo user.
//
// This tool will help you see how to use the BitGo API to easily share your 
// BitGo wallet with another BitGo user.
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

// TODO: set your access token here
const accessToken = null;

// TODO: set the id of the wallet to share
const walletId = null;

// TODO: set BitGo account email of wallet share recipient
const recipient = null;

// TODO: set share permissions as a comma-separated list
// Valid permissions to choose from are: view, spend, manage, admin
const perms = 'view';

// TODO: provide the passphrase for the wallet being shared
const passphrase = null;

const coin = 'tltc';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id: walletId });

  const shareResult = yield wallet.shareWallet({
    email: recipient,
    walletPassphrase: passphrase,
    permissions: perms
  });

  console.log('Wallet was shared successfully');
  console.dir(shareResult);
})();
