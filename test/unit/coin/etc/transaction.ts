import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/etc/transaction';
import * as testData from '../../../resources/etc/etc';

describe('Etc Transaction', () => {
  describe('should throw ', () => {
    it('an empty transaction', () => {
      const tx = new Transaction(coins.get('etc'));
      should.throws(() => {
        tx.toJson();
      });
      should.throws(() => {
        tx.toBroadcastFormat();
      });
    });
  });

  describe('should return', () => {
    it('a valid transaction', () => {
      const tx = new Transaction(coins.get('etc'));
      tx.setTransactionData(testData.TXDATA);
      should.deepEqual(tx.toJson(), testData.TXDATA);
      should.equal(tx.toBroadcastFormat(), testData.UNSIGNED_TX);
    });
  });

  describe('should sign', () => {
    it('invalid', () => {
      const tx = new Transaction(coins.get('etc'));
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', () => {
      const tx = new Transaction(coins.get('etc'));
      tx.setTransactionData(testData.TXDATA);
      return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', () => {
    it('valid sign', async () => {
      const tx = new Transaction(coins.get('etc'));
      tx.setTransactionData(testData.TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
    });
  });
});
