/**
 * Create a multi-sig SUI wallet at BitGo.
 * This makes use of the convenience function generateWallet
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 *
 * Copyright 2023 BitGo, Inc.  All Rights Reserved.
 */
const util = require('util');
import { BitGo } from 'bitgo';

// 'prod' for prod environment
const env = 'test';
const bitgo = new BitGo({ env });

// 'sui' for production environment
const coin = 'tsui';

// TODO: set your access token here
const accessToken = '';

// TODO: set a walletId
const walletId = '';

// TODO: set your passphrase for your wallet here
const passphrase = '';

// TODO: set the recipients here, each recipient is an object with address and amount.
const recipients = [
  {
    address: 'sui-address-1',
    amount: '10000',
  },
  {
    address: 'sui-address-2',
    amount: '20000',
  },
];

// build pay transaction
async function buildPayTx() {
  bitgo.authenticateWithAccessToken({ accessToken });
  bitgo.unlock({ otp: '000000' });
  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });

  const response = await wallet.sendMany({
    recipients,
    passphrase,
    type: 'transfer',
  });
  console.log(util.inspect(response, { showHidden: false, depth: 5, colors: true }));
}

buildPayTx().catch((e) => console.log(util.inspect(e, { showHidden: false, depth: 5, colors: true })));
