import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { KeyPair, Transaction } from '../../src';
import * as testData from '../resources/hbar';

describe('Hbar Transaction', () => {
  const coin = coins.get('thbar');

  /**
   *
   */
  function getTransaction(): Transaction {
    return new Transaction(coin);
  }

  it('should throw empty transaction', () => {
    const tx = getTransaction();
    assert.throws(() => {
      tx.toJson();
    });
    assert.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign if transaction is', () => {
    it('invalid', function () {
      const tx = getTransaction();
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', async () => {
      const tx = getTransaction();
      tx.bodyBytes(testData.WALLET_TXDATA);
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.prvKeyWithPrefix });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        Buffer.from(tx.hederaTx.sigMap!.sigPair![0].pubKeyPrefix!).toString('hex'),
        testData.ACCOUNT_1.pubKeyWithPrefix.slice(24)
      );
    });

    it('multiple valid', async () => {
      const tx = getTransaction();
      tx.bodyBytes(testData.WALLET_TXDATA);
      const keypair = new KeyPair({ prv: testData.ACCOUNT_1.prvKeyWithPrefix });
      const keypair2 = new KeyPair({ prv: testData.OPERATOR.privateKey });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(
        Buffer.from(tx.hederaTx.sigMap!.sigPair![0].pubKeyPrefix!).toString('hex'),
        testData.ACCOUNT_1.pubKeyWithPrefix.slice(24)
      );
      await tx.sign(keypair2).should.be.fulfilled();
      should.equal(
        Buffer.from(tx.hederaTx.sigMap!.sigPair![0].pubKeyPrefix!).toString('hex'),
        testData.ACCOUNT_1.pubKeyWithPrefix.slice(24)
      );
      should.equal(
        Buffer.from(tx.hederaTx.sigMap!.sigPair![1].pubKeyPrefix!).toString('hex'),
        testData.OPERATOR.publicKey.slice(24)
      );
    });
  });

  describe('should return encoded tx', function () {
    it('valid sign', async function () {
      const tx = getTransaction();
      tx.bodyBytes(testData.WALLET_TXDATA);
      await tx.sign(testData.KEYPAIR_PRV);
      should.equal(tx.toBroadcastFormat(), testData.WALLET_SIGNED_TRANSACTION);
    });
  });
});
