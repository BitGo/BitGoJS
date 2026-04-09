import assert from 'assert';
import should from 'should';
import { coins } from '@bitgo/statics';
import { getBuilder } from '../getBuilder';
import { TransactionBuilder } from '../../../src';
import { getOperationConfig, StakingOperationTypes, TransactionType } from '@bitgo/sdk-core';
import * as testData from '../../resources/celo';

describe('Celo staking transaction builder', () => {
  let txBuilder;
  beforeEach(() => {
    txBuilder = getBuilder('tcelo') as TransactionBuilder;
    txBuilder.type(TransactionType.StakingLock);
    txBuilder.fee({
      fee: '1000000000',
      gasLimit: '12100000',
    });
    txBuilder.counter(1);
  });

  const coin = coins.get('tcelo');
  const LockOperation = getOperationConfig(StakingOperationTypes.LOCK, coin.network.type);
  const UnlockOperation = getOperationConfig(StakingOperationTypes.UNLOCK, coin.network.type);
  const WithdrawOperation = getOperationConfig(StakingOperationTypes.WITHDRAW, coin.network.type);
  const VoteOperation = getOperationConfig(StakingOperationTypes.VOTE, coin.network.type);
  const UnvoteOperation = getOperationConfig(StakingOperationTypes.UNVOTE, coin.network.type);
  const ActivateOperation = getOperationConfig(StakingOperationTypes.ACTIVATE, coin.network.type);

  describe('lock', () => {
    it('should build a lock transaction', async function () {
      txBuilder.lock().amount('100');
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, LockOperation.contractAddress);
      txJson.data.should.startWith(LockOperation.methodId);
      should.equal(txJson.data, LockOperation.methodId);
    });

    it('should build a lock transaction using the previous instance', async function () {
      txBuilder.lock().amount('200');
      txBuilder.lock().amount('100');
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, LockOperation.contractAddress);
      txJson.data.should.startWith(LockOperation.methodId);
      should.equal(txJson.data, LockOperation.methodId);
    });

    it('should sign and build a lock transaction from serialized', async function () {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      builder.from(testData.LOCK_SERIALIZED);
      builder.sign({ key: testData.PRIVATE_KEY });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, LockOperation.contractAddress);
      txJson.data.should.startWith(LockOperation.methodId);
      should.equal(txJson.data, LockOperation.methodId);
      should.equal(txJson.from, testData.ACCOUNT1);
      should.equal(tx.toBroadcastFormat(), testData.LOCK_BROADCAST_TX);
    });
  });

  describe('vote', () => {
    it('should build a vote transaction', async function () {
      txBuilder.type(TransactionType.StakingVote);
      txBuilder
        .vote()
        .group(testData.GROUP_ADDRESS)
        .lesser(testData.LESSER_ADDRESS)
        .greater(testData.GREATER_ADDRESS)
        .amount('100');
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, VoteOperation.contractAddress);
      txJson.data.should.startWith(testData.VOTE_DATA_2);
      should.equal(txJson.data, testData.VOTE_DATA_2);
    });

    it('should build a vote transaction using the previous instance', async function () {
      txBuilder.type(TransactionType.StakingVote);
      txBuilder
        .vote()
        .group(testData.GROUP_ADDRESS_2)
        .lesser(testData.LESSER_ADDRESS)
        .greater(testData.GREATER_ADDRESS)
        .amount('500');
      txBuilder
        .vote()
        .group(testData.GROUP_ADDRESS)
        .lesser(testData.LESSER_ADDRESS_2)
        .greater(testData.GREATER_ADDRESS_2)
        .amount('100');
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, VoteOperation.contractAddress);
      txJson.data.should.startWith(testData.VOTE_DATA);
      should.equal(txJson.data, testData.VOTE_DATA);
    });

    it('should sign and build a vote transaction from serialized', async function () {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      builder.from(testData.VOTE_BROADCAST_TX);
      builder.sign({ key: testData.PRIVATE_KEY });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, VoteOperation.contractAddress);
      should.equal(txJson.data, testData.VOTE_DATA_2);
      should.equal(txJson.from, testData.ACCOUNT1);
      should.equal(tx.toBroadcastFormat(), testData.VOTE_BROADCAST_TX);
    });
  });

  describe('activate', () => {
    it('should build an activate transaction', async function () {
      txBuilder.type(TransactionType.StakingActivate);
      txBuilder.activate().group(testData.GROUP_ADDRESS);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, ActivateOperation.contractAddress);
      txJson.data.should.startWith(testData.ACTIVATE_DATA);
      should.equal(txJson.data, testData.ACTIVATE_DATA);
      should.equal(tx.toBroadcastFormat(), testData.ACTIVATE_BROADCAST_TX);
    });

    it('should build an activate transaction from a previous instance', async function () {
      txBuilder.type(TransactionType.StakingActivate);
      txBuilder.activate().group(testData.GROUP_ADDRESS_2);
      txBuilder.activate().group(testData.GROUP_ADDRESS);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, ActivateOperation.contractAddress);
      txJson.data.should.startWith(testData.ACTIVATE_DATA);
      should.equal(txJson.data, testData.ACTIVATE_DATA);
      should.equal(tx.toBroadcastFormat(), testData.ACTIVATE_BROADCAST_TX);
    });

    it('should sign and build an activate transaction from serialized', async function () {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      builder.from(testData.ACTIVATE_BROADCAST_TX);
      builder.sign({ key: testData.PRIVATE_KEY });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, ActivateOperation.contractAddress);
      should.equal(txJson.data, testData.ACTIVATE_DATA);
      should.equal(txJson.from, testData.ACCOUNT1);
      should.equal(tx.toBroadcastFormat(), testData.ACTIVATE_BROADCAST_TX);
    });
  });

  describe('unvote', () => {
    it('should build a unvote transaction', async function () {
      txBuilder.type(TransactionType.StakingUnvote);
      txBuilder
        .unvote()
        .group(testData.GROUP_ADDRESS)
        .lesser(testData.LESSER_ADDRESS)
        .greater(testData.GREATER_ADDRESS)
        .amount('100')
        .index(1);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, UnvoteOperation.contractAddress);
      txJson.data.should.startWith(testData.UNVOTE_DATA);
      should.equal(txJson.data, testData.UNVOTE_DATA);
    });

    it('should build a unvote transaction using the previous instance', async function () {
      txBuilder.type(TransactionType.StakingUnvote);
      txBuilder
        .unvote()
        .group(testData.GROUP_ADDRESS_2)
        .lesser(testData.LESSER_ADDRESS)
        .greater(testData.GREATER_ADDRESS)
        .amount('500')
        .index(1);
      txBuilder
        .unvote()
        .group(testData.GROUP_ADDRESS)
        .lesser(testData.LESSER_ADDRESS_2)
        .greater(testData.GREATER_ADDRESS_2)
        .amount('100')
        .index(1);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, UnvoteOperation.contractAddress);
      txJson.data.should.startWith(testData.UNVOTE_DATA_2);
      should.equal(txJson.data, testData.UNVOTE_DATA_2);
    });

    it('should sign and build a unvote transaction from serialized', async function () {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      builder.from(testData.UNVOTE_BROADCAST_TX);
      builder.sign({ key: testData.PRIVATE_KEY });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, UnvoteOperation.contractAddress);
      should.equal(txJson.data, testData.UNVOTE_DATA);
      should.equal(txJson.from, testData.ACCOUNT1);
      should.equal(tx.toBroadcastFormat(), testData.UNVOTE_BROADCAST_TX);
    });
  });

  describe('unlock', () => {
    it('should build an unlock transaction', async function () {
      txBuilder.type(TransactionType.StakingUnlock);
      txBuilder.unlock().amount('100');
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, UnlockOperation.contractAddress);
      txJson.data.should.startWith(UnlockOperation.methodId);
      should.equal(txJson.data, testData.UNLOCK_DATA);
    });

    it('should build an unlock transaction from a previous instance', async function () {
      txBuilder.type(TransactionType.StakingUnlock);
      txBuilder.unlock().amount('500');
      txBuilder.unlock().amount('100');
      const txJson = (await txBuilder.build()).toJson();
      should.equal(txJson.to, UnlockOperation.contractAddress);
      txJson.data.should.startWith(UnlockOperation.methodId);
      should.equal(txJson.data, testData.UNLOCK_DATA);
    });

    it('should sign and build an unlock transaction from serialized', async function () {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      builder.type(TransactionType.StakingLock);
      builder.from(testData.UNLOCK_BROADCAST_TX);
      builder.sign({ key: testData.PRIVATE_KEY });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, UnlockOperation.contractAddress);
      txJson.data.should.startWith(UnlockOperation.methodId);
      should.equal(txJson.data, testData.UNLOCK_DATA);
      should.equal(txJson.from, testData.ACCOUNT1);
      should.equal(tx.toBroadcastFormat(), testData.UNLOCK_BROADCAST_TX);
    });
  });

  describe('withdraw', () => {
    it('should build a withdraw transaction', async function () {
      txBuilder.type(TransactionType.StakingWithdraw);
      txBuilder.withdraw().index(0);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, WithdrawOperation.contractAddress);
      txJson.data.should.startWith(WithdrawOperation.methodId);
      should.equal(txJson.data, testData.WITHDRAW_DATA);
      should.equal(tx.toBroadcastFormat(), testData.WITHDRAW_BROADCAST_TX);
    });

    it('should build a withdraw transaction from a previous instance', async function () {
      txBuilder.type(TransactionType.StakingWithdraw);
      txBuilder.withdraw().index(2);
      txBuilder.withdraw().index(0);
      txBuilder.sign({ key: testData.PRIVATE_KEY });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, WithdrawOperation.contractAddress);
      txJson.data.should.startWith(WithdrawOperation.methodId);
      should.equal(txJson.data, testData.WITHDRAW_DATA);
      should.equal(txJson.from, testData.KEYPAIR_PRV.getAddress());
      should.equal(tx.toBroadcastFormat(), testData.WITHDRAW_BROADCAST_TX);
    });

    it('should sign and build a withdraw transaction from serialized', async function () {
      const builder = getBuilder('tcelo') as TransactionBuilder;
      builder.type(TransactionType.StakingWithdraw);
      builder.from(testData.WITHDRAW_BROADCAST_TX);
      builder.sign({ key: testData.PRIVATE_KEY });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.equal(txJson.to, WithdrawOperation.contractAddress);
      txJson.data.should.startWith(WithdrawOperation.methodId);
      should.equal(txJson.from, testData.KEYPAIR_PRV.getAddress());
      should.equal(txJson.from, testData.ACCOUNT1);
      should.equal(tx.toBroadcastFormat(), testData.WITHDRAW_BROADCAST_TX);
    });
  });

  describe('type validation', () => {
    it('should not fail if the type is changed', () => {
      txBuilder.lock();
      txBuilder.type(TransactionType.StakingVote);
      should.doesNotThrow(() => {
        txBuilder.vote();
      });
    });

    it('should fail to call lock if it is not an staking lock type transaction', () => {
      txBuilder.type(TransactionType.AddressInitialization);
      assert.throws(
        () => {
          txBuilder.lock();
        },
        (e: any) => e.message === testData.LOCK_TRANSACTION_TYPE_ERROR
      );
    });

    it('should fail to call vote if it is not an staking vote type transaction', () => {
      txBuilder.type(TransactionType.AddressInitialization);
      assert.throws(
        () => {
          txBuilder.vote();
        },
        (e: any) => e.message === testData.VOTE_TRANSACTION_TYPE_ERROR
      );
    });

    it('should fail to call activate if it is not an staking activate type transaction', () => {
      txBuilder.type(TransactionType.AddressInitialization);
      assert.throws(
        () => {
          txBuilder.activate();
        },
        (e: any) => e.message === testData.ACTIVATION_TRANSACTION_TYPE_ERROR
      );
    });

    it('should fail to call unlock if it is not an staking unlock type transaction', () => {
      txBuilder.type(TransactionType.AddressInitialization);
      assert.throws(
        () => {
          txBuilder.unlock();
        },
        (e: any) => e.message === testData.UNLOCK_TRANSACTION_TYPE_ERROR
      );
    });

    it('should fail to call unvote if it is not an staking unvote type transaction', () => {
      txBuilder.type(TransactionType.AddressInitialization);
      assert.throws(
        () => {
          txBuilder.unvote();
        },
        (e: any) => e.message === testData.UNVOTE_TRANSACTION_TYPE_ERROR
      );
    });

    it('should fail to call withdraw if it is not an staking withdraw type transaction', () => {
      txBuilder.type(TransactionType.AddressInitialization);
      assert.throws(
        () => {
          txBuilder.withdraw();
        },
        (e: any) => e.message === testData.WITHDRAW_TRANSACTION_TYPE_ERROR
      );
    });

    it('should fail to build and staking lock operation if operationBuilder is not set', async () => {
      await txBuilder.build().should.be.rejectedWith('No staking information set');
    });
  });
});
