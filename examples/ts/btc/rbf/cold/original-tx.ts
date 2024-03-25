/**
 * Build a transaction to be replaced from a multi-sig cold wallet at BitGo
 * for offline signing.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, EnvironmentName } from '../../../../../modules/bitgo';
import { rbfConfig } from './config';

const bitgo = new BitGo({ env: rbfConfig.env as EnvironmentName });
bitgo.authenticateWithAccessToken({ accessToken: rbfConfig.accessToken });

async function getWallet() {
  return await bitgo.coin(rbfConfig.coin).wallets().get({ id: rbfConfig.walletId });
}

async function main() {
  console.log('Start building original tx...');

  const wallet = await getWallet();

  const txToBeReplacedPreBuild = await wallet.prebuildTransaction({
    recipients: [
      {
        amount: '50000',
        address: rbfConfig.receiveAddress,
      },
    ],
    isReplaceableByFee: true,
    feeRate: 1000, // 1 sat/vbyte
    walletPassphrase: rbfConfig.walletPassphrase,
  });

  const txToBeReplaced = await wallet.enhanceColdPrebuildTransaction(txToBeReplacedPreBuild);
  console.log('Transaction to be replaced built, download for offline signing: ', JSON.stringify(txToBeReplaced));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
