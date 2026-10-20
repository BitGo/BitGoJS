import assert from 'assert';
import { DklsVrfUtils } from '../../../../src/tss';

describe('buildSafeMpcDerivePath', function () {
  it("encodes m/44'/1'/3'/0' as the UTF-8 bytes of the path string", function () {
    const path = DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 0 });
    assert.strictEqual(Buffer.from(path).toString('utf8'), "m/44'/1'/3'/0'");
  });

  it('writes multi-digit coin types and accounts as plain decimals', function () {
    const path = DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 501, safeSlotOrdinal: 4, accountIndex: 300 });
    assert.strictEqual(Buffer.from(path).toString('hex'), Buffer.from("m/44'/501'/4'/300'").toString('hex'));
  });

  it('accepts the largest index below the hardened boundary', function () {
    const path = DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 0x7fffffff });
    assert.strictEqual(Buffer.from(path).toString('utf8'), "m/44'/1'/3'/2147483647'");
  });

  it('rejects a segment at or above the hardened boundary', function () {
    assert.throws(
      () => DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 0x80000000 }),
      /Invalid BIP44 path segment at index 3/
    );
  });

  it('rejects a negative or non-integer segment', function () {
    assert.throws(
      () => DklsVrfUtils.buildSafeMpcDerivePath({ coinType: -1, safeSlotOrdinal: 3, accountIndex: 0 }),
      /Invalid BIP44 path segment at index 1/
    );
    assert.throws(
      () => DklsVrfUtils.buildSafeMpcDerivePath({ coinType: 1, safeSlotOrdinal: 3, accountIndex: 1.5 }),
      /Invalid BIP44 path segment at index 3/
    );
  });
});
