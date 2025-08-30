import { serializeSignatures } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import should from 'should';
import { MessageTestConfig } from './abstractEthMessageTestTypes';

const coinConfig = coins.get('eth');

export function testEthMessageSigning(testConfig: MessageTestConfig): void {
  const { messageType, messageClass, tests, signedTest } = testConfig;

  describe(`${messageType} - Message Type`, () => {
    it('should have the correct message type', () => {
      const msgInstance = new messageClass({
        ...signedTest.input,
        coinConfig,
      });
      msgInstance.getType().should.equal(messageType);
    });
  });

  describe(`${messageType} - Signable Payload Generation`, () => {
    Object.entries(tests).map(([key, { input, expected }]) => {
      it(`should generate the correct signable payload for message '${key}'`, async () => {
        const message = new messageClass({
          ...input,
          coinConfig,
        });

        const signablePayload = await message.getSignablePayload();
        signablePayload.toString('hex').should.equal(expected.expectedSignableHex);

        if (input.metadata) {
          should.deepEqual(message.getMetadata(), input.metadata);
        } else {
          should.deepEqual(message.getMetadata(), {});
        }
      });
    });
  });

  describe(`${messageType} - Maintaining Signers and Signatures`, () => {
    const { payload, signature, signer } = signedTest.input;

    it('should be created with the correct signatures and signers', () => {
      const message = new messageClass({
        coinConfig,
        payload,
        signatures: [signature],
        signers: [signer],
      });

      message.getSignatures().should.containEql(signature);
      message.getSigners().should.containEql(signer);
    });

    it('should maintain signatures and signers correctly', () => {
      const message = new messageClass({
        coinConfig,
        payload,
        signatures: [signature],
        signers: [signer],
      });

      message.addSignature({
        publicKey: { pub: 'pub1' },
        signature: Buffer.from('new-signature'),
      });
      message.addSigner('new-signer');

      message.getSignatures().should.containEql({
        publicKey: { pub: 'pub1' },
        signature: Buffer.from('new-signature'),
      });
      message.getSigners().should.containEql('new-signer');

      // Test replacing all
      message.setSignatures([
        {
          publicKey: { pub: 'pub2' },
          signature: Buffer.from('replaced-signature'),
        },
      ]);
      message.setSigners(['replaced-signer']);

      message.getSignatures().should.deepEqual([
        {
          publicKey: { pub: 'pub2' },
          signature: Buffer.from('replaced-signature'),
        },
      ]);
      message.getSigners().should.deepEqual(['replaced-signer']);
    });
  });

  describe(`${messageType} - Broadcast Format`, () => {
    const { payload, signature, signer } = signedTest.input;
    const { expectedSignableBase64 } = signedTest.expected;

    it('should convert to broadcast format correctly', async () => {
      const message = new messageClass({
        coinConfig,
        payload,
        signatures: [signature],
        signers: [signer],
      });

      const broadcastFormat = await message.toBroadcastFormat();
      const expectedSerializedSignatures = serializeSignatures([signature]);

      broadcastFormat.type.should.equal(messageType);
      broadcastFormat.payload.should.equal(message.getPayload());
      broadcastFormat.serializedSignatures?.should.deepEqual(expectedSerializedSignatures);
      broadcastFormat.signers?.should.deepEqual([signer]);
      broadcastFormat.signablePayload?.should.equal(expectedSignableBase64);

      if (broadcastFormat.metadata) {
        broadcastFormat.metadata.should.deepEqual(message.getMetadata());
      } else {
        should.deepEqual(message.getMetadata(), {});
      }
    });

    it('should convert to broadcast string correctly', async () => {
      const message = new messageClass({
        coinConfig,
        payload,
        signatures: [signature],
        signers: [signer],
      });

      const broadcastHex = await message.toBroadcastString();
      const broadcastString = Buffer.from(broadcastHex, 'hex').toString();
      const parsedBroadcast = JSON.parse(broadcastString);
      const expectedSerializedSignatures = serializeSignatures([signature]);

      parsedBroadcast.type.should.equal(messageType);
      parsedBroadcast.payload.should.equal(message.getPayload());
      parsedBroadcast.serializedSignatures.should.deepEqual(expectedSerializedSignatures);
      parsedBroadcast.signers.should.deepEqual([signer]);
      parsedBroadcast.metadata.should.deepEqual(message.getMetadata());
    });
  });
}
