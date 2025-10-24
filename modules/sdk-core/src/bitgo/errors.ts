// Descriptive error types for common issues which may arise
// during the operation of BitGoJS or BitGoExpress
import { BitGoJsError } from '../bitgojsError';
import { IRequestTracer } from '../api/types';
import { TransactionParams } from './baseCoin';
import { SendManyOptions } from './wallet';

// re-export for backwards compat
export { BitGoJsError };

export class TlsConfigurationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'TLS is configuration is invalid');
  }
}

export class NodeEnvironmentError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'NODE_ENV is invalid for the current bitgo environment');
  }
}

export class UnsupportedCoinError extends BitGoJsError {
  public constructor(coin: string) {
    super(
      `Coin or token type ${coin} not supported or not compiled. Please be sure that you are using the latest version of BitGoJS. If using @bitgo/sdk-api, please confirm you have registered ${coin} first.`
    );
  }
}

export class AddressTypeChainMismatchError extends BitGoJsError {
  constructor(addressType: string, chain: number | string) {
    super(`address type ${addressType} does not correspond to chain ${chain}`);
  }
}

export class P2shP2wshUnsupportedError extends BitGoJsError {
  constructor(message?: string) {
    super(message || 'p2shP2wsh not supported by this coin');
  }
}

export class P2wshUnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2wsh not supported by this coin');
  }
}

export class P2trUnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2tr not supported by this coin');
  }
}

export class P2trMusig2UnsupportedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'p2trMusig2 not supported by this coin');
  }
}

export class UnsupportedAddressTypeError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'invalid address type');
  }
}

export class InvalidAddressError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'invalid address');
  }
}

export class InvalidAddressVerificationObjectPropertyError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address validation failure');
  }
}

export class UnexpectedAddressError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address validation failure');
  }
}

export class InvalidAddressDerivationPropertyError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address chain and/or index are invalid');
  }
}

export class WalletRecoveryUnsupported extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'wallet recovery is not supported by this coin');
  }
}

export class MethodNotImplementedError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'method not implemented');
  }
}

export class BlockExplorerUnavailable extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'third-party blockexplorer not responding');
  }
}

export class InvalidMemoIdError extends InvalidAddressError {
  public constructor(message?: string) {
    super(message || 'invalid memo id');
  }
}

export class InvalidPaymentIdError extends InvalidAddressError {
  public constructor(message?: string) {
    super(message || 'invalid payment id');
  }
}

export class KeyRecoveryServiceError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'key recovery service encountered an error');
  }
}

export class AddressGenerationError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'address generation failed');
  }
}

export class EthereumLibraryUnavailableError extends BitGoJsError {
  public constructor(packageName: string) {
    super(`Ethereum library required for operation is not available. Please install "${packageName}".`);
  }
}

export class StellarFederationUserNotFoundError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'account not found');
  }
}

export class ErrorNoInputToRecover extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'No input to recover - aborting!');
  }
}

export class InvalidKeyPathError extends BitGoJsError {
  public constructor(keyPath: string) {
    super(`invalid keypath: ${keyPath}`);
  }
}

export class InvalidTransactionError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'Invalid transaction');
  }
}

export class MissingEncryptedKeychainError extends Error {
  public constructor(message?: string) {
    super(message || 'No encrypted keychains on this wallet.');
  }
}

export class IncorrectPasswordError extends Error {
  public constructor(message?: string) {
    super(message || 'Incorrect password');
  }
}

export class NeedUserSignupError extends BitGoJsError {
  public constructor(message?: string) {
    super(message || 'User signup is required');
  }
}

export class ApiResponseError<ResponseBodyType = any> extends BitGoJsError {
  message: string;
  status: number;
  result?: ResponseBodyType;
  invalidToken?: boolean;
  needsOTP?: boolean;

  public constructor(
    message: string,
    status: number,
    result?: ResponseBodyType,
    invalidToken?: boolean,
    needsOTP?: boolean
  ) {
    super(message);
    this.message = message;
    this.status = status;
    this.result = result;
    this.invalidToken = invalidToken;
    this.needsOTP = needsOTP;
  }
}

/**
 * Interface for token approval information used in suspicious transaction detection
 *
 * @interface TokenApproval
 * @property {string} [tokenName] - Optional human-readable name of the token
 * @property {string} tokenAddress - The contract address of the token being approved
 * @property {Object} authorizingAmount - The amount being authorized for spending
 * @property {string} authorizingAddress - The address being authorized to spend the tokens
 */
export interface TokenApproval {
  tokenName?: string;
  tokenAddress: string;
  authorizingAmount: { type: 'unlimited' } | { type: 'limited'; amount: number };
  authorizingAddress: string;
}

/**
 * Interface for mismatched recipient information detected during transaction verification
 *
 * @interface MismatchedRecipient
 * @property {string} address - The recipient address that was found in the transaction
 * @property {string} amount - The amount being sent to this recipient
 * @property {string | TokenTransferRecipientParams} [data] - Optional transaction data or token transfer parameters
 * @property {string} [tokenName] - Optional name of the token being transferred
 * @property {TokenTransferRecipientParams} [tokenData] - Optional structured token transfer data
 */
export type MismatchedRecipient = NonNullable<SendManyOptions['recipients']>[0];

/**
 * Interface for contract interaction data payload used in suspicious transaction detection
 *
 * @interface ContractDataPayload
 * @property {string} address - The contract address being interacted with
 * @property {string} rawContractPayload - The raw contract payload in serialized form specific to the blockchain
 * @property {unknown} decodedContractPayload - The decoded contract payload, structure varies by coin/chain implementation
 */
