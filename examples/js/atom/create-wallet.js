/**
 * Create a TSS atom wallet at BitGo.
 * This makes use of the convenience function generateWallet
 *
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 * In this form, it creates 2 keys on the host which runs this example.
 * It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
 *
 * To perform more advanced features, such as encrypting keys yourself, please look at createWalletAdvanced.js
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */
const BitGo = require('bitgo');
const bitgo = new BitGo.BitGo({ env: 'test' });

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: set a label for your new wallet here
const label = 'Example atom Test Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = '';

// TODO: set your enterprise for your new wallet here
const enterprise = '';

const coin = 'tatom';

// Create the wallet
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const passcodeEncryptionCode = bitgo.generateRandomPassword();

  const walletOptions = {
    label,
    passphrase,
    passcodeEncryptionCode,
    enterprise,
    multisigType: 'tss',
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);

  const walletInstance = wallet.wallet;

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`Receive address: ${walletInstance.coinSpecific().rootAddress}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
}

main().catch((e) => console.error(e));
