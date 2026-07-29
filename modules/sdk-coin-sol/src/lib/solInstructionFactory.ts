import { SolStakingTypeEnum } from '@bitgo/public-types';
import { SolCoin } from '@bitgo/statics';
import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createMintToInstruction,
  createBurnInstruction,
  createRecoverNestedInstruction,
  createTransferCheckedInstruction,
  createTransferCheckedWithFeeInstruction,
  TOKEN_2022_PROGRAM_ID,
  TokenInstruction,
  createApproveInstruction,
} from '@solana/spl-token';
import {
  AccountMeta,
  Authorized,
  Lockup,
  PublicKey,
  StakeAuthorizationLayout,
  StakeProgram,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import assert from 'assert';
import BigNumber from 'bignumber.js';
import { struct, u8, blob } from '@solana/buffer-layout';
import {
  INSTRUCTIONS_SYSVAR_ADDRESS,
  InstructionBuilderTypes,
  MEMO_PROGRAM_PK,
  ZK_ELGAMAL_PROOF_PROGRAM_ID,
} from './constants';
import {
  AtaClose,
  AtaInit,
  AtaRecoverNested,
  CloseContextState,
  CloseRecordAccount,
  ConfigureConfidentialTransferAccount,
  ConfidentialMint,
  CreateRecordAccount,
  InstructionParams,
  Memo,
  MintTo,
  Burn,
  Nonce,
  StakingActivate,
  StakingAuthorize,
  StakingDeactivate,
  StakingDelegate,
  StakingWithdraw,
  TokenTransfer,
  Transfer,
  VerifyEqualityProof,
  VerifyRangeProof,
  VerifyValidityProof,
  WalletInit,
  SetComputeUnitLimit,
  SetPriorityFee,
  CustomInstruction,
  Approve,
  WriteRecordData,
} from './iface';
import { computeTransferFee, getSolTokenFromTokenName, isValidBase64, isValidHex } from './utils';
import { depositSolInstructions, withdrawStakeInstructions } from './jitoStakePoolOperations';
import { getToken2022Config, TransferHookConfig } from './token2022Config';

/**
 * Construct Solana instructions from instructions params
 *
 * @param {InstructionParams} instructionToBuild - the data containing the instruction params
 * @returns {TransactionInstruction[]} An array containing supported Solana instructions
 */
export function solInstructionFactory(instructionToBuild: InstructionParams): TransactionInstruction[] {
  switch (instructionToBuild.type) {
    case InstructionBuilderTypes.NonceAdvance:
      return advanceNonceInstruction(instructionToBuild);
    case InstructionBuilderTypes.Memo:
      return memoInstruction(instructionToBuild);
    case InstructionBuilderTypes.Transfer:
      return transferInstruction(instructionToBuild);
    case InstructionBuilderTypes.TokenTransfer:
      return tokenTransferInstruction(instructionToBuild);
    case InstructionBuilderTypes.Approve:
      return approveInstruction(instructionToBuild);
    case InstructionBuilderTypes.CreateNonceAccount:
      return createNonceAccountInstruction(instructionToBuild);
    case InstructionBuilderTypes.StakingActivate:
      return stakingInitializeInstruction(instructionToBuild);
    case InstructionBuilderTypes.StakingDeactivate:
      return stakingDeactivateInstruction(instructionToBuild);
    case InstructionBuilderTypes.StakingWithdraw:
      return stakingWithdrawInstruction(instructionToBuild);
    case InstructionBuilderTypes.CreateAssociatedTokenAccount:
      return createATAInstruction(instructionToBuild);
    case InstructionBuilderTypes.CloseAssociatedTokenAccount:
      return closeATAInstruction(instructionToBuild);
    case InstructionBuilderTypes.RecoverNestedAssociatedTokenAccount:
      return recoverNestedATAInstruction(instructionToBuild);
    case InstructionBuilderTypes.StakingAuthorize:
      return stakingAuthorizeInstruction(instructionToBuild);
    case InstructionBuilderTypes.StakingDelegate:
      return stakingDelegateInstruction(instructionToBuild);
    case InstructionBuilderTypes.SetComputeUnitLimit:
      return setComputeUnitLimitInstruction(instructionToBuild);
    case InstructionBuilderTypes.SetPriorityFee:
      return fetchPriorityFeeInstruction(instructionToBuild);
    case InstructionBuilderTypes.MintTo:
      return mintToInstruction(instructionToBuild);
    case InstructionBuilderTypes.Burn:
      return burnInstruction(instructionToBuild);
    case InstructionBuilderTypes.CustomInstruction:
      return customInstruction(instructionToBuild);
    case InstructionBuilderTypes.ConfigureConfidentialTransferAccount:
      return configureConfidentialTransferAccountInstruction(instructionToBuild);
    case InstructionBuilderTypes.ConfidentialMint:
      return confidentialMintInstruction(instructionToBuild);
    case InstructionBuilderTypes.CreateRecordAccount:
      return createRecordAccountInstruction(instructionToBuild);
    case InstructionBuilderTypes.WriteRecordData:
      return writeRecordDataInstruction(instructionToBuild);
    case InstructionBuilderTypes.VerifyEqualityProof:
      return verifyEqualityProofInstruction(instructionToBuild);
    case InstructionBuilderTypes.VerifyValidityProof:
      return verifyValidityProofInstruction(instructionToBuild);
    case InstructionBuilderTypes.VerifyRangeProof:
      return verifyRangeProofInstruction(instructionToBuild);
    case InstructionBuilderTypes.CloseRecordAccount:
      return closeRecordAccountInstruction(instructionToBuild);
    case InstructionBuilderTypes.CloseContextState:
      return closeContextStateInstruction(instructionToBuild);
    default:
      throw new Error(`Invalid instruction type or not supported`);
  }
}

/**
 * Construct Advance Nonce Solana instructions
 *
 * @param {Nonce} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Advance Nonce Solana instruction
 */
function advanceNonceInstruction(data: Nonce): TransactionInstruction[] {
  const {
    params: { authWalletAddress, walletNonceAddress },
  } = data;
  assert(authWalletAddress, 'Missing authWalletAddress param');
  assert(walletNonceAddress, 'Missing walletNonceAddress param');
  const nonceInstruction = SystemProgram.nonceAdvance({
    noncePubkey: new PublicKey(walletNonceAddress),
    authorizedPubkey: new PublicKey(authWalletAddress),
  });
  return [nonceInstruction];
}

function setComputeUnitLimitInstruction(instructionToBuild: SetComputeUnitLimit): TransactionInstruction[] {
  const setComputeUnitLimit = ComputeBudgetProgram.setComputeUnitLimit({
    units: instructionToBuild.params.units,
  });

  return [setComputeUnitLimit];
}

function fetchPriorityFeeInstruction(instructionToBuild: SetPriorityFee): TransactionInstruction[] {
  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: instructionToBuild.params.fee,
  });

  return [addPriorityFee];
}

