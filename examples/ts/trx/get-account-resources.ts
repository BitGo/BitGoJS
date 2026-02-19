/**
 * Get account resources for a Tron wallet at BitGo.
 *
 * This tool will help you see how to use the BitGo API to easily get
 * account resources information for a wallet.
 *
 * Copyright 2026, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';

// TODO: change to 'production' for mainnet
const env = 'test';
const bitgo = new BitGo({ env });

// TODO: change to 'trx' for mainnet or 'ttrx:<token>' for testnet token
const coin = 'ttrx';

// TODO: set your wallet id
const walletId = '';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: set the addresses to query
// Note: To get energy deficit for a token transfer, make sure the token exists in the address.
const addresses = [''];

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  const resources = await wallet.getAccountResources({ addresses });
  console.log('Account Resources:', JSON.stringify(resources, null, 2));
}

main().catch((e) => console.error(e));
