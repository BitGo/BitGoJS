/**
 * Create a multi-sig SUI wallet transaction at BitGo and get the transaction hex.
 * This demonstrates how to use the BitGo API to easily create and estimate a wallet transaction.
 *
 * The script authenticates with BitGo, creates a transaction, and logs the URL-safe transaction hex.
 *
 * It provides a tx hex which can be used in the BitGo fee estimate endpoint for sui which provides the
 * fee estimate for a transaction.
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

async function buildPayTx() {
  try {
    bitgo.authenticateWithAccessToken({ accessToken });
    const wallet = await bitgo.coin(coin).wallets().getWallet({ id: walletId });
    const recipients = [
      {
        address: 'tsui-address', // TODO: set a tsui receive address
        amount: '10000', // TODO: set an amount for the transaction
      },
    ];

    const transaction = await wallet.prebuildTransaction({
      recipients,
      type: 'transfer',
      preview: true,
    });
    const txHex: string =
      transaction.txHex ||
      '0000020008809698000000000000205a2f1af37d565419096136eb7952b7340206648fa1402b9fb50238771d434a27020200010100000101020000010100cdf4888a104e340b80b01ce5b447fe71c3a40a8218191fb32e33eb2a51c3d862012755a02a57a51ed12cbdc637a930110295010dd99987215c94d931ecca856fb345e0c0000000000020527858e2e3629e1c77cb666cbee77afb9764a0754093522b3f8342ea7c0433d5cdf4888a104e340b80b01ce5b447fe71c3a40a8218191fb32e33eb2a51c3d862e803000000000000a48821000000000000';

    const tx: string = Buffer.from(txHex, 'hex').toString('base64');
    const requiredTx: string = tx.replace(/\+/g, '%2B').replace(/\//g, '%2F').replace(/=/g, '%3D');
    console.log('Required tx param :');
    console.log(requiredTx);
    /*
      Use this tx hex in the fee estimate api: https://app.bitgo-test.com/api/v2/tsui/tx/fee?tx=<requiredTx>
      Provides the fee estimate like below:
        {
          "feeEstimate": "3954120",
          "computationCost": "1000000",
          "storageCost": "1976000",
          "storageRebate": "978120"
        }
     */
  } catch (error) {
    console.error('Error in buildPayTx:', error);
  }
}
buildPayTx().catch((e) => console.error(e));
