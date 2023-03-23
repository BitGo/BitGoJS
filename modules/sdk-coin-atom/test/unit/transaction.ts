import { toHex, TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';

import { Transaction } from '../../src';
import { DelegateOrUndelegeteMessage, SendMessage, WithdrawDelegatorRewardsMessage } from '../../src/lib/iface';
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
          coin: 'tatom',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tatom',
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
          coin: 'tatom',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tatom',
        },
      ]);
    });

    it('should build a delegate txn from raw signed base64', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_DELEGATE_TX.signedTxBase64);
      const json = tx.toJson();
      should.equal(json.sequence, testData.TEST_DELEGATE_TX.sequence);
      should.deepEqual(json.gasBudget, testData.TEST_DELEGATE_TX.gasBudget);
      should.equal(Buffer.from(json.publicKey as any, 'hex').toString('base64'), testData.TEST_DELEGATE_TX.pubKey);
      should.equal(
        (json.sendMessages[0].value as DelegateOrUndelegeteMessage).validatorAddress,
        testData.TEST_DELEGATE_TX.sendMessage.value.validatorAddress
      );
      should.deepEqual(
        (json.sendMessages[0].value as DelegateOrUndelegeteMessage).amount,
        testData.TEST_DELEGATE_TX.sendMessage.value.amount
      );
      should.equal(Buffer.from(json.signature as any).toString('base64'), testData.TEST_DELEGATE_TX.signature);
      should.equal(tx.type, TransactionType.StakingActivate);
      tx.loadInputsAndOutputs();
      should.deepEqual(tx.inputs, [
        {
          address: testData.TEST_DELEGATE_TX.delegator,
          value: testData.TEST_DELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tatom',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_DELEGATE_TX.validator,
          value: testData.TEST_DELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tatom',
        },
      ]);
    });

    it('should build a undelegate txn from raw signed base64', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_UNDELEGATE_TX.signedTxBase64);
      const json = tx.toJson();
      should.equal(json.sequence, testData.TEST_UNDELEGATE_TX.sequence);
      should.deepEqual(json.gasBudget, testData.TEST_UNDELEGATE_TX.gasBudget);
      should.equal(Buffer.from(json.publicKey as any, 'hex').toString('base64'), testData.TEST_UNDELEGATE_TX.pubKey);
      should.equal(
        (json.sendMessages[0].value as DelegateOrUndelegeteMessage).validatorAddress,
        testData.TEST_UNDELEGATE_TX.sendMessage.value.validatorAddress
      );
      should.deepEqual(
        (json.sendMessages[0].value as DelegateOrUndelegeteMessage).amount,
        testData.TEST_UNDELEGATE_TX.sendMessage.value.amount
      );
      should.equal(Buffer.from(json.signature as any).toString('base64'), testData.TEST_UNDELEGATE_TX.signature);
      should.equal(tx.type, TransactionType.StakingDeactivate);
      tx.loadInputsAndOutputs();
      should.deepEqual(tx.inputs, [
        {
          address: testData.TEST_UNDELEGATE_TX.delegator,
          value: testData.TEST_UNDELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tatom',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_UNDELEGATE_TX.validator,
          value: testData.TEST_UNDELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tatom',
        },
      ]);
    });

    it('should build a withdraw rewards from raw signed base64', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_WITHDRAW_REWARDS_TX.signedTxBase64);
      const json = tx.toJson();
      should.equal(json.sequence, testData.TEST_WITHDRAW_REWARDS_TX.sequence);
      should.deepEqual(json.gasBudget, testData.TEST_WITHDRAW_REWARDS_TX.gasBudget);
      should.equal(
        Buffer.from(json.publicKey as any, 'hex').toString('base64'),
        testData.TEST_WITHDRAW_REWARDS_TX.pubKey
      );
      should.equal(
        (json.sendMessages[0].value as WithdrawDelegatorRewardsMessage).validatorAddress,
        testData.TEST_WITHDRAW_REWARDS_TX.sendMessage.value.validatorAddress
      );
      should.equal(Buffer.from(json.signature as any).toString('base64'), testData.TEST_WITHDRAW_REWARDS_TX.signature);
      should.equal(tx.type, TransactionType.StakingWithdraw);

      tx.loadInputsAndOutputs();
      should.deepEqual(tx.inputs, [
        {
          address: testData.TEST_WITHDRAW_REWARDS_TX.delegator,
          value: 'UNAVAILABLE',
          coin: 'tatom',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_WITHDRAW_REWARDS_TX.validator,
          value: 'UNAVAILABLE',
          coin: 'tatom',
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
