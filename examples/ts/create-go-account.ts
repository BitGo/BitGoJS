/**
 * Create a Go Account wallet at BitGo.
 * This makes use of the convenience function generateWallet with type: 'trading'
 *
 * IMPORTANT: You must backup the encrypted private key and encrypted wallet passphrase!
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Go Accounts use the 'ofc' (Off-Chain) coin
const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

// TODO: set a label for your new Go Account here
const label = 'Example Go Account Wallet';

// TODO: set your passphrase for your new wallet here (encrypts the private key)
const passphrase = 'go_account_wallet_passphrase';

// TODO: set your passcode encryption code here (encrypts the passphrase itself)
const passcodeEncryptionCode = 'encryption_code_for_passphrase';

// TODO: set your enterprise ID for your new wallet here
const enterprise = 'your_enterprise_id';

async function main() {
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

  console.log(`Wallet ID: ${wallet.id()}`);

  console.log('BACKUP THE FOLLOWING INFORMATION: ');
  console.log('User Keychain:');
  console.log(`Keychain ID: ${userKeychain.id}`);
  console.log(`Public Key: ${userKeychain.pub}`);
  console.log(`Encrypted Private Key: ${userKeychain.encryptedPrv}`);

  console.log(`Encrypted Wallet Passphrase: ${encryptedWalletPassphrase}`);

  // Create receive address for Go Account
  const receiveAddress = await wallet.createAddress();
  console.log('Go Account Receive Address:', receiveAddress.address);
}

main().catch((e) => console.error('Error creating Go Account:', e));

