import { BaseCoin } from '@bitgo/statics';
import sinon from 'sinon';
import should from 'should';
import { BroadcastableMessage, MessageStandardType, SimpleMessage } from '@bitgo/sdk-core';
import { MessageBuilderFactory } from '../../../src';

describe('Solana SimpleMessageBuilder', function () {
  let sandbox: sinon.SinonSandbox;
  let factory: MessageBuilderFactory;
  const coinConfig = { name: 'tsol' } as BaseCoin;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    factory = new MessageBuilderFactory(coinConfig);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('build', function () {
    it('should build a SimpleMessage with correct payload', async function () {
      const payload = 'Hello, Solana!';
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload);

      const message = await builder.build();
      should.exist(message);
      message.should.be.instanceof(SimpleMessage);
      should.equal(message.getType(), MessageStandardType.SIMPLE);
      should.equal(message.getPayload(), payload);
    });

    it('should build a SimpleMessage with signatures', async function () {
      const payload = 'Sign this message';
      const signatures = [
        {
          publicKey: { pub: 'solPubKey1' },
          signature: Buffer.from('solSignature1'),
        },
      ];

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setSignatures(signatures);

      const message = await builder.build();
      should.exist(message);
      should.equal(message.getPayload(), payload);
      should.deepEqual(message.getSignatures(), signatures);
    });

    it('should build a SimpleMessage with signers', async function () {
      const payload = 'Message with signers';
      const signers = ['solSigner1', 'solSigner2'];

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setSigners(signers);

      const message = await builder.build();
      should.exist(message);
      should.equal(message.getPayload(), payload);
      should.deepEqual(message.getSigners(), signers);
    });

    it('should build a SimpleMessage with metadata', async function () {
      const payload = 'Message with metadata';
      const metadata = { solNetwork: 'testnet', timestamp: 1625097600 };

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setMetadata(metadata);

      const message = await builder.build();
      should.exist(message);
      should.equal(message.getPayload(), payload);
      const messageMetadata = message.getMetadata();
      should.equal(messageMetadata?.solNetwork, metadata.solNetwork);
      should.equal(messageMetadata?.timestamp, metadata.timestamp);
    });

    it('should throw error when building without payload', async function () {
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      await should(builder.build()).be.rejectedWith('Message payload must be set before building the message');
    });
  });

  describe('getSignablePayload', function () {
    it('should return Buffer with correct payload', async function () {
      const payload = 'Signable Solana message';
      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload);

      const message = await builder.build();
      const signablePayload = await message.getSignablePayload();

      should.exist(signablePayload);
      Buffer.isBuffer(signablePayload).should.be.true();
      signablePayload.toString().should.equal(payload);
    });
  });

  describe('toBroadcastFormat', function () {
    it('should convert SimpleMessage to broadcastable format', async function () {
      const payload = 'Broadcast me';
      const signers = ['solAddress1'];
      const signatures = [
        {
          publicKey: { pub: 'solPubKey1' },
          signature: Buffer.from('solSignature1'),
        },
      ];

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      builder.setPayload(payload).setSigners(signers).setSignatures(signatures);

      const message = await builder.build();
      const broadcastFormat = await message.toBroadcastFormat();

      should.exist(broadcastFormat);
      should.equal(broadcastFormat.type, MessageStandardType.SIMPLE);
      should.equal(broadcastFormat.payload, payload);
      should.deepEqual(broadcastFormat.signers, signers);
      should.exist(broadcastFormat.serializedSignatures);
      const serializedSignatures = broadcastFormat.serializedSignatures;
      should.equal(serializedSignatures?.length, 1);
      should.equal(serializedSignatures?.[0].publicKey, 'solPubKey1');
      should.equal(serializedSignatures?.[0].signature, Buffer.from('solSignature1').toString('base64'));
    });
  });

  describe('fromBroadcastFormat', function () {
    it('should rebuild message from broadcastable format', async function () {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.SIMPLE,
        payload: 'Solana test message',
        serializedSignatures: [
          {
            publicKey: 'solPubKey1',
            signature: Buffer.from('solSignature1').toString('base64'),
          },
        ],
        signers: ['solSigner1'],
        metadata: { network: 'testnet', encoding: 'utf8' },
      };

      const builder = factory.getMessageBuilder(MessageStandardType.SIMPLE);
      const message = await builder.fromBroadcastFormat(broadcastMessage);

      should.exist(message);
      should.equal(message.getType(), MessageStandardType.SIMPLE);
      should.equal(message.getPayload(), broadcastMessage.payload);
      should.deepEqual(message.getSigners(), broadcastMessage.signers);
      should.exist(message.getSignatures());
      should.equal(message.getSignatures().length, 1);
    });
  });
});
