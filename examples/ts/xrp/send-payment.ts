/**
 * Send a transaction from a TSS wallet at BitGo.
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';

async function sendTx() {
  const coin = 'txrp';

  // TODO: set env to 'test' or 'prod'
  const env = 'test';

  // TODO: set your access token here
  // You can get this from User Settings > Developer Options > Add Access Token
  const accessToken = '';

  // TODO: set your wallet id
  const walletId = '';

  // TODO: set your wallet passphrase
  const walletPassphrase = '';

  // TODO: set the receive address to send fund(add destination tag)
  const receiveAddress = '';

  const bitgo = new BitGo({
    env: env,
    accessToken,
  });

  const basecoin = bitgo.coin(coin);
  bitgo.authenticateWithAccessToken({ accessToken });
  // await bitgo.unlock({ otp: otp, duration: 3600 });

  const walletInstance = await basecoin.wallets().get({ id: walletId });
  const xrpAmount = '1222500'; // 1.2225 XRP
  const sendDetail = await walletInstance.sendMany({
    recipients: [
      {
        amount: xrpAmount,
        address: receiveAddress,
      },
    ],
    walletPassphrase,
    type: 'payment',
    isTss: true,
  });
  console.log(`${JSON.stringify(sendDetail)}`);
}

sendTx().catch((e) => console.error(e));
