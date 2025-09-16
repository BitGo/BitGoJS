/**
 * Create test wallets and generate claims data for multiple coins.
 *
 * This script can either create new wallets or use existing wallets to generate
 * receive addresses and CSV files containing claims data for Midnight airdrop testing.
 *
 * USAGE GUIDELINES:
 *
 * 1. ENVIRONMENT SETUP:
 *    - Set TESTNET_ACCESS_TOKEN in .env file (your BitGo testnet access token)
 *    - Set TEST_PASS in .env file (wallet passphrase)
 *
 * 2. CONFIGURATION OPTIONS:
 *    - CREATE_NEW_WALLETS: Set to true to create new wallets, false to use existing ones
 *    - COINS_TO_PROCESS: Array of coin symbols to process (empty array = process all coins)
 *    - EXISTING_WALLET_IDS: Required when CREATE_NEW_WALLETS is false
 *    - numAddresses: Number of receive addresses to generate per wallet
 *
 * 3. EXAMPLES:
 *    - Process all coins with new wallets: CREATE_NEW_WALLETS = true, COINS_TO_PROCESS = []
 *    - Process only BTC and SOL: COINS_TO_PROCESS = ['tbtc4', 'tsol']
 *    - Use existing wallets: CREATE_NEW_WALLETS = false, update EXISTING_WALLET_IDS
 *
 * 4. OUTPUT:
 *    - CSV files: receive-addresses-{coin}-{walletId}.csv
 *    - Format: coin,allocationAmount,walletId,enterpriseId,address
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tada } from "@bitgo/sdk-coin-ada";
import { Tsol } from "@bitgo/sdk-coin-sol";
import { Tbtc4 } from "@bitgo/sdk-coin-btc";
import { Tbsc } from "@bitgo/sdk-coin-bsc";
import { Hteth } from "@bitgo/sdk-coin-eth";
import * as fs from 'fs';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'staging',
});

// Register coin types
bitgo.register('hteth', Hteth.createInstance);
bitgo.register('tada', Tada.createInstance);
bitgo.register('tsol', Tsol.createInstance);
bitgo.register('tbtc4', Tbtc4.createInstance);
bitgo.register('tbsc', Tbsc.createInstance);

const passphrase = process.env.TEST_PASS;
const enterprise = '5bd795f1bf7435a503a0a647ec5d3b3d';
const numAddresses = 20;

// Configuration: Set to true to create new wallets, false to use existing wallet IDs
const CREATE_NEW_WALLETS = false;

// Configuration: Specify which coins to process (empty array means process all coins)
const COINS_TO_PROCESS: string[] = ['tbsc']; // e.g., ['tbtc4', 'tsol'] to process only these coins

// If CREATE_NEW_WALLETS is false, provide existing wallet IDs for each coin
const EXISTING_WALLET_IDS = {
  hteth: '67123abc456def789ghi012jkl345mno',
  tbtc4: '67234bcd567efg890hij123klm456nop',
  tsol: '67345cde678fgh901ijk234lmn567opq',
  tada: '67456def789ghi012jkl345mno678pqr',
  tbsc: '6894dd8ff0ee06d1630c84d54d381dde'
};

// Generate unique timestamp for this run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // 2025-09-15T14-30-45

const coins = [
  { coin: 'hteth', label: `Midnight Claims ETH Wallet ${timestamp}` },
  { coin: 'tbtc4', label: `Midnight Claims BTC Wallet ${timestamp}` },
  { coin: 'tsol', label: `Midnight Claims SOL Wallet ${timestamp}` },
  { coin: 'tada', label: `Midnight Claims ADA Wallet ${timestamp}` },
  { coin: 'tbsc', label: `Midnight Claims BSC Wallet ${timestamp}` }
];

type WalletCreationResult = {
  coin: string;
  success: true;
  walletId: string;
  addressCount: number;
  filename: string;
} | {
  coin: string;
  success: false;
  error: string;
};

async function createWalletAndAddresses(coin: string, label: string): Promise<WalletCreationResult> {
  console.log(`\n=== ${CREATE_NEW_WALLETS ? 'Creating' : 'Using existing'} wallet for ${coin.toUpperCase()} ===`);

  try {
    let wallet;
    let walletId;

    if (CREATE_NEW_WALLETS) {
      // Create a new wallet
      const response = await bitgo.coin(coin).wallets().generateWallet({
        label,
        passphrase,
        enterprise,
      });

      if (!('backupKeychain' in response)) {
        throw new Error('wallet missing required keychains');
      }

      wallet = response.wallet;
      walletId = wallet.id();
      console.log('Created new wallet ID:', walletId);
    } else {
      // Use existing wallet
      walletId = EXISTING_WALLET_IDS[coin as keyof typeof EXISTING_WALLET_IDS];
      if (!walletId) {
        throw new Error(`No existing wallet ID configured for coin: ${coin}`);
      }

      wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
      console.log('Using existing wallet ID:', walletId);
    }

    console.log(`Wallet label: ${wallet.label()}`);

    const csvHeader = 'coin,allocationAmount,originWalletId,enterpriseId,originAddress\n';
    let csvRows = '';
    for (let i = 0; i < numAddresses; i++) {
      const newAddress = await wallet.createAddress();
      console.log(`Receive Address ${i + 1}:`, newAddress.address);
      const allocationAmount = Math.floor(Math.random() * 1_000_000);
      csvRows += `${coin},${allocationAmount},${walletId},${enterprise},${newAddress.address}\n`;
    }

    const filename = `./receive-addresses-${coin}-${walletId}.csv`;
    fs.writeFileSync(filename, csvHeader + csvRows);
    console.log(`CSV file updated: ${filename}`);

    return {
      coin,
      walletId,
      success: true,
      addressCount: numAddresses,
      filename
    };
  } catch (error: any) {
    console.error(`Error ${CREATE_NEW_WALLETS ? 'creating' : 'using'} wallet for ${coin}:`, error);
    return {
      coin,
      success: false,
      error: error.message || error.toString()
    };
  }
}

async function main() {
  if (!passphrase) {
    throw new Error('TEST_PASS environment variable is required');
  }

  if (!process.env.TESTNET_ACCESS_TOKEN) {
    throw new Error('TESTNET_ACCESS_TOKEN environment variable is required');
  }

  console.log(`Starting ${CREATE_NEW_WALLETS ? 'wallet creation' : 'address generation on existing wallets'} for multiple coins...`);
  console.log(`Enterprise ID: ${enterprise}`);
  console.log(`Number of addresses per wallet: ${numAddresses}`);
  console.log(`Mode: ${CREATE_NEW_WALLETS ? 'CREATE NEW WALLETS' : 'USE EXISTING WALLETS'}`);

  const results: WalletCreationResult[] = [];

  for (const { coin, label } of coins) {
    // Check if the coin is in the COINS_TO_PROCESS list or if the list is empty (process all coins)
    if (COINS_TO_PROCESS.length === 0 || COINS_TO_PROCESS.includes(coin)) {
      const result = await createWalletAndAddresses(coin, label);
      results.push(result);

      // Add a small delay between wallet creations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log(`Skipping ${coin.toUpperCase()} as it's not in the COINS_TO_PROCESS list`);
    }
  }

  console.log('\n=== SUMMARY ===');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.coin}: Wallet ${result.walletId} created with ${result.addressCount} addresses`);
      console.log(`   File: ${result.filename}`);
    } else {
      console.log(`❌ ${result.coin}: Failed - ${result.error}`);
    }
  });

  const successfulCreations = results.filter(r => r.success);
  console.log(`\nCompleted: ${successfulCreations.length}/${results.length} wallets created successfully`);
}

main().catch((e) => console.error('Script failed:', e));
