import should from 'should';

import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';

describe('Sol Staking Activate Builder', () => {
  const factory = getBuilderFactory('tsol');

  const stakingBuilder = () => {
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(wallet.pub);
    return txBuilder;
  };

  // not valid data
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const wrongAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();

  // valid data
  const wallet = new KeyPair(testData.authAccount).getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const validator = testData.validator;

  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';

  describe('Succeed', () => {
    it('build a create and delegate staking signed tx', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .validator(validator.pub)
        .nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      txBuilder.sign({ key: stakeAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: wallet.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.STAKING_ACTIVATE_SIGNED_TX);
    });

    it('build a create and delegate staking signed tx with memo', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .validator(validator.pub)
        .memo('test memo')
        .nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      txBuilder.sign({ key: stakeAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: wallet.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: stakeAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.STAKING_ACTIVATE_SIGNED_TX_WITH_MEMO);
    });

    it('build a create and delegate staking unsigned tx', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .validator(validator.pub)
        .nonce(recentBlockHash);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: wallet.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.STAKING_ACTIVATE_UNSIGNED_TX);
    });

    it('build a create and delegate staking unsigned tx with memo', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder
        .amount(amount)
        .sender(wallet.pub)
        .stakingAddress(stakeAccount.pub)
        .validator(validator.pub)
        .memo('test memo')
        .nonce(recentBlockHash);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: wallet.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.STAKING_ACTIVATE_UNSIGNED_TX_WITH_MEMO);
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

    it('for invalid validator address', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.validator(invalidPubKey)).throwError(
        'Invalid or missing validator, got: ' + invalidPubKey
      );
    });

    it('build a staking activate tx when amount is invalid', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.amount('randomstring')).throwError('Value cannot be zero or less');
    });

    it('build a staking activate tx when amount is less than zero', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.amount('-1')).throwError('Value cannot be zero or less');
    });

    it('build a staking activate tx when amount is equal to zero', () => {
      const txBuilder = stakingBuilder();
      should(() => txBuilder.amount('0')).throwError('Value cannot be zero or less');
    });

    it('build a staking activate tx and sign with an incorrect account', async () => {
      const txBuilder = stakingBuilder();
      txBuilder.sender(wallet.pub);
      txBuilder.stakingAddress(stakeAccount.pub);
      txBuilder.validator(validator.pub);
      txBuilder.amount(amount);
      txBuilder.sign({ key: wrongAccount.prv });
      await txBuilder.build().should.rejectedWith('unknown signer: CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S');
    });

    it('build a staking activate tx with the same sender and staking address', async () => {
      const txBuilder = stakingBuilder();
      txBuilder.sender(wallet.pub);
      txBuilder.stakingAddress(wallet.pub);
      txBuilder.validator(validator.pub);
      txBuilder.amount(amount);
      txBuilder.sign({ key: wrongAccount.prv });
      await txBuilder.build().should.rejectedWith('Sender address cannot be the same as the Staking address');
    });

    it('build when nonce is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.sender(wallet.pub);
      txBuilder.stakingAddress(stakeAccount.pub);
      txBuilder.amount(amount);
      txBuilder.validator(validator.pub);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
    });

    it('build when sender is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.stakingAddress(stakeAccount.pub);
      txBuilder.amount(amount);
      txBuilder.validator(validator.pub);
      txBuilder.nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
    });

    it('build when stakingAddress is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.sender(wallet.pub);
      txBuilder.amount(amount);
      txBuilder.validator(validator.pub);
      txBuilder.nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Staking Address must be set before building the transaction');
    });

    it('build when validator is not provided', async () => {
      const txBuilder = factory.getStakingActivateBuilder();
      txBuilder.stakingAddress(stakeAccount.pub);
      txBuilder.sender(wallet.pub);
      txBuilder.amount(amount);
      txBuilder.nonce(recentBlockHash);
      txBuilder.sign({ key: wallet.prv });
      await txBuilder.build().should.rejectedWith('Validator must be set before building the transaction');
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
        const txBuilder = factory.from(testData.STAKING_ACTIVATE_UNSIGNED_TX);

        txBuilder.sign({ key: wallet.prv });
        txBuilder.sign({ key: stakeAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: wallet.pub,
          value: amount,
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(1);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.STAKING_ACTIVATE_SIGNED_TX);
      });

      it('build from an unsigned staking activate with memo and sign it', async () => {
        const txBuilder = factory.from(testData.STAKING_ACTIVATE_UNSIGNED_TX_WITH_MEMO);
        txBuilder.sign({ key: wallet.prv });
        txBuilder.sign({ key: stakeAccount.prv });
        const tx = await txBuilder.build();
        tx.inputs.length.should.equal(1);
        tx.inputs[0].should.deepEqual({
          address: wallet.pub,
          value: amount,
          coin: 'tsol',
        });
        tx.outputs.length.should.equal(1);
        const rawTx = tx.toBroadcastFormat();
        should.equal(Utils.isValidRawTransaction(rawTx), true);
        should.equal(rawTx, testData.STAKING_ACTIVATE_SIGNED_TX_WITH_MEMO);
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
