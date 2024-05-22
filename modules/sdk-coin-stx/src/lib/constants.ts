export const FUNCTION_NAME_SENDMANY = 'send-many';
export const CONTRACT_NAME_SENDMANY = 'send-many-memo';
export const CONTRACT_NAME_STAKING = 'pox-4';

export const VALID_CONTRACT_FUNCTION_NAMES = [
  'stack-stx',
  'delegate-stx',
  'delegate-stack-stx',
  'stack-aggregation-commit',
  'revoke-delegate-stx',
  'send-many',
];

export const DEFAULT_SEED_SIZE_BYTES = 64;

// https://github.com/stacksgov/sips/blob/main/sips/sip-005/sip-005-blocks-and-transactions.md#transaction-encoding
export const ANCHOR_MODE = 3;
export const DEFAULT_MULTISIG_SIG_NUMBER = 2;
