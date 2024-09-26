/**
 * Create a lightning invoice.
 *
 * Copyright 2022 BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');

// change this to env: 'prod' when you are ready for production
const env = 'test';
// change coin to 'btc' when working with production
const coin = env === 'test' ? 'tbtc' : 'btc';

const bitgo = new BitGoJS.BitGo({ env });

// set your access token here
const accessToken = '';

// set your wallet ID here
const walletId = '';

async function createLightningInvoice() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const lightning = wallet.lightning();

  const lightningInvoice = await lightning.createInvoice({ value: 100000, memo: 'Test Payment' });
  console.log('Lightning Invoice:', lightningInvoice.invoice);
}

createLightningInvoice().catch(console.error);
