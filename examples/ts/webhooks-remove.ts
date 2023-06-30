/**
 * Remove a webhook from a BitGo account wallet
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

async function main() {
  const coin = bitgo.coin(coin);

  const removedWebhook = await coin.webhooks().remove({ url: callbackUrl, type });

  console.log('Webhook removed successfully');
  console.log(removedWebhook);
}

main().catch((e) => console.error(e));
