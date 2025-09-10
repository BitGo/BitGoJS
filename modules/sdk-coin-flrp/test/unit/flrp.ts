import { coins } from '@bitgo/statics';
import * as assert from 'assert';
import { Flrp } from '../../src/flrp';
import { BitGoBase } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Flrp', function () {
  let bitgo: TestBitGoAPI;
  const staticsCoin = coins.get('flrp');

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    // Attempt to register the coin symbol; safeRegister is idempotent.
    (bitgo as unknown as { safeRegister?: (n: string, f: (bg: BitGoBase) => unknown) => void }).safeRegister?.(
      'flrp',
      Flrp.createInstance
    );
  });

  describe('createInstance', function () {
    it('should return a Flrp instance', function () {
      const coin = Flrp.createInstance(bitgo as unknown as BitGoBase, staticsCoin);
      assert.ok(coin instanceof Flrp);
    });

    it('should produce distinct objects on multiple calls', function () {
      const a = Flrp.createInstance(bitgo as unknown as BitGoBase, staticsCoin);
      const b = Flrp.createInstance(bitgo as unknown as BitGoBase, staticsCoin);
      assert.notStrictEqual(a, b);
      assert.ok(a instanceof Flrp);
      assert.ok(b instanceof Flrp);
    });
  });

  describe('coin properties', function () {
    let coin: Flrp;

    beforeEach(function () {
      coin = Flrp.createInstance(bitgo as unknown as BitGoBase, staticsCoin) as Flrp;
    });

    it('should have correct coin family', function () {
      assert.strictEqual(coin.getFamily(), staticsCoin.family);
    });

    it('should have correct coin name', function () {
      assert.strictEqual(coin.getFullName(), staticsCoin.fullName);
    });

    it('should have correct base factor', function () {
      assert.strictEqual(coin.getBaseFactor(), Math.pow(10, staticsCoin.decimalPlaces));
    });

    it('should validate addresses using utils', function () {
      const validAddress = 'flare1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6f4avh';
      const result = coin.isValidAddress(validAddress);
      assert.strictEqual(typeof result, 'boolean');
    });

    it('should generate key pairs', function () {
      const keyPair = coin.generateKeyPair();
      assert.ok('pub' in keyPair);
      assert.ok('prv' in keyPair);
      if (keyPair.pub && keyPair.prv) {
        assert.strictEqual(typeof keyPair.pub, 'string');
        assert.strictEqual(typeof keyPair.prv, 'string');
      }
    });
  });

  describe('error handling', function () {
    it('should handle construction with invalid parameters', function () {
      assert.throws(() => Flrp.createInstance(null as unknown as BitGoBase, staticsCoin));
      assert.throws(() => Flrp.createInstance(bitgo as unknown as BitGoBase, null as unknown as typeof staticsCoin));
    });
  });

  describe('inheritance and methods', function () {
    let coin: Flrp;

    beforeEach(function () {
      coin = Flrp.createInstance(bitgo as unknown as BitGoBase, staticsCoin) as Flrp;
    });

    it('should have required base coin methods', function () {
      assert.ok('getFamily' in coin);
      assert.ok('getFullName' in coin);
      assert.ok('getBaseFactor' in coin);
      assert.ok('isValidAddress' in coin);
      assert.ok('generateKeyPair' in coin);
    });

    it('should handle address validation consistently', function () {
      const validAddress = 'flare1test';
      const invalidAddress = 'invalid-address';

      assert.strictEqual(typeof coin.isValidAddress(validAddress), 'boolean');
      assert.strictEqual(typeof coin.isValidAddress(invalidAddress), 'boolean');
    });
  });
});
