import sinon from 'sinon';
import assert from 'assert';
import { BitGoAPI } from '@bitgo/sdk-api';
import { GlobalCoinFactory } from '@bitgo/sdk-core';
import { coins, CantonToken } from '@bitgo/statics';
import { register, registerWithCoinMap } from '../../src/register';
import { CantonToken as SdkCantonToken } from '../../src/cantonToken';

describe('Canton Register', function () {
  let bitgo: BitGoAPI;
  let registerSpy: sinon.SinonSpy;
  let registerTokenSpy: sinon.SinonSpy;

  beforeEach(function () {
    bitgo = new BitGoAPI({ env: 'test' });
    registerSpy = sinon.spy(bitgo, 'register');
    registerTokenSpy = sinon.spy(GlobalCoinFactory, 'registerToken');
  });

  afterEach(function () {
    registerSpy.restore();
    registerTokenSpy.restore();
  });

  describe('register', function () {
    it('should register base coins and token constructors', function () {
      register(bitgo);

      const registeredNames = registerSpy.getCalls().map((call) => call.args[0]);

      // Base coins should be registered
      assert.ok(registeredNames.includes('canton'));
      assert.ok(registeredNames.includes('tcanton'));

      // Canton tokens from statics should be registered
      const cantonTokenCount = SdkCantonToken.createTokenConstructors().length;
      assert.strictEqual(registerSpy.callCount, 2 + cantonTokenCount);
    });
  });

  describe('registerWithCoinMap', function () {
    it('should call register internally for base coins and tokens', function () {
      registerWithCoinMap(bitgo, coins);

      const registeredNames = registerSpy.getCalls().map((call) => call.args[0]);

      // Base coins should be registered
      assert.ok(registeredNames.includes('canton'));
      assert.ok(registeredNames.includes('tcanton'));
    });

    it('should add dynamic Canton tokens to the global coin map', function () {
      registerWithCoinMap(bitgo, coins);

      // registerToken should have been called for Canton tokens in the coin map
      assert.ok(registerTokenSpy.callCount > 0);

      // Each call should pass a valid coin from the coinMap
      for (let i = 0; i < registerTokenSpy.callCount; i++) {
        const call = registerTokenSpy.getCall(i);
        const staticsCoin = call.args[0];
        assert.ok(coins.has(staticsCoin.name), `${staticsCoin.name} should exist in the coin map`);
      }
    });

    it('should not add tokens to the global coin map when coin map has no Canton tokens', function () {
      const limitedCoinMap = coins.filter((coin) => !(coin instanceof CantonToken));

      registerWithCoinMap(bitgo, limitedCoinMap);

      // registerToken should not be called since no Canton tokens are in the map
      assert.strictEqual(registerTokenSpy.callCount, 0);
    });
  });
});
