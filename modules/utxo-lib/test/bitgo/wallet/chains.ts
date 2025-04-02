import * as assert from 'assert';
import {
  ChainCode,
  chainCodes,
  getChainAndIndexFromPath,
  getExternalChainCode,
  getInternalChainCode,
  isChainCode,
  isExternalChainCode,
  isInternalChainCode,
  scriptTypeForChain,
  toChainPair,
} from '../../../src/bitgo';
import { scriptTypes2Of3 } from '../../../src/bitgo/outputScripts';

describe('chain codes', function () {
  it('map to scriptTypes and back', function () {
    chainCodes.forEach((c) => {
      assert.strict(isChainCode(c));
      assert.strict(!isChainCode(c + 2));
      assert.strict(toChainPair(c).includes(c));
      assert.throws(() => toChainPair((c + 2) as ChainCode));
    });

    assert.deepStrictEqual(
      chainCodes.map((c) => toChainPair(c)),
      [
        [0, 1],
        [0, 1],

        [10, 11],
        [10, 11],

        [20, 21],
        [20, 21],

        [30, 31],
        [30, 31],

        [40, 41],
        [40, 41],
      ]
    );

    scriptTypes2Of3.forEach((t) => {
      assert.strictEqual(t, scriptTypeForChain(getExternalChainCode(t)));
      assert.strictEqual(t, scriptTypeForChain(getInternalChainCode(t)));
    });

    assert.deepStrictEqual(
      chainCodes.map((c) => scriptTypeForChain(c)),
      ['p2sh', 'p2sh', 'p2shP2wsh', 'p2shP2wsh', 'p2wsh', 'p2wsh', 'p2tr', 'p2tr', 'p2trMusig2', 'p2trMusig2']
    );

    chainCodes.forEach((c) => {
      assert.strict(isExternalChainCode(c) || isInternalChainCode(c));
      assert.strictEqual(isExternalChainCode(c) && isInternalChainCode(c), false);
      assert.strictEqual(isExternalChainCode(c) ? getExternalChainCode(c) : getInternalChainCode(c), c);
    });
  });
});

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
