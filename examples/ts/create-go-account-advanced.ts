/**
 * Advanced Go Account Creation Example (Low-Level SDK Approach)
 *
 * This script demonstrates how to create a Go Account with manual control over
 * keychain creation and wallet setup. This approach gives you fine-grained control
 * over the wallet creation process and is useful for:
 * - Advanced users who need custom key management
 * - Understanding the internals of Go Account creation
 * - Integrating with custom key management systems
 *
 * For most use cases, prefer the simpler approach in create-go-account.ts
 *
 * This example does NOT use BitGo Express - all operations use the SDK directly
 * against the BitGo platform APIs.
 *
 * IMPORTANT: You must backup the encrypted private key and encrypted wallet passphrase!
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
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
 * Helper function to sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Step 1: Create a keychain locally
 * This generates a public/private key pair on the client side
 */
async function createKeychain() {
  console.log('Creating keychain locally...');
  const ofcCoin = bitgo.coin(coin);
  const keychain = ofcCoin.keychains().create();

  console.log(`✓ Keychain created`);
  console.log(`  Public Key: ${keychain.pub}`);
  console.log(`  Private Key (unencrypted): ${keychain.prv?.substring(0, 20)}...`);
  console.log('\nKeychain Response:');
  console.log(JSON.stringify({
    pub: keychain.pub,
    prv: keychain.prv ? `${keychain.prv.substring(0, 20)}... (truncated for security)` : undefined,
  }, null, 2));

  return keychain;
}

/**
 * Step 2: Encrypt the private key with the wallet passphrase
 * This protects the private key before sending it to BitGo
 */
function encryptPrivateKey(privateKey: string, password: string): string {
  console.log('Encrypting private key...');
  const encrypted = bitgo.encrypt({
    password,
    input: privateKey
  });
  console.log(`✓ Private key encrypted`);
  console.log('\nEncrypted Private Key (preview):');
  console.log(encrypted.substring(0, 100) + '...');
  return encrypted;
}

/**
 * Step 3: Add the keychain to BitGo
 * This registers the key with BitGo and associates it with your enterprise
 */
async function addKeychain(
  publicKey: string,
  encryptedPrivateKey: string,
  enterpriseId: string,
  passcodeEncryptionCode: string
) {
  console.log('Adding keychain to BitGo...');
  const ofcCoin = bitgo.coin(coin);

  const keychainParams = {
    pub: publicKey,
    encryptedPrv: encryptedPrivateKey,
    originalPasscodeEncryptionCode: passcodeEncryptionCode,
    keyType: 'independent' as const,
    source: 'user' as const,
    enterprise: enterpriseId,
  };

  const addedKeychain = await ofcCoin.keychains().add(keychainParams);
  console.log(`✓ Keychain added to BitGo`);
  console.log(`  Keychain ID: ${addedKeychain.id}`);
  console.log('\nAdd Keychain Response:');
  console.log(JSON.stringify(addedKeychain, null, 2));

  return addedKeychain;
}

/**
 * Step 4: Create the Go Account wallet
 * This creates a 1-of-1 trading wallet using the keychain
 */
async function createGoAccountWallet(
  keychainId: string,
  walletLabel: string,
  enterpriseId: string
) {
  console.log('Creating Go Account wallet...');
  const ofcCoin = bitgo.coin(coin);

  const walletParams = {
    label: walletLabel,
    m: 1, // 1-of-1 signature required
    n: 1, // 1 total key
    keys: [keychainId],
    type: 'trading' as const, // Required for Go Accounts
    enterprise: enterpriseId,
    tags: [] as string[],
  };

  const walletResponse = await ofcCoin.wallets().add(walletParams);
  const wallet = walletResponse.wallet;

  console.log(`✓ Go Account wallet created`);
  console.log(`  Wallet ID: ${wallet.id()}`);
  console.log(`  Wallet Label: ${walletLabel}`);
  console.log('\nWallet Response:');
  console.log(JSON.stringify(walletResponse, null, 2));

  return wallet;
}

/**
 * Step 5: Wait for wallet initialization to complete
 * Go Accounts require system initialization which can take a few seconds
 */
