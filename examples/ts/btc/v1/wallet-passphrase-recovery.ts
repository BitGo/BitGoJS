#!/usr/bin/env node
/**
 * Wallet Passphrase Recovery Script
 *
 * This script takes box D information in the keycard and recovers the wallet passphrase.
 *
 * The script will prompt for:
 * - Environment (test/prod)
 * - Activation code
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

    console.log(`\n✅ SUCCESS: the decrypted passphrase is: ${walletPassphrase}`);
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
