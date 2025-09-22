import 'should';
import sinon from 'sinon';
import { MessageStandardType } from '@bitgo-beta/sdk-core';
import { fixtures } from './fixtures';
import { MessageBuilderFactory } from '../../../src';
import { Eip191MessageBuilder } from '@bitgo-beta/abstract-eth';

describe('BSC Message Builder Factory', () => {
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

    it('should create builder with BSC coin configuration', () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);

      // Verify the builder was created with BSC coin config
      builder.should.be.instanceof(Eip191MessageBuilder);
      // The coin configuration should be passed to the builder
      fixtures.coin.name.should.equal('tbsc');
    });
  });

  describe('Integration with EIP191 builder', () => {
    it('should create a builder that can build a valid BSC EIP191 message', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload(fixtures.messages.validMessage);

      const message = await builder.build();

      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
    });

    it('should work with BSC-specific metadata', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload(fixtures.messages.validMessage);
      builder.setMetadata(fixtures.eip191.metadata);

      const message = await builder.build();

      message.getMetadata()!.should.have.property('customData', 'BSC test data');
      message.getMetadata()!.should.have.property('network', 'bsc');
      message.getMetadata()!.should.have.property('encoding', 'utf8');
    });

    it('should handle empty messages on BSC', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload(fixtures.messages.emptyMessage);

      // Empty messages should throw an error since they're not valid for EIP-191
      await builder.build().should.be.rejectedWith('Message payload must be set before building the message');
    });

    it('should handle special characters in BSC messages', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload(fixtures.messages.specialCharsMessage);

      const message = await builder.build();

      message.getPayload().should.equal(fixtures.messages.specialCharsMessage);
    });

    it('should handle long messages on BSC', async () => {
      const factory = new MessageBuilderFactory(fixtures.coin);

      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      builder.setPayload(fixtures.messages.longMessage);

      const message = await builder.build();

      message.getPayload().should.equal(fixtures.messages.longMessage);
    });
  });
});
