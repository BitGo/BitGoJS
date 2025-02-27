import { Transaction } from '../../src';
import { coins } from '@bitgo/statics';
import assert from 'assert';
import should from 'should';
import { Utils } from '../../src/lib/utils';
import { InvalidTransactionError, TransactionType as BitGoTransactionType } from '@bitgo/sdk-core';
import { rawTransaction, accounts } from '../resources/icp';

describe('ICP Transaction', () => {
  let tx: Transaction;
  let utils: Utils;
  const config = coins.get('ticp');

  beforeEach(() => {
    utils = new Utils();
    tx = new Transaction(config, utils);
  });

  describe('empty transaction', () => {
    it('should throw an empty transaction error', () => {
      assert.throws(
        () => tx.toBroadcastFormat(),
        (err) => err instanceof InvalidTransactionError && err.message === 'Empty transaction',
        'Expected an InvalidTransactionError with message "Empty transaction"'
      );
      assert.throws(
        () => tx.toJson(),
        (err) => err instanceof InvalidTransactionError && err.message === 'Empty transaction',
        'Expected an InvalidTransactionError with message "Empty transaction"'
      );
    });
  });

  describe('from raw transaction', () => {
    it('build a json transaction from raw hex', async () => {
      tx.fromRawTransaction(JSON.stringify(rawTransaction));
      const json = tx.toJson();
      should.equal(json.expirationTime, rawTransaction.expiryTime);
      should.equal(json.memo, rawTransaction.seqno);
      should.equal(json.feeAmount, '-10000');
      should.equal(json.sender, rawTransaction.address);
      should.equal(json.recipient, rawTransaction.externalOutputs[0].address);
      should.equal(json.type, BitGoTransactionType.Send);
      should.equal(json.senderPublicKey, accounts.account1.publicKey);
    });
  });

  describe('Explain', () => {
    it('explain transaction', async () => {
      tx.fromRawTransaction(JSON.stringify(rawTransaction));
      const explain = tx.explainTransaction();

      explain.outputAmount.should.equal('10');
      explain.outputs[0].amount.should.equal('10');
      explain.outputs[0].address.should.equal(accounts.account2.address);
      explain.fee.fee.should.equal('-10000');
      explain.changeAmount.should.equal('0');
      if (explain.type !== undefined) {
        explain.type.should.equal(BitGoTransactionType.Send);
      }
    });
  });
});
