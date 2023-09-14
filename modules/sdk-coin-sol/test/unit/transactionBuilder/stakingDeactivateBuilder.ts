import should from 'should';

import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import * as testData from '../../resources/sol';
import { TransactionType } from '@bitgo/sdk-core';
import * as bs58 from 'bs58';

describe('Sol Staking Deactivate Builder', () => {
  const factory = getBuilderFactory('tsol');

  const walletKeyPair = new KeyPair(testData.authAccount);
  const wallet = walletKeyPair.getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const splitAccount = new KeyPair(testData.splitStakeAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];

  describe('Should succeed', () => {
    it('building a staking deactivate tx', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash);
      const txUnsigned = await txBuilder.build();
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
            amount: undefined,
            unstakingAddress: undefined,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_DEACTIVATE_SIGNED_TX);

      const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
      const signed = tx.signature[0];

      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDeactivateBuilder();
      txBuilder2.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDeactivate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_DEACTIVATE_SIGNED_TX);
    });

    it('building a staking multi deactivate tx', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddresses([stakeAccount.pub, splitAccount.pub]).nonce(recentBlockHash);
      const txUnsigned = await txBuilder.build();
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
            amount: undefined,
            unstakingAddress: undefined,
          },
        },
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: splitAccount.pub,
            amount: undefined,
            unstakingAddress: undefined,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_MULTI_DEACTIVATE_UNSIGNED_TX);

      const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
      const signed = tx.signature[0];

      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDeactivateBuilder();
      txBuilder2.sender(wallet.pub).stakingAddresses([stakeAccount.pub, splitAccount.pub]).nonce(recentBlockHash);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDeactivate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_MULTI_DEACTIVATE_SIGNED_TX);
    });

    it('should build and sign a multi deactivate single', async function () {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddresses([stakeAccount.pub]).nonce(recentBlockHash);
      const txUnsigned = await txBuilder.build();
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      const rawTx = tx.toBroadcastFormat();
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: undefined,
            unstakingAddress: undefined,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_MULTI_DEACTIVATE_SIGNED_TX_single);
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
      const signed = tx.signature[0];
      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDeactivateBuilder();
      txBuilder2.sender(wallet.pub).stakingAddresses([stakeAccount.pub]).nonce(recentBlockHash);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDeactivate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_MULTI_DEACTIVATE_SIGNED_TX_single);
    });

    it('should build and sign a deactivate single', async function () {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      const txUnsigned = await txBuilder.build();
      const tx = await txBuilder.build();
      const rawTx = tx.toBroadcastFormat();
      should.equal(rawTx, testData.STAKING_DEACTIVATE_SIGNED_TX_single);
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      const tx2 = await factory.from(testData.STAKING_DEACTIVATE_UNSIGNED_TX_single).build();
      const signed = tx.signature[0];

      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDeactivateBuilder();
      txBuilder2.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDeactivate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_DEACTIVATE_SIGNED_TX_single);
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
          type: 'Memo',
          params: {
            memo: 'Test deactivate',
          },
        },
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: undefined,
            unstakingAddress: undefined,
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
            amount: undefined,
            unstakingAddress: undefined,
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
          type: 'Memo',
          params: {
            memo: 'Test deactivate',
          },
        },
        {
          type: 'Deactivate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            amount: undefined,
            unstakingAddress: undefined,
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

    it('building a partial staking deactivate tx', async () => {
      const txBuilder = factory
        .getStakingDeactivateBuilder()
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .unstakingAddress(testData.splitStakeAccount.pub)
        .amount('100000')
        .nonce(recentBlockHash);
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
            amount: '100000',
            unstakingAddress: testData.splitStakeAccount.pub,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_PARTIAL_DEACTIVATE_SIGNED_TX);

      const tx2 = await factory.from(testData.STAKING_PARTIAL_DEACTIVATE_SIGNED_TX).build();
      const txJson2 = tx2.toJson();
      tx2.toBroadcastFormat();

      delete tx['_id'];
      delete tx2['_id'];

      should.deepEqual(tx, tx2);
      should.deepEqual(txJson2, txJson2);
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
        `Invalid or missing stakingAddress, got: ${invalidPubKey}`
      );
    });

    it('building a staking deactivate tx with the same address as sender and staking', async () => {
      const txBuilder = factory.getStakingDeactivateBuilder();
      txBuilder.sender(wallet.pub).nonce(recentBlockHash);
      txBuilder.stakingAddress(wallet.pub);
      await txBuilder.build().should.rejectedWith('Sender address cannot be the same as the Staking address');
    });

    it('building a partial staking deactivate tx without an amount', async () => {
      const txBuilder = factory
        .getStakingDeactivateBuilder()
        .sender(wallet.pub)
        .nonce(recentBlockHash)
        .stakingAddress(testData.stakeAccount.pub)
        .unstakingAddress(testData.splitStakeAccount.pub);
      txBuilder.sign({ key: wallet.prv });

      await txBuilder
        .build()
        .should.be.rejectedWith(
          'If an unstaking address is given then a partial amount to unstake must also be set before building the transaction'
        );
    });

    it('building a partial staking deactivate tx without an unstaking address', async () => {
      const txBuilder = factory
        .getStakingDeactivateBuilder()
        .sender(wallet.pub)
        .nonce(recentBlockHash)
        .stakingAddress(testData.stakeAccount.pub)
        .amount('10');
      txBuilder.sign({ key: wallet.prv });

      await txBuilder
        .build()
        .should.be.rejectedWith(
          'When partially unstaking the unstaking address must be set before building the transaction'
        );
    });
  });
});
