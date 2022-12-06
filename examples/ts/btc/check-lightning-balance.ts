/**
 * Check the lightning balance of a wallet.
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

async function checkLightningBalance() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const lightning = wallet.lightning();

  const lightningBalance = await lightning.getBalance();
  console.log('Lightning Balance:', lightningBalance.balance);
  console.log('Lightning Balance Available for Spending:', lightningBalance.availableBalance);
}

checkLightningBalance().catch(console.error);
