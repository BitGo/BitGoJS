import should from 'should';
import * as Utils from '../../../../src/coin/hbar/utils';

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
  });
});