/**
 * Construct Memo Solana instructions
 *
 * @param {Memo} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Memo Solana instruction
 */
function memoInstruction(data: Memo): TransactionInstruction[] {
  const {
    params: { memo },
  } = data;
  assert(memo, 'Missing memo param');
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: new PublicKey(MEMO_PROGRAM_PK),
    data: Buffer.from(memo),
  });
  return [memoInstruction];
}

/**
 * Construct Transfer Solana instructions
 *
 * @param {Transfer} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Transfer Solana instruction
 */
function transferInstruction(data: Transfer): TransactionInstruction[] {
  const {
    params: { fromAddress, toAddress, amount },
  } = data;
  assert(fromAddress, 'Missing fromAddress param');
  assert(toAddress, 'Missing toAddress param');
  assert(amount, 'Missing toAddress param');
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: new PublicKey(fromAddress),
    toPubkey: new PublicKey(toAddress),
    lamports: parseInt(amount, 10),
  });
  return [transferInstruction];
}

/**
 * Construct Transfer Solana instructions
 *
 * @param {Transfer} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Transfer Solana instruction
 */
function tokenTransferInstruction(data: TokenTransfer): TransactionInstruction[] {
  const {
    params: { fromAddress, toAddress, amount, tokenName, sourceAddress },
  } = data;
  assert(fromAddress, 'Missing fromAddress (owner) param');
  assert(toAddress, 'Missing toAddress param');
  assert(amount, 'Missing amount param');
  assert(tokenName, 'Missing token name');
  assert(sourceAddress, 'Missing ata address');
  const token = getSolTokenFromTokenName(data.params.tokenName);
  let tokenAddress: string;
  let programId: string | undefined;
  let decimalPlaces: number;
  if (data.params.tokenAddress && data.params.decimalPlaces != null) {
    tokenAddress = data.params.tokenAddress;
    decimalPlaces = data.params.decimalPlaces;
    programId = data.params.programId;
  } else if (token) {
    assert(token instanceof SolCoin);
    tokenAddress = token.tokenAddress;
    decimalPlaces = token.decimalPlaces;
    programId = token.programId;
  } else {
    throw new Error('Invalid token name, got:' + data.params.tokenName);
  }

  let transferInstruction: TransactionInstruction;
  const instructions: TransactionInstruction[] = [];

  if (programId === TOKEN_2022_PROGRAM_ID.toString()) {
    // Use transferCheckedWithFee when the token has a TransferFee extension (or an explicit fee is
    // supplied). The instruction fails on-chain if the expected fee != live config, protecting the
    // customer from a mid-flight fee change. PRD 3.6.
    const feeConfig = token instanceof SolCoin ? token.tokenExtensions?.transferFee : undefined;
    const fee =
      data.params.fee ??
      (feeConfig ? computeTransferFee(amount, feeConfig.transferFeeBasisPoints, feeConfig.maximumFee) : undefined);
    if (fee !== undefined) {
      transferInstruction = createTransferCheckedWithFeeInstruction(
        new PublicKey(sourceAddress),
        new PublicKey(tokenAddress),
        new PublicKey(toAddress),
        new PublicKey(fromAddress),
        BigInt(amount),
        decimalPlaces,
        BigInt(fee),
        [],
        TOKEN_2022_PROGRAM_ID
      );
    } else {
      transferInstruction = createTransferCheckedInstruction(
        new PublicKey(sourceAddress),
        new PublicKey(tokenAddress),
        new PublicKey(toAddress),
        new PublicKey(fromAddress),
        BigInt(amount),
        decimalPlaces,
        [],
        TOKEN_2022_PROGRAM_ID
      );
    }
    // Check if this token has a transfer hook configuration
    const tokenConfig = getToken2022Config(tokenAddress);
    if (tokenConfig?.transferHook) {
      addTransferHookAccounts(transferInstruction, tokenConfig.transferHook);
    }
  } else {
    transferInstruction = createTransferCheckedInstruction(
      new PublicKey(sourceAddress),
      new PublicKey(tokenAddress),
      new PublicKey(toAddress),
      new PublicKey(fromAddress),
      BigInt(amount),
      decimalPlaces
    );
  }
  instructions.push(transferInstruction);
  return instructions;
}

/**
 * Construct Transfer Solana instructions
 *
 * @param {Transfer} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Transfer Solana instruction
 */
function approveInstruction(data: Approve): TransactionInstruction[] {
  const {
    params: { accountAddress, delegateAddress, ownerAddress, amount, programId },
  } = data;
  assert(accountAddress, 'Missing fromAddress (owner) param');
  assert(delegateAddress, 'Missing toAddress param');
  assert(ownerAddress, 'Missing ownerAddress param');
  assert(programId, 'Missing programId param');
  assert(amount, 'Missing amount param');
  return [
    createApproveInstruction(
      new PublicKey(accountAddress),
      new PublicKey(delegateAddress),
      new PublicKey(ownerAddress),
      BigInt(amount),
      undefined,
      programId === undefined ? undefined : new PublicKey(programId)
    ),
  ];
}

