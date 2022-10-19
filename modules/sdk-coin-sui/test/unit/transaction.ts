import { coins } from '@bitgo/statics';
import should from 'should';
import { Transaction } from '../../src';
import * as testData from '../resources/sui';

describe('Sui Transaction', () => {
  let tx: Transaction;
  const config = coins.get('tsui');

  beforeEach(() => {
    tx = new Transaction(config);
  });

  describe('Empty transaction', () => {
    it('should throw empty transaction', function () {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
  });

  describe('From raw transaction', () => {
    it('should build a transfer from raw hex', function () {
      tx.fromRawTransaction(testData.TRANSFER_TX);
      const json = tx.toJson();
      should.equal(json.sender, testData.sender.address);
    });
    it('should fail to build a transfer from incorrect raw hex', function () {
      should.throws(() => tx.fromRawTransaction('random' + testData.TRANSFER_TX), 'incorrect raw data');
    });
  });

  describe('Explain transaction', () => {
    it('should explain a transfer transaction', function () {
      tx.fromRawTransaction(testData.TRANSFER_TX);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: 'UNAVAILABLE',
        outputs: [
          {
            address: testData.recipients[0],
            amount: testData.AMOUNT.toString(),
          },
        ],
        outputAmount: testData.AMOUNT,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.GAS_BUDGET.toString() },
        type: 0,
      });
    });

    it('should fail to explain transaction with invalid raw hex', function () {
      should.throws(() => tx.fromRawTransaction('randomString'), 'Invalid transaction');
    });
  });
});
