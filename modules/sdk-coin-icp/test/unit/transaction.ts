import { Transaction } from '../../src';
import { coins } from '@bitgo/statics';
import assert from 'assert';
// import should from 'should';
import { Utils } from '../../src/lib/utils';
import { InvalidTransactionError } from '@bitgo/sdk-core';
// import { rawTransaction, accounts, parsedRawTransaction } from '../resources/icp';
import sinon from 'sinon';

describe('ICP Transaction', () => {
  let tx: Transaction;
  let utils: Utils;
  // let localRawTransaction: any;
  const config = coins.get('ticp');

  beforeEach(() => {
    utils = new Utils();
    tx = new Transaction(config, utils);
    // localRawTransaction = JSON.stringify(rawTransaction);
    sinon.stub(utils, 'validateExpireTime').returns(true);
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

  // describe('from raw transaction', () => {
  //   it('build a json transaction from raw hex', async () => {
  //     await tx.fromRawTransaction(localRawTransaction);
  //     const json = tx.toJson();
  //     should.equal(json.memo, parsedRawTransaction.metadata.memo);
  //     should.equal(json.feeAmount, parsedRawTransaction.operations[2].amount.value);
  //     should.equal(json.sender, parsedRawTransaction.operations[0].account.address);
  //     should.equal(json.recipient, parsedRawTransaction.operations[1].account.address);
  //     should.equal(json.type, BitGoTransactionType.Send);
  //     should.equal(json.senderPublicKey, accounts.account1.publicKey);
  //   });
  // });

  // describe('Explain', () => {
  //   it('explain transaction', async () => {
  //     await tx.fromRawTransaction(localRawTransaction);
  //     const explain = tx.explainTransaction();

  //     explain.outputAmount.should.equal('1000000');
  //     explain.outputs[0].amount.should.equal('1000000');
  //     explain.outputs[0].address.should.equal(accounts.account2.address);
  //     explain.fee.fee.should.equal('-10000');
  //     explain.changeAmount.should.equal('0');
  //     if (explain.displayOrder !== undefined) {
  //       explain.displayOrder.should.deepEqual([
  //         'id',
  //         'outputAmount',
  //         'changeAmount',
  //         'outputs',
  //         'changeOutputs',
  //         'fee',
  //       ]);
  //     }
  //     if (explain.type !== undefined) {
  //       explain.type.should.equal(BitGoTransactionType.Send);
  //     }
  // });
  // });
});
