import { canonicalizeObject } from '../../../../src/bitgo/lightning';
import assert from 'assert';

describe('canonicalizeObject', function () {
  it('should return the canonicalized object with sorted keys', function () {
    const input = { b: 1, a: 2 };
    const expected = { a: 2, b: 1 };
    const result = canonicalizeObject(input);
    assert.notDeepStrictEqual(JSON.stringify(input), JSON.stringify(expected));
    assert.deepStrictEqual(JSON.stringify(result), JSON.stringify(expected));
  });

  it('should handle nested objects and sort their keys', function () {
    const input = { b: { d: 4, c: 3 }, a: 2 };
    const expected = { a: 2, b: { c: 3, d: 4 } };
    const result = canonicalizeObject(input);
    assert.notDeepStrictEqual(JSON.stringify(input), JSON.stringify(expected));
    assert.deepStrictEqual(JSON.stringify(result), JSON.stringify(expected));
  });

  it('should handle arrays within objects', function () {
    const input = { b: [3, 2, 1], a: 2 };
    const expected = { a: 2, b: [3, 2, 1] };
    const result = canonicalizeObject(input);
    assert.notDeepStrictEqual(JSON.stringify(input), JSON.stringify(expected));
    assert.deepStrictEqual(JSON.stringify(result), JSON.stringify(expected));
  });

  it('should handle arrays of objects and sort their keys', function () {
    const input = [
      { b: 2, a: 1 },
      { d: 4, c: 3 },
    ];
    const expected = [
      { a: 1, b: 2 },
      { c: 3, d: 4 },
    ];
    const result = canonicalizeObject(input);
    assert.notDeepStrictEqual(JSON.stringify(input), JSON.stringify(expected));
    assert.deepStrictEqual(JSON.stringify(result), JSON.stringify(expected));
  });

  it('should return primitive values as is', function () {
    assert.strictEqual(JSON.stringify(canonicalizeObject(42)), JSON.stringify(42));
    assert.strictEqual(JSON.stringify(canonicalizeObject('string')), JSON.stringify('string'));
  });

  it('should throw an error for invalid object types', function () {
    assert.throws(() => canonicalizeObject(null as never), /Invalid object type/);
    assert.throws(() => canonicalizeObject(undefined as never), /Invalid object type/);
  });
});
