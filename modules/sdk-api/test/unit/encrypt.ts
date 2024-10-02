import assert from 'assert';
import { randomBytes } from 'crypto';

import { decrypt, encrypt } from '../../src';

describe('encryption methods tests', () => {
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
  });
});
