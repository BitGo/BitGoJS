import * as testData from '../resources/iota';
import should from 'should';
import utils from '../../src/lib/utils';
import { createTransferBuilderWithGas } from './helpers/testHelpers';

describe('Iota util library', function () {
  describe('Address Validation', function () {
    it('should validate all correct addresses', function () {
      testData.addresses.validAddresses.forEach((address) => {
        utils.isValidAddress(address).should.be.true();
      });
    });

    it('should reject all invalid addresses', function () {
      testData.addresses.invalidAddresses.forEach((address) => {
        utils.isValidAddress(address).should.be.false();
      });
    });

    const addressTestCases = [
      { address: '0x' + 'a'.repeat(64), valid: true, description: 'correct length (64 hex chars)' },
      { address: '0x' + 'a'.repeat(32), valid: false, description: 'too short' },
      { address: '0x' + 'a'.repeat(128), valid: false, description: 'too long' },
      { address: 'a'.repeat(64), valid: false, description: 'missing 0x prefix' },
      { address: '0x' + 'g'.repeat(64), valid: false, description: 'non-hex characters' },
      { address: undefined, valid: false, description: 'undefined' },
    ];

    addressTestCases.forEach(({ address, valid, description }) => {
      it(`should ${valid ? 'accept' : 'reject'} address with ${description}`, function () {
        // @ts-expect-error Testing for undefined
        utils.isValidAddress(address).should.equal(valid);
      });
    });
  });

  describe('Public Key Validation', function () {
    const validPublicKeys = [
      'b2051899478edeb36a79d1d16dfec56dc3a6ebd29fbbbb4a4ef2dfaf46043355',
      testData.sender.publicKey,
    ];

    it('should validate all correct public keys', function () {
      validPublicKeys.forEach((key) => {
        utils.isValidPublicKey(key).should.be.true();
      });
    });

    const invalidPublicKeyTestCases = [
      { key: '0x413f7fa8beb54459e1e9ede3af3b12e5a4a3550390bb616da30dd72017701263', description: 'with 0x prefix' },
      { key: 'invalid', description: 'invalid format' },
      { key: '', description: 'empty string' },
      { key: '123', description: 'too short' },
      { key: 'a'.repeat(32), description: 'incorrect length (too short)' },
      { key: 'a'.repeat(128), description: 'incorrect length (too long)' },
    ];

    invalidPublicKeyTestCases.forEach(({ key, description }) => {
      it(`should reject public key ${description}`, function () {
        utils.isValidPublicKey(key).should.be.false();
      });
    });
  });

  describe('Private Key Validation', function () {
    it('should validate ed25519 secret keys with correct length', function () {
      // Ed25519 secret keys are 128 hex chars (64 bytes: 32-byte seed + 32-byte public key)
      const validSecretKey = '0'.repeat(128);
      utils.isValidPrivateKey(validSecretKey).should.be.true();
    });

    const invalidPrivateKeyTestCases = [
      { key: 'invalid', description: 'invalid format' },
      { key: '', description: 'empty string' },
      { key: '123', description: 'too short' },
      { key: 'a'.repeat(32), description: '16 bytes (too short)' },
      { key: 'a'.repeat(64), description: '32 bytes (seed only, not full secret)' },
      { key: 'a'.repeat(256), description: '128 bytes (too long)' },
    ];

    invalidPrivateKeyTestCases.forEach(({ key, description }) => {
      it(`should reject private key: ${description}`, function () {
        utils.isValidPrivateKey(key).should.be.false();
      });
    });
  });

  describe('Transaction and Block ID Validation', function () {
    it('should validate correct transaction ID (base58)', function () {
      utils.isValidTransactionId('BftEk3BeKUWTj9uzVGntd4Ka16QZG8hUnr6KsAb7q7bt').should.be.true();
    });

    it('should validate correct block ID (base58)', function () {
      utils.isValidBlockId('GZXZvvLS3ZnuE4E9CxQJJ2ij5xeNsvUXdAKVrPCQKrPz').should.be.true();
    });

    const invalidIdTestCases = [
      {
        validator: 'isValidTransactionId',
        cases: [
          { id: '0xff86b121181a43d03df52e8930785af3dda944ec87654cdba3a378ff518cd75b', description: 'hex format' },
          { id: 'BftEk3BeKUWTj9uzVGntd4Ka16QZG8hUnr6KsAb7q7b53t', description: 'wrong length' },
          { id: '0xabcdef123456', description: 'hex with prefix' },
          { id: '', description: 'empty string' },
        ],
      },
      {
        validator: 'isValidBlockId',
        cases: [
          { id: '0x9ac6a0c313c4a0563a169dad29f1d018647683be54a314ed229a2693293dfc98', description: 'hex format' },
          { id: 'GZXZvvLS3ZnuE4E9CxQJJ2ij5xeNsvUXdAK56VrPCQKrPz', description: 'wrong length' },
          { id: '0xabcdef', description: 'hex with prefix' },
          { id: '', description: 'empty string' },
        ],
      },
    ];

    invalidIdTestCases.forEach(({ validator, cases }) => {
      cases.forEach(({ id, description }) => {
        it(`${validator} should reject ${description}`, function () {
          utils[validator](id).should.be.false();
        });
      });
    });
  });

  describe('Signature Validation', function () {
    it('should validate correct base64-encoded 64-byte signature', function () {
      const validSignature = 'iXrcUjgQgpYUsa7O90KZicdTmIdJSjB99+tJW6l6wPCqI/lUTou6sQ2sLoZgC0n4qQKX+vFDz+lBIXl7J/ZgCg==';
      utils.isValidSignature(validSignature).should.be.true();
    });

    const invalidSignatureTestCases = [
      { sig: '0x9ac6a0c313c4a0563a169dad29f1d018647683be54a314ed229a2693293dfc98', description: 'hex format' },
      { sig: 'goppBTDgLuBbcU5tP90n3igvZGHmcE23HCoxLfdJwOCcbyztVh9r0TPacJRXmjZ6', description: 'wrong format' },
      { sig: 'dG9vU2hvcnQ=', description: 'too short (base64)' },
      { sig: 'not a base64 string!!!', description: 'invalid base64' },
      { sig: '', description: 'empty string' },
    ];

    invalidSignatureTestCases.forEach(({ sig, description }) => {
      it(`should reject ${description}`, function () {
        utils.isValidSignature(sig).should.be.false();
      });
    });
  });

  describe('Hex String Validation', function () {
    const hexTestCases = [
      { hex: '0xabcdef', length: 6, valid: true, description: 'lowercase' },
      { hex: '0x123456', length: 6, valid: true, description: 'numbers' },
      { hex: '0XABCDEF', length: 6, valid: true, description: 'uppercase prefix' },
      { hex: '0xABCDEF', length: 6, valid: true, description: 'uppercase' },
      { hex: '0xAbCdEf', length: 6, valid: true, description: 'mixed case' },
      { hex: '0xabcd', length: 6, valid: false, description: 'too short' },
      { hex: '0xabcdefgh', length: 6, valid: false, description: 'too long' },
      { hex: 'abcdef', length: 6, valid: false, description: 'no prefix' },
      { hex: '0xghijkl', length: 6, valid: false, description: 'non-hex chars' },
      { hex: '0xabcdeg', length: 6, valid: false, description: 'invalid char at end' },
    ];

    hexTestCases.forEach(({ hex, length, valid, description }) => {
      it(`should ${valid ? 'accept' : 'reject'} ${description}`, function () {
        utils.isValidHex(hex, length).should.equal(valid);
      });
    });
  });

  describe('Address Derivation from Public Key', function () {
    it('should generate valid address from public key', function () {
      const address = utils.getAddressFromPublicKey(testData.sender.publicKey);
      should.exist(address);
      utils.isValidAddress(address).should.be.true();
    });

    it('should generate consistent addresses from same key', function () {
      const address1 = utils.getAddressFromPublicKey(testData.sender.publicKey);
      const address2 = utils.getAddressFromPublicKey(testData.sender.publicKey);
      address1.should.equal(address2);
    });

    it('should generate different addresses for different keys', function () {
      const address1 = utils.getAddressFromPublicKey(testData.sender.publicKey);
      const address2 = utils.getAddressFromPublicKey(testData.gasSponsor.publicKey);
      address1.should.not.equal(address2);
    });
  });

  describe('Base64 String Conversion', function () {
    const conversionTestCases = [
      { input: new Uint8Array([72, 101, 108, 108, 111]), description: 'Uint8Array ("Hello")' },
      { input: '48656c6c6f', description: 'hex string ("Hello")' },
      { input: new Uint8Array([]), description: 'empty Uint8Array' },
      { input: new Uint8Array(Buffer.from('Hello World')), description: 'Buffer as Uint8Array' },
    ];

    conversionTestCases.forEach(({ input, description }) => {
      it(`should convert ${description} to base64`, function () {
        const result = utils.getBase64String(input);
        should.exist(result);
        should.equal(typeof result, 'string');
      });
    });

    it('should produce consistent output for same input', function () {
      const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
      const result1 = utils.getBase64String(uint8Array);
      const result2 = utils.getBase64String(new Uint8Array([1, 2, 3, 4, 5]));
      result1.should.equal(result2);
    });
  });

  describe('Raw Transaction Validation', function () {
    it('should validate properly built transaction (base64)', async function () {
      const txBuilder = createTransferBuilderWithGas();
      const tx = await txBuilder.build();
      const rawTx = await tx.toBroadcastFormat();

      utils.isValidRawTransaction(rawTx).should.be.true();
    });

    it('should validate transaction as Uint8Array', async function () {
      const txBuilder = createTransferBuilderWithGas();
      const tx = await txBuilder.build();
      const rawTx = await tx.toBroadcastFormat();
      const rawTxBytes = Buffer.from(rawTx, 'base64');

      utils.isValidRawTransaction(rawTxBytes).should.be.true();
    });

    const invalidRawTxTestCases = [
      { tx: 'invalidRawTx', description: 'invalid string' },
      { tx: '', description: 'empty string' },
      { tx: '0x123456', description: 'hex format' },
      { tx: 'not-base64!!!', description: 'invalid base64' },
      { tx: Buffer.from('malformed data').toString('base64'), description: 'malformed data' },
    ];

    invalidRawTxTestCases.forEach(({ tx, description }) => {
      it(`should reject ${description}`, function () {
        utils.isValidRawTransaction(tx).should.be.false();
      });
    });
  });
});
