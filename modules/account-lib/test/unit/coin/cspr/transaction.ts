import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/cspr/transaction';
import * as testData from '../../../resources/cspr/cspr';
import { KeyPair } from '../../../../src/coin/cspr';

describe('Cspr Transaction', () => {
  const coin = coins.get('tcspr');

  const getTransaction = (): Transaction => {
    return new Transaction(coin);
  };

  it('should throw empty transaction', () => {
    const tx = getTransaction();
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign if transaction is', () => {
    it('invalid', function() {
      const tx = getTransaction();
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', async () => {
      const tx = getTransaction();
      // TODO tx.from()
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.privateKey });
      await tx.sign(keypair).should.be.fulfilled();
      // TODO Assert should equal
    });

    it('multiple valid', async () => {
      const tx = getTransaction();
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.privateKey });
      const keypair2 = new KeyPair({ prv: testData.ACCOUNT_2.privateKey });
      await tx.sign(keypair).should.be.fulfilled();
      // TODO ASSERTs
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = getTransaction();
      // TODO : tx.from(testData.WALLET_TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.WALLET_SIGNED_TRANSACTION);
    });
  });
});