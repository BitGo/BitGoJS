import assert from 'assert';
import { randomBytes } from 'crypto';

import { decrypt, decryptV2, encrypt, encryptV2, V2Envelope, createEncryptionSession } from '../../src';
import { BitGoAPI } from '../../src/bitgoAPI';

describe('encryption methods tests', () => {
  describe('encrypt (async, default v2)', () => {
    const password = 'myPassword';
    const plaintext = 'Hello, World!';

    it('encrypts the plaintext with the given password', async () => {
      const ciphertext = await encrypt(password, plaintext);
      assert(ciphertext !== plaintext, 'ciphertext should not be equal to plaintext');
    });

    it('produces a v2 envelope by default', async () => {
      const ciphertext = await encrypt(password, plaintext);
      const envelope: V2Envelope = JSON.parse(ciphertext);
      assert.strictEqual(envelope.v, 2);
    });

    it('returns a different ciphertext for the same plaintext and password', async () => {
      const ciphertext1 = await encrypt(password, plaintext);
      const ciphertext2 = await encrypt(password, plaintext);
      assert(ciphertext1 !== ciphertext2, 'ciphertexts should not be equal');
    });

    it('forwards adata to the v2 envelope', async () => {
      const adata = 'txhash:m/0/1';
      const ciphertext = await encrypt(password, plaintext, { adata });
      const envelope: V2Envelope = JSON.parse(ciphertext);
      assert.strictEqual(envelope.adata, adata);
      assert.strictEqual(await decrypt(password, ciphertext), plaintext);
    });
  });

  describe('encrypt with encryptionVersion: 1 (legacy v1)', () => {
    const password = 'myPassword';
    const plaintext = 'Hello, World!';

    it('produces a v1 envelope that decrypts back via decrypt', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      const envelope = JSON.parse(ciphertext);
      assert.notStrictEqual(envelope.v, 2, 'encryptionVersion 1 should not produce a v2 envelope');
      assert.strictEqual(await decrypt(password, ciphertext), plaintext);
    });

    it('throws an error if the salt length is not 8 bytes', async () => {
      await assert.rejects(
        () => encrypt(password, plaintext, { encryptionVersion: 1, salt: randomBytes(4) }),
        /salt must be 8 bytes/
      );
    });

    it('throws an error if the iv length is not 16 bytes', async () => {
      await assert.rejects(
        () => encrypt(password, plaintext, { encryptionVersion: 1, iv: randomBytes(4) }),
        /iv must be 16 bytes/
      );
    });

    it('forwards salt and iv options for deterministic v1 output', async () => {
      const salt = randomBytes(8);
      const iv = randomBytes(16);
      const ct1 = await encrypt(password, plaintext, { encryptionVersion: 1, salt, iv });
      const ct2 = await encrypt(password, plaintext, { encryptionVersion: 1, salt, iv });
      assert.strictEqual(ct1, ct2);
      assert.strictEqual(await decrypt(password, ct1), plaintext);
    });
  });

  describe('decrypt (auto-detect v1/v2)', () => {
    const password = 'myPassword';
    const plaintext = 'Hello, World!';

    it('decrypts default v2 data', async () => {
      const ciphertext = await encrypt(password, plaintext);
      assert.strictEqual(await decrypt(password, ciphertext), plaintext);
    });

    it('decrypts legacy v1 data', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      assert.strictEqual(await decrypt(password, ciphertext), plaintext);
    });

    it('throws on wrong password for v1', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      await assert.rejects(() => decrypt('wrongPassword', ciphertext));
    });

    it('throws on wrong password for v2', async () => {
      const ciphertext = await encrypt(password, plaintext);
      await assert.rejects(() => decrypt('wrongPassword', ciphertext));
    });

    it('throws on invalid JSON input', async () => {
      await assert.rejects(() => decrypt(password, 'not-json'), /ciphertext is not valid JSON/);
    });

    it('wrong password on v2 data does not fall through to v1 decrypt', async () => {
      const v2ct = await encryptV2(password, plaintext, { memorySize: 1024, iterations: 1, parallelism: 1 });
      let caughtError: Error | undefined;
      try {
        await decrypt('wrong', v2ct);
      } catch (e) {
        caughtError = e as Error;
      }
      assert.ok(caughtError, 'should have thrown');
      assert.ok(!caughtError.message?.includes('sjcl'), 'error must not be from SJCL');
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

    it('encrypts and decrypts with adata (AAD)', async () => {
      const adata = 'txhash:m/0/1';
      const ciphertext = await encryptV2(password, plaintext, { adata });
      const envelope: V2Envelope = JSON.parse(ciphertext);
      assert.strictEqual(envelope.adata, adata);
      const decrypted = await decryptV2(password, ciphertext);
      assert.strictEqual(decrypted, plaintext);
    });

    it('adata mismatch causes GCM decryption failure', async () => {
      const ciphertext = await encryptV2(password, plaintext, { adata: 'context-A' });
      const envelope = JSON.parse(ciphertext);
      envelope.adata = 'context-B';
      await assert.rejects(() => decryptV2(password, JSON.stringify(envelope)), /operation-specific reason|incorrect/i);
    });

    it('adata: undefined is equivalent to omitting adata', async () => {
      const fixedOpts = {
        memorySize: 1024,
        iterations: 1,
        parallelism: 1,
        salt: new Uint8Array(16).fill(0xaa),
        iv: new Uint8Array(12).fill(0xbb),
      };
      const withUndefined = await encryptV2(password, plaintext, { ...fixedOpts, adata: undefined });
      const withOmitted = await encryptV2(password, plaintext, fixedOpts);
      assert.strictEqual(withUndefined, withOmitted);
      assert.strictEqual(await decryptV2(password, withUndefined), plaintext);
    });

    it('ciphertext bound to enterprise-A cannot be re-attributed to enterprise-B', async () => {
      const prv = 'xprv-private-key-bytes';
      const prfKey = 'prf-derived-key';
      const ct = await encryptV2(prfKey, prv, { adata: 'enterprise-A' });
      // Attacker moves blob to enterprise-B by altering the stored adata field
      const envelope = JSON.parse(ct);
      envelope.adata = 'enterprise-B';
      await assert.rejects(() => decryptV2(prfKey, JSON.stringify(envelope)));
    });

    it('v1 and v2 are independent (v1 data does not decrypt with v2)', async () => {
      const v1ct = await encrypt(password, plaintext, { encryptionVersion: 1 });
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

    it('session envelope can be decrypted via decrypt', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext);
      session.destroy();
      const result = await decrypt(password, ct);
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

    it('session encrypt with adata round-trip', async () => {
      const session = await createEncryptionSession(password, opts);
      const adata = 'txhash:m/0/1:round1';
      const ct = await session.encrypt(plaintext, adata);
      const envelope: V2Envelope = JSON.parse(ct);
      assert.strictEqual(envelope.adata, adata);
      const result = await session.decrypt(ct);
      assert.strictEqual(result, plaintext);
      session.destroy();
    });

    it('session encrypt with adata is decryptable via decryptV2', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext, 'context-binding');
      session.destroy();
      const result = await decryptV2(password, ct);
      assert.strictEqual(result, plaintext);
    });

    it('session adata mismatch causes GCM failure', async () => {
      const session = await createEncryptionSession(password, opts);
      const ct = await session.encrypt(plaintext, 'original-context');
      const envelope = JSON.parse(ct);
      envelope.adata = 'tampered-context';
      await assert.rejects(() => session.decrypt(JSON.stringify(envelope)), /operation-specific reason|incorrect/i);
      session.destroy();
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

  describe('BitGoAPI.encrypt', () => {
    let bitgo: BitGoAPI;
    const password = 'test-password';
    const plaintext = 'hello encrypt';

    before(() => {
      bitgo = new BitGoAPI({ env: 'test' });
    });

    it('produces a v2 envelope by default and output is decryptable via decrypt', async () => {
      const ct = await bitgo.encrypt({ input: plaintext, password });
      const envelope: V2Envelope = JSON.parse(ct);
      assert.strictEqual(envelope.v, 2);
      assert.strictEqual(await decrypt(password, ct), plaintext);
    });

    it('produces a v1 envelope when encryptionVersion: 1', async () => {
      const ct = await bitgo.encrypt({ input: plaintext, password, encryptionVersion: 1 });
      const envelope = JSON.parse(ct);
      assert.notStrictEqual(envelope.v, 2);
      assert.strictEqual(await decrypt(password, ct), plaintext);
    });

    it('forwards adata to v2 envelope', async () => {
      const adata = 'txhash:m/0/1';
      const ct = await bitgo.encrypt({ input: plaintext, password, adata });
      const envelope: V2Envelope = JSON.parse(ct);
      assert.strictEqual(envelope.adata, adata);
      assert.strictEqual(await decrypt(password, ct), plaintext);
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
