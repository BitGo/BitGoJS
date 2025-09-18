// Shared constants for Flare P-Chain (flrp) utilities and key handling.
// Centralizing avoids magic numbers scattered across utils and keyPair implementations.

export const DECODED_BLOCK_ID_LENGTH = 32; // Expected decoded block identifier length
export const SHORT_PUB_KEY_LENGTH = 50; // Placeholder (potential CB58 encoded form length)
export const COMPRESSED_PUBLIC_KEY_LENGTH = 66; // 33 bytes (compressed) hex encoded
export const UNCOMPRESSED_PUBLIC_KEY_LENGTH = 130; // 65 bytes (uncompressed) hex encoded
export const RAW_PRIVATE_KEY_LENGTH = 64; // 32 bytes hex encoded
export const SUFFIXED_PRIVATE_KEY_LENGTH = 66; // 32 bytes + compression flag suffix
export const PRIVATE_KEY_COMPRESSED_SUFFIX = '01';
export const OUTPUT_INDEX_HEX_LENGTH = 8; // 4 bytes serialized to hex length

// Asset and transaction constants
export const ASSET_ID_LENGTH = 32; // Asset ID length in bytes (standard for AVAX/Flare networks)
export const TRANSACTION_ID_HEX_LENGTH = 64; // Transaction ID length in hex characters (32 bytes)
export const PRIVATE_KEY_HEX_LENGTH = 64; // Private key length in hex characters (32 bytes)
export const SECP256K1_SIGNATURE_LENGTH = 65; // SECP256K1 signature length in bytes
export const BLS_PUBLIC_KEY_COMPRESSED_LENGTH = 96; // BLS public key compressed length in hex chars (48 bytes)
export const BLS_PUBLIC_KEY_UNCOMPRESSED_LENGTH = 192; // BLS public key uncompressed length in hex chars (96 bytes)
export const BLS_SIGNATURE_LENGTH = 192; // BLS signature length in hex characters (96 bytes)
export const CHAIN_ID_HEX_LENGTH = 64; // Chain ID length in hex characters (32 bytes)
export const MAX_CHAIN_ID_LENGTH = 128; // Maximum chain ID string length

// Fee constants (in nanoFLR)
export const DEFAULT_BASE_FEE = '1000000'; // 1M nanoFLR default base fee
export const DEFAULT_EVM_GAS_FEE = '21000'; // Standard EVM transfer gas fee
export const INPUT_FEE = '100000'; // 100K nanoFLR per input (FlareJS standard)
export const OUTPUT_FEE = '50000'; // 50K nanoFLR per output (FlareJS standard)
export const MINIMUM_FEE = '1000000'; // 1M nanoFLR minimum fee

// Validator constants
export const MIN_DELEGATION_FEE_BASIS_POINTS = 20000; // 2% minimum delegation fee

// Transaction ID prefix
export const TRANSACTION_ID_PREFIX = 'flare-atomic-tx-'; // Prefix for transaction IDs

// Transaction type constants
export const DELEGATOR_TRANSACTION_TYPE = 'PlatformVM.AddDelegatorTx'; // Delegator transaction type

// Delegator type constants
export const PRIMARY_DELEGATOR_TYPE = 'primary'; // Primary delegator type
export const DELEGATOR_STAKE_TYPE = 'delegator'; // Delegator stake type
export const SECP256K1_CREDENTIAL_TYPE = 'secp256k1fx.Credential'; // SECP256K1 credential type
export const STAKE_OUTPUT_TYPE = 'stake'; // Stake output type
export const CREDENTIAL_VERSION = '1.0.0'; // Credential version

// Default values and thresholds
export const EMPTY_STRING = ''; // Empty string default
export const ZERO_BIGINT = 0n; // Zero BigInt default
export const ZERO_NUMBER = 0; // Zero number default
export const DEFAULT_THRESHOLD = 1; // Default signature threshold
export const DEFAULT_LOCKTIME = 0n; // Default locktime
export const MEMO_BUFFER_SIZE = 0; // Empty memo buffer size
export const FIRST_ADDRESS_INDEX = 0; // First address index

// Regex patterns
export const ADDRESS_REGEX = /^(^P||NodeID)-[a-zA-Z0-9]+$/;
export const HEX_REGEX = /^(0x){0,1}([0-9a-f])+$/i;

