import * as sjcl from '@bitgo/sjcl';
import assert from 'assert';

import { decrypt, decryptV1, decryptV1WithSjcl, encrypt, V1_MAX_ITER } from '../../src';
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

describe('decryptV1WithSjcl (single v1 decrypt engine)', () => {
  const password = 'myPassword';
  const plaintext = 'Hello, World!';

  describe('historical envelope shapes', () => {
    it('decrypts an SDK-produced v1 envelope', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      assert.strictEqual(await decryptV1WithSjcl(password, ciphertext), plaintext);
    });

    it('decrypts an envelope without a `v` field', async () => {
      const envelope = JSON.parse(sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' }));
      delete envelope.v;
      assert.strictEqual(await decryptV1WithSjcl(password, JSON.stringify(envelope)), plaintext);
    });

    it('decrypts an envelope without a `mode` field (SJCL defaults to ccm)', async () => {
      const envelope = JSON.parse(sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' }));
      delete envelope.mode;
      assert.strictEqual(await decryptV1WithSjcl(password, JSON.stringify(envelope)), plaintext);
    });

    it('decrypts with adata (AAD)', async () => {
      const ciphertext = sjclEncrypt(password, plaintext, {
        iter: 10000,
        ks: 256,
        ts: 64,
        mode: 'ccm',
        adata: 'context-A',
      });
      assert.strictEqual(await decryptV1WithSjcl(password, ciphertext), plaintext);
    });

    it('decrypts UTF-8 password + plaintext', async () => {
      const utf8Password = 'pässwörd中文🔐';
      const utf8Plaintext = 'passphrase: 秘密キー ☃🔑';
      const ciphertext = sjclEncrypt(utf8Password, utf8Plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' });
      assert.strictEqual(await decryptV1WithSjcl(utf8Password, ciphertext), utf8Plaintext);
    });

    for (const [label, params] of [
      ['aes-128', { iter: 10000, ks: 128, ts: 64, mode: 'ccm' }],
      ['128-bit tag', { iter: 10000, ks: 256, ts: 128, mode: 'ccm' }],
    ] as const) {
      it(`decrypts ${label} envelopes`, async () => {
        const ciphertext = sjclEncrypt(password, plaintext, params);
        assert.strictEqual(await decryptV1WithSjcl(password, ciphertext), plaintext);
      });
    }
  });

  describe('real BitGo keycards', () => {
    for (const [label, ct, length] of [
      ['Box A', KEYCARD_BOX_A, KEYCARD_BOX_A_LENGTH],
      ['Box B', KEYCARD_BOX_B, KEYCARD_BOX_B_LENGTH],
    ] as const) {
      it(`${label}: decrypts with SJCL`, async () => {
        const result = await decryptV1WithSjcl(KEYCARD_PASSWORD, ct);
        assert.strictEqual(result, sjcl.decrypt(KEYCARD_PASSWORD, ct));
        assert.strictEqual(result.length, length);
        assert.ok(result.startsWith(KEYCARD_PLAINTEXT_PREFIX));
      });
    }
  });

  describe('failure modes', () => {
    it('throws on wrong password', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      await assert.rejects(() => decryptV1WithSjcl('wrongPassword', ciphertext));
    });

    it('throws on invalid JSON', async () => {
      await assert.rejects(() => decryptV1WithSjcl(password, 'not-json'), /json/);
    });

    it('rejects tampered ciphertext (auth-tag mismatch)', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      const envelope = JSON.parse(ciphertext);
      const tampered = Buffer.from(envelope.ct, 'base64');
      tampered[0] ^= 0x01;
      envelope.ct = tampered.toString('base64');
      await assert.rejects(() => decryptV1WithSjcl(password, JSON.stringify(envelope)));
    });
  });

  describe('envelope screening before SJCL', () => {
    it('rejects iter above V1_MAX_ITER before any KDF work', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.iter = V1_MAX_ITER + 1;
      const start = Date.now();
      await assert.rejects(() => decryptV1WithSjcl(password, JSON.stringify(envelope)), /iter/);
      assert.ok(Date.now() - start < 100, 'must reject before any KDF work');
    });

    for (const mode of ['gcm', 'ocb2'] as const) {
      it(`rejects ${mode} cipher mode even though SJCL supports it`, async () => {
        // Produce a real envelope SJCL could decrypt, to prove the screen
        // rejects it before SJCL ever runs.
        const ciphertext = sjclEncrypt(password, plaintext, { iter: 1000, ks: 256, ts: 64, mode });
        await assert.rejects(() => decryptV1WithSjcl(password, ciphertext), /unsupported mode/);
        assert.strictEqual(await sjcl.decrypt(password, ciphertext), plaintext);
      });
    }
  });

  describe('decrypt auto-detect dispatch', () => {
    it('routes v1 envelopes through the single engine', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      assert.strictEqual(await decrypt(password, ciphertext), plaintext);
    });

    it('enforces the iter cap through decrypt', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.iter = V1_MAX_ITER + 1;
      await assert.rejects(() => decrypt(password, JSON.stringify(envelope)), /iter/);
    });
  });

  describe('deprecated decryptV1 alias', () => {
    it('delegates to decryptV1WithSjcl', async () => {
      const ciphertext = await encrypt(password, plaintext, { encryptionVersion: 1 });
      assert.strictEqual(await decryptV1(password, ciphertext), plaintext);
    });

    it('enforces the iter cap', async () => {
      const envelope = JSON.parse(await encrypt(password, plaintext, { encryptionVersion: 1 }));
      envelope.iter = V1_MAX_ITER + 1;
      await assert.rejects(() => decryptV1(password, JSON.stringify(envelope)), /iter/);
    });
  });
});
