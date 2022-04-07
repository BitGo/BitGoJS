/**
 * Get a multi-sig wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * This tool will help you see how to use the BitGo API to easily get
 * information about a wallet.
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
const accessToken = '2356c50abf1c410a360040bf9f86740d259b9317e808164d2ed3ce47935278b4';


// TODO: get the wallet with this id
const id = '624c63b9114b1f0007c4be6206024ffc';

const coin = 'tnear';

// Create the wallet with Bluebird coroutines
Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id });

  console.log(`Wallet label: ${wallet.label()}`);
})();
