export const FUNCTION_NAME_SENDMANY = 'send-many';
export const CONTRACT_NAME_SENDMANY = 'send-many-memo';
export const CONTRACT_NAME_STAKING = 'pox-4';
// TODO: remove pox-4 after the Stacks Epoch 4.0 (SIP-045) hard fork activates
export const VALID_STAKING_CONTRACT_NAMES = ['pox-4', 'pox-5'];
export const FUNCTION_NAME_TRANSFER = 'transfer';
export const CONTRACT_NAME_SBTC_WITHDRAWAL = 'sbtc-withdrawal';
export const FUNCTION_NAME_INITIATE_WITHDRAWAL = 'initiate-withdrawal-request';

export const VALID_CONTRACT_FUNCTION_NAMES = [
  'stack-stx',
  'delegate-stx',
  'delegate-stack-stx',
  'stack-aggregation-commit',
  'revoke-delegate-stx',
  'send-many',
  'transfer',
  'initiate-withdrawal-request',
  // pox-5 (SIP-045) staking functions
  'stake',
  'stake-update',
  'unstake',
];

export const DEFAULT_SEED_SIZE_BYTES = 64;

// https://github.com/stacksgov/sips/blob/main/sips/sip-005/sip-005-blocks-and-transactions.md#transaction-encoding
export const ANCHOR_MODE = 3;
export const DEFAULT_MULTISIG_SIG_NUMBER = 2;