/**
 * Construct Create and Initialize Nonce Solana instructions
 *
 * @param {WalletInit} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Create and Initialize Nonce Solana instruction
 */
function createNonceAccountInstruction(data: WalletInit): TransactionInstruction[] {
  const {
    params: { fromAddress, nonceAddress, authAddress, amount },
  } = data;
  assert(fromAddress, 'Missing fromAddress param');
  assert(nonceAddress, 'Missing nonceAddress param');
  assert(authAddress, 'Missing authAddress param');
  assert(amount, 'Missing amount param');
  const nonceAccountInstruction = SystemProgram.createNonceAccount({
    fromPubkey: new PublicKey(fromAddress),
    noncePubkey: new PublicKey(nonceAddress),
    authorizedPubkey: new PublicKey(authAddress),
    lamports: new BigNumber(amount).toNumber(),
  });
  return nonceAccountInstruction.instructions;
}

/**
 * Construct Create Staking Account and Delegate Solana instructions
 *
 * @param {StakingActivate} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Create Staking Account and Delegate Solana instructions
 */
function stakingInitializeInstruction(data: StakingActivate): TransactionInstruction[] {
  const {
    params: { fromAddress, stakingAddress, amount, validator, stakingType, extraParams },
  } = data;
  assert(fromAddress, 'Missing fromAddress param');
  assert(stakingAddress, 'Missing stakingAddress param');
  assert(amount, 'Missing amount param');
  assert(validator, 'Missing validator param');

  const fromPubkey = new PublicKey(fromAddress);
  const stakePubkey = new PublicKey(stakingAddress);
  const validatorPubkey = new PublicKey(validator);
  const tx = new Transaction();

  switch (stakingType) {
    case SolStakingTypeEnum.JITO: {
      assert(extraParams !== undefined, 'Missing extraParams param');
      const instructions = depositSolInstructions(
        {
          stakePoolAddress: stakePubkey,
          from: fromPubkey,
          lamports: BigInt(amount),
        },
        extraParams.stakePoolData,
        !!extraParams.createAssociatedTokenAccount
      );
      tx.add(...instructions);
      break;
    }

    case SolStakingTypeEnum.MARINADE: {
      const walletInitStaking = StakeProgram.createAccount({
        fromPubkey,
        stakePubkey,
        authorized: new Authorized(validatorPubkey, fromPubkey), // staker and withdrawer
        lockup: new Lockup(0, 0, fromPubkey), // No minimum epoch to withdraw
        lamports: new BigNumber(amount).toNumber(),
      });
      tx.add(walletInitStaking);
      break;
    }

    case SolStakingTypeEnum.NATIVE: {
      const walletInitStaking = StakeProgram.createAccount({
        fromPubkey,
        stakePubkey,
        authorized: new Authorized(fromPubkey, fromPubkey), // staker and withdrawer
        lockup: new Lockup(0, 0, fromPubkey), // No minimum epoch to withdraw
        lamports: new BigNumber(amount).toNumber(),
      });
      tx.add(walletInitStaking);

      const delegateStaking = StakeProgram.delegate({
        stakePubkey: new PublicKey(stakingAddress),
        authorizedPubkey: new PublicKey(fromAddress),
        votePubkey: new PublicKey(validator),
      });
      tx.add(delegateStaking);
      break;
    }

    default: {
      const unreachable: never = stakingType;
      throw new Error(`Unknown staking type ${unreachable}`);
    }
  }

  return tx.instructions;
}

/**
 * Construct staking deactivate Solana instructions
 *
 * @param {StakingDeactivate} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing staking deactivate instruction
 */
function stakingDeactivateInstruction(data: StakingDeactivate): TransactionInstruction[] {
  const {
    params: { fromAddress, stakingAddress, amount, unstakingAddress, recipients, stakingType, extraParams },
  } = data;
  assert(fromAddress, 'Missing fromAddress param');

  switch (stakingType) {
    case SolStakingTypeEnum.JITO: {
      assert(stakingAddress, 'Missing stakingAddress param');
      assert(unstakingAddress, 'Missing unstakingAddress param');
      assert(amount, 'Missing amount param');
      assert(extraParams, 'Missing extraParams param');

      const tx = new Transaction();
      tx.add(
        ...withdrawStakeInstructions(
          {
            stakePoolAddress: new PublicKey(stakingAddress),
            tokenOwner: new PublicKey(fromAddress),
            destinationStakeAccount: new PublicKey(unstakingAddress),
            validatorAddress: new PublicKey(extraParams.validatorAddress),
            transferAuthority: new PublicKey(extraParams.transferAuthorityAddress),
            poolAmount: amount,
          },
          extraParams.stakePoolData
        )
      );
      return tx.instructions;
    }

    case SolStakingTypeEnum.MARINADE: {
      assert(recipients, 'Missing recipients param');

      const tx = new Transaction();
      const toPubkeyAddress = new PublicKey(recipients[0].address || '');
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(fromAddress),
        toPubkey: toPubkeyAddress,
        lamports: parseInt(recipients[0].amount, 10),
      });

      tx.add(transferInstruction);
      return tx.instructions;
    }

    case SolStakingTypeEnum.NATIVE: {
      assert(stakingAddress, 'Missing stakingAddress param');

      if (data.params.amount && data.params.unstakingAddress) {
        const tx = new Transaction();
        const unstakingAddress = new PublicKey(data.params.unstakingAddress);

        const allocateAccount = SystemProgram.allocate({
          accountPubkey: unstakingAddress,
          space: StakeProgram.space,
        });
        tx.add(allocateAccount);

        const assignAccount = SystemProgram.assign({
          accountPubkey: unstakingAddress,
          programId: StakeProgram.programId,
        });
        tx.add(assignAccount);

        const splitStake = StakeProgram.split(
          {
            stakePubkey: new PublicKey(stakingAddress),
            authorizedPubkey: new PublicKey(fromAddress),
            splitStakePubkey: unstakingAddress,
            lamports: new BigNumber(data.params.amount).toNumber(),
          },
          0
        );
        tx.add(splitStake.instructions[1]);

        const deactivateStaking = StakeProgram.deactivate({
          stakePubkey: unstakingAddress,
          authorizedPubkey: new PublicKey(fromAddress),
        });
        tx.add(deactivateStaking);

        return tx.instructions;
      } else {
        const deactivateStaking = StakeProgram.deactivate({
          stakePubkey: new PublicKey(stakingAddress),
          authorizedPubkey: new PublicKey(fromAddress),
        });

        return deactivateStaking.instructions;
      }
    }

    default: {
      const unreachable: never = stakingType;
      throw new Error(`Unknown staking type ${unreachable}`);
    }
  }
}

