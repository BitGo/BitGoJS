import * as testData from '../resources/iota';
import should from 'should';
import utils from '../../src/lib/utils';

describe('Iota util library', function () {
  describe('isValidAddress', function () {
    it('should succeed to validate raw transactoin', function () {
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

  it('is valid public key', function () {
    // with 0x prefix
    should.equal(false, utils.isValidPublicKey('0x413f7fa8beb54459e1e9ede3af3b12e5a4a3550390bb616da30dd72017701263'));
    // without 0x prefix
    should.equal(true, utils.isValidPublicKey('b2051899478edeb36a79d1d16dfec56dc3a6ebd29fbbbb4a4ef2dfaf46043355'));
  });
});