async function waitForWalletInitialization(
  walletId: string,
  maxRetries = 30,
  delayMs = 2000
): Promise<void> {
  console.log('Waiting for wallet initialization...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const walletData = await bitgo.coin(coin).wallets().get({ id: walletId });
      const coinSpecific = walletData._wallet.coinSpecific as { pendingSystemInitialization?: boolean };
      const pendingInitialization = coinSpecific?.pendingSystemInitialization;

      console.log(`  Attempt ${attempt}/${maxRetries}: Pending = ${pendingInitialization}`);

      if (!pendingInitialization) {
        console.log('✓ Wallet initialization complete!');
        return;
      }

      await sleep(delayMs);
    } catch (error) {
      console.error(`  Error checking wallet status: ${error}`);
      throw error;
    }
  }

  throw new Error('Wallet initialization timeout');
}

/**
 * Step 6: Create a receive address for the wallet
 * Note: onToken is REQUIRED for OFC (Go Account) wallets
 */
async function createReceiveAddress(
  wallet: Wallet,
  addressLabel: string,
  onToken: string
) {
  console.log(`Creating address for token ${onToken}...`);

  const addressParams = {
    label: addressLabel,
    onToken: onToken
  };

  const address = await wallet.createAddress(addressParams);
  console.log(`✓ Address created: ${address.address}`);
  console.log('\nAddress Response:');
  console.log(JSON.stringify(address, null, 2));

  return address;
}

/**
 * Main function - orchestrates the complete Go Account creation flow
 */
async function main() {
  try {
    console.log('=== Advanced Go Account Creation ===\n');
    console.log('This example shows manual control over keychain and wallet creation.\n');

    // Step 1: Create keychain locally
    console.log('Step 1: Generate Keychain');
    console.log('-'.repeat(50));
    const keychain = await createKeychain();
    if (!keychain.prv) {
      throw new Error('Failed to generate private key');
    }
    console.log();

    // Step 2: Encrypt the private key
    console.log('Step 2: Encrypt Private Key');
    console.log('-'.repeat(50));
    const encryptedPrivateKey = encryptPrivateKey(keychain.prv, passphrase);
    console.log();

    // Step 3: Add keychain to BitGo
    console.log('Step 3: Register Keychain with BitGo');
    console.log('-'.repeat(50));
    const addedKeychain = await addKeychain(
      keychain.pub as string,
      encryptedPrivateKey,
      enterprise,
      passcodeEncryptionCode
    );
    console.log();

    // Step 4: Create the wallet
    console.log('Step 4: Create Go Account Wallet');
    console.log('-'.repeat(50));
    const wallet = await createGoAccountWallet(
      addedKeychain.id!,
      label,
      enterprise
    );
    console.log();

    // Step 5: Wait for initialization
    console.log('Step 5: Wait for System Initialization');
    console.log('-'.repeat(50));
    await waitForWalletInitialization(wallet.id());
    console.log();

    // Step 6: Create token-specific address (required for OFC wallets)
    console.log(`Step 6: Create Token Address (${token})`);
    console.log('-'.repeat(50));
    try {
      await createReceiveAddress(wallet, `${token} Address`, token);
    } catch (error) {
      console.log(`  Error: Token address creation failed. Token may not be enabled.`);
      console.error(`  Error: ${error}`);
      throw error;
    }
    console.log();

    // Display backup information
    console.log('='.repeat(60));
    console.log('BACKUP THE FOLLOWING INFORMATION');
    console.log('='.repeat(60));
    console.log('\nWallet Information:');
    console.log(`  Wallet ID: ${wallet.id()}`);
    console.log(`  Label: ${label}`);
    console.log('\nKeychain Information:');
    console.log(`  Keychain ID: ${addedKeychain.id}`);
    console.log(`  Public Key: ${addedKeychain.pub}`);
    console.log(`  Encrypted Private Key: ${addedKeychain.encryptedPrv}`);
    console.log('\nPassphrase Information:');
    console.log(`  Encrypted Wallet Passphrase: ${bitgo.encrypt({
      password: passcodeEncryptionCode,
      input: passphrase
    })}`);
    console.log('\n' + '='.repeat(60));

    console.log('\n✓ Go Account setup complete!');

    console.log('Next Steps:');
    console.log('1. Securely backup all keychain and passphrase information');
    console.log('2. Retrieve wallet: bitgo.coin("ofc").wallets().get({ id: "' + wallet.id() + '" })');
    console.log('3. Create additional addresses: wallet.createAddress({ label: "...", onToken: "..." })');
    console.log('4. Fund the wallet and start trading!');

  } catch (error) {
    console.error('\n❌ Error creating Go Account:', error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\n❌ Error creating Go Account:', e);
  process.exit(1);
});
