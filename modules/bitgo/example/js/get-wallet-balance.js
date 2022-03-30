/**
 * Get the balance of a multi-sig wallet at BitGo.
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
const accessToken = 'ece2a52887ee21d16765551b0a18b15e081b0fb3eb2c51bada2a87c8ef60bbc4';

// TODO: get the wallet with this id
const walletId = '623dcda01e25ba00071bcdefe7de4604';

const coin = 'tnear';
const basecoin = bitgo.coin(coin);

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Balance:', walletInstance.balanceString());
  console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance:', walletInstance.spendableBalanceString());
})();
