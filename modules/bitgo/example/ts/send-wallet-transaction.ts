/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'custom', customRootURI: 'https://testnet-03-app.bitgo-dev.com' });
// TODO: set your access token here
const accessToken = 'v2x767398174e675ed05a243696942e467b5b3385ecbf0d2324fc23eef61fdc5958';
// TODO: set your passphrase for your new wallet here
const passphrase = 'Ghghjkg!455544llll';
const coin = 'tavaxp';
const basecoin = bitgo.coin(coin);
const walletId = '634d72a3d62c5300077f5f9374f14efa';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });
  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const transaction = await walletInstance.sendMany({
    recipients: [
      {
        amount: '20000000',
        address: '0x3e0f98cfd485756ae193585e0b27cc5b7f0ce62f',
      },
    ],
    memo: { value: 'second round', type: 'memo' },
    type: 'Import',
    walletPassphrase: passphrase,
  });
  const explanation = await basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
}

main().catch((e) => console.error(e));
