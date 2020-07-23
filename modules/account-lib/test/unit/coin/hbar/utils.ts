import * as Utils from "../../../../src/coin/hbar/utils";
import should from "should";

describe('HBAR util library', function() {
  describe('address', function () {
    it('should validate addresses', function () {
      const validAddresses = [
        '0',
        '0.0.0',
        '99.99.99',
        '0.0.41098',
      ];

      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function () {
      const invalidAddresses = [
        '0.0',
        '0.0.0.0',
        'abc',
        'a.b.c',
        '',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddress(address).should.be.false();
      }
    });
  });

  describe('transaction hash', function () {
    it('should validate tx hashes', function () {
      const validHashes = [
        '0.0.14621@1595374723.356981689',
      ];

      for (const hash of validHashes) {
        Utils.isValidTransactionId(hash).should.be.true();
      }
    });

    it('should fail to validate invalid tx hashes', function () {
      const invalidHashes = [
        '0.0.14621',
        'invalid',
        '',
      ];

      for (const hash of invalidHashes) {
        Utils.isValidTransactionId(hash).should.be.false();
      }
    });
  });
});
