/**
 * Pay LNURL request from wallet's lightning balance.
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

// LNURL from https://lnurl.mcnally.cloud/ to generate random invoice
const LNURL = 'lnurl1dp68gurn8ghj7mrww4exctndvdhxzmrv0yhxxmr0w4jz7urp0ylhg7tsv57hyctwv3hk6hrmhn6';

async function payLnurlRequest() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const lightning = wallet.lightning();

  const DecodedLnurlPayRequest = await lightning.decodeLnurlPay(LNURL);
  console.log('Decoded LNURL Pay Request:', DecodedLnurlPayRequest);

  // minimum allowed amount is chosen, however millisatAmount can be any amount in the range between minSendable and maxSendable
  const millisatAmount = DecodedLnurlPayRequest.minSendable.toFixed(0);
  const { metadata, callback } = DecodedLnurlPayRequest;

  const invoice = await wallet.lightning().fetchLnurlPayInvoice({ millisatAmount, callback, metadata });
  console.log('Invoice:', invoice);

  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const fixturePayment = await wallet.lightning().payInvoice({ invoice });
  console.log('Fixture Payment:', fixturePayment);
}

payLnurlRequest().catch(console.error);
