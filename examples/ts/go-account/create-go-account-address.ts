/**
 * Create an Address for an Existing Go Account Wallet
 *
 * This example demonstrates how to create a new address for an existing Go Account
 * wallet. This is useful when you need to generate additional receiving addresses
 * for different tokens or purposes.
 *
 * This does NOT use BitGo Express - it communicates directly with BitGo platform APIs.
 *
 * IMPORTANT: For Go Account (OFC) wallets, the onToken parameter is always required
 * when creating addresses.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Go Accounts use the 'ofc' (Off-Chain) coin
const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

// Configuration - Update these values
const walletId = 'your_wallet_id'; // The ID of your existing Go Account wallet
const addressLabel = 'My New Address 2'; // Label for the new address

// Token to create address for (required for OFC wallets)
// Examples: 'ofctsol:usdc', 'ofctsol:usdt', 'ofcttrx:usdt', 'ofctbtc'
const token = 'ofcttrx:usdt';

async function main() {
  console.log('=== Creating Address for Go Account ===\n');

  // Step 1: Get the existing wallet
  console.log(`Retrieving wallet: ${walletId}...`);
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  console.log(`✓ Wallet retrieved: ${wallet.label()}`);
  console.log(`  Wallet Type: ${wallet.type()}`);
  console.log(`  Wallet Coin: ${wallet.coin()}`);

  // Step 2: Create a new address for the specified token
  console.log(`\nCreating address for token ${token}...`);
  try {
    const address = await wallet.createAddress({
      label: addressLabel,
      onToken: token // Required for OFC wallets
    });

    console.log(`✓ Address created: ${address.address}`);
    console.log('\nAddress Response:');
    console.log(JSON.stringify(address, null, 2));

    console.log('\n✓ Address creation complete!');
    console.log('\nNext Steps:');
    console.log('1. Use this address to receive ' + token + ' tokens');
    console.log('2. Share this address with senders');
    console.log('3. Create additional addresses: wallet.createAddress({ label: "...", onToken: "..." })');

  } catch (error) {
    console.log(`  Error: Address creation failed. Token may not be enabled.`);
    console.error(`  Error: ${error}`);
    throw error;
  }
}

main().catch((e) => {
  console.error('\n❌ Error creating address:', e);
  process.exit(1);
});
