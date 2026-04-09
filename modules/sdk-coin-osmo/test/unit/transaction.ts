import { toHex, TransactionType } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { fromBase64 } from '@cosmjs/encoding';
import should from 'should';

import {
  CosmosTransaction,
  DelegateOrUndelegeteMessage,
  ExecuteContractMessage,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
} from '@bitgo/abstract-cosmos';
import utils from '../../src/lib/utils';
import * as testData from '../resources/osmo';

describe('Osmo Transaction', () => {
  let tx: CosmosTransaction;
  const config = coins.get('tosmo');

  beforeEach(() => {
    tx = new CosmosTransaction(config, utils);
  });

  describe('Empty transaction', () => {
    it('should throw empty transaction', function () {
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
          address: testData.TEST_SEND_TX.from,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tosmo',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tosmo',
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
          address: testData.TEST_SEND_TX.from,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tosmo',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_SEND_TX.sendMessage.value.toAddress,
          value: testData.TEST_SEND_TX.sendMessage.value.amount[0].amount,
          coin: 'tosmo',
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
          address: testData.TEST_DELEGATE_TX.from,
          value: testData.TEST_DELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tosmo',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_DELEGATE_TX.to,
          value: testData.TEST_DELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tosmo',
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
          address: testData.TEST_UNDELEGATE_TX.from,
          value: testData.TEST_UNDELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tosmo',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_UNDELEGATE_TX.to,
          value: testData.TEST_UNDELEGATE_TX.sendMessage.value.amount.amount,
          coin: 'tosmo',
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
          address: testData.TEST_WITHDRAW_REWARDS_TX.from,
          value: 'UNAVAILABLE',
          coin: 'tosmo',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_WITHDRAW_REWARDS_TX.to,
          value: 'UNAVAILABLE',
          coin: 'tosmo',
        },
      ]);
    });

    it('should build a execute contract from raw signed base64', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_EXECUTE_CONTRACT_TRANSACTION.signedTxBase64);
      const json = tx.toJson();
      should.equal(json.sequence, testData.TEST_EXECUTE_CONTRACT_TRANSACTION.sequence);
      should.deepEqual(json.gasBudget, testData.TEST_EXECUTE_CONTRACT_TRANSACTION.gasBudget);
      should.equal(
        Buffer.from(json.publicKey as any, 'hex').toString('base64'),
        testData.TEST_EXECUTE_CONTRACT_TRANSACTION.pubKey
      );
      should.equal(
        (json.sendMessages[0].value as ExecuteContractMessage).contract,
        testData.TEST_EXECUTE_CONTRACT_TRANSACTION.message.value.contract
      );
      should.equal(
        Buffer.from(json.signature as any).toString('base64'),
        testData.TEST_EXECUTE_CONTRACT_TRANSACTION.signature
      );
      should.equal(tx.type, TransactionType.ContractCall);

      tx.loadInputsAndOutputs();
      should.deepEqual(tx.inputs, [
        {
          address: testData.TEST_EXECUTE_CONTRACT_TRANSACTION.from,
          value: '0',
          coin: 'tosmo',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.TEST_EXECUTE_CONTRACT_TRANSACTION.to,
          value: '0',
          coin: 'tosmo',
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
            address: testData.TEST_SEND_TX.to,
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

    it('should explain a execute contract transaction', function () {
      tx.enrichTransactionDetailsFromRawTransaction(testData.TEST_EXECUTE_CONTRACT_TRANSACTION.signedTxBase64);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'type'],
        id: testData.TEST_EXECUTE_CONTRACT_TRANSACTION.hash,
        outputs: [
          {
            address: testData.TEST_EXECUTE_CONTRACT_TRANSACTION.to,
            amount: '0',
          },
        ],
        outputAmount: '0',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.TEST_EXECUTE_CONTRACT_TRANSACTION.feeAmount },
        type: 16,
      });
    });

    it('should fail to explain transaction with invalid raw base64 string', function () {
      should.throws(() => tx.enrichTransactionDetailsFromRawTransaction('randomString'), 'Invalid transaction');
    });
  });
});
