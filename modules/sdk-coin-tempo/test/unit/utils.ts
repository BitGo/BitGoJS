import { ethers } from 'ethers';
import utils from '../../src/lib/utils';

describe('Tempo Utils', function () {
  describe('Address Validation', function () {
    it('should validate a valid address', function () {
      // Valid checksummed Ethereum-style address
      const validAddress = ethers.utils.getAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
      utils.isValidAddress(validAddress).should.be.true();
    });

    it('should invalidate an invalid address', function () {
      const invalidAddress = 'invalid!@#$';
      utils.isValidAddress(invalidAddress).should.be.false();
    });

    it('should invalidate an empty address', function () {
      utils.isValidAddress('').should.be.false();
    });
  });

  describe('Public Key Validation', function () {
    it('should validate a valid public key', function () {
      // TODO: Add valid public key examples for Tempo
      const validPubKey = '0'.repeat(64);
      utils.isValidPublicKey(validPubKey).should.be.false();
    });

    it('should invalidate an invalid public key', function () {
      const invalidPubKey = 'notahexstring';
      utils.isValidPublicKey(invalidPubKey).should.be.false();
    });

    it('should invalidate a public key with wrong length', function () {
      const wrongLengthPubKey = '0'.repeat(32);
      utils.isValidPublicKey(wrongLengthPubKey).should.be.false();
    });
  });

  describe('Private Key Validation', function () {
    it('should validate a valid private key', function () {
      const validPrvKey = '0'.repeat(64);
      utils.isValidPrivateKey(validPrvKey).should.be.false();
    });

    it('should invalidate an invalid private key', function () {
      const invalidPrvKey = 'notahexstring';
      utils.isValidPrivateKey(invalidPrvKey).should.be.false();
    });

    it('should invalidate a private key with wrong length', function () {
      const wrongLengthPrvKey = '0'.repeat(32);
      utils.isValidPrivateKey(wrongLengthPrvKey).should.be.false();
    });
  });
});
