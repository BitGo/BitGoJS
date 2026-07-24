/**
 * Fetch a list of webhooks for wallet's coin type
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

  const webhooks = await coin.webhooks().list();

  console.log('List of webhooks returned successfully');
  console.log(webhooks);
}

main().catch((e) => console.error(e));
