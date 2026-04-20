import assert from 'assert';
import { randomBytes } from 'crypto';

import { decrypt, decryptAsync, decryptV2, encrypt, encryptV2, V2Envelope, createEncryptionSession } from '../../src';
import { BitGoAPI } from '../../src/bitgoAPI';

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

    it('throws on invalid JSON input', async () => {
      await assert.rejects(() => decryptAsync(password, 'not-json'), /ciphertext is not valid JSON/);
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

  describe('EncryptionSession (HKDF caching)', () => {
    const opts = { memorySize: 1024, iterations: 1, parallelism: 1 };
    const password = 'test-password';
    const plaintext = 'hello session';

    it('session-produced envelope contains salt and hkdfSalt', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      session.destroy();

      const envelope: V2Envelope = JSON.parse(ct);
      assert.strictEqual(envelope.v, 2);
      assert.ok(envelope.salt, 'must have argon2 salt');
      assert.ok(envelope.hkdfSalt, 'must have hkdf salt');
      assert.ok(envelope.iv, 'must have iv');
      assert.ok(envelope.ct, 'must have ciphertext');
    });

    it('session round-trip via session.decrypt', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      const result = await session.decrypt(ct);
      session.destroy();
      assert.strictEqual(result, plaintext);
    });

    it('session envelope can be decrypted standalone via decryptV2', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      session.destroy();
      const result = await decryptV2(password, ct);
      assert.strictEqual(result, plaintext);
    });

    it('session envelope can be decrypted via decryptAsync', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      session.destroy();
      const result = await decryptAsync(password, ct);
      assert.strictEqual(result, plaintext);
    });

    it('multiple encrypts produce different hkdfSalt values', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct1 = await session.encrypt(plaintext);
      const ct2 = await session.encrypt(plaintext);
      session.destroy();
      const e1: V2Envelope = JSON.parse(ct1);
      const e2: V2Envelope = JSON.parse(ct2);
      assert.notStrictEqual(e1.hkdfSalt, e2.hkdfSalt);
    });

    it('all session encrypts share the same argon2 salt', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct1 = await session.encrypt(plaintext);
      const ct2 = await session.encrypt(plaintext);
      session.destroy();
      const e1: V2Envelope = JSON.parse(ct1);
      const e2: V2Envelope = JSON.parse(ct2);
      assert.strictEqual(e1.salt, e2.salt);
    });

    it('wrong password rejected by decryptV2', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      session.destroy();
      await assert.rejects(() => decryptV2('wrong-password', ct));
    });

    it('destroy prevents further encrypt calls', async () => {
      const session = await createEncryptionSession(password, opts);
      session.destroy();
      await assert.rejects(() => session.encrypt(plaintext), /destroyed/);
    });

    it('destroy prevents further decrypt calls', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      session.destroy();
      await assert.rejects(() => session.decrypt(ct), /destroyed/);
    });

    it('session rejects envelopes from a different session', async () => {
      const session1 = await createEncryptionSession(password, opts);
      const session2 = await createEncryptionSession(password, opts);
      const ct = await session1.encrypt(plaintext);
      await assert.rejects(() => session2.decrypt(ct), /not encrypted with this session/);
      session1.destroy();
      session2.destroy();
    });

    it('session rejects standard v2 envelopes (no hkdfSalt)', async () => {
      const v2ct = await encryptV2(password, plaintext, opts);
      const session = await createEncryptionSession(password, opts);
      await assert.rejects(() => session.decrypt(v2ct), /use decryptV2/);
      session.destroy();
    });

    it('Argon2id params are stored in envelope', async () => {
      const session = await createEncryptionSession(password, { memorySize: 2048, iterations: 2, parallelism: 2 });
      const ct = await session.encrypt(plaintext);
      session.destroy();
      const envelope: V2Envelope = JSON.parse(ct);
      assert.strictEqual(envelope.m, 2048);
      assert.strictEqual(envelope.t, 2);
      assert.strictEqual(envelope.p, 2);
    });
  });

  describe('BitGoAPI.encryptAsync', () => {
    let bitgo: BitGoAPI;
    const password = 'test-password';
    const plaintext = 'hello encryptAsync';

    before(() => {
      bitgo = new BitGoAPI({ env: 'test' });
    });

    it('dispatches to v1 by default and output is decryptable via decrypt', async () => {
      const ct = await bitgo.encryptAsync({ input: plaintext, password });
      const envelope = JSON.parse(ct);
      assert.notStrictEqual(envelope.v, 2, 'default should not produce v2 envelope');
      assert.strictEqual(decrypt(password, ct), plaintext);
    });

    it('dispatches to v2 when encryptionVersion: 2 and output is decryptable via decryptAsync', async () => {
      const ct = await bitgo.encryptAsync({ input: plaintext, password, encryptionVersion: 2 });
      const envelope: V2Envelope = JSON.parse(ct);
      assert.strictEqual(envelope.v, 2);
      const result = await decryptAsync(password, ct);
      assert.strictEqual(result, plaintext);
    });
  });

  describe('BitGoAPI.createEncryptionSession', () => {
    let bitgo: BitGoAPI;
    const password = 'test-password';
    const plaintext = 'hello session';

    before(() => {
      bitgo = new BitGoAPI({ env: 'test' });
    });

    it('returns working session (encrypt/decrypt/destroy)', async () => {
      const session = await bitgo.createEncryptionSession(password);
      const ct = await session.encrypt(plaintext);
      const result = await session.decrypt(ct);
      assert.strictEqual(result, plaintext);
      session.destroy();
      await assert.rejects(() => session.encrypt(plaintext), /destroyed/);
    });
  });
});
