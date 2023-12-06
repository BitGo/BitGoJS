/**
 * Get a list of currenct network balances
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
require('dotenv').config({ path: '../../../.env' });

const OFC_WALLET_ID = process.env.OFC_WALLET_ID;

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

async function main() {
  const tradingAccount = (await bitgo.coin('ofc').wallets().get({ id: OFC_WALLET_ID })).toTradingAccount();

  const tradingNetwork = tradingAccount.toNetwork();

  const tradingNetworkBalances = await tradingNetwork.getBalances();

  console.log('Balances', tradingNetworkBalances);
}

main().catch((e) => console.error(e));
