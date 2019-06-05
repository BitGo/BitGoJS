const BitGoJS = require('../../src/index.js');
const Promise = require('bluebird');
const co = Promise.coroutine;

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = null;

// TODO: get the wallet with this id
const walletId = null;

const bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: accessToken });

const coin = 'tbtc';
const basecoin = bitgo.coin(coin);


co(function *run() {
  // TODO: set the payment url here
  const requestUrl = 'bitcoin:?r=https://test.fakeurl/i/7Ai5ujD467vzM7SbM367Uo';

  const wallets = basecoin.wallets();
  const wallet = yield wallets.get({ id: walletId });


  const info = yield wallet.getPaymentInfo({ url: requestUrl });

  console.log(`Are you sure you want to send ${info.sum} to merchant?`);
  console.log(`Merchant memo: ${info.memo}`);

  const txParams = {
    recipients: info.recipients,
    walletPassphrase: null, // TODO: insert wallet passphrase here
    minConfirms: 1, // jsonPaymentProtocol requires all inputs be confirmed
    enforceMinConfirmsForChange: true
  };

  const tx = yield wallet.prebuildAndSignTransaction(txParams);

  info.txHex = tx.txHex;

  const res = yield wallet.sendPaymentResponse(info);
  console.dir(res);

})();

