const BitGoJS = require('../../src/index');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

const coin = 'tltc';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = null;
const walletId = '5941ce2db42fcbc70717e5a898fd1595';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId });
  const transactions = yield walletInstance.transactions();

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Wallet Transactions:', JSON.stringify(transactions, null, 4));
})();
