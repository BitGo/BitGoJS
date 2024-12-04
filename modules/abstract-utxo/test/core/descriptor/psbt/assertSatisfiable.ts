import * as assert from 'assert';

import { Descriptor } from '@bitgo/wasm-miniscript';

import { getDefaultXPubs } from '../descriptor.utils';
import { getRequiredLocktime } from '../../../../src/core/descriptor/psbt/assertSatisfiable';

function d(s: string): Descriptor {
  return Descriptor.fromString(s, 'derivable');
}

describe('assertSatisfiable', function () {
  describe('getRequiredLocktime', function () {
    const xpubs = getDefaultXPubs();
    it('has expected result', function () {
      // OP_DROP
      assert.strictEqual(getRequiredLocktime(d(`wsh(and_v(r:after(100),pk(${xpubs[0]})))`)), 100);
      // OP_VERIFY
      assert.strictEqual(getRequiredLocktime(d(`wsh(and_v(v:after(100),pk(${xpubs[0]})))`)), 100);
      // no locktime at all
      assert.strictEqual(getRequiredLocktime(d(`wsh(pk(${xpubs[0]}))`)), undefined);
    });
  });
});
