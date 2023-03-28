import should from 'should';
import * as testData from '../resources/sui';
import utils from '../../src/lib/utils';

describe('Sui util library', function () {
  describe('isValidAddress', function () {
    it('should succeed to validate valid address', function () {
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
  });

  describe('isValidRawTransaction', function () {
    it('should succeed to validate a valid raw transaction', function () {
      should.equal(utils.isValidRawTransaction(testData.TRANSFER), true);
    });
    it('should fail to validate an invalid raw transaction', function () {
      should.doesNotThrow(() => utils.isValidRawTransaction(testData.INVALID_RAW_TX));
      should.equal(utils.isValidRawTransaction(testData.INVALID_RAW_TX), false);
    });
  });

  describe('normalizeHexId', function () {
    it('should succeed to normalize hexId with no prefix', function () {
      const hexId = 'cba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      const expectedNormalized = '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      should.equal(utils.normalizeHexId(hexId), expectedNormalized);
    });
    it('should return the hexId with prefix already', function () {
      const hexId = '0xcba4a48bb0f8b586c167e5dcefaa1c5e96ab3f08';
      should.equal(utils.normalizeHexId(hexId), hexId);
    });
  });
});
