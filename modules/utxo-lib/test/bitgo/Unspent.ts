import assert = require('assert');
import { unspentSum } from '../../src/bitgo';

function mockUnspent<TNumber extends number | bigint>(value: TNumber) {
  return { value };
}
describe('unspentSum', function () {
  const unspents = [mockUnspent(123), mockUnspent(98765)];
  const bigUnspents = [mockUnspent(Number.MAX_SAFE_INTEGER)];
  const unspentsBig = [mockUnspent(BigInt(123)), mockUnspent(BigInt(98765))];
  it('sums number', function () {
    assert.strictEqual(unspentSum(unspents, 'number'), 123 + 98765);
  });
  it('sums bigint', function () {
    assert.strictEqual(unspentSum(unspentsBig, 'bigint'), BigInt(123 + 98765));
  });
  it('sums zero', function () {
    assert.strictEqual(unspentSum([], 'number'), 0);
    assert.strictEqual(unspentSum([], 'number'), 0);
  });
  it('throws on mixing number and bigint', function () {
    assert.throws(() => {
      unspentSum((unspentsBig as unknown as { value: number }[]).concat(unspents), 'number');
    });
    assert.throws(() => {
      unspentSum((unspents as unknown as { value: bigint }[]).concat(unspentsBig), 'bigint');
    });
  });
  it('throws on unsafe integer number', function () {
    assert.throws(() => {
      unspentSum(bigUnspents.concat(unspents), 'number');
    });
  });
  it('throws on mismatch between unspent and amountType', function () {
    assert.throws(() => {
      unspentSum(unspents, 'bigint');
    });
    assert.throws(() => {
      unspentSum(unspentsBig, 'number');
    });
  });
});
