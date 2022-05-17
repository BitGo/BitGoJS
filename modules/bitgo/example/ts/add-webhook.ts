/**
 * Add Low Fee webhook to a wallet.
 *
 * Copyright 2022 BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');

// change this to env: 'production' when you are ready for production
const bitgo = new BitGoJS.BitGo({ env: 'test' });

// Change coin to 'eth' when working with production
const coin = '';

// TODO: set your access token here
const accessToken = '';

// set your wallet from the YYYYY parameter here in the URL on app.bitgo-test.com
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/teth/YYYYY/transactions
const walletId = '';

async function addLowFeeWebhook() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const url = 'http://test.com/';
  const type = 'lowFee';
  wallet.addWebhook({ url: url, type: type });
  const webhooks = await wallet.listWebhooks();
  console.log(`Wallet Webhooks:  ${webhooks}`);
}

addLowFeeWebhook().catch((e) => console.error(e));

