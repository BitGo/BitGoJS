/**
 * Build a replacement transaction from a multi-sig cold wallet at BitGo.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, EnvironmentName, PrebuildTransactionResult } from '../../../../../modules/bitgo';
import { rbfConfig } from './config';

const bitgo = new BitGo({ env: rbfConfig.env as EnvironmentName });
bitgo.authenticateWithAccessToken({ accessToken: rbfConfig.accessToken });

async function getWallet() {
  return await bitgo.coin(rbfConfig.coin).wallets().get({ id: rbfConfig.walletId });
}

async function main() {
  console.log('Start building replacement tx...');

  const wallet = await getWallet();

  const replacementTxPrebuild: PrebuildTransactionResult = await wallet.prebuildTransaction({
    recipients: [],
    rbfTxIds: [rbfConfig.idOfTxToBeReplaced],
    feeMultiplier: rbfConfig.feeMultiplier,
    walletPassphrase: rbfConfig.walletPassphrase,
  });

  const replacementTx = await wallet.enhanceColdPrebuildTransaction(replacementTxPrebuild);
  console.log('Replacement transaction built, download for offline signing: ', JSON.stringify(replacementTx));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
