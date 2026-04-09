/**
 * Get a list of supported currencies
 * Supported currencies are returned that are valid for the given
 * network(s) you would like to perform an allocation or deallocation
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

  const partnerIds = Object.values(tradingNetworkBalances.networkBalances).reduce<string[]>(
    (a, c) => [...a, c.partnerId],
    []
  );

  const supportedCurrencies = await tradingNetwork.getSupportedCurrencies({
    partnerIds,
  });

  console.log('Supported Currencies:', supportedCurrencies);
}

main().catch((e) => console.error(e));
