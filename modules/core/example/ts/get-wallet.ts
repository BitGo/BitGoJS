/**
 * Get a multi-sig wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * This tool will help you see how to use the BitGo API to easily get
 * information about a wallet.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: get the wallet with this id
const id = '';

const coin = 'tltc';

// Create the wallet with Bluebird coroutines
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().get({ id });

  console.log(`Wallet label: ${wallet.label()}`);
}

main().catch((e) => console.error(e));
