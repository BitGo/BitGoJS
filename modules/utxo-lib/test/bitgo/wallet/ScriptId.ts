import * as assert from 'assert';

import { getChainAndIndexFromPath } from '../../../src/bitgo/wallet/ScriptId';

describe('getChainAndIndexFromPath', function () {
  it('should throw if path is not the right length', function () {
    assert.throws(() => getChainAndIndexFromPath('/'), /invalid path/);
    assert.throws(() => getChainAndIndexFromPath('m0000ssss'), /invalid path/);
  });

  it('should throw if the path is not a number', function () {
    const invalidChain = [-1, 2, 'lol'];
    const invalidIndex = [-1, 'lol'];
    for (const chain of invalidChain) {
      assert.throws(() => getChainAndIndexFromPath(`m/${chain}/0`), /invalid chain/);
    }
    for (const index of invalidIndex) {
      assert.throws(() => getChainAndIndexFromPath(`m/0/${index}`), /invalid index/);
    }
  });

  it('should set the chain and index correctly', function () {
    assert.deepStrictEqual(getChainAndIndexFromPath('m/1/2'), { chain: 1, index: 2 });
    assert.deepStrictEqual(getChainAndIndexFromPath('m/1/2/3/4/5/10/20'), { chain: 10, index: 20 });
  });
});
