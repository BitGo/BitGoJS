/**
 * Get account resources for a Tron wallet at BitGo.
 *
 * This tool will help you see how to use the BitGo API to easily get
 * account resources information for a wallet.
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from "@bitgo/sdk-api";
import { Ttrx } from "@bitgo/sdk-coin-trx";
require('dotenv').config({ path: '../../../.env' });

// TODO: change to 'production' for mainnet
const bitgo = new BitGoAPI({
    accessToken: process.env.TESTNET_ACCESS_TOKEN,
    env: 'test',
});

// TODO: change to 'trx' for mainnet or 'ttrx:<token>' for testnet token
const coin = 'ttrx';
bitgo.register(coin, Ttrx.createInstance);

// TODO: set your wallet id
const walletId = '';

// TODO: set the addresses to query
// Note: To get energy deficit for a token transfer, make sure the token exists in the address.
const addresses = [''];

async function main() {

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  const resources = await wallet.getAccountResources({ addresses });
  console.log('Account Resources:', JSON.stringify(resources, null, 2));
}

main().catch((e) => console.error(e));