/**
 * Construct Staking Withdraw Solana instructions
 *
 * @param {StakingWithdraw} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Staking Withdraw  Solana instructions
 */
function stakingWithdrawInstruction(data: StakingWithdraw): TransactionInstruction[] {
  const {
    params: { fromAddress, stakingAddress, amount },
  } = data;
  assert(fromAddress, 'Missing fromAddress param');
  assert(stakingAddress, 'Missing stakingAddress param');
  assert(amount, 'Missing amount param');

  const withdrawStaking = StakeProgram.withdraw({
    stakePubkey: new PublicKey(stakingAddress),
    authorizedPubkey: new PublicKey(fromAddress),
    toPubkey: new PublicKey(fromAddress),
    lamports: new BigNumber(amount).toNumber(),
  });

  return withdrawStaking.instructions;
}

/**
 * Construct Create and Initialize Nonce Solana instructions
 *
 * @param {WalletInit} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Create and Initialize Nonce Solana instruction
 */
function createATAInstruction(data: AtaInit): TransactionInstruction[] {
  const {
    params: { mintAddress, ataAddress, ownerAddress, payerAddress, programId },
  } = data;
  assert(mintAddress, 'Missing mintAddress param');
  assert(ataAddress, 'Missing ataAddress param');
  assert(ownerAddress, 'Missing ownerAddress param');
  assert(payerAddress, 'Missing payerAddress param');

  let associatedTokenAccountInstruction: TransactionInstruction;
  if (programId && programId === TOKEN_2022_PROGRAM_ID.toString()) {
    associatedTokenAccountInstruction = createAssociatedTokenAccountInstruction(
      new PublicKey(payerAddress),
      new PublicKey(ataAddress),
      new PublicKey(ownerAddress),
      new PublicKey(mintAddress),
      TOKEN_2022_PROGRAM_ID
    );
  } else {
    associatedTokenAccountInstruction = createAssociatedTokenAccountInstruction(
      new PublicKey(payerAddress),
      new PublicKey(ataAddress),
      new PublicKey(ownerAddress),
      new PublicKey(mintAddress)
    );
  }
  return [associatedTokenAccountInstruction];
}

/**
 * Construct Close ATA Solana instructions
 *
 * @param {WalletInit} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Close ATA Solana instruction
 */
function closeATAInstruction(data: AtaClose): TransactionInstruction[] {
  const {
    params: { accountAddress, destinationAddress, authorityAddress },
  } = data;
  assert(accountAddress, 'Missing accountAddress param');
  assert(destinationAddress, 'Missing destinationAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');

  const closeAssociatedTokenAccountInstruction = createCloseAccountInstruction(
    new PublicKey(accountAddress),
    new PublicKey(destinationAddress),
    new PublicKey(authorityAddress)
  );
  return [closeAssociatedTokenAccountInstruction];
}

/**
 * Construct RecoverNested ATA Solana instruction
 *
 * Recovers tokens from a nested ATA (an ATA whose owner is another ATA rather than a wallet address).
 * This uses the Associated Token Account program's RecoverNested instruction, which allows the root
 * wallet owner to sign and recover tokens without needing the intermediate ATA to sign.
 *
 * @param {AtaRecoverNested} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing the RecoverNested instruction
 */
function recoverNestedATAInstruction(data: AtaRecoverNested): TransactionInstruction[] {
  const {
    params: {
      nestedAccountAddress,
      nestedMintAddress,
      destinationAccountAddress,
      ownerAccountAddress,
      ownerMintAddress,
      walletAddress,
    },
  } = data;
  assert(nestedAccountAddress, 'Missing nestedAccountAddress param');
  assert(nestedMintAddress, 'Missing nestedMintAddress param');
  assert(destinationAccountAddress, 'Missing destinationAccountAddress param');
  assert(ownerAccountAddress, 'Missing ownerAccountAddress param');
  assert(ownerMintAddress, 'Missing ownerMintAddress param');
  assert(walletAddress, 'Missing walletAddress param');

  const recoverNestedInstruction = createRecoverNestedInstruction(
    new PublicKey(nestedAccountAddress),
    new PublicKey(nestedMintAddress),
    new PublicKey(destinationAccountAddress),
    new PublicKey(ownerAccountAddress),
    new PublicKey(ownerMintAddress),
    new PublicKey(walletAddress)
  );
  return [recoverNestedInstruction];
}

/**
 * Construct Staking Account Authorize Solana instructions
 *
 * @param {StakingAuthorize} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Staking Account Authorize instructions
 */
