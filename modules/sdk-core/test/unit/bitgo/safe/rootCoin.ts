import { SAFE_ROOT_SLOT_ORDINALS } from '@bitgo/statics';
import type { RootKeyType } from '@bitgo/public-types';
import { SAFE_ROOT_SLOTS } from '../../../../src/bitgo/safe/rootCoin';

describe('SAFE_ROOT_SLOTS', function () {
  it('should match the slot ordinals served from statics, in order', function () {
    // typed as Record<RootKeyType, number>, so a slot missing from statics is a compile error
    const ordinals: Record<RootKeyType, number> = SAFE_ROOT_SLOT_ORDINALS;
    SAFE_ROOT_SLOTS.map((slot) => ordinals[slot]).should.deepEqual(SAFE_ROOT_SLOTS.map((_, i) => i + 1));
    Object.keys(SAFE_ROOT_SLOT_ORDINALS).should.deepEqual(SAFE_ROOT_SLOTS);
  });
});
