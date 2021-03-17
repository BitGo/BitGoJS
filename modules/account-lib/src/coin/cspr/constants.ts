export const SECP256K1_PREFIX = '02';
export const CHAIN_NAME = 'delta-11';
export const TRANSACTION_EXPIRATION = 86400000; // 1 day

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
