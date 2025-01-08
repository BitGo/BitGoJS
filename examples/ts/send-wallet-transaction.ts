/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Trune } from '@bitgo/sdk-coin-rune';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'staging',
});

const coin = 'tthorchain:rune';
bitgo.register(coin, Trune.createInstance);

const walletId = '67359b1a0892a94fb4ccb819ca0ae8d5';
const walletPassphrase = process.env.PASS;

async function main() {
  bitgo.unlock({ otp: '000000' });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  // const newReceiveAddress1 = await walletInstance.createAddress();
  // const newReceiveAddress2 = await walletInstance.createAddress();

  const transaction = await walletInstance.sendMany({
    recipients: [
      {
        amount: '1000000',
        address: "sthor10w2wpnfvkzn948en3mgqlg3rjz6e40dgu5fdtn",
      },
    ],
    walletPassphrase: walletPassphrase,
    type: 'transfer',
  });
  const explanation = await bitgo.coin(coin).explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
}

main().catch((e) => console.error(e));
