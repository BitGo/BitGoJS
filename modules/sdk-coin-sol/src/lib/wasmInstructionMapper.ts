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
import { findTokenName } from './instructionParamsFactory';
import { getSolTokenFromAddressOnly } from './utils';
import { SolCoin } from '@bitgo/statics';

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

/**
 * Track Jito deactivate instructions that need combining.
 *
 * Jito deactivate transactions serialize as 4 on-chain instructions:
 *   1. Approve (token approval for pool tokens)
 *   2. CreateAccount (create destination stake account)
 *   3. StakePoolWithdrawStake (withdraw stake from Jito pool)
 *   4. StakingDeactivate (deactivate the resulting stake account)
 *
 * The WASM parser returns StakePoolWithdrawStake and StakingDeactivate separately.
 * We combine them into a single logical StakingDeactivate with full extraParams
 * to match the format expected by BitGoJS builders (round-trip parity).
 */
interface JitoDeactivateCombineState {
  stakePoolWithdrawStake?: WasmStakePoolWithdrawStakeParams;
  nativeDeactivate?: WasmStakingDeactivateParams;
}

/**
 * Track Marinade deactivate instructions that need combining.
 *
 * Marinade deactivate transactions serialize as:
 *   1. Transfer (the actual unstaking operation)
 *   2. Memo with JSON containing "PrepareForRevoke"
 *
 * We detect this pattern and combine into a StakingDeactivate with MARINADE type.
 * Note: fromAddress and stakingAddress cannot be recovered - they are semantic
 * metadata not present in the Transfer instruction. This matches legacy behavior.
 */
interface MarinadeDeactivateCombineState {
  transfer?: WasmTransferParams;
  memo?: string;
}

// =============================================================================
// Transaction Type Detection
// =============================================================================

/**
 * Detect StakingAuthorizeRaw pattern: NonceAdvance + StakingAuthorize only.
 * This is a special transaction type for raw message signing from CLI.
 *
 * The pattern can be:
 * - 2 instructions: NonceAdvance + StakingAuthorize
 * - 3 instructions: NonceAdvance + StakingAuthorize + StakingAuthorize (for dual auth)
 */
function isStakingAuthorizeRawPattern(instructions: InstructionParams[]): boolean {
  // Check for 2 instructions: NonceAdvance + StakingAuthorize
  if (instructions.length === 2) {
    const hasNonceAdvance = instructions.some((i) => i.type === InstructionBuilderTypes.NonceAdvance);
    const hasStakingAuthorize = instructions.some((i) => i.type === InstructionBuilderTypes.StakingAuthorize);
    if (hasNonceAdvance && hasStakingAuthorize) {
      return true;
    }
  }

  // Check for 3 instructions: NonceAdvance + 2x StakingAuthorize (dual authorization)
  if (instructions.length === 3) {
    const hasNonceAdvance = instructions.some((i) => i.type === InstructionBuilderTypes.NonceAdvance);
    const stakingAuthorizeCount = instructions.filter(
      (i) => i.type === InstructionBuilderTypes.StakingAuthorize
    ).length;
    if (hasNonceAdvance && stakingAuthorizeCount === 2) {
      return true;
    }
  }

  return false;
}

