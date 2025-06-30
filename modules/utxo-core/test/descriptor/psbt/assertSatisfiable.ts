import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import * as WasmMiniscript from '@bitgo/wasm-miniscript';

import { getDefaultXPubs } from '../../../src/testutil/descriptor';
import { getRequiredLocktime } from '../../../src/descriptor';

utxolib.initializeMiniscript(WasmMiniscript);

function d(s: string): WasmMiniscript.Descriptor {
  return WasmMiniscript.Descriptor.fromString(s, 'derivable');
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
