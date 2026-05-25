/**
 * List address of an NFT on a wallet.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tapt } from '@bitgo/sdk-coin-apt';
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const addresses = await wallet.addressesByBalance({
    nftCollectionId: '',
    nftId: '',
  });
  console.log(JSON.stringify(addresses.addresses));
}

main().catch((e) => console.error(e));
