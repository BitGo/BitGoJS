/**
 * WASM Instruction Mapper
 *
 * Maps WASM-parsed instruction params to BitGoJS InstructionParams format.
 * Also combines related instructions (e.g., CreateAccount + Initialize + Delegate -> StakingActivate)
 * NO @solana/web3.js dependencies.
 */

import { TransactionType } from '@bitgo/sdk-core';
import {
  ParsedTransaction,
  InstructionParams as WasmInstructionParams,
  TransferParams as WasmTransferParams,
  TokenTransferParams as WasmTokenTransferParams,
  StakingActivateParams as WasmStakingActivateParams,
  StakingDeactivateParams as WasmStakingDeactivateParams,
  StakingWithdrawParams as WasmStakingWithdrawParams,
  StakingDelegateParams as WasmStakingDelegateParams,
  StakingAuthorizeParams as WasmStakingAuthorizeParams,
  CreateAtaParams as WasmCreateAtaParams,
  CloseAtaParams as WasmCloseAtaParams,
  MemoParams as WasmMemoParams,
  NonceAdvanceParams as WasmNonceAdvanceParams,
  SetPriorityFeeParams as WasmSetPriorityFeeParams,
  SetComputeUnitLimitParams as WasmSetComputeUnitLimitParams,
  StakePoolDepositSolParams as WasmStakePoolDepositSolParams,
  StakePoolWithdrawStakeParams as WasmStakePoolWithdrawStakeParams,
  CreateAccountParams as WasmCreateAccountParams,
  StakeInitializeParams as WasmStakeInitializeParams,
  CreateNonceAccountParams as WasmCreateNonceAccountParams,
  NonceInitializeParams as WasmNonceInitializeParams,
  stakeProgramId,
  systemProgramId,
} from '@bitgo/wasm-solana';
import { InstructionParams, StakingActivate } from './iface';
import { InstructionBuilderTypes } from './constants';
import { SolStakingTypeEnum } from '@bitgo/public-types';

// =============================================================================
// Types
// =============================================================================

export interface MappedInstructionsResult {
  instructions: InstructionParams[];
  transactionType: TransactionType;
}

// Track staking instructions that need combining
interface StakingCombineState {
  createAccount?: WasmCreateAccountParams;
  stakeInitialize?: WasmStakeInitializeParams;
  delegate?: WasmStakingDelegateParams;
}

// Track nonce instructions that need combining
interface NonceCombineState {
  createAccount?: WasmCreateAccountParams;
  nonceInitialize?: WasmNonceInitializeParams;
}

// =============================================================================
// Transaction Type Detection
// =============================================================================

function determineTransactionType(instructions: InstructionParams[]): TransactionType {
  // First pass: check for primary transaction types (highest priority)
  for (const instr of instructions) {
    switch (instr.type) {
      case InstructionBuilderTypes.Transfer:
      case InstructionBuilderTypes.TokenTransfer:
        return TransactionType.Send;
      case InstructionBuilderTypes.StakingActivate:
        return TransactionType.StakingActivate;
      case InstructionBuilderTypes.StakingDeactivate:
        return TransactionType.StakingDeactivate;
      case InstructionBuilderTypes.StakingWithdraw:
        return TransactionType.StakingWithdraw;
      case InstructionBuilderTypes.StakingDelegate:
        return TransactionType.StakingDelegate;
      case InstructionBuilderTypes.StakingAuthorize:
        return TransactionType.StakingAuthorize;
    }
  }

  // Second pass: check for secondary transaction types (lower priority)
  for (const instr of instructions) {
    switch (instr.type) {
      case InstructionBuilderTypes.CreateAssociatedTokenAccount:
        return TransactionType.AssociatedTokenAccountInitialization;
      case InstructionBuilderTypes.CloseAssociatedTokenAccount:
        return TransactionType.CloseAssociatedTokenAccount;
      case InstructionBuilderTypes.CreateNonceAccount:
        return TransactionType.WalletInitialization;
    }
  }

  return TransactionType.Send; // Default
}

// =============================================================================
// Individual Instruction Mapping
// =============================================================================

function mapTransfer(instr: WasmTransferParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.Transfer,
    params: {
      fromAddress: instr.fromAddress,
      toAddress: instr.toAddress,
      amount: instr.amount.toString(),
    },
  };
}

