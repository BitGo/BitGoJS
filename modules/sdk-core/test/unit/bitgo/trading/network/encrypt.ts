import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  encryptRsaWithAesGcm,
  decryptRsaWithAesGcm,
  _encryptRsa,
  _decryptRsa,
  _encryptAesGcm,
  _decryptAesGcm,
} from '../../../../../src/bitgo/trading/network/encrypt';

describe('network encrypt', () => {
  const privateKey = fs.readFileSync(path.resolve(__dirname, './private-key.pem'));
  const publicKey = fs.readFileSync(path.resolve(__dirname, './public-key.pub'));

  it('should encrypt and decrypt RsaWithAesGcm', async () => {
    const password = 'password';
    const encrypted = await encryptRsaWithAesGcm(publicKey.toString(), password);
    const decrypted = await decryptRsaWithAesGcm(privateKey.toString(), encrypted);
    assert.strictEqual(decrypted, password);
  });

  it('should encrypt and decrypt rsa', async () => {
    // Use encryptRsa and decryptRsa
    const password = 'password';
    const encrypted = _encryptRsa(publicKey.toString(), password);
    const decrypted = _decryptRsa(privateKey.toString(), encrypted);
    assert.strictEqual(decrypted, password);
  });

  it('should encrypt and decrypt aes-gcm', async () => {
    // Use encryptAesGcm and decryptAesGcm
    const text = 'secret';
    const gcmKey = crypto.randomBytes(32).toString('base64');
    const encrypted = await _encryptAesGcm(gcmKey, text);
    const decrypted = await _decryptAesGcm(gcmKey, encrypted);
    assert.strictEqual(decrypted, text);
  });
});
