import { ValidInstructionTypes } from './iface';

export const MEMO_PROGRAM_PK = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const SEED_LENGTH = 32;

export const MAX_MEMO_LENGTH = 100;

// Sdk instructions, mainly to check decoded types.
export enum ValidInstructionTypesEnum {
  AdvanceNonceAccount = 'AdvanceNonceAccount',
  Create = 'Create',
  InitializeNonceAccount = 'InitializeNonceAccount',
  StakingInitialize = 'Initialize',
  StakingDelegate = 'Delegate',
  StakingDeactivate = 'Deactivate',
  Transfer = 'Transfer',
  Memo = 'Memo',
}

// Internal instructions types
export enum InstructionBuilderTypes {
  CreateNonceAccount = 'CreateNonceAccount',
  StakingActivate = 'Activate',
  StakingDeactivate = 'Deactivate',
  Transfer = 'Transfer',
  Memo = 'Memo',
  NonceAdvance = 'NonceAdvance',
}

export const VALID_SYSTEM_INSTRUCTION_TYPES: ValidInstructionTypes[] = [
  ValidInstructionTypesEnum.AdvanceNonceAccount,
  ValidInstructionTypesEnum.Create,
  ValidInstructionTypesEnum.StakingInitialize,
  ValidInstructionTypesEnum.StakingDelegate,
  ValidInstructionTypesEnum.StakingDeactivate,
  ValidInstructionTypesEnum.Transfer,
  ValidInstructionTypesEnum.InitializeNonceAccount,
  ValidInstructionTypesEnum.Memo,
];

/** Const to check the order of the Wallet Init instructions when decode */
export const walletInitInstructionIndexes = {
  Create: 0,
  InitializeNonce: 1,
  Memo: 2,
} as const;

/** Const to check the order of the Staking Activate instructions when decode */
export const stakingActivateInstructionsIndexes = {
  Create: 0,
  Initialize: 1,
  Delegate: 2,
  Memo: 3,
} as const;

/** Const to check the order of the Staking Deactivate instructions when decode */
export const stakingDeactivateInstructionsIndexes = {
  Deactivate: 0,
  Memo: 1,
} as const;
