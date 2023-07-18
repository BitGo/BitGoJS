export const SECP256K1_PREFIX = '02';
export const ED25519_PREFIX = '01';
export const DEFAULT_CHAIN_NAMES = {
  testnet: 'integration-test',
  mainnet: 'casper',
};
export const TRANSACTION_EXPIRATION = 64800000; // 18 hours in milliseconds (max TTL)
export const DELEGATE_VALIDATOR_ACCOUNT = '0100cd28cec3dd6d29b959ae7b36a8201c92fe6af75fa44d5fa84b7d2e417ca940';

// #region contract arguments
export const MODULE_BYTES_ACTION = 'action';
// #endregion

// #region contract actions
export const WALLET_INITIALIZATION_CONTRACT_ACTION = 'set_all';
export const DELEGATE_CONTRACT_ACTION = 'delegate';
export const UNDELEGATE_CONTRACT_ACTION = 'undelegate';
// #endregion

// #region extra deploy arguments
export const OWNER_PREFIX = 'owner_';
export const TRANSFER_TO_ADDRESS = 'to_address';
export const DELEGATE_FROM_ADDRESS = 'from_address';
export const TRANSACTION_TYPE = 'deploy_type';
export const DELEGATE_VALIDATOR = 'validator';
export const STAKING_TYPE = 'staking_type';
// #endregion
