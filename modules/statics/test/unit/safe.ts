import { SAFE_ROOT_SLOTS, SAFE_ROOT_SLOT_ORDINALS } from '../../src';

describe('SAFE_ROOT_SLOTS', function () {
  it('SAFE_ROOT_SLOT_ORDINALS should cover exactly the slots in SAFE_ROOT_SLOTS order', function () {
    SAFE_ROOT_SLOTS.should.deepEqual(Object.keys(SAFE_ROOT_SLOT_ORDINALS));
  });

  it('SAFE_ROOT_SLOT_ORDINALS should assign 1..4 in SAFE_ROOT_SLOTS order', function () {
    SAFE_ROOT_SLOTS.forEach((slot, i) => {
      SAFE_ROOT_SLOT_ORDINALS[slot].should.equal(i + 1);
    });
  });
});
