/**
 * Short-Lived Access Token Example
 *
 * This example demonstrates how to:
 * 1. Authenticate with username, password, and OTP to generate a short-lived access token
 * 2. Retrieve and display the access token
 * 3. Test the token by listing wallets for an enterprise
 *
 * Short-lived access tokens are generated through the login process and expire after a set period.
 * They are ideal for interactive applications where users authenticate with their credentials.
 *
 * Copyright 2025, BitGo, Inc. All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

// TODO: Set your test environment credentials in .env file or directly here
const username = process.env.TEST_EMAIL || 'your-email@example.com';
const password = process.env.TEST_PASS || 'your-password';
const otp = process.env.TEST_OTP || '000000'; // Use your current OTP code

// TODO: Set your enterprise ID (you can find this in your BitGo dashboard)
const enterpriseId = process.env.ENTERPRISE_ID || 'your-enterprise-id';

// Initialize BitGo without an access token
const bitgo = new BitGoAPI({
  env: 'test', // Change this to env: 'prod' when you are ready for production
});

const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

async function main() {
  try {
    console.log('========================================');
    console.log('Short-Lived Access Token Example');
    console.log('========================================\n');

    // Step 1: Authenticate with username, password, and OTP
    console.log('Step 1: Authenticating with username, password, and OTP...');
    const authResponse = await bitgo.authenticate({
      username,
      password,
      otp,
    });

    console.log('✓ Authentication successful!\n');

    // Step 2: Display the access token
    console.log('Step 2: Retrieving access token...');
    const accessToken = authResponse.access_token;

    if (!accessToken) {
      throw new Error('No access token received from authentication');
    }

    console.log('✓ Access token generated successfully!\n');
    console.log('Access Token Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Token: ${accessToken}`);
    console.log(`Token Preview: ${accessToken.substring(0, 20)}...${accessToken.substring(accessToken.length - 10)}`);
    console.log(`Token Length: ${accessToken.length} characters`);
    console.log(`User ID: ${authResponse.user?.id || 'N/A'}`);
    console.log(`Username: ${authResponse.user?.username || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 3: Test the token by listing wallets for an enterprise
    console.log('Step 3: Testing the access token by listing wallets...');

    try {
      const wallets = await bitgo.coin(coin).wallets().list({
        enterprise: enterpriseId,
      });

      console.log('✓ Successfully retrieved wallets using the access token!\n');
      console.log('Wallet List:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (wallets.wallets && wallets.wallets.length > 0) {
        wallets.wallets.forEach((wallet, index) => {
          console.log(`\nWallet ${index + 1}:`);
          console.log(`  Label: ${wallet.label()}`);
          console.log(`  ID: ${wallet.id()}`);
          console.log(`  Coin: ${wallet.coin()}`);
          console.log(`  Balance: ${wallet.balanceString()}`);
        });
        console.log(`\nTotal wallets found: ${wallets.wallets.length}`);
      } else {
        console.log('No wallets found for this enterprise.');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (walletError: any) {
      console.error('Error listing wallets:', walletError.message);
      if (walletError.message.includes('enterprise')) {
        console.log(
          '\nNote: Make sure to set the correct ENTERPRISE_ID in your .env file or at the top of this script.'
        );
      }
    }

    console.log('========================================');
    console.log('Example completed successfully!');
    console.log('========================================');

    // Note about token expiration
    console.log('\n📝 Important Notes:');
    console.log('   • This access token is short-lived and will expire');
    console.log('   • Typical expiration time is 1 hour (check your BitGo settings)');
    console.log('   • You will need to re-authenticate to get a new token after expiration');
    console.log('   • Store this token securely and never commit it to version control\n');
  } catch (error: any) {
    console.error('\n❌ Error occurred:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`Message: ${error.message}`);
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    if (error.result) {
      console.error(`Details: ${JSON.stringify(error.result, null, 2)}`);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (error.message.includes('otp') || error.message.includes('401')) {
      console.log('💡 Troubleshooting:');
      console.log('   • Verify your username and password are correct');
      console.log('   • Make sure you are using a valid OTP code (not 000000 for production)');
      console.log('   • Check if your account has 2FA enabled');
      console.log('   • Ensure you are using the correct environment (test/prod)\n');
    }
  }
}

main().catch((e) => console.error('Unhandled error:', e));
