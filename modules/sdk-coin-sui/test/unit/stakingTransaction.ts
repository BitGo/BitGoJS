import { coins } from '@bitgo/statics';
import should from 'should';
import { Transaction } from '../../src';
import * as testData from '../resources/sui';
import { MethodNames, MoveCallTx } from '../../src/lib/iface';
import { StakingTransaction } from '../../src/lib/stakingTransaction';
import { TransactionType } from '@bitgo/sdk-core';

describe('Sui RequestAddDelegation Transaction', () => {
  let tx: Transaction<MoveCallTx>;
  const config = coins.get('tsui');

  beforeEach(() => {
    tx = new StakingTransaction(config);
  });

  describe('Empty transaction', () => {
    it('should throw empty transaction', function () {
      should.throws(() => tx.toJson(), 'Empty transaction');
      should.throws(() => tx.toBroadcastFormat(), 'Empty transaction');
    });
  });

  describe('From raw transaction', () => {
    it('should build a staking requestAddDelegation from raw hex', function () {
      tx.fromRawTransaction(testData.ADD_DELEGATION_TX_ONE_COIN);
      const json = tx.toJson();
      should.equal(json.sender, testData.STAKING_SENDER_ADDRESS);
    });
    it('should build a staking requestAddDelegation with multiple coins from raw hex', function () {
      tx.fromRawTransaction(testData.ADD_DELEGATION_TX_MUL_COIN);
      const json = tx.toJson();
      should.equal(json.sender, testData.STAKING_SENDER_ADDRESS);
      should.equal(json.kind.Single['Call'].function, MethodNames.RequestAddDelegationMulCoin);
      should.equal(json.kind.Single['Call'].arguments.length, 4); // 4 required arguments
      should.equal(json.kind.Single['Call'].arguments[1].length, 2); // 2 coins
    });
    it('should fail to build a staking requestAddDelegation from incorrect raw hex', function () {
      should.throws(() => tx.fromRawTransaction('random' + testData.ADD_DELEGATION_TX_ONE_COIN), 'incorrect raw data');
    });
  });

  describe('Explain transaction', () => {
    it('should explain a staking requestAddDelegation transaction', function () {
      tx.fromRawTransaction(testData.ADD_DELEGATION_TX_ONE_COIN);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'outputs',
          'outputAmount',
          'changeOutputs',
          'changeAmount',
          'fee',
          'type',
          'module',
          'function',
          'validatorAddress',
        ],
        id: 'UNAVAILABLE',
        outputs: [
          {
            address: testData.VALIDATOR_ADDRESS,
            amount: testData.STAKING_AMOUNT,
          },
        ],
        outputAmount: testData.STAKING_AMOUNT,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.STAKING_GAS_BUDGET.toString() },
        type: TransactionType.AddDelegator,
      });
    });

    it('should explain a staking requestAddDelegation transaction with multiple coins', function () {
      tx.fromRawTransaction(testData.ADD_DELEGATION_TX_MUL_COIN);
      const explainedTransaction = tx.explainTransaction();
      explainedTransaction.should.deepEqual({
        displayOrder: [
          'id',
          'outputs',
          'outputAmount',
          'changeOutputs',
          'changeAmount',
          'fee',
          'type',
          'module',
          'function',
          'validatorAddress',
        ],
        id: 'UNAVAILABLE',
        outputs: [
          {
            address: testData.VALIDATOR_ADDRESS,
            amount: testData.STAKING_AMOUNT,
          },
        ],
        outputAmount: 20000000,
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: testData.STAKING_GAS_BUDGET.toString() },
        type: TransactionType.AddDelegator,
      });
    });

    it('should fail to explain transaction with invalid raw hex', function () {
      should.throws(() => tx.fromRawTransaction('randomString'), 'Invalid transaction');
    });
  });
});
