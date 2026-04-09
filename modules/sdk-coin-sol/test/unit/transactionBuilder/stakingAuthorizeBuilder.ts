import should from 'should';

import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';

describe('Sol Staking Authorize Builder', () => {
  const factory = getBuilderFactory('tsol');

  const stakingBuilder = () => {
    const txBuilder = factory.getStakingAuthorizeBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(wallet.pub);
    return txBuilder;
  };

  // not valid data
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const wrongAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();

  // valid data
  const wallet = new KeyPair(testData.authAccount2).getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const oldAuthorizedAccount = new KeyPair(testData.authAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  describe('Succeed', () => {
    it('build a create staking authorization signed tx', async () => {
      const txBuilder = factory.getStakingAuthorizeBuilder();
      txBuilder
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .nonce(recentBlockHash)
        .newAuthorizedAddress(wallet.pub)
        .oldAuthorizedAddress(oldAuthorizedAccount.pub);

      txBuilder.sign({ key: wallet.prv });
      txBuilder.sign({ key: oldAuthorizedAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.STAKING_AUTHORIZE_SIGNED_TX);
    });

    it('build a create and delegate staking unsigned tx', async () => {
      const txBuilder = factory.getStakingAuthorizeBuilder();
      txBuilder
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .nonce(recentBlockHash)
        .newAuthorizedAddress(wallet.pub)
        .oldAuthorizedAddress(oldAuthorizedAccount.pub);

      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(0);
      tx.outputs.length.should.equal(0);
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.STAKING_AUTHORIZE_UNSIGNED_TX);
    });
  });

  describe('Fail', () => {
    it('for invalid sender address', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.sender(invalidPubKey)).throwError('Invalid or missing sender, got: ' + invalidPubKey);
    });

    it('for invalid staking address', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.stakingAddress(invalidPubKey)).throwError(
        'Invalid or missing stakingAddress, got: ' + invalidPubKey
      );
    });

    it('build when nonce is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.sender(wallet.pub);
      txBuilder.stakingAddress(stakeAccount.pub);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
    });

    it('build when sender is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.stakingAddress(stakeAccount.pub);
      txBuilder.nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
    });

    it('build when stakingAddress is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.sender(wallet.pub);
      txBuilder.nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Staking Address must be set before building the transaction');
    });

    it('to sign twice with the same key', () => {
      const txBuilder = factory.from(testData.STAKING_ACTIVATE_UNSIGNED_TX);
      txBuilder.sign({ key: wallet.prv });
      should(() => txBuilder.sign({ key: wallet.prv })).throwError('Duplicated signer: ' + wallet.prv?.toString());
    });
  });

  describe('From and sign', () => {
    describe('Succeed', () => {
      it('build from an unsigned staking activate and sign it', async () => {
        const txBuilder = factory.from(testData.STAKING_AUTHORIZE_UNSIGNED_TX);

        txBuilder.sign({ key: wallet.prv });
        txBuilder.sign({ key: oldAuthorizedAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(0);
        tx.outputs.length.should.equal(0);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.STAKING_AUTHORIZE_SIGNED_TX);
      });
    });

    describe('Fail', () => {
      it('build from an unsigned staking activate and fail to sign it', async () => {
        const txBuilder = factory.from(testData.STAKING_ACTIVATE_UNSIGNED_TX);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });
      it('build from a signed staking activate and fail to sign it', async () => {
        const txBuilder = factory.from(testData.STAKING_ACTIVATE_SIGNED_TX);
        txBuilder.sign({ key: wrongAccount.prv });
        await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
      });
    });
  });
});
