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
import { BitGo } from '../../../dist/src/bitgo';
const accessToken = 'v2x22bd4c133a6a33a7bac966f3e1bb7efddd2f927d09a8fe417f14888a75d027c3'; // tesntet03
// test
// const accessToken = 'v2xba73340ad2a3ba02c4ee51b9bf71047efb564f06022458ceeb3532bb5dbf63fe';

const bitgo = new BitGo({ env: 'custom', customRootURI: 'https://testnet-03-app.bitgo-dev.com' });
// const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here

// TODO: set a label for your new wallet here
const label = 'Avax-P Custody';

// TODO: set your passphrase for your new wallet here
// const username = 'experience+test-admin+do-not-delete@bitgo.com';
const passphrase = 'test';

const coin = 'tavaxp';

const enterprise = '62ce0567dec40100072410029c34708f';

// Create the wallet
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions = {
    label,
    passphrase,
    enterprise,
    type: 'custodial', // comment this for hot wallet
  };

  // custodial wallet
  const wallet = await bitgo.coin(coin).wallets().add(walletOptions);

  // hot wallet
  // const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);

  const walletInstance = wallet.wallet;

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`Receive address: ${walletInstance.receiveAddress()}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
}

main().catch((e) => console.error(e));
