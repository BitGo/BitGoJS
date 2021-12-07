import * as assert from 'assert';
import {
  chainCodes,
  getChainExternal,
  getChainInternal,
  isChainCode,
  isChainExternal,
  isChainInternal,
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
      assert.throws(() => toChainPair(c + 2));
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
      ]
    );

    scriptTypes2Of3.forEach((t) => {
      assert.strictEqual(t, scriptTypeForChain(getChainExternal(t)));
      assert.strictEqual(t, scriptTypeForChain(getChainInternal(t)));
    });

    assert.deepStrictEqual(
      chainCodes.map((c) => scriptTypeForChain(c)),
      ['p2sh', 'p2sh', 'p2shP2wsh', 'p2shP2wsh', 'p2wsh', 'p2wsh', 'p2tr', 'p2tr']
    );

    chainCodes.forEach((c) => {
      assert.strict(isChainExternal(c) || isChainInternal(c));
      assert.strictEqual(isChainExternal(c) && isChainInternal(c), false);
      assert.strictEqual(isChainExternal(c) ? getChainExternal(c) : getChainInternal(c), c);
    });
  });
});
