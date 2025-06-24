import 'should';
import sinon from 'sinon';
import { MessageStandardType } from '@bitgo/sdk-core';
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

  it('should reuse existing signable payload if already set', async () => {
    const message = new EIP191Message({
      coinConfig: fixtures.coin,
      payload: fixtures.messages.validMessage,
      signablePayload: 'predefined-payload',
    });

    const signablePayload = await message.getSignablePayload();
    signablePayload.should.equal('predefined-payload');
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
    message.addSignature('new-signature');
    message.addSigner('new-signer');

    message.getSignatures().should.containEql('new-signature');
    message.getSigners().should.containEql('new-signer');

    // Test replacing all
    message.setSignatures(['replaced-signature']);
    message.setSigners(['replaced-signer']);

    message.getSignatures().should.deepEqual(['replaced-signature']);
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
        signablePayload: 'test-signable-payload',
      });

      const broadcastFormat = await message.toBroadcastFormat();

      broadcastFormat.type.should.equal(MessageStandardType.EIP191);
      broadcastFormat.payload.should.equal(fixtures.messages.validMessage);
      broadcastFormat.signatures.should.deepEqual([fixtures.eip191.signature]);
      broadcastFormat.signers.should.deepEqual([fixtures.eip191.signer]);
      broadcastFormat.metadata!.should.deepEqual(fixtures.eip191.metadata);
      broadcastFormat.signablePayload!.should.equal('test-signable-payload');
    });

    it('should throw error when broadcasting without signatures', async () => {
      const message = new EIP191Message({
        coinConfig: fixtures.coin,
        payload: fixtures.messages.validMessage,
        signers: [fixtures.eip191.signer],
      });

      await message
        .toBroadcastFormat()
        .should.be.rejectedWith('No signatures available for broadcast. Call setSignatures or addSignature first.');
    });

    it('should throw error when broadcasting without signers', async () => {
      const message = new EIP191Message({
        coinConfig: fixtures.coin,
        payload: fixtures.messages.validMessage,
        signatures: [fixtures.eip191.signature],
      });

      await message
        .toBroadcastFormat()
        .should.be.rejectedWith('No signers available for broadcast. Call setSigners or addSigner first.');
    });

    it('should convert to broadcast string correctly', async () => {
      const message = new EIP191Message({
        coinConfig: fixtures.coin,
        payload: fixtures.messages.validMessage,
        signatures: [fixtures.eip191.signature],
        signers: [fixtures.eip191.signer],
        metadata: fixtures.eip191.metadata,
      });

      const broadcastString = await message.toBroadcastString();
      const parsedBroadcast = JSON.parse(broadcastString);

      parsedBroadcast.type.should.equal(MessageStandardType.EIP191);
      parsedBroadcast.payload.should.equal(fixtures.messages.validMessage);
      parsedBroadcast.signatures.should.deepEqual([fixtures.eip191.signature]);
      parsedBroadcast.signers.should.deepEqual([fixtures.eip191.signer]);
      parsedBroadcast.metadata.should.deepEqual(fixtures.eip191.metadata);
    });
  });
});
