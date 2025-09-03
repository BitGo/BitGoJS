import { MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { MessageBuilderFactory } from '../../../src';
import should from 'should';
import { MessageBuildingTestConfig } from './abstractEthMessageTestTypes';

const coinConfig = coins.get('eth');

export function testEthMessageBuilding(testConfig: MessageBuildingTestConfig): void {
  const { messageType, messageBuilderClass, messageClass, test } = testConfig;

  describe(`${messageType} - Build Method`, () => {
    const factory = new MessageBuilderFactory(coinConfig);
    const { payload, metadata, signature, signer } = test.input;

    it('should initialize with the correct message type', () => {
      const builder = factory.getMessageBuilder(messageType);
      builder.should.be.instanceof(messageBuilderClass);
    });

    it('should build a valid message', async () => {
      const builder = factory.getMessageBuilder(messageType);
      builder.setPayload(payload).setMetadata(metadata || {});

      const builtMessage = await builder.build();
      builtMessage.getType().should.equal(messageType);
      builtMessage.getPayload().should.equal(payload);

      if (metadata) {
        should.deepEqual(builtMessage.getMetadata(), metadata);
      } else {
        should.deepEqual(builtMessage.getMetadata(), {});
      }
    });

    it('should throw an error when building without setting the payload', async () => {
      const builder = factory.getMessageBuilder(messageType);
      await builder.build().should.be.rejectedWith('Message payload must be set before building the message');
    });

    it('should include signers when building a message', async () => {
      const builder = factory.getMessageBuilder(messageType);
      builder.setPayload(payload);
      builder.addSigner(signer);

      const message = await builder.build();
      message.getSigners().should.containEql(signer);
    });

    it('should include signatures when building a message', async () => {
      const builder = factory.getMessageBuilder(messageType);
      builder.setPayload(payload);
      builder.addSignature(signature);

      const message = await builder.build();
      message.getSignatures().should.containEql(signature);
    });

    it('should override metadata.encoding with utf8', async () => {
      const builder = factory.getMessageBuilder(messageType);
      builder.setPayload(payload);
      builder.setMetadata({ encoding: 'hex', customData: 'test data' });

      const message = await builder.build();
      const metadata = message.getMetadata();
      should(metadata).not.be.undefined();
      should(metadata).have.property('encoding', 'utf8');
      should(metadata).have.property('customData', 'test data');
    });
  });

  describe(`${messageType} - From Broadcast Format`, () => {
    const factory = new MessageBuilderFactory(coinConfig);
    const { payload, signature, signer, metadata } = test.input;

    const broadcastMessage = {
      payload,
      type: messageType,
      serializedSignatures: serializeSignatures([signature]),
      signers: [signer],
      metadata: metadata,
    };

    it('should reconstruct a message from broadcast format', async () => {
      const builder = factory.getMessageBuilder(messageType);
      const message = await builder.fromBroadcastFormat(broadcastMessage);

      message.getType().should.equal(messageType);
      message.getPayload().should.equal(payload);
      message.getSignatures().should.containEql(signature);
      message.getSigners().should.containEql(signer);
      message.should.be.instanceof(messageClass);

      if (metadata) {
        should.deepEqual(message.getMetadata(), metadata);
      } else {
        should.deepEqual(message.getMetadata(), {});
      }
    });

    it('should throw an error for incorrect message type', async () => {
      const builder = factory.getMessageBuilder(messageType);
      const broadcastMessageWrongType = { ...broadcastMessage, type: MessageStandardType.UNKNOWN };
      await builder
        .fromBroadcastFormat(broadcastMessageWrongType)
        .should.be.rejectedWith(`Invalid message type, expected ${messageType}`);
    });
  });

  describe(`${messageType} - From Broadcast String`, () => {
    const { payload, signature, signer } = test.input;
    const broadcastHex = test.broadcastHex;

    it('should parse broadcastable string and return correct builder type', async () => {
      const factory = new MessageBuilderFactory(coinConfig);
      const builder = factory.fromBroadcastString(broadcastHex);
      const message = await builder.build();

      message.getType().should.equal(messageType);
      message.getPayload().should.equal(payload);
      message.getSignatures().should.containEql(signature);
      message.getSigners().should.containEql(signer);
    });
  });
}
