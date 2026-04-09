/**
 * Create a multi-sig ethereum wallet at BitGo.
 * This makes use of the convenience function generateWallet
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 *
 * Copyright 2021 BitGo, Inc.  All Rights Reserved.
 */

const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = '';

// TODO: set a label for your new wallet here
const label = 'Example Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = '';

// ETH only- Specify the wallet creation contract version used when creating a wallet contract.
// Use 0 for the old wallet creation, 1 for the new wallet creation, where it is only deployed upon receiving funds.
const walletVersion = 1;

// TODO: set your enterprise here
const enterprise = '';

const coin = 'teth';

// Create the wallet
async function createWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions = {
    label,
    passphrase,
    walletVersion,
    enterprise,
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);

  const walletInstance = wallet.wallet;

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`Receive address: ${walletInstance.receiveAddress()}`);

  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
}

createWallet().catch((e) => console.error(e));
