import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/eth';
import * as testData from '../../../resources/eth/eth';
import { getCommon } from '../../../../src/coin/eth/utils';
import { TxData } from '../../../../src/coin/eth/iface';

describe('ETH Transaction', () => {
  const coinConfig = coins.get('teth');
  const common = getCommon(coinConfig.network.type);
  /**
   * @param data
   */
  function getTransaction(data?: TxData) {
    return new Transaction(coinConfig, common, data);
  }

  describe('should throw ', () => {
    it('an empty transaction', () => {
      const tx = getTransaction();
      should.throws(() => tx.toJson());
      should.throws(() => tx.toBroadcastFormat());
    });
  });

  describe('should return', () => {
    it('a valid transaction', () => {
      const tx = getTransaction(testData.TXDATA);
      should.deepEqual(tx.toJson(), testData.TXDATA);
      should.deepEqual(tx.toBroadcastFormat(), testData.UNSIGNED_TX);
    });
  });

  describe('should sign', () => {
    it('invalid', () => {
      const tx = getTransaction();
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', () => {
      const tx = getTransaction(testData.TXDATA);
      return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', () => {
    it('valid sign', async () => {
      const tx = getTransaction(testData.TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.ENCODED_TRANSACTION);
    });
  });
});
