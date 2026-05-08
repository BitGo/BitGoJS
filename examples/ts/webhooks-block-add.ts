/**
 * Add a new block webhook when a new block is seen on the network or when a wallet is initialized of a given user defined coin.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

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
  const coin = bitgo.coin(coin);

  const newWebhook = await coin.webhooks().add({ url: callbackUrl, type, label, numConfirmations });

  console.log('New webhook created successfully');
  console.log(newWebhook);
}

main().catch((e) => console.error(e));
