/**
 * Send a transaction to be replaced from a multi-sig custodial wallet at BitGo.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, EnvironmentName } from '../../../../../modules/bitgo';
import { rbfConfig } from './config';

const bitgo = new BitGo({ env: rbfConfig.env as EnvironmentName });
bitgo.authenticateWithAccessToken({ accessToken: rbfConfig.accessToken });

const RECEIVE_ADDRESS = '';

async function getWallet() {
  return await bitgo.coin(rbfConfig.coin).wallets().get({ id: rbfConfig.walletId });
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
