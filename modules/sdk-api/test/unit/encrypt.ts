import assert from 'assert';
import { randomBytes, webcrypto } from 'crypto';

import { decrypt, decryptV2, encrypt, encryptV2, V2Envelope, createEncryptionSession } from '../../src';
import { BitGoAPI } from '../../src/bitgoAPI';

const subtle = globalThis.crypto?.subtle ?? webcrypto.subtle;

/**
 * Build an HKDF-only v2 envelope independently of the SDK. Nothing in the SDK emits this
 * shape yet -- senders start doing so in WCN-2504 -- so the wire format is pinned here.
 * The info string must stay in sync with HKDF_ONLY_INFO in encryptV2.ts.
 */
async function makeHkdfOnlyEnvelope(
  password: string,
  plaintext: string,
  opts: { adata?: string; hkdfSalt?: Uint8Array } = {}
): Promise<string> {
  const hkdfSalt = opts.hkdfSalt ?? new Uint8Array(randomBytes(32));
  const iv = new Uint8Array(randomBytes(12));
  const ikm = await subtle.importKey('raw', new TextEncoder().encode(password), 'HKDF', false, ['deriveKey']);
  const aesKey = await subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: new TextEncoder().encode('bitgo-v2-hkdf') },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const params: AesGcmParams = { name: 'AES-GCM', iv, tagLength: 128 };
  if (opts.adata) params.additionalData = new TextEncoder().encode(opts.adata);
  const ct = await subtle.encrypt(params, aesKey, new TextEncoder().encode(plaintext));

  const envelope: V2Envelope = {
    v: 2,
    hkdfSalt: Buffer.from(hkdfSalt).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
    ct: Buffer.from(new Uint8Array(ct)).toString('base64'),
  };
  if (opts.adata) envelope.adata = opts.adata;
  return JSON.stringify(envelope);
}

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

  describe('v2 HKDF-only decrypt (high-entropy IKM, no Argon2)', () => {
    // ECDH-shaped input: 256-bit secret as hex, matching encryptPrvForUser.
    const highEntropyPassword = Buffer.alloc(32, 0xab).toString('hex');
    const plaintext = 'shared-wallet-prv';

    it('decrypts an HKDF-only envelope via decryptV2', async () => {
      const ciphertext = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext);
      assert.strictEqual(await decryptV2(highEntropyPassword, ciphertext), plaintext);
    });

    it('decrypts an HKDF-only envelope via decrypt auto-detect', async () => {
      const ciphertext = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext);
      assert.strictEqual(await decrypt(highEntropyPassword, ciphertext), plaintext);
    });

    it('decrypts a fixed HKDF-only envelope (wire format is pinned)', async () => {
      const ciphertext = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext, {
        hkdfSalt: new Uint8Array(32).fill(0xcd),
      });
      const envelope: V2Envelope = JSON.parse(ciphertext);
      assert.strictEqual(envelope.v, 2);
      assert.ok(envelope.hkdfSalt, 'must have hkdf salt');
      assert.strictEqual(envelope.m, undefined);
      assert.strictEqual(envelope.t, undefined);
      assert.strictEqual(envelope.p, undefined);
      assert.strictEqual(envelope.salt, undefined);
      assert.strictEqual(await decryptV2(highEntropyPassword, ciphertext), plaintext);
    });

    it('throws on wrong password', async () => {
      const ciphertext = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext);
      await assert.rejects(() => decryptV2('wrong-password', ciphertext));
    });

    it('decrypts an HKDF-only envelope carrying adata', async () => {
      const adata = 'wallet-share';
      const ciphertext = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext, { adata });
      assert.strictEqual(await decryptV2(highEntropyPassword, ciphertext), plaintext);
    });

    it('adata mismatch causes GCM decryption failure', async () => {
      const ciphertext = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext, { adata: 'context-A' });
      const envelope = JSON.parse(ciphertext);
      envelope.adata = 'context-B';
      await assert.rejects(
        () => decryptV2(highEntropyPassword, JSON.stringify(envelope)),
        /operation-specific reason|incorrect/i
      );
    });

    it('rejects mixed envelopes (hkdfSalt plus incomplete Argon2 params)', async () => {
      const envelope = { v: 2, m: 1024, hkdfSalt: 'AAAA', iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(highEntropyPassword, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects envelopes with neither Argon2 params nor hkdfSalt', async () => {
      const envelope = { v: 2, iv: 'AAAA', ct: 'AAAA' };
      await assert.rejects(() => decryptV2(highEntropyPassword, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('Argon2 and HKDF-only envelopes stay distinguishable and both decrypt', async () => {
      const argon2ct = await encryptV2(highEntropyPassword, plaintext, {
        memorySize: 1024,
        iterations: 1,
        parallelism: 1,
      });
      const hkdfct = await makeHkdfOnlyEnvelope(highEntropyPassword, plaintext);
      assert.strictEqual(await decryptV2(highEntropyPassword, argon2ct), plaintext);
      assert.strictEqual(await decryptV2(highEntropyPassword, hkdfct), plaintext);
      const argon2env = JSON.parse(argon2ct);
      const hkdfenv = JSON.parse(hkdfct);
      assert.ok(argon2env.salt);
      assert.ok(hkdfenv.hkdfSalt);
      assert.strictEqual(argon2env.hkdfSalt, undefined);
      assert.strictEqual(hkdfenv.salt, undefined);
    });

    it('no SDK encrypt path emits HKDF-only envelopes yet', async () => {
      const fromEncrypt: V2Envelope = JSON.parse(await encrypt(highEntropyPassword, plaintext));
      const fromEncryptV2: V2Envelope = JSON.parse(await encryptV2(highEntropyPassword, plaintext));
      for (const envelope of [fromEncrypt, fromEncryptV2]) {
        assert.strictEqual(envelope.v, 2);
        assert.ok(envelope.m, 'must still emit Argon2 params');
        assert.ok(envelope.t);
        assert.ok(envelope.p);
        assert.ok(envelope.salt);
        assert.strictEqual(envelope.hkdfSalt, undefined);
      }
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

  describe('createEncryptionSession with encryptionVersion=1 (v1 shim)', () => {
    const password = 'v1-shim-password';
    const plaintext = 'legacy consumer data';

    it('produces v1 (SJCL) envelopes', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      const ct = await session.encrypt(plaintext);
      const envelope = JSON.parse(ct);
      // v1 SJCL envelopes carry iter/mode/ks fields; no hkdfSalt/argon2 params
      assert.ok(envelope.iter, 'v1 envelope must have iter');
      assert.ok(envelope.mode, 'v1 envelope must have mode');
      assert.notStrictEqual(envelope.v, 2);
      assert.strictEqual(envelope.hkdfSalt, undefined);
      session.destroy();
    });

    it('round-trips via session.decrypt', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      const ct = await session.encrypt(plaintext);
      const rt = await session.decrypt(ct);
      assert.strictEqual(rt, plaintext);
      session.destroy();
    });

    it('produced envelopes decrypt via the standard decrypt() with the same password', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      const ct = await session.encrypt(plaintext);
      session.destroy();
      const rt = await decrypt(password, ct);
      assert.strictEqual(rt, plaintext);
    });

    it('multiple encrypts produce distinct ciphertexts (per-call SJCL salt/iv)', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      const ct1 = await session.encrypt(plaintext);
      const ct2 = await session.encrypt(plaintext);
      assert.notStrictEqual(ct1, ct2);
      const e1 = JSON.parse(ct1);
      const e2 = JSON.parse(ct2);
      // v1 salts are per-call, so they must differ across envelopes even under same password
      assert.notStrictEqual(e1.salt, e2.salt);
      session.destroy();
    });

    it('forwards adata to the v1 envelope', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      const ct = await session.encrypt(plaintext, 'enterprise-id-42');
      const envelope = JSON.parse(ct);
      assert.strictEqual(envelope.adata, 'enterprise-id-42');
      session.destroy();
    });

    it('destroy blocks further encrypt calls', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      session.destroy();
      await assert.rejects(() => session.encrypt(plaintext), /destroyed/);
    });

    it('destroy blocks further decrypt calls', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      const ct = await session.encrypt(plaintext);
      session.destroy();
      await assert.rejects(() => session.decrypt(ct), /destroyed/);
    });

    it('destroy is idempotent', async () => {
      const session = await createEncryptionSession(password, { encryptionVersion: 1 });
      session.destroy();
      session.destroy();
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
      assert.ok(envelope.salt, 'public encrypt must still emit Argon2 params');
      assert.strictEqual(envelope.hkdfSalt, undefined);
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
