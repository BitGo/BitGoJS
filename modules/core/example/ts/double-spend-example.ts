/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, Coin } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tbtc';
const basecoin = bitgo.coin(coin) as Coin.Btc;
// TODO: set your access token here
const accessToken = 'hidden';
const walletId = 'hidden'; //TODO
// TODO: set your passphrase here
const walletPassphrase = 'hidden';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });

  const newReceiveAddress1 = await walletInstance.createAddress();
  const newReceiveAddress2 = await walletInstance.createAddress();

  const transaction1 = await walletInstance.send({
    amount: '0',// a sweep of 2.5020 TBTC 
    address: newReceiveAddress1.address,
    walletPassphrase: walletPassphrase,
  });
  const explanation1 = await basecoin.explainTransaction({ txHex: transaction1.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction1, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation1, null, 4));

  // double spend transaction since address is new
  const transaction2 = await walletInstance.send({
    amount: '0', // a sweep of 2.5020 TBTC 
    address: newReceiveAddress2.address,
    walletPassphrase: walletPassphrase,
  });
  const explanation2 = await basecoin.explainTransaction({ txHex: transaction2.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction2, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation2, null, 4));
}

main().catch((e) => console.error(e));
