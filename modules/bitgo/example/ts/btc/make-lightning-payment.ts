/**
 * Make lightning payment to a generated invoice.
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

// set the invoice you want to pay here
const invoiceToPay = '';

async function makeLightningPayment() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const lightning = wallet.lightning();

  const initialLightningBalance = await lightning.getBalance();
  console.log('Initial Lightning Balance:', initialLightningBalance.balance);

  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const fixturePayment = await lightning.payInvoice({ invoice: invoiceToPay });
  console.log('Fixture Payment:', fixturePayment);
}

makeLightningPayment().catch(console.error);
