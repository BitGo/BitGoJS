import { ValidInstructionTypes } from './iface';

export const MEMO_PROGRAM_PK = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const SEED_LENGTH = 32;

export const MAX_MEMO_LENGTH = 100;
export const STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT = 2282880;

export const UNAVAILABLE_TEXT = 'UNAVAILABLE';

// Sdk instructions, mainly to check decoded types.
export enum ValidInstructionTypesEnum {
  AdvanceNonceAccount = 'AdvanceNonceAccount',
  Create = 'Create',
  InitializeNonceAccount = 'InitializeNonceAccount',
  StakingInitialize = 'Initialize',
  StakingDelegate = 'Delegate',
  StakingDeactivate = 'Deactivate',
  StakingWithdraw = 'Withdraw',
  Transfer = 'Transfer',
  TokenTransfer = 'TokenTransfer',
  Memo = 'Memo',
  InitializeAssociatedTokenAccount = 'InitializeAssociatedTokenAccount',
  CloseAssociatedTokenAccount = 'CloseAssociatedTokenAccount',
  Allocate = 'Allocate',
  Assign = 'Assign',
  Split = 'Split',
  Authorize = 'Authorize',
}

// Internal instructions types
export enum InstructionBuilderTypes {
  CreateNonceAccount = 'CreateNonceAccount',
  StakingActivate = 'Activate',
  StakingDeactivate = 'Deactivate',
  StakingWithdraw = 'Withdraw',
  Transfer = 'Transfer',
  Memo = 'Memo',
  NonceAdvance = 'NonceAdvance',
  CreateAssociatedTokenAccount = 'CreateAssociatedTokenAccount',
  CloseAssociatedTokenAccount = 'CloseAssociatedTokenAccount',
  TokenTransfer = 'TokenTransfer',
  StakingAuthorize = 'Authorize',
  StakingDelegate = 'Delegate',
}

export const VALID_SYSTEM_INSTRUCTION_TYPES: ValidInstructionTypes[] = [
  ValidInstructionTypesEnum.AdvanceNonceAccount,
  ValidInstructionTypesEnum.Create,
  ValidInstructionTypesEnum.StakingInitialize,
  ValidInstructionTypesEnum.StakingDelegate,
  ValidInstructionTypesEnum.StakingDeactivate,
  ValidInstructionTypesEnum.StakingWithdraw,
  ValidInstructionTypesEnum.Transfer,
  ValidInstructionTypesEnum.InitializeNonceAccount,
  ValidInstructionTypesEnum.Memo,
  ValidInstructionTypesEnum.InitializeAssociatedTokenAccount,
  ValidInstructionTypesEnum.CloseAssociatedTokenAccount,
  ValidInstructionTypesEnum.TokenTransfer,
  ValidInstructionTypesEnum.Allocate,
  ValidInstructionTypesEnum.Assign,
  ValidInstructionTypesEnum.Split,
  ValidInstructionTypesEnum.Authorize,
];

/** Const to check the order of the Wallet Init instructions when decode */
export const walletInitInstructionIndexes = {
  Create: 0,
  InitializeNonceAccount: 1,
  Memo: 2,
} as const;

/** Const to check the order of the Staking Activate instructions when decode */
export const stakingActivateInstructionsIndexes = {
  Create: 0,
  Initialize: 1,
  Delegate: 2,
  Memo: 3,
} as const;

/** Const to check the order of the Staking Authorize instructions when decode */
export const stakingAuthorizeInstructionsIndexes = {
  Authorize: 0,
} as const;

/** Const to check the order of the Staking Delegate instructions when decode */
export const stakingDelegateInstructionsIndexes = {
  Delegate: 0,
} as const;

/** Const to check the order of the Staking Deactivate instructions when decode */
export const stakingDeactivateInstructionsIndexes = {
  Deactivate: 0,
  Memo: 1,
} as const;

/** Const to check the order of the Partial Staking Deactivate instructions when decoded */
export const stakingPartialDeactivateInstructionsIndexes = {
  Transfer: 0,
  Allocate: 1,
  Assign: 2,
  Split: 3,
  Deactivate: 4,
  Memo: 5,
} as const;

/** Const to check the order of the Staking Withdraw instructions when decode */
export const stakingWithdrawInstructionsIndexes = {
  Withdraw: 0,
  Memo: 1,
} as const;

/** Const to check the order of the ATA init instructions when decode */
export const ataInitInstructionIndexes = {
  InitializeAssociatedTokenAccount: 0,
  Memo: 1,
} as const;

/** Const to check the order of the ATA init instructions when decode */
export const ataCloseInstructionIndexes = {
  CloseAssociatedTokenAccount: 0,
} as const;

export const nonceAdvanceInstruction = 'AdvanceNonceAccount';
export const validInstructionData = '0a00000001000000';
export const validInstructionData2 = '0a00000000000000';
