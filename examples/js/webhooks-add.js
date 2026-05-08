/**
 * Add a new webhook for a coin type for a user defined notification url
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

const BitGo = require('bitgo');

// change this to env: 'production' when you are ready for production
const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = '';

// Set the coin type of an active wallet in your BitGo account
// e.g. tbtc
const network = '';

// Set the url you would like to receive notifications at
// e.g. https://domain.com/callback
const callbackUrl = '';

// Set notification trigger type
// e.g. 'block' | 'wallet_confirmation'
const type = '';

// Add a label to your webhook (optional)
const label = '';

// Add a minimum number of confirmations before the webhook is triggered (optional)
// Defaults to 0
const numConfirmations = 0;

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = bitgo.coin(network);

  const newWebhook = await coin.webhooks().add({ url: callbackUrl, type, label, numConfirmations });

  console.log('New webhook created successfully');
  console.log(newWebhook);
}

main().catch((e) => console.error(e));
