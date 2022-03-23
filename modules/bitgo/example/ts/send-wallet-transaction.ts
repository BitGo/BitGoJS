/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, Coin } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tltc';
const basecoin = bitgo.coin(coin) as Coin.Ltc;
// TODO: set your access token here
const accessToken = '';
const walletId = '5941ce2db42fcbc70717e5a898fd1595';
// TODO: set your passphrase here
const walletPassphrase = null;

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });

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
  const explanation = await basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
}

main().catch((e) => console.error(e));
