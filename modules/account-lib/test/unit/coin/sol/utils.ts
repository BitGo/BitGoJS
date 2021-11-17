import should from 'should';
import { Utils } from '../../../../src/coin/sol';
import { addresses, blockHashes, prvKeys, pubKeys, signatures } from '../../../resources/sol/sol';

describe('SOL util library', function () {
  describe('isValidAddress', function () {
    it('should fail to validate invalid addresses', function () {
      for (const address of addresses.invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        should.equal(Utils.isValidAddress(address), false);
      }
    });

    it('should succeed to validate valid addresses', function () {
      for (const address of addresses.validAddresses) {
        should.equal(Utils.isValidAddress(address), true);
      }
    });
  });

  describe('isValidBlockId', function () {
    it('should fail to validate invalid Block hashes', function () {
      for (const blockHash of blockHashes.invalidBlockHashes) {
        should.doesNotThrow(() => Utils.isValidBlockId(blockHash));
        should.equal(Utils.isValidBlockId(blockHash), false);
      }
    });

    it('should succeed to validate valid Block hashes', function () {
      for (const blockHash of blockHashes.validBlockHashes) {
        should.equal(Utils.isValidBlockId(blockHash), true);
      }
    });
  });

  describe('isValidPublicKey', function () {
    it('should fail to validate invalid public keys', function () {
      for (const pubKey of pubKeys.invalidPubKeys) {
        should.doesNotThrow(() => Utils.isValidPublicKey(pubKey));
        should.equal(Utils.isValidPublicKey(pubKey), false);
      }
    });

    it('should succeed to validate public keys', function () {
      for (const pubKey of pubKeys.validPubKeys) {
        should.equal(Utils.isValidPublicKey(pubKey), true);
      }
    });
  });

  describe('isValidPrivateKey', function () {
    it('should fail to validate invalid private keys', function () {
      for (const prvKey of prvKeys.invalidPrvKeys) {
        should.doesNotThrow(() => Utils.isValidPrivateKey(prvKey));
        should.equal(Utils.isValidPrivateKey(prvKey), false);
      }
    });

    it('should succeed to validate private keys', function () {
      const validPrvKey = [prvKeys.prvKey1.base58, prvKeys.prvKey1.uint8Array];
      for (const prvKey of validPrvKey) {
        should.equal(Utils.isValidPrivateKey(prvKey), true);
      }
    });
  });

  describe('isValidSignature and isValidTransactionId', function () {
    it('should fail to validate invalid signatures', function () {
      for (const signature of signatures.invalidSignatures) {
        should.doesNotThrow(() => Utils.isValidSignature(signature));
        should.equal(Utils.isValidSignature(signature), false);
        should.doesNotThrow(() => Utils.isValidTransactionId(signature));
        should.equal(Utils.isValidTransactionId(signature), false);
      }
    });

    it('should succeed to validate valid signatures', function () {
      for (const signature of signatures.validSignatures) {
        should.equal(Utils.isValidSignature(signature), true);
        should.equal(Utils.isValidTransactionId(signature), true);
      }
    });
  });

  describe('base58 and Uint8Array encoding', function () {
    it('should succeed to base58ToUint8Array', function () {
      should.deepEqual(Utils.base58ToUint8Array(prvKeys.prvKey1.base58), prvKeys.prvKey1.uint8Array);
    });

    it('should succeed to Uint8ArrayTobase58', function () {
      should.deepEqual(Utils.Uint8ArrayTobase58(prvKeys.prvKey1.uint8Array), prvKeys.prvKey1.base58);
    });
  });

  describe('isValidAmount', function () {
    it('should succeed for valid amounts', function () {
      const validAmounts = ['0', '12312312'];
      for (const amount of validAmounts) {
        should.equal(Utils.isValidAmount(amount), true);
      }
    });

    it('should fail for invalid amounts', function () {
      const invalidAmounts = ['-1', 'randomstring', '33.04235'];
      for (const amount of invalidAmounts) {
        should.equal(Utils.isValidAmount(amount), false);
      }
    });
  });
});
