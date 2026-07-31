#!/usr/bin/env node
/**
 * Wallet Passphrase Recovery Script
 *
 * This script recovers the wallet passphrase for V1 Wallets by authenticating with BitGo,
 * retrieving the passcodeEncryptionCode from the API, and using it to decrypt Box D of the keycard.
 *
 * The script will prompt for:
 * - Environment (test/prod)
 * - BitGo credentials (username, password, OTP)
 * - Wallet ID
 * - Encrypted wallet passphrase from Box D of keycard
 *
 * You need to install node and BitGoJS SDK to run this script.
 *
 * To install node, you can follow the instructions here: https://nodejs.org/en/download
 *
 * To install BitGoJS SDK, you can use the following command:
 *   npm install @bitgo/sdk-api
 *
 * Usage:
 *   tsx wallet-passphrase-recovery.ts
 *                  OR
 *   npx ts-node wallet-passphrase-recovery.ts
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
    const envInput = await askQuestion('Enter environment (test/prod) [default: test]: ');
    const env = envInput.toLowerCase() === 'prod' ? 'prod' : 'test';

    // Initialize BitGo
    const bitgo = new BitGoAPI({
      env: env,
    });

    // Register appropriate coin based on environment
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

    console.log('\nAuthenticating with BitGo (via /api/v2/user/login)...');

    // Authenticate with BitGo via /api/v2/user/login (avoids Cloudflare challenge on /api/auth/v1/session)
    const loginResponse = await bitgo
      .post(bitgo.url('/user/login', 2))
      .send({ email: username, password, otp: loginOtp })
      .result();

    let accessToken: string;
    if (loginResponse.access_token) {
      accessToken = loginResponse.access_token;
    } else if (loginResponse.encryptedToken) {
      // Legacy accounts return an ECDH-encrypted token instead of a plain access_token
      const { token } = await bitgo.handleTokenIssuance(loginResponse, password);
      accessToken = token;
    } else {
      throw new Error('Login did not return a usable token (no access_token or encryptedToken).');
    }

    bitgo.authenticateWithAccessToken({ accessToken });

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
    console.log(`\nFetching recovery info from ${path.toString()}`);

    const recoveryResponse = await bitgo.post(path.toString()).result();

    console.log('Recovery information retrieved successfully.');

    // Extract passcode encryption code
    if (!recoveryResponse.recoveryInfo || !recoveryResponse.recoveryInfo.passcodeEncryptionCode) {
      throw new Error('Recovery info not found or missing passcode encryption code');
    }

    const { passcodeEncryptionCode, encryptedXprv } = recoveryResponse.recoveryInfo;

    // Get encrypted wallet passphrase from Box D
    const encryptedWalletPassphrase = await askQuestion('\nEnter encrypted wallet passphrase from Box D: ');

    if (!encryptedWalletPassphrase) {
      throw new Error('Encrypted wallet passphrase is required');
    }

    console.log('\nDecrypting wallet passphrase using recovery information...');

    // Decrypt the wallet passphrase
    const walletPassphrase = await bitgo.decrypt({
      input: encryptedWalletPassphrase,
      password: passcodeEncryptionCode,
    });

    console.log('Successfully decrypted the wallet passphrase.');

    // Validate the decrypted passphrase against the wallet's encrypted xprv
    console.log('\nValidating the decrypted passphrase against wallet keys...');

    const coin = bitgo.coin(coinType);

    try {
      coin.assertIsValidKey({
        encryptedPrv: encryptedXprv,
        walletPassphrase: walletPassphrase,
      });

      console.log(`\n✅ SUCCESS: the decrypted passphrase is: ${walletPassphrase}`);
      console.log(`
Please store this passphrase securely as it provides access to your wallet.
Do not share this passphrase with anyone.`);
    } catch (error) {
      console.error('\n❌ VALIDATION FAILED: The recovered passphrase could not validate the wallet key.');
      console.error('Please check that you entered the correct encrypted passphrase from Box D.');
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

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
