//
// Create a multi-sig wallet at BitGo.
// This makes use of the convenience function generateWallet
//
// This tool will help you see how to use the BitGo API to easily create a wallet.
// In this form, it creates 2 keys on the host which runs this example.
// It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
//
// To perform more advanced features, such as encrypting keys yourself, please look at createWalletAdvanced.js
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../../src/index.js');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

// TODO: set your access token here
const accessToken = null;

// TODO: set a label for your new wallet here
const label = 'Example Test Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = 'test_wallet_passphrase';

const coin = 'tltc';

// Create the wallet
Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions = {
    label,
    passphrase
  };

  const wallet = yield bitgo.coin(coin).wallets().generateWallet(walletOptions);

  const walletInstance = wallet.wallet;

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`Receive address: ${walletInstance.receiveAddress()}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
})();
