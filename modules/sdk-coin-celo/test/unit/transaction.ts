import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src';
import * as testData from '../resources/celo';
import { getCommon } from '../../src/lib/utils';

describe('Celo Transaction', function () {
  const coin = coins.get('celo');
  const common = getCommon(coin.network.type);

  /**
   *
   */
  function getTransaction(): Transaction {
    return new Transaction(coin, common);
  }

  it('should throw empty transaction', function () {
    const tx = getTransaction();
    assert.throws(() => {
      tx.toJson();
    });
    assert.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  it('should return valid transaction', function () {
    const tx = getTransaction();
    tx.setTransactionData(testData.TXDATA);
    should.deepEqual(tx.toJson(), testData.TXDATA);
    should.equal(tx.toBroadcastFormat(), testData.UNSIGNED_TX);
  });

  describe('should sign', function () {
    it('invalid', function () {
      const tx = getTransaction();
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', function () {
      const tx = getTransaction();
      tx.setTransactionData(testData.TXDATA);
      return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function () {
    it('valid sign', async function () {
      const tx = getTransaction();
      tx.setTransactionData(testData.TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
    });
  });
});
