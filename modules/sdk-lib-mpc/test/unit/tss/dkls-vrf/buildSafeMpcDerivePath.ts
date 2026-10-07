import assert from 'assert';
import { DklsVrfUtils } from '../../../../src/tss';

describe('buildSafeMpcDerivePath', function () {
  it("builds the 4-level hardened path m/44'/1'/3'/0'", function () {
    const path = DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 0 });
    assert.strictEqual(path.length, 16);
    assert.deepStrictEqual(Array.from(path), [
      0x80,
      0x00,
      0x00,
      0x2c, // 44'
      0x80,
      0x00,
      0x00,
      0x01, // 1'
      0x80,
      0x00,
      0x00,
      0x03, // 3'
      0x80,
      0x00,
      0x00,
      0x00, // 0'
    ]);
  });

  it('encodes a multi-byte account without truncation', function () {
    const path = DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 300 });
    // 300' = 0x8000012c, so the last segment must span two bytes.
    assert.deepStrictEqual(Array.from(path.slice(12)), [0x80, 0x00, 0x01, 0x2c]);
  });

  it('rejects a segment at or above the hardened boundary', function () {
    assert.throws(
      () => DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 0x80000000 }),
      /Invalid BIP44 path segment at index 3/
    );
  });
});
