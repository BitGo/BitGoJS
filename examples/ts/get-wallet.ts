/**
 * Get a multi-sig wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * This tool will help you see how to use the BitGo API to easily get
 * information about a wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

/**
 * 1. Replace Tltc with your coin import (@bitgo/sdk-coin-ltc)
 * 2. Replace env (test | prod)
 * 3. Replace coin name (tltc)
 * 4. Get the wallet by the wallets' id
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tltc } from '@bitgo/sdk-coin-ltc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tbtc';
bitgo.register(coin, Tltc.createInstance);

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log(`Wallet label: ${wallet.label()}`);
}

main().catch((e) => console.error(e));
