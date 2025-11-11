import {
  BaseTransactionBuilder,
  BuildTransactionError,
  TransactionType,
  BaseKey,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedUtxoObj, Tx } from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction';
import { RawTransactionData } from './types';
import {
  ERROR_NETWORK_ID_MISMATCH,
  ERROR_BLOCKCHAIN_ID_MISMATCH_BUILDER,
  ERROR_INVALID_THRESHOLD,
  ERROR_INVALID_LOCKTIME,
  ERROR_UTXOS_EMPTY_ARRAY,
  ERROR_UTXOS_MISSING_FIELD,
  ERROR_FROM_ADDRESSES_REQUIRED,
  ERROR_UTXOS_REQUIRED_BUILDER,
  ERROR_PARSE_RAW_TRANSACTION,
  ERROR_UNKNOWN_PARSING,
  UTXO_REQUIRED_FIELDS,
  HEX_ENCODING,
} from './constants';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected recoverSigner = false;
  public _signer: KeyPair[] = [];

  // Recovery mode flag for transaction building
  protected _recoveryMode = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Tx} tx the transaction data
   * @returns itself
   */
  initBuilder(tx: Tx): this {
    // Validate network and blockchain IDs if available
    const txData = tx as unknown as RawTransactionData;

    if (txData.networkID !== undefined && txData.networkID !== this._transaction._networkID) {
      throw new Error(ERROR_NETWORK_ID_MISMATCH);
    }

    if (txData.blockchainID) {
      const blockchainID = Buffer.isBuffer(txData.blockchainID)
        ? txData.blockchainID
        : Buffer.from(txData.blockchainID, HEX_ENCODING);
      const transactionBlockchainID = Buffer.isBuffer(this._transaction._blockchainID)
        ? this._transaction._blockchainID
        : Buffer.from(this._transaction._blockchainID, HEX_ENCODING);
      if (!blockchainID.equals(transactionBlockchainID)) {
        throw new Error(ERROR_BLOCKCHAIN_ID_MISMATCH_BUILDER);
      }
    }

    this._transaction.setTransaction(tx);
    return this;
  }

  // region Validators
  /**
   * Validates the threshold
   * @param threshold
   */
  validateThreshold(threshold: number): void {
    if (!threshold || threshold !== 2) {
      throw new BuildTransactionError(ERROR_INVALID_THRESHOLD);
    }
  }

  /**
   * Check the UTXO has expected fields.
   * @param UTXO
   */
  validateUtxo(value: DecodedUtxoObj): void {
    UTXO_REQUIRED_FIELDS.forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`${ERROR_UTXOS_MISSING_FIELD} ${field}`);
    });
  }

  /**
   * Check the list of UTXOS is empty and check each UTXO.
   * @param values
   */
  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError(ERROR_UTXOS_EMPTY_ARRAY);
    }
    values.forEach(this.validateUtxo);
  }

  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: bigint): void {
    if (!locktime || locktime < BigInt(0)) {
      throw new BuildTransactionError(ERROR_INVALID_LOCKTIME);
    }
  }
  // endregion

  /**
   * Threshold is an int that names the number of unique signatures required to spend the output.
   * Must be less than or equal to the length of Addresses.
   * @param {number} value
   */
  threshold(value: number): this {
    this.validateThreshold(value);
    this._transaction._threshold = value;
    return this;
  }

  /**
   * Locktime is a long that contains the unix timestamp that this output can be spent after.
   * The unix timestamp is specific to the second.
   * @param value
   */
  locktime(value: string | number): this {
    this.validateLocktime(BigInt(value));
    this._transaction._locktime = BigInt(value);
    return this;
  }

  /**
   * When using recovery key must be set here
   * @param {boolean}[recoverSigner=true] whether it's recovery signer
   */
  recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    this._recoveryMode = recoverSigner;

    // Recovery operations typically need single signature
    if (recoverSigner && !this._transaction._threshold) {
      this._transaction._threshold = 1;
    }

    return this;
  }

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output
   * @param {string | string[]} senderPubKey
   */
  // TODO: need to check for the address format
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction._fromAddresses = pubKeys; // Store as strings directly
    return this;
  }

  /**
   * List of UTXO required as inputs.
   * A UTXO is a standalone representation of a transaction output.
   *
   * @param {DecodedUtxoObj[]} list of UTXOS
   */
  utxos(value: DecodedUtxoObj[]): this {
    this.validateUtxos(value);
    this._transaction._utxos = value;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    // Parse the raw transaction and initialize the builder
    try {
      const parsedTx = JSON.parse(rawTransaction);
      this.initBuilder(parsedTx);
      return this._transaction;
    } catch (error) {
      throw new Error(
        `${ERROR_PARSE_RAW_TRANSACTION}: ${error instanceof Error ? error.message : ERROR_UNKNOWN_PARSING}`
      );
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildFlareTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  protected abstract get transactionType(): TransactionType;

  /**
   * Getter for know if build should sign
   */
  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  /**
   * Build the Flare transaction using FlareJS API
   * @protected
   */
  protected abstract buildFlareTransaction(): Promise<void> | void;

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): BaseTransaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  /**
   * Get the transaction instance
   */
  get transaction(): Transaction {
    return this._transaction;
  }

  /**
   * Validate required fields before building transaction
   * @protected
   */
  protected validateRequiredFields(): void {
    if (this._transaction._fromAddresses.length === 0) {
      throw new Error(ERROR_FROM_ADDRESSES_REQUIRED);
    }
    if (this._transaction._utxos.length === 0) {
      throw new Error(ERROR_UTXOS_REQUIRED_BUILDER);
    }
  }
}
