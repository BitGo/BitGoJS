import * as assert from 'assert';
import { derivePassword } from '../../src/derivePassword';
import { deriveEnterpriseSalt } from '../../src/deriveEnterpriseSalt';
import { registerPasskey } from '../../src/registerPasskey';
import { attachPasskeyToWallet } from '../../src/attachPasskeyToWallet';
import { derivePasskeyPrfKey } from '../../src/derivePasskeyPrfKey';
import { removePasskeyFromWallet } from '../../src/removePasskeyFromWallet';
import { removePasskeyFromAccount } from '../../src/removePasskeyFromAccount';
import { makeMockBitGo } from './helpers/mockBitGo';
import { makeMockProvider } from './helpers/mockProvider';
import {
  ENTERPRISE_ID,
  WALLET_ID,
  COIN,
  EXISTING_PASSPHRASE,
  PRF_OUTPUT,
  CREDENTIAL_ID,
  DEVICE_MONGO_ID,
  BASE_SALT,
  KEYCHAIN_ID,
} from './helpers/fixtures';

// Use sjcl directly for round-trip encryption tests — same crypto as mockBitGo
const sjcl = require('sjcl');
const sjclEncrypt = (password: string, input: string) => JSON.stringify(sjcl.encrypt(password, input));
const sjclDecrypt = (password: string, input: string) => sjcl.decrypt(password, JSON.parse(input));

describe('passkey-crypto integration', function () {
  let initialEncryptedPrv: string;
  const PRIVATE_KEY = 'xprv-test-private-key-12345';

  before(function () {
    // Encrypt the private key with the existing passphrase (simulates what the server stores)
    initialEncryptedPrv = sjclEncrypt(EXISTING_PASSPHRASE, PRIVATE_KEY);
  });

  describe('register → attach', function () {
    it('re-encrypts the private key under the PRF-derived password', async function () {
      const { bitgo, keychainState } = makeMockBitGo(initialEncryptedPrv);
      const provider = makeMockProvider();

      const device = await registerPasskey({ bitgo, provider, label: 'test-key' });
      assert.strictEqual(device.credentialId, CREDENTIAL_ID);
      assert.strictEqual(device.prfSupported, true);

      await attachPasskeyToWallet({
        bitgo,
        coin: COIN,
        walletId: WALLET_ID,
        device,
        existingPassphrase: EXISTING_PASSPHRASE,
        provider,
      });

      // Verify encryptedPrv round-trips with the PRF-derived password
      const decrypted = sjclDecrypt(derivePassword(PRF_OUTPUT), keychainState.encryptedPrv);
      assert.strictEqual(decrypted, PRIVATE_KEY);

      // prfSalt stored in webauthnInfo must be valid base64url
      assert.ok(keychainState.webauthnDevices);
      assert.match(keychainState.webauthnDevices[0].prfSalt, /^[A-Za-z0-9\-_]+$/);
    });
  });

  describe('attach → derivePasskeyPrfKey', function () {
    it('derives the same passphrase used to re-encrypt during attach', async function () {
      const { bitgo, keychainState, wallet } = makeMockBitGo(initialEncryptedPrv);
      const provider = makeMockProvider();

      const device = { id: DEVICE_MONGO_ID, credentialId: CREDENTIAL_ID, prfSalt: BASE_SALT, isPasskey: true };
      await attachPasskeyToWallet({
        bitgo,
        coin: COIN,
        walletId: WALLET_ID,
        device,
        existingPassphrase: EXISTING_PASSPHRASE,
        provider,
      });

      const derivedPassphrase = await derivePasskeyPrfKey({ bitgo, wallet, provider });

      // Same passphrase as what attach used — decrypts the stored key
      assert.strictEqual(derivedPassphrase, derivePassword(PRF_OUTPUT));
      assert.strictEqual(sjclDecrypt(derivedPassphrase, keychainState.encryptedPrv), PRIVATE_KEY);
    });
  });

  describe('full lifecycle (register → attach → derive → remove)', function () {
    it('completes all steps and hits both DEL endpoints', async function () {
      const { bitgo, wallet } = makeMockBitGo(initialEncryptedPrv);
      const provider = makeMockProvider();

      const device = await registerPasskey({ bitgo, provider, label: 'lifecycle-key' });
      await attachPasskeyToWallet({
        bitgo,
        coin: COIN,
        walletId: WALLET_ID,
        device,
        existingPassphrase: EXISTING_PASSPHRASE,
        provider,
      });

      const passphrase = await derivePasskeyPrfKey({ bitgo, wallet, provider });
      await removePasskeyFromWallet({ bitgo, coin: COIN, walletId: WALLET_ID, device, walletPassphrase: passphrase });
      await removePasskeyFromAccount({ bitgo, device });

      const delUrls = bitgo.del.args.map((a: string[]) => a[0]);
      assert.ok(delUrls.some((url: string) => url.includes(`/key/${KEYCHAIN_ID}/webauthndevice/${DEVICE_MONGO_ID}`)));
      assert.ok(delUrls.some((url: string) => url.includes(`/user/otp/${DEVICE_MONGO_ID}`)));
    });
  });

  describe('PRF salt derivation wiring', function () {
    it('passes deriveEnterpriseSalt output as the eval salt in attachPasskeyToWallet', async function () {
      const { bitgo } = makeMockBitGo(initialEncryptedPrv);
      const provider = makeMockProvider();

      const device = { id: DEVICE_MONGO_ID, credentialId: CREDENTIAL_ID, prfSalt: BASE_SALT, isPasskey: true };
      await attachPasskeyToWallet({
        bitgo,
        coin: COIN,
        walletId: WALLET_ID,
        device,
        existingPassphrase: EXISTING_PASSPHRASE,
        provider,
      });

      assert.strictEqual(
        provider.lastEvalByCredential?.[CREDENTIAL_ID],
        deriveEnterpriseSalt(BASE_SALT, ENTERPRISE_ID)
      );
    });
  });

  describe('error propagation', function () {
    it('aborts removePasskeyFromWallet and does not DEL when passphrase is wrong', async function () {
      const { bitgo } = makeMockBitGo(initialEncryptedPrv);
      const device = { id: DEVICE_MONGO_ID, credentialId: CREDENTIAL_ID, prfSalt: BASE_SALT, isPasskey: true };

      // Uses real sjcl decrypt — wrong passphrase genuinely fails decryptKeychainPrivateKey
      await assert.rejects(
        () =>
          removePasskeyFromWallet({
            bitgo,
            coin: COIN,
            walletId: WALLET_ID,
            device,
            walletPassphrase: 'wrong-passphrase',
          }),
        /Incorrect wallet passphrase/
      );

      assert.strictEqual(bitgo.del.callCount, 0);
    });
  });
});