function determineTransactionType(instructions: InstructionParams[]): TransactionType {
  // Check for StakingAuthorizeRaw first (specific pattern: NonceAdvance + StakingAuthorize only)
  // This must be checked BEFORE the general type detection
  if (isStakingAuthorizeRawPattern(instructions)) {
    return TransactionType.StakingAuthorizeRaw;
  }

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
  // Resolve tokenName and other metadata from tokenAddress
  const tokenAddress = instr.tokenAddress ?? '';
  const coin = tokenAddress ? getSolTokenFromAddressOnly(tokenAddress) : undefined;
  const tokenName = coin?.name ?? (tokenAddress ? findTokenName(tokenAddress, undefined, true) : '');
  const programId = coin instanceof SolCoin ? coin.programId : undefined;
  const decimalPlaces = coin?.decimalPlaces;

  return {
    type: InstructionBuilderTypes.TokenTransfer,
    params: {
      fromAddress: instr.fromAddress,
      toAddress: instr.toAddress,
      amount: instr.amount.toString(),
      tokenName,
      sourceAddress: instr.sourceAddress,
      tokenAddress: instr.tokenAddress,
      programId,
      decimalPlaces,
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
  // Use stakingType from WASM if available, default to NATIVE
  const stakingType = (instr as any).stakingType ?? SolStakingTypeEnum.NATIVE;
  return {
    type: InstructionBuilderTypes.StakingDeactivate,
    params: {
      fromAddress: instr.fromAddress,
      stakingAddress: instr.stakingAddress,
      stakingType,
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
  // Resolve tokenName from mintAddress using findTokenName
  const tokenName = findTokenName(instr.mintAddress, undefined, true);
  return {
    type: InstructionBuilderTypes.CreateAssociatedTokenAccount,
    params: {
      mintAddress: instr.mintAddress,
      ataAddress: instr.ataAddress,
      ownerAddress: instr.ownerAddress,
      payerAddress: instr.payerAddress,
      tokenName,
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
  // Keep fee as BigInt for compatibility with legacy format
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
 *
 * For NATIVE staking: CreateAccount + StakeInitialize + StakingDelegate
 * For MARINADE staking: CreateAccount + StakeInitialize (no delegate, validator is in staker field)
 */
function combineStakingInstructions(state: StakingCombineState): InstructionParams | null {
  // Native staking: CreateAccount + StakeInitialize + StakingDelegate
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

  // Marinade staking: CreateAccount + StakeInitialize (no delegate)
  // For Marinade, the validator is stored in the staker field of StakeInitialize
  if (state.createAccount && state.stakeInitialize && !state.delegate) {
    const stakerAddress = (state.stakeInitialize as any).staker;
    if (stakerAddress) {
      return {
        type: InstructionBuilderTypes.StakingActivate,
        params: {
          stakingType: SolStakingTypeEnum.MARINADE,
          fromAddress: state.createAccount.fromAddress,
          stakingAddress: state.createAccount.newAddress,
          amount: state.createAccount.amount.toString(),
          validator: stakerAddress, // Marinade uses staker as validator
        },
      };
    }
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

/**
 * Combine StakePoolWithdrawStake + native StakingDeactivate into a single StakingDeactivate.
 * This mirrors what the legacy instructionParamsFactory does for Jito unstaking.
 *
 * Jito deactivate serializes as 4 on-chain instructions:
 *   1. Approve (token approval)
 *   2. CreateAccount (destination stake account)
 *   3. StakePoolWithdrawStake (withdraw from Jito pool)
 *   4. StakingDeactivate (deactivate the resulting stake)
 *
 * We combine these into a single logical StakingDeactivate with extraParams.
 */
function combineJitoDeactivateInstructions(state: JitoDeactivateCombineState): InstructionParams | null {
  if (state.stakePoolWithdrawStake) {
    const ws = state.stakePoolWithdrawStake;
    return {
      type: InstructionBuilderTypes.StakingDeactivate,
      params: {
        fromAddress: ws.destinationStakeAuthority,
        stakingAddress: ws.stakePool,
        amount: ws.poolTokens.toString(),
        unstakingAddress: ws.destinationStake,
        stakingType: SolStakingTypeEnum.JITO,
        extraParams: {
          stakePoolData: {
            managerFeeAccount: ws.managerFeeAccount,
            poolMint: ws.poolMint,
            validatorListAccount: ws.validatorList,
          },
          validatorAddress: ws.validatorStake,
          transferAuthorityAddress: ws.sourceTransferAuthority,
        },
      },
    };
  }
  return null;
}

/**
 * Combine Transfer + PrepareForRevoke Memo into a single StakingDeactivate.
 * This mirrors what the legacy instructionParamsFactory does for Marinade unstaking.
 *
 * Note: fromAddress and stakingAddress are empty because they cannot be recovered
 * from the serialized transaction - they are semantic metadata that was never stored.
 * This matches legacy behavior exactly.
 */
function combineMarinadeDeactivateInstructions(state: MarinadeDeactivateCombineState): InstructionParams | null {
  // Check if memo contains "PrepareForRevoke" (Marinade deactivate signature)
  if (state.transfer && state.memo && state.memo.includes('PrepareForRevoke')) {
    return {
      type: InstructionBuilderTypes.StakingDeactivate,
      params: {
        fromAddress: '',
        stakingAddress: '',
        stakingType: SolStakingTypeEnum.MARINADE,
        recipients: [
          {
            address: state.transfer.toAddress,
            amount: state.transfer.amount.toString(),
          },
        ],
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
  const jitoDeactivateState: JitoDeactivateCombineState = {};
  const marinadeDeactivateState: MarinadeDeactivateCombineState = {};
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

    // Track Jito deactivate instructions for combining
    if (wasmInstr.type === 'StakePoolWithdrawStake') {
      jitoDeactivateState.stakePoolWithdrawStake = wasmInstr as WasmStakePoolWithdrawStakeParams;
      continue;
    }

    // Track native StakingDeactivate that may be part of Jito deactivate
    if (wasmInstr.type === 'StakingDeactivate') {
      jitoDeactivateState.nativeDeactivate = wasmInstr as WasmStakingDeactivateParams;
      // Don't continue - we'll decide later whether to use this or combine it
    }

    // Track ATA creation for Jito staking
    if (wasmInstr.type === 'CreateAssociatedTokenAccount') {
      hasCreateAtaForJito = true;
    }

    // Track Transfer for potential Marinade deactivate
    if (wasmInstr.type === 'Transfer') {
      marinadeDeactivateState.transfer = wasmInstr as WasmTransferParams;
    }

    // Track Memo for potential Marinade deactivate (PrepareForRevoke)
    if (wasmInstr.type === 'Memo') {
      marinadeDeactivateState.memo = (wasmInstr as WasmMemoParams).memo;
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

  // Combine Jito deactivate instructions if we have the pattern
  const combinedJitoDeactivate = combineJitoDeactivateInstructions(jitoDeactivateState);
  if (combinedJitoDeactivate) {
    // Remove the native StakingDeactivate that was mapped (it's part of Jito pattern)
    const nativeDeactivateIndex = instructions.findIndex(
      (i) => i.type === InstructionBuilderTypes.StakingDeactivate && i.params.stakingType === SolStakingTypeEnum.NATIVE
    );
    if (nativeDeactivateIndex !== -1) {
      instructions.splice(nativeDeactivateIndex, 1);
    }
    // Add the combined Jito deactivate
    instructions.push(combinedJitoDeactivate);
  }

  // Combine Marinade deactivate instructions if we have the pattern
  const combinedMarinadeDeactivate = combineMarinadeDeactivateInstructions(marinadeDeactivateState);
  if (combinedMarinadeDeactivate) {
    // Remove the Transfer that was mapped (it's part of Marinade pattern)
    const transferIndex = instructions.findIndex((i) => i.type === InstructionBuilderTypes.Transfer);
    if (transferIndex !== -1) {
      instructions.splice(transferIndex, 1);
    }
    // Add the combined Marinade deactivate
    instructions.push(combinedMarinadeDeactivate);
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
      // Handled by Jito deactivate combining logic
      return null;
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
