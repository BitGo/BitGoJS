import assert from 'assert';

import { getUtxoCoinScriptTypes2Of3 } from '../../../../src';
import * as utxolib from '@bitgo/utxo-lib';

describe('getUtxoCoinScriptTypes', function () {
  it('success', function () {
    const fn = (coin: string, arr: utxolib.bitgo.outputScripts.ScriptType2Of3[]) => {
      const scriptTypes = getUtxoCoinScriptTypes2Of3(coin);
      return arr.find((v) => scriptTypes.includes(v));
    };
    assert.ok(fn('btc', ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2']));
    assert.ok(fn('ltc', ['p2sh', 'p2shP2wsh', 'p2wsh']));
    assert.ok(fn('doge', ['p2sh']));
  });

  it('fail for invalid coin name', function () {
    assert.throws(
      () => getUtxoCoinScriptTypes2Of3('dummy'),
      (e: any) => e.message === `coin 'dummy' is not defined`
    );
  });

  it('fail for non-utxo coin name', function () {
    assert.throws(
      () => getUtxoCoinScriptTypes2Of3('eth'),
      (e: any) => e.message === 'coin eth is not a utxo coin'
    );
  });
});
