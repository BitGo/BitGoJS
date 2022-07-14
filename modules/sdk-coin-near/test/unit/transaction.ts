import { coins } from '@bitgo/statics';
import assert from 'assert';
import should from 'should';
import { TransactionType } from '@bitgo/sdk-core';
import { Transaction } from '../../src';
import * as NearResources from '../resources/near';

describe('Near Transaction', () => {
  let tx: Transaction;
  const config = coins.get('tnear');

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
      should.deepEqual(tx.canSign({ key: NearResources.accounts.account2.secretKey }), true);
    });
    it('cannot  sign', () => {
      should.deepEqual(tx.canSign({ key: NearResources.accounts.account2.secretKey + '11' }), false);
    });
    it('cannot  sign', () => {
      should.deepEqual(tx.canSign({ key: 'afdsljadslkel23' }), false);
    });
  });

  describe('from raw transaction', () => {
    it('build a signed transfer from raw hex', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.signedHex);
      const json = tx.toJson();
      should.equal(json.signerId, NearResources.accounts.account1.address);
    });

    it('build a unsigned transfer from raw hex', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.unsignedHex);
      const json = tx.toJson();
      should.equal(json.signerId, NearResources.accounts.account1.address);
    });

    it('build a signed transfer from raw base64', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.signed);
      const json = tx.toJson();
      should.equal(json.signerId, NearResources.accounts.account1.address);
    });

    it('build a unsigned transfer from raw base64', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.unsigned);
      const json = tx.toJson();
      should.equal(json.signerId, NearResources.accounts.account1.address);
    });

    it('build a transfer from incorrent raw data', async () => {
      assert.throws(() => tx.fromRawTransaction('11' + NearResources.rawTx.transfer.signed), 'incorrect raw data');
    });
  });

  describe('Explain', () => {
    it('a signed transfer transaction', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.signed);
      const explain = tx.explainTransaction();
      explain.id.should.equal('5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw');
      /* TO-DO, fix amount calculation */
      explain.outputAmount.should.equal('1000000000000000000000000');
      explain.outputs[0].amount.should.equal('1000000000000000000000000');
      explain.outputs[0].address.should.equal(NearResources.accounts.account2.address);
      explain.fee.fee.should.equal('');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
    });

    it('an unsigned transfer transaction', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.unsigned);
      const explain = tx.explainTransaction();
      explain.id.should.equal('5jTEPuDcMCeEgp1iyEbNBKsnhYz4F4c1EPDtRmxm3wCw');
      explain.outputAmount.should.equal('1000000000000000000000000');
      explain.outputs[0].amount.should.equal('1000000000000000000000000');
      explain.outputs[0].address.should.equal(NearResources.accounts.account2.address);
      explain.fee.fee.should.equal('');
      explain.changeAmount.should.equal('0');
      explain.type.should.equal(TransactionType.Send);
    });
  });
});
