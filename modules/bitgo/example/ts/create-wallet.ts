/**
 * Create a multi-sig wallet at BitGo.
 * This makes use of the convenience function generateWallet
 *
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 * In this form, it creates 2 keys on the host which runs this example.
 * It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
 *
 * To perform more advanced features, such as encrypting keys yourself, please look at createWalletAdvanced.js
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'custom', customRootURI: 'https://testnet-03-app.bitgo-dev.com' });

// TODO: set your access token here
const accessToken = 'v2x767398174e675ed05a243696942e467b5b3385ecbf0d2324fc23eef61fdc5958';

// TODO: set a label for your new wallet here
const label = 'Example Test Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = 'Ghghjkg!455544llll';

const coin = 'tavaxp';

// Create the wallet
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions = {
    label,
    passphrase,
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);

  const walletInstance = wallet.wallet;

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`Receive address: ${walletInstance.receiveAddress()}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
}

main().catch((e) => console.error(e));
