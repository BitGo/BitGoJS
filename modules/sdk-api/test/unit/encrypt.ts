import assert from 'assert';
import { randomBytes } from 'crypto';

import { decrypt, decryptAsync, decryptV2, encrypt, encryptV2, V2Envelope } from '../../src';

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

  describe('v2 encrypt/decrypt (Argon2id + AES-256-GCM)', () => {
    const password = 'myPassword';
    const plaintext = 'Hello, World!';

    it('encrypts and decrypts round-trip', async () => {
      const ciphertext = await encryptV2(password, plaintext);
      const decrypted = await decryptV2(password, ciphertext);
      assert.strictEqual(decrypted, plaintext);
    });

    it('produces a valid v2 envelope', async () => {
      const ciphertext = await encryptV2(password, plaintext);
      const envelope: V2Envelope = JSON.parse(ciphertext);
      assert.strictEqual(envelope.v, 2);
      assert.strictEqual(envelope.m, 65536);
      assert.strictEqual(envelope.t, 3);
      assert.strictEqual(envelope.p, 4);
      assert.ok(envelope.salt, 'envelope must have salt');
      assert.ok(envelope.iv, 'envelope must have iv');
      assert.ok(envelope.ct, 'envelope must have ct');
    });

    it('returns different ciphertext for the same plaintext and password', async () => {
      const ct1 = await encryptV2(password, plaintext);
      const ct2 = await encryptV2(password, plaintext);
      assert.notStrictEqual(ct1, ct2);
    });

    it('decrypts with custom Argon2id parameters', async () => {
      const ciphertext = await encryptV2(password, plaintext, {
        memorySize: 1024,
        iterations: 1,
        parallelism: 1,
      });
      const envelope: V2Envelope = JSON.parse(ciphertext);
      assert.strictEqual(envelope.m, 1024);
      assert.strictEqual(envelope.t, 1);
      assert.strictEqual(envelope.p, 1);

      const decrypted = await decryptV2(password, ciphertext);
      assert.strictEqual(decrypted, plaintext);
    });

    it('throws on wrong password', async () => {
      const ciphertext = await encryptV2(password, plaintext);
      await assert.rejects(() => decryptV2('wrongPassword', ciphertext));
    });

    it('throws on invalid JSON', async () => {
      await assert.rejects(() => decryptV2(password, 'not-json'), /invalid JSON envelope/);
    });

    it('throws on wrong envelope version', async () => {
      await assert.rejects(() => decryptV2(password, JSON.stringify({ v: 99 })), /invalid envelope/);
    });

    it('throws on invalid salt length', async () => {
      await assert.rejects(() => encryptV2(password, plaintext, { salt: new Uint8Array(8) }), /salt must be 16 bytes/);
    });

    it('throws on invalid iv length', async () => {
      await assert.rejects(() => encryptV2(password, plaintext, { iv: new Uint8Array(8) }), /iv must be 12 bytes/);
    });

    it('v1 and v2 are independent (v1 data does not decrypt with v2)', async () => {
      const v1ct = encrypt(password, plaintext);
      await assert.rejects(() => decryptV2(password, v1ct), /invalid envelope/);
    });

    it('rejects envelope with memorySize exceeding max', async () => {
      const envelope = { v: 2, m: 999999999, t: 3, p: 4, salt: 'AAAA', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects envelope with iterations exceeding max', async () => {
      const envelope = { v: 2, m: 65536, t: 100, p: 4, salt: 'AAAA', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects envelope with parallelism exceeding max', async () => {
      const envelope = { v: 2, m: 65536, t: 3, p: 100, salt: 'AAAA', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects envelope with zero-valued parameters', async () => {
      const envelope = { v: 2, m: 0, t: 3, p: 4, salt: 'AAAA', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects envelope with non-numeric parameter types', async () => {
      const envelope = { v: 2, m: '65536', t: 3, p: 4, salt: 'AAAA', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects envelope with empty salt', async () => {
      const envelope = { v: 2, m: 65536, t: 3, p: 4, salt: '', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /invalid envelope/);
    });
  });

  describe('decryptAsync (auto-detect v1/v2)', () => {
    const password = 'myPassword';
    const plaintext = 'Hello, World!';

    it('decrypts v1 data', async () => {
      const v1ct = encrypt(password, plaintext);
      const result = await decryptAsync(password, v1ct);
      assert.strictEqual(result, plaintext);
    });

    it('decrypts v2 data', async () => {
      const v2ct = await encryptV2(password, plaintext);
      const result = await decryptAsync(password, v2ct);
      assert.strictEqual(result, plaintext);
    });

    it('throws on wrong password for v1', async () => {
      const v1ct = encrypt(password, plaintext);
      await assert.rejects(() => decryptAsync('wrong', v1ct));
    });

    it('throws on wrong password for v2', async () => {
      const v2ct = await encryptV2(password, plaintext);
      await assert.rejects(() => decryptAsync('wrong', v2ct));
    });

    it('wrong password on v2 data does not fall through to v1 decrypt', async () => {
      const v2ct = await encryptV2(password, plaintext, { memorySize: 1024, iterations: 1, parallelism: 1 });
      let caughtError: Error | undefined;
      try {
        await decryptAsync('wrong', v2ct);
      } catch (e) {
        caughtError = e as Error;
      }
      assert.ok(caughtError, 'should have thrown');
      assert.ok(!caughtError.message?.includes('sjcl'), 'error must not be from SJCL');
    });
  });
});
