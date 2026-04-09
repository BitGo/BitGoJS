import * as assert from 'assert';
import { toTNumber } from '../../src/bitgo';

const values = [
  0,
  1,
  1.01 * 1e8,
  Number.MAX_SAFE_INTEGER,
  '10999999800000001',
  '9223372036854775807',
  '91000036854775807',
  // TODO: Add some bigint inputs
];

describe('toTNumber', function () {
  values.forEach((value) => {
    if (typeof value === 'number') {
      it(`number ${value}`, function () {
        assert.strictEqual(toTNumber(value, 'number'), value);
        assert.strictEqual(toTNumber<number>(value, 'number'), value);
      });
    }
    it(`bigint ${value}`, function () {
      assert.strictEqual(toTNumber(value, 'bigint'), BigInt(value));
      assert.strictEqual(toTNumber<bigint>(value, 'bigint'), BigInt(value));
    });
  });
  it('throws on undefined value', function () {
    assert.throws(() => {
      const a: string = undefined as unknown as string;
      toTNumber(a, 'number');
    });
  });
  it('throws on unsafe number', function () {
    assert.throws(() => {
      toTNumber('10999999800000001', 'number');
    });
  });
  it('throws on invalid amountType', function () {
    assert.throws(() => {
      toTNumber(BigInt(123), 'invalid' as 'number' | 'bigint');
    });
  });
});
