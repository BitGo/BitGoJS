import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin } from '../../../../../src/abstractUtxoCoin';
import { Pearl, Tpearl } from '../../../../../src/impl/pearl';

describe('Pearl', function () {
  let bitgo: TestBitGoAPI;

  /** `bitgo.coin()` is typed as BaseCoin; these are registered as AbstractUtxoCoin */
  function getCoin(coinName: 'pearl' | 'tpearl'): AbstractUtxoCoin {
    return bitgo.coin(coinName) as unknown as AbstractUtxoCoin;
  }

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('pearl', Pearl.createInstance);
    bitgo.safeRegister('tpearl', Tpearl.createInstance);
  });

  it('should instantiate the coin', function () {
    assert.ok(bitgo.coin('pearl') instanceof Pearl);
    assert.ok(bitgo.coin('tpearl') instanceof Tpearl);
  });

  it('should return the chain', function () {
    assert.strictEqual(bitgo.coin('pearl').getChain(), 'pearl');
    assert.strictEqual(bitgo.coin('tpearl').getChain(), 'tpearl');
  });

  it('should return full name', function () {
    assert.strictEqual(bitgo.coin('pearl').getFullName(), 'Pearl');
    assert.strictEqual(bitgo.coin('tpearl').getFullName(), 'Testnet Pearl');
  });

  it('should have tpearl as the testnet variant of pearl', function () {
    assert.ok(bitgo.coin('tpearl') instanceof Pearl);
  });

  /**
   * Pearl is taproot-only. This is not enforced by an override here - it comes from
   * `supportsAddressType` delegating to wasm-utxo, which reports only the taproot
   * script types for this coin. Pinned so a regression in either layer is caught.
   */
  it('should support only the taproot script types', function () {
    for (const coinName of ['pearl', 'tpearl'] as const) {
      const coin = getCoin(coinName);
      assert.strictEqual(coin.supportsAddressType('p2tr'), true);
      assert.strictEqual(coin.supportsAddressType('p2trMusig2'), true);
      assert.strictEqual(coin.supportsAddressType('p2sh'), false);
      assert.strictEqual(coin.supportsAddressType('p2shP2wsh'), false);
      assert.strictEqual(coin.supportsAddressType('p2wsh'), false);
    }
  });

  it('should support only the taproot address chains', function () {
    for (const coinName of ['pearl', 'tpearl'] as const) {
      const coin = getCoin(coinName);
      // 30/31 = p2tr, 40/41 = p2trMusig2
      for (const chain of [30, 31, 40, 41]) {
        assert.strictEqual(coin.supportsAddressChain(chain), true, `chain ${chain} should be supported`);
      }
      // 0/1 = p2sh, 10/11 = p2shP2wsh, 20/21 = p2wsh
      for (const chain of [0, 1, 10, 11, 20, 21]) {
        assert.strictEqual(coin.supportsAddressChain(chain), false, `chain ${chain} should not be supported`);
      }
    }
  });

  /**
   * Pearl is served through @bitgo/wasm-utxo and is deliberately absent from
   * @bitgo/utxo-lib. No other checked-in coin has this profile, so it cannot be
   * inferred from an existing coin - assert it explicitly.
   */
  it('should have no utxo-lib network registration', function () {
    assert.ok(!('pearl' in utxolib.networks));
    assert.ok(!('tpearl' in utxolib.networks));
  });
});
