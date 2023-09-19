import should from 'should';

import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import * as testData from '../../resources/sol';

describe('Sol Staking Delegate Builder', () => {
  const factory = getBuilderFactory('tsol');

  const wallet = new KeyPair(testData.authAccount).getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const splitAccount = new KeyPair(testData.splitStakeAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const validator = testData.validator;

  describe('Should succeed', () => {
    it('building a staking delegate tx', async () => {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder.sender(wallet.pub).stakingAddress(stakeAccount.pub).nonce(recentBlockHash).validator(validator.pub);
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
    });

    it('building a staking multi delegate tx', async () => {
      const txBuilder = factory.getStakingDelegateBuilder();
      txBuilder
        .sender(wallet.pub)
        .stakingAddresses([stakeAccount.pub, splitAccount.pub])
        .nonce(recentBlockHash)
        .validator(validator.pub);
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
