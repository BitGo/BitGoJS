import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/cgld/transaction';
import * as testData from '../../../resources/cgld/cgld';

describe('Celo Transaction', function() {
  it('should throw empty transaction', function() {
    const tx = new Transaction(coins.get('cgld'));
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  it('should return valid transaction', function() {
    const tx = new Transaction(coins.get('cgld'));
    tx.setTransactionData(testData.TXDATA);
    should.deepEqual(tx.toJson(), testData.TXDATA);
    should.equal(tx.toBroadcastFormat(), testData.UNSIGNED_TX);
  });

  describe('should sign', function() {
    it('invalid', function() {
      const tx = new Transaction(coins.get('cgld'));
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });
    it('valid', function() {
      const tx = new Transaction(coins.get('cgld'));
      tx.setTransactionData(testData.TXDATA);
      return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = new Transaction(coins.get('cgld'));
      tx.setTransactionData(testData.TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
    });
  });
});
