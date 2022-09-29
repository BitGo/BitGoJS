/**
 * Pre-build a transaction from the wallet
 *
 * This tool will help you see how to use the BitGo API to easily build
 * a transaction from a wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

import { BitGo } from 'bitgo';

const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: get the wallet with this id
const id = '';

const coin = 'tdoge';
const amount = '';
const toAddress = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id });

  console.log(`Wallet label: ${wallet.label()}`);

  const buildTxParams = {
    recipients: [
      {
        amount,
        address: toAddress,
      },
    ],
  };
  const transaction = wallet.prebuildTransaction(buildTxParams);
  console.dir(transaction);

}

main().catch((err) => console.log('Error: ', err));
