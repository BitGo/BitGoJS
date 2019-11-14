/**
 * List all shares of multi-sig wallets at BitGo for the given coin.
 * This makes use of the convenience function wallets().listShares()
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

  const shares = await bitgo.coin(coin).wallets().listShares({});

  console.dir(shares);
}

main().catch((e) => console.error(e));
