import { getBuilderFactory } from '../getBuilderFactory';
import { coins } from '@bitgo/statics';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { DelegationPoolAddStakeTransaction } from '../../../src/lib/transaction/delegationPoolAddStakeTransaction';

describe('Apt Delegation Pool Add Stake Builder', () => {
  const factory = getBuilderFactory('tapt');

  describe('Succeed', () => {
    it('should build a staking delegate transaction', async function () {
      const transaction = new DelegationPoolAddStakeTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolAddStakeTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolAddStakeTransaction;
      should.equal(tx.sender, testData.sender.address);
      should.deepEqual(tx.recipients, []);
      should.equal(tx.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.equal(tx.amount, testData.delegationPoolData.amount);
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.StakingDelegate);
      should.deepEqual(tx.inputs, [
        {
          address: testData.sender.address,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.delegationPoolData.validatorAddress,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.DELEGATION_POOL_ADD_STAKE_TX_HEX);
    });

    it('should build and send a signed tx', async function () {
      const txBuilder = factory.from(testData.DELEGATION_POOL_ADD_STAKE_TX_HEX);
      const tx = (await txBuilder.build()) as DelegationPoolAddStakeTransaction;
      tx.inputs.should.deepEqual([
        {
          address: testData.sender.address,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      tx.outputs.should.deepEqual([
        {
          address: testData.delegationPoolData.validatorAddress,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      should.equal(tx.id, '0xc5b960d1bec149c77896344774352c61441307af564eaa8c84f857208e411bf3');
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.StakingDelegate);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.DELEGATION_POOL_ADD_STAKE_TX_HEX);
    });

    it('should succeed to validate a valid signablePayload', async function () {
      const transaction = new DelegationPoolAddStakeTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolAddStakeTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolAddStakeTransaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.DELEGATION_POOL_ADD_STAKE_TX_HEX_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new DelegationPoolAddStakeTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolAddStakeTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.assetId(testData.fungibleTokenAddress.usdt);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolAddStakeTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.sender.address);
      should.deepEqual(toJson.recipients, []);
      should.equal(toJson.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.equal(toJson.amount, testData.delegationPoolData.amount);
      should.equal(toJson.sequenceNumber, 14);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1736246155);
      should.equal(toJson.feePayer, testData.feePayer.address);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.DELEGATION_POOL_ADD_STAKE_TX_HEX);
      const tx = (await txBuilder.build()) as DelegationPoolAddStakeTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.id, '0xc5b960d1bec149c77896344774352c61441307af564eaa8c84f857208e411bf3');
      should.equal(toJson.sender, testData.sender.address);
      should.deepEqual(toJson.recipients, []);
      should.equal(toJson.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.equal(toJson.amount, testData.delegationPoolData.amount);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.sequenceNumber, 14);
      should.equal(toJson.expirationTime, 1736246155);
    });
  });
});
