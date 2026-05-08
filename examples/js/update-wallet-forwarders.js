/**
 * Sets deployForwardersManually and flushForwardersManually flags for a wallet.
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

// toggles boolean flags for deployForwardersManually and flushForwardersManually

async function setForwarderFlags() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const deployForwardersManually = wallet._wallet.coinSpecific.deployForwardersManually;
  const flushForwardersManually = wallet._wallet.coinSpecific.flushForwardersManually;

  console.log('Deploy Forwarders Manually', deployForwardersManually);
  console.log('Flush Forwarders Manually', flushForwardersManually);

  const forwarderFlags = {
    coinSpecific: {
      gteth: {
        deployForwardersManually: !deployForwardersManually,
        flushForwardersManually: !flushForwardersManually,
      },
    },
  };

  await wallet.updateForwarders(forwarderFlags);
  console.log('Wallet Updated');

  console.log('Deploy Forwarders Manually', wallet._wallet.coinSpecific.deployForwardersManually);
  console.log('Flush Forwarders Manually', wallet._wallet.coinSpecific.flushForwardersManually);
}

setForwarderFlags().catch((e) => console.error(e));
