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
const bitgo = new BitGo({ env: 'test' });
const bitgo = new BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-07-app.bitgo-dev.com',
});
// TODO: set your access token here
const accessToken = '76f84ca2989a5858e599a0b465422954d504b033693e05dc62a0da223747d6b5';

// TODO: set a label for your new wallet here
const label = 'Example Test Wallet';

// TODO: set your passphrase for your new wallet here
const passphrase = 'test_wallet_passphrase';

const coin = 'tltc';

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
