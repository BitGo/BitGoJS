#!/usr/bin/env node
/**
 * Wallet Passphrase Recovery Script
 *
 * This script takes box D information in the keycard and recovers the wallet passphrase.
 *
 * The script will prompt for:
 * - Environment (test/prod)
 * - Encrypted wallet passphrase from Box D of keycard
 * - Activation code
 *  Usage:
 *   tsx wallet-password-recovery.ts
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Btc, Tbtc } from '@bitgo/sdk-coin-btc';
import * as readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask questions in the terminal
function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function main(): Promise<void> {
  try {
    console.log('BitGo V1 Wallet Password Recovery Tool');
    console.log('====================================\n');

    // Get environment setting
    const envInput = await askQuestion(
      'Enter environment (test/prod) [default: test]: ',
    );
    const env = envInput.toLowerCase() === 'prod' ? 'prod' : 'test';

    // Initialize BitGo
    const bitgo = new BitGoAPI({
      env: env,
    });

    // Get activation code
    const activationCode = await askQuestion('Enter activation code: ');

    // Get encrypted wallet passphrase from Box D
    const encryptedWalletPassphrase = await askQuestion(
      'Enter encrypted wallet passphrase from Box D: ',
    );

    // Decrypt the wallet passphrase
    const walletPassphrase = bitgo.decrypt({
      input: encryptedWalletPassphrase,
      password: activationCode,
    });

    console.log('\n✅ SUCCESS: The password is valid for this wallet.');
    console.log(`
Please store this passphrase securely as it provides access to your wallet.
Do not share this passphrase with anyone.`);
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    if (error.status) {
      console.error(`Status code: ${error.status}`);
    }
    console.error('Please check your credentials and try again.');
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
