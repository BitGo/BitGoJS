import should from 'should';

import * as testData from '../../resources/sol';
import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils, StakingActivateBuilder } from '../../../src';
import { JITO_STAKE_POOL_ADDRESS, JITOSOL_MINT_ADDRESS } from '../../../src/lib/constants';
import { StakingType } from '../../../src/lib/iface';
import { BaseTransaction } from '@bitgo/sdk-core';

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

  const performTest = async ({
    signBuilder,
    knownRawTx,
    makeUnsignedBuilder,
    verifyBuiltTransaction,
  }: {
    signBuilder?: undefined | ((x: StakingActivateBuilder) => StakingActivateBuilder);
    knownRawTx: string;
    makeUnsignedBuilder: () => StakingActivateBuilder;
    verifyBuiltTransaction: (x: BaseTransaction) => void;
  }) => {
    // Build transaction
    const txBuilder = makeUnsignedBuilder();
    const unsignedTx = await txBuilder.build();
    const tx = signBuilder ? await signBuilder(txBuilder).build() : unsignedTx;

    // Verify built transaction
    verifyBuiltTransaction(tx);

    // Verify raw transaction
    const rawTx = tx.toBroadcastFormat();
    should.equal(Utils.isValidRawTransaction(rawTx), true);
    should.equal(rawTx, knownRawTx);

    // Rebuild transaction and verify
    const builderFromRawTx = factory.from(rawTx);
    const rebuiltTx = await builderFromRawTx.build();

    should.equal(rebuiltTx.toBroadcastFormat(), unsignedTx.toBroadcastFormat());
    should.equal(rebuiltTx.signablePayload.toString('hex'), unsignedTx.signablePayload.toString('hex'));
    should.deepEqual(rebuiltTx.toJson().instructionsData, tx.toJson().instructionsData);
  };

  const makeUnsignedBuilderNative = (doMemo: boolean) => {
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder
      .amount(amount)
      .sender(wallet.pub)
      .stakingAddress(stakeAccount.pub)
      .validator(validator.pub)
      .nonce(recentBlockHash);
    if (doMemo) {
      txBuilder.memo('test memo');
    }
    return txBuilder;
  };

  const verifyBuiltTransactionNativeOrMarinade = (
    tx: BaseTransaction,
    doMemo: boolean,
    stakingType: StakingType.NATIVE | StakingType.MARINADE
  ) => {
    const txJson = tx.toJson();
    txJson.instructionsData.should.deepEqual([
      ...(doMemo
        ? [
            {
              type: 'Memo',
              params: {
                memo: 'test memo',
              },
            },
          ]
        : []),
      {
        type: 'Activate',
        params: {
          fromAddress: wallet.pub,
          stakingAddress: stakeAccount.pub,
          amount: amount,
          validator: validator.pub,
          stakingType,
        },
      },
    ]);
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
  };

  const signBuilderNativeOrMarinade = (txBuilder: StakingActivateBuilder) => {
    txBuilder.sign({ key: wallet.prv });
    txBuilder.sign({ key: stakeAccount.prv });
    return txBuilder;
  };

  const makeUnsignedBuilderMarinade = (doMemo: boolean) => {
    return makeUnsignedBuilderNative(doMemo).stakingType(StakingType.MARINADE);
  };

  const makeUnsignedBuilderJito = (doMemo: boolean) => {
    const txBuilder = factory.getStakingActivateBuilder();
    txBuilder
      .amount(amount)
      .sender(wallet.pub)
      .stakingAddress(JITO_STAKE_POOL_ADDRESS)
      .validator(JITO_STAKE_POOL_ADDRESS)
      .stakingType(StakingType.JITO)
      .extraParams({
        stakePoolData: {
          managerFeeAccount: testData.JITO_STAKE_POOL_DATA_PARSED.managerFeeAccount.toString(),
          poolMint: testData.JITO_STAKE_POOL_DATA_PARSED.poolMint.toString(),
          reserveStake: testData.JITO_STAKE_POOL_DATA_PARSED.reserveStake.toString(),
        },
      })
      .nonce(recentBlockHash);
    if (doMemo) {
      txBuilder.memo('test memo');
    }
    return txBuilder;
  };

  const signBuilderJito = (txBuilder: StakingActivateBuilder) => {
    txBuilder.sign({ key: wallet.prv });
    return txBuilder;
  };

  const verifyBuiltTransactionJito = (tx: BaseTransaction, doMemo: boolean) => {
    const txJson = tx.toJson();
    txJson.instructionsData.should.deepEqual([
      {
        type: 'CreateAssociatedTokenAccount',
        params: {
          ataAddress: '2vJrx2Bn7PifLZDRaSCpphE9WtZsx1k43SRyiQDhE1As',
          mintAddress: JITOSOL_MINT_ADDRESS,
          ownerAddress: wallet.pub,
          payerAddress: wallet.pub,
          tokenName: 'sol:jitosol',
        },
      },
      ...(doMemo
        ? [
            {
              type: 'Memo',
              params: {
                memo: 'test memo',
              },
            },
          ]
        : []),
      {
        type: 'Activate',
        params: {
          fromAddress: wallet.pub,
          stakingAddress: JITO_STAKE_POOL_ADDRESS,
          amount: amount,
          validator: JITO_STAKE_POOL_ADDRESS,
          stakingType: StakingType.JITO,
          extraParams: {
            stakePoolData: {
              managerFeeAccount: testData.JITO_STAKE_POOL_DATA_PARSED.managerFeeAccount.toString(),
              poolMint: testData.JITO_STAKE_POOL_DATA_PARSED.poolMint.toString(),
              reserveStake: testData.JITO_STAKE_POOL_DATA_PARSED.reserveStake.toString(),
            },
          },
        },
      },
    ]);
    tx.inputs.length.should.equal(1);
    tx.inputs[0].should.deepEqual({
      address: wallet.pub,
      value: amount,
      coin: 'tsol',
    });
    tx.outputs.length.should.equal(1);
    tx.outputs[0].should.deepEqual({
      address: JITO_STAKE_POOL_ADDRESS,
      value: amount,
      coin: 'tsol',
    });
  };

  describe('Succeed', () => {
    describe('Native staking tests', () => {
      const performTestNative = async (doMemo: boolean, doSign: boolean, knownRawTx: string) => {
        await performTest({
          signBuilder: doSign ? signBuilderNativeOrMarinade : undefined,
          knownRawTx,
          makeUnsignedBuilder: () => makeUnsignedBuilderNative(doMemo),
          verifyBuiltTransaction: (x) => verifyBuiltTransactionNativeOrMarinade(x, doMemo, StakingType.NATIVE),
        });
      };

      it('build a create and delegate staking signed tx', async () =>
        performTestNative(false, true, testData.STAKING_ACTIVATE_SIGNED_TX));

      it('build a create and delegate staking signed tx with memo', async () =>
        performTestNative(true, true, testData.STAKING_ACTIVATE_SIGNED_TX_WITH_MEMO));

      it('build a create and delegate staking unsigned tx', async () =>
        performTestNative(false, false, testData.STAKING_ACTIVATE_UNSIGNED_TX));

      it('build a create and delegate staking unsigned tx with memo', async () =>
        performTestNative(true, false, testData.STAKING_ACTIVATE_UNSIGNED_TX_WITH_MEMO));
    });

    describe('Marinade staking tests', () => {
      const performTestMarinade = async (doMemo: boolean, doSign: boolean, knownRawTx: string) => {
        await performTest({
          signBuilder: doSign ? signBuilderNativeOrMarinade : undefined,
          knownRawTx,
          makeUnsignedBuilder: () => makeUnsignedBuilderMarinade(doMemo),
          verifyBuiltTransaction: (x) => verifyBuiltTransactionNativeOrMarinade(x, doMemo, StakingType.MARINADE),
        });
      };

      it('build a create staking signed tx', async () =>
        performTestMarinade(false, true, testData.MARINADE_STAKING_ACTIVATE_SIGNED_TX));

      it('build a create signed tx with memo', async () =>
        performTestMarinade(true, true, testData.MARINADE_STAKING_ACTIVATE_SIGNED_TX_WITH_MEMO));

      it('build a create unsigned tx', async () =>
        performTestMarinade(false, false, testData.MARINADE_STAKING_ACTIVATE_UNSIGNED_TX));

      it('build a create unsigned tx with memo', async () =>
        performTestMarinade(true, false, testData.MARINADE_STAKING_ACTIVATE_UNSIGNED_TX_WITH_MEMO));
    });

    describe('Jito staking tests', () => {
      const performTestJito = async (doMemo: boolean, doSign: boolean, knownRawTx: string) => {
        await performTest({
          signBuilder: doSign ? signBuilderJito : undefined,
          knownRawTx,
          makeUnsignedBuilder: () => makeUnsignedBuilderJito(doMemo),
          verifyBuiltTransaction: (x) => verifyBuiltTransactionJito(x, doMemo),
        });
      };

      it('build a create staking signed tx', async () =>
        performTestJito(false, true, testData.JITO_STAKING_ACTIVATE_SIGNED_TX));

      it('build a create signed tx with memo', async () =>
        performTestJito(true, true, testData.JITO_STAKING_ACTIVATE_SIGNED_TX_WITH_MEMO));

      it('build a create unsigned tx', async () =>
        performTestJito(false, false, testData.JITO_STAKING_ACTIVATE_UNSIGNED_TX));

      it('build a create unsigned tx with memo', async () =>
        performTestJito(true, false, testData.JITO_STAKING_ACTIVATE_UNSIGNED_TX_WITH_MEMO));
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

      it('Marinade: build from an unsigned staking activate and sign it', async () => {
        const txBuilder = factory.from(testData.MARINADE_STAKING_ACTIVATE_UNSIGNED_TX);

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
        should.equal(rawTx, testData.MARINADE_STAKING_ACTIVATE_SIGNED_TX);
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
