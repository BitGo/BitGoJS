import 'should';
import sinon from 'sinon';
import { BroadcastableMessage, MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';
import { fixtures } from '../fixtures';
import { EIP191Message, Eip191MessageBuilder } from '../../../../src';

describe('EIP191 Message Builder', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with the correct message type', () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);
      // Test the builder's private property indirectly through build()
      builder.should.be.instanceof(Eip191MessageBuilder);
    });
  });

  describe('build method', () => {
    it('should build a valid EIP191 message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage).setMetadata({ customData: 'test data' });

      const message = await builder.build();

      message.should.be.instanceof(EIP191Message);
      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
      message.getMetadata()!.should.have.property('customData', 'test data');
      message.getMetadata()!.should.have.property('encoding', 'utf8');
    });

    it('should throw an error when building without setting payload', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      await builder.build().should.be.rejectedWith('Message payload must be set before building the message');
    });

    it('should include signers when building a message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSigner(fixtures.eip191.signer);

      const message = await builder.build();

      message.getSigners().should.containEql(fixtures.eip191.signer);
    });

    it('should include signatures when building a message', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.addSignature(fixtures.eip191.signature);

      const message = await builder.build();

      message.getSignatures().should.containEql(fixtures.eip191.signature);
    });

    it('should override metadata.encoding with utf8', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      builder.setPayload(fixtures.messages.validMessage);
      builder.setMetadata({ encoding: 'hex', customData: 'test data' });

      const message = await builder.build();

      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'test data');
    });
  });

  describe('fromBroadcastFormat method', () => {
    it('should reconstruct a message from broadcast format', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.EIP191,
        payload: fixtures.messages.validMessage,
        serializedSignatures: serializeSignatures([fixtures.eip191.signature]),
        signers: [fixtures.eip191.signer],
        metadata: fixtures.eip191.metadata,
      };

      const message = await builder.fromBroadcastFormat(broadcastMessage);

      message.should.be.instanceof(EIP191Message);
      message.getType().should.equal(MessageStandardType.EIP191);
      message.getPayload().should.equal(fixtures.messages.validMessage);
      message.getSignatures().should.containEql(fixtures.eip191.signature);
      message.getSigners().should.containEql(fixtures.eip191.signer);
      message.getMetadata()!.should.have.property('encoding', 'utf8');
      message.getMetadata()!.should.have.property('customData', 'test data');
    });

    it('should throw an error for incorrect message type', async () => {
      const builder = new Eip191MessageBuilder(fixtures.coin);

      const broadcastMessage: BroadcastableMessage = {
        type: MessageStandardType.UNKNOWN,
        payload: fixtures.messages.validMessage,
        serializedSignatures: serializeSignatures([fixtures.eip191.signature]),
        signers: [fixtures.eip191.signer],
        metadata: {},
      };

      await builder
        .fromBroadcastFormat(broadcastMessage)
        .should.be.rejectedWith(`Invalid message type, expected ${MessageStandardType.EIP191}`);
    });
  });
});
