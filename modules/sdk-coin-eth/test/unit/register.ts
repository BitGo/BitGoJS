import sinon from 'sinon';
import assert from 'assert';
import { BitGoAPI } from '@bitgo/sdk-api';
import { GlobalCoinFactory } from '@bitgo/sdk-core';
import { coins, Erc20Coin } from '@bitgo/statics';
import { register, registerWithCoinMap } from '../../src/register';
import { Erc20Token } from '../../src/erc20Token';
import { Erc721Token } from '../../src/erc721Token';

describe('ETH Register', function () {
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
      assert.ok(registeredNames.includes('eth'));
      assert.ok(registeredNames.includes('gteth'));
      assert.ok(registeredNames.includes('teth'));
      assert.ok(registeredNames.includes('hteth'));

      // ERC20 and ERC721 tokens should be registered
      const erc20Count = Erc20Token.createTokenConstructors().length;
      const erc721Count = Erc721Token.createTokenConstructors().length;
      assert.strictEqual(registerSpy.callCount, 4 + erc20Count + erc721Count);
    });
  });

  describe('registerWithCoinMap', function () {
    it('should call register internally for base coins and tokens', function () {
      registerWithCoinMap(bitgo, coins);

      const registeredNames = registerSpy.getCalls().map((call) => call.args[0]);

      // Base coins should be registered via register()
      assert.ok(registeredNames.includes('eth'));
      assert.ok(registeredNames.includes('gteth'));
      assert.ok(registeredNames.includes('teth'));
      assert.ok(registeredNames.includes('hteth'));
    });

    it('should add dynamic ERC20 tokens to the global coin map', function () {
      registerWithCoinMap(bitgo, coins);

      // registerToken should have been called for dynamic tokens
      assert.ok(registerTokenSpy.callCount > 0);

      // Each call should pass a valid coin from the coinMap
      for (let i = 0; i < registerTokenSpy.callCount; i++) {
        const call = registerTokenSpy.getCall(i);
        const staticsCoin = call.args[0];
        assert.ok(coins.has(staticsCoin.name), `${staticsCoin.name} should exist in the coin map`);
      }
    });

    it('should not add tokens to the global coin map when coin map has no ERC20 tokens', function () {
      const limitedCoinMap = coins.filter((coin) => !(coin instanceof Erc20Coin));

      registerWithCoinMap(bitgo, limitedCoinMap);

      // registerToken should not be called since no ERC20 tokens are in the map
      assert.strictEqual(registerTokenSpy.callCount, 0);
    });
  });
});
