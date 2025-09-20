import { BaseCoin } from '@bitgo/statics';
import sinon from 'sinon';
import should from 'should';
import { MessageStandardType, serializeSignatures } from '../../../../../src';
import { messageSamples, TestMessage } from './fixtures';

describe('Base Message', () => {
  let coinConfig: sinon.SinonStubbedInstance<BaseCoin>;

  beforeEach(() => {
    coinConfig = sinon.createStubInstance(BaseCoin);
  });

  it('should initialize with default values', () => {
    const message = new TestMessage({
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

    const message = new TestMessage({
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
    let message: TestMessage;

    beforeEach(() => {
      message = new TestMessage({
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
      const sig1 = {
        publicKey: { pub: 'pub1' },
        signature: Buffer.from('signature1'),
      };
      const sig2 = {
        publicKey: { pub: 'pub2' },
        signature: Buffer.from('signature2'),
      };

      message.addSignature(sig1);
      should.deepEqual(message.getSignatures(), [sig1]);

      message.addSignature(sig2);
      should.deepEqual(message.getSignatures(), [sig1, sig2]);

      // Set signatures should replace all existing signatures
      const newSignatures = [
        {
          publicKey: { pub: 'pub3' },
          signature: Buffer.from('sig3'),
        },
        {
          publicKey: { pub: 'pub4' },
          signature: Buffer.from('sig4'),
        },
      ];
      message.setSignatures(newSignatures);
      should.deepEqual(message.getSignatures(), newSignatures);
    });

    it('should return copies of arrays to prevent mutation', () => {
      const signers = ['addr1', 'addr2'];
      const signatures = [
        {
          publicKey: { pub: 'pub1' },
          signature: Buffer.from('sig1'),
        },
        {
          publicKey: { pub: 'pub1' },
          signature: Buffer.from('sig1'),
        },
      ];

      message.setSigners(signers);
      message.setSignatures(signatures);

      // Modifying the returned arrays should not affect the internal state
      const returnedSigners = message.getSigners();
      const returnedSignatures = message.getSignatures();

      returnedSigners.push('addr3');
      returnedSignatures.push({
        publicKey: { pub: 'pub3' },
        signature: Buffer.from('sig3'),
      });

      should.deepEqual(message.getSigners(), signers);
      should.deepEqual(message.getSignatures(), signatures);
    });
  });

  describe('getSignablePayload', () => {
    it('should return the payload as buffer if signablePayload is not set', async () => {
      const payload = 'test payload';
      const message = new TestMessage({
        coinConfig,
        payload,
      });

      const result = await message.getSignablePayload();
      should.deepEqual(result, Buffer.from(payload));
    });
  });

  describe('toBroadcastFormat', () => {
    it('should create a proper broadcastable format with all fields', async () => {
      const { payload, type, metadata, signers, signatures } = messageSamples.eip191;

      const message = new TestMessage({
        coinConfig,
        payload,
        type,
        metadata,
        signers,
        signatures,
      });

      const broadcastFormat = await message.toBroadcastFormat();

      should.deepEqual(broadcastFormat, {
        type,
        payload,
        serializedSignatures: serializeSignatures(signatures),
        signers,
        metadata,
        signablePayload: 'SGVsbG8gQml0R28h',
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

      const message = new TestMessage({
        coinConfig,
        payload: 'test',
        metadata: nestedMetadata,
        signers: ['addr1'],
        signatures: [
          {
            publicKey: { pub: 'pub1' },
            signature: Buffer.from('sig1'),
          },
        ],
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
    it('should serialize the broadcastable format to hex string', async () => {
      const { payload, type, metadata, signers, signatures } = messageSamples.eip191;

      const message = new TestMessage({
        coinConfig,
        payload,
        type,
        metadata,
        signers,
        signatures,
      });
      const expectedBroadcastString = {
        type,
        payload,
        serializedSignatures: serializeSignatures(signatures),
        signers,
        metadata,
        signablePayload: 'SGVsbG8gQml0R28h',
      };

      const broadcastHex = await message.toBroadcastString();
      const broadcastString = Buffer.from(broadcastHex, 'hex').toString();
      const parsed = JSON.parse(broadcastString);

      should.deepEqual(parsed, expectedBroadcastString);
    });
  });

  describe('verifyEncodedPayload', () => {
    let message: TestMessage;

    beforeEach(() => {
      message = new TestMessage({
        coinConfig,
        payload: 'test payload',
      });
    });

    it('should return true when encoded message matches signable payload', async () => {
      const signablePayload = await message.getSignablePayload();
      const expectedHex = (signablePayload as Buffer).toString('hex');

      const result = await message.verifyEncodedPayload(expectedHex);
      should.equal(result, true);
    });

    it('should return false when encoded message does not match signable payload', async () => {
      const wrongHex = '1234567890abcdef';

      const result = await message.verifyEncodedPayload(wrongHex);
      should.equal(result, false);
    });

    it('should handle string signable payload', async () => {
      // Create a custom test message that returns string payload
      class StringTestMessage extends TestMessage {
        async getSignablePayload(): Promise<string | Buffer> {
          return 'string payload';
        }
      }

      const messageWithStringPayload = new StringTestMessage({
        coinConfig,
        payload: 'test',
      });

      const result = await messageWithStringPayload.verifyEncodedPayload('string payload');
      should.equal(result, true);
    });

    it('should accept optional metadata parameter', async () => {
      const signablePayload = await message.getSignablePayload();
      const expectedHex = (signablePayload as Buffer).toString('hex');
      const metadata = { chainId: 1, version: '1.0' };

      const result = await message.verifyEncodedPayload(expectedHex, metadata);
      should.equal(result, true);
    });
  });

  describe('verifyRawMessage', () => {
    let message: TestMessage;

    beforeEach(() => {
      message = new TestMessage({
        coinConfig,
        payload: 'test payload',
      });
    });

    it('should return true for any non-empty raw message (base implementation)', () => {
      const result = message.verifyRawMessage('Any message content');
      should.equal(result, true);
    });

    it('should return false for empty string', () => {
      const result = message.verifyRawMessage('');
      should.equal(result, false);
    });

    it('should return false for null', () => {
      const result = message.verifyRawMessage(null as any);
      should.equal(result, false);
    });

    it('should return false for undefined', () => {
      const result = message.verifyRawMessage(undefined as any);
      should.equal(result, false);
    });

    it('should return false for whitespace-only string', () => {
      const result = message.verifyRawMessage('   \t\n\r  ');
      should.equal(result, false);
    });

    it('should return true for JSON format', () => {
      const jsonMessage = JSON.stringify({ message: 'test', data: [1, 2, 3] });
      const result = message.verifyRawMessage(jsonMessage);
      should.equal(result, true);
    });
  });
});
