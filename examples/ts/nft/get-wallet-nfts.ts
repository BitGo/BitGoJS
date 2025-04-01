/**
 * Get the NFT balance of a wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import {Eth} from "@bitgo/sdk-coin-eth";
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.PROD_ACCESS_TOKEN,
  env: 'prod',
});

const coin = 'eth';
bitgo.register(coin, Eth.createInstance);

const walletId = '65c1941aa1ad74341054fcabd9ba26d8';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId, allTokens: true });
  const walletJson = wallet.toJSON();

  console.log('\nWallet ID:', wallet.id());
  console.log('\nSupported NFTs:', );
  console.log(walletJson.nfts);
  console.log('\nUnsupported NFTs:', );
  console.log(walletJson.unsupportedNfts);
}

main().catch((e) => console.error(e));
