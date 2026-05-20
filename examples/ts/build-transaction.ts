/**
 * Pre-build a transaction from the wallet
 *
 * This tool will help you see how to use the BitGo API to easily build
 * a transaction from a wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tdoge } from '@bitgo/sdk-coin-doge'; // Replace with your given coin (e.g. Ltc, Tltc)
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Set the coin name to match the blockchain and network
// doge = dogecoin, tdoge = testnet dogecoin
const coin = 'tdoge';
bitgo.register(coin, Tdoge.createInstance);

// TODO: get the wallet with this id
const id = '';
const amount = '';
const toAddress = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id });

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

main().catch((e) => console.log(e));
