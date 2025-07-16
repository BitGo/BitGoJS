import { BaseCoin } from '@bitgo/statics';
import sinon from 'sinon';
import should from 'should';
import { MessageBuilderFactory } from '../../../src';
import {
  BroadcastableMessage,
  IMessage,
  IMessageBuilder,
  MessageStandardType,
  SerializedSignature,
  SimpleMessageBuilder,
} from '@bitgo/sdk-core';

describe('Solana MessageBuilderFactory', function () {
  let sandbox: sinon.SinonSandbox;
  let factory: MessageBuilderFactory;
  const coinConfig = { name: 'tsol' } as BaseCoin;

  // Common test data
  const signatureBase64 = Buffer.from('signature1').toString('base64');
  const testBroadcastMessage: BroadcastableMessage = {
    type: MessageStandardType.SIMPLE,
    payload: 'test message',
    serializedSignatures: [
      {
        publicKey: 'pubkey1',
        signature: signatureBase64,
      },
    ],
    signers: ['signer1'],
    metadata: {},
  };

  const unsupportedMessageTypes = [
    MessageStandardType.UNKNOWN,
    MessageStandardType.EIP191,
    MessageStandardType.CIP8,
    'UNSUPPORTED' as MessageStandardType,
  ];

  // Helper functions
  const assertSimpleMessageBuilder = (builder: IMessageBuilder) => {
    should.exist(builder);
    builder.should.be.instanceof(SimpleMessageBuilder);
  };

  const assertBuilderMessageProperties = async (builder: IMessageBuilder, expectedPayload: string) => {
    const message = await builder.build();
    message.getType().should.equal(MessageStandardType.SIMPLE);
    message.getPayload()!.should.equal(expectedPayload);
    message.getSignatures().should.have.length(1);
    message.getSigners().should.have.length(1);
    message.getSigners()[0].should.equal('signer1');
    message.getMetadata()!.should.be.an.Object();
    return message;
  };

  const assertSignatureProperties = (message: IMessage) => {
    const signature = message.getSignatures()[0];
    signature.should.have.properties(['publicKey', 'signature']);
    signature.publicKey.pub.should.equal('pubkey1');
    signature.signature.toString('base64').should.equal(signatureBase64);
  };

  const assertBroadcastFormatProperties = async (
    message: IMessage,
    expectedSerializedSignatures?: SerializedSignature[]
  ) => {
    const rebroadcastMessage = await message.toBroadcastFormat();
    rebroadcastMessage.should.have.properties(['type', 'payload', 'serializedSignatures', 'signers', 'metadata']);
    rebroadcastMessage.type.should.equal(MessageStandardType.SIMPLE);
    rebroadcastMessage.payload.should.equal('test message');
    rebroadcastMessage.serializedSignatures?.should.deepEqual(expectedSerializedSignatures);
    rebroadcastMessage.signers?.should.deepEqual(['signer1']);
  };

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    factory = new MessageBuilderFactory(coinConfig);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('getMessageBuilder', function () {
    it('should return SimpleMessageBuilder for SIMPLE type', function () {
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      assertSimpleMessageBuilder(builder);
    });

    it('should throw error for unsupported message type', function () {
      unsupportedMessageTypes.forEach((type) => {
        should.throws(() => factory.getMessageBuilder(type), new RegExp(`Invalid message standard ${type}`));
      });
    });
  });

  describe('fromBroadcastFormat', function () {
    it('should get the correct builder type from broadcastable message', async function () {
      const builder = factory.fromBroadcastFormat(testBroadcastMessage);
      assertSimpleMessageBuilder(builder);

      const message = await assertBuilderMessageProperties(builder, 'test message');
      assertSignatureProperties(message);
      await assertBroadcastFormatProperties(message, testBroadcastMessage.serializedSignatures);
    });

    it('should throw for unsupported message type in broadcastable message', function () {
      const broadcastMessage = {
        ...testBroadcastMessage,
        type: MessageStandardType.EIP191,
      };

      should.throws(
        () => factory.fromBroadcastFormat(broadcastMessage),
        new RegExp(`Invalid message standard ${MessageStandardType.EIP191}`)
      );
    });
  });

  describe('fromBroadcastString', function () {
    it('should parse broadcastable string and return correct builder type', async function () {
      const broadcastString = JSON.stringify(testBroadcastMessage);
      const broadcastHex = Buffer.from(broadcastString).toString('hex');
      const builder = factory.fromBroadcastString(broadcastHex);

      assertSimpleMessageBuilder(builder);
      const message = await assertBuilderMessageProperties(builder, 'test message');
      assertSignatureProperties(message);
      await assertBroadcastFormatProperties(message, testBroadcastMessage.serializedSignatures);
    });

    it('should throw for invalid JSON string', function () {
      try {
        factory.fromBroadcastString('abcdefg'); // Invalid hex string
        fail('Expected error not thrown');
      } catch (error) {
        error.should.be.instanceof(SyntaxError);
      }
    });
  });
});
