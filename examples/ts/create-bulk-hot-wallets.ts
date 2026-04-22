/**
 * Create 500 Hot Wallets in Bulk using BitGoJS SDK
 *
 * This script creates multiple hot wallets with:
 * - Rate limiting to avoid API throttling
 * - Error handling with retry logic
 * - Credential backup to JSON file
 * - Progress tracking
 *
 * IMPORTANT: Store the output credentials file securely!
 * The backup keys are critical for wallet recovery.
 *
 * Copyright 2024, BitGo, Inc. All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
import * as fs from 'fs';
import * as path from 'path';

require('dotenv').config({ path: '../../.env' });

// ============ CONFIGURATION ============

// Environment: 'test' for staging/testnet, 'production' for mainnet
const ENV = 'test';

// Coin to use: 'tbtc' for testnet bitcoin, 'btc' for mainnet
// Change this and the import above for other coins (e.g., 'teth', 'tsol', etc.)
const COIN = 'tbtc';

// Number of wallets to create
const TOTAL_WALLETS = 500;

// Your enterprise ID (required)
const ENTERPRISE_ID = process.env.ENTERPRISE_ID || 'your_enterprise_id';

// Passphrase for encrypting user keys (use a strong passphrase!)
const PASSPHRASE = process.env.WALLET_PASSPHRASE || 'your_secure_passphrase';

// Wallet label prefix
const WALLET_LABEL_PREFIX = 'Hot Wallet';

// Delay between wallet creation requests (in ms) to avoid rate limiting
const DELAY_BETWEEN_REQUESTS_MS = 500;

// Maximum retry attempts for failed requests
const MAX_RETRIES = 3;

// Delay multiplier for exponential backoff (in ms)
const RETRY_DELAY_MS = 2000;

// Output file for wallet credentials (KEEP THIS SECURE!)
const OUTPUT_FILE = `wallet-credentials-${Date.now()}.json`;

// ============ END CONFIGURATION ============

interface WalletCredentials {
  index: number;
  walletId: string;
  label: string;
  receiveAddress: string;
  userKeychainEncryptedPrv: string;
  backupKeychainPrv: string;
  createdAt: string;
}

interface CreationResult {
  success: WalletCredentials[];
  failed: { index: number; error: string }[];
}

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: ENV,
});

bitgo.register(COIN, Tbtc.createInstance);

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a single wallet with retry logic
 */
async function createWalletWithRetry(
  index: number,
  retryCount = 0
): Promise<WalletCredentials> {
  const label = `${WALLET_LABEL_PREFIX} ${index + 1}`;

  try {
    const response = await bitgo.coin(COIN).wallets().generateWallet({
      label,
      passphrase: PASSPHRASE,
      enterprise: ENTERPRISE_ID,
      type: 'hot',
      multisigType: 'onchain',
    });

    if (!('backupKeychain' in response)) {
      throw new Error('Wallet missing required keychains');
    }

    const { wallet } = response;

    return {
      index: index + 1,
      walletId: wallet.id(),
      label,
      receiveAddress: wallet.receiveAddress(),
      userKeychainEncryptedPrv: response.userKeychain.encryptedPrv || '',
      backupKeychainPrv: response.backupKeychain.prv || '',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if we should retry
    if (retryCount < MAX_RETRIES) {
      const delayMs = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(
        `  Retry ${retryCount + 1}/${MAX_RETRIES} for wallet ${index + 1} after ${delayMs}ms...`
      );
      await sleep(delayMs);
      return createWalletWithRetry(index, retryCount + 1);
    }

    throw new Error(`Failed after ${MAX_RETRIES} retries: ${errorMessage}`);
  }
}

/**
 * Save credentials to file (appends incrementally for safety)
 */
function saveCredentials(credentials: WalletCredentials[], outputPath: string): void {
  const fullPath = path.resolve(__dirname, outputPath);
  fs.writeFileSync(fullPath, JSON.stringify(credentials, null, 2));
}

/**
 * Main function to create all wallets
 */
async function createBulkWallets(): Promise<CreationResult> {
  console.log('='.repeat(60));
  console.log('BitGo Bulk Hot Wallet Creator');
  console.log('='.repeat(60));
  console.log(`Environment: ${ENV}`);
  console.log(`Coin: ${COIN}`);
  console.log(`Enterprise: ${ENTERPRISE_ID}`);
  console.log(`Total wallets to create: ${TOTAL_WALLETS}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log('='.repeat(60));

  // Validate configuration
  if (ENTERPRISE_ID === 'your_enterprise_id') {
    throw new Error(
      'Please set ENTERPRISE_ID in the configuration or via ENTERPRISE_ID environment variable'
    );
  }

  if (!process.env.TESTNET_ACCESS_TOKEN) {
    throw new Error(
      'Please set TESTNET_ACCESS_TOKEN environment variable with your BitGo access token'
    );
  }

  const result: CreationResult = {
    success: [],
    failed: [],
  };

  const startTime = Date.now();

  for (let i = 0; i < TOTAL_WALLETS; i++) {
    const progress = ((i + 1) / TOTAL_WALLETS * 100).toFixed(1);
    console.log(`\n[${progress}%] Creating wallet ${i + 1}/${TOTAL_WALLETS}...`);

    try {
      const credentials = await createWalletWithRetry(i);
      result.success.push(credentials);

      console.log(`  ✓ Created: ${credentials.walletId}`);
      console.log(`    Address: ${credentials.receiveAddress}`);

      // Save progress incrementally (in case of interruption)
      if ((i + 1) % 10 === 0 || i === TOTAL_WALLETS - 1) {
        saveCredentials(result.success, OUTPUT_FILE);
        console.log(`  [Saved ${result.success.length} wallets to ${OUTPUT_FILE}]`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`  ✗ Failed: ${errorMessage}`);
      result.failed.push({ index: i + 1, error: errorMessage });
    }

    // Rate limiting delay (skip on last iteration)
    if (i < TOTAL_WALLETS - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  const endTime = Date.now();
  const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total time: ${durationMinutes} minutes`);
  console.log(`Successfully created: ${result.success.length} wallets`);
  console.log(`Failed: ${result.failed.length} wallets`);

  if (result.failed.length > 0) {
    console.log('\nFailed wallet indices:');
    result.failed.forEach((f) => console.log(`  - Wallet ${f.index}: ${f.error}`));
  }

  console.log(`\nCredentials saved to: ${path.resolve(__dirname, OUTPUT_FILE)}`);
  console.log('\n⚠️  IMPORTANT: Store the credentials file securely!');
  console.log('    The backup keys are required for wallet recovery.');

  return result;
}

// Run the script
createBulkWallets()
  .then((result) => {
    process.exit(result.failed.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  });
