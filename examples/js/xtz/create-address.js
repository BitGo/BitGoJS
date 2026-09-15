const BitGoJS = require('bitgo');
const Promise = require('bluebird');

// TODO: change to 'production' for mainnet
const env = 'test';
const bitgo = new BitGoJS.BitGo({ env });

// TODO: change to 'xtz' for mainnet
const coin = 'txtz';

// TODO: set your wallet id
const walletId = '';

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

Promise.coroutine(function* () {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().getWallet({ id: walletId });
  const address = yield wallet.createAddress({ label: 'My address' });
  console.log(address);
})();