function stakingAuthorizeInstruction(data: StakingAuthorize): TransactionInstruction[] {
  const {
    params: { stakingAddress, oldAuthorizeAddress, newAuthorizeAddress, newWithdrawAddress },
  } = data;
  assert(stakingAddress, 'Missing stakingAddress param');
  assert(oldAuthorizeAddress, 'Missing oldAuthorizeAddress param');
  assert(newAuthorizeAddress, 'Missing newAuthorizeAddress param');
  assert(newWithdrawAddress, 'Missing newWithdrawAddress param');

  const tx = new Transaction();

  const authorizeStaking = StakeProgram.authorize({
    stakePubkey: new PublicKey(stakingAddress),
    authorizedPubkey: new PublicKey(oldAuthorizeAddress),
    newAuthorizedPubkey: new PublicKey(newAuthorizeAddress),
    stakeAuthorizationType: StakeAuthorizationLayout.Staker,
  });

  const authorizeWithdraw = StakeProgram.authorize({
    stakePubkey: new PublicKey(stakingAddress),
    authorizedPubkey: new PublicKey(oldAuthorizeAddress),
    newAuthorizedPubkey: new PublicKey(newAuthorizeAddress),
    stakeAuthorizationType: StakeAuthorizationLayout.Withdrawer,
    custodianPubkey: new PublicKey(newWithdrawAddress),
  });
  tx.add(authorizeStaking);
  tx.add(authorizeWithdraw);

  return tx.instructions;
}

/**
 * Construct Delegate Solana instructions
 *
 * @param {StakingActivate} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Delegate Solana instructions
 */
function stakingDelegateInstruction(data: StakingDelegate): TransactionInstruction[] {
  const {
    params: { fromAddress, stakingAddress, validator },
  } = data;
  assert(fromAddress, 'Missing fromAddress param');
  assert(stakingAddress, 'Missing stakingAddress param');
  assert(validator, 'Missing validator param');
  const tx = new Transaction();
  const delegateStaking = StakeProgram.delegate({
    stakePubkey: new PublicKey(stakingAddress),
    authorizedPubkey: new PublicKey(fromAddress),
    votePubkey: new PublicKey(validator),
  });
  tx.add(delegateStaking);

  return tx.instructions;
}

/**
 * Construct MintTo Solana instructions
 *
 * @param {MintTo} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing MintTo Solana instructions
 */
function mintToInstruction(data: MintTo): TransactionInstruction[] {
  const {
    params: { mintAddress, destinationAddress, authorityAddress, amount, programId },
  } = data;
  assert(mintAddress, 'Missing mintAddress param');
  assert(destinationAddress, 'Missing destinationAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');
  assert(amount, 'Missing amount param');

  const mint = new PublicKey(mintAddress);
  const destination = new PublicKey(destinationAddress);
  const authority = new PublicKey(authorityAddress);

  let mintToInstr: TransactionInstruction;
  if (programId && programId === TOKEN_2022_PROGRAM_ID.toString()) {
    mintToInstr = createMintToInstruction(mint, destination, authority, BigInt(amount), [], TOKEN_2022_PROGRAM_ID);
  } else {
    mintToInstr = createMintToInstruction(mint, destination, authority, BigInt(amount));
  }

  return [mintToInstr];
}

/**
 * Construct Burn Solana instructions
 *
 * @param {Burn} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing Burn Solana instructions
 */
function burnInstruction(data: Burn): TransactionInstruction[] {
  const {
    params: { mintAddress, accountAddress, authorityAddress, amount, programId },
  } = data;
  assert(mintAddress, 'Missing mintAddress param');
  assert(accountAddress, 'Missing accountAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');
  assert(amount, 'Missing amount param');

  const mint = new PublicKey(mintAddress);
  const account = new PublicKey(accountAddress);
  const authority = new PublicKey(authorityAddress);

  let burnInstr: TransactionInstruction;
  if (programId && programId === TOKEN_2022_PROGRAM_ID.toString()) {
    burnInstr = createBurnInstruction(account, mint, authority, BigInt(amount), [], TOKEN_2022_PROGRAM_ID);
  } else {
    burnInstr = createBurnInstruction(account, mint, authority, BigInt(amount));
  }

  return [burnInstr];
}

/**
 * Discriminators for Token-2022 Confidential Transfer extension instructions.
 */
const CONFIDENTIAL_TRANSFER_INSTRUCTION_DISCRIMINATOR = TokenInstruction.ConfidentialTransferExtension;
const CONFIGURE_CONFIDENTIAL_TRANSFER_ACCOUNT_EXTENSION_DISCRIMINATOR = 2;
const CONFIDENTIAL_MINT_DISCRIMINATOR = 42;
const CONFIDENTIAL_MINT_BURN_EXTENSION_DISCRIMINATOR = 3;

/**
 * Discriminators for the zk-elgamal-proof program verification instructions.
 */
const VERIFY_CIPHERTEXT_COMMITMENT_EQUALITY_DISCRIMINATOR = 3;
const VERIFY_BATCHED_GROUPED_CIPHERTEXT_3_HANDLES_VALIDITY_DISCRIMINATOR = 12;
const VERIFY_BATCHED_RANGE_PROOF_U128_DISCRIMINATOR = 7;
const CLOSE_CONTEXT_STATE_DISCRIMINATOR = 0;

/**
 * Instruction data layout for ConfigureConfidentialTransferAccount.
 */
const configureConfidentialTransferAccountDataLayout = struct<{
  instruction: number;
  confidentialTransferInstruction: number;
  decryptableZeroBalance: Uint8Array;
  maximumPendingBalanceCreditCounter: Uint8Array;
  proofInstructionOffset: number;
}>([
  u8('instruction'),
  u8('confidentialTransferInstruction'),
  blob(36, 'decryptableZeroBalance'),
  blob(8, 'maximumPendingBalanceCreditCounter'),
  u8('proofInstructionOffset'),
]);

/**
 * Instruction data layout for ConfidentialMint.
 */
