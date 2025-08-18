import should from 'should';

import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, StakingDeactivateBuilder, Utils } from '../../../src';
import * as testData from '../../resources/sol';
import { SolStakingTypeEnum } from '@bitgo/public-types';
import { BaseTransaction, Recipient, TransactionType } from '@bitgo/sdk-core';
import * as bs58 from 'bs58';
import { JITO_STAKE_POOL_ADDRESS } from '../../../src/lib/constants';

describe('Sol Staking Deactivate Builder', () => {
  const factory = getBuilderFactory('tsol');

  const walletKeyPair = new KeyPair(testData.authAccount);
  const wallet = walletKeyPair.getKeys();
  const stakeAccount = new KeyPair(testData.stakeAccount).getKeys();
  const splitAccount = new KeyPair(testData.splitStakeAccount).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];

  const performTest = async ({
    makeUnsignedBuilder,
    signBuilder,
    addSignatures,
    verifyBuiltTransaction,
    knownRawTx,
  }: {
    makeUnsignedBuilder: () => StakingDeactivateBuilder;
    signBuilder?: undefined | ((x: StakingDeactivateBuilder) => StakingDeactivateBuilder);
    addSignatures?: undefined | ((x: StakingDeactivateBuilder, signature: string[]) => StakingDeactivateBuilder);
    verifyBuiltTransaction: (x: BaseTransaction) => void;
    knownRawTx?: string;
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
    if (knownRawTx !== undefined) {
      should.equal(rawTx, knownRawTx);
    }

    // Rebuild transaction and verify
    const builderFromRawTx = factory.from(rawTx);
    const rebuiltTx = await builderFromRawTx.build();

    should.equal(rebuiltTx.toBroadcastFormat(), unsignedTx.toBroadcastFormat());
    should.equal(rebuiltTx.signablePayload.toString('hex'), unsignedTx.signablePayload.toString('hex'));
    should.deepEqual(rebuiltTx.toJson().instructionsData, tx.toJson().instructionsData);

    // Verify addSignature
    if (addSignatures) {
      const txBuilder2 = makeUnsignedBuilder();
      addSignatures(txBuilder2, tx.signature);
      const tx2 = await txBuilder2.build();
      should.equal(tx2.type, TransactionType.StakingDeactivate);
      const rawTx2 = tx2.toBroadcastFormat();
      should.deepEqual(tx2.toJson().instructionsData, tx.toJson().instructionsData);
      if (knownRawTx !== undefined) {
        should.equal(rawTx2, knownRawTx);
      }
    }
  };

  const makeUnsignedBuilderNativeGeneric = (doMemo: boolean, stakingAddress: string | string[]) => {
    const txBuilder = factory.getStakingDeactivateBuilder();
    txBuilder.sender(wallet.pub);
    if (typeof stakingAddress === 'string') {
      txBuilder.stakingAddress(stakingAddress);
    } else {
      txBuilder.stakingAddresses(stakingAddress);
    }
    txBuilder.nonce(recentBlockHash);
    if (doMemo) {
      txBuilder.memo('Test deactivate');
    }
    return txBuilder;
  };

  const signBuilderNative = (txBuilder: StakingDeactivateBuilder) => {
    txBuilder.sign({ key: wallet.prv });
    return txBuilder;
  };

  const addSignaturesNative = (txBuilder: StakingDeactivateBuilder, signature: string[]) => {
    txBuilder.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signature[0])));
    return txBuilder;
  };

  const verifyBuiltTransactionNativeGeneric = (tx: BaseTransaction, doMemo: boolean, stakingAddresses: string[]) => {
    const txJson = tx.toJson();
    txJson.instructionsData.should.deepEqual([
      ...(doMemo
        ? [
            {
              type: 'Memo',
              params: {
                memo: 'Test deactivate',
              },
            },
          ]
        : []),
      ...stakingAddresses.map((stakingAddress) => ({
        type: 'Deactivate',
        params: {
          stakingAddress,
          amount: undefined,
          fromAddress: wallet.pub,
          unstakingAddress: undefined,
          stakingType: SolStakingTypeEnum.NATIVE,
        },
      })),
    ]);
  };

  describe('Should succeed', () => {
    describe('Native staking deactivate', () => {
      const performTestNative = async (
        doMemo: boolean,
        stakingAddress: string | string[],
        doSign: boolean,
        knownRawTx: string | undefined
      ) => {
        const stakingAddresses = typeof stakingAddress === 'string' ? [stakingAddress] : stakingAddress;
        await performTest({
          makeUnsignedBuilder: () => makeUnsignedBuilderNativeGeneric(doMemo, stakingAddress),
          signBuilder: doSign ? signBuilderNative : undefined,
          addSignatures: doSign ? addSignaturesNative : undefined,
          verifyBuiltTransaction: (tx) => verifyBuiltTransactionNativeGeneric(tx, doMemo, stakingAddresses),
          knownRawTx,
        });
      };

      it('building a staking deactivate tx', async () => {
        await performTestNative(false, stakeAccount.pub, true, testData.STAKING_DEACTIVATE_SIGNED_TX);
      });

      it('building a staking multi deactivate tx', async () => {
        await performTestNative(
          false,
          [stakeAccount.pub, splitAccount.pub],
          true,
          testData.STAKING_MULTI_DEACTIVATE_SIGNED_TX
        );
      });

      it('should build and sign a multi deactivate single', async function () {
        await performTestNative(false, [stakeAccount.pub], true, testData.STAKING_MULTI_DEACTIVATE_SIGNED_TX_single);
      });

      it('should build and sign a deactivate single', async function () {
        await performTestNative(false, stakeAccount.pub, true, testData.STAKING_DEACTIVATE_SIGNED_TX_single);
      });

      it('building a staking deactivate signed tx with memo', async () => {
        await performTestNative(true, stakeAccount.pub, true, testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
      });

      it('building a staking deactivate unsigned tx', async () => {
        await performTestNative(false, stakeAccount.pub, false, testData.STAKING_DEACTIVATE_UNSIGNED_TX);
      });

      it('building a staking deactivate unsigned tx with memo', async () => {
        await performTestNative(true, stakeAccount.pub, false, testData.STAKING_DEACTIVATE_UNSIGNED_TX_WITH_MEMO);
      });

      it('building a staking deactivate unsigned tx with memo', async () => {
        await performTestNative(true, stakeAccount.pub, false, testData.STAKING_DEACTIVATE_UNSIGNED_TX_WITH_MEMO);
      });

      it('all combinations', async () => {
        for (const doMemo of [false, true]) {
          for (const stakingAddress of [stakeAccount.pub, [stakeAccount.pub], [stakeAccount.pub, splitAccount.pub]]) {
            for (const doSign of [false, true]) {
              await performTestNative(doMemo, stakingAddress, doSign, undefined);
            }
          }
        }
      });

      it('building an encoded signed transaction', async () => {
        const txBuilder = factory.from(testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
        txBuilder.sign({ key: wallet.prv });
        const tx = await txBuilder.build();
        should.equal(tx.toBroadcastFormat(), testData.STAKING_DEACTIVATE_SIGNED_TX_WITH_MEMO);
      });

      it('building an encoded unsigned transaction and signing it', async () => {
        const txBuilder = factory.from(testData.STAKING_DEACTIVATE_UNSIGNED_TX_WITH_MEMO);
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
              stakingType: SolStakingTypeEnum.NATIVE,
            },
          },
        ]);
        should.equal(rawTx, testData.STAKING_PARTIAL_DEACTIVATE_SIGNED_TX);

        const tx2 = await factory.from(testData.STAKING_PARTIAL_DEACTIVATE_SIGNED_TX).build();
        const txJson2 = tx2.toJson();
        tx2.toBroadcastFormat();

        delete tx['_id'];
        delete tx2['_id'];

        // should.deepEqual(tx, tx2) // _useTokenAddressTokenName true for tx2
        should.deepEqual(txJson2, txJson2);
      });
    });

    describe('Marinade staking deactivate', () => {
      const marinadeRecipientsObject: Recipient[] = [];
      marinadeRecipientsObject.push({
        address: 'opNS8ENpEMWdXcJUgJCsJTDp7arTXayoBEeBUg6UezP',
        amount: '2300000',
      });

      const marinadeMemo = `{\\"PrepareForRevoke\\":{\\"user\\":\\"${wallet.pub}}\\",\\"amount\\":\\"500000000000\\"}`;

      it('Marinade: build and sign a staking deactivate tx', async () => {
        await performTest({
          makeUnsignedBuilder: () => {
            const txBuilder = factory.getStakingDeactivateBuilder();
            txBuilder
              .sender(wallet.pub)
              .stakingAddress(stakeAccount.pub)
              .nonce(recentBlockHash)
              .stakingType(SolStakingTypeEnum.MARINADE)
              .memo(marinadeMemo)
              .recipients(marinadeRecipientsObject);
            return txBuilder;
          },
          signBuilder: signBuilderNative,
          addSignatures: addSignaturesNative,
          verifyBuiltTransaction: (tx: BaseTransaction) => {
            const txJson = tx.toJson();
            txJson.instructionsData.should.deepEqual([
              {
                params: {
                  memo: marinadeMemo,
                },
                type: 'Memo',
              },
              {
                type: 'Deactivate',
                params: {
                  fromAddress: '',
                  stakingAddress: '',
                  stakingType: SolStakingTypeEnum.MARINADE,
                  recipients: marinadeRecipientsObject,
                },
              },
            ]);
          },
          knownRawTx: testData.MARINADE_STAKING_DEACTIVATE_SIGNED_TX,
        });
      });
    });

    describe('Jito staking deactivate', () => {
      it('Jito: build and sign a staking deactivate tx', async () => {
        const transferAuthority = new KeyPair(testData.splitStakeAccount).getKeys();

        await performTest({
          makeUnsignedBuilder: () => {
            const txBuilder = factory.getStakingDeactivateBuilder();
            txBuilder
              .sender(wallet.pub)
              .stakingAddress(JITO_STAKE_POOL_ADDRESS)
              .unstakingAddress(stakeAccount.pub)
              .stakingType(SolStakingTypeEnum.JITO)
              .extraParams({
                validatorAddress: testData.JITO_STAKE_POOL_VALIDATOR_ADDRESS,
                transferAuthorityAddress: transferAuthority.pub,
                stakePoolData: {
                  managerFeeAccount: testData.JITO_STAKE_POOL_DATA_PARSED.managerFeeAccount.toString(),
                  poolMint: testData.JITO_STAKE_POOL_DATA_PARSED.poolMint.toString(),
                  validatorListAccount: testData.JITO_STAKE_POOL_DATA_PARSED.validatorList.toString(),
                },
              })
              .amount('1000')
              .nonce(recentBlockHash);
            return txBuilder;
          },
          signBuilder: (txBuilder: StakingDeactivateBuilder) => {
            txBuilder.sign({ key: wallet.prv });
            txBuilder.sign({ key: stakeAccount.prv });
            txBuilder.sign({ key: transferAuthority.prv });
            return txBuilder;
          },
          addSignatures: (txBuilder: StakingDeactivateBuilder, signature: string[]) => {
            txBuilder.addSignature({ pub: wallet.pub }, Buffer.from(bs58.decode(signature[0])));
            txBuilder.addSignature({ pub: stakeAccount.pub }, Buffer.from(bs58.decode(signature[1])));
            txBuilder.addSignature({ pub: transferAuthority.pub }, Buffer.from(bs58.decode(signature[2])));
            return txBuilder;
          },
          verifyBuiltTransaction: (tx: BaseTransaction) => {
            const txJson = tx.toJson();
            txJson.instructionsData.should.deepEqual([
              {
                type: 'Deactivate',
                params: {
                  fromAddress: wallet.pub,
                  stakingAddress: JITO_STAKE_POOL_ADDRESS,
                  unstakingAddress: stakeAccount.pub,
                  amount: '1000',
                  stakingType: SolStakingTypeEnum.JITO,
                  extraParams: {
                    validatorAddress: testData.JITO_STAKE_POOL_VALIDATOR_ADDRESS,
                    transferAuthorityAddress: transferAuthority.pub,
                    stakePoolData: {
                      managerFeeAccount: testData.JITO_STAKE_POOL_DATA_PARSED.managerFeeAccount.toString(),
                      poolMint: testData.JITO_STAKE_POOL_DATA_PARSED.poolMint.toString(),
                      validatorListAccount: testData.JITO_STAKE_POOL_DATA_PARSED.validatorList.toString(),
                    },
                  },
                },
              },
            ]);
          },
          knownRawTx: testData.JITO_STAKING_DEACTIVATE_SIGNED_TX,
        });
      });
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
