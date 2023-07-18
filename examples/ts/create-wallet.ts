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

/**
 * Add Low Fee webhook to a wallet.
 *
 * Copyright 2022 BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc'; // Replace with your given coin (e.g. Ltc, Tltc)
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Set the coin name to match the blockchain and network
// btc = bitcoin, tbtc = testnet bitcoin
const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

// TODO: set a label for your new wallet here
const label = 'Example Test Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = 'test_wallet_passphrase';

async function main() {
  const response = await bitgo.coin(coin).wallets().generateWallet({
    label,
    passphrase,
  });

  const { wallet } = response;

  console.log(`Wallet ID: ${wallet.id()}`);
  console.log(`Receive address: ${wallet.receiveAddress()}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${response.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${response.backupKeychain.prv}`);
}

main().catch((e) => console.log(e));