const confidentialMintDataLayout = struct<{
  instruction: number;
  confidentialMintBurnDiscriminator: number;
  newDecryptableSupply: Uint8Array;
  mintAmountAuditorCiphertextLo: Uint8Array;
  mintAmountAuditorCiphertextHi: Uint8Array;
  equalityProofInstructionOffset: number;
  ciphertextValidityProofInstructionOffset: number;
  rangeProofInstructionOffset: number;
}>([
  u8('instruction'),
  u8('confidentialMintBurnDiscriminator'),
  blob(36, 'newDecryptableSupply'),
  blob(64, 'mintAmountAuditorCiphertextLo'),
  blob(64, 'mintAmountAuditorCiphertextHi'),
  u8('equalityProofInstructionOffset'),
  u8('ciphertextValidityProofInstructionOffset'),
  u8('rangeProofInstructionOffset'),
]);

/**
 * Construct a ConfigureConfidentialTransferAccount instruction.
 *
 * @param {ConfigureConfidentialTransferAccount} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing the instruction
 */
function configureConfidentialTransferAccountInstruction(
  data: ConfigureConfidentialTransferAccount
): TransactionInstruction[] {
  const {
    params: {
      tokenAddress,
      mintAddress,
      authorityAddress,
      instructionsSysvarOrContextStateAddress,
      decryptableZeroBalance,
      maximumPendingBalanceCreditCounter,
      proofInstructionOffset,
    },
  } = data;
  assert(tokenAddress, 'Missing tokenAddress param');
  assert(mintAddress, 'Missing mintAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');
  assert(decryptableZeroBalance, 'Missing decryptableZeroBalance param');
  assert(maximumPendingBalanceCreditCounter, 'Missing maximumPendingBalanceCreditCounter param');

  const keys: AccountMeta[] = [
    { pubkey: new PublicKey(tokenAddress), isSigner: false, isWritable: true },
    { pubkey: new PublicKey(mintAddress), isSigner: false, isWritable: false },
    {
      pubkey: new PublicKey(instructionsSysvarOrContextStateAddress || INSTRUCTIONS_SYSVAR_ADDRESS),
      isSigner: false,
      isWritable: false,
    },
    { pubkey: new PublicKey(authorityAddress), isSigner: true, isWritable: false },
  ];

  const decryptableZeroBalanceBytes = Buffer.from(decryptableZeroBalance, 'hex');
  assert(decryptableZeroBalanceBytes.length === 36, 'decryptableZeroBalance must be 36 bytes');

  const dataBuffer = Buffer.alloc(configureConfidentialTransferAccountDataLayout.span);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64LE(BigInt(maximumPendingBalanceCreditCounter));

  configureConfidentialTransferAccountDataLayout.encode(
    {
      instruction: CONFIDENTIAL_TRANSFER_INSTRUCTION_DISCRIMINATOR,
      confidentialTransferInstruction: CONFIGURE_CONFIDENTIAL_TRANSFER_ACCOUNT_EXTENSION_DISCRIMINATOR,
      decryptableZeroBalance: decryptableZeroBalanceBytes,
      maximumPendingBalanceCreditCounter: counterBuffer,
      proofInstructionOffset,
    },
    dataBuffer
  );

  return [
    new TransactionInstruction({
      keys,
      programId: TOKEN_2022_PROGRAM_ID,
      data: dataBuffer,
    }),
  ];
}

/**
 * Construct a ConfidentialMint instruction using the proof-account approach.
 *
 * @param {ConfidentialMint} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing the instruction
 */
function confidentialMintInstruction(data: ConfidentialMint): TransactionInstruction[] {
  const {
    params: {
      tokenAddress,
      mintAddress,
      authorityAddress,
      equalityRecordAddress,
      ciphertextValidityRecordAddress,
      rangeRecordAddress,
      newDecryptableSupply,
      mintAmountAuditorCiphertextLo,
      mintAmountAuditorCiphertextHi,
      equalityProofInstructionOffset,
      ciphertextValidityProofInstructionOffset,
      rangeProofInstructionOffset,
    },
  } = data;
  assert(tokenAddress, 'Missing tokenAddress param');
  assert(mintAddress, 'Missing mintAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');
  assert(newDecryptableSupply, 'Missing newDecryptableSupply param');
  assert(mintAmountAuditorCiphertextLo, 'Missing mintAmountAuditorCiphertextLo param');
  assert(mintAmountAuditorCiphertextHi, 'Missing mintAmountAuditorCiphertextHi param');

  const keys: AccountMeta[] = [
    { pubkey: new PublicKey(tokenAddress), isSigner: false, isWritable: true },
    { pubkey: new PublicKey(mintAddress), isSigner: false, isWritable: true },
  ];

  // Optional context-state accounts. When provided we use the context-state proof path and do not
  // need the instructions sysvar. When omitted we fall back to in-tx proof instructions.
  if (equalityRecordAddress) {
    keys.push({ pubkey: new PublicKey(equalityRecordAddress), isSigner: false, isWritable: false });
  }
  if (ciphertextValidityRecordAddress) {
    keys.push({ pubkey: new PublicKey(ciphertextValidityRecordAddress), isSigner: false, isWritable: false });
  }
  if (rangeRecordAddress) {
    keys.push({ pubkey: new PublicKey(rangeRecordAddress), isSigner: false, isWritable: false });
  }

  keys.push({ pubkey: new PublicKey(authorityAddress), isSigner: true, isWritable: false });

  const newDecryptableSupplyBytes = Buffer.from(newDecryptableSupply, 'hex');
  const mintAmountAuditorCiphertextLoBytes = Buffer.from(mintAmountAuditorCiphertextLo, 'hex');
  const mintAmountAuditorCiphertextHiBytes = Buffer.from(mintAmountAuditorCiphertextHi, 'hex');
  assert(newDecryptableSupplyBytes.length === 36, 'newDecryptableSupply must be 36 bytes');
  assert(mintAmountAuditorCiphertextLoBytes.length === 64, 'mintAmountAuditorCiphertextLo must be 64 bytes');
  assert(mintAmountAuditorCiphertextHiBytes.length === 64, 'mintAmountAuditorCiphertextHi must be 64 bytes');

  const dataBuffer = Buffer.alloc(confidentialMintDataLayout.span);
  confidentialMintDataLayout.encode(
    {
      instruction: CONFIDENTIAL_MINT_DISCRIMINATOR,
      confidentialMintBurnDiscriminator: CONFIDENTIAL_MINT_BURN_EXTENSION_DISCRIMINATOR,
      newDecryptableSupply: newDecryptableSupplyBytes,
      mintAmountAuditorCiphertextLo: mintAmountAuditorCiphertextLoBytes,
      mintAmountAuditorCiphertextHi: mintAmountAuditorCiphertextHiBytes,
      equalityProofInstructionOffset,
      ciphertextValidityProofInstructionOffset,
      rangeProofInstructionOffset,
    },
    dataBuffer
  );

  return [
    new TransactionInstruction({
      keys,
      programId: TOKEN_2022_PROGRAM_ID,
      data: dataBuffer,
    }),
  ];
}

