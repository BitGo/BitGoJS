import * as testData from '../resources/apt';
import should from 'should';
import utils from '../../src/lib/utils';
import { SignedTransaction, TransactionAuthenticatorFeePayer } from '@aptos-labs/ts-sdk';

describe('Aptos util library', function () {
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

  describe('isValidDeserialize', function () {
    it('should succeed to correctly deserialize serialized transaction', function () {
      const signedTxn: SignedTransaction = utils.deserializeSignedTransaction(testData.TRANSFER);
      const authenticator = signedTxn.authenticator as TransactionAuthenticatorFeePayer;
      should.equal(
        authenticator.fee_payer.address.toString(),
        '0xdbc87a1c816d9bcd06b683c37e80c7162e4d48da7812198b830e4d5d8e0629f2'
      );
    });
    it('should fail to deserialize an invalid serialized transaction', function () {
      should.throws(() => utils.deserializeSignedTransaction(testData.INVALID_TRANSFER));
    });
  });
});
