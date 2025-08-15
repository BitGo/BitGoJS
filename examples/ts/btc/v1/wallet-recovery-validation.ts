#!/usr/bin/env node
/**
 * Wallet Recovery Validation Script
 *
 * This script retrieves a wallet's recovery info from BitGo and validates it against
 * the user's keycard information (Box D). It helps recover the original wallet password for V1 Wallets Only.
 *
 * Usage:
 *   ts-node wallet-recovery-validation.ts
 *
 * The script will prompt for:
 * - BitGo credentials (username, password, OTP)
 * - Wallet ID
 * - Encrypted private key from Box D of keycard
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
    console.log('BitGo Wallet Recovery Validation Tool');
    console.log('====================================\n');

    // Get environment setting
    const envInput = await askQuestion('Enter environment (test/prod) [default: test]: ');
    const env = envInput.toLowerCase() === 'prod' ? 'prod' : 'test';

    // Initialize BitGo
    const bitgo = new BitGoAPI({
      env: env,
    });

    // Register appropriate coin based on environment
    // For prod use BTC, for test use TBTC
    const coinType = env === 'prod' ? 'btc' : 'tbtc';
    if (coinType === 'btc') {
      bitgo.register('btc', Btc.createInstance);
      console.log('Using production environment with BTC');
    } else {
      bitgo.register('tbtc', Tbtc.createInstance);
      console.log('Using test environment with TBTC');
    }

    // Get login credentials from stdin
    const username = await askQuestion('\nEnter your BitGo username: ');
    const password = await askQuestion('Enter your BitGo password: ');
    const loginOtp = await askQuestion('Enter your OTP code for login: ');

    console.log('\nAuthenticating with BitGo...');

    // Authenticate with BitGo
    await bitgo.authenticate({
      username,
      password,
      otp: loginOtp,
    });

    console.log('Authentication successful.');

    // Get a fresh OTP for session unlock
    const unlockOtp = await askQuestion('\nEnter a new OTP code for session unlock: ');

    // Unlock session
    console.log('Unlocking session...');
    await bitgo.unlock({ otp: unlockOtp });
    console.log('Session unlocked successfully.');

    // Get wallet ID from user
    const walletId = await askQuestion('\nEnter your wallet ID: ');

    // Retrieve wallet instance
    console.log(`Retrieving wallet information for ID: ${walletId}...`);
    const walletInstance = await bitgo.wallets().get({ id: walletId });

    if (!walletInstance) {
      throw new Error('Wallet not found');
    }

    console.log(`Wallet found: ${walletInstance.label()}`);

    // Retrieve recovery info from BitGo
    const path = bitgo.url(`/wallet/${walletInstance.id()}/passcoderecovery`);
    console.log(`
Fetching user keychain recovery info from ${path.toString()}`);

    // Using the walletId to call the passcode recovery API
    const recoveryResponse = await bitgo.post(path.toString()).result();

    console.log('Recovery information retrieved successfully.');

    // Extract passcode encryption code
    if (!recoveryResponse.recoveryInfo || !recoveryResponse.recoveryInfo.passcodeEncryptionCode) {
      throw new Error('Recovery info not found or missing passcode encryption code');
    }

    const { passcodeEncryptionCode, encryptedXprv } = recoveryResponse.recoveryInfo;

    console.log(`
Recovery information received:
- Passcode Encryption Code: ${passcodeEncryptionCode}
- Encrypted xprv is available for validation`);

    // Get encrypted private key from Box D
    const encryptedPrv = await askQuestion('\nEnter your encrypted private key from Box D of your keycard: ');

    if (!encryptedPrv) {
      throw new Error('Encrypted private key is required');
    }

    console.log('\nDecrypting wallet password using recovery information...');

    // Decrypt the original password
    const decryptedPassword = bitgo.decrypt({
      password: passcodeEncryptionCode,
      input: encryptedPrv,
    });

    console.log('Successfully decrypted the original password.');

    // Validate the decrypted password against the wallet's encrypted xprv
    console.log('\nValidating the decrypted password against wallet keys...');

    // Get the coin instance
    const coin = bitgo.coin(coinType);

    try {
      // This will throw if the key is invalid
      coin.assertIsValidKey({
        encryptedPrv: encryptedXprv,
        walletPassphrase: decryptedPassword,
      });

      console.log('\n✅ SUCCESS: The password is valid for this wallet.');
      console.log(`
Your original wallet password is: ${decryptedPassword}

Please store this password securely as it provides access to your wallet.
Do not share this password with anyone.`);
    } catch (error) {
      console.error('\n❌ VALIDATION FAILED: The recovered password could not validate the wallet key.');
      console.error('Please check that you entered the correct encrypted private key from Box D.');
      console.error(`Error details: ${error.message}`);
    }
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

// Run the main function
main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
