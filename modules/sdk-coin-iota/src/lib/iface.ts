import {
  ParseTransactionOptions as BaseParseTransactionOptions,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionRecipient,
  TransactionType as BitGoTransactionType,
  TransactionType,
} from '@bitgo/sdk-core';

/**
 * Extended transaction explanation for IOTA transactions.
 * Includes IOTA-specific fields like sender and optional sponsor.
 *
 * @example
 * ```typescript
 * const explanation: TransactionExplanation = {
 *   type: TransactionType.Send,
 *   sender: '0x1234...',
 *   sponsor: '0x5678...', // Optional gas sponsor
 *   outputAmount: '1000000',
 *   outputs: [...],
 *   fee: { fee: '5000' }
 * };
 * ```
 */
export interface TransactionExplanation extends BaseTransactionExplanation {
  /** The type of transaction (e.g., Send, Receive) */
  type: BitGoTransactionType;

  /** The address initiating the transaction */
  sender: string;

  /**
   * Optional gas sponsor address.
   * When present, this address pays for the transaction's gas fees
   * instead of the sender.
   */
  sponsor?: string;
}

/**
 * Represents an IOTA object (coin or NFT) used as transaction input.
 * Objects in IOTA are versioned and content-addressable.
 *
 * @example
 * ```typescript
 * const coinObject: TransactionObjectInput = {
 *   objectId: '0x1234...', // Unique object identifier
 *   version: '42',         // Object version number
 *   digest: 'ABC123...'    // Content hash
 * };
 * ```
 */
export type TransactionObjectInput = {
  /** Unique identifier for the object (64-character hex string) */
  objectId: string;

  /** Version number of the object (as string) */
  version: string;

  /** Base58-encoded digest of the object's content */
  digest: string;
};

/**
 * Gas configuration for IOTA transactions.
 * All fields are optional to support both simulation and real transactions.
 *
 * @example
 * ```typescript
 * const gasData: GasData = {
 *   gasBudget: 5000000,  // Maximum gas units to spend
 *   gasPrice: 1000,      // Price per gas unit
 *   gasPaymentObjects: [coinObject1, coinObject2]  // Coins to pay gas
 * };
 * ```
 */
export type GasData = {
  /**
   * Maximum amount of gas units this transaction can consume.
   * Measured in gas units.
   */
  gasBudget?: number;

  /**
   * Price per gas unit in MIST (smallest IOTA unit).
   * Total fee = gasBudget * gasPrice
   */
  gasPrice?: number;

  /**
   * Array of coin objects used to pay for gas.
   * These objects will be consumed to cover the transaction fee.
   */
  gasPaymentObjects?: TransactionObjectInput[];
};

/**
 * Base transaction data returned from the toJson() function.
 * Contains common fields present in all IOTA transactions.
 *
 * @example
 * ```typescript
 * const txData: TxData = {
 *   type: TransactionType.Send,
 *   sender: '0x1234...',
 *   gasBudget: 5000000,
 *   gasPrice: 1000,
 *   gasPaymentObjects: [...],
 *   gasSponsor: '0x5678...'  // Optional
 * };
 * ```
 */
export interface TxData {
  /** Transaction ID (digest), available after transaction is built */
  id?: string;

  /** Address of the transaction sender */
  sender: string;

  /** Maximum gas units allocated for this transaction */
  gasBudget?: number;

  /** Price per gas unit in MIST */
  gasPrice?: number;

  /** Coin objects used to pay for gas */
  gasPaymentObjects?: TransactionObjectInput[];

  /**
   * Optional address that sponsors (pays for) the gas.
   * If not provided, the sender pays for gas.
   */
  gasSponsor?: string;

  /** Type of the transaction */
  type: TransactionType;
}

/**
 * Transfer transaction data with recipient information.
 * Extends TxData with transfer-specific fields.
 *
 * @example
 * ```typescript
 * const transferData: TransferTxData = {
 *   type: TransactionType.Send,
 *   sender: '0x1234...',
 *   recipients: [
 *     { address: '0xabcd...', amount: '1000000' },
 *     { address: '0xef01...', amount: '2000000' }
 *   ],
 *   paymentObjects: [coinObject],
 *   gasBudget: 5000000,
 *   gasPrice: 1000,
 *   gasPaymentObjects: [gasObject]
 * };
 * ```
 */
export interface TransferTxData extends TxData {
  /**
   * Array of recipients and the amounts they receive.
   * Each recipient must have a valid IOTA address and amount.
   */
  recipients: TransactionRecipient[];

  /**
   * Optional coin objects used as payment sources.
   * These are split and transferred to recipients.
   * If not provided, gas objects are used for payment.
   */
  paymentObjects?: TransactionObjectInput[];
}

/**
 * Options for explaining an IOTA transaction.
 *
 * @example
 * ```typescript
 * const explanation = await iota.explainTransaction({
 *   txHex: '0x1234...'  // Raw transaction hex
 * });
 * ```
 */
export interface ExplainTransactionOptions {
  /** Raw transaction data in hexadecimal format */
  txHex: string;
}

/**
 * Options for parsing an IOTA transaction.
 * Extends base parsing options with IOTA-specific requirements.
 *
 * @example
 * ```typescript
 * const parsed = await iota.parseTransaction({
 *   txHex: '0x1234...'  // Raw transaction hex
 * });
 * // Returns: { inputs: [...], outputs: [...], fee: BigNumber }
 * ```
 */
export interface IotaParseTransactionOptions extends BaseParseTransactionOptions {
  /** Raw transaction data in hexadecimal format */
  txHex: string;
}
