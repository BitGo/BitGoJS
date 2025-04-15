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
  accessToken: 'v2x280d4aeb94f6971cae261b86041f2289fee01ccf7ea7187fc36e9e6b65783972',
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '67ab1a85f51f11a09f9e919e4cbcd11c';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });

  console.log('\nWallet ID:', wallet.id());
  console.log('\nSupported NFTs:', );
  console.log(wallet.nftBalances());
  console.log('\nUnsupported NFTs:', );
  console.log(wallet.unsupportedNftBalances());
}

main().catch((e) => console.error(e));