/**
 * Construct a CreateRecordAccount system instruction for the range proof record account.
 *
 * @param {CreateRecordAccount} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing the instruction
 */
function createRecordAccountInstruction(data: CreateRecordAccount): TransactionInstruction[] {
  const {
    params: { payerAddress, recordAccountAddress, recordAccountOwnerAddress, space, lamports },
  } = data;
  assert(payerAddress, 'Missing payerAddress param');
  assert(recordAccountAddress, 'Missing recordAccountAddress param');
  assert(recordAccountOwnerAddress, 'Missing recordAccountOwnerAddress param');
  assert(space, 'Missing space param');
  assert(lamports !== undefined, 'Missing lamports param');

  return [
    SystemProgram.createAccount({
      fromPubkey: new PublicKey(payerAddress),
      newAccountPubkey: new PublicKey(recordAccountAddress),
      lamports,
      space,
      programId: new PublicKey(recordAccountOwnerAddress),
    }),
  ];
}

/**
 * Construct a WriteRecordData instruction.
 *
 * @param {WriteRecordData} data - the data to build the instruction
 * @returns {TransactionInstruction[]} An array containing the instruction
 */
function writeRecordDataInstruction(data: WriteRecordData): TransactionInstruction[] {
  const {
    params: { recordAccountAddress, recordAccountOwnerAddress, offset, data: recordData },
  } = data;
  assert(recordAccountAddress, 'Missing recordAccountAddress param');
  assert(recordData, 'Missing data param');

  const dataBuffer = Buffer.from(recordData, 'hex');
  const offsetBuffer = Buffer.alloc(4);
  offsetBuffer.writeUInt32LE(offset, 0);
  return [
    new TransactionInstruction({
      keys: [
        { pubkey: new PublicKey(recordAccountAddress), isSigner: false, isWritable: true },
        ...(recordAccountOwnerAddress
          ? [{ pubkey: new PublicKey(recordAccountOwnerAddress), isSigner: false, isWritable: false }]
          : []),
      ],
      programId: new PublicKey(recordAccountOwnerAddress || ZK_ELGAMAL_PROOF_PROGRAM_ID),
      data: Buffer.concat([Buffer.from([1]), offsetBuffer, dataBuffer]),
    }),
  ];
}

/**
 * Build a verify proof instruction for the zk-elgamal-proof program.
 */
function buildVerifyProofInstruction(
  discriminator: number,
  proofAccountAddress: string,
  contextStateAccountAddress: string,
  contextStateAuthorityAddress: string,
  offset?: number,
  proofData?: string
): TransactionInstruction {
  const keys: AccountMeta[] = [
    { pubkey: new PublicKey(proofAccountAddress), isSigner: false, isWritable: false },
    { pubkey: new PublicKey(contextStateAccountAddress), isSigner: false, isWritable: true },
    { pubkey: new PublicKey(contextStateAuthorityAddress), isSigner: false, isWritable: false },
  ];

  let dataBuffer: Buffer;
  if (proofData) {
    const proofBytes = Buffer.from(proofData, 'hex');
    dataBuffer = Buffer.concat([Buffer.from([discriminator]), proofBytes]);
  } else {
    const offsetBuffer = Buffer.alloc(4);
    offsetBuffer.writeUInt32LE(offset ?? 0, 0);
    dataBuffer = Buffer.concat([Buffer.from([discriminator]), offsetBuffer]);
  }

  return new TransactionInstruction({
    keys,
    programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ID),
    data: dataBuffer,
  });
}

/**
 * Construct an equality proof verification instruction.
 */
function verifyEqualityProofInstruction(data: VerifyEqualityProof): TransactionInstruction[] {
  const {
    params: { proofAccountAddress, contextStateAccountAddress, contextStateAuthorityAddress, offset, proofData },
  } = data;
  assert(proofAccountAddress, 'Missing proofAccountAddress param');
  assert(contextStateAccountAddress, 'Missing contextStateAccountAddress param');
  assert(contextStateAuthorityAddress, 'Missing contextStateAuthorityAddress param');

  return [
    buildVerifyProofInstruction(
      VERIFY_CIPHERTEXT_COMMITMENT_EQUALITY_DISCRIMINATOR,
      proofAccountAddress,
      contextStateAccountAddress,
      contextStateAuthorityAddress,
      offset,
      proofData
    ),
  ];
}

/**
 * Construct a batched grouped ciphertext 3-handles validity proof verification instruction.
 */
