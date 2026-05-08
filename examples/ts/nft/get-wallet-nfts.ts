/**
 * Get the NFT balance of a wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tapt } from "@bitgo/sdk-coin-apt";
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: '',
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });

  console.log('\nWallet ID:', wallet.id());
  console.log('\nSupported NFTs:', );
  console.log(wallet.nftBalances());
  console.log('\nUnsupported NFTs:', );
  console.log(wallet.unsupportedNftBalances());
}

main().catch((e) => console.error(e));
