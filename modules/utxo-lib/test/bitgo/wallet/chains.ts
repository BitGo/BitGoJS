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
    assert.throws(() => getChainAndIndexFromPath('m/0/ssss'), /Could not parse chain and index into numbers from path/);
    assert.throws(
      () => getChainAndIndexFromPath('//d/dd/d/d/dd/dd'),
      /Could not parse chain and index into numbers from path/
    );
  });

  it('should throw if chain or index is negative', function () {
    assert.throws(() => getChainAndIndexFromPath('m/-1/0'), /chain and index must be non-negative/);
    assert.throws(() => getChainAndIndexFromPath('m/0/-1'), /chain and index must be non-negative/);
  });

  it('should set the chain and index correctly', function () {
    assert.deepStrictEqual(getChainAndIndexFromPath('m/1/2'), { chain: 1, index: 2 });
    assert.deepStrictEqual(getChainAndIndexFromPath('m/4/3/2'), { chain: 3, index: 2 });
  });
});
