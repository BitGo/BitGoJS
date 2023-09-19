import should from 'should';

import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import * as testData from '../../resources/sol';
import { TransactionType } from '@bitgo/sdk-core';
import * as bs58 from 'bs58';

describe('Sol Staking Delegate Builder', () => {
  const factory = getBuilderFactory('tsol');

  const walletKeyPair = new KeyPair(testData.authAccount);
  const wallet = walletKeyPair.getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const splitAccount = new KeyPair(testData.splitStakeAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const validator = testData.validator;

  describe('Should succeed', () => {
    it('building a staking delegate tx', async () => {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash).validator(validator.pub);
      const txUnsigned = await txBuilder.build();
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Delegate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            validator: validator.pub,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_DELEGATE_SIGNED_TX);

      const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
      const signed = tx.signature[0];

      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDelegateBuilder();
      txBuilder2.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash).validator(validator.pub);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDelegate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_DELEGATE_SIGNED_TX);
    });

    it('building a staking multi delegate tx', async () => {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder
        .sender(wallet.pub)
        .stakingAddresses([stakeAccount.pub, splitAccount.pub])
        .nonce(recentBlockHash)
        .validator(validator.pub);
      const txUnsigned = await txBuilder.build();
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Delegate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            validator: validator.pub,
          },
        },
        {
          type: 'Delegate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: splitAccount.pub,
            validator: validator.pub,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_MULTI_DELEGATE_SIGNED_TX);
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
      const signed = tx.signature[0];
      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDelegateBuilder();
      txBuilder2
        .sender(wallet.pub)
        .stakingAddresses([stakeAccount.pub, splitAccount.pub])
        .nonce(recentBlockHash)
        .validator(validator.pub);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDelegate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_MULTI_DELEGATE_SIGNED_TX);
    });

    it('building a staking multi single delegate tx', async () => {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder.sender(wallet.pub).stakingAddresses([stakeAccount.pub]).nonce(recentBlockHash).validator(validator.pub);
      const txUnsigned = await txBuilder.build();
      txBuilder.sign({ key: wallet.prv });
      const tx = await txBuilder.build();
      const txJson = tx.toJson();
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      txJson.instructionsData.should.deepEqual([
        {
          type: 'Delegate',
          params: {
            fromAddress: wallet.pub,
            stakingAddress: stakeAccount.pub,
            validator: validator.pub,
          },
        },
      ]);
      should.equal(rawTx, testData.STAKING_MULTI_DEACTIVATE_UNSIGNED_TX_single);
      should.equal(Utils.isValidRawTransaction(rawTx), true);

      const tx2 = await factory.from(txUnsigned.toBroadcastFormat()).build();
      const signed = tx.signature[0];
      should.equal(tx2.toBroadcastFormat(), txUnsigned.toBroadcastFormat());
      should.equal(tx2.signablePayload.toString('hex'), txUnsigned.signablePayload.toString('hex'));

      const txBuilder2 = factory.getStakingDelegateBuilder();
      txBuilder2
        .sender(wallet.pub)
        .stakingAddresses([stakeAccount.pub])
        .nonce(recentBlockHash)
        .validator(validator.pub);
      await txBuilder2.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signed)));
      const signedTx = await txBuilder2.build();
      should.equal(signedTx.type, TransactionType.StakingDelegate);

      const rawSignedTx = signedTx.toBroadcastFormat();
      should.equal(rawSignedTx, testData.STAKING_MULTI_DEACTIVATE_UNSIGNED_TX_single);
    });
  });

  describe('Should fail', () => {
    describe('delegate single', () => {
      it('building a staking delegate tx without validator address', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.sender(wallet.pub).nonce(recentBlockHash);
        txBuilder.sign({ key: wallet.prv });
        await txBuilder.build().should.be.rejectedWith('Validator must be set before building the transaction');
      });

      it('building a staking delegate tx without staking address', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.sender(wallet.pub).nonce(recentBlockHash).validator(validator.pub);
        txBuilder.sign({ key: wallet.prv });
        await txBuilder.build().should.be.rejectedWith('Staking Address must be set before building the transaction');
      });

      it('building a staking delegate tx staking address', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.sender(wallet.pub).nonce(recentBlockHash).validator(validator.pub).stakingAddress(wallet.pub);
        txBuilder.sign({ key: wallet.prv });
        await txBuilder.build().should.be.rejectedWith('Sender address cannot be the same as the Staking address');
      });

      it('building a staking delegate tx with a wrong staking address', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.sender(wallet.pub).nonce(recentBlockHash);
        should(() => txBuilder.stakingAddress(invalidPubKey)).throwError(
          `Invalid or missing stakingAddress, got: ${invalidPubKey}`
        );
      });
    });

    describe('delegate multi', () => {
      it('building a staking delegate tx with empty list', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.sender(wallet.pub).nonce(recentBlockHash).validator(validator.pub);
        should(() => txBuilder.stakingAddresses([])).throwError(`stakingAddresses must not be empty`);
      });

      it('building a staking delegate tx staking addresses cannot be same as wallet address', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder
          .sender(wallet.pub)
          .nonce(recentBlockHash)
          .validator(validator.pub)
          .stakingAddresses([splitAccount.pub, wallet.pub]);
        txBuilder.sign({ key: wallet.prv });
        await txBuilder.build().should.be.rejectedWith('Sender address cannot be the same as the Staking address');
      });

      it('building a staking delegate tx with a wrong staking address', async () => {
        const txBuilder = factory.getStakingDelegateBuilder();
        txBuilder.sender(wallet.pub).nonce(recentBlockHash);
        should(() => txBuilder.stakingAddresses([invalidPubKey])).throwError(
          `Invalid or missing stakingAddress, got: ${invalidPubKey}`
        );
      });
    });
  });
});
