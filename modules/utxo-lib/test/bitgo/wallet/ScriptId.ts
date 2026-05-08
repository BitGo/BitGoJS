import * as assert from 'assert';

import { getScriptIdFromPath } from '../../../src/bitgo/wallet/ScriptId';

describe('getScriptId', function () {
  it('should throw if path is not the right length', function () {
    assert.throws(() => getScriptIdFromPath('/'), /invalid path/);
    assert.throws(() => getScriptIdFromPath('m0000ssss'), /invalid path/);
  });

  it('should throw if the path is not a number', function () {
    const invalidChain = [-1, 2, 'lol'];
    const invalidIndex = [-1, 'lol'];
    for (const chain of invalidChain) {
      assert.throws(() => getScriptIdFromPath(`m/${chain}/0`), /invalid chain/);
    }
    for (const index of invalidIndex) {
      assert.throws(() => getScriptIdFromPath(`m/0/${index}`), /invalid index/);
    }
  });

  it('should set the chain and index correctly', function () {
    assert.deepStrictEqual(getScriptIdFromPath('m/1/2'), { chain: 1, index: 2 });
    assert.deepStrictEqual(getScriptIdFromPath('m/1/2/3/4/5/10/20'), { chain: 10, index: 20 });
  });
});
