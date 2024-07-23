/**
 * Create a multi-sig SUI wallet transaction at BitGo and get the transaction hex.
 * This demonstrates how to use the BitGo API to easily create and estimate a wallet transaction.
 *
 * The script authenticates with BitGo, creates a transaction, and logs the URL-safe transaction hex.
 *
 * To run this script, ensure you provide the appropriate access token, wallet ID, passphrase,
 * and recipient details.
 *
 * Copyright 2024 BitGo, Inc. All Rights Reserved.
 */

import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tsui';

// TODO: set your access token here
const accessToken = '';

// TODO: set a walletId
const walletId = '';

// TODO: set your passphrase for your wallet here
const passphrase = '';

async function buildPayTx() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const newWallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
  const recipients = [
    {
      address: 'tsui-address', // TODO: set a tsui receive address
      amount: '10000', // TODO: set an amount for the transaction
    },
  ];

  const response = await newWallet.sendMany({
    recipients,
    type: 'transfer',
    walletPassphrase: passphrase,
  });
  const tx = response.tx;
  const requiredTx = tx.replace(/\+/g, '%2B').replace(/\//g, '%2F').replace(/=/g, '%3D');

  console.log('Required tx param :');
  console.log(requiredTx);
}

buildPayTx().catch((e) => console.error(e));
