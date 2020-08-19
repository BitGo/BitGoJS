import should from 'should';
import * as Utils from '../../../../src/coin/hbar/utils';
import * as testData from '../../../resources/hbar/hbar';

describe('HBAR util library', function() {
  describe('address', function() {
    it('should validate addresses', function() {
      const validAddresses = ['0', '0.0.0', '99.99.99', '0.0.41098'];

      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function() {
      const invalidAddresses = ['0.0', '0.0.0.0', 'abc', 'a.b.c', ''];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddress(address).should.be.false();
      }
    });
  });

  describe('transaction id', function() {
    it('should validate tx ids', function() {
      const validHashes = ['0.0.14621@1595374723.356981689'];

      for (const hash of validHashes) {
        Utils.isValidTransactionId(hash).should.be.true();
      }
    });

    it('should fail to validate invalid tx ids', function() {
      const invalidHashes = ['0.0.14621', 'invalid', ''];

      for (const hash of invalidHashes) {
        Utils.isValidTransactionId(hash).should.be.false();
      }
    });

    it('should return an account in string format', function() {
      const accountIdObject = { shardnum: 0, realmnum: 0, accountnum: 14621 };
      Utils.stringifyAccountId(accountIdObject).should.be.equal('0.0.14621');
    });
  });

  describe('verify sign', function() {
    it('should validate if signature is valid', function() {
      const encodedTx = testData.TRANSFER_ENCODED_TX;
      const keypair = testData.KEYPAIR_PRV_TEST_TRANSFER;
      const signature = testData.SIGNATURE;

      Utils.validate(encodedTx, keypair, signature).should.be.equal(true);
    });

    it('should validate and receive false if signature is not part of keypair', function() {
      const encodedTx = testData.TRANSFER_ENCODED_TX;
      const keypair = testData.KEYPAIR_PRV_TEST_TRANSFER;
      const signature = testData.SIGNATURE2;

      Utils.validate(encodedTx, keypair, signature).should.be.equal(false);
    });

    it('should validate and receive false if encoded data does not have sign ', function() {
      const encodedTx = testData.TRANSFER_ENCODED_TX_WITHOUT_SIGN;
      const keypair = testData.KEYPAIR_PRV_TEST_TRANSFER;
      const signature = testData.SIGNATURE2;

      Utils.validate(encodedTx, keypair, signature).should.be.equal(false);
    });

    it('should validate and receive true if second signature is in encoded transaction', function() {
      const encodedTx = testData.TRANSFER_ENCODED_TX_SECOND_SIGN;
      const keypair = testData.KEYPAIR_PRV_TEST_TRANSFER_MULTI_SIG;
      const signature = testData.SECOND_SIGNATURE;

      Utils.validate(encodedTx, keypair, signature).should.be.equal(true);
    });
  });

  describe('transaction timestamp', function() {
    it('should validate tx timestamps', function() {
      const validTimestamps = ['1595374723.356981689', '1595374723'];

      for (const timestamp of validTimestamps) {
        Utils.isValidTimeString(timestamp).should.be.true();
      }
    });

    it('should fail to validate invalid tx timestamp', function() {
      const invalidTimestamp = ['0.0.14621', 'invalid', ''];

      for (const timestamp of invalidTimestamp) {
        Utils.isValidTimeString(timestamp).should.be.false();
      }
    });

    it('should return a timestamp in string format', function() {
      const timestampObject = { seconds: 1595374723, nanos: 356981689 };
      Utils.stringifyTxTime(timestampObject).should.be.equal('1595374723.356981689');
    });
  });

  describe('should remove prefix', function() {
    it('from a private key', function() {
      const rawPrivateKey = Utils.removePrefix(testData.ed25519PrivKeyPrefix, testData.ACCOUNT_1.prvKeyWithPrefix);
      should.deepEqual(rawPrivateKey, '62b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01');
    });

    it('from a public key', function() {
      const rawPublicKey = Utils.removePrefix(testData.ed25519PubKeyPrefix, testData.ACCOUNT_1.pubKeyWithPrefix);
      should.deepEqual(rawPublicKey, '5a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf9');
    });
  });

  describe('should return the same key', function() {
    it('from a private key without the prefix', function() {
      const rawPrivateKey = Utils.removePrefix(testData.ed25519PrivKeyPrefix, testData.ACCOUNT_2.privateKey);
      should.deepEqual(rawPrivateKey, testData.ACCOUNT_2.privateKey);
    });

    it('from a public key without the prefix', function() {
      const rawPublicKey = Utils.removePrefix(testData.ed25519PubKeyPrefix, testData.ACCOUNT_2.publicKey);
      should.deepEqual(rawPublicKey, testData.ACCOUNT_2.publicKey);
    });

    it('from a public key with chars of prefix in the middle', function() {
      const publicKey = '592a4fbb7263c59d450e651d' + testData.ed25519PubKeyPrefix + 'f96620dc9208ee7c';
      const rawPublicKey = Utils.removePrefix(testData.ed25519PubKeyPrefix, publicKey);
      should.deepEqual(rawPublicKey, publicKey);
    });

    it('from a private key with chars of prefix in the middle', function() {
      const privateKey = '5bb72603f237c099' + testData.ed25519PrivKeyPrefix + '3f7973d37fdade3c';
      const rawPrivateKey = Utils.removePrefix(testData.ed25519PrivKeyPrefix, privateKey);
      should.deepEqual(rawPrivateKey, privateKey);
    });
  });
});
