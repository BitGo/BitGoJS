/**
 * List all multi-sig wallets at BitGo for the given coin.
 * This makes use of the convenience function wallets().list()
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = '';

const coin = 'tltc';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallets = await bitgo.coin(coin).wallets().list({});

  for (const wallet of wallets.wallets) {
    console.log(`Wallet label: ${wallet.label()}`);
    console.log(`Wallet ID: ${wallet.id()}`);
  }
}

main().catch((e) => console.error(e));
