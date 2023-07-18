/**
 * Send funds from a fee address to a forwarder.
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

// set the forwarder address you want to send funds to
const forwarderAddress = '';

// set the amount to send
const amount = '1';

async function fundForwarder() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const fundForwarderOptions = {
    forwarderAddress: forwarderAddress,
    amount: amount,
  };

  const response = await wallet.fundForwarder(fundForwarderOptions);
  console.log('Response', response);
}

fundForwarder().catch((e) => console.error(e));
