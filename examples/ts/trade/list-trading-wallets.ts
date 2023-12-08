/**
 * Get a list of trading wallets
 * Returned list is a list of each ofc coin with the same wallet id
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

async function main() {
  const wallets = await bitgo.coin('ofc').wallets().list();

  console.log('Trading Wallets:', JSON.stringify(wallets, null, 2));
}

main().catch((e) => console.error(e));

// const tradingAccount = wallet.toTradingAccount();
