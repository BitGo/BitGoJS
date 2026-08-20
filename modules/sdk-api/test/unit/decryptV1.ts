import * as sjcl from '@bitgo/sjcl';
import assert from 'assert';
import { randomBytes } from 'crypto';

import { decrypt, decryptV1, decryptV1WithFallback, encrypt, V1_MAX_ITER } from '../../src';
import {
  KEYCARD_BOX_A,
  KEYCARD_BOX_A_LENGTH,
  KEYCARD_BOX_B,
  KEYCARD_BOX_B_LENGTH,
  KEYCARD_PASSWORD,
  KEYCARD_PLAINTEXT_PREFIX,
} from './fixtures/keycard';

/**
 * sjcl.encrypt's typings require salt/iv, but the runtime picks them from
 * sjcl.random when omitted. Feed real random words so the call type-checks
 * without an `as` cast.
 */
function sjclEncrypt(password: string, plaintext: string, params: sjcl.SjclCipherParams): string {
  const salt = sjcl.random.randomWords(2); // 8 bytes
  const iv = sjcl.random.randomWords(4); // 16 bytes
  return sjcl.encrypt(password, plaintext, { ...params, salt, iv });
}

describe('decryptV1 (native, SJCL-free)', () => {
  const password = 'myPassword';
  const plaintext = 'Hello, World!';

  describe('parity with SJCL', () => {
    it('matches sjcl.decrypt output for the same envelope', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      assert.strictEqual(await decryptV1(password, ciphertext), sjcl.decrypt(password, ciphertext));
    });

    it('decrypts with adata (AAD)', async () => {
      const ciphertext = sjclEncrypt(password, plaintext, {
        iter: 10000,
        ks: 256,
        ts: 64,
        mode: 'ccm',
        adata: 'context-A',
      });
      assert.strictEqual(await decryptV1(password, ciphertext), plaintext);
    });

    it('decrypts UTF-8 password + plaintext', async () => {
      const utf8Password = 'pässwörd中文🔐';
      const utf8Plaintext = 'passphrase: 秘密キー ☃🔑';
      const ciphertext = sjclEncrypt(utf8Password, utf8Plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' });
      assert.strictEqual(await decryptV1(utf8Password, ciphertext), utf8Plaintext);
    });

    it('decrypts large plaintext (>64 KiB, forces L=3 nonce framing)', async () => {
      const large = 'x'.repeat(70_000);
      const ciphertext = sjclEncrypt(password, large, { iter: 1000, ks: 256, ts: 64, mode: 'ccm' });
      assert.strictEqual(await decryptV1(password, ciphertext), large);
    });

    it('decrypts aes-128 envelopes', async () => {
      const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 128, ts: 64, mode: 'ccm' });
      assert.strictEqual(await decryptV1(password, ciphertext), plaintext);
    });

    it('decrypts envelopes with 128-bit tag size', async () => {
      const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 128, mode: 'ccm' });
      assert.strictEqual(await decryptV1(password, ciphertext), plaintext);
    });

    it('parity across 50 randomised inputs', async () => {
      for (let i = 0; i < 50; i++) {
        const pw = randomBytes(16).toString('hex');
        const pt = randomBytes(1 + Math.floor(Math.random() * 500)).toString('base64');
        const ciphertext = sjclEncrypt(pw, pt, { iter: 1000, ks: 256, ts: 64, mode: 'ccm' });
        assert.strictEqual(await decryptV1(pw, ciphertext), pt, `iteration ${i}`);
      }
    });
  });

  describe('failure modes', () => {
    it('throws on wrong password', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      await assert.rejects(() => decryptV1('wrongPassword', ciphertext));
    });

    it('throws on invalid JSON', async () => {
      await assert.rejects(() => decryptV1(password, 'not-json'), /invalid JSON envelope/);
    });

    it('rejects malformed envelope (representative codec check)', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.mode = 'gcm';
      await assert.rejects(() => decryptV1(password, JSON.stringify(envelope)), /invalid envelope/);
    });

    it('rejects tampered ciphertext (auth-tag mismatch)', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      const envelope = JSON.parse(ciphertext);
      const tampered = Buffer.from(envelope.ct, 'base64');
      tampered[0] ^= 0x01;
      envelope.ct = tampered.toString('base64');
      await assert.rejects(() => decryptV1(password, JSON.stringify(envelope)));
    });
  });

  describe('iter cap enforcement', () => {
    it('rejects an envelope with iter above V1_MAX_ITER before running PBKDF2', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.iter = V1_MAX_ITER + 1;
      const start = Date.now();
      await assert.rejects(() => decryptV1(password, JSON.stringify(envelope)), /iter/);
      assert.ok(Date.now() - start < 100, 'must reject before any KDF work');
    });
  });

  describe('real BitGo keycard parity', () => {
    it('Box A: native decrypt matches SJCL byte-for-byte', async () => {
      const sjclResult = sjcl.decrypt(KEYCARD_PASSWORD, KEYCARD_BOX_A);
      const nativeResult = await decryptV1(KEYCARD_PASSWORD, KEYCARD_BOX_A);
      assert.strictEqual(nativeResult, sjclResult);
      assert.strictEqual(nativeResult.length, KEYCARD_BOX_A_LENGTH);
      assert.ok(nativeResult.startsWith(KEYCARD_PLAINTEXT_PREFIX));
    });

    it('Box B: native decrypt matches SJCL byte-for-byte', async () => {
      const sjclResult = sjcl.decrypt(KEYCARD_PASSWORD, KEYCARD_BOX_B);
      const nativeResult = await decryptV1(KEYCARD_PASSWORD, KEYCARD_BOX_B);
      assert.strictEqual(nativeResult, sjclResult);
      assert.strictEqual(nativeResult.length, KEYCARD_BOX_B_LENGTH);
      assert.ok(nativeResult.startsWith(KEYCARD_PLAINTEXT_PREFIX));
    });
  });

  describe('SJCL fallback behavior', () => {
    // Rollout contract:
    // - Native success -> no warn, no fallback.
    // - Iter cap violation -> rethrown (no fallback), preserves DoS protection.
    // - Both engines fail (e.g. wrong password) -> SJCL error rethrown, NO warn.
    // - Native fails, SJCL succeeds -> return SJCL result + warn (engines disagree).

    // eslint-disable-next-line no-console
    const originalWarn = console.warn;
    let warnings: string[] = [];

    beforeEach(() => {
      warnings = [];
      // eslint-disable-next-line no-console
      console.warn = (...args: unknown[]) => {
        warnings.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
      };
    });

    afterEach(() => {
      // eslint-disable-next-line no-console
      console.warn = originalWarn;
    });

    it('success path emits no console.warn', async () => {
      const ct = await encrypt(password, plaintext, { encryptionVersion: 1 });
      await decrypt(password, ct);
      assert.deepStrictEqual(warnings, []);
    });

    it('iter cap violation rethrows and does not warn', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.iter = V1_MAX_ITER + 1;
      await assert.rejects(() => decrypt(password, JSON.stringify(envelope)), /iter/);
      assert.deepStrictEqual(warnings, []);
    });

    it('wrong password does not warn (both engines fail, SJCL error rethrown)', async () => {
      const ct = await encrypt(password, plaintext, { encryptionVersion: 1 });
      await assert.rejects(() => decrypt('wrong', ct));
      assert.deepStrictEqual(warnings, []);
    });

    it('warns and returns SJCL result when native fails but SJCL succeeds', async () => {
      const ct = await encrypt(password, plaintext, { encryptionVersion: 1 });
      const brokenNative = async () => {
        throw new Error('unsupported algorithm');
      };
      const result = await decryptV1WithFallback(password, ct, brokenNative);
      assert.strictEqual(result, plaintext);
      assert.strictEqual(warnings.length, 1);
      assert.ok(warnings[0].includes('SJCL fallback succeeded'));
    });
  });

  describe('browser runtime (isBrowser = true)', () => {
    it('skips native and decrypts via SJCL without warning', async () => {
      const ct = await encrypt(password, plaintext, { encryptionVersion: 1 });
      const neverCalled = async (): Promise<string> => {
        throw new Error('native should not be attempted in the browser');
      };
      // eslint-disable-next-line no-console
      const originalWarn = console.warn;
      const warnings: string[] = [];
      // eslint-disable-next-line no-console
      console.warn = (...args: unknown[]) => {
        warnings.push(args.join(' '));
      };
      try {
        const result = await decryptV1WithFallback(password, ct, neverCalled, true);
        assert.strictEqual(result, plaintext);
        assert.deepStrictEqual(warnings, []);
      } finally {
        // eslint-disable-next-line no-console
        console.warn = originalWarn;
      }
    });

    it('still enforces the iter cap before running PBKDF2', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.iter = V1_MAX_ITER + 1;
      const start = Date.now();
      await assert.rejects(() => decryptV1WithFallback(password, JSON.stringify(envelope), decryptV1, true), /iter/);
      assert.ok(Date.now() - start < 100, 'must reject before any KDF work');
    });

    it('rejects wrong password via SJCL auth failure', async () => {
      const ct = await encrypt(password, plaintext, { encryptionVersion: 1 });
      await assert.rejects(() => decryptV1WithFallback('wrongPassword', ct, decryptV1, true));
    });
  });
});
