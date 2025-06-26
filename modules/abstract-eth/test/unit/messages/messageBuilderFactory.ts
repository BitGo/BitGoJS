import 'should';
import sinon from 'sinon';
import { MessageStandardType } from '@bitgo/sdk-core';
import { fixtures } from './fixtures';
import { Eip191MessageBuilder, MessageBuilderFactory } from '../../../src';

describe('Message Builder Factory', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('getMessageBuilder', () => {
    it('should return the correct builder for EIP191 message type', () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);

      builder.should.be.instanceof(Eip191MessageBuilder);
    });

    it('should throw an error for unsupported message types', () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      // Test with an invalid/unsupported message type
      const unsupportedType = 'UNSUPPORTED_TYPE' as MessageStandardType;

      (() => factory.getMessageBuilder(unsupportedType)).should.throw(/Invalid message standard/);
    });

    it('should throw for unknown message standard', () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      (() => factory.getMessageBuilder(MessageStandardType.UNKNOWN)).should.throw(
        `Invalid message standard ${MessageStandardType.UNKNOWN}`
      );
    });
  });

  describe('Integration with builder', () => {
    it('should create a builder that can build a valid message', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload(fixtures.messages.validMessage);

      const message = await builder.build();

      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
    });
  });
});
