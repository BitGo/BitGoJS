import * as sjcl from '@bitgo/sjcl';
import assert from 'assert';

import { decryptV1WithCrypto, V1_MAX_ITER } from '../../src';
import { KEYCARD_BOX_A, KEYCARD_BOX_B, KEYCARD_PASSWORD, KEYCARD_PLAINTEXT_PREFIX } from './fixtures/keycard';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const browserCrypto = require('crypto-browserify');

/**
 * sjcl.encrypt's typings require salt/iv, but the runtime picks them from
 * sjcl.random when omitted. Feed real random words so the call type-checks
 * without an `as` cast.
 */
function sjclEncrypt(password: string, plaintext: string, params: sjcl.SjclCipherParams): string {
  const salt = sjcl.random.randomWords(2);
  const iv = sjcl.random.randomWords(4);
  return sjcl.encrypt(password, plaintext, { ...params, salt, iv });
}

/**
 * Exercises the real `decryptV1WithCrypto` code path with `crypto-browserify`
 * injected as the crypto module. This is exactly what webpack bundles for the
 * browser (its `crypto` shim), so a green test here proves the browser build
 * stays byte-compatible with SJCL-produced envelopes and the Node path.
 */
function decryptV1Browser(password: string, ciphertext: string): Promise<string> {
  return decryptV1WithCrypto(password, ciphertext, browserCrypto);
}

describe('decryptV1 browser path (crypto-browserify shim)', () => {
  const password = 'myPassword';
  const plaintext = 'Hello, Browser!';

  it('produces the same plaintext as sjcl.decrypt', async () => {
    const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' });
    assert.strictEqual(await decryptV1Browser(password, ciphertext), sjcl.decrypt(password, ciphertext));
  });

  it('handles adata (AAD)', async () => {
    const ciphertext = sjclEncrypt(password, plaintext, {
      iter: 10000,
      ks: 256,
      ts: 64,
      mode: 'ccm',
      adata: 'ctx-A',
    });
    assert.strictEqual(await decryptV1Browser(password, ciphertext), plaintext);
  });

  it('handles UTF-8 password + plaintext', async () => {
    const utf8Password = 'pässwörd中文🔐';
    const utf8Plaintext = 'passphrase: 秘密キー ☃🔑';
    const ciphertext = sjclEncrypt(utf8Password, utf8Plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' });
    assert.strictEqual(await decryptV1Browser(utf8Password, ciphertext), utf8Plaintext);
  });

  it('handles large plaintext (>64 KiB, forces L=3 nonce framing)', async () => {
    const large = 'x'.repeat(70_000);
    const ciphertext = sjclEncrypt(password, large, { iter: 1000, ks: 256, ts: 64, mode: 'ccm' });
    assert.strictEqual(await decryptV1Browser(password, ciphertext), large);
  });

  it('handles aes-128 envelopes', async () => {
    const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 128, ts: 64, mode: 'ccm' });
    assert.strictEqual(await decryptV1Browser(password, ciphertext), plaintext);
  });

  it('handles 128-bit tag envelopes', async () => {
    const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 128, mode: 'ccm' });
    assert.strictEqual(await decryptV1Browser(password, ciphertext), plaintext);
  });

  it('rejects wrong password', async () => {
    const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' });
    await assert.rejects(() => decryptV1Browser('wrongPassword', ciphertext));
  });

  it('rejects envelope with iter above cap before running PBKDF2', async () => {
    const ciphertext = sjclEncrypt(password, plaintext, { iter: 10000, ks: 256, ts: 64, mode: 'ccm' });
    const envelope = JSON.parse(ciphertext);
    envelope.iter = V1_MAX_ITER + 1;
    const start = Date.now();
    await assert.rejects(() => decryptV1Browser(password, JSON.stringify(envelope)), /iter/);
    assert.ok(Date.now() - start < 100, 'must reject before any KDF work');
  });

  it('parity across 50 randomised inputs', async () => {
    const { randomBytes } = await import('crypto');
    for (let i = 0; i < 50; i++) {
      const pw = randomBytes(16).toString('hex');
      const pt = randomBytes(1 + Math.floor(Math.random() * 500)).toString('base64');
      const ciphertext = sjclEncrypt(pw, pt, { iter: 1000, ks: 256, ts: 64, mode: 'ccm' });
      assert.strictEqual(await decryptV1Browser(pw, ciphertext), pt, `iteration ${i}`);
    }
  });

  it('Box A + Box B: shim decrypt matches SJCL byte-for-byte', async () => {
    for (const [label, ct] of [
      ['A', KEYCARD_BOX_A],
      ['B', KEYCARD_BOX_B],
    ] as const) {
      const sjclResult = sjcl.decrypt(KEYCARD_PASSWORD, ct);
      const shimResult = await decryptV1Browser(KEYCARD_PASSWORD, ct);
      assert.strictEqual(shimResult, sjclResult, `Box ${label} mismatch`);
      assert.ok(shimResult.startsWith(KEYCARD_PLAINTEXT_PREFIX));
    }
  });
});
