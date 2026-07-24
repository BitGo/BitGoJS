/**
 * List all multi-sig wallets at BitGo for the given coin.
 * This makes use of the convenience function wallets().list()
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
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
  const wallets = await bitgo.coin(coin).wallets().list({});

  for (const wallet of wallets.wallets) {
    console.log(`Wallet label: ${wallet.label()}`);
    console.log(`Wallet ID: ${wallet.id()}`);
  }
}

main().catch((e) => console.error(e));
