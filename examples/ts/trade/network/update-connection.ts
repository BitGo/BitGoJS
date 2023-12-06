/**
 * Update a network connection
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
import { UpdateNetworkConnectionParams } from 'modules/sdk-core/src/bitgo/trading/network';
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

  const body: UpdateNetworkConnectionParams = {
    connectionId: '',
    active: true,
  };

  const connection = await tradingNetwork.updateConnection(body);

  console.log('Trading Network Connection', connection);
}

main().catch((e) => console.error(e));
