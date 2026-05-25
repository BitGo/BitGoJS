/**
 * List all transfers on multi-sig wallets at BitGo for the given coin.
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

const walletId = '';

async function main() {
  const wallet = await basecoin.wallets().get({ id: walletId });
  const transfers = await wallet.transfers();

  console.log('Wallet ID:', wallet.id());
  console.log('Current Receive Address:', wallet.receiveAddress());
  console.log('Wallet Transactions:', JSON.stringify(transfers, null, 4));
}

main().catch((e) => console.error(e));