function mapTokenTransfer(instr: WasmTokenTransferParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.TokenTransfer,
    params: {
      fromAddress: instr.fromAddress,
      toAddress: instr.toAddress,
      amount: instr.amount.toString(),
      tokenName: '', // Will be resolved by caller if needed
      sourceAddress: instr.sourceAddress,
      tokenAddress: instr.tokenAddress,
    },
  };
}

function mapStakingActivate(instr: WasmStakingActivateParams): InstructionParams {
  const stakingType = instr.stakingType as SolStakingTypeEnum;
  return {
    type: InstructionBuilderTypes.StakingActivate,
    params: {
      fromAddress: instr.fromAddress,
      stakingAddress: instr.stakingAddress,
      amount: instr.amount.toString(),
      validator: instr.validator,
      stakingType,
    },
  };
}

function mapStakePoolDepositSol(instr: WasmStakePoolDepositSolParams): InstructionParams {
  // Jito staking - maps to StakingActivate
  return {
    type: InstructionBuilderTypes.StakingActivate,
    params: {
      fromAddress: instr.fundingAccount,
      stakingAddress: instr.stakePool,
      amount: instr.lamports.toString(),
      validator: instr.stakePool, // For Jito, validator is the stake pool
      stakingType: SolStakingTypeEnum.JITO,
      extraParams: {
        stakePoolData: {
          managerFeeAccount: instr.managerFeeAccount,
          poolMint: instr.poolMint,
          reserveStake: instr.reserveStake,
        },
        createAssociatedTokenAccount: false, // Determined from presence of ATA instruction
      },
    },
  };
}

function mapStakingDeactivate(instr: WasmStakingDeactivateParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.StakingDeactivate,
    params: {
      fromAddress: instr.fromAddress,
      stakingAddress: instr.stakingAddress,
      stakingType: SolStakingTypeEnum.NATIVE,
    },
  };
}

function mapStakePoolWithdrawStake(instr: WasmStakePoolWithdrawStakeParams): InstructionParams {
  // Jito deactivate - maps to StakingDeactivate
  return {
    type: InstructionBuilderTypes.StakingDeactivate,
    params: {
      fromAddress: instr.sourceTransferAuthority,
      stakingAddress: instr.stakePool,
      stakingType: SolStakingTypeEnum.JITO,
    },
  };
}

function mapStakingWithdraw(instr: WasmStakingWithdrawParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.StakingWithdraw,
    params: {
      fromAddress: instr.fromAddress,
      stakingAddress: instr.stakingAddress,
      amount: instr.amount.toString(),
    },
  };
}

function mapStakingDelegate(instr: WasmStakingDelegateParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.StakingDelegate,
    params: {
      fromAddress: instr.fromAddress,
      stakingAddress: instr.stakingAddress,
      validator: instr.validator,
    },
  };
}

function mapStakingAuthorize(instr: WasmStakingAuthorizeParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.StakingAuthorize,
    params: {
      stakingAddress: instr.stakingAddress,
      oldAuthorizeAddress: instr.oldAuthorizeAddress,
      newAuthorizeAddress: instr.newAuthorizeAddress,
      custodianAddress: instr.custodianAddress,
    },
  };
}

function mapCreateAta(instr: WasmCreateAtaParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
    params: {
      mintAddress: instr.mintAddress,
      ataAddress: instr.ataAddress,
      ownerAddress: instr.ownerAddress,
      payerAddress: instr.payerAddress,
      tokenName: '', // Will be resolved by caller if needed
    },
  };
}

function mapCloseAta(instr: WasmCloseAtaParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.CloseAssociatedTokenAccount,
    params: {
      accountAddress: instr.accountAddress,
      destinationAddress: instr.destinationAddress,
      authorityAddress: instr.authorityAddress,
    },
  };
}

function mapMemo(instr: WasmMemoParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.Memo,
    params: {
      memo: instr.memo,
    },
  };
}

function mapNonceAdvance(instr: WasmNonceAdvanceParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.NonceAdvance,
    params: {
      walletNonceAddress: instr.walletNonceAddress,
      authWalletAddress: instr.authWalletAddress,
    },
  };
}

