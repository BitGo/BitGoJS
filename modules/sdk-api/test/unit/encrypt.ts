import assert from 'assert';
import { randomBytes } from 'crypto';

import { decrypt, encrypt, ENCRYPTION_ITERATIONS } from '../../src';

describe('encryption methods tests', () => {
  describe('ENCRYPTION_ITERATIONS constant', () => {
    it('should be 500,000 to meet current OWASP PBKDF2-SHA256 guidance', () => {
      assert.strictEqual(ENCRYPTION_ITERATIONS, 500_000);
    });
  });

  describe('encrypt', () => {
    it('encrypts the plaintext with the given password', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const ciphertext = encrypt(password, plaintext);

      assert(ciphertext !== plaintext, 'ciphertext should not be equal to plaintext');
    });

    it('returns a different ciphertext for the same plaintext and password', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const ciphertext1 = encrypt(password, plaintext);
      const ciphertext2 = encrypt(password, plaintext);

      assert(ciphertext1 !== ciphertext2, 'ciphertexts should not be equal');
    });

    it('throws an error if the salt length is not 8 bytes', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const options = { salt: randomBytes(4) };

      assert.throws(() => encrypt(password, plaintext, options), new Error(`salt must be 8 bytes`));
    });

    it('throws an error if the iv length is not 16 bytes', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const options = { iv: randomBytes(4) };

      assert.throws(() => encrypt(password, plaintext, options), new Error(`iv must be 16 bytes`));
    });
  });

  describe('decrypt', () => {
    it('decrypts the ciphertext with the given password', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const ciphertext = encrypt(password, plaintext);
      const decrypted = decrypt(password, ciphertext);

      assert(decrypted === plaintext, 'decrypted should be equal to plaintext');
    });

    it('throws an error if the password is wrong', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const ciphertext = encrypt(password, plaintext);
      const wrongPassword = 'wrongPassword';

      assert.throws(() => decrypt(wrongPassword, ciphertext), 'sjcl exception: cc: invalid aes key');
    });

    it('decrypts the ciphertext with the given password and adata', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const adata = 'additional data';
      const ciphertext = encrypt(password, plaintext, { adata });
      const decrypted = decrypt(password, ciphertext);

      assert(decrypted === plaintext, 'decrypted should be equal to plaintext');
    });

    it('is backward compatible: decrypts ciphertexts produced at the legacy 10,000 iteration count', () => {
      // This blob was encrypted with iter=10000, ks=256, mode=ccm, cipher=aes.
      // The SJCL JSON envelope is self-describing: decrypt() reads `iter` from
      // the blob itself, so pre-migration ciphertexts continue to decrypt
      // correctly even after the default encryption iteration count is raised.
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const legacyCiphertext = JSON.stringify({
        iv: 'YWJjZGVmZ2hpamtsbW5v',   // deterministic test vector
        v: 1,
        iter: 10000,
        ks: 256,
        ts: 64,
        mode: 'ccm',
        adata: '',
        cipher: 'aes',
        salt: 'c2FsdHNhbHQ=',
        ct: 'placeholder'
      });

      // Rather than embedding a brittle static ciphertext, verify the semantic
      // guarantee: encrypt at 10k, confirm SJCL stores iter=10000 in the blob,
      // then decrypt — proving the self-describing format works cross-iteration.
      const sjcl = require('@bitgo/sjcl');
      const legacyBlob = sjcl.encrypt(password, plaintext, { iter: 10000, ks: 256 });
      const parsed = JSON.parse(legacyBlob);

      assert.strictEqual(parsed.iter, 10000, 'legacy blob should store iter=10000');
      assert.strictEqual(decrypt(password, legacyBlob), plaintext,
        'decrypt() must handle blobs produced at iter=10000');
    });

    it('newly encrypted blobs use the updated iteration count', () => {
      const password = 'myPassword';
      const plaintext = 'Hello, World!';
      const ciphertext = encrypt(password, plaintext);
      const parsed = JSON.parse(ciphertext);

      assert.strictEqual(parsed.iter, ENCRYPTION_ITERATIONS,
        `new blobs should use iter=${ENCRYPTION_ITERATIONS}`);
    });
  });
});
