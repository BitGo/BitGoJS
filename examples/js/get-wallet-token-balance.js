/**
 * Get the token balance of a multi-sig wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * This tool will help you see how to use the BitGo API to easily get
 * information about a wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

const coin = 'tsol';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = '';
const walletId = '624ef521e876e800073b865e31b6d7e9';

Promise.coroutine(function* () {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId, allTokens: true });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Balance in ' + coin + ':', walletInstance.balanceString());
  console.log('Confirmed Balance in ' + coin + ':', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance in ' + coin + ':', walletInstance.spendableBalanceString());
  console.log('Current Tokens Held: ');
  console.log(walletInstance.toJSON().tokens);
})();
