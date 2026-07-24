import should from 'should';

import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import * as testData from '../../resources/sol';

describe('Sol Staking Withdraw Builder', () => {
  const factory = getBuilderFactory('tsol');

  const stakingBuilder = () => {
    const txBuilder = factory.getStakingWithdrawBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(wallet.pub);
    return txBuilder;
  };

  const wallet = new KeyPair(testData.authAccount).getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';

  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];

  describe('Should succeed', () => {
    it('building a staking withdraw tx', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).amount(amount).nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Withdraw',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: amount,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_WITHDRAW_SIGNED_TX);
    });

    it('building a staking withdraw signed tx with memo', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .amount(amount)
        .nonce(recentBlockHash)
        .memo('Test withdraw');
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      const txJson = tx.toJson();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Withdraw',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: amount,
          },
        },
        {
          type: 'Memo',
          params: {
            memo: 'Test withdraw',
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_WITHDRAW_SIGNED_TX_WITH_MEMO);
    });

    it('building a staking withdraw unsigned tx', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).amount(amount).nonce(recentBlockHash);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      const txJson = tx.toJson();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Withdraw',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: amount,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_WITHDRAW_UNSIGNED_TX);
    });

    it('building a staking withdraw unsigned tx with memo', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .amount(amount)
        .nonce(recentBlockHash)
        .memo('Test withdraw');
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      const txJson = tx.toJson();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Withdraw',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: amount,
          },
        },
        {
          type: 'Memo',
          params: {
            memo: 'Test withdraw',
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_WITHDRAW_UNSIGNED_TX_WITH_MEMO);
    });

    it('building an encoded unsigned transaction and signing it', async () => {
      const txBuilder = factory.from(testData.STAKING_WITHDRAW_UNSIGNED_TX_WITH_MEMO);
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.STAKING_WITHDRAW_SIGNED_TX_WITH_MEMO);
    });

    it('building an encoded signed transaction', async () => {
      const txBuilder = factory.from(testData.STAKING_WITHDRAW_SIGNED_TX_WITH_MEMO);
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.STAKING_WITHDRAW_SIGNED_TX_WITH_MEMO);
    });
  });

  describe('Should fail', () => {
    it('build a staking withdraw tx when amount is invalid', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.amount('randomstring')).throwError('Value cannot be zero or less');
    });

    it('build a staking withdraw tx when amount is less than zero', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.amount('-1')).throwError('Value cannot be zero or less');
    });

    it('build a staking withdraw tx when amount is equal to zero', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.amount('0')).throwError('Value cannot be zero or less');
    });

    it('building a staking withdraw tx without staking address', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder.sender(wallet.pub).nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.be.rejectedWith('Staking address must be set before building the transaction');
    });

    it('building a staking withdraw tx with a wrong staking address', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder.sender(wallet.pub).nonce(recentBlockHash);
      should(() => txBuilder.stakingAddress(invalidPubKey)).throwError(
        `Invalid or missing stakingAddress, got: ${invalidPubKey}`
      );
    });

    it('building a staking withdraw tx with the same address as sender and staking', async () => {
      const txBuilder = factory.getStakingWithdrawBuilder();
      txBuilder.sender(wallet.pub).amount(amount).nonce(recentBlockHash).stakingAddress(wallet.pub);
      txBuilder.stakingAddress(wallet.pub);
      await txBuilder.build().should.rejectedWith('Sender address cannot be the same as the Staking address');
    });
  });
});
