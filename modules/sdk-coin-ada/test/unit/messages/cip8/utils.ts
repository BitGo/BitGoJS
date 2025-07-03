import { Buffer } from 'buffer';
import should from 'should';
import * as CardanoSL from '@emurgo/cardano-serialization-lib-nodejs';
import { Encoder } from 'cbor-x';

import { cip8TestResources } from '../../../resources/cip8Resources';
import {
  bytesToHex,
  createCSLSigStructure,
  constructCSLCoseObjects,
  coseObjectsOutputToBuffer,
  bufferToCoseObjectsOutput,
} from '../../../../src/lib/messages/cip8/utils';

describe('CIP8 Utils', function () {
  let cborEncoder: Encoder;
  let addressCborBytes: Uint8Array;

  before(function () {
    cborEncoder = cip8TestResources.getCborEncoder();
    const address = CardanoSL.Address.from_bech32(cip8TestResources.address.bech32);
    addressCborBytes = address.to_bytes();
  });

  describe('bytesToHex', function () {
    it('should convert Uint8Array to hex string', function () {
      const bytes = new Uint8Array([0, 1, 10, 15, 255]);
      const hex = bytesToHex(bytes);
      should.equal(hex, '00010a0fff');
    });

    it('should convert Buffer to hex string', function () {
      const buffer = Buffer.from([0, 1, 10, 15, 255]);
      const hex = bytesToHex(buffer);
      should.equal(hex, '00010a0fff');
    });

    it('should return empty string for empty input', function () {
      const bytes = new Uint8Array([]);
      const hex = bytesToHex(bytes);
      should.equal(hex, '');
    });
  });

  describe('createCSLSigStructure', function () {
    it('should create valid signature structure', function () {
      const message = 'Hello, Cardano!';
      const result = createCSLSigStructure(addressCborBytes, message, cborEncoder);

      should.exist(result.sigStructureCborBytes);
      should.exist(result.protectedHeaderCborBytes);
      should.exist(result.payloadBytes);

      // Verify payload bytes match original message
      should.equal(result.payloadBytes.toString('utf-8'), message);

      // Verify structure of protected header
      const decodedHeader = cborEncoder.decode(result.protectedHeaderCborBytes);
      should.exist(decodedHeader);
      should.equal(decodedHeader.get(1), -8); // Algorithm ID: EdDSA
      should.exist(decodedHeader.get('address')); // Address should be present

      // Verify structure of sig_structure
      const decodedSigStructure = cborEncoder.decode(result.sigStructureCborBytes);
      should.exist(decodedSigStructure);
      should.equal(decodedSigStructure[0], 'Signature1');
      should.deepEqual(decodedSigStructure[1], Buffer.from(result.protectedHeaderCborBytes));
      should.deepEqual(decodedSigStructure[2], Buffer.from([]));
      should.deepEqual(decodedSigStructure[3], Buffer.from(message, 'utf-8'));
    });

    it('should handle empty message', function () {
      const message = '';
      const result = createCSLSigStructure(addressCborBytes, message, cborEncoder);

      should.exist(result);
      should.equal(result.payloadBytes.toString('utf-8'), '');
      should.equal(result.payloadBytes.length, 0);
    });
  });

  describe('constructCSLCoseObjects', function () {
    it('should construct valid COSE objects', function () {
      const message = 'Hello, Cardano!';
      const { protectedHeaderCborBytes, payloadBytes } = createCSLSigStructure(addressCborBytes, message, cborEncoder);

      const signatureBytes = cip8TestResources.createTestSignature(message);
      const pubKey = cip8TestResources.createTestPublicKey();

      const result = constructCSLCoseObjects(
        protectedHeaderCborBytes,
        payloadBytes,
        signatureBytes,
        pubKey,
        cborEncoder
      );

      should.exist(result.manualCoseSign1Hex);
      should.exist(result.manualCoseKeyHex);

      should.ok(result.manualCoseSign1Hex.length > 0);
      should.ok(result.manualCoseKeyHex.length > 0);
    });
  });

  describe('coseObjectsOutputToBuffer and bufferToCoseObjectsOutput', function () {
    it('should convert CSLCoseObjectsOutput to buffer and back', function () {
      const message = 'Hello, Cardano!';
      const { protectedHeaderCborBytes, payloadBytes } = createCSLSigStructure(addressCborBytes, message, cborEncoder);

      const signatureBytes = cip8TestResources.createTestSignature(message);
      const pubKey = cip8TestResources.createTestPublicKey();

      const originalObjects = constructCSLCoseObjects(
        protectedHeaderCborBytes,
        payloadBytes,
        signatureBytes,
        pubKey,
        cborEncoder
      );

      const buffer = coseObjectsOutputToBuffer(originalObjects, cborEncoder);
      should.ok(buffer.length > 0);

      const reconstructedObjects = bufferToCoseObjectsOutput(buffer, cborEncoder);
      should.exist(reconstructedObjects);
      should.equal(reconstructedObjects.manualCoseSign1Hex, originalObjects.manualCoseSign1Hex);
      should.equal(reconstructedObjects.manualCoseKeyHex, originalObjects.manualCoseKeyHex);
    });
  });
});
