const BitGoJS = require('../../src/index');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

const coin = 'tltc';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = null;
const walletId = '5941ce2db42fcbc70717e5a898fd1595';
// TODO: set your passphrase here
const walletPassphrase = null;

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId });

  const newReceiveAddress1 = yield walletInstance.createAddress();
  const newReceiveAddress2 = yield walletInstance.createAddress();

  const transaction = yield walletInstance.sendMany({
    recipients: [
      {
        amount: '12341234',
        address: newReceiveAddress1.address
      },
      {
        amount: '13370000',
        address: newReceiveAddress2.address
      }
    ],
    walletPassphrase: walletPassphrase
  });
  const explanation = basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
})();