function mapSetPriorityFee(instr: WasmSetPriorityFeeParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.SetPriorityFee,
    params: {
      fee: BigInt(instr.fee.toString()),
    },
  };
}

function mapSetComputeUnitLimit(instr: WasmSetComputeUnitLimitParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.SetComputeUnitLimit,
    params: {
      units: instr.units,
    },
  };
}

function mapCreateNonceAccount(instr: WasmCreateNonceAccountParams): InstructionParams {
  return {
    type: InstructionBuilderTypes.CreateNonceAccount,
    params: {
      fromAddress: instr.fromAddress,
      nonceAddress: instr.nonceAddress,
      authAddress: instr.authAddress,
      amount: instr.amount.toString(),
    },
  };
}

// =============================================================================
// Instruction Combining
// =============================================================================

/**
 * Combine CreateAccount + StakeInitialize + StakingDelegate into StakingActivate.
 * This mirrors what the legacy instructionParamsFactory does.
 */
function combineStakingInstructions(state: StakingCombineState): InstructionParams | null {
  if (state.createAccount && state.stakeInitialize && state.delegate) {
    return {
      type: InstructionBuilderTypes.StakingActivate,
      params: {
        stakingType: SolStakingTypeEnum.NATIVE,
        fromAddress: state.createAccount.fromAddress,
        stakingAddress: state.createAccount.newAddress,
        amount: state.createAccount.amount.toString(),
        validator: state.delegate.validator,
      },
    };
  }
  return null;
}

/**
 * Combine CreateAccount + NonceInitialize into CreateNonceAccount.
 * This mirrors what the legacy instructionParamsFactory does for wallet init.
 */
