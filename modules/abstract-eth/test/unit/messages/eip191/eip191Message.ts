import 'should';
import sinon from 'sinon';
import { MessageStandardType, serializeSignatures } from '@bitgo/sdk-core';
import { fixtures } from '../fixtures';
import { EIP191Message } from '../../../../src';

describe('EIP191 Message', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should initialize with the correct type', () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.validMessage,
    });

    message.getType().should.equal(MessageStandardType.EIP191);
  });

  it('should generate the correct signable payload with Ethereum prefix', async () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.validMessage,
    });

    const signablePayload = await message.getSignablePayload();
    // Message is prefixed with "\u0019Ethereum Signed Message:\n<length><message>"
    const expectedPrefix = `\u0019Ethereum Signed Message:\n${fixtures.messages.validMessage.length}`;
    const expectedPayload = Buffer.from(expectedPrefix.concat(fixtures.messages.validMessage)).toString('hex');

    signablePayload.should.equal(expectedPayload);
  });

  it('should handle empty messages correctly', async () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.emptyMessage,
    });

    const signablePayload = await message.getSignablePayload();
    // Empty message has length 0
    const expectedPrefix = `\u0019Ethereum Signed Message:\n0`;
    const expectedPayload = Buffer.from(expectedPrefix.concat('')).toString('hex');

    signablePayload.should.equal(expectedPayload);
  });

  it('should handle messages with special characters', async () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.specialCharsMessage,
    });

    const signablePayload = await message.getSignablePayload();
    const expectedPrefix = `\u0019Ethereum Signed Message:\n${fixtures.messages.specialCharsMessage.length}`;
    const expectedPayload = Buffer.from(expectedPrefix.concat(fixtures.messages.specialCharsMessage)).toString('hex');

    signablePayload.should.equal(expectedPayload);
  });

  it('should maintain signatures and signers correctly', () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.validMessage,
      signatures: [fixtures.eip191.signature],
      signers: [fixtures.eip191.signer],
    });

    message.getSignatures().should.containEql(fixtures.eip191.signature);
    message.getSigners().should.containEql(fixtures.eip191.signer);

    // Test adding new ones
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

  it('should store and retrieve metadata correctly', () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.validMessage,
      metadata: fixtures.eip191.metadata,
    });

    message.getMetadata()!.should.deepEqual(fixtures.eip191.metadata);
  });

  describe('Broadcast Format', () => {
    it('should convert to broadcast format correctly', async () => {
      const message = new EIP191Message({
        coinConfig: fixtures.coin,
        payload: fixtures.messages.validMessage,
        signatures: [fixtures.eip191.signature],
        signers: [fixtures.eip191.signer],
        metadata: fixtures.eip191.metadata,
      });

      const broadcastFormat = await message.toBroadcastFormat();

      const expectedSerializedSignatures = serializeSignatures([fixtures.eip191.signature]);
      broadcastFormat.type.should.equal(MessageStandardType.EIP191);
      broadcastFormat.payload.should.equal(fixtures.messages.validMessage);
      broadcastFormat.serializedSignatures?.should.deepEqual(expectedSerializedSignatures);
      broadcastFormat.signers?.should.deepEqual([fixtures.eip191.signer]);
      broadcastFormat.metadata!.should.deepEqual(fixtures.eip191.metadata);
      broadcastFormat.signablePayload!.should.equal(
        'MTk0NTc0Njg2NTcyNjU3NTZkMjA1MzY5Njc2ZTY1NjQyMDRkNjU3MzczNjE2NzY1M2EwYTMxMzM0ODY1NmM2YzZmMmMyMDc3NmY3MjZjNjQyMQ=='
      );
    });

    it('should convert to broadcast string correctly', async () => {
      const message = new EIP191Message({
        coinConfig: fixtures.coin,
        payload: fixtures.messages.validMessage,
        signatures: [fixtures.eip191.signature],
        signers: [fixtures.eip191.signer],
        metadata: fixtures.eip191.metadata,
      });

      const broadcastHex = await message.toBroadcastString();
      const broadcastString = Buffer.from(broadcastHex, 'hex').toString();
      const parsedBroadcast = JSON.parse(broadcastString);
      const expectedSerializedSignatures = serializeSignatures([fixtures.eip191.signature]);

      parsedBroadcast.type.should.equal(MessageStandardType.EIP191);
      parsedBroadcast.payload.should.equal(fixtures.messages.validMessage);
      parsedBroadcast.serializedSignatures.should.deepEqual(expectedSerializedSignatures);
      parsedBroadcast.signers.should.deepEqual([fixtures.eip191.signer]);
      parsedBroadcast.metadata.should.deepEqual(fixtures.eip191.metadata);
    });
  });
});
