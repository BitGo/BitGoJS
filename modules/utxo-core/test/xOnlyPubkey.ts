import assert from 'assert';

import { toXOnlyPublicKey } from '../src';

describe('xOnlyPubkey', function () {
  it('converts to X-Only pubkey', function () {
    const buf32 = Buffer.alloc(32, 0);
    assert.deepStrictEqual(toXOnlyPublicKey(Buffer.concat([Buffer.from([0x02]), buf32])), buf32);
    assert.deepStrictEqual(toXOnlyPublicKey(Buffer.concat([Buffer.from([0x03]), buf32])), buf32);
    assert.deepStrictEqual(toXOnlyPublicKey(buf32), buf32);
    assert.throws(() => toXOnlyPublicKey(Buffer.concat([Buffer.from([0x04]), buf32])));
    assert.throws(() => toXOnlyPublicKey(Buffer.alloc(31)));
  });
});
