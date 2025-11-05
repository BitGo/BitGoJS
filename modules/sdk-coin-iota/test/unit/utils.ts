import * as testData from '../resources/iota';
import should from 'should';
import utils from '../../src/lib/utils';
import { TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';

describe('Iota util library', function () {
  describe('isValidAddress', function () {
    it('should succeed to validate addresses', function () {
      for (const address of testData.addresses.validAddresses) {
        should.equal(utils.isValidAddress(address), true);
      }
    });

    it('should fail to validate invalid addresses', function () {
      for (const address of testData.addresses.invalidAddresses) {
        should.doesNotThrow(() => utils.isValidAddress(address));
        should.equal(utils.isValidAddress(address), false);
      }
      // @ts-expect-error Testing for missing param, should not throw an error
      should.doesNotThrow(() => utils.isValidAddress(undefined));
      // @ts-expect-error Testing for missing param, should return false
      should.equal(utils.isValidAddress(undefined), false);
    });

    it('should validate addresses with correct length', function () {
      // IOTA addresses are 64 characters hex with 0x prefix
      const validAddress = '0x' + 'a'.repeat(64);
      should.equal(utils.isValidAddress(validAddress), true);
    });

    it('should reject addresses with incorrect length', function () {
      const shortAddress = '0x' + 'a'.repeat(32);
      const longAddress = '0x' + 'a'.repeat(128);
      should.equal(utils.isValidAddress(shortAddress), false);
      should.equal(utils.isValidAddress(longAddress), false);
    });

    it('should reject addresses without 0x prefix', function () {
      const addressWithoutPrefix = 'a'.repeat(64);
      should.equal(utils.isValidAddress(addressWithoutPrefix), false);
    });

    it('should reject addresses with non-hex characters', function () {
      const invalidHex = '0x' + 'g'.repeat(64);
      should.equal(utils.isValidAddress(invalidHex), false);
    });
  });

  describe('isValidPublicKey', function () {
    it('should validate correct public keys', function () {
      // without 0x prefix (64 hex chars)
      should.equal(true, utils.isValidPublicKey('b2051899478edeb36a79d1d16dfec56dc3a6ebd29fbbbb4a4ef2dfaf46043355'));
      should.equal(true, utils.isValidPublicKey(testData.sender.publicKey));
    });

    it('should reject public keys with 0x prefix', function () {
      should.equal(false, utils.isValidPublicKey('0x413f7fa8beb54459e1e9ede3af3b12e5a4a3550390bb616da30dd72017701263'));
    });

    it('should reject invalid public keys', function () {
      should.equal(false, utils.isValidPublicKey('invalid'));
      should.equal(false, utils.isValidPublicKey(''));
      should.equal(false, utils.isValidPublicKey('123'));
    });

    it('should reject public keys with incorrect length', function () {
      should.equal(false, utils.isValidPublicKey('a'.repeat(32))); // Too short
      should.equal(false, utils.isValidPublicKey('a'.repeat(128))); // Too long
    });
  });

  describe('isValidPrivateKey', function () {
    it('should validate ed25519 secret keys', function () {
      // Ed25519 secret keys (as used by tweetnacl) are 64 bytes (128 hex chars)
      // This includes the 32-byte seed + 32-byte public key
      const validSecretKey = '0'.repeat(128);
      should.equal(utils.isValidPrivateKey(validSecretKey), true);
    });

    it('should reject invalid private keys', function () {
      should.equal(utils.isValidPrivateKey('invalid'), false);
      should.equal(utils.isValidPrivateKey(''), false);
      should.equal(utils.isValidPrivateKey('123'), false);
    });

    it('should reject private keys with wrong length', function () {
      should.equal(utils.isValidPrivateKey('a'.repeat(32)), false); // Too short (16 bytes)
      should.equal(utils.isValidPrivateKey('a'.repeat(64)), false); // Seed length, not full secret key (32 bytes)
      should.equal(utils.isValidPrivateKey('a'.repeat(256)), false); // Too long (128 bytes)
    });
  });

  describe('isValidTransactionId', function () {
    it('should validate correct transaction IDs', function () {
      should.equal(true, utils.isValidTransactionId('BftEk3BeKUWTj9uzVGntd4Ka16QZG8hUnr6KsAb7q7bt'));
    });

    it('should reject invalid transaction IDs', function () {
      should.equal(
        false,
        utils.isValidTransactionId('0xff86b121181a43d03df52e8930785af3dda944ec87654cdba3a378ff518cd75b')
      );
      should.equal(false, utils.isValidTransactionId('BftEk3BeKUWTj9uzVGntd4Ka16QZG8hUnr6KsAb7q7b53t')); // Wrong length
    });

    it('should reject hex strings', function () {
      should.equal(false, utils.isValidTransactionId('0xabcdef123456'));
    });

    it('should reject empty strings', function () {
      should.equal(false, utils.isValidTransactionId(''));
    });
  });

  describe('isValidBlockId', function () {
    it('should validate correct block IDs', function () {
      should.equal(true, utils.isValidBlockId('GZXZvvLS3ZnuE4E9CxQJJ2ij5xeNsvUXdAKVrPCQKrPz'));
    });

    it('should reject invalid block IDs', function () {
      should.equal(false, utils.isValidBlockId('0x9ac6a0c313c4a0563a169dad29f1d018647683be54a314ed229a2693293dfc98'));
      should.equal(false, utils.isValidBlockId('GZXZvvLS3ZnuE4E9CxQJJ2ij5xeNsvUXdAK56VrPCQKrPz')); // Wrong length
    });

    it('should reject hex strings', function () {
      should.equal(false, utils.isValidBlockId('0xabcdef'));
    });

    it('should reject empty strings', function () {
      should.equal(false, utils.isValidBlockId(''));
    });
  });

  describe('isValidSignature', function () {
    it('should validate correct signatures', function () {
      should.equal(
        true,
        utils.isValidSignature(
          'iXrcUjgQgpYUsa7O90KZicdTmIdJSjB99+tJW6l6wPCqI/lUTou6sQ2sLoZgC0n4qQKX+vFDz+lBIXl7J/ZgCg=='
        )
      );
    });

    it('should reject invalid signatures', function () {
      should.equal(false, utils.isValidSignature('0x9ac6a0c313c4a0563a169dad29f1d018647683be54a314ed229a2693293dfc98'));
      should.equal(false, utils.isValidSignature('goppBTDgLuBbcU5tP90n3igvZGHmcE23HCoxLfdJwOCcbyztVh9r0TPacJRXmjZ6'));
    });

    it('should reject signatures with incorrect length', function () {
      should.equal(false, utils.isValidSignature('dG9vU2hvcnQ=')); // Too short base64
    });

    it('should reject non-base64 strings', function () {
      should.equal(false, utils.isValidSignature('not a base64 string!!!'));
      should.equal(false, utils.isValidSignature(''));
    });
  });

  describe('isValidHex', function () {
    it('should validate correct hex strings', function () {
      should.equal(true, utils.isValidHex('0xabcdef', 6));
      should.equal(true, utils.isValidHex('0x123456', 6));
      should.equal(true, utils.isValidHex('0XABCDEF', 6));
    });

    it('should reject hex strings with incorrect length', function () {
      should.equal(false, utils.isValidHex('0xabcd', 6));
      should.equal(false, utils.isValidHex('0xabcdefgh', 6));
    });

    it('should reject hex strings without prefix', function () {
      should.equal(false, utils.isValidHex('abcdef', 6));
    });

    it('should reject hex strings with non-hex characters', function () {
      should.equal(false, utils.isValidHex('0xghijkl', 6));
      should.equal(false, utils.isValidHex('0xabcdeg', 6));
    });

    it('should handle uppercase and lowercase', function () {
      should.equal(true, utils.isValidHex('0xABCDEF', 6));
      should.equal(true, utils.isValidHex('0xabcdef', 6));
      should.equal(true, utils.isValidHex('0xAbCdEf', 6));
    });
  });

  describe('getAddressFromPublicKey', function () {
    it('should generate valid address from public key', function () {
      const address = utils.getAddressFromPublicKey(testData.sender.publicKey);
      should.exist(address);
      should.equal(utils.isValidAddress(address), true);
    });

    it('should generate consistent addresses', function () {
      const address1 = utils.getAddressFromPublicKey(testData.sender.publicKey);
      const address2 = utils.getAddressFromPublicKey(testData.sender.publicKey);
      should.equal(address1, address2);
    });

    it('should generate different addresses for different keys', function () {
      const address1 = utils.getAddressFromPublicKey(testData.sender.publicKey);
      const address2 = utils.getAddressFromPublicKey(testData.gasSponsor.publicKey);
      should.notEqual(address1, address2);
    });
  });

  describe('isValidRawTransaction', function () {
    it('should validate proper raw transactions', async function () {
      const factory = new TransactionBuilderFactory(coins.get('tiota'));
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = await txBuilder.build();
      const rawTx = await tx.toBroadcastFormat();

      should.equal(utils.isValidRawTransaction(rawTx), true);
    });

    it('should validate raw transactions as Uint8Array', async function () {
      const factory = new TransactionBuilderFactory(coins.get('tiota'));
      const txBuilder = factory.getTransferBuilder();
      txBuilder.sender(testData.sender.address);
      txBuilder.recipients(testData.recipients);
      txBuilder.paymentObjects(testData.paymentObjects);
      txBuilder.gasData(testData.gasData);

      const tx = await txBuilder.build();
      const rawTx = await tx.toBroadcastFormat();
      const rawTxBytes = Buffer.from(rawTx, 'base64');

      should.equal(utils.isValidRawTransaction(rawTxBytes), true);
    });

    it('should reject invalid raw transactions', function () {
      should.equal(utils.isValidRawTransaction('invalidRawTx'), false);
      should.equal(utils.isValidRawTransaction(''), false);
      should.equal(utils.isValidRawTransaction('0x123456'), false);
    });

    it('should reject invalid base64 strings', function () {
      should.equal(utils.isValidRawTransaction('not-base64!!!'), false);
    });

    it('should reject malformed transaction data', function () {
      const malformedBase64 = Buffer.from('malformed data').toString('base64');
      should.equal(utils.isValidRawTransaction(malformedBase64), false);
    });
  });
});
