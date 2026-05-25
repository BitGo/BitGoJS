/**
 * Update multiple wallet shares in bulk
 *
 * This example demonstrates how to update multiple wallet shares in bulk.
 * You can use this to accept or reject multiple wallet shares at once.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tltc } from '@bitgo/sdk-coin-ltc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tltc';
bitgo.register(coin, Tltc.createInstance);

// Add the wallet share IDs that need to be updated
const shares: { walletShareId: string; status: 'accept' | 'reject' }[] = [
  {
    walletShareId: '', // add the first wallet share ID
    status: 'accept', // can be 'accept' or 'reject'
  },
  {
    walletShareId: '', // add the second wallet share ID
    status: 'reject',
  },
];

// User login password is required for accepting shares
const userLoginPassword = ''; // add your user login password

// Optional: new wallet passphrase if you want to set a new passphrase
const newWalletPassphrase = ''; // leave empty if not changing passphrase

async function main() {
  try {
    const updateShares = await bitgo
      .coin(coin)
      .wallets()
      .bulkUpdateWalletShare({
        shares: shares,
        userLoginPassword: userLoginPassword,
        newWalletPassphrase: newWalletPassphrase || undefined,
      });
    console.dir(updateShares);
  } catch (e) {
    console.error(e);
  }
}

main().catch((e) => console.error(e));
