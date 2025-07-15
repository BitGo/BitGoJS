import should from 'should';
import * as testData from '../resources/sol';
import { instructionParamsFactory } from '../../src/lib/instructionParamsFactory';
import { TransactionType } from '@bitgo/sdk-core';
import { InstructionParams } from '../../src/lib/iface';
import { InstructionBuilderTypes, MEMO_PROGRAM_PK } from '../../src/lib/constants';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

describe('Instruction Parser Tests: ', function () {
  describe('Succeed ', function () {
    it('Wallet init tx instructions', () => {
      const fromAddress = testData.authAccount.pub;
      const nonceAddress = testData.nonceAccount.pub;
      const authAddress = testData.authAccount.pub;
      const amount = '100000';
      const instructions = SystemProgram.createNonceAccount({
        fromPubkey: new PublicKey(fromAddress),
        noncePubkey: new PublicKey(nonceAddress),
        authorizedPubkey: new PublicKey(authAddress),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      const createNonceAccount: InstructionParams = {
        type: InstructionBuilderTypes.CreateNonceAccount,
        params: { fromAddress, nonceAddress, authAddress, amount },
      };

      const result = instructionParamsFactory(TransactionType.WalletInitialization, instructions);
      should.deepEqual(result, [createNonceAccount]);
    });

    it('Send tx instructions', () => {
      const authAccount = testData.authAccount.pub;
      const nonceAccount = testData.nonceAccount.pub;
      const amount = '100000';
      const memo = 'test memo';

      // nonce
      const nonceAdvanceParams: InstructionParams = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: authAccount },
      };
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: new PublicKey(authAccount),
      });

      // transfer
      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.Transfer,
        params: { fromAddress: authAccount, toAddress: nonceAccount, amount },
      };
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(authAccount),
        toPubkey: new PublicKey(nonceAccount),
        lamports: new BigNumber(amount).toNumber(),
      });

      // memo
      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      const instructions = [nonceAdvanceInstruction, transferInstruction, memoInstruction];
      const instructionsData = [nonceAdvanceParams, transferParams, memoParams];
      const result = instructionParamsFactory(TransactionType.Send, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Send token tx instructions', () => {
      const authAccount = testData.authAccount.pub;
      const nonceAccount = testData.nonceAccount.pub;
      const amount = testData.tokenTransfers.amount;
      const memo = testData.tokenTransfers.memo;
      const decimals = testData.tokenTransfers.decimals;
      const nameUSDC = testData.tokenTransfers.nameUSDC;
      const mintUSDC = testData.tokenTransfers.mintUSDC;
      const owner = testData.tokenTransfers.owner;
      const sourceUSDC = testData.tokenTransfers.sourceUSDC;

      // nonce
      const nonceAdvanceParams: InstructionParams = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: authAccount },
      };
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: new PublicKey(authAccount),
      });

      // token transfer
      const transferParams = {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress: owner,
          toAddress: nonceAccount,
          amount: amount.toString(),
          tokenName: nameUSDC,
          sourceAddress: sourceUSDC,
        },
      };
      const transferInstruction = createTransferCheckedInstruction(
        new PublicKey(sourceUSDC),
        new PublicKey(mintUSDC),
        new PublicKey(nonceAccount),
        new PublicKey(owner),
        amount,
        decimals
      );

      // memo
      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      const instructions = [nonceAdvanceInstruction, transferInstruction, memoInstruction];
      const instructionsData = [nonceAdvanceParams, transferParams, memoParams];
      const result = instructionParamsFactory(TransactionType.Send, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('Send sol 2022 token tx instructions', () => {
      const authAccount = testData.authAccount.pub;
      const nonceAccount = testData.nonceAccount.pub;
      const amount = testData.sol2022TokenTransfers.amount;
      const memo = testData.sol2022TokenTransfers.memo;
      const decimals = testData.sol2022TokenTransfers.decimals;
      const name = testData.sol2022TokenTransfers.name;
      const mint = testData.sol2022TokenTransfers.mint;
      const owner = testData.sol2022TokenTransfers.owner;
      const source = testData.sol2022TokenTransfers.source;

      // nonce
      const nonceAdvanceParams: InstructionParams = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: authAccount },
      };
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: new PublicKey(authAccount),
      });

      // token transfer
      const transferParams = {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress: owner,
          toAddress: nonceAccount,
          amount: amount.toString(),
          tokenName: name,
          sourceAddress: source,
        },
      };
      const transferInstruction = createTransferCheckedInstruction(
        new PublicKey(source),
        new PublicKey(mint),
        new PublicKey(nonceAccount),
        new PublicKey(owner),
        amount,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID
      );

      // memo
      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey(MEMO_PROGRAM_PK),
        data: Buffer.from(memo),
      });

      const instructions = [nonceAdvanceInstruction, transferInstruction, memoInstruction];
      const instructionsData = [nonceAdvanceParams, transferParams, memoParams];
      const result = instructionParamsFactory(TransactionType.Send, instructions);
      should.deepEqual(result, instructionsData);
    });

    it('multi ATA init tx instructions', () => {
      const ataParams = [
        {
          mintAddress: testData.associatedTokenAccounts.mintId,
          ownerAddress: testData.associatedTokenAccounts.accounts[0].pub,
          payerAddress: testData.associatedTokenAccounts.accounts[0].pub,
          ataAddress: testData.associatedTokenAccounts.accounts[0].ata,
        },
        {
          mintAddress: testData.associatedTokenAccounts.mintId,
          ownerAddress: testData.associatedTokenAccounts.accounts[1].pub,
          payerAddress: testData.associatedTokenAccounts.accounts[0].pub,
          ataAddress: testData.associatedTokenAccounts.accounts[1].ata,
        },
      ];

      const ataInstructions: TransactionInstruction[] = [];
      const createATAParams: InstructionParams[] = [];

      ataParams.forEach((param) => {
        ataInstructions.push(
          createAssociatedTokenAccountInstruction(
            new PublicKey(param.payerAddress),
            new PublicKey(param.ataAddress),
            new PublicKey(param.ownerAddress),
            new PublicKey(param.mintAddress)
          )
        );

        createATAParams.push({
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: { ...param, tokenName: 'sol:usdc' },
        });
      });
      const result = instructionParamsFactory(TransactionType.AssociatedTokenAccountInitialization, ataInstructions);
      should.deepEqual(result, createATAParams);
    });
    it('sol 2022 ATA init tx instructions', () => {
      const ataParams = [
        {
          mintAddress: testData.associatedTokenAccountsForSol2022.mintId,
          ownerAddress: testData.associatedTokenAccountsForSol2022.accounts[0].pub,
          payerAddress: testData.associatedTokenAccountsForSol2022.accounts[0].pub,
          ataAddress: testData.associatedTokenAccountsForSol2022.accounts[0].ata,
        },
      ];

      const ataInstructions: TransactionInstruction[] = [];
      const createATAParams: InstructionParams[] = [];

      ataParams.forEach((param) => {
        ataInstructions.push(
          createAssociatedTokenAccountInstruction(
            new PublicKey(param.payerAddress),
            new PublicKey(param.ataAddress),
            new PublicKey(param.ownerAddress),
            new PublicKey(param.mintAddress),
            TOKEN_2022_PROGRAM_ID
          )
        );

        createATAParams.push({
          type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
          params: { ...param, tokenName: 'tsol:t22mint' },
        });
      });
      const result = instructionParamsFactory(TransactionType.AssociatedTokenAccountInitialization, ataInstructions);
      should.deepEqual(result, createATAParams);
    });
  });
  describe('Fail ', function () {
    it('Invalid type', () => {
      should(() => instructionParamsFactory(TransactionType.ContractCall, [])).throwError(
        'Invalid transaction, transaction type not supported: ' + TransactionType.ContractCall
      );
    });
    it('Invalid Instruction for Send Type', () => {
      const fromAddress = testData.authAccount.pub;
      const nonceAddress = testData.nonceAccount.pub;
      const authAddress = testData.authAccount.pub;
      const amount = '100000';
      const instructions = SystemProgram.createNonceAccount({
        fromPubkey: new PublicKey(fromAddress),
        noncePubkey: new PublicKey(nonceAddress),
        authorizedPubkey: new PublicKey(authAddress),
        lamports: new BigNumber(amount).toNumber(),
      }).instructions;

      should(() => instructionParamsFactory(TransactionType.Send, instructions)).throwError(
        'Invalid transaction, instruction type not supported: Create'
      );
    });
  });
});
