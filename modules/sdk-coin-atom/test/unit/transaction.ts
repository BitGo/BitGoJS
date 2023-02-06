import { coins } from '@bitgo/statics';
import should from 'should';
import { Transaction } from '../../src';
import * as testData from '../resources/atom';

describe('Atom Transaction', () => {
  let tx: Transaction;
  const config = coins.get('tatom');

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
    it('should build a transfer from raw signed base64', function () {
      tx.fromRawTransaction(testData.TEST_TX.signedTxBase64);
      const json = tx.toJson();
      should.equal(json.signerAddress, testData.TEST_TX.sender);
    });
    it('should fail to build a transfer from incorrect raw hex', function () {
      should.throws(() => tx.fromRawTransaction('random' + testData.TEST_TX.signedTxBase64), 'incorrect raw data');
    });
    it('should fail to explain transaction with invalid raw hex', function () {
      should.throws(() => tx.fromRawTransaction('randomString'), 'Invalid transaction');
    });
  });

  describe('Explain transaction', () => {
    it('should explain a transfer pay transaction', function () {
      tx.fromRawTransaction(testData.TEST_TX.signedTxBase64);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: 'UNAVAILABLE_TEXT',
        outputs: [
          {
            address: testData.TEST_TX.recipient,
            amount: testData.TEST_TX.sendAmount,
          },
        ],
        outputAmount: testData.TEST_TX.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.TEST_TX.feeAmount },
        type: 0,
      });
    });
    it('should fail to explain transaction with invalid raw base64 string', function () {
      should.throws(() => tx.fromRawTransaction('randomString'), 'Invalid transaction');
    });
  });
});
