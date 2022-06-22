/**
 * List all transfers on multi-sig wallets at BitGo for the given coin.
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
const accessToken = 'v2x1108fe1d46407e6b372b49191df29fb323a13e10c68fccbe3790548a30ad88c7';

// TODO: get the wallet with this id
const walletId = '62ac9906fb94cd0007f1bb3b29395c32';

const coin = 'tnear';

const basecoin = bitgo.coin(coin);
// TODO: set your access token here

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId });
  const transfers = yield walletInstance.transfers();

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Wallet Transactions:', JSON.stringify(transfers, null, 4));
})();
