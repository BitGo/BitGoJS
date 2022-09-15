/**
 * Withdraw from wallet's lightning balance to on-chain funds.
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

async function withdrawLightningBalance() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const lightning = wallet.lightning();

  const initialLightningBalance = await lightning.getBalance();
  console.log('Initial Lightning Balance:', initialLightningBalance.balance);
  const initialBalance = wallet.balance();
  console.log('Initial Balance:', initialBalance);

  const withdrawResponse = await lightning.withdraw({ value: 10000 });
  console.log('Withdraw Response:', withdrawResponse);
}

withdrawLightningBalance().catch(console.error);
