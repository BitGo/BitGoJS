/**
 * Send a transaction from a TSS wallet at BitGo.
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';

async function sendTx() {
  const coin = 'tatom';

  // TODO: set env to 'test' or 'prod'
  const env = 'test';

  // TODO: set your access token here
  // You can get this from User Settings > Developer Options > Add Access Token
  const accessToken = '';

  // TODO: set your wallet id
  const walletId = '';

  // TODO: set your wallet passphrase
  const walletPassphrase = '';

  // TODO: set OTP code
  const otp = '';

  // TODO: set the receive address to send fund
  const receiveAddress = '';

  const bitgo = new BitGo({
    env: env,
    accessToken,
  });

  const basecoin = bitgo.coin(coin);
  bitgo.authenticateWithAccessToken({ accessToken });
  await bitgo.unlock({ otp: otp, duration: 3600 });

  const walletInstance = await basecoin.wallets().get({ id: walletId });
  const atomAmount = '100000';
  const sendDetail = await walletInstance.sendMany({
    recipients: [
      {
        amount: atomAmount,
        address: receiveAddress,
      },
    ],
    walletPassphrase,
    type: 'transfer',
    isTss: true,
  });
  console.log(`${JSON.stringify(sendDetail)}`);
}

sendTx().catch((e) => console.error(e));
