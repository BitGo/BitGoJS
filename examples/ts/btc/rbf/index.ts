/**
 * Send a transaction to be replaced from a multi-sig wallet at BitGo.
 * Then quickly send a replacement transaction with a higher fee.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, EnvironmentName } from '../../../../modules/bitgo';
import { rbfConfig } from './config';

const bitgo = new BitGo({ env: rbfConfig.env as EnvironmentName });
bitgo.authenticateWithAccessToken({ accessToken: rbfConfig.accessToken });

const RECEIVE_ADDRESS = '';

async function getWallet() {
  return await bitgo.coin(rbfConfig.coin).wallets().get({ id: rbfConfig.walletId });
}

function delay(ms: number) {
  console.log('Start delay for ', ms / 1000, 'secs');
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting...');

  const wallet = await getWallet();
  const txToBeReplaced = await wallet.sendMany({
    recipients: [
      {
        amount: '50000',
        address: RECEIVE_ADDRESS,
      },
    ],
    isReplaceableByFee: true,
    feeRate: 1000, // 1 sat/vbyte
    walletPassphrase: rbfConfig.walletPassphrase,
  });
  console.log('Transaction to be replaced: ', txToBeReplaced);

  await delay(45_000); // Delay for 45secs so that the original tx gets propagated to the network
  console.log('End delay');

  const idOfTxToBeReplaced = txToBeReplaced.txid;
  const replacementTx = await wallet.sendMany({
    recipients: [],
    rbfTxIds: [idOfTxToBeReplaced],
    feeMultiplier: 3.5,
    walletPassphrase: rbfConfig.walletPassphrase,
  });
  console.log('Replacement Transaction: ', replacementTx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
