/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-07-app.bitgo-dev.com',
});

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
// const accessToken = 'v2xc3d4ec44bf62a19d791646cebae26b02f54afab7a8a94b7c4c3d8fc31bd6c7f3';
const accessToken = 'v2x1108fe1d46407e6b372b49191df29fb323a13e10c68fccbe3790548a30ad88c7';

// TODO: get the wallet with this id
const walletId = '62ac9906fb94cd0007f1bb3b29395c32';
const coin = 'tnear';

const basecoin = bitgo.coin(coin);
// TODO: set your passphrase here
const walletPassphrase = 'test_wallet_passphrase';

// Promise.coroutine(function *() {
async function send() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  await bitgo.unlock( { otp: '000000' });

  const walletInstance = await basecoin.wallets().get({ id: walletId });

  const transaction = await walletInstance.sendMany({
    recipients: [
      {
        amount: '1000000000000000000000',
        address: 'legends.pool.f863973.m0',
      },
    ],
    type: 'stake',

    walletPassphrase: walletPassphrase,
  });
  //  const explanation = await basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  //  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
//  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
}

for (let i = 0; i < 1; i++) {
  send().catch((e) => console.error(e));
}
