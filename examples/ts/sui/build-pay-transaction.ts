/**
 * Create a multi-sig SUI wallet at BitGo.
 * This makes use of the convenience function generateWallet
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 *
 * Copyright 2023 BitGo, Inc.  All Rights Reserved.
 */

import { BitGo } from 'bitgo';
import { GenerateWalletOptions } from '@bitgo/sdk-core';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tsui';

// TODO: set your access token here
const accessToken = '';

// TODO: set a walletId
const walletId = '';

// TODO: set your passphrase for your wallet here
const passphrase = '';

// TODO: set your enterprise here
const enterprise = '';

// build pay transaction
async function buildPayTx() {
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

  // create new address
  const res = await walletInstance.createAddress();
  // console.log('New Address:', JSON.stringify(res, null, 2));
  console.log('New Address:', res.address);

  // private and public keys
  console.log('BACK THIS UP: ');
  console.log(`User keychain encrypted xPrv: ${wallet.userKeychain.encryptedPrv}`);
  console.log(`Backup keychain xPrv: ${wallet.backupKeychain.prv}`);
}

buildPayTx().catch((e) => console.error(e));
