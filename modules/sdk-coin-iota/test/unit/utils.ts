import * as testData from '../resources/iota';
import should from 'should';
import utils from '../../src/lib/utils';

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
  });

  it('is valid public key', function () {
    // with 0x prefix
    should.equal(false, utils.isValidPublicKey('0x413f7fa8beb54459e1e9ede3af3b12e5a4a3550390bb616da30dd72017701263'));
    // without 0x prefix
    should.equal(true, utils.isValidPublicKey('b2051899478edeb36a79d1d16dfec56dc3a6ebd29fbbbb4a4ef2dfaf46043355'));
  });

  it('is valid tx id', function () {
    should.equal(
      false,
      utils.isValidTransactionId('0xff86b121181a43d03df52e8930785af3dda944ec87654cdba3a378ff518cd75b')
    );
    should.equal(false, utils.isValidTransactionId('BftEk3BeKUWTj9uzVGntd4Ka16QZG8hUnr6KsAb7q7b53t'));
    should.equal(true, utils.isValidTransactionId('BftEk3BeKUWTj9uzVGntd4Ka16QZG8hUnr6KsAb7q7bt'));
  });

  it('is valid block id', function () {
    should.equal(false, utils.isValidBlockId('0x9ac6a0c313c4a0563a169dad29f1d018647683be54a314ed229a2693293dfc98'));
    should.equal(false, utils.isValidBlockId('GZXZvvLS3ZnuE4E9CxQJJ2ij5xeNsvUXdAK56VrPCQKrPz'));
    should.equal(true, utils.isValidBlockId('GZXZvvLS3ZnuE4E9CxQJJ2ij5xeNsvUXdAKVrPCQKrPz'));
  });

  it('is valid signature', function () {
    should.equal(false, utils.isValidSignature('0x9ac6a0c313c4a0563a169dad29f1d018647683be54a314ed229a2693293dfc98'));
    should.equal(false, utils.isValidSignature('goppBTDgLuBbcU5tP90n3igvZGHmcE23HCoxLfdJwOCcbyztVh9r0TPacJRXmjZ6'));
    should.equal(
      true,
      utils.isValidSignature('iXrcUjgQgpYUsa7O90KZicdTmIdJSjB99+tJW6l6wPCqI/lUTou6sQ2sLoZgC0n4qQKX+vFDz+lBIXl7J/ZgCg==')
    );
  });
});
