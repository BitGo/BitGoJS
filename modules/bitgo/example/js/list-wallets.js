/**
 * List all multi-sig wallets at BitGo for the given coin.
 * This makes use of the convenience function wallets().list()
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
const Promise = require('bluebird');
const bitgo = new BitGoJS.BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-07-app.bitgo-dev.com',
});

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'ece2a52887ee21d16765551b0a18b15e081b0fb3eb2c51bada2a87c8ef60bbc4';

const coin = 'tnear';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallets = yield bitgo.coin(coin).wallets().list({});

  for (const wallet of wallets.wallets) {
    console.log(`Wallet label: ${wallet.label()}`);
    console.log(`Wallet ID: ${wallet.id()}`);
  }
})();
