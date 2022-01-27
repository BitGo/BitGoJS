/**
 * Sets flush threshold for a token.
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

// add a threshold to update the initial token flush threshold
// default value is set to 10
const threshold = 10;

async function setTokenFlushThreshold() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  console.log('Initial Token Flush Threshold:', wallet.tokenFlushThresholds());
  await wallet.updateTokenFlushThresholds({ terc: threshold });
  console.log('Updated Token Flush Threshold:', wallet.tokenFlushThresholds());
}

setTokenFlushThreshold().catch((e) => console.error(e));
