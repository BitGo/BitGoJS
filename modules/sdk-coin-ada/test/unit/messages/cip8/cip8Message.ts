import should from 'should';
import sinon from 'sinon';
import { Buffer } from 'buffer';
import { MessageOptions, MessageStandardType, Signature } from '@bitgo/sdk-core';
import { Cip8Message } from '../../../../src/lib/messages';
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
      should.ok(Buffer.isBuffer(result.addressCborBytes) || result.addressCborBytes instanceof Uint8Array);
    });
  });

  describe('getSignablePayload', function () {
    it('should return signable payload as buffer', async function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const payload = await message.getSignablePayload();

      should.exist(payload);
      should.ok(Buffer.isBuffer(payload));
    });

    it('should cache signable payload', async function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const buildSignablePayloadSpy = sandbox.spy(message as any, 'buildSignablePayload');

      const payload1 = await message.getSignablePayload();
      const payload2 = await message.getSignablePayload();

      should.exist(payload1);
      should.exist(payload2);

      // Payloads should be the same
      should.equal(payload1, payload2);

      // buildSignablePayload should be called only once
      buildSignablePayloadSpy.calledOnce.should.be.true();
    });
  });

  describe('buildSignablePayload', function () {
    it('should create a buffer from signature structure', function () {
      const message = new Cip8Message(createDefaultMessageOptions());
      const payload = (message as any).buildSignablePayload();

      should.exist(payload);
      should.ok(Buffer.isBuffer(payload));
    });

    it('should throw when validation fails', async function () {
      const options = createDefaultMessageOptions();
      options.payload = undefined as any;
      const message = new Cip8Message(options);

      await should(message.getSignablePayload()).be.rejectedWith(`Payload is required to build a CIP8 message`);
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
});
