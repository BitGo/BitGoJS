import { getBuilderFactory } from '../getBuilderFactory';
import { coins } from '@bitgo/statics';
import * as testData from '../../resources/apt';
import { TransactionType } from '@bitgo/sdk-core';
import should from 'should';
import { DelegationPoolUnlockTransaction } from '../../../src/lib/transaction/delegationPoolUnlockTransaction';

describe('Apt Delegation Pool Unlock Builder', () => {
  const factory = getBuilderFactory('tapt');

  describe('Succeed', () => {
    it('should build a staking delegate transaction', async function () {
      const transaction = new DelegationPoolUnlockTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolUnlockTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolUnlockTransaction;
      should.equal(tx.sender, testData.sender.address);
      should.deepEqual(tx.recipients, []);
      should.deepEqual(tx.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.deepEqual(tx.amount, testData.delegationPoolData.amount);
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.StakingUnlock);
      should.deepEqual(tx.inputs, []);
      should.deepEqual(tx.outputs, []);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      rawTx.should.equal(testData.DELEGATION_POOL_UNLOCK_TX_HEX);
    });

    it('should build and send a signed tx', async function () {
      const txBuilder = factory.from(testData.DELEGATION_POOL_UNLOCK_TX_HEX);
      const tx = (await txBuilder.build()) as DelegationPoolUnlockTransaction;
      tx.inputs.should.deepEqual([]);
      tx.outputs.should.deepEqual([]);
      should.equal(tx.id, '0x471bb32955f9cff7c9c0a603ef2354e781fd80a221f9044f08df84d95473e86f');
      should.equal(tx.maxGasAmount, 200000);
      should.equal(tx.gasUnitPrice, 100);
      should.equal(tx.sequenceNumber, 14);
      should.equal(tx.expirationTime, 1736246155);
      should.equal(tx.type, TransactionType.StakingUnlock);
      const rawTx = tx.toBroadcastFormat();
      should.equal(txBuilder.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.DELEGATION_POOL_UNLOCK_TX_HEX);
    });

    it('should succeed to validate a valid signablePayload', async function () {
      const transaction = new DelegationPoolUnlockTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolUnlockTransactionBuilder(transaction);
      txBuilder.sender(testData.sender.address);
      txBuilder.validator(testData.delegationPoolData.validatorAddress, testData.delegationPoolData.amount);
      txBuilder.gasData({
        maxGasAmount: 200000,
        gasUnitPrice: 100,
      });
      txBuilder.sequenceNumber(14);
      txBuilder.expirationTime(1736246155);
      txBuilder.addFeePayerAddress(testData.feePayer.address);
      const tx = (await txBuilder.build()) as DelegationPoolUnlockTransaction;
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.toString('hex'), testData.DELEGATION_POOL_UNLOCK_TX_HEX_SIGNABLE_PAYLOAD);
    });

    it('should build a unsigned tx and validate its toJson', async function () {
      const transaction = new DelegationPoolUnlockTransaction(coins.get('tapt'));
      const txBuilder = factory.getDelegationPoolUnlockTransactionBuilder(transaction);
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
      const tx = (await txBuilder.build()) as DelegationPoolUnlockTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.sender, testData.sender.address);
      should.deepEqual(toJson.recipients, []);
      should.deepEqual(tx.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.deepEqual(tx.amount, testData.delegationPoolData.amount);
      should.equal(toJson.sequenceNumber, 14);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.expirationTime, 1736246155);
      should.equal(toJson.feePayer, testData.feePayer.address);
    });

    it('should build a signed tx and validate its toJson', async function () {
      const txBuilder = factory.from(testData.DELEGATION_POOL_UNLOCK_TX_HEX);
      const tx = (await txBuilder.build()) as DelegationPoolUnlockTransaction;
      const toJson = tx.toJson();
      should.equal(toJson.id, '0x471bb32955f9cff7c9c0a603ef2354e781fd80a221f9044f08df84d95473e86f');
      should.equal(toJson.sender, testData.sender.address);
      should.deepEqual(toJson.recipients, []);
      should.deepEqual(tx.validatorAddress, testData.delegationPoolData.validatorAddress);
      should.deepEqual(tx.amount, testData.delegationPoolData.amount);
      should.equal(toJson.maxGasAmount, 200000);
      should.equal(toJson.gasUnitPrice, 100);
      should.equal(toJson.sequenceNumber, 14);
      should.equal(toJson.expirationTime, 1736246155);
    });
  });
});
