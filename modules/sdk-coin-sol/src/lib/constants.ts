import { ValidInstructionTypes } from './iface';

export const MEMO_PROGRAM_PK = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const SEED_LENGTH = 32;

export const MAX_MEMO_LENGTH = 130;
export const STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT = 2282880;

export const UNAVAILABLE_TEXT = 'UNAVAILABLE';

export const JITO_STAKE_POOL_ADDRESS = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb';
export const JITOSOL_MINT_ADDRESS = 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn';
export const JITO_STAKE_POOL_RESERVE_ACCOUNT = 'BgKUXdS29YcHCFrPm5M8oLHiTzZaMDjsebggjoaQ6KFL';
export const JITO_STAKE_POOL_RESERVE_ACCOUNT_TESTNET = 'rrWBQqRqBXYZw3CmPCCcjFxQ2Ds4JFJd7oRQJ997dhz';
export const JITO_MANAGER_FEE_ACCOUNT = 'feeeFLLsam6xZJFc6UQFrHqkvVt4jfmVvi2BRLkUZ4i';
export const JITO_MANAGER_FEE_ACCOUNT_TESTNET = 'DH7tmjoQ5zjqcgfYJU22JqmXhP5EY1tkbYpgVWUS2oNo';

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
  SetPriorityFee = 'SetPriorityFee',
  MintTo = 'MintTo',
  Burn = 'Burn',
  DepositSol = 'DepositSol',
  WithdrawStake = 'WithdrawStake',
  Approve = 'Approve',
  CustomInstruction = 'CustomInstruction',
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
  SetPriorityFee = 'SetPriorityFee',
  MintTo = 'MintTo',
  Burn = 'Burn',
  CustomInstruction = 'CustomInstruction',
  Approve = 'Approve',
  WithdrawStake = 'WithdrawStake',
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
  ValidInstructionTypesEnum.SetPriorityFee,
  ValidInstructionTypesEnum.MintTo,
  ValidInstructionTypesEnum.Burn,
  ValidInstructionTypesEnum.Approve,
  ValidInstructionTypesEnum.DepositSol,
  ValidInstructionTypesEnum.WithdrawStake,
  ValidInstructionTypesEnum.CustomInstruction,
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

/** Const to check the order of the Marinade Staking Activate instructions when decode */
export const marinadeStakingActivateInstructionsIndexes = {
  Create: 0,
  Initialize: 1,
  Memo: 2,
} as const;

/** Const to check the order of the Jito Staking Activate instructions when decode */
export const jitoStakingActivateInstructionsIndexes = {
  InitializeAssociatedTokenAccount: 0,
  DepositSol: 1,
} as const;

/** Const to check the order of the Jito Staking Activate instructions when decode */
export const jitoStakingDeactivateInstructionsIndexes = {
  Approve: 0,
  Create: 1,
  WithdrawStake: 2,
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

/** Const to check the order of the Marinade Staking Deactivate instructions when decode */
export const marinadeStakingDeactivateInstructionsIndexes = {
  Transfer: 0,
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
