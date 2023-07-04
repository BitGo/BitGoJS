/**
 * Create a TSS ATOM wallet at BitGo.
 * This makes use of the convenience function generateWallet
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 *
 * Copyright 2023 BitGo, Inc.  All Rights Reserved.
 */

import { BitGo } from 'bitgo';
import { GenerateWalletOptions } from '@bitgo/sdk-core';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tatom';

// TODO: set your access token here
const accessToken = '';

// TODO: set a label for your new wallet here
const label = 'Test ' + coin + ' V2 Wallet - ' + new Date().getTime();

// TODO: set your passphrase for your new wallet here
const passphrase = '';

// TODO: set your enterprise here
const enterprise = '';

// Create the wallet
async function createWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions: GenerateWalletOptions = {
    label,
    passphrase,
    passcodeEncryptionCode: passphrase,
    multisigType: 'tss',
    enterprise,
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);

  const walletInstance = wallet.wallet;

  console.log(`Wallet ID: ${walletInstance.id()}`);
  console.log(`Receive address: ${walletInstance.receiveAddress()}`);

  // get wallet balance
  console.log('Current Address:', walletInstance.coinSpecific()?.rootAddress);
  console.log('Balance:', walletInstance.balanceString());
  console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance:', walletInstance.spendableBalanceString());

  // private and public keys
  console.log('BACK THIS UP: ');
  console.log('-----------------------------------------');
  console.log(JSON.stringify(wallet));
  console.log('-----------------------------------------');
  console.log('BACK THIS UP: ');

  const userKeychain = wallet.userKeychain;
  console.log(`User commonKeychain xPrv: ${userKeychain.commonKeychain}`);
  console.log(`User keychain encrypted xPrv: ${userKeychain.encryptedPrv}`);
  const userPrv = bitgo.decrypt({ input: userKeychain.encryptedPrv!, password: passphrase });
  console.log(`User Backup private key: ${userPrv}`);

  console.log('-----------------------------------------');
  const backupKeychain = wallet.backupKeychain;
  console.log(`Backup commonKeychain xPrv: ${backupKeychain.commonKeychain}`);
  console.log(`Backup keychain encrypted xPrv: ${backupKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
  const backupPrv = bitgo.decrypt({ input: backupKeychain.encryptedPrv!, password: passphrase });
  console.log(`User Backup private key: ${backupPrv}`);

  console.log('-----------------------------------------');
  const bitgoKeychain = wallet.bitgoKeychain;
  console.log(`Bitgo commonKeychain xPrv: ${bitgoKeychain.commonKeychain}`);
}

createWallet().catch((e) => console.error(e));
