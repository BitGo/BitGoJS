import * as assert from 'assert';

import { Keychain } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';

import { getMinUtxoCoins, getUtxoWallet, encryptKeychain, keychainsBase58 } from './util';

const regularPassphrase = 'passphrase-a';
const webauthnPassphrase = 'passphrase-b';

describe('webauthn passphrase decryption', function () {
  const [coin] = getMinUtxoCoins();
  const wallet = getUtxoWallet(coin);

  // keychain encrypted with regularPassphrase; webauthn device encrypted with webauthnPassphrase
  const keychain: Keychain = {
    id: getSeed(keychainsBase58[0].pub).toString('hex'),
    pub: keychainsBase58[0].pub,
    type: 'independent',
    encryptedPrv: encryptKeychain(regularPassphrase, keychainsBase58[0]),
    webauthnDevices: [
      {
        otpDeviceId: '123',
        authenticatorInfo: { credID: 'credID', fmt: 'packed', publicKey: 'some value' },
        prfSalt: '456',
        encryptedPrv: encryptKeychain(webauthnPassphrase, keychainsBase58[0]),
      },
    ],
  };

  it('should decrypt with the regular passphrase', function () {
    const prv = wallet.getUserPrv({ keychain, walletPassphrase: regularPassphrase });
    assert.strictEqual(prv, keychainsBase58[0].prv);
  });

  it('should fall back to webauthn device when the regular passphrase fails', function () {
    const prv = wallet.getUserPrv({ keychain, walletPassphrase: webauthnPassphrase });
    assert.strictEqual(prv, keychainsBase58[0].prv);
  });

  it('should throw when all passphrases are wrong', function () {
    assert.throws(() => wallet.getUserPrv({ keychain, walletPassphrase: 'wrong' }), {
      message: 'failed to decrypt user keychain',
    });
  });
});
