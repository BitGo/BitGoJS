import { SAFE_ROOT_SLOT_ORDINALS } from '../../src';

describe('SAFE_ROOT_SLOT_ORDINALS', function () {
  it('should assign the ordinals 1..4 in slot order', function () {
    Object.values(SAFE_ROOT_SLOT_ORDINALS).should.deepEqual([1, 2, 3, 4]);
  });
});
