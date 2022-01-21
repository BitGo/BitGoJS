import should from 'should';

import { register } from '../../../../../src';
import { TransactionBuilderFactory, KeyPair, Utils } from '../../../../../src/coin/sol';
import * as testData from '../../../../resources/sol/sol';

describe('Sol Staking Deactivate Builder', () => {
  const factory = register('tsol', TransactionBuilderFactory);

  const wallet = new KeyPair(testData.authAccount).getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];

  describe('Should succeed', () => {
    it('building a staking deactivate tx', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_DEACTIVATE_SIGNED_TX);
    });

    it('building a staking deactivate signed tx with memo', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash).memo('Test deactivate');
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      const txJson = tx.toJson();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
          },
        },
        {
          type: 'Memo',
          params: {
            memo: 'Test deactivate',
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
    });

    it('building a staking deactivate unsigned tx', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash);
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      const txJson = tx.toJson();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_DEACTIVATE_UNSIGNED_TX);
    });

    it('building a staking deactivate unsigned tx with memo', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash).memo('Test deactivate');
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      const txJson = tx.toJson();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
          },
        },
        {
          type: 'Memo',
          params: {
            memo: 'Test deactivate',
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_DEACTIVATE_UNSIGNED_TX_WITH_MEMO);
    });

    it('building an encoded unsigned transaction and signing it', async () => {
      const txBuilder = factory.from(testData.STAKING_DEACTIVATE_UNSIGNED_TX_WITH_MEMO);
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
    });

    it('building an encoded signed transaction', async () => {
      const txBuilder = factory.from(testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      should.equal(tx.toBroadcastFormat(), testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
    });
  });

  describe('Should fail', () => {
    it('building a staking deactivate tx without staking address', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.be.rejectedWith('Staking address must be set before building the transaction');
    });

    it('building a staking deactivate tx with a wrong staking address', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).nonce(recentBlockHash);
      should(() => txBuilder.stakingAddress(invalidPubKey)).throwError(
        `Invalid or missing stakingAddress, got: ${invalidPubKey}`,
      );
    });

    it('building a staking deactivate tx with the same address as sender and staking', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).nonce(recentBlockHash);
      txBuilder.stakingAddress(wallet.pub);
      await txBuilder.build().should.rejectedWith('Sender address cannot be the same as the Staking address');
    });
  });
});
