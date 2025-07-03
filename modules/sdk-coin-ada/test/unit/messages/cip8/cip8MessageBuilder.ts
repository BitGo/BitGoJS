import should from 'should';
import sinon from 'sinon';
import { Buffer } from 'buffer';
import { BroadcastableMessage, MessageStandardType, serializeSignatures, Signature } from '@bitgo/sdk-core';
import { BaseCoin } from '@bitgo/statics';
import { cip8TestResources } from '../../../resources/cip8Resources';
import { Cip8Message, Cip8MessageBuilder } from '../../../../src';

describe('Cip8MessageBuilder', function () {
  let sandbox: sinon.SinonSandbox;
  let builder: Cip8MessageBuilder;
  const coinConfig = { name: 'tada' } as BaseCoin;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    builder = new Cip8MessageBuilder(coinConfig);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('constructor', function () {
    it('should create a builder with correct message type', function () {
      const builder = new Cip8MessageBuilder(coinConfig);
      should.exist(builder);
      builder.getType().should.equal(MessageStandardType.CIP8);
    });
  });

  describe('build', function () {
    it('should throw error if payload is not set', async function () {
      await should(builder.build()).be.rejectedWith('Message payload must be set before building the message');
    });

    it('should create a CIP8 message with correct properties', async function () {
      const payload = cip8TestResources.messages.simple;
      const signer = cip8TestResources.address.bech32;
      const metadata = { extra: 'data' };

      builder.setPayload(payload).addSigner(signer).setMetadata(metadata);

      const message = await builder.build();

      should.exist(message);
      message.should.be.instanceof(Cip8Message);
      message.getPayload().should.equal(payload);
      message.getSigners().should.deepEqual([signer]);
      const messageMetadata = message.getMetadata();
      should.exist(messageMetadata);
      messageMetadata!.should.containEql(metadata);
      messageMetadata!.should.containEql({ encoding: 'utf8' });
    });

    it('should include signatures when provided', async function () {
      const payload = cip8TestResources.messages.simple;
      const signer = cip8TestResources.address.bech32;
      const signatures: Signature[] = [
        {
          signature: Buffer.from('test-signature'),
          publicKey: { pub: cip8TestResources.keyPair.pub } as any,
        },
      ];

      builder.setPayload(payload).addSigner(signer).setSignatures(signatures);

      const message = await builder.build();

      should.exist(message);
      message.getSignatures().should.deepEqual(signatures);
    });
  });

  describe('fromBroadcastFormat', function () {
    it('should throw error if message type is invalid', async function () {
      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.UNKNOWN as any, // Incorrect type
        payload: 'test-payload',
        serializedSignatures: serializeSignatures([]),
        signers: [cip8TestResources.address.bech32],
        metadata: {},
      };
      await should(builder.fromBroadcastFormat(broadcastMessage)).be.rejectedWith(
        `Invalid message type, expected ${MessageStandardType.CIP8}`
      );
    });

    it('should recreate message from broadcast format', async function () {
      const signatures: Signature[] = [
        {
          signature: Buffer.from('test-signature'),
          publicKey: { pub: cip8TestResources.keyPair.pub } as any,
        },
      ];

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.CIP8,
        payload: cip8TestResources.messages.simple,
        serializedSignatures: serializeSignatures(signatures),
        signers: [cip8TestResources.address.bech32],
        metadata: { extra: 'data' },
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      should.exist(message);
      message.should.be.instanceof(Cip8Message);
      message.getPayload().should.equal(broadcastMessage.payload);
      message.getSigners().should.deepEqual(broadcastMessage.signers);
      const messageMetadata = message.getMetadata();
      should.exist(messageMetadata);
      messageMetadata!.should.containEql(broadcastMessage.metadata);
      messageMetadata!.should.containEql({ encoding: 'utf8' });

      // Check signatures were deserialized correctly
      message.getSignatures().should.have.length(signatures.length);
      const messageSignature = message.getSignatures()[0];
      messageSignature.signature.should.deepEqual(signatures[0].signature);
      messageSignature.publicKey.should.deepEqual(signatures[0].publicKey);
    });
  });
});
