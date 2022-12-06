/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
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

async function main() {
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  const newReceiveAddress1 = await walletInstance.createAddress();
  const newReceiveAddress2 = await walletInstance.createAddress();

  const transaction = await walletInstance.sendMany({
    recipients: [
      {
        amount: '12341234',
        address: newReceiveAddress1.address,
      },
      {
        amount: '13370000',
        address: newReceiveAddress2.address,
      },
    ],
    walletPassphrase: walletPassphrase,
  });
  const explanation = await bitgo.coin(coin).explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
}

main().catch((e) => console.error(e));
