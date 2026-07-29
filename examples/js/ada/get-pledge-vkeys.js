const BitGoJS = require('bitgo');
const accountLib = require('@bitgo/account-lib');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');
const coin = 'tada';
const basecoin = bitgo.coin(coin);
const fs = require('fs');

// TODO: set your access token here
const accessToken = '';
// TODO: set your wallet ID here
const walletId = '';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });
  yield bitgo.unlock({ otp: '000000', duration: 3600 });
  const walletInstance = yield basecoin.wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());

  if (!walletInstance._wallet.keys || walletInstance._wallet.keys.length !== 3) {
    throw new Error('Should be 3 keys for the wallet!');
  }

  const userKeyId = walletInstance._wallet.keys[0];
  const keychain = yield basecoin.keychains().get({ id: userKeyId });

  yield accountLib.Ed25519BIP32.initialize();
  yield accountLib.Eddsa.initialize();
  const eddsaMpc = new accountLib.Eddsa(new accountLib.Ed25519BIP32());
  const pubkey = eddsaMpc.deriveUnhardened(keychain.commonKeychain, 'm/0').slice(0, 64);

  // 5820 is the CBOR prefix for a public key
  const vkeyCborHex = '5820' + pubkey;

  const paymentVkey = JSON.stringify({
    type: 'PaymentVerificationKeyShelley_ed25519',
    description: 'Payment Verification Key',
    cborHex: vkeyCborHex,
  }, null, 4);
  fs.writeFile('payment.vkey', paymentVkey, (err) => {
    if (err) {
      console.error('Error writing to payment.vkey:', err);
    } else {
      console.log('Successfully saved to payment.vkey.');
    }
  });

  const stakeVkey = JSON.stringify({
    type: 'StakeVerificationKeyShelley_ed25519',
    description: 'Stake Verification Key',
    cborHex: vkeyCborHex,
  }, null, 4);
  fs.writeFile('stake.vkey', stakeVkey, (err) => {
    if (err) {
      console.error('Error writing to stake.vkey:', err);
    } else {
      console.log('Successfully saved to stake.vkey.');
    }
  });
})();
