import * as assert from 'assert';
import { base64UrlToBuffer, bufferToBase64Url, toBase64Url } from '../../src/base64url';

describe('base64url helpers', function () {
  describe('toBase64Url', function () {
    it('replaces +, / and strips padding', function () {
      assert.strictEqual(toBase64Url('a+b/c=='), 'a-b_c');
    });

    it('is a no-op on already-base64url input', function () {
      assert.strictEqual(toBase64Url('a-b_c'), 'a-b_c');
    });

    it('handles empty string', function () {
      assert.strictEqual(toBase64Url(''), '');
    });
  });

  describe('bufferToBase64Url', function () {
    it('encodes a Buffer to unpadded base64url', function () {
      // bytes that produce + and / in standard base64
      const buf = Buffer.from([0xfb, 0xff, 0xbf]);
      assert.strictEqual(buf.toString('base64'), '+/+/');
      assert.strictEqual(bufferToBase64Url(buf), '-_-_');
    });

    it('encodes an ArrayBuffer to unpadded base64url', function () {
      const ab = new Uint8Array([0xff, 0xfe, 0xfd]).buffer;
      assert.strictEqual(bufferToBase64Url(ab), '__79');
    });
  });

  describe('base64UrlToBuffer', function () {
    it('round-trips through bufferToBase64Url', function () {
      const original = Buffer.from([0x00, 0xff, 0x10, 0x20, 0xab, 0xcd]);
      const encoded = bufferToBase64Url(original);
      const decoded = base64UrlToBuffer(encoded);
      assert.deepStrictEqual(decoded, original);
    });

    it('decodes base64url with - and _ chars', function () {
      const decoded = base64UrlToBuffer('-_-_');
      assert.deepStrictEqual(decoded, Buffer.from([0xfb, 0xff, 0xbf]));
    });
  });
});
