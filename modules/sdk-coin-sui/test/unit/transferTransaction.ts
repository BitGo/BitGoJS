import { coins } from '@bitgo/statics';
import should from 'should';
import { Transaction, TransferTransaction } from '../../src';
import * as testData from '../resources/sui';
import { TransferProgrammableTransaction } from '../../src/lib/iface';

describe('Sui Transfer Transaction', () => {
  let tx: Transaction<TransferProgrammableTransaction>;
  const config = coins.get('tsui');

  beforeEach(() => {
    tx = new TransferTransaction(config);
  });

  describe('Empty transaction', () => {
    it('should throw empty transaction', function () {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
  });

  describe('From raw transaction', () => {
    it('should build a transfer from raw hex', function () {
      tx.fromRawTransaction(testData.TRANSFER);
      const json = tx.toJson();
      should.equal(json.sender, testData.sender.address);
    });
    it('should fail to build a transfer from incorrect raw hex', function () {
      should.throws(() => tx.fromRawTransaction('random' + testData.TRANSFER), 'incorrect raw data');
    });
  });

  describe('Explain transaction', () => {
    it('should explain a transfer pay transaction', function () {
      tx.fromRawTransaction(testData.TRANSFER);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: 'BxoeGXbBCuw6VFEcgwHHUAKrCoAsGanPB39kdVVKZZcR',
        outputs: [
          {
            address: testData.recipients[0].address,
            amount: testData.recipients[0].amount,
          },
          {
            address: testData.recipients[1].address,
            amount: testData.recipients[1].amount,
          },
        ],
        outputAmount: testData.AMOUNT * 2,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.gasData.budget.toString() },
        type: 0,
      });
    });

    it('should fail to explain transaction with invalid raw hex', function () {
      should.throws(() => tx.fromRawTransaction('randomString'), 'Invalid transaction');
    });
  });
});
