import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/eth/transaction';
import * as testData from '../../../resources/eth/eth';

describe('ETH Transaction', () => {
  describe('should throw ', () => {
    it('an empty transaction', () => {
      const tx = new Transaction(coins.get('eth'));
      should.throws(() => tx.toJson());
      should.throws(() => tx.toBroadcastFormat());
    });
  });

  describe('should return', () => {
    it('a valid transaction', () => {
      const tx = new Transaction(coins.get('eth'), testData.TXDATA);
      should.deepEqual(tx.toJson(), testData.TXDATA);
      should.deepEqual(tx.toBroadcastFormat(), testData.UNSIGNED_TX);
    });
  });

  describe('should sign', () => {
    it('invalid', () => {
      const tx = new Transaction(coins.get('eth'));
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', () => {
      const tx = new Transaction(coins.get('eth'), testData.TXDATA);
      return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', () => {
    it('valid sign', async () => {
      const tx = new Transaction(coins.get('eth'), testData.TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
    });
  });
});
