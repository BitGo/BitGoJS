import { ValidInstructionTypes } from './iface';

export const MEMO_PROGRAM_PK = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const SEED_LENGTH = 32;

export const MAX_MEMO_LENGTH = 100;

export enum ValidInstructionTypesEnum {
  AdvanceNonceAccount = 'AdvanceNonceAccount',
  Create = 'Create',
  InitializeNonceAccount = 'InitializeNonceAccount',
  Transfer = 'Transfer',
  TokenTransfer = 'TokenTransfer',
  Memo = 'Memo',
}

export enum InstructionBuilderTypes {
  CreateNonceAccount = 'CreateNonceAccount',
  Transfer = 'Transfer',
  Memo = 'Memo',
  NonceAdvance = 'NonceAdvance',
  TokenTransfer = 'TokenTransfer',
}

export const VALID_SYSTEM_INSTRUCTION_TYPES: ValidInstructionTypes[] = [
  ValidInstructionTypesEnum.AdvanceNonceAccount,
  ValidInstructionTypesEnum.Create,
  ValidInstructionTypesEnum.Transfer,
  ValidInstructionTypesEnum.InitializeNonceAccount,
  ValidInstructionTypesEnum.Memo,
  ValidInstructionTypesEnum.TokenTransfer,
];

export enum walletInitInstructionIndexes {
  Create = 0,
  InitializeNonce = 1,
  Memo = 2,
}
