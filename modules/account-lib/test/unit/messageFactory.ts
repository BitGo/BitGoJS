import assert from 'assert';
import should from 'should';
import sinon from 'sinon';
import { getMessageBuilderFactory, registerMessageBuilderFactory } from '../../src';
import { BaseMessageBuilderFactory, BuildMessageError } from '@bitgo-beta/sdk-core';
import { coins, BaseCoin } from '@bitgo-beta/statics';
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
