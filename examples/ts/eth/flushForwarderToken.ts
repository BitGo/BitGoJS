/**
 * This API call is to manually forward tokens from an ETH or CELO address
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
// set your address from wallet dashboard on app.bitgo-test.com or using the get-wallet example from this repo
const addressId = '';

async function flushForwarderTokenManually() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const flushForwarderOptions = {
    address: addressId,
    tokenName: coin, // required
    gasPrice: 0, // optional
    eip1559: {
      // optional
      maxPriorityFeePerGas: 0,
      maxFeePerGas: 0,
    },
  };
  const response = await wallet.flushForwarderToken(flushForwarderOptions);
  console.log('Response', response);
}

flushForwarderTokenManually().catch((e) => console.error(e));
