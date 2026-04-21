import sinon from 'sinon';
import assert from 'assert';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins, Erc20Coin } from '@bitgo/statics';
import { register, registerWithCoinMap } from '../../src/register';
import { Erc20Token } from '../../src/erc20Token';
import { Erc721Token } from '../../src/erc721Token';

describe('ETH Register', function () {
  let bitgo: BitGoAPI;
  let registerSpy: sinon.SinonSpy;
  let registerWithBaseCoinSpy: sinon.SinonSpy;

  beforeEach(function () {
    bitgo = new BitGoAPI({ env: 'test' });
    registerSpy = sinon.spy(bitgo, 'register');
    registerWithBaseCoinSpy = sinon.spy(bitgo, 'registerWithBaseCoin');
  });

  afterEach(function () {
    registerSpy.restore();
    registerWithBaseCoinSpy.restore();
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

    it('should register dynamic ERC20 tokens via registerWithBaseCoin', function () {
      registerWithCoinMap(bitgo, coins);

      // registerWithBaseCoin should have been called for dynamic tokens
      assert.ok(registerWithBaseCoinSpy.callCount > 0);

      // Each call should pass a valid baseCoin from the coinMap
      for (let i = 0; i < registerWithBaseCoinSpy.callCount; i++) {
        const call = registerWithBaseCoinSpy.getCall(i);
        const baseCoin = call.args[1];
        assert.ok(coins.has(baseCoin.name), `${baseCoin.name} should exist in the coin map`);
      }
    });

    it('should not call registerWithBaseCoin when coin map has no ERC20 tokens', function () {
      // Create a coin map with only base coins (no ERC20 tokens)
      const limitedCoinMap = coins.filter((coin) => !(coin instanceof Erc20Coin));

      registerWithCoinMap(bitgo, limitedCoinMap);

      // registerWithBaseCoin should not be called since no ERC20 tokens are in the map
      assert.strictEqual(registerWithBaseCoinSpy.callCount, 0);
    });
  });
});
