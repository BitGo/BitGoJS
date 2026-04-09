import { CosmosTransaction, SendMessage } from '@bitgo/abstract-cosmos';
import { toHex, TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';
import { Transaction } from '../../src';
import utils from '../../src/lib/utils';
import * as testData from '../resources/mantra';

describe('Mantra Transaction', () => {
  let tx: Transaction;
  const config = coins.get('tmantra');

  beforeEach(() => {
    tx = new CosmosTransaction(config, utils);
  });

  describe('Empty transaction', () => {
    it('should throw empty transaction', function () {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
  });

  describe('From raw transaction', () => {
    it('should build a transfer from raw signed base64', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_SEND_TX.signedTxBase64);
      const json = tx.toJson();
      should.equal(json.sequence, testData.TEST_SEND_TX.sequence);
      should.deepEqual(json.gasBudget, testData.TEST_SEND_TX.gasBudget);
      should.equal(json.publicKey, toHex(fromBase64(testData.TEST_SEND_TX.pubKey)));
      should.equal(
        (json.sendMessages[0].value as SendMessage).toAddress,
        testData.TEST_SEND_TX.sendMessage.value.toAddress
      );
      should.deepEqual(
        (json.sendMessages[0].value as SendMessage).amount,
        testData.TEST_SEND_TX.sendMessage.value.amount
      );
      should.equal(Buffer.from(json.signature as any).toString('base64'), testData.TEST_SEND_TX.signature);
      should.equal(tx.type, TransactionType.Send);
      tx.loadInputsAndOutputs();
      should.deepEqual(tx.inputs, [
        {
          address: testData.TEST_SEND_TX.sender,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tmantra',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tmantra',
        },
      ]);
    });

    it('should build a transfer from raw signed hex', function () {
      tx.enrichTransactionDetailsFromRawTransaction(toHex(fromBase64(testData.TEST_SEND_TX.signedTxBase64)));
      const json = tx.toJson();
      should.equal(json.sequence, testData.TEST_SEND_TX.sequence);
      should.deepEqual(json.gasBudget, testData.TEST_SEND_TX.gasBudget);
      should.equal(json.publicKey, toHex(fromBase64(testData.TEST_SEND_TX.pubKey)));
      should.equal(
        (json.sendMessages[0].value as SendMessage).toAddress,
        testData.TEST_SEND_TX.sendMessage.value.toAddress
      );
      should.deepEqual(
        (json.sendMessages[0].value as SendMessage).amount,
        testData.TEST_SEND_TX.sendMessage.value.amount
      );
      should.equal(Buffer.from(json.signature as any).toString('base64'), testData.TEST_SEND_TX.signature);
      should.equal(tx.type, TransactionType.Send);
      tx.loadInputsAndOutputs();
      should.deepEqual(tx.inputs, [
        {
          address: testData.TEST_SEND_TX.sender,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tmantra',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tmantra',
        },
      ]);
    });

    it('should fail to build a transfer from incorrect raw hex', function () {
      should.throws(
        () => tx.enrichTransactionDetailsFromRawTransaction('random' + testData.TEST_SEND_TX.signedTxBase64),
        'incorrect raw data'
      );
    });
    it('should fail to explain transaction with invalid raw hex', function () {
      should.throws(() => tx.enrichTransactionDetailsFromRawTransaction('randomString'), 'Invalid transaction');
    });
  });

  describe('Explain transaction', () => {
    it('should explain a transfer pay transaction', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_SEND_TX.signedTxBase64);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: testData.TEST_SEND_TX.hash,
        outputs: [
          {
            address: testData.TEST_SEND_TX.recipient,
            amount: testData.TEST_SEND_TX.sendAmount,
          },
        ],
        outputAmount: testData.TEST_SEND_TX.sendAmount,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.TEST_SEND_TX.feeAmount },
        type: 0,
      });
    });
    it('should fail to explain transaction with invalid raw base64 string', function () {
      should.throws(() => tx.enrichTransactionDetailsFromRawTransaction('randomString'), 'Invalid transaction');
    });
  });
});
