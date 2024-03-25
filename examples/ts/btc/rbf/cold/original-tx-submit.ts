/**
 * Send a transaction to be replaced from a multi-sig cold wallet at BitGo.
 *
 * Copyright 2024, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo, EnvironmentName } from '../../../../../modules/bitgo';
import { rbfConfig } from './config';

const bitgo = new BitGo({ env: rbfConfig.env as EnvironmentName });
bitgo.authenticateWithAccessToken({ accessToken: rbfConfig.accessToken });

const halfSignedTxHex = '';

async function getWallet() {
  return await bitgo.coin(rbfConfig.coin).wallets().get({ id: rbfConfig.walletId });
}

async function main() {
  console.log('Start sending original tx...');

  const wallet = await getWallet();

  const originalTxSendResponse = await wallet.submitTransaction({
    otp: rbfConfig.otp,
    txHex: halfSignedTxHex,
  });
  console.log('Original tx sent: ', originalTxSendResponse);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
