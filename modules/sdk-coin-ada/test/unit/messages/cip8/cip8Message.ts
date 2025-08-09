import should from 'should';
import sinon from 'sinon';
import { Buffer } from 'buffer';
import { MessageOptions, MessageStandardType, Signature } from '@bitgo/sdk-core';
import { Cip8Message } from '../../../../src';
import { cip8TestResources } from '../../../resources/cip8Resources';

describe('Cip8Message', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  const createDefaultMessageOptions = (message = cip8TestResources.messages.simple): MessageOptions => {
    return {
      coinConfig: {} as any,
      payload: message,
      signers: [cip8TestResources.address.bech32],
    };
  };

  describe('constructor', function () {
    it('should create a new instance with correct message type', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      should.exist(message);
      message.getType().should.equal(MessageStandardType.CIP8);
    });

    it('should initialize with provided options', function () {
      const options = createDefaultMessageOptions();
      options.metadata = { test: 'value' };

      const message = new Cip8Message(options);
      should.exist(message);
      should.exist(message.getPayload());
      message.getPayload().should.equal(options.payload);
      should.exist(message.getSigners());
      message.getSigners().should.deepEqual(options.signers);
      should.exist(message.getMetadata());
      should.deepEqual(message.getMetadata(), options.metadata);
    });

    it('should accept signatures in constructor', function () {
      const signatures: Signature[] = [
        {
          signature: Buffer.from('test-signature'),
          publicKey: { pub: cip8TestResources.keyPair.pub },
        },
      ];

      const options = {
        ...createDefaultMessageOptions(),
        signatures,
      };

      const message = new Cip8Message(options);
      should.exist(message.getSignatures());
      message.getSignatures().should.deepEqual(signatures);
    });
  });

  describe('validateAndGetCommonSetup', function () {
    it('should throw error when payload is missing', function () {
      const options = createDefaultMessageOptions();
      options.payload = undefined as any;
      const message = new Cip8Message(options);

      should.throws(() => (message as any).validateAndGetCommonSetup(), /Payload is required to build a CIP8 message/);
    });

    it('should throw error when signers are missing', function () {
      const options = createDefaultMessageOptions();
      options.signers = [];
      const message = new Cip8Message(options);

      should.throws(
        () => (message as any).validateAndGetCommonSetup(),
        /A signer address is required to build a CIP8 message/
      );
    });

    it('should return address CBOR bytes for valid input', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const result = (message as any).validateAndGetCommonSetup();

      should.exist(result);
      should.exist(result.addressCborBytes);
    });
  });

  describe('getSignablePayload', function () {
    it('should return signable payload as buffer', async function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const payload = await message.getSignablePayload();

      should.exist(payload);
      should.ok(Buffer.isBuffer(payload));
    });
  });

  describe('getBroadcastableSignatures', function () {
    it('should return empty array when no signatures exist', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const signatures = message.getBroadcastableSignatures();

      should.exist(signatures);
      signatures.should.be.an.Array();
      signatures.should.be.empty();
    });

    it('should convert signature to COSE format', function () {
      const testSignature: Signature = {
        signature: Buffer.from('test-signature'),
        publicKey: { pub: cip8TestResources.keyPair.pub },
      };

      const options = {
        ...createDefaultMessageOptions(),
        signatures: [testSignature],
      };

      const message = new Cip8Message(options);
      const signatures = message.getBroadcastableSignatures();

      should.exist(signatures);
      signatures.should.be.an.Array();
      signatures.should.have.length(1);

      should.exist(signatures[0].signature);
      should.ok(Buffer.isBuffer(signatures[0].signature));
      should.exist(signatures[0].publicKey);
      should.equal(signatures[0].publicKey.pub, cip8TestResources.keyPair.pub);
    });

    it('should throw when validation fails', function () {
      const testSignature: Signature = {
        signature: Buffer.from('test-signature'),
        publicKey: { pub: cip8TestResources.keyPair.pub },
      };

      const options = {
        ...createDefaultMessageOptions(),
        payload: undefined as any,
        signatures: [testSignature],
      };

      const message = new Cip8Message(options);

      should.throws(() => message.getBroadcastableSignatures(), /Payload is required to build a CIP8 message/);
    });
  });

  describe('verifyRawMessage', function () {
    it('should return true for valid Midnight Glacier Drop claim message', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const validMessage =
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(validMessage);
      result.should.be.true();
    });

    it('should return true for valid Midnight Glacier Drop claim message with testnet address', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const validTestnetMessage =
        'STAR 250 to addr_test1qpxecfjurjtcnalwy6gxcqzp09je55gvfv79hghqst8p7p6dnsn9c8yh38m7uf5sdsqyz7t9nfgscjeutw3wpqkwrursutfm7h 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(validTestnetMessage);
      result.should.be.true();
    });

    it('should return false for message without STAR prefix', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage =
        '100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for message with invalid number format', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage =
        'STAR abc to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for message with invalid address format', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage =
        'STAR 100 to invalid_address 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for message with short address', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage = 'STAR 100 to addr1short 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for message with wrong TnC hash', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage =
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an wronghashhere';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for message with missing TnC hash', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage =
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for message with extra content', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const invalidMessage =
        'STAR 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b extra content';

      const result = message.verifyRawMessage(invalidMessage);
      result.should.be.false();
    });

    it('should return false for empty message', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const emptyMessage = '';

      const result = message.verifyRawMessage(emptyMessage);
      result.should.be.false();
    });

    it('should return false for completely different message format', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const differentMessage = 'Hello, this is a regular message';

      const result = message.verifyRawMessage(differentMessage);
      result.should.be.false();
    });

    it('should handle case sensitivity correctly', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const caseInsensitiveMessage =
        'star 100 to addr1qxy2lshz9na88lslkj8gzd0y7t9h8j7jr0sgg30qnrylvfx4u2hwvqalq5fj9vmhxf06jgz0zt2j2qxjmzwf3rhqzqsehw0an 31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

      const result = message.verifyRawMessage(caseInsensitiveMessage);
      result.should.be.false(); // Should be case sensitive
    });
  });
});
