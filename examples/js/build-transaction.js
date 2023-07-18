/**
 * Pre-build a transaction from the wallet
 *
 * This tool will help you see how to use the BitGo API to easily build
 * a transaction from a wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
const Promise = require('bluebird');

const bitgo = new BitGoJS.BitGo({ env: 'test' });

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: get the wallet with this id
const id = '';

const coin = 'tdoge';
const amount = '';
const toAddress = '';

Promise.coroutine(function* () {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id });

  console.log(`Wallet label: ${wallet.label()}`);

  const buildTxParams = {
    recipients: [
      {
        amount,
        address: toAddress,
      },
    ],
  };
  wallet
    .prebuildTransaction(buildTxParams)
    .then(function (transaction) {
      // print transaction details
      console.dir(transaction);
    })
    .catch((err) => console.log('Error: ', err));
})();
