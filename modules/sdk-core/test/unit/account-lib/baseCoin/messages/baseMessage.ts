import { BaseCoin } from '@bitgo/statics';
import sinon from 'sinon';
import should from 'should';
import { MessageStandardType } from '../../../../../src';
import { messageSamples, TestBaseMessage } from './fixtures';

describe('Base Message', () => {
  let coinConfig: sinon.SinonStubbedInstance<BaseCoin>;

  beforeEach(() => {
    coinConfig = sinon.createStubInstance(BaseCoin);
  });

  it('should initialize with default values', () => {
    const message = new TestBaseMessage({
      coinConfig,
      payload: '',
    });

    should.equal(message.getType(), MessageStandardType.UNKNOWN);
    should.equal(message.getPayload(), '');
    should.deepEqual(message.getMetadata(), {});
    should.deepEqual(message.getSignatures(), []);
    should.deepEqual(message.getSigners(), []);
  });

  it('should initialize with provided values', () => {
    const { payload, type, metadata, signers, signatures } = messageSamples.eip191;

    const message = new TestBaseMessage({
      coinConfig,
      payload,
      type,
      metadata,
      signers,
      signatures,
    });

    should.equal(message.getType(), type);
    should.equal(message.getPayload(), payload);
    should.deepEqual(message.getMetadata(), metadata);
    should.deepEqual(message.getSignatures(), signatures);
    should.deepEqual(message.getSigners(), signers);
  });

  describe('Getters and Setters', () => {
    let message: TestBaseMessage;

    beforeEach(() => {
      message = new TestBaseMessage({
        coinConfig,
        payload: 'test',
      });
    });

    it('should handle adding and getting signers', () => {
      const signer1 = '0xabc123';
      const signer2 = '0xdef456';

      message.addSigner(signer1);
      should.deepEqual(message.getSigners(), [signer1]);

      message.addSigner(signer2);
      should.deepEqual(message.getSigners(), [signer1, signer2]);

      // Adding a duplicate signer should not add it again
      message.addSigner(signer1);
      should.deepEqual(message.getSigners(), [signer1, signer2]);

      // Set signers should replace all existing signers
      const newSigners = ['0x111', '0x222'];
      message.setSigners(newSigners);
      should.deepEqual(message.getSigners(), newSigners);
    });

    it('should handle adding and getting signatures', () => {
      const sig1 = 'signature1';
      const sig2 = 'signature2';

      message.addSignature(sig1);
      should.deepEqual(message.getSignatures(), [sig1]);

      message.addSignature(sig2);
      should.deepEqual(message.getSignatures(), [sig1, sig2]);

      // Set signatures should replace all existing signatures
      const newSignatures = ['sig3', 'sig4'];
      message.setSignatures(newSignatures);
      should.deepEqual(message.getSignatures(), newSignatures);
    });

    it('should return copies of arrays to prevent mutation', () => {
      const signers = ['addr1', 'addr2'];
      const signatures = ['sig1', 'sig2'];

      message.setSigners(signers);
      message.setSignatures(signatures);

      // Modifying the returned arrays should not affect the internal state
      const returnedSigners = message.getSigners();
      const returnedSignatures = message.getSignatures();

      returnedSigners.push('addr3');
      returnedSignatures.push('sig3');

      should.deepEqual(message.getSigners(), signers);
      should.deepEqual(message.getSignatures(), signatures);
    });
  });

  describe('getSignablePayload', () => {
    it('should return the signablePayload if set', async () => {
      const customSignablePayload = '0xabcdef123456';
      const message = new TestBaseMessage({
        coinConfig,
        payload: 'original payload',
        signablePayload: customSignablePayload,
      });

      const result = await message.getSignablePayload();
      should.equal(result, customSignablePayload);
    });

    it('should return the payload as buffer if signablePayload is not set', async () => {
      const payload = 'test payload';
      const message = new TestBaseMessage({
        coinConfig,
        payload,
      });

      const result = await message.getSignablePayload();
      should.deepEqual(result, Buffer.from(payload));
    });
  });

  describe('toBroadcastFormat', () => {
    it('should throw an error if no signatures are available', async () => {
      const message = new TestBaseMessage({
        coinConfig,
        payload: 'test',
        signers: ['addr1'],
      });

      await message
        .toBroadcastFormat()
        .should.be.rejectedWith('No signatures available for broadcast. Call setSignatures or addSignature first.');
    });

    it('should throw an error if no signers are available', async () => {
      const message = new TestBaseMessage({
        coinConfig,
        payload: 'test',
        signatures: ['sig1'],
      });

      await message
        .toBroadcastFormat()
        .should.be.rejectedWith('No signers available for broadcast. Call setSigners or addSigner first.');
    });

    it('should create a proper broadcastable format with all fields', async () => {
      const { payload, type, metadata, signers, signatures } = messageSamples.eip191;
      const customSignablePayload = Buffer.from('custom signable payload');

      const message = new TestBaseMessage({
        coinConfig,
        payload,
        type,
        metadata,
        signers,
        signatures,
        signablePayload: customSignablePayload,
      });

      const broadcastFormat = await message.toBroadcastFormat();

      should.deepEqual(broadcastFormat, {
        type,
        payload,
        signatures,
        signers,
        metadata,
        signablePayload: customSignablePayload,
      });
    });

    it('should perform a deep copy of metadata to prevent mutation', async () => {
      const nestedMetadata = {
        version: '1.0',
        settings: {
          chainId: 1,
          gasLimit: 21000,
        },
      };

      const message = new TestBaseMessage({
        coinConfig,
        payload: 'test',
        metadata: nestedMetadata,
        signers: ['addr1'],
        signatures: ['sig1'],
      });

      const broadcastFormat = await message.toBroadcastFormat();

      // The metadata in the broadcast format should be a deep copy
      should.deepEqual(broadcastFormat.metadata, nestedMetadata);

      // But it should not be the same object reference
      should.notEqual(broadcastFormat.metadata, nestedMetadata);

      // Modifying the original should not affect the broadcasted version
      nestedMetadata.settings.gasLimit = 50000;
      should.notEqual((broadcastFormat.metadata as any).settings.gasLimit, 50000);
    });
  });

  describe('toBroadcastString', () => {
    it('should serialize the broadcastable format to JSON string', async () => {
      const { payload, type, metadata, signers, signatures } = messageSamples.eip191;

      const message = new TestBaseMessage({
        coinConfig,
        payload,
        type,
        metadata,
        signers,
        signatures,
      });

      const broadcastString = await message.toBroadcastString();
      const parsed = JSON.parse(broadcastString);

      should.deepEqual(parsed, {
        type,
        payload,
        signatures,
        signers,
        metadata,
      });
    });
  });
});
