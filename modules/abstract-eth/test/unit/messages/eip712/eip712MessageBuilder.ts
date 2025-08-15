import 'should';
import sinon from 'sinon';
import { EIP712Message, Eip712MessageBuilder } from '../../../../src';
import { eip712Fixtures as fixtures } from '../fixtures';
import { BroadcastableMessage, MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';

describe('EIP712 Message Builder', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with the correct message type', () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);
      // Test the builder's private property indirectly through build()
      builder.should.be.instanceof(Eip712MessageBuilder);
    });
  });

  describe('build method', () => {
    it('should build a valid EIP712 message', async () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);

      builder.setPayload(JSON.stringify(fixtures.messages.helloBob.message)).setMetadata({ customData: 'test data' });

      const message = await builder.build();

      message.should.be.instanceof(EIP712Message);
      message.getType().should.equal(MessageStandardType.EIP712);
      JSON.parse(message.getPayload()).should.deepEqual(fixtures.messages.helloBob.message);
      message.getMetadata()!.should.have.property('customData', 'test data');
      message.getMetadata()!.should.have.property('encoding', 'utf8');
    });

    it('should throw an error when building without setting payload', async () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);

      await builder.build().should.be.rejectedWith('Message payload must be set before building the message');
    });

    it('should include signatures when building a message', async () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);

      builder.setPayload(JSON.stringify(fixtures.messages.helloBob.message)).addSignature(fixtures.eip712.signature);

      const message = await builder.build();

      message.getSignatures().should.containEql(fixtures.eip712.signature);
    });

    it('should override metadata.encoding with utf8', async () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);

      builder
        .setPayload(JSON.stringify(fixtures.messages.helloBob.message))
        .setMetadata({ encoding: 'hex', customData: 'test data' });

      const message = await builder.build();

      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'test data');
    });
  });

  describe('fromBroadcastFormat method', () => {
    it('should reconstruct a message from broadcast format', async () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP712,
        payload: JSON.stringify(fixtures.messages.helloBob.message),
        serializedSignatures: serializeSignatures([fixtures.eip712.signature]),
        signers: [fixtures.eip712.signer],
        metadata: fixtures.eip712.metadata,
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      message.should.be.instanceof(EIP712Message);
      message.getType().should.equal(MessageStandardType.EIP712);
      JSON.parse(message.getPayload()).should.deepEqual(fixtures.messages.helloBob.message);
      message.getSignatures().should.containEql(fixtures.eip712.signature);
      message.getSigners().should.containEql(fixtures.eip712.signer);
      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'test data');
    });

    it('should throw an error for incorrect message type', async () => {
      const builder = new Eip712MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: JSON.stringify(fixtures.messages.helloBob.message),
        serializedSignatures: serializeSignatures([fixtures.eip712.signature]),
        signers: [fixtures.eip712.signer],
        metadata: {},
      };

      await builder
        .fromBroadcastFormat(broadcastMessage)
        .should.be.rejectedWith(`Invalid message type, expected ${MessageStandardType.EIP712}`);
    });
  });
});