function combineNonceInstructions(state: NonceCombineState): InstructionParams | null {
  if (state.createAccount && state.nonceInitialize) {
    return {
      type: InstructionBuilderTypes.CreateNonceAccount,
      params: {
        fromAddress: state.createAccount.fromAddress,
        nonceAddress: state.createAccount.newAddress,
        authAddress: state.nonceInitialize.authAddress,
        amount: state.createAccount.amount.toString(),
      },
    };
  }
  return null;
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Map WASM-parsed instructions to BitGoJS InstructionParams format.
 *
 * This function:
 * 1. Takes the already-decoded instructions from ParsedTransaction
 * 2. Combines related instructions (e.g., CreateAccount + Initialize + Delegate -> StakingActivate)
 * 3. Maps to BitGoJS format
 *
 * NO @solana/web3.js needed!
 *
 * @param parsed - ParsedTransaction from wasm-solana parseTransaction()
 * @returns Mapped instructions and transaction type
 */
export function mapWasmInstructions(parsed: ParsedTransaction): MappedInstructionsResult {
  const instructions: InstructionParams[] = [];
  const stakingState: StakingCombineState = {};
  const nonceState: NonceCombineState = {};
  let hasCreateAtaForJito = false;

  // First pass: identify instruction patterns
  for (const wasmInstr of parsed.instructionsData) {
    // Track CreateAccount for combining (could be stake or nonce)
    if (wasmInstr.type === 'CreateAccount') {
      const create = wasmInstr as WasmCreateAccountParams;
      // Check if this is a stake account creation (owner is Stake program)
      if (create.owner === stakeProgramId()) {
        stakingState.createAccount = create;
        continue;
      }
      // Check if this is a nonce account creation (owner is System program)
      if (create.owner === systemProgramId()) {
        nonceState.createAccount = create;
        continue;
      }
    }

    // Track staking-related instructions for combining
    if (wasmInstr.type === 'StakeInitialize') {
      stakingState.stakeInitialize = wasmInstr as WasmStakeInitializeParams;
      continue;
    }

    if (wasmInstr.type === 'StakingDelegate') {
      stakingState.delegate = wasmInstr as WasmStakingDelegateParams;
      continue;
    }

    // Track nonce-related instructions for combining
    if (wasmInstr.type === 'NonceInitialize') {
      nonceState.nonceInitialize = wasmInstr as WasmNonceInitializeParams;
      continue;
    }

    // Track ATA creation for Jito staking
    if (wasmInstr.type === 'CreateAssociatedTokenAccount') {
      hasCreateAtaForJito = true;
    }

    // Map other instructions directly
    const mapped = mapSingleInstruction(wasmInstr);
    if (mapped) {
      instructions.push(mapped);
    }
  }

  // Combine staking instructions if we have a full set
  const combinedStaking = combineStakingInstructions(stakingState);
  if (combinedStaking) {
    // Insert at the beginning (after any utility instructions like NonceAdvance)
    const nonUtilityIndex = instructions.findIndex(
      (i) =>
        i.type !== InstructionBuilderTypes.NonceAdvance &&
        i.type !== InstructionBuilderTypes.SetPriorityFee &&
        i.type !== InstructionBuilderTypes.SetComputeUnitLimit
    );
    if (nonUtilityIndex === -1) {
      instructions.push(combinedStaking);
    } else {
      instructions.splice(nonUtilityIndex, 0, combinedStaking);
    }
  } else if (stakingState.delegate) {
    // If we have a standalone delegate (re-delegation), map it directly
    instructions.push(mapStakingDelegate(stakingState.delegate));
  }

  // Combine nonce instructions if we have a full set
  const combinedNonce = combineNonceInstructions(nonceState);
  if (combinedNonce) {
    instructions.push(combinedNonce);
  }

  // Set Jito ATA flag if applicable
  if (hasCreateAtaForJito) {
    const jitoInstr = instructions.find(
      (i): i is StakingActivate =>
        i.type === InstructionBuilderTypes.StakingActivate && i.params.stakingType === SolStakingTypeEnum.JITO
    );
    if (jitoInstr && jitoInstr.params.extraParams) {
      jitoInstr.params.extraParams.createAssociatedTokenAccount = true;
      // Remove the separate ATA instruction since it's tracked in extraParams
      const ataIndex = instructions.findIndex((i) => i.type === InstructionBuilderTypes.CreateAssociatedTokenAccount);
      if (ataIndex !== -1) {
        instructions.splice(ataIndex, 1);
      }
    }
  }

  const transactionType = determineTransactionType(instructions);

  return { instructions, transactionType };
}

/**
 * Map a single WASM instruction to BitGoJS format.
 */
function mapSingleInstruction(instr: WasmInstructionParams): InstructionParams | null {
  switch (instr.type) {
    case 'Transfer':
      return mapTransfer(instr as WasmTransferParams);
    case 'TokenTransfer':
      return mapTokenTransfer(instr as WasmTokenTransferParams);
    case 'StakingActivate':
      return mapStakingActivate(instr as WasmStakingActivateParams);
    case 'StakePoolDepositSol':
      return mapStakePoolDepositSol(instr as WasmStakePoolDepositSolParams);
    case 'StakingDeactivate':
      return mapStakingDeactivate(instr as WasmStakingDeactivateParams);
    case 'StakePoolWithdrawStake':
      return mapStakePoolWithdrawStake(instr as WasmStakePoolWithdrawStakeParams);
    case 'StakingWithdraw':
      return mapStakingWithdraw(instr as WasmStakingWithdrawParams);
    case 'StakingAuthorize':
      return mapStakingAuthorize(instr as WasmStakingAuthorizeParams);
    case 'CreateAssociatedTokenAccount':
      return mapCreateAta(instr as WasmCreateAtaParams);
    case 'CloseAssociatedTokenAccount':
      return mapCloseAta(instr as WasmCloseAtaParams);
    case 'Memo':
      return mapMemo(instr as WasmMemoParams);
    case 'NonceAdvance':
      return mapNonceAdvance(instr as WasmNonceAdvanceParams);
    case 'SetPriorityFee':
      return mapSetPriorityFee(instr as WasmSetPriorityFeeParams);
    case 'SetComputeUnitLimit':
      return mapSetComputeUnitLimit(instr as WasmSetComputeUnitLimitParams);
    case 'CreateNonceAccount':
      return mapCreateNonceAccount(instr as WasmCreateNonceAccountParams);
    // Instructions handled by combining logic in main function
    case 'CreateAccount':
    case 'StakeInitialize':
    case 'StakingDelegate': // Handled by combiner or standalone delegate logic
    case 'NonceInitialize':
      return null;
    default:
      // Unknown instruction type - skip (handled elsewhere or not supported)
      return null;
  }
}
