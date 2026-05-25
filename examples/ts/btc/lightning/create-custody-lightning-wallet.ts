/**
 * Create a Lightning custodial wallet at BitGo.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality. Contact BitGo support if you receive a
 * license-related error.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';

// TODO: set access token for testnet
// Get this from your BitGo account
const accessToken = '';

// TODO: set passphrase to create a wallet
const passphrase = '';

// TODO: set your enterprise ID
const enterprise = '';

// Generate a passcode encryption code (required for Lightning wallets)
// IMPORTANT: Store this information securely. You will need it to recover your wallet if you lose wallet password.
const passcodeEncryptionCode = '';

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * Create a Lightning custodial wallet
 * This function creates a custodial Lightning wallet on the BitGo platform
 * @returns {Promise<void>} Wallet object
 */
async function main(): Promise<void> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    // Create unique label for the wallet
    const label = `Lightning Wallet ${new Date().toISOString()}`;

    // Configure wallet creation options
    const walletOptions = {
      label,
      passphrase,
      enterprise,
      passcodeEncryptionCode,
      subType: 'lightningCustody' as const,
    };

    console.log('Creating Lightning wallet...');
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

    if ('userAuthKeychain' in wallet) {
      console.log(`User Auth keychain encrypted xPrv: ${wallet.userAuthKeychain.encryptedPrv}`);
    }

    console.log(`Passcode Encryption Code: ${passcodeEncryptionCode}`);
    console.log(
      '\n Store this information securely. You will need it to recover your wallet if you lose wallet password.'
    );
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
