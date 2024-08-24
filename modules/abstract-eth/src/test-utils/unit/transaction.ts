import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../lib';
import Common from '@ethereumjs/common';

export function runTransactionTests(coinName: string, testData: any, common: Common) {
  describe(`${coinName} Transaction`, () => {
    const coin = testData.COIN;
    const coinConfig = coins.get(coin);

    /**
     * return a new transaction object
     */
    function getTransaction(): Transaction {
      return new Transaction(coinConfig, common);
    }

    describe('should throw ', () => {
      it('an empty transaction', () => {
        const tx = getTransaction();
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
        const tx = getTransaction();
        tx.setTransactionData(testData.TXDATA);
        should.deepEqual(tx.toJson(), testData.TXDATA);
        should.equal(tx.toBroadcastFormat(), testData.UNSIGNED_TX);
      });
    });

    describe('should sign', () => {
      it('invalid', () => {
        const tx = getTransaction();
        return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
      });

      it('valid', () => {
        const tx = getTransaction();
        tx.setTransactionData(testData.TXDATA);
        return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
      });
    });

    describe('should return encoded tx', () => {
      it('valid sign', async function () {
        const tx = getTransaction();
        tx.setTransactionData(testData.TXDATA);
        await tx.sign(testData.KEYPAIR_PRV);
        should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
      });
    });
  });
}
