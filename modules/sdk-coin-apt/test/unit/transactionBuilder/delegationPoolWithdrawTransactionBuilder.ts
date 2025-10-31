import { getBuilderFactory } from '../getBuilderFactory';
import { coins } from '@bitgo/statics';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { DelegationPoolWithdrawTransaction } from '../../../src/lib/transaction/delegationPoolWithdrawTransaction';

describe('Apt Delegation Pool Withdraw Builder', () => {
  const factory = getBuilderFactory('tapt');

  describe('Succeed', () => {
    it('should build a staking withdraw transaction', async function () {
      const transaction = new DelegationPoolWithdrawTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolWithdrawTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolWithdrawTransaction;
      should.equal(tx.sender, testData.sender.address);
      should.deepEqual(tx.recipients, []);
      should.equal(tx.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.equal(tx.amount, testData.delegationPoolData.amount);
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.StakingWithdraw);
      should.deepEqual(tx.inputs, [
        {
          address: testData.delegationPoolData.validatorAddress,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      should.deepEqual(tx.outputs, [
        {
          address: testData.sender.address,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.DELEGATION_POOL_WITHDRAW_TX_HEX);
    });

    it('should build and send a signed tx', async function () {
      const txBuilder = factory.from(testData.DELEGATION_POOL_WITHDRAW_TX_HEX);
      const tx = (await txBuilder.build()) as DelegationPoolWithdrawTransaction;
      tx.inputs.should.deepEqual([
        {
          address: testData.delegationPoolData.validatorAddress,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      tx.outputs.should.deepEqual([
        {
          address: testData.sender.address,
          value: testData.delegationPoolData.amount,
          coin: 'tapt',
        },
      ]);
      should.equal(tx.id, '0xd795391e85ffd5e37b844db4206c5bd99ba28a42430df996969ee9b7f16a5f21');
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.StakingWithdraw);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.DELEGATION_POOL_WITHDRAW_TX_HEX);
    });

    it('should succeed to validate a valid signablePayload', async function () {
      const transaction = new DelegationPoolWithdrawTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolWithdrawTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolWithdrawTransaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.DELEGATION_POOL_WITHDRAW_TX_HEX_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new DelegationPoolWithdrawTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolWithdrawTransactionBuilder(transaction);
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
      const tx = (await txBuilder.build()) as DelegationPoolWithdrawTransaction;
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
      const txBuilder = factory.from(testData.DELEGATION_POOL_WITHDRAW_TX_HEX);
      const tx = (await txBuilder.build()) as DelegationPoolWithdrawTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.id, '0xd795391e85ffd5e37b844db4206c5bd99ba28a42430df996969ee9b7f16a5f21');
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
