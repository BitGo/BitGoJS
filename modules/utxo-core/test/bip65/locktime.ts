import assert from 'assert';

import { encodeLocktime } from '../../src/bip65/locktime';

describe('locktime', function () {
  it('encodes relative and absolute locktimes', function () {
    assert.strictEqual(encodeLocktime({ blocks: 1 }), 1);
    assert.strictEqual(encodeLocktime({ blocks: 500_000_000 - 1 }), 500_000_000 - 1);
    assert.strictEqual(encodeLocktime(new Date('1985-11-05T00:53:20Z')), 500_000_000);
    assert.strictEqual(encodeLocktime(new Date('2033-05-18T03:33:20.000Z')), 2_000_000_000);
    assert.throws(() => {
      encodeLocktime({ blocks: 500_000_000 });
    });
    assert.throws(() => {
      encodeLocktime(new Date('1985-11-05T00:53:19Z'));
    });
  });
});
