export const ERROR_NODE_ID = 'Invalid transaction: invalid NodeID tag';

export const ERROR_NODE_ID_LENGTH = 'Invalid transaction: NodeID is not in cb58 format';

export const ERROR_EMPTY_RAW_TRANSACTION = 'Raw transaction is empty';

export const ERROR_RAW_PARSING = 'Raw transaction is not hex string';

export const ERROR_STAKE_START_TIME_TOO_SHORT = 'Start time needs to be one day greater than current time';

export const ERROR_STAKE_DURATION_SHORT_TIME = 'End date must be greater than or equal to two weeks';

export const ERROR_STAKE_DURATION_LONG_TIME = 'End date must be less than or equal to one year';

export const ERROR_STAKE_AMOUNT = 'Minimum staking amount is 2000 AVAX.';

export const ERROR_DELEGATION_FEE = 'Delegation fee cannot be less than 2';

export const ERROR_WALLET_INITIALIZATION = 'Wallet initialization is not needed';

export const ERROR_UTXOS_EMPTY = "Utxos can't be empty array";

export const ERROR_UTXOS_AMOUNT = 'Utxos required amount';

export const ERROR_CHAIN_ID_LENGTH = 'Chain id are 32 byte size';

export const ERROR_KEY_CANNOT_SIGN = 'Private key cannot sign the transaction';

export const ERROR_AMOUNT = 'Amount must be greater than 0';

export const ERROR_NONCE = 'Nonce must be greater or equal than 0';

export const ERROR_CHAIN_ID_NOT_BASE58 = 'Error - Base58.decode: not a valid base58 string';

export const ERROR_CHAIN_ID_INVALID_CHECKSUM = 'Error - BinTools.cb58Decode: invalid checksum';
