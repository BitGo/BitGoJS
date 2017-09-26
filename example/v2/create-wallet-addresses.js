const BitGoJS = require('../../src/index');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

const coin = 'tltc';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = null;
// TODO: set your passphrase here
const walletPassphrase = null;

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const wallet = yield basecoin.wallets()
  .generateWallet({
    label: `Test Wallet Example`,
    passphrase: walletPassphrase,
    backupXpubProvider: 'keyternal'
  });
  const walletInstance = wallet.wallet;

  const newReceiveAddress = yield walletInstance.createAddress();

  console.log('Wallet ID:', walletInstance.id());
  console.log('First Receive Address:', walletInstance.receiveAddress());
  console.log('Second Receive Address:', newReceiveAddress.address);
})();
