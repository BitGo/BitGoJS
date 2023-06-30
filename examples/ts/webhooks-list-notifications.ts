/**
 * Fetch a list of block notifications triggered by a webhook for a given coin type
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

async function main() {
  const coin = bitgo.coin(coin);

  const notifications = await coin.webhooks().listNotifications();

  console.log('List of notifications returned successfully');
  console.log(notifications);
}

main().catch((e) => console.error(e));
