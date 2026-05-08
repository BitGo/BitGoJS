/**
 * Send Hop Transaction
 *
 * Copyright 2022 BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

const walletId = '';
const walletPassphrase = '';

async function sendTxWithHop() {
  const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });

  const res = await wallet.sendMany({
    recipients: [
      {
        amount: '',
        address: '',
      },
    ],
    walletPassphrase: walletPassphrase,
    hop: true,
  });

  console.log(res);
}

sendTxWithHop().catch((e) => console.error(e));
