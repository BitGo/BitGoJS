/**
 * List receive addresses on a wallet.
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

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const addresses = await wallet.addresses();

  console.log('Wallet ID:', wallet.id());
  for (const address of addresses.addresses) {
    console.log(`Address id: ${address.id}`);
    console.log(`Address: ${address.address}`);
  }
}

main().catch((e) => console.error(e));
