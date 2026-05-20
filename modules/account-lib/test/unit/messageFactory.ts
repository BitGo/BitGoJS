import assert from 'assert';
import should from 'should';
import sinon from 'sinon';
import { getMessageBuilderFactory, registerMessageBuilderFactory } from '../../src';
import { BaseMessageBuilderFactory, BuildMessageError } from '@bitgo/sdk-core';
import { coins, BaseCoin, CoinFeature } from '@bitgo/statics';
import { MockMessageBuilderFactory } from './fixtures';

describe('Message Builder Factory', () => {
  describe('getMessageBuilderFactory', () => {
    it('should fail to instantiate an unsupported coin', () => {
      assert.throws(
        () => getMessageBuilderFactory('fakeUnsupported'),
        (e: Error) => {
          return (
            e instanceof BuildMessageError &&
            e.message === 'Message builder factory for coin fakeUnsupported not supported'
          );
        },
      );
    });

    it('should succeed for supported coins', () => {
      const ethFactory = getMessageBuilderFactory('eth');
      should.exist(ethFactory);
      ethFactory.should.be.instanceof(BaseMessageBuilderFactory);

      // Verify hteth is also supported
      const htethFactory = getMessageBuilderFactory('hteth');
      should.exist(htethFactory);
      htethFactory.should.be.instanceof(BaseMessageBuilderFactory);
    });

    it('should auto-register all non-token coins with SHARED_EVM_MESSAGE_SIGNING feature', () => {
      const evmCoins = coins.reduce<string[]>((acc, coin) => {
        if (coin.features.includes(CoinFeature.SHARED_EVM_MESSAGE_SIGNING) && !coin.isToken) {
          acc.push(coin.name);
        }
        return acc;
      }, []);
      evmCoins.length.should.be.greaterThan(0);

      for (const coinName of evmCoins) {
        const factory = getMessageBuilderFactory(coinName);
        should.exist(factory, `Expected message builder factory for ${coinName}`);
        factory.should.be.instanceof(BaseMessageBuilderFactory);
      }
    });

    it('should not register token coins with SHARED_EVM_MESSAGE_SIGNING feature', () => {
      const evmTokens = coins.reduce<string[]>((acc, coin) => {
        if (coin.features.includes(CoinFeature.SHARED_EVM_MESSAGE_SIGNING) && coin.isToken) {
          acc.push(coin.name);
        }
        return acc;
      }, []);
      evmTokens.length.should.be.greaterThan(0);

      for (const tokenName of evmTokens) {
        assert.throws(
          () => getMessageBuilderFactory(tokenName),
          (e: Error) => e instanceof BuildMessageError,
          `Token ${tokenName} should not have a message builder factory`,
        );
      }
    });
  });

  describe('registerMessageBuilderFactory', () => {
    // Mock message builder that implements required abstract methods

    it('should register a new message builder factory', () => {
      const coinName = 'fakeTestCoin';
      const mockCoin = sinon.createStubInstance(BaseCoin);
      sinon
        .stub(coins, 'get')
        .withArgs(coinName)
        .returns(mockCoin as unknown as BaseCoin);

      const factory = registerMessageBuilderFactory(coinName, MockMessageBuilderFactory);
      should.exist(factory);
      factory.should.be.instanceof(MockMessageBuilderFactory);

      // Verify we can get it back
      const retrievedFactory = getMessageBuilderFactory(coinName);
      should.exist(retrievedFactory);
      retrievedFactory.should.be.instanceof(MockMessageBuilderFactory);

      // Restore the stub
      sinon.restore();
    });
  });
});
