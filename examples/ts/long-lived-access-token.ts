/**
 * Long-Lived Access Token Example
 *
 * This example demonstrates how to:
 * 1. Initialize BitGo with a long-lived access token (two methods)
 * 2. Verify the token is correctly set
 * 3. Test the token by listing wallets for an enterprise
 *
 * Long-lived access tokens are generated from the BitGo dashboard or via API and can be set to
 * expire after extended periods (days, months, or never). They are ideal for server applications,
 * automated scripts, and integrations where interactive authentication is not feasible.
 *
 * To create a long-lived access token:
 * 1. Log in to your BitGo account (test.bitgo.com or www.bitgo.com)
 * 2. Go to Settings > Developer Options > Access Tokens
 * 3. Create a new token with the required permissions and duration
 * 4. Copy the token and store it securely
 *
 * Copyright 2025, BitGo, Inc. All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

// TODO: Set your long-lived access token from BitGo dashboard
// You can set this in your .env file as LONG_LIVED_ACCESS_TOKEN
const longLivedAccessToken = process.env.LONG_LIVED_ACCESS_TOKEN || 'your-long-lived-access-token-here';

// TODO: Set your enterprise ID (you can find this in your BitGo dashboard)
const enterpriseId = process.env.ENTERPRISE_ID || 'your-enterprise-id';

const coin = 'tbtc';

/**
 * Method 1: Initialize BitGo with access token in constructor
 * This is the recommended approach as it sets up the BitGo instance ready to use
 */
async function method1_initializeWithToken() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Method 1: Initialize with Token in Constructor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Initialize BitGo with the access token
  const bitgo = new BitGoAPI({
    accessToken: longLivedAccessToken,
    env: 'test', // Change this to env: 'prod' when you are ready for production
  });

  bitgo.register(coin, Tbtc.createInstance);

  console.log('✓ BitGo initialized with access token in constructor\n');

  // Access the token (note: _token is a protected property, but we can verify it's set)
  console.log('Token Information:');
  console.log(
    `  Preview: ${longLivedAccessToken.substring(0, 20)}...${longLivedAccessToken.substring(
      longLivedAccessToken.length - 10
    )}`
  );
  console.log(`  Length: ${longLivedAccessToken.length} characters\n`);

  return bitgo;
}

/**
 * Method 2: Authenticate with access token after initialization
 * This method can be used when you need to set the token after creating the BitGo instance
 */
async function method2_authenticateWithToken() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Method 2: Authenticate with Token After Initialization');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Initialize BitGo without an access token
  const bitgo = new BitGoAPI({
    env: 'test', // Change this to env: 'prod' when you are ready for production
  });

  bitgo.register(coin, Tbtc.createInstance);

  console.log('Step 1: BitGo initialized without token');

  // Authenticate using the access token
  bitgo.authenticateWithAccessToken({ accessToken: longLivedAccessToken });

  console.log('Step 2: ✓ Authenticated with access token using authenticateWithAccessToken() method\n');

  console.log('Token Information:');
  console.log(
    `  Preview: ${longLivedAccessToken.substring(0, 20)}...${longLivedAccessToken.substring(
      longLivedAccessToken.length - 10
    )}`
  );
  console.log(`  Length: ${longLivedAccessToken.length} characters\n`);

  return bitgo;
}

/**
 * Test the access token by listing wallets for an enterprise
 */
async function testTokenByListingWallets(bitgo: BitGoAPI) {
  console.log('Testing Access Token:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('Fetching wallets for enterprise...');

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
      console.log('\nNote: This might be expected if:');
      console.log('  • The enterprise has no wallets for this coin');
      console.log('  • The access token does not have permission to view wallets');
      console.log('  • The enterprise ID is incorrect');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (walletError: any) {
    console.error('❌ Error listing wallets:', walletError.message);
    if (walletError.status) {
      console.error(`Status: ${walletError.status}`);
    }
    if (walletError.message.includes('enterprise')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   • Make sure to set the correct ENTERPRISE_ID in your .env file');
      console.log('   • Verify your access token has permission to view wallets');
    }
    if (walletError.message.includes('unauthorized') || walletError.status === 401) {
      console.log('\n💡 Troubleshooting:');
      console.log('   • Verify your access token is valid and not expired');
      console.log('   • Check that you are using the correct environment (test/prod)');
      console.log('   • Ensure the token has the necessary scopes/permissions');
    }
    throw walletError;
  }
}

async function main() {
  try {
    console.log('========================================');
    console.log('Long-Lived Access Token Example');
    console.log('========================================');

    // Validate that the token is set
    if (!longLivedAccessToken || longLivedAccessToken === 'your-long-lived-access-token-here') {
      console.error('\n❌ Error: Long-lived access token not set!');
      console.log('\n📝 To run this example:');
      console.log('   1. Create a long-lived access token in your BitGo dashboard:');
      console.log('      • Log in to test.bitgo.com (or www.bitgo.com for production)');
      console.log('      • Go to Settings > Developer Options > Access Tokens');
      console.log('      • Click "Add Token" and configure permissions and duration');
      console.log('      • Copy the generated token\n');
      console.log('   2. Set the token:');
      console.log('      • Option A: Add LONG_LIVED_ACCESS_TOKEN=your-token to .env file');
      console.log('      • Option B: Set it directly in this file (not recommended for production)\n');
      console.log('   3. Set your ENTERPRISE_ID in the same way\n');
      return;
    }

    // Demonstrate Method 1
    console.log('\n' + '='.repeat(50));
    console.log('Demonstrating Method 1');
    console.log('='.repeat(50));
    const bitgo1 = await method1_initializeWithToken();
    await testTokenByListingWallets(bitgo1);

    // Demonstrate Method 2
    console.log('\n' + '='.repeat(50));
    console.log('Demonstrating Method 2');
    console.log('='.repeat(50));
    const bitgo2 = await method2_authenticateWithToken();
    await testTokenByListingWallets(bitgo2);

    // Summary
    console.log('\n========================================');
    console.log('Example completed successfully!');
    console.log('========================================');

    console.log('\n📝 Summary:');
    console.log('   Both methods successfully authenticated and retrieved wallets!');
    console.log('\n   Method 1 (Constructor):');
    console.log('     • Best for: Setting token at initialization');
    console.log('     • Use when: You have the token available when creating BitGo instance');
    console.log('\n   Method 2 (authenticateWithAccessToken):');
    console.log('     • Best for: Setting/changing token after initialization');
    console.log('     • Use when: You need to switch tokens or set it dynamically');

    console.log('\n📝 Important Notes:');
    console.log('   • Long-lived tokens should be stored securely (environment variables, secrets manager)');
    console.log('   • Never commit access tokens to version control');
    console.log('   • Rotate tokens regularly for security');
    console.log('   • Use appropriate scopes/permissions for each token');
    console.log('   • Monitor token usage in your BitGo dashboard');
    console.log('   • Set appropriate expiration times based on your security requirements\n');
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
  }
}

main().catch((e) => console.error('Unhandled error:', e));
