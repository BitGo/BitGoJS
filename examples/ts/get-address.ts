/**
 * Get address of a wallet.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tapt } from "@bitgo/sdk-coin-apt";
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const address = await wallet.getAddress({
    address: '',
  })
  console.log(JSON.stringify(address));
}

main().catch((e) => console.error(e));
