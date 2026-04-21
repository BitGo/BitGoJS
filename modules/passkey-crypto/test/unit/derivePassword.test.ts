import * as assert from 'assert';
import { derivePassword } from '../../src';

describe('derivePassword', function () {
  it('converts an ArrayBuffer of zeros to a hex string of zeros', function () {
    const input = new ArrayBuffer(4);
    assert.strictEqual(derivePassword(input), '00000000');
  });

  it('converts known bytes to expected hex', function () {
    const input = new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer;
    assert.strictEqual(derivePassword(input), 'deadbeef');
  });

  it('returns a lowercase hex string', function () {
    const input = new Uint8Array([0xab, 0xcd]).buffer;
    const result = derivePassword(input);
    assert.strictEqual(result, result.toLowerCase());
  });

  it('returns a string of length 2x the input byte length', function () {
    const input = new ArrayBuffer(32);
    assert.strictEqual(derivePassword(input).length, 64);
  });

  it('produces the same output for the same input (deterministic)', function () {
    const input = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    assert.strictEqual(derivePassword(input), derivePassword(input));
  });
});
