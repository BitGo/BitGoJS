import { BaseCoin } from '@bitgo/statics';
import sinon from 'sinon';
import should from 'should';
import { BroadcastableMessage, MessageStandardType } from '../../../../../src';
import { TestMessageBuilderFactory } from './fixtures';

describe('Base Message Builder Factory', () => {
  let factory: TestMessageBuilderFactory;
  let mockCoinConfig: sinon.SinonStubbedInstance<BaseCoin>;

  beforeEach(() => {
    mockCoinConfig = sinon.createStubInstance(BaseCoin);
    factory = new TestMessageBuilderFactory(mockCoinConfig as unknown as BaseCoin);
  });

  describe('getMessageBuilder', () => {
    it('should create a message builder for EIP191 type', () => {
      const builder = factory.getMessageBuilder(MessageStandardType.EIP191);
      should.exist(builder);
      should.equal(builder.getType(), MessageStandardType.EIP191);
    });

    it('should create a message builder for UNKNOWN type', () => {
      const builder = factory.getMessageBuilder(MessageStandardType.UNKNOWN);
      should.exist(builder);
      should.equal(builder.getType(), MessageStandardType.UNKNOWN);
    });
  });

  describe('fromBroadcastFormat', () => {
    it('should create a builder from a broadcast message', () => {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: 'hello world',
        serializedSignatures: [
          {
            publicKey: 'pub1',
            signature: 'sig1',
          },
        ],
        signers: ['addr1'],
        metadata: { version: '1.0' },
      };

      const builder = factory.fromBroadcastFormat(broadcastMessage);
      should.exist(builder);
      // Since the TestMessageBuilder always returns the same type that was passed to constructor
      should.equal(builder.getType(), MessageStandardType.EIP191);
    });
  });

  describe('fromBroadcastString', () => {
    it('should parse a broadcast message string and create the appropriate builder', () => {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: 'test message',
        serializedSignatures: [
          {
            publicKey: 'pub1',
            signature: 'sig1',
          },
          {
            publicKey: 'pub2',
            signature: 'sig2',
          },
        ],
        signers: ['addr1', 'addr2'],
        metadata: { chainId: 1 },
      };

      const broadcastString = JSON.stringify(broadcastMessage);
      const builder = factory.fromBroadcastString(broadcastString);

      should.exist(builder);
      // Since the TestMessageBuilder always returns the same type that was passed to constructor
      should.equal(builder.getType(), MessageStandardType.EIP191);
    });

    it('should handle broadcast messages with different types', () => {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.UNKNOWN,
        payload: 'unknown message',
        serializedSignatures: [
          {
            publicKey: 'pub1',
            signature: 'sig1',
          },
        ],
        signers: ['addr1'],
      };

      const broadcastString = JSON.stringify(broadcastMessage);
      const builder = factory.fromBroadcastString(broadcastString);

      should.exist(builder);
      should.equal(builder.getType(), MessageStandardType.UNKNOWN);
    });

    it('should handle broadcast messages without optional fields', () => {
      const broadcastMessage = {
        type: MessageStandardType.EIP191,
        payload: 'minimal message',
        signatures: [],
        signers: [],
      };

      const broadcastString = JSON.stringify(broadcastMessage);
      const builder = factory.fromBroadcastString(broadcastString);

      should.exist(builder);
      should.equal(builder.getType(), MessageStandardType.EIP191);
    });
  });
});