export interface ContractDataPayload {
  address: string;
  // The raw contract payload in serialized form of the chain
  rawContractPayload: string;
  // To be defined on a per-coin basis
  decodedContractPayload: unknown;
}

/**
 * Base error class for transaction intent mismatch detection
 *
 * This error is thrown when a transaction does not match the user's original intent,
 * indicating potential security issues or malicious modifications.
 *
 * @class TxIntentMismatchError
 * @extends {BitGoJsError}
 * @property {string | IRequestTracer | undefined} id - Transaction ID or request tracer for tracking
 * @property {TransactionParams[]} txParams - Array of transaction parameters that were analyzed
 * @property {string | undefined} txHex - The raw transaction in hexadecimal format
 */
export class TxIntentMismatchError extends BitGoJsError {
  public readonly id: string | IRequestTracer | undefined;
  public readonly txParams: TransactionParams[];
  public readonly txHex: string | undefined;

  /**
   * Creates an instance of TxIntentMismatchError
   *
   * @param {string} message - Error message describing the intent mismatch
   * @param {string | IRequestTracer | undefined} id - Transaction ID or request tracer
   * @param {TransactionParams[]} txParams - Transaction parameters that were analyzed
   * @param {string | undefined} txHex - Raw transaction hex string
   */
  public constructor(
    message: string,
    id: string | IRequestTracer | undefined,
    txParams: TransactionParams[],
    txHex: string | undefined
  ) {
    super(message);
    this.id = id;
    this.txParams = txParams;
    this.txHex = txHex;
  }
}

/**
 * Error thrown when transaction recipients don't match the user's intent
 *
 * This error occurs when the transaction contains recipients or amounts that differ
 * from what the user originally intended to send.
 *
 * @class TxIntentMismatchRecipientError
 * @extends {TxIntentMismatchError}
 * @property {MismatchedRecipient[]} mismatchedRecipients - Array of recipients that don't match user intent
 */
export class TxIntentMismatchRecipientError extends TxIntentMismatchError {
  public readonly mismatchedRecipients: MismatchedRecipient[];

  /**
   * Creates an instance of TxIntentMismatchRecipientError
   *
   * @param {string} message - Error message describing the recipient intent mismatch
   * @param {string | IRequestTracer | undefined} id - Transaction ID or request tracer
   * @param {TransactionParams[]} txParams - Transaction parameters that were analyzed
   * @param {string | undefined} txHex - Raw transaction hex string
   * @param {MismatchedRecipient[]} mismatchedRecipients - Array of recipients that don't match user intent
   */
  public constructor(
    message: string,
    id: string | IRequestTracer | undefined,
    txParams: TransactionParams[],
    txHex: string | undefined,
    mismatchedRecipients: MismatchedRecipient[]
  ) {
    super(message, id, txParams, txHex);
    this.mismatchedRecipients = mismatchedRecipients;
  }
}

/**
 * Error thrown when contract interaction doesn't match the user's intent
 *
 * This error occurs when a transaction interacts with a smart contract but the
 * contract call data or method doesn't match what the user intended.
 *
 * @class TxIntentMismatchContractError
 * @extends {TxIntentMismatchError}
 * @property {ContractDataPayload} mismatchedDataPayload - The contract interaction data that doesn't match user intent
 */
export class TxIntentMismatchContractError extends TxIntentMismatchError {
  public readonly mismatchedDataPayload: ContractDataPayload;

  /**
   * Creates an instance of TxIntentMismatchContractError
   *
   * @param {string} message - Error message describing the contract intent mismatch
   * @param {string | IRequestTracer | undefined} id - Transaction ID or request tracer
   * @param {TransactionParams[]} txParams - Transaction parameters that were analyzed
   * @param {string | undefined} txHex - Raw transaction hex string
   * @param {ContractDataPayload} mismatchedDataPayload - The contract interaction data that doesn't match user intent
   */
  public constructor(
    message: string,
    id: string | IRequestTracer | undefined,
    txParams: TransactionParams[],
    txHex: string | undefined,
    mismatchedDataPayload: ContractDataPayload
  ) {
    super(message, id, txParams, txHex);
    this.mismatchedDataPayload = mismatchedDataPayload;
  }
}

/**
 * Error thrown when token approval doesn't match the user's intent
 *
 * This error occurs when a transaction contains a token approval that the user
 * did not intend to authorize, potentially indicating malicious activity.
 *
 * @class TxIntentMismatchApprovalError
 * @extends {TxIntentMismatchError}
 * @property {TokenApproval} tokenApproval - Details of the token approval that doesn't match user intent
 */
export class TxIntentMismatchApprovalError extends TxIntentMismatchError {
  public readonly tokenApproval: TokenApproval;

  /**
   * Creates an instance of TxIntentMismatchApprovalError
   *
   * @param {string} message - Error message describing the approval intent mismatch
   * @param {string | IRequestTracer | undefined} id - Transaction ID or request tracer
   * @param {TransactionParams[]} txParams - Transaction parameters that were analyzed
   * @param {string | undefined} txHex - Raw transaction hex string
   * @param {TokenApproval} tokenApproval - Details of the token approval that doesn't match user intent
   */
  public constructor(
    message: string,
    id: string | IRequestTracer | undefined,
    txParams: TransactionParams[],
    txHex: string | undefined,
    tokenApproval: TokenApproval
  ) {
    super(message, id, txParams, txHex);
    this.tokenApproval = tokenApproval;
  }
}
