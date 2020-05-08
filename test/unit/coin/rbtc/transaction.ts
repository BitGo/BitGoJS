import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/rbtc/transaction';
import * as testData from '../../../resources/rbtc/rbtc';

describe('Rbtc Transaction', function() {
  describe('should throw empty transaction', function() {
    const tx = new Transaction(coins.get('rbtc'));
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should return valid transaction', function() {
    const tx = new Transaction(coins.get('rbtc'));
    tx.setTransactionData(testData.TXDATA);
    should.equal(tx.toJson(), testData.TXDATA);
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign', function() {
    it('invalid', function() {
      const tx = new Transaction(coins.get('rbtc'));
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });
    it('valid', function() {
      const tx = new Transaction(coins.get('rbtc'));
      tx.setTransactionData(testData.TXDATA);
      return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = new Transaction(coins.get('rbtc'));
      tx.setTransactionData(testData.TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
    });
  });
});
