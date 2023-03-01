/* eslint no-redeclare: 0 */
import * as assert from 'assert';
import { InvalidOrdOutput, InvalidSatRange, OrdOutput } from '../../src/ord';
import { output, range } from './util';

describe('SatRange', function () {
  it('size', function () {
    assert.strictEqual(range(0).size(), BigInt(1));
    assert.strictEqual(range(0, 1).size(), BigInt(2));
  });

  it('shiftedBy returns new shifted instance', function () {
    const satRange = range(0, 1);
    assert.deepStrictEqual(satRange.shiftedBy(BigInt(10)), range(10, 11));
    assert.deepStrictEqual(satRange, range(0, 1));
  });

  it('implements isSupersetOf', function () {
    assert.strictEqual(range(0).isSupersetOf(range(0)), true);
    assert.strictEqual(range(0).isSupersetOf(range(1)), false);
    assert.strictEqual(range(0, 1).isSupersetOf(range(1)), true);
    assert.strictEqual(range(1).isSupersetOf(range(0, 1)), false);
  });

  it('implements intersectsWith', function () {
    assert.strictEqual(range(0, 0).intersectsWith(range(0, 0)), true);
    assert.strictEqual(range(0, 0).intersectsWith(range(0, 1)), true);
    assert.strictEqual(range(0, 0).intersectsWith(range(1, 1)), false);
    assert.strictEqual(range(0, 1).intersectsWith(range(1, 1)), true);
  });

  it('rejects invalid ranges', function () {
    assert.throws(() => range(-1), InvalidSatRange);
    assert.throws(() => range(1, 0), InvalidSatRange);
  });
});

describe('OrdOutput', function () {
  describe('constructor', function () {
    it('rejects invalid ranges', function () {
      assert.throws(() => output(1000, range(1000)), InvalidOrdOutput);
      assert.throws(() => output(1000, range(999, 1000)), InvalidOrdOutput);
      assert.throws(() => output(1000, range(1), range(0)), InvalidOrdOutput);
    });
  });

  describe('joinedWith', function () {
    it('joining two outputs shifts ranges by value of first element', function () {
      assert.deepStrictEqual(
        output(1000, range(0), range(99)).joinedWith(output(100, range(0), range(99))),
        output(1100, range(0), range(99), range(1000), range(1099))
      );
    });

    it('joinAll outputs shifts ranges by value of first element', function () {
      assert.deepStrictEqual(
        OrdOutput.joinAll([output(1000, range(0), range(99)), output(100, range(0), range(99)), output(10, range(0))]),
        output(1110, range(0), range(99), range(1000), range(1099), range(1100))
      );
    });
  });

  describe('splitAt', function () {
    it('splits into two outputs', function () {
      const o = output(1000, range(0), range(500));
      assert.deepStrictEqual(o.splitAt(BigInt(1)), [output(1, range(0)), output(999, range(499))]);
      assert.deepStrictEqual(o.splitAt(BigInt(100)), [output(100, range(0)), output(900, range(400))]);
      assert.deepStrictEqual(o.splitAt(BigInt(500)), [output(500, range(0)), output(500, range(0))]);
      [BigInt(1), BigInt(100), BigInt(500), BigInt(600), BigInt(900), BigInt(999)].forEach((value) =>
        assert.deepStrictEqual(OrdOutput.joinAll(o.splitAt(value)), o)
      );
    });
  });

  describe('splitAll', function () {
    it('splits according to values', function () {
      const o = output(1000, range(0), range(500), range(900));
      const split = o.splitAll([BigInt(100), BigInt(800)]);
      assert.deepStrictEqual(split, [output(100, range(0)), output(800, range(400)), output(100, range(0))]);
      assert.deepStrictEqual(OrdOutput.joinAll(split), o);
    });
  });
});
