import assert from 'assert';

import { getUtxoCoinScriptTypes2Of3, getUtxoCoinScriptTypesForWalletType } from '../../../../src';
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

  it('fail with an actionable message for wasm-only coins', function () {
    // pearl is served through @bitgo/wasm-utxo and has no utxo-lib network, so its
    // utxolibName does not resolve here. Assert the guidance rather than letting it
    // fall through to a bare `TypeError: invalid network`.
    for (const coinName of ['pearl', 'tpearl']) {
      assert.throws(
        () => getUtxoCoinScriptTypes2Of3(coinName),
        (e: any) => /has no utxo-lib network/.test(e.message) && /@bitgo\/wasm-utxo/.test(e.message)
      );
    }
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

describe('getUtxoCoinScriptTypesForWalletType', function () {
  it('success', function () {
    const fn = (coin: string, walletType: 'hot' | 'cold', arr: utxolib.bitgo.outputScripts.ScriptType2Of3[]) => {
      const scriptTypes = getUtxoCoinScriptTypesForWalletType(coin, walletType);
      return arr.find((v) => scriptTypes.includes(v));
    };
    assert.ok(fn('btc', 'hot', ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr', 'p2trMusig2']));
    assert.ok(fn('btc', 'cold', ['p2sh', 'p2shP2wsh', 'p2wsh', 'p2tr']));
    assert.ok(fn('ltc', 'hot', ['p2sh', 'p2shP2wsh', 'p2wsh']));
    assert.ok(fn('ltc', 'cold', ['p2sh', 'p2shP2wsh', 'p2wsh']));
    assert.ok(fn('doge', 'hot', ['p2sh']));
    assert.ok(fn('doge', 'cold', ['p2sh']));
  });

  it('applies the wallet-type rule for p2trMusig2', function () {
    // p2trMusig2 is hot-only on mainnet; cold is allowed on testnet
    assert.ok(getUtxoCoinScriptTypesForWalletType('btc', 'hot').includes('p2trMusig2'));
    assert.ok(!getUtxoCoinScriptTypesForWalletType('btc', 'cold').includes('p2trMusig2'));
    assert.ok(getUtxoCoinScriptTypesForWalletType('tbtc', 'cold').includes('p2trMusig2'));
  });

  it('fail with an actionable message for wasm-only coins', function () {
    for (const coinName of ['pearl', 'tpearl']) {
      for (const walletType of ['hot', 'cold'] as const) {
        assert.throws(
          () => getUtxoCoinScriptTypesForWalletType(coinName, walletType),
          (e: any) => /has no utxo-lib network/.test(e.message) && /@bitgo\/wasm-utxo/.test(e.message)
        );
      }
    }
  });

  it('fail for invalid coin name', function () {
    assert.throws(
      () => getUtxoCoinScriptTypesForWalletType('dummy', 'hot'),
      (e: any) => e.message === `coin 'dummy' is not defined`
    );
  });

  it('fail for non-utxo coin name', function () {
    assert.throws(
      () => getUtxoCoinScriptTypesForWalletType('eth', 'hot'),
      (e: any) => e.message === 'coin eth is not a utxo coin'
    );
  });
});
