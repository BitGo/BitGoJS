/**
 * Remove a webhook from a BitGo account wallet
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

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = bitgo.coin(network);

  const removedWebhook = await coin.webhooks().remove({ url: callbackUrl, type });

  console.log('Webhook removed successfully');
  console.log(removedWebhook);
}

main().catch((e) => console.error(e));
