import * as assert from 'assert';
import { derivePassword } from '../../src';

// Real fixture values captured from a live environment (browser devtools)
const REAL_FIXTURE = {
  prfOutputBase64: 'Hly0eFbg+8ZX9B2GWuDlNTRkvSLF0nHRTTOvw+ljAzs=',
  expectedPasswordHex: '1e5cb47856e0fbc657f41d865ae0e5353464bd22c5d271d14d33afc3e963033b',
};

describe('derivePassword', function () {
  it('produces the correct hex password for real PRF output fixture', function () {
    // Verifies SDK output matches what the retail UI produces for the same PRF result,
    // ensuring clients can move between SDK and retail app seamlessly.
    const prfBuffer = Buffer.from(REAL_FIXTURE.prfOutputBase64, 'base64');
    assert.strictEqual(derivePassword(new Uint8Array(prfBuffer).buffer), REAL_FIXTURE.expectedPasswordHex);
  });

  it('converts an ArrayBuffer of zeros to a hex string of zeros', function () {
    assert.strictEqual(derivePassword(new ArrayBuffer(4)), '00000000');
  });

  it('returns a lowercase hex string', function () {
    const input = new Uint8Array([0xab, 0xcd]).buffer;
    const result = derivePassword(input);
    assert.strictEqual(result, result.toLowerCase());
  });

  it('returns a string of length 2x the input byte length', function () {
    assert.strictEqual(derivePassword(new ArrayBuffer(32)).length, 64);
  });

  it('is deterministic — same inputs produce same output', function () {
    const input = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    assert.strictEqual(derivePassword(input), derivePassword(input));
  });
});
