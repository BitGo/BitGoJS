import * as assert from 'assert';

import { getFixedOutputSum, getMaxOutput, getOutputSum, isMaxOutput, toFixedOutputs } from '../src';

describe('Output', function () {
  const oBigInt = { value: 1n };
  const oBigInt2 = { value: 2n };
  const oMax = { value: 'max' } as const;

  it('getMaxOutput returns expected values', function () {
    assert.strictEqual(getMaxOutput([oBigInt]), undefined);
    assert.strictEqual(getMaxOutput([oBigInt, oBigInt]), undefined);
    assert.strictEqual(getMaxOutput([oBigInt, oMax]), oMax);
    assert.throws(() => getMaxOutput([oMax, oMax]), /Multiple max outputs/);
  });

  it('isMaxOutput correctly identifies max outputs', function () {
    assert.strictEqual(isMaxOutput(oBigInt), false);
    assert.strictEqual(isMaxOutput(oMax), true);
  });

  it('getOutputSum calculates sum correctly', function () {
    assert.strictEqual(getOutputSum([]), 0n);
    assert.strictEqual(getOutputSum([oBigInt]), 1n);
    assert.strictEqual(getOutputSum([oBigInt, oBigInt2]), 3n);
  });

  it('getFixedOutputSum handles mixed outputs', function () {
    assert.strictEqual(getFixedOutputSum([]), 0n);
    assert.strictEqual(getFixedOutputSum([oBigInt]), 1n);
    assert.strictEqual(getFixedOutputSum([oBigInt, oMax]), 1n);
    assert.strictEqual(getFixedOutputSum([oBigInt, oBigInt2, oMax]), 3n);
  });

  it('toFixedOutputs converts max outputs correctly', function () {
    const maxAmount = 10n;
    assert.deepStrictEqual(toFixedOutputs([oBigInt], { maxAmount }), [oBigInt]);
    assert.deepStrictEqual(toFixedOutputs([oMax], { maxAmount }), [{ ...oMax, value: maxAmount }]);
    assert.throws(() => toFixedOutputs([oMax, oMax], { maxAmount }), /Multiple max outputs/);
  });
});
