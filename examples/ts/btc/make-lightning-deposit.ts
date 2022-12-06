/**
 * Create lightning deposit address and deposit on-chain funds to a wallet's lightning balance.
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

async function makeLightningDeposit() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const lightning = wallet.lightning();

  const initialLightningBalance = await lightning.getBalance();
  console.log('Initial Lightning Balance:', initialLightningBalance.balance);
  const initialBalance = wallet.balance();
  console.log('Initial Balance:', initialBalance);

  const deposit = await lightning.deposit({ amount: 100000 });
  console.log('Deposit Response:', deposit);
}

makeLightningDeposit().catch(console.error);
