/**
 * Create a TSS SUI wallet at BitGo.
 * This makes use of the convenience function generateWallet
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 *
 * Copyright 2023 BitGo, Inc.  All Rights Reserved.
 */

import { BitGo } from 'bitgo';
import { GenerateWalletOptions } from '@bitgo/sdk-core';
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGo({ env: 'test' });

const coin = 'tsui';

// TODO: set your access token here
const accessToken = process.env.TESTNET_ACCESS_TOKEN!;

const multisigType = 'tss';
const type = 'cold';
const coldDerivationSeed = '1';

// TODO: set a label for your new wallet here
const label = `${coin} ${multisigType} ${type} ${coldDerivationSeed}`;

// TODO: set your passphrase for your new wallet here
const passphrase = process.env.PASS;

// TODO: set your enterprise here
const enterprise = process.env.ENTERPRISE;

// TODO: set your bitgo key ID here
const bitgoKeyId = '';

// TODO: set your common keychain here
const commonKeychain = '';

// Create the wallet
async function createWallet() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletOptions: GenerateWalletOptions = {
    label,
    multisigType,
    type,
    enterprise,
    coldDerivationSeed,
    bitgoKeyId,
    commonKeychain,
    passphrase,
  };

  const wallet = await bitgo.coin(coin).wallets().generateWallet(walletOptions);
  if (!('backupKeychain' in wallet)) {
    throw new Error('wallet missing required keychains');
  }
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
