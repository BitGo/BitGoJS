import should from 'should';
import { Transaction as VetTransaction } from '@vechain/sdk-core';
import * as testData from '../resources/vet';
import utils from '../../src/lib/utils';
import { TransactionType } from '@bitgo/sdk-core';

describe('Vechain util library', function () {
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
    it('should succeed to correctly deserialize sponsored signed serialized transaction', function () {
      const signedTxn: VetTransaction = utils.deserializeTransaction(testData.SPONSORED_TRANSACTION);
      should.equal(signedTxn.gasPayer.toString().toLowerCase(), '0xdc9fef0b84a0ccf3f1bd4b84e41743e3e051a083');
    });
    it('should succeed to correctly deserialize unsigned serialized transaction', function () {
      const signedTxn: VetTransaction = utils.deserializeTransaction(testData.UNSIGNED_TRANSACTION);
      should.equal(signedTxn.origin.toString().toLowerCase(), '0x7ca00e3bc8a836026c2917c6c7c6d049e52099dd');
    });
    it('should fail to deserialize an invalid serialized transaction', function () {
      should.throws(() => utils.deserializeTransaction(testData.INVALID_TRANSACTION));
    });
  });

  it('should get correct transaction type from clause', function () {
    should.equal(TransactionType.Send, utils.getTransactionTypeFromClause(testData.TRANSFER_CLAUSE));
  });

  it('is valid public key', function () {
    // with 0x prefix
    should.equal(false, utils.isValidPublicKey('0x9b4e96086d111500259f9b38680b0509a405c1904da18976455a20c691d3bb07'));
    // without 0x prefix
    should.equal(true, utils.isValidPublicKey('029831d82c36a58a69b31177b73d852e260a37769561450dab6ed234d5d965ef0b'));
  });
});
