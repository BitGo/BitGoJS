/**
 * List all shares of multi-sig wallets at BitGo for the given coin.
 * This makes use of the convenience function wallets().listShares()
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tltc } from '@bitgo/sdk-coin-ltc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tltc';
bitgo.register(coin, Tltc.createInstance);

async function main() {
  const shares = await bitgo.coin(coin).wallets().listShares({});

  console.dir(shares);
}

main().catch((e) => console.error(e));