function verifyValidityProofInstruction(data: VerifyValidityProof): TransactionInstruction[] {
  const {
    params: { proofAccountAddress, contextStateAccountAddress, contextStateAuthorityAddress, offset, proofData },
  } = data;
  assert(proofAccountAddress, 'Missing proofAccountAddress param');
  assert(contextStateAccountAddress, 'Missing contextStateAccountAddress param');
  assert(contextStateAuthorityAddress, 'Missing contextStateAuthorityAddress param');

  return [
    buildVerifyProofInstruction(
      VERIFY_BATCHED_GROUPED_CIPHERTEXT_3_HANDLES_VALIDITY_DISCRIMINATOR,
      proofAccountAddress,
      contextStateAccountAddress,
      contextStateAuthorityAddress,
      offset,
      proofData
    ),
  ];
}

/**
 * Construct a batched range proof U128 verification instruction.
 */
function verifyRangeProofInstruction(data: VerifyRangeProof): TransactionInstruction[] {
  const {
    params: { proofAccountAddress, offset, proofData },
  } = data;
  assert(proofAccountAddress, 'Missing proofAccountAddress param');

  // VerifyBatchedRangeProofU128 reads the proof from the record account only;
  // it does not use a context state account (unlike equality/validity proofs).
  const keys: AccountMeta[] = [{ pubkey: new PublicKey(proofAccountAddress), isSigner: false, isWritable: false }];

  let dataBuffer: Buffer;
  if (proofData) {
    const proofBytes = Buffer.from(proofData, 'hex');
    dataBuffer = Buffer.concat([Buffer.from([VERIFY_BATCHED_RANGE_PROOF_U128_DISCRIMINATOR]), proofBytes]);
  } else {
    const offsetBuffer = Buffer.alloc(4);
    offsetBuffer.writeInt32LE(offset ?? 0, 0);
    dataBuffer = Buffer.concat([Buffer.from([VERIFY_BATCHED_RANGE_PROOF_U128_DISCRIMINATOR]), offsetBuffer]);
  }

  return [
    new TransactionInstruction({
      keys,
      programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ID),
      data: dataBuffer,
    }),
  ];
}

/**
 * Construct a CloseRecordAccount instruction.
 */
function closeRecordAccountInstruction(data: CloseRecordAccount): TransactionInstruction[] {
  const {
    params: { recordAccountAddress, destinationAddress, authorityAddress },
  } = data;
  assert(recordAccountAddress, 'Missing recordAccountAddress param');
  assert(destinationAddress, 'Missing destinationAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');

  // The record account is owned by the zk-elgamal-proof program, not Token-2022.
  // CloseAccount discriminator for zk-elgamal-proof = 0 (raw instruction).
  return [
    new TransactionInstruction({
      keys: [
        { pubkey: new PublicKey(recordAccountAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(destinationAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(authorityAddress), isSigner: true, isWritable: false },
      ],
      programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ID),
      data: Buffer.from([0]),
    }),
  ];
}

/**
 * Construct a CloseContextState instruction for the zk-elgamal-proof program.
 */
function closeContextStateInstruction(data: CloseContextState): TransactionInstruction[] {
  const {
    params: { contextStateAccountAddress, destinationAddress, authorityAddress },
  } = data;
  assert(contextStateAccountAddress, 'Missing contextStateAccountAddress param');
  assert(destinationAddress, 'Missing destinationAddress param');
  assert(authorityAddress, 'Missing authorityAddress param');

  const dataBuffer = Buffer.from([CLOSE_CONTEXT_STATE_DISCRIMINATOR]);
  return [
    new TransactionInstruction({
      keys: [
        { pubkey: new PublicKey(contextStateAccountAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(destinationAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(authorityAddress), isSigner: true, isWritable: false },
      ],
      programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ID),
      data: dataBuffer,
    }),
  ];
}

/**
 * Process custom instruction - converts to TransactionInstruction
 * Handles conversion from string-based format to TransactionInstruction format
 *
 * @param {CustomInstruction} data - the data containing the custom instruction
 * @returns {TransactionInstruction[]} An array containing the custom instruction
 */
function customInstruction(data: InstructionParams): TransactionInstruction[] {
  const { params } = data as CustomInstruction;
  assert(params.programId, 'Missing programId in custom instruction');
  assert(params.keys && Array.isArray(params.keys), 'Missing or invalid keys in custom instruction');
  assert(params.data !== undefined, 'Missing data in custom instruction');

  // Convert string data to Buffer
  let dataBuffer: Buffer;

  if (isValidBase64(params.data)) {
    dataBuffer = Buffer.from(params.data, 'base64');
  } else if (isValidHex(params.data)) {
    dataBuffer = Buffer.from(params.data, 'hex');
  } else {
    // Fallback to UTF-8
    dataBuffer = Buffer.from(params.data, 'utf8');
  }

  // Create a new TransactionInstruction with the converted data
  const convertedInstruction = new TransactionInstruction({
    programId: new PublicKey(params.programId),
    keys: params.keys.map((key) => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: dataBuffer,
  });

  return [convertedInstruction];
}

function upsertAccountMeta(keys: AccountMeta[], meta: AccountMeta): void {
  const existing = keys.find((account) => account.pubkey.equals(meta.pubkey));
  if (existing) {
    existing.isWritable = existing.isWritable || meta.isWritable;
    existing.isSigner = existing.isSigner || meta.isSigner;
  } else {
    keys.push(meta);
  }
}

function buildStaticTransferHookAccounts(transferHook: TransferHookConfig): AccountMeta[] {
  const metas: AccountMeta[] = [];
  if (transferHook.extraAccountMetas?.length) {
    for (const meta of transferHook.extraAccountMetas) {
      metas.push({
        pubkey: new PublicKey(meta.pubkey),
        isSigner: meta.isSigner,
        isWritable: meta.isWritable,
      });
    }
  }
  return metas;
}

function addTransferHookAccounts(instruction: TransactionInstruction, transferHook: TransferHookConfig): void {
  const extraMetas = buildStaticTransferHookAccounts(transferHook);
  for (const meta of extraMetas) {
    upsertAccountMeta(instruction.keys, meta);
  }
}