// Hex pattern components for building dynamic regexes
export const HEX_CHAR_PATTERN = '[0-9a-fA-F]';
export const HEX_PATTERN_NO_PREFIX = `^${HEX_CHAR_PATTERN}*$`;
export const HEX_PATTERN_WITH_PREFIX = `^0x${HEX_CHAR_PATTERN}`;

// Network and buffer constants
export const DEFAULT_NETWORK_ID = 0; // Default network ID
export const FLARE_MAINNET_NETWORK_ID = 1; // Flare mainnet network ID
export const FLARE_TESTNET_NETWORK_ID = 5; // Flare testnet network ID
export const EMPTY_BUFFER_SIZE = 0; // Empty buffer allocation size
export const HEX_PREFIX = '0x'; // Hex prefix
export const HEX_PREFIX_LENGTH = 2; // Length of hex prefix
export const DECIMAL_RADIX = 10; // Decimal radix for parseInt
export const SIGNING_METHOD = 'secp256k1'; // Default signing method
export const AMOUNT_STRING_ZERO = '0'; // Zero amount as string
export const FIRST_ARRAY_INDEX = 0; // First array index
export const MAINNET_TYPE = 'mainnet'; // Mainnet type string

// Transaction type constants for export
export const EXPORT_TRANSACTION_TYPE = 'PlatformVM.ExportTx'; // Export transaction type

// Error messages
export const ERROR_AMOUNT_POSITIVE = 'Amount must be positive';
export const ERROR_CREDENTIALS_ARRAY = 'Credentials must be an array';
export const ERROR_UTXOS_REQUIRED = 'UTXOs are required for creating inputs and outputs';
export const ERROR_SIGNATURES_ARRAY = 'Signatures must be an array';
export const ERROR_SIGNATURES_EMPTY = 'Signatures array cannot be empty';
export const ERROR_INVALID_PRIVATE_KEY = 'Invalid private key format';
export const ERROR_UTXOS_REQUIRED_BUILD = 'UTXOs are required for transaction building';
export const ERROR_ENHANCED_BUILD_FAILED = 'Enhanced FlareJS transaction building failed';
export const ERROR_ENHANCED_PARSE_FAILED = 'Enhanced FlareJS transaction parsing failed';
export const ERROR_FLAREJS_SIGNING_FAILED = 'FlareJS signing failed';
export const ERROR_CREATE_CREDENTIAL_FAILED = 'Failed to create credential';
export const ERROR_UNKNOWN = 'unknown error';
export const ERROR_EXPORT_NOT_IMPLEMENTED = 'Flare P-chain export transaction build not implemented';
export const ERROR_DESTINATION_CHAIN_REQUIRED = 'Destination chain ID must be set for P-chain export';
export const ERROR_SOURCE_ADDRESSES_REQUIRED = 'Source addresses must be set for P-chain export';
export const ERROR_DESTINATION_ADDRESSES_REQUIRED = 'Destination addresses must be set for P-chain export';
export const ERROR_EXPORT_AMOUNT_POSITIVE = 'Export amount must be positive';
export const ERROR_TRANSACTION_REQUIRED = 'Transaction is required for initialization';
export const ERROR_BLOCKCHAIN_ID_MISMATCH = 'Blockchain ID mismatch';
export const ERROR_TRANSACTION_PARSE_FAILED = 'Transaction cannot be parsed or has an unsupported transaction type';
export const ERROR_FAILED_INITIALIZE_BUILDER = 'Failed to initialize builder from transaction';

// Type checking constants
export const OBJECT_TYPE_STRING = 'object'; // Object type string for typeof checks
export const STRING_TYPE = 'string'; // String type for typeof checks
export const NUMBER_TYPE = 'number'; // Number type for typeof checks
export const FUNCTION_TYPE = 'function'; // Function type for typeof checks
export const BIGINT_TYPE = 'bigint'; // BigInt type for typeof checks
export const HEX_ENCODING = 'hex'; // Hex encoding string
export const UTF8_ENCODING = 'utf8'; // UTF8 encoding string

// Chain identifiers
export const P_CHAIN = 'P'; // P-chain identifier
export const C_CHAIN = 'C'; // C-chain identifier
export const X_CHAIN = 'X'; // X-chain identifier
export const P_CHAIN_FULL = 'P-chain'; // P-chain full name
export const C_CHAIN_FULL = 'C-chain'; // C-chain full name
export const X_CHAIN_FULL = 'X-chain'; // X-chain full name
export const CHAIN_SUFFIX = '-chain'; // Chain name suffix

