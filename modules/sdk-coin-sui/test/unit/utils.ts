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
      should.equal(utils.isValidRawTransaction(testData.TRANSFER_TX), true);
    });
    it('should fail to validate an invalid raw transaction', function () {
      should.doesNotThrow(() => utils.isValidRawTransaction(testData.INVALID_RAW_TX));
      should.equal(utils.isValidRawTransaction(testData.INVALID_RAW_TX), false);
    });
  });
});
