/**
 * List wallets by wallet IDs at BitGo.
 * Doc: https://developers.bitgo.com/api/v2.wallet.list
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

async function main() {
  const body = await bitgo.get(bitgo.url('/wallets', 2)).query({
    id: [], // Replace with your wallet IDs
  }).result();

  console.log(`${JSON.stringify(body.wallets, null, 2)}`);
}

main().catch((e) => console.error(e));