// Atomic transaction prefixes
export const FLARE_ATOMIC_PREFIX = 'flare-atomic-'; // Prefix for atomic transaction IDs
export const FLARE_ATOMIC_PARSED_PREFIX = 'flare-atomic-parsed-'; // Prefix for parsed transaction IDs

// Placeholder values
export const FLARE_ADDRESS_PLACEHOLDER = 'flare-address-placeholder'; // Placeholder for address conversion
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'; // Zero address
export const HEX_PREFIX_REMOVE = '0x'; // Hex prefix to remove
export const PADSTART_CHAR = '0'; // Character used for padding

// FlareJS transaction types
export const PLATFORM_VM_IMPORT_TX = 'PlatformVM.ImportTx'; // Platform VM import transaction
export const PLATFORM_VM_ADD_VALIDATOR_TX = 'PlatformVM.AddValidatorTx'; // Platform VM add validator transaction
export const IMPORT_TX_TYPE = 'ImportTx'; // Import transaction type
export const P_CHAIN_IMPORT_TYPE = 'P-chain-import'; // P-chain import type

// Transaction types and values
export const IMPORT_TYPE = 'import'; // Import transaction type
export const EXPORT_TYPE = 'export'; // Export transaction type
export const SEND_TYPE = 'send'; // Send transaction type
export const IMPORT_C_TYPE = 'import-c'; // Import C-chain transaction type
export const VALIDATOR_TYPE = 'validator'; // Validator type
export const ADDVALIDATOR_TYPE = 'addValidator'; // Add validator type
export const ADD_VALIDATOR_TX_TYPE = 'AddValidatorTx'; // Add validator transaction type

// Validator transaction type arrays
export const VALIDATOR_TRANSACTION_TYPES = [
  PLATFORM_VM_ADD_VALIDATOR_TX,
  ADD_VALIDATOR_TX_TYPE,
  ADDVALIDATOR_TYPE,
  VALIDATOR_TYPE,
]; // Valid validator transaction types

// Transfer types
export const TRANSFERABLE_INPUT_TYPE = 'TransferableInput'; // Transferable input type
export const CREDENTIAL_TYPE = 'Credential'; // Credential type
export const SECP256K1_TRANSFER_INPUT_TYPE = 'secp256k1fx.TransferInput'; // SECP256K1 transfer input type
export const SECP256K1_TRANSFER_OUTPUT_TYPE = 'secp256k1fx.TransferOutput'; // SECP256K1 transfer output type

// Property names for object checks
export const DESTINATION_CHAIN_PROP = 'destinationChain'; // Destination chain property
export const DESTINATION_CHAIN_ID_PROP = 'destinationChainID'; // Destination chain ID property
export const EXPORTED_OUTPUTS_PROP = 'exportedOutputs'; // Exported outputs property
export const OUTS_PROP = 'outs'; // Outputs property short name
export const INPUTS_PROP = 'inputs'; // Inputs property
export const INS_PROP = 'ins'; // Inputs property short name
export const NETWORK_ID_PROP = 'networkID'; // Network ID property
export const NETWORK_ID_PROP_ALT = 'networkId'; // Alternative network ID property
export const BLOCKCHAIN_ID_PROP = 'blockchainID'; // Blockchain ID property
export const GET_OUTPUT_METHOD = 'getOutput'; // Get output method name

// UTXO field names
export const OUTPUT_ID_FIELD = 'outputID'; // Output ID field
export const AMOUNT_FIELD = 'amount'; // Amount field
export const TXID_FIELD = 'txid'; // Transaction ID field
export const OUTPUT_IDX_FIELD = 'outputidx'; // Output index field

// Transaction explanation field names
export const ID_FIELD = 'id'; // ID field name
export const OUTPUT_AMOUNT_FIELD = 'outputAmount'; // Output amount field
export const CHANGE_AMOUNT_FIELD = 'changeAmount'; // Change amount field
export const OUTPUTS_FIELD = 'outputs'; // Outputs field
export const CHANGE_OUTPUTS_FIELD = 'changeOutputs'; // Change outputs field
export const FEE_FIELD = 'fee'; // Fee field
export const TYPE_FIELD = 'type'; // Type field

