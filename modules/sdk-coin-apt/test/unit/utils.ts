import * as testData from '../resources/apt';
import should from 'should';
import utils from '../../src/lib/utils';
import { SignedTransaction } from '@aptos-labs/ts-sdk';

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

  describe('isValidRawTransaction', function () {
    it('should succeed to validate a valid raw transaction', function () {
      should.equal(utils.isValidRawTransaction(testData.TRANSFER), true);
    });
    it('should fail to validate an invalid raw transaction', function () {
      should.doesNotThrow(() => utils.isValidRawTransaction(testData.INVALID_TRANSFER));
      should.equal(utils.isValidRawTransaction(testData.INVALID_TRANSFER), false);
    });
  });

  describe('isValidDeserialize', function () {
    it('should succeed to correctly deserialize serialized transaction', function () {
      const signedTxn: SignedTransaction = utils.deserializeSignedTransaction(testData.TRANSFER);
      const rawTx = signedTxn.raw_txn;
      const recipient = utils.getRecipientFromTransactionPayload(rawTx.payload);
      should.equal(rawTx.sender.toString(), testData.sender3.address);
      should.equal(rawTx.max_gas_amount, 200000);
      should.equal(rawTx.gas_unit_price, 100);
      should.equal(rawTx.sequence_number, 146);
      should.equal(rawTx.expiration_timestamp_secs, 1737528215);
      should.equal(recipient.address, testData.recipients[0].address);
      should.equal(recipient.amount, testData.recipients[0].amount);
    });
    it('should fail to deserialize an invalid serialized transaction', function () {
      should.throws(() => utils.deserializeSignedTransaction(testData.INVALID_TRANSFER));
    });
  });
});
