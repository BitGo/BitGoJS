import * as assert from 'assert';
import { toTNumber, getValueScaled } from '../../src/bitgo';

const values = [
  0,
  1,
  1.01 * 1e8,
  Number.MAX_SAFE_INTEGER,
  '10999999800000001',
  '9223372036854775807',
  '91000036854775807',
];
const unscaledValues = [
  0,
  0.00000001,
  1.01,
  90071992.54740991, // Number.MAX_SAFE_INTEGER / 1e8
  109999998.00000001,
  // These values aren't safe numbers
  // 92233720368.54775807,
  // 910000368.54775807,
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

describe('getValueScaled', function () {
  unscaledValues.forEach((unscaledValue, i) => {
    if (typeof values[i] === 'number') {
      it(`number ${values[i]}`, function () {
        assert.strictEqual(getValueScaled(unscaledValue), values[i]);
        assert.strictEqual(getValueScaled<number>(unscaledValue, 'number', 1e8), values[i]);
      });
    }
    it(`bigint ${values[i]}`, function () {
      assert.strictEqual(getValueScaled(unscaledValue, 'bigint'), BigInt(values[i]));
      assert.strictEqual(getValueScaled<bigint>(unscaledValue, 'bigint', 1e8), BigInt(values[i]));
    });
  });
  it('throws on unsafe scaled number', function () {
    assert.throws(() => {
      getValueScaled(1.2, 'number', 1e16);
    });
  });
});