// Signature and hash methods
export const SECP256K1_SIG_TYPE = 'secp256k1'; // SECP256K1 signature type
export const DER_FORMAT = 'der'; // DER format
export const SHA256_HASH = 'sha256'; // SHA256 hash function
export const RECOVERY_KEY_METHOD = 'recovery-key'; // Recovery key signing method
export const NORMAL_MODE = 'normal'; // Normal mode
export const RECOVERY_MODE = 'recovery'; // Recovery mode

// Version strings
export const RECOVERY_VERSION = '1.0.0'; // Recovery version
export const SIGNATURE_VERSION = '1.0.0'; // Signature version

// Numeric radix
export const HEX_RADIX = 16; // Hexadecimal radix

// Transaction type identifiers (additional)
export const ADD_PERMISSIONLESS_VALIDATOR_TYPE = 'addPermissionlessValidator'; // Add permissionless validator type

// Display order for transaction explanations
export const DISPLAY_ORDER_BASE = [
  'id',
  'inputs',
  'outputAmount',
  'changeAmount',
  'outputs',
  'changeOutputs',
  'fee',
  'type',
]; // Base display order
export const MEMO_FIELD = 'memo'; // Memo field name
export const REWARD_ADDRESSES_FIELD = 'rewardAddresses'; // Reward addresses field
export const SOURCE_CHAIN_FIELD = 'sourceChain'; // Source chain field
export const DESTINATION_CHAIN_FIELD = 'destinationChain'; // Destination chain field

// Asset and network constants
export const FLR_ASSET_ID = 'FLR'; // Default FLR asset ID

// Placeholder constants for development
export const FLARE_TX_HEX_PLACEHOLDER = 'flare-tx-hex-placeholder'; // Transaction hex placeholder
export const FLARE_SIGNABLE_PAYLOAD = 'flare-signable-payload'; // Signable payload placeholder
export const FLARE_TRANSACTION_ID_PLACEHOLDER = 'flare-transaction-id-placeholder'; // Transaction ID placeholder
export const PLACEHOLDER_NODE_ID = 'placeholder-node-id'; // Node ID placeholder

// Chain identifiers (short forms)
export const P_CHAIN_SHORT = 'P'; // P-chain short name
export const X_CHAIN_SHORT = 'X'; // X-chain short name

// Valid source chains for imports
export const VALID_IMPORT_SOURCE_CHAINS = [P_CHAIN_SHORT, P_CHAIN_FULL, X_CHAIN_SHORT, X_CHAIN_FULL]; // Valid source chains for C-chain imports

// Valid P-chain import types
export const VALID_P_CHAIN_IMPORT_TYPES = [PLATFORM_VM_IMPORT_TX, IMPORT_TX_TYPE, IMPORT_TYPE, P_CHAIN_IMPORT_TYPE]; // Valid P-chain import types

// Error messages for transactionBuilder
export const ERROR_NETWORK_ID_MISMATCH = 'Network ID mismatch'; // Network ID validation error
export const ERROR_BLOCKCHAIN_ID_MISMATCH_BUILDER = 'Blockchain ID mismatch'; // Blockchain ID validation error
export const ERROR_INVALID_THRESHOLD = 'Invalid transaction: threshold must be set to 2'; // Threshold validation error
export const ERROR_INVALID_LOCKTIME = 'Invalid transaction: locktime must be 0 or higher'; // Locktime validation error
export const ERROR_UTXOS_EMPTY_ARRAY = "Utxos can't be empty array"; // Empty UTXOS array error
export const ERROR_UTXOS_MISSING_FIELD = 'Utxos required'; // Missing UTXO field error
export const ERROR_FROM_ADDRESSES_REQUIRED = 'from addresses are required'; // Missing from addresses error
export const ERROR_UTXOS_REQUIRED_BUILDER = 'utxos are required'; // Missing UTXOs error
export const ERROR_PARSE_RAW_TRANSACTION = 'Failed to parse raw transaction'; // Raw transaction parsing error
export const ERROR_UNKNOWN_PARSING = 'Unknown error'; // Unknown parsing error

// UTXO field validation
export const UTXO_REQUIRED_FIELDS = ['outputID', 'amount', 'txid', 'outputidx']; // Required UTXO fields
