import should from 'should';
import * as testData from '../resources/sol';
import { instructionParamsFactory } from '../../src/lib/instructionParamsFactory';
import { TransactionType } from '@bitgo-beta/sdk-core';
import { InstructionParams } from '../../src/lib/iface';
import { InstructionBuilderTypes, MEMO_PROGRAM_PK } from '../../src/lib/constants';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  createMintToInstruction,
  createBurnInstruction,
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
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
          decimalPlaces: 9,
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
          tokenAddress: '5NR1bQwLWqjbkhbQ1hx72HKJybbuvwkDnUZNoAZ2VhW6',
          programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
          decimalPlaces: 9,
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
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        },
        {
          mintAddress: testData.associatedTokenAccounts.mintId,
          ownerAddress: testData.associatedTokenAccounts.accounts[1].pub,
          payerAddress: testData.associatedTokenAccounts.accounts[0].pub,
          ataAddress: testData.associatedTokenAccounts.accounts[1].ata,
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
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
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
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

    it('Mint To - Standard SPL Token instruction parsing', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const destinationAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '1000000';
      const tokenName = testData.tokenTransfers.nameUSDC;

      const mintInstruction = createMintToInstruction(
        new PublicKey(mintAddress),
        new PublicKey(destinationAddress),
        new PublicKey(authorityAddress),
        BigInt(amount)
      );

      const expectedMintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces: undefined,
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
      };

      const result = instructionParamsFactory(TransactionType.Send, [mintInstruction]);
      should.deepEqual(result, [expectedMintParams]);
    });

    it('Mint To - Token-2022 Program instruction parsing', () => {
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const destinationAddress = testData.sol2022TokenTransfers.source;
      const authorityAddress = testData.authAccount.pub;
      const amount = '2000000';
      const tokenName = testData.sol2022TokenTransfers.name;

      const mintInstruction = createMintToInstruction(
        new PublicKey(mintAddress),
        new PublicKey(destinationAddress),
        new PublicKey(authorityAddress),
        BigInt(amount),
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const expectedMintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces: undefined,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = instructionParamsFactory(TransactionType.Send, [mintInstruction]);
      should.deepEqual(result, [expectedMintParams]);
    });

    it('Burn - Standard SPL Token instruction parsing', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const accountAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '500000';
      const tokenName = testData.tokenTransfers.nameUSDC;

      const burnInstruction = createBurnInstruction(
        new PublicKey(accountAddress),
        new PublicKey(mintAddress),
        new PublicKey(authorityAddress),
        BigInt(amount)
      );

      const expectedBurnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces: undefined,
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
      };

      const result = instructionParamsFactory(TransactionType.Send, [burnInstruction]);
      should.deepEqual(result, [expectedBurnParams]);
    });

    it('Burn - Token-2022 Program instruction parsing', () => {
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const accountAddress = testData.sol2022TokenTransfers.source;
      const authorityAddress = testData.authAccount.pub;
      const amount = '750000';
      const tokenName = testData.sol2022TokenTransfers.name;

      const burnInstruction = createBurnInstruction(
        new PublicKey(accountAddress),
        new PublicKey(mintAddress),
        new PublicKey(authorityAddress),
        BigInt(amount),
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      const expectedBurnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces: undefined,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = instructionParamsFactory(TransactionType.Send, [burnInstruction]);
      should.deepEqual(result, [expectedBurnParams]);
    });

    it('Mixed instructions - Mint, Burn, and Transfer', () => {
      const authAccount = testData.authAccount.pub;
      const nonceAccount = testData.nonceAccount.pub;
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const destinationAddress = testData.tokenTransfers.sourceUSDC;
      const accountAddress = testData.tokenTransfers.sourceUSDC;
      const tokenName = testData.tokenTransfers.nameUSDC;

      // Nonce advance
      const nonceAdvanceInstruction = SystemProgram.nonceAdvance({
        noncePubkey: new PublicKey(nonceAccount),
        authorizedPubkey: new PublicKey(authAccount),
      });
      const nonceAdvanceParams: InstructionParams = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress: nonceAccount, authWalletAddress: authAccount },
      };

      // Mint instruction
      const mintInstruction = createMintToInstruction(
        new PublicKey(mintAddress),
        new PublicKey(destinationAddress),
        new PublicKey(authAccount),
        BigInt('1000000')
      );
      const expectedMintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress: authAccount,
          amount: '1000000',
          tokenName,
          decimalPlaces: undefined,
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
      };

      // Burn instruction
      const burnInstruction = createBurnInstruction(
        new PublicKey(accountAddress),
        new PublicKey(mintAddress),
        new PublicKey(authAccount),
        BigInt('500000')
      );
      const expectedBurnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress: authAccount,
          amount: '500000',
          tokenName,
          decimalPlaces: undefined,
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
      };

      const instructions = [nonceAdvanceInstruction, mintInstruction, burnInstruction];
      const expectedParams = [nonceAdvanceParams, expectedMintParams, expectedBurnParams];

      const result = instructionParamsFactory(TransactionType.Send, instructions);
      should.deepEqual(result, expectedParams);
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
