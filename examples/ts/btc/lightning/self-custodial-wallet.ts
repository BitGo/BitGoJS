/**
 * Create a Lightning self-custodial wallet at BitGo.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality. Contact BitGo support if you receive a
 * license-related error.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';
import * as crypto from 'crypto';
require('dotenv').config({ path: '../../.env' });

// TODO: set access token for testnet
// Get this from your BitGo account
const accessToken = process.env.TESTNET_ACCESS_TOKEN || '';

// TODO: set passphrase to create a wallet
const passphrase = process.env.WALLET_PASSPHRASE || '';

// TODO: set your enterprise ID
const enterprise = process.env.ENTERPRISE_ID || '';

// Generate a passcode encryption code (required for Lightning wallets)
// IMPORTANT: Store this information securely. You will need it to recover your wallet if you lose wallet password.
const passcodeEncryptionCode = process.env.PASSCODE_ENCRYPTION_CODE || crypto.randomBytes(32).toString('hex');

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * Create a Lightning self-custodial wallet
 * This function creates a self-custodial Lightning wallet on the BitGo platform
 * @returns {Promise<any>} Wallet object
 */
async function main(): Promise<any> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    // Create unique label for the wallet
    const label = `Lightning Self-Custodial Wallet ${new Date().toISOString()}`;

    // Configure wallet creation options
    const walletOptions = {
      label,
      passphrase,
      enterprise,
      passcodeEncryptionCode,
      subType: 'lightningSelfCustody' as const,
    };

    console.log('Creating Lightning self-custodial wallet...');
    console.log('Note: This requires the custodyLightningWallet license on your BitGo account.');

    const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);
    const walletInstance = wallet.wallet;

    // Display wallet information
    console.log('\nWallet created successfully:');
    console.log(`Wallet ID: ${walletInstance.id()}`);
    console.log(`Wallet label: ${walletInstance.label()}`);
    console.log(`Wallet type: ${walletInstance.type()}`);
    console.log(`Wallet subType: ${walletInstance.subType()}`);

    // Display backup information
    console.log('\nIMPORTANT - BACKUP THIS INFORMATION:');
    console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);

    // CRITICAL: Node Auth keychain is required for self-custodial Lightning wallets
    console.log(`Passcode Encryption Code: ${passcodeEncryptionCode}`);
    console.log('\nStore this information securely. You will need it to recover your wallet.');

    return wallet;
  } catch (e) {
    throw e;
  }
}

// Run the example
main()
  .then(() => {
    console.log('Example completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Example failed with error:', e.message);
    process.exit(-1);
  });