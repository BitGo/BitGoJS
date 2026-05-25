import should from 'should';
import sinon from 'sinon';
import { BaseCoin } from '@bitgo/statics';
import { MessageStandardType } from '@bitgo/sdk-core';
import { Cip8MessageBuilder, MessageBuilderFactory } from '../../../src';

describe('MessageBuilderFactory', function () {
  let sandbox: sinon.SinonSandbox;
  let factory: MessageBuilderFactory;
  const coinConfig = { name: 'tada' } as BaseCoin;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    factory = new MessageBuilderFactory(coinConfig);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getMessageBuilder', function () {
    it('should return CIP8 message builder for CIP8 type', function () {
      const builder = factory.getMessageBuilder(MessageStandardType.CIP8);
      should.exist(builder);
      builder.should.be.instanceof(Cip8MessageBuilder);
    });

    it('should throw error for unsupported message type', function () {
      const unsupportedTypes = ['UNSUPPORTED' as MessageStandardType];

      unsupportedTypes.forEach((type) => {
        should.throws(() => factory.getMessageBuilder(type), /Invalid message standard UNSUPPORTED/);
      });
    });
  });
});
