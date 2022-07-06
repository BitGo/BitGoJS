import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { StxLib } from '../../src';
import * as testData from './resources';

const { Transaction, KeyPair } = StxLib;

describe('Stx Transaction', () => {
  const coin = coins.get('tstx');

  it('should throw empty transaction', () => {
    const tx = new Transaction(coin);
    assert.throws(() => tx.toJson(), /Empty transaction/);
    assert.throws(() => tx.toBroadcastFormat(), /Empty transaction/);
  });

  describe('should sign if transaction is', () => {
    it('invalid', function () {
      const tx = new Transaction(coin);
      return tx.sign(testData.INVALID_KEYPAIR_PRV).should.be.rejected();
    });

    it('valid', async () => {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.TX_SENDER.prv });
      await tx.sign(keypair).should.be.fulfilled();
      should.equal(tx.inputs[0].address, testData.TX_SENDER.address);
      should.equal(tx.outputs[0].address, testData.TX_RECIEVER.address);
    });
  });

  describe('should return encoded tx', function () {
    it('valid sign', async function () {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      const keypair = new KeyPair({ prv: testData.TX_SENDER.prv });
      await tx.sign(keypair);
      should.equal(tx.toBroadcastFormat(), testData.SIGNED_TRANSACTION);
    });
  });

  describe('calculate transaction size', function () {
    it('expected size', async function () {
      const tx = new Transaction(coin);
      tx.fromRawTransaction(testData.RAW_TX_UNSIGNED);
      should.equal(tx.transactionSize(), testData.RAW_TX_UNSIGNED.length / 2);
    });
  });
});
