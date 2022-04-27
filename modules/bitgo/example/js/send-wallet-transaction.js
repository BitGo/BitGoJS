/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');
const Promise = require('bluebird');
const bitgo = new BitGoJS.BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-07-app.bitgo-dev.com',
});

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'v2x9010d135117a5809bef5606064b77b17d11f6fad890c987887c4caf826a2df7a';


// TODO: get the wallet with this id
const walletId = '626159e47e5d8000070893e3583f1bc6'

const coin = 'tnear';

const basecoin = bitgo.coin(coin);
// TODO: set your passphrase here
const walletPassphrase = 'test_wallet_passphrase';

//Promise.coroutine(function *() {
async function send() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  await bitgo.unlock( { otp: '000000' });

  const walletInstance = await basecoin.wallets().get({ id: walletId });

//  const newReceiveAddress1 = await walletInstance.createAddress();
//  const newReceiveAddress2 = yield walletInstance.createAddress();
//  const newReceiveAddress1 = yield walletInstance.createAddress();

  const transaction = await walletInstance.sendMany({
    recipients: [
      {
        amount: '12341234',
        address: '67e0f347e67cb741b59244fe9ec6d4de43ea5665999a25b8d4c0cc2e21a3dfb7',
      }
    ],
    type: 'transfer',
    walletPassphrase: walletPassphrase,
  });
//  const explanation = await basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
//  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
//  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
};

for (let i = 0; i < 1; i++) {
  send().catch((e) => console.error(e));
}
