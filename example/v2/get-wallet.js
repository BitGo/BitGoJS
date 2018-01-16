//
// Get a multi-sig wallet at BitGo.
// This makes use of the convenience function wallets().get()
//
// This tool will help you see how to use the BitGo API to easily get
// information about a wallet.
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../../src/index.js');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = null;

// TODO: get the wallet with this id
const id = null;

const coin = 'tltc';

// Create the wallet with Bluebird coroutines
Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id });

  console.log(`Wallet label: ${wallet.label()}`);
})();
