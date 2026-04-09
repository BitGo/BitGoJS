import { coins } from '@bitgo/statics';
import assert from 'assert';
import should from 'should';
import { Transaction } from '../../src';
import * as resources from '../resources';

describe('ADA Transaction', () => {
  let tx: Transaction;
  const config = coins.get('tada');

  beforeEach(() => {
    tx = new Transaction(config);
  });

  describe('empty transaction', () => {
    it('should throw empty transaction', () => {
      assert.throws(() => tx.toJson(), 'Empty transaction');
      assert.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
  });

  describe('sign transaction', () => {
    it('can sign', () => {
      should.deepEqual(tx.canSign({ key: resources.privateKeys.prvKey2 }), true);
    });
    it('cannot  sign', () => {
      should.deepEqual(tx.canSign({ key: resources.privateKeys.prvKey2 + '11' }), false);
    });
    it('cannot  sign', () => {
      should.deepEqual(tx.canSign({ key: 'afdsljadslkel23' }), false);
    });
  });

  describe('from raw transaction', () => {
    it('build a signed transfer from raw hex', async () => {
      tx.fromRawTransaction(resources.rawTx.signedTx);
      const json = tx.toJson();
      should.equal(json.id, '1d0ac4a6496847341ddfd5087db6a687157cc6cc8ec9f999e72fbbc581a34523');
    });

    it('build a transfer from incorrent raw data', async () => {
      assert.throws(() => tx.fromRawTransaction('11' + resources.rawTx.signedTx), 'incorrect raw data');
    });
  });

  describe('Explain', () => {
    it('a signed transfer transaction', async () => {
      tx.fromRawTransaction(resources.rawTx.signedTx);
      const explain = tx.explainTransaction();
      explain.id.should.equal('1d0ac4a6496847341ddfd5087db6a687157cc6cc8ec9f999e72fbbc581a34523');
      explain.outputAmount.should.equal('253329150');
      explain.outputs[0].amount.should.equal(resources.rawTx.outputAddress1.value);
      explain.outputs[0].address.should.equal(resources.rawTx.outputAddress1.address);
      explain.fee.fee.should.equal('167085');
      explain.changeAmount.should.equal('0');
    });

    it('an unsigned transfer transaction', async () => {
      tx.fromRawTransaction(resources.rawTx.unsignedTx);
      const explain = tx.explainTransaction();
      explain.id.should.equal('c091e2a0ac5a8bc4f522e69b2986d3a9b2b5615e6fcb7b265d0b8d449c03e591');
      explain.outputAmount.should.equal('253329150');
      explain.outputs[0].amount.should.equal(resources.rawTx.outputAddress1.value);
      explain.outputs[0].address.should.equal(resources.rawTx.outputAddress1.address);
      explain.fee.fee.should.equal('0');
      explain.changeAmount.should.equal('0');
    });
  });
});
