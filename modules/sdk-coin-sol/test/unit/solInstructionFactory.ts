import should from 'should';
import * as testData from '../resources/sol';
import { solInstructionFactory } from '../../src/lib/solInstructionFactory';
import { InstructionBuilderTypes, MEMO_PROGRAM_PK } from '../../src/lib/constants';
import { InstructionParams } from '../../src/lib/iface';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  createMintToInstruction,
  createBurnInstruction,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import BigNumber from 'bignumber.js';
import { coins } from '@bitgo/statics';

const COIN_CONFIG = coins.get('tsol');

describe('Instruction Builder Tests: ', function () {
  describe('Succeed ', function () {
    it('Memo', () => {
      const memo = 'test memo';
      const memoParams: InstructionParams = {
        type: InstructionBuilderTypes.Memo,
        params: { memo },
      };

      const result = solInstructionFactory(memoParams, COIN_CONFIG);
      should.deepEqual(result, [
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_PK),
          data: Buffer.from(memo),
        }),
      ]);
    });

    it('Transfer', () => {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const amount = '100000';
      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.Transfer,
        params: { fromAddress, toAddress, amount },
      };

      const result = solInstructionFactory(transferParams, COIN_CONFIG);
      should.deepEqual(result, [
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromAddress),
          toPubkey: new PublicKey(toAddress),
          lamports: new BigNumber(amount).toNumber(),
        }),
      ]);
    });

    it('Advance nonce', () => {
      const authWalletAddress = testData.authAccount.pub;
      const walletNonceAddress = testData.nonceAccount.pub;
      const nonceAdvanceParams: InstructionParams = {
        type: InstructionBuilderTypes.NonceAdvance,
        params: { walletNonceAddress, authWalletAddress },
      };

      const result = solInstructionFactory(nonceAdvanceParams, COIN_CONFIG);
      should.deepEqual(result, [
        SystemProgram.nonceAdvance({
          noncePubkey: new PublicKey(walletNonceAddress),
          authorizedPubkey: new PublicKey(authWalletAddress),
        }),
      ]);
    });

    it('Create and Nonce initialize', () => {
      const fromAddress = testData.authAccount.pub;
      const nonceAddress = testData.nonceAccount.pub;
      const authAddress = testData.authAccount.pub;
      const amount = '100000';
      const createNonceAccountParams: InstructionParams = {
        type: InstructionBuilderTypes.CreateNonceAccount,
        params: { fromAddress, nonceAddress, authAddress, amount },
      };

      const result = solInstructionFactory(createNonceAccountParams, COIN_CONFIG);
      should.deepEqual(
        result,
        SystemProgram.createNonceAccount({
          fromPubkey: new PublicKey(fromAddress),
          noncePubkey: new PublicKey(nonceAddress),
          authorizedPubkey: new PublicKey(authAddress),
          lamports: new BigNumber(amount).toNumber(),
        }).instructions
      );
    });

    it('Create associated token account', () => {
      const mintAddress = testData.associatedTokenAccounts.mintId;
      const ataAddress = testData.associatedTokenAccounts.accounts[0].ata;
      const ownerAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const payerAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const createATAParams: InstructionParams = {
        type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
        params: {
          mintAddress,
          ataAddress,
          ownerAddress,
          payerAddress,
          tokenName: testData.associatedTokenAccounts.mint,
        },
      };

      const result = solInstructionFactory(createATAParams, COIN_CONFIG);
      should.deepEqual(result, [
        createAssociatedTokenAccountInstruction(
          new PublicKey(payerAddress),
          new PublicKey(ataAddress),
          new PublicKey(ownerAddress),
          new PublicKey(mintAddress)
        ),
      ]);
    });

    it('Token Transfer', () => {
      const fromAddress = testData.authAccount.pub;
      const toAddress = testData.nonceAccount.pub;
      const amount = '100000';
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const sourceAddress = testData.associatedTokenAccounts.accounts[0].pub;
      const coinName = testData.tokenTransfers.nameUSDC;

      const transferParams: InstructionParams = {
        type: InstructionBuilderTypes.TokenTransfer,
        params: {
          fromAddress: fromAddress,
          toAddress: toAddress,
          amount: amount,
          tokenName: coinName,
          sourceAddress: sourceAddress,
        },
      };

      const result = solInstructionFactory(transferParams, COIN_CONFIG);
      should.deepEqual(result, [
        createTransferCheckedInstruction(
          new PublicKey(sourceAddress),
          new PublicKey(mintAddress),
          new PublicKey(toAddress),
          new PublicKey(fromAddress),
          BigInt(amount),
          9
        ),
      ]);
    });

    it('Mint To - Standard SPL Token', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const destinationAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '1000000';
      const tokenName = testData.tokenTransfers.nameUSDC;
      const decimalPlaces = testData.tokenTransfers.decimals;

      const mintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
        },
      };

      const result = solInstructionFactory(mintParams, COIN_CONFIG);
      should.deepEqual(result, [
        createMintToInstruction(
          new PublicKey(mintAddress),
          new PublicKey(destinationAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Mint To - Token-2022 Program', () => {
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const destinationAddress = testData.sol2022TokenTransfers.source;
      const authorityAddress = testData.authAccount.pub;
      const amount = '2000000';
      const tokenName = testData.sol2022TokenTransfers.name;
      const decimalPlaces = testData.sol2022TokenTransfers.decimals;

      const mintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = solInstructionFactory(mintParams, COIN_CONFIG);
      should.deepEqual(result, [
        createMintToInstruction(
          new PublicKey(mintAddress),
          new PublicKey(destinationAddress),
          new PublicKey(authorityAddress),
          BigInt(amount),
          undefined,
          TOKEN_2022_PROGRAM_ID
        ),
      ]);
    });

    it('Burn - Standard SPL Token', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const accountAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '500000';
      const tokenName = testData.tokenTransfers.nameUSDC;
      const decimalPlaces = testData.tokenTransfers.decimals;

      const burnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
        },
      };

      const result = solInstructionFactory(burnParams, COIN_CONFIG);
      should.deepEqual(result, [
        createBurnInstruction(
          new PublicKey(accountAddress),
          new PublicKey(mintAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Burn - Token-2022 Program', () => {
      const mintAddress = testData.sol2022TokenTransfers.mint;
      const accountAddress = testData.sol2022TokenTransfers.source;
      const authorityAddress = testData.authAccount.pub;
      const amount = '750000';
      const tokenName = testData.sol2022TokenTransfers.name;
      const decimalPlaces = testData.sol2022TokenTransfers.decimals;

      const burnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
          decimalPlaces,
          programId: TOKEN_2022_PROGRAM_ID.toString(),
        },
      };

      const result = solInstructionFactory(burnParams, COIN_CONFIG);
      should.deepEqual(result, [
        createBurnInstruction(
          new PublicKey(accountAddress),
          new PublicKey(mintAddress),
          new PublicKey(authorityAddress),
          BigInt(amount),
          undefined,
          TOKEN_2022_PROGRAM_ID
        ),
      ]);
    });

    it('Mint To - Without decimal places', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const destinationAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '1000000';
      const tokenName = testData.tokenTransfers.nameUSDC;

      const mintParams: InstructionParams = {
        type: InstructionBuilderTypes.MintTo,
        params: {
          mintAddress,
          destinationAddress,
          authorityAddress,
          amount,
          tokenName,
        },
      };

      const result = solInstructionFactory(mintParams, COIN_CONFIG);
      should.deepEqual(result, [
        createMintToInstruction(
          new PublicKey(mintAddress),
          new PublicKey(destinationAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });

    it('Burn - Without decimal places', () => {
      const mintAddress = testData.tokenTransfers.mintUSDC;
      const accountAddress = testData.tokenTransfers.sourceUSDC;
      const authorityAddress = testData.authAccount.pub;
      const amount = '500000';
      const tokenName = testData.tokenTransfers.nameUSDC;

      const burnParams: InstructionParams = {
        type: InstructionBuilderTypes.Burn,
        params: {
          mintAddress,
          accountAddress,
          authorityAddress,
          amount,
          tokenName,
        },
      };

      const result = solInstructionFactory(burnParams, COIN_CONFIG);
      should.deepEqual(result, [
        createBurnInstruction(
          new PublicKey(accountAddress),
          new PublicKey(mintAddress),
          new PublicKey(authorityAddress),
          BigInt(amount)
        ),
      ]);
    });
  });

  describe('Fail ', function () {
    it('Invalid type', () => {
      // @ts-expect-error Testing for an invalid type, should throw error
      should(() => solInstructionFactory({ type: 'random', params: {} }, COIN_CONFIG)).throwError(
        'Invalid instruction type or not supported'
      );
    });
  });
});
