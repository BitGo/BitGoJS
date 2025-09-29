import assert from 'assert';
import { concatBytes } from '../../../../src/tss/eddsa-dkls/util';

describe('EdDSA Utility Functions', function () {
  describe('concatBytes', function () {
    it('should concatenate Uint8Array arrays correctly', function () {
      const arr1 = new Uint8Array([1, 2, 3]);
      const arr2 = new Uint8Array([4, 5, 6]);
      const arr3 = new Uint8Array([7, 8, 9]);

      const result = concatBytes([arr1, arr2, arr3]);
      const expected = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      assert.deepStrictEqual(result, expected, 'concatBytes should concatenate arrays correctly');
    });
  });
});
