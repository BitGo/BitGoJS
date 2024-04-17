import should from 'should';
import * as testData from '../resources/sol';
import { instructionParamsFactory } from '../../src/lib/instructionParamsFactory';
import { TransactionType } from '@bitgo/sdk-core';
import { InstructionParams, Nonce, StakingActivate, StakingDeactivate, StakingWithdraw } from '../../src/lib/iface';
import { InstructionBuilderTypes, MEMO_PROGRAM_PK, STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT } from '../../src/lib/constants';
import {
  Keypair as SolKeypair,
  Lockup,
  PublicKey,
  StakeProgram,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';

describe('Instruction Parser Staking Tests: ', function () {
  describe('Activate staking instructions ', function () {
    it('Should parse activate stake tx instructions with memo and durable nonce', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const nonceAccount = testData.nonceAccount.pub;
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';
      const memo = 'test memo';

      // Instructions
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: fromAccount,
      });

      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      // Params
      const nonceAdvanceParams: Nonce = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
      };

      const stakingActivateParams: StakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          validator: validator.toString(),
          amount,
        },
      };

      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const instructions = [
        nonceAdvanceInstruction,
        ...stakingActivateInstructions,
        ...stakingDelegateInstructions,
        memoInstruction,
      ];
      const instructionsData = [nonceAdvanceParams, memoParams, stakingActivateParams];
      const result = instructionParamsFactory(TransactionType.StakingActivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse activate stake tx instructions with memo and durable nonce with instructions in any order', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const nonceAccount = testData.nonceAccount.pub;
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';
      const memo = 'test memo';

      // Instructions
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: fromAccount,
      });

      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      // Params
      const nonceAdvanceParams: Nonce = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
      };

      const stakingActivateParams: StakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          validator: validator.toString(),
          amount,
        },
      };

      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const instructions = [
        memoInstruction,
        ...stakingActivateInstructions,
        ...stakingDelegateInstructions,
        nonceAdvanceInstruction,
      ];
      const instructionsData = [memoParams, nonceAdvanceParams, stakingActivateParams];
      const result = instructionParamsFactory(TransactionType.StakingActivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse activate stake tx instructions without memo or durable nonce', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';

      // Instructions
      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      // Params
      const stakingActivateParams: StakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          validator: validator.toString(),
          amount,
        },
      };

      const instructions = [...stakingActivateInstructions, ...stakingDelegateInstructions];
      const instructionsData = [stakingActivateParams];
      const result = instructionParamsFactory(TransactionType.StakingActivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse activate stake tx instructions if there are unexpected instructions', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';

      // Instructions
      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      const stakingDeactivateInstructions = StakeProgram.deactivate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
      }).instructions;

      // Params
      const stakingActivateParams: StakingActivate = {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          validator: validator.toString(),
          amount,
        },
      };

      const instructions = [
        ...stakingActivateInstructions,
        ...stakingDelegateInstructions,
        ...stakingDeactivateInstructions,
      ];
      const instructionsData = [stakingActivateParams];
      const result = instructionParamsFactory(TransactionType.StakingActivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should fail to parse activate stake tx instructions if there are missing instructions', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';

      // Instructions
      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      should.throws(() => {
        const instructions = [stakingActivateInstructions[1], ...stakingDelegateInstructions];
        instructionParamsFactory(TransactionType.StakingActivate, instructions);
      }, 'Invalid staking activate transaction, missing create stake account instruction');

      should.throws(() => {
        const instructions = [stakingActivateInstructions[0], ...stakingDelegateInstructions];
        instructionParamsFactory(TransactionType.StakingActivate, instructions);
      }, 'Invalid staking activate transaction, missing initialize stake account instruction');

      should.throws(() => {
        const instructions = [...stakingActivateInstructions];
        instructionParamsFactory(TransactionType.StakingActivate, instructions);
      }, 'Invalid staking activate transaction, missing delegate instruction');
    });
  });

  describe('Deactivate staking instructions ', function () {
    it('Should parse deactivate stake tx instructions with memo and durable nonce', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const nonceAccount = testData.nonceAccount.pub;
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const memo = 'test memo';

      // Instructions
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: fromAccount,
      });

      const stakingDeactivateInstructions = StakeProgram.deactivate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
      }).instructions;

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      // Params
      const nonceAdvanceParams: Nonce = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
      };

      const stakingDeactivateParams: StakingDeactivate = {
        type: InstructionBuilderTypes.StakingDeactivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount: undefined,
          unstakingAddress: undefined,
        },
      };

      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const instructions = [nonceAdvanceInstruction, ...stakingDeactivateInstructions, memoInstruction];
      const instructionsData = [nonceAdvanceParams, memoParams, stakingDeactivateParams];
      const result = instructionParamsFactory(TransactionType.StakingDeactivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse deactivate stake tx instructions with memo and durable nonce with instructions in any order', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const nonceAccount = testData.nonceAccount.pub;
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const memo = 'test memo';

      // Instructions
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: fromAccount,
      });

      const stakingDeactivateInstructions = StakeProgram.deactivate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
      }).instructions;

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      // Params
      const nonceAdvanceParams: Nonce = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
      };

      const stakingDeactivateParams: StakingDeactivate = {
        type: InstructionBuilderTypes.StakingDeactivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount: undefined,
          unstakingAddress: undefined,
        },
      };

      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const instructions = [memoInstruction, ...stakingDeactivateInstructions, nonceAdvanceInstruction];
      const instructionsData = [memoParams, nonceAdvanceParams, stakingDeactivateParams];
      const result = instructionParamsFactory(TransactionType.StakingDeactivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse deactivate stake tx instructions without memo or durable nonce', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);

      // Instructions
      const stakingDeactivateInstructions = StakeProgram.deactivate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
      }).instructions;

      // Params
      const stakingDeactivateParams: StakingDeactivate = {
        type: InstructionBuilderTypes.StakingDeactivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount: undefined,
          unstakingAddress: undefined,
        },
      };

      const instructions = [...stakingDeactivateInstructions];
      const instructionsData = [stakingDeactivateParams];
      const result = instructionParamsFactory(TransactionType.StakingDeactivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse deactivate stake tx instructions if there are unexpected instructions', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';

      // Instructions
      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      const stakingDeactivateInstructions = StakeProgram.deactivate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
      }).instructions;

      // Params
      const stakingActivateParams: StakingDeactivate = {
        type: InstructionBuilderTypes.StakingDeactivate,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount: undefined,
          unstakingAddress: undefined,
        },
      };

      const instructions = [
        ...stakingActivateInstructions,
        ...stakingDelegateInstructions,
        ...stakingDeactivateInstructions,
      ];
      const instructionsData = [stakingActivateParams];
      const result = instructionParamsFactory(TransactionType.StakingDeactivate, instructions);
      should.deepEqual(result, instructionsData);
    });

    describe('Partially deactivate stake instructions', function () {
      describe('Input validation', function () {
        it('Should throw an error if the Allocate instruction is missing', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const assignInstruction = SystemProgram.assign({
            accountPubkey: splitStakeAccount,
            programId: StakeProgram.programId,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: splitStakeAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            assignInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, missing allocate unstake account instruction'
          );
        });

        it('Should throw an error if the Assign instruction is missing', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: splitStakeAccount,
            space: StakeProgram.space,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: splitStakeAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, missing assign unstake account instruction'
          );
        });

        it('Should throw an error if the Split instruction is missing', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: splitStakeAccount,
            space: StakeProgram.space,
          });

          const assignInstruction = SystemProgram.assign({
            accountPubkey: splitStakeAccount,
            programId: StakeProgram.programId,
          });

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            assignInstruction,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, missing split stake account instruction'
          );
        });
        it('Should throw an error if the transfer instruction is missing for partial', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: splitStakeAccount,
            space: StakeProgram.space,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: splitStakeAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const assignInstruction = SystemProgram.assign({
            accountPubkey: splitStakeAccount,
            programId: StakeProgram.programId,
          });

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            assignInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, missing funding of unstake address instruction'
          );
        });

        it('Should throw an error if the allocated account does not match the assigned account', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: new SolKeypair().publicKey,
            space: StakeProgram.space,
          });

          const assignInstruction = SystemProgram.assign({
            accountPubkey: splitStakeAccount,
            programId: StakeProgram.programId,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: splitStakeAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            assignInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, must allocate and assign the same public key'
          );
        });

        [199, 201].forEach((space) => {
          it(`Should throw an error if the correct amount of space is not allocated for the split account - ${space}`, () => {
            const fromAccount = new PublicKey(testData.authAccount.pub);
            const nonceAccount = testData.nonceAccount.pub;
            const stakingAccount = new PublicKey(testData.stakeAccount.pub);
            const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
            const memo = 'test memo';

            // Instructions
            const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
              noncePubkey: new PublicKey(nonceAccount),
              authorizedPubkey: fromAccount,
            });

            const allocateInstruction = SystemProgram.allocate({
              accountPubkey: splitStakeAccount,
              space,
            });

            const assignInstruction = SystemProgram.assign({
              accountPubkey: splitStakeAccount,
              programId: StakeProgram.programId,
            });

            const splitInstructions = StakeProgram.split(
              {
                stakePubkey: stakingAccount,
                authorizedPubkey: fromAccount,
                splitStakePubkey: splitStakeAccount,
                lamports: 100000,
              },
              0
            ).instructions;

            const stakingDeactivateInstructions = StakeProgram.deactivate({
              authorizedPubkey: fromAccount,
              stakePubkey: splitStakeAccount,
            }).instructions;

            const memoInstruction = new TransactionInstruction({
              keys: [],
              programId: new PublicKey(MEMO_PROGRAM_PK),
              data: Buffer.from(memo),
            });

            const instructions = [
              nonceAdvanceInstruction,
              allocateInstruction,
              assignInstruction,
              ...splitInstructions,
              ...stakingDeactivateInstructions,
              memoInstruction,
            ];
            should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
              `Invalid partial deactivate stake transaction, unstaking account must allocate ${StakeProgram.space} bytes`
            );
          });
        });

        it('Should throw an error if the allocated account is not assigned to the StakeProgram', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: splitStakeAccount,
            space: StakeProgram.space,
          });

          const assignInstruction = SystemProgram.assign({
            accountPubkey: splitStakeAccount,
            programId: SystemProgram.programId,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: splitStakeAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            assignInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, the unstake account must be assigned to the Stake Program'
          );
        });

        it('Should throw an error if the split account is not allocated', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const key = new SolKeypair().publicKey;
          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: key,
            space: StakeProgram.space,
          });

          const assignInstruction = SystemProgram.assign({
            accountPubkey: key,
            programId: StakeProgram.programId,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: stakingAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            assignInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, must allocate the unstaking account'
          );
        });

        it('Should throw an error if the stake account and the split account are the same account', () => {
          const fromAccount = new PublicKey(testData.authAccount.pub);
          const nonceAccount = testData.nonceAccount.pub;
          const stakingAccount = new PublicKey(testData.stakeAccount.pub);
          const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
          const memo = 'test memo';

          // Instructions
          const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
            noncePubkey: new PublicKey(nonceAccount),
            authorizedPubkey: fromAccount,
          });

          const allocateInstruction = SystemProgram.allocate({
            accountPubkey: stakingAccount,
            space: StakeProgram.space,
          });

          const assignInstruction = SystemProgram.assign({
            accountPubkey: stakingAccount,
            programId: StakeProgram.programId,
          });

          const splitInstructions = StakeProgram.split(
            {
              stakePubkey: stakingAccount,
              authorizedPubkey: fromAccount,
              splitStakePubkey: stakingAccount,
              lamports: 100000,
            },
            0
          ).instructions;

          const stakingDeactivateInstructions = StakeProgram.deactivate({
            authorizedPubkey: fromAccount,
            stakePubkey: splitStakeAccount,
          }).instructions;

          const memoInstruction = new TransactionInstruction({
            keys: [],
            programId: new PublicKey(MEMO_PROGRAM_PK),
            data: Buffer.from(memo),
          });

          const instructions = [
            nonceAdvanceInstruction,
            allocateInstruction,
            assignInstruction,
            ...splitInstructions,
            ...stakingDeactivateInstructions,
            memoInstruction,
          ];
          should(() => instructionParamsFactory(TransactionType.StakingDeactivate, instructions)).throw(
            'Invalid partial deactivate stake transaction, the unstaking account must be different from the Stake Account'
          );
        });
      });

      it('Should parse partial deactivate stake tx instructions with memo and durable nonce', () => {
        const fromAccount = new PublicKey(testData.authAccount.pub);
        const nonceAccount = testData.nonceAccount.pub;
        const stakingAccount = new PublicKey(testData.stakeAccount.pub);
        const splitStakeAccount = new PublicKey(testData.splitStakeAccount.pub);
        const memo = 'test memo';

        // Instructions
        const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(nonceAccount),
          authorizedPubkey: fromAccount,
        });

        // transfer
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: new PublicKey(fromAccount),
          toPubkey: new PublicKey(splitStakeAccount),
          lamports: parseInt(STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT.toString(), 10),
        });

        const allocateInstruction = SystemProgram.allocate({
          accountPubkey: splitStakeAccount,
          space: StakeProgram.space,
        });

        const assignInstruction = SystemProgram.assign({
          accountPubkey: splitStakeAccount,
          programId: StakeProgram.programId,
        });

        const splitInstructions = StakeProgram.split(
          {
            stakePubkey: stakingAccount,
            authorizedPubkey: fromAccount,
            splitStakePubkey: splitStakeAccount,
            lamports: 100000,
          },
          0
        ).instructions;

        const stakingDeactivateInstructions = StakeProgram.deactivate({
          authorizedPubkey: fromAccount,
          stakePubkey: splitStakeAccount,
        }).instructions;

        const memoInstruction = new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_PK),
          data: Buffer.from(memo),
        });

        // Params
        const nonceAdvanceParams: Nonce = {
          type: InstructionBuilderTypes.NonceAdvance,
          params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
        };

        const stakingDeactivateParams: StakingDeactivate = {
          type: InstructionBuilderTypes.StakingDeactivate,
          params: {
            fromAddress: fromAccount.toString(),
            stakingAddress: stakingAccount.toString(),
            amount: '100000',
            unstakingAddress: splitStakeAccount.toString(),
          },
        };

        const memoParams: InstructionParams = {
          type: InstructionBuilderTypes.Memo,
          params: { memo },
        };

        const instructions = [
          nonceAdvanceInstruction,
          transferInstruction,
          allocateInstruction,
          assignInstruction,
          ...splitInstructions,
          ...stakingDeactivateInstructions,
          memoInstruction,
        ];
        const instructionsData = [nonceAdvanceParams, memoParams, stakingDeactivateParams];
        const result = instructionParamsFactory(TransactionType.StakingDeactivate, instructions);
        should.deepEqual(result, instructionsData);
      });
    });
  });

  describe('Withdraw stake instructions ', function () {
    it('Should parse withdraw stake tx instructions with memo and durable nonce', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const nonceAccount = testData.nonceAccount.pub;
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const memo = 'test memo';
      const amount = '100000';

      // Instructions
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: fromAccount,
      });

      const withdrawStakeInstructions = StakeProgram.withdraw({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        toPubkey: fromAccount,
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      // Params
      const nonceAdvanceParams: Nonce = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
      };

      const withdrawStakeParams: StakingWithdraw = {
        type: InstructionBuilderTypes.StakingWithdraw,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount,
        },
      };

      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const instructions = [nonceAdvanceInstruction, ...withdrawStakeInstructions, memoInstruction];
      const instructionsData = [nonceAdvanceParams, withdrawStakeParams, memoParams];
      const result = instructionParamsFactory(TransactionType.StakingWithdraw, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse withdraw stake tx instructions with memo and durable nonce with instructions in any order', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const nonceAccount = testData.nonceAccount.pub;
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const memo = 'test memo';
      const amount = '100000';

      // Instructions
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: fromAccount,
      });

      const withdrawStakeInstructions = StakeProgram.withdraw({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        toPubkey: fromAccount,
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      // Params
      const nonceAdvanceParams: Nonce = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: fromAccount.toString() },
      };

      const withdrawStakeParams: StakingWithdraw = {
        type: InstructionBuilderTypes.StakingWithdraw,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount,
        },
      };

      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const instructions = [memoInstruction, ...withdrawStakeInstructions, nonceAdvanceInstruction];
      const instructionsData = [memoParams, withdrawStakeParams, nonceAdvanceParams];
      const result = instructionParamsFactory(TransactionType.StakingWithdraw, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse withdraw stake tx instructions without memo or durable nonce', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const amount = '100000';

      // Instructions
      const withdrawStakeInstructions = StakeProgram.withdraw({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        toPubkey: fromAccount,
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      // Params
      const withdrawStakeParams: StakingWithdraw = {
        type: InstructionBuilderTypes.StakingWithdraw,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount,
        },
      };

      const instructions = [...withdrawStakeInstructions];
      const instructionsData = [withdrawStakeParams];
      const result = instructionParamsFactory(TransactionType.StakingWithdraw, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Should parse withdraw stake tx instructions if there are unexpected instructions', () => {
      const fromAccount = new PublicKey(testData.authAccount.pub);
      const stakingAccount = new PublicKey(testData.stakeAccount.pub);
      const validator = new PublicKey(testData.validator.pub);
      const amount = '100000';

      // Instructions
      const stakingActivateInstructions = StakeProgram.createAccount({
        fromPubkey: fromAccount,
        stakePubkey: stakingAccount,
        authorized: {
          staker: fromAccount,
          withdrawer: fromAccount,
        },
        lockup: new Lockup(0, 0, fromAccount),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const stakingDelegateInstructions = StakeProgram.delegate({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        votePubkey: validator,
      }).instructions;

      const withdrawStakeInstructions = StakeProgram.withdraw({
        authorizedPubkey: fromAccount,
        stakePubkey: stakingAccount,
        toPubkey: fromAccount,
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      // Params
      const withdrawStakeParams: StakingWithdraw = {
        type: InstructionBuilderTypes.StakingWithdraw,
        params: {
          fromAddress: fromAccount.toString(),
          stakingAddress: stakingAccount.toString(),
          amount,
        },
      };

      const instructions = [
        ...stakingActivateInstructions,
        ...stakingDelegateInstructions,
        ...withdrawStakeInstructions,
      ];
      const instructionsData = [withdrawStakeParams];
      const result = instructionParamsFactory(TransactionType.StakingWithdraw, instructions);
      should.deepEqual(result, instructionsData);
    });
  });
});
