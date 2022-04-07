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
const accessToken = '2356c50abf1c410a360040bf9f86740d259b9317e808164d2ed3ce47935278b4';


// TODO: get the wallet with this id
const walletId = '624c63b9114b1f0007c4be6206024ffc';

const coin = 'tnear';

const basecoin = bitgo.coin(coin);
// TODO: set your passphrase here
const walletPassphrase = 'test_wallet_passphrase';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId });

//  const newReceiveAddress1 = yield walletInstance.createAddress();
//  const newReceiveAddress2 = yield walletInstance.createAddress();
//  const newReceiveAddress1 = yield walletInstance.createAddress();

  const transaction = yield walletInstance.sendMany({
    recipients: [
      {
        amount: '12341234',
        address: '67e0f347e67cb741b59244fe9ec6d4de43ea5665999a25b8d4c0cc2e21a3dfb7',
      }
    ],
    walletPassphrase: walletPassphrase,
  });
  const explanation = yield basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
//  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
})();
