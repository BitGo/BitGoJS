export const FUNCTION_NAME_SENDMANY = 'send-many';
export const CONTRACT_NAME_SENDMANY = 'send-many-memo';
export const CONTRACT_NAME_STAKING = 'pox-4';
export const CONTRACT_NAME_POX5 = 'pox-5';
export const CONTRACT_NAME_STAKING_POX5 = CONTRACT_NAME_POX5;
export const VALID_STAKING_CONTRACT_NAMES = [CONTRACT_NAME_STAKING, CONTRACT_NAME_POX5];
export const POX5_CONTRACT_ADDRESS_TESTNET = 'ST000000000000000000002AMW42H';
export const POX5_CONTRACT_ADDRESS_MAINNET = 'SP000000000000000000002Q6VF78';
export const FUNCTION_NAME_TRANSFER = 'transfer';
export const CONTRACT_NAME_SBTC_WITHDRAWAL = 'sbtc-withdrawal';
export const FUNCTION_NAME_INITIATE_WITHDRAWAL = 'initiate-withdrawal-request';

export const FUNCTION_NAME_STAKE = 'stake';
export const FUNCTION_NAME_STAKE_UPDATE = 'stake-update';
export const FUNCTION_NAME_UNSTAKE = 'unstake';
export const FUNCTION_NAME_REGISTER_FOR_BOND = 'register-for-bond';
export const FUNCTION_NAME_ANNOUNCE_L1_EARLY_EXIT = 'announce-l1-early-exit';
export const FUNCTION_NAME_UPDATE_BOND_REGISTRATION = 'update-bond-registration';
export const FUNCTION_NAME_CLAIM_REWARDS = 'claim-rewards';
export const FUNCTION_NAME_CLAIM_STAKER_REWARDS = 'claim-staker-rewards-for-signer';
export const FUNCTION_NAME_CALCULATE_REWARDS = 'calculate-rewards';

export const VALID_POX5_CONTRACT_FUNCTION_NAMES = [
  FUNCTION_NAME_STAKE,
  FUNCTION_NAME_STAKE_UPDATE,
  FUNCTION_NAME_UNSTAKE,
  FUNCTION_NAME_REGISTER_FOR_BOND,
  FUNCTION_NAME_UPDATE_BOND_REGISTRATION,
  FUNCTION_NAME_ANNOUNCE_L1_EARLY_EXIT,
  FUNCTION_NAME_CLAIM_REWARDS,
  FUNCTION_NAME_CLAIM_STAKER_REWARDS,
  FUNCTION_NAME_CALCULATE_REWARDS,
];

export const VALID_CONTRACT_FUNCTION_NAMES = [
  'stack-stx',
  'delegate-stx',
  'delegate-stack-stx',
  'stack-aggregation-commit',
  'revoke-delegate-stx',
  'send-many',
  'transfer',
  'initiate-withdrawal-request',
  ...VALID_POX5_CONTRACT_FUNCTION_NAMES,
];

export const DEFAULT_SEED_SIZE_BYTES = 64;

// https://github.com/stacksgov/sips/blob/main/sips/sip-005/sip-005-blocks-and-transactions.md#transaction-encoding
export const ANCHOR_MODE = 3;
export const DEFAULT_MULTISIG_SIG_NUMBER = 2;
