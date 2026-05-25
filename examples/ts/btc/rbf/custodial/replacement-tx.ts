/**
 * Send a replacement transaction from a multi-sig custodial wallet at BitGo.
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

const ID_OF_TX_TO_BE_REPLACED = '';

async function main() {
  console.log('Starting...');

  const wallet = await getWallet();
  const replacementTx = await wallet.sendMany({
    recipients: [],
    rbfTxIds: [ID_OF_TX_TO_BE_REPLACED],
    feeMultiplier: 3.5,
    walletPassphrase: rbfConfig.walletPassphrase,
  });
  console.log('Replacement Transaction: ', replacementTx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
