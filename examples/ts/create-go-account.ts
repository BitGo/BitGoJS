/**
 * Create a Go Account wallet at BitGo (SDK Approach)
 *
 * This example demonstrates creating a Go Account using the BitGo SDK's high-level
 * generateWallet() method. This is the recommended approach for most use cases.
 *
 * This does NOT use BitGo Express - it communicates directly with BitGo platform APIs.
 * Express is optional middleware; this example shows you can work directly with the SDK.
 *
 * For advanced users who need manual keychain control, see create-go-account-advanced.ts
 *
 * IMPORTANT: You must backup the encrypted private key and encrypted wallet passphrase!
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Go Accounts use the 'ofc' (Off-Chain) coin
const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

// Configuration - Update these values
const label = 'Go Account Wallet';
const passphrase = 'go_account_wallet_passphrase';
const passcodeEncryptionCode = 'encryption_code_for_passphrase';
const enterprise = 'your_enterprise_id';

// Token to create address for (required for OFC wallets)
// Examples: 'ofctsol:usdc', 'ofctsol:usdt', 'ofcttrx:usdt', 'ofcbtc', 'ofceth'
const token = 'ofctsol';

/**
 * Helper function to wait for wallet initialization
 * Go Accounts require system initialization which can take a few seconds
 */
async function waitForWalletInitialization(
  walletId: string,
  maxRetries = 30,
  delayMs = 2000
): Promise<void> {
  console.log('Waiting for wallet initialization...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const walletData = await bitgo.coin(coin).wallets().get({ id: walletId });
    const coinSpecific = walletData._wallet.coinSpecific as { pendingSystemInitialization?: boolean };
    const pendingInitialization = coinSpecific?.pendingSystemInitialization;

    if (!pendingInitialization) {
      console.log('✓ Wallet initialization complete!');
      return;
    }

    console.log(`  Waiting... (${attempt}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('Wallet initialization timeout');
}

async function main() {
  console.log('=== Creating Go Account (SDK Approach) ===\n');

  // Step 1: Generate the Go Account wallet (handles keychain creation internally)
  console.log('Generating Go Account wallet...');
  const response = await bitgo.coin(coin).wallets().generateWallet({
    label,
    passphrase,
    passcodeEncryptionCode,
    enterprise,
    type: 'trading', // Required for Go Accounts
  });

  // Type guard to ensure we got a Go Account response
  if (!('userKeychain' in response)) {
    throw new Error('Go account missing required user keychain');
  }

  const { wallet, userKeychain, encryptedWalletPassphrase } = response;

  console.log(`\n✓ Wallet created successfully!`);
  console.log(`Wallet ID: ${wallet.id()}`);
  console.log('\nWallet Response:');
  console.log(JSON.stringify(response, null, 2));

  // Step 2: Wait for wallet initialization
  await waitForWalletInitialization(wallet.id());

  // Step 3: Create token-specific address (required for OFC wallets)
  console.log(`\nCreating address for token ${token}...`);
  try {
    const tokenAddress = await wallet.createAddress({
      label: `${token} Address`,
      onToken: token
    });
    console.log(`✓ Address created: ${tokenAddress.address}`);
    console.log('\nAddress Response:');
    console.log(JSON.stringify(tokenAddress, null, 2));
  } catch (error) {
    console.log(`  Error: Token address creation failed. Token may not be enabled.`);
    console.error(`  Error: ${error}`);
    throw error;
  }

  // Display backup information
  console.log('\n' + '='.repeat(60));
  console.log('BACKUP THE FOLLOWING INFORMATION');
  console.log('='.repeat(60));
  console.log('\nWallet Information:');
  console.log(`  Wallet ID: ${wallet.id()}`);
  console.log(`  Label: ${label}`);
  console.log('\nKeychain Information:');
  console.log(`  Keychain ID: ${userKeychain.id}`);
  console.log(`  Public Key: ${userKeychain.pub}`);
  console.log(`  Encrypted Private Key: ${userKeychain.encryptedPrv}`);
  console.log('\nPassphrase Information:');
  console.log(`  Encrypted Wallet Passphrase: ${encryptedWalletPassphrase}`);
  console.log('\n' + '='.repeat(60));

  console.log('\n✓ Go Account setup complete!');

  console.log('\nNext Steps:');
  console.log('1. Securely backup all keychain and passphrase information');
  console.log('2. Retrieve wallet: bitgo.coin("ofc").wallets().get({ id: "' + wallet.id() + '" })');
  console.log('3. Create additional addresses: wallet.createAddress({ label: "...", onToken: "..." })');
  console.log('4. Fund the wallet and start trading!');
}

main().catch((e) => {
  console.error('\n❌ Error creating Go Account:', e);
  process.exit(1);
});

