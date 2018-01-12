//
// List all multi-sig wallets at BitGo for the given coin.
// This makes use of the convenience function wallets().list()
//
// This tool will help you see how to use the BitGo API to easily list your 
// BitGo wallets.
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

// TODO: set your access token here
const accessToken = null;

const coin = 'tltc';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const shares = yield bitgo.coin(coin).wallets().listShares({});

  console.dir(shares);
})();
