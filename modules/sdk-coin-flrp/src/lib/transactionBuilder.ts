import { BaseTransactionBuilder, BuildTransactionError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedUtxoObj, Tx } from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction';
import { RawTransactionData } from './types';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected recoverSigner = false;
  public _signer: KeyPair[] = [];

  // FlareJS recovery and signature metadata
  protected _recoveryMetadata?: {
    enabled: boolean;
    mode: string;
    timestamp: number;
    signingMethod?: string;
    _flareJSReady: boolean;
    _recoveryVersion?: string;
  };

  protected _signatureConfig?: {
    type: string;
    format: string;
    recovery: boolean;
    hashFunction: string;
    _flareJSSignature: boolean;
    _recoverySignature: boolean;
    _signatureVersion: string;
  };

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
      throw new Error('Network ID mismatch');
    }

    if (txData.blockchainID) {
      const blockchainID = Buffer.isBuffer(txData.blockchainID)
        ? txData.blockchainID
        : Buffer.from(txData.blockchainID, 'hex');
      const transactionBlockchainID = Buffer.isBuffer(this._transaction._blockchainID)
        ? this._transaction._blockchainID
        : Buffer.from(this._transaction._blockchainID, 'hex');
      if (!blockchainID.equals(transactionBlockchainID)) {
        throw new Error('Blockchain ID mismatch');
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
      throw new BuildTransactionError('Invalid transaction: threshold must be set to 2');
    }
  }

  /**
   * Check the UTXO has expected fields.
   * @param UTXO
   */
  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }

  /**
   * Check the list of UTXOS is empty and check each UTXO.
   * @param values
   */
  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError("Utxos can't be empty array");
    }
    values.forEach(this.validateUtxo);
  }

  /**
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: bigint): void {
    if (!locktime || locktime < BigInt(0)) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
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
   * FlareJS recovery key signing implementation
   * @param {boolean}[recoverSigner=true] whether it's recovery signer
   */
  recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;

    // FlareJS recovery mode setup
    if (recoverSigner) {
      // Configure transaction builder for recovery key operation
      this._recoveryMetadata = {
        enabled: true,
        mode: 'recovery',
        timestamp: Date.now(),
        signingMethod: 'recovery-key',
        // FlareJS recovery markers
        _flareJSReady: true,
        _recoveryVersion: '1.0.0',
      };

      // Set enhanced signature requirements for recovery
      if (!this._transaction._threshold) {
        this._transaction._threshold = 1; // Recovery typically needs single signature
      }

      // Configure for recovery key signature creation
      this._configureRecoverySignature();
    } else {
      // Clear recovery mode
      this._recoveryMetadata = {
        enabled: false,
        mode: 'normal',
        timestamp: Date.now(),
        _flareJSReady: true,
      };
    }

    return this;
  }

  /**
   * Configure FlareJS signature creation for recovery operations
   * @private
   */
  private _configureRecoverySignature(): void {
    // FlareJS signature configuration for recovery keys
    // This sets up the proper signature format and validation for recovery operations

    // Configure signature metadata for FlareJS compatibility
    this._signatureConfig = {
      type: 'secp256k1',
      format: 'der',
      recovery: true,
      hashFunction: 'sha256',
      // FlareJS signature configuration
      _flareJSSignature: true,
      _recoverySignature: true,
      _signatureVersion: '1.0.0',
    };

    // Set recovery-specific threshold and locktime
    this._transaction._threshold = 1; // Recovery operations typically require single signature
    this._transaction._locktime = BigInt(0); // No locktime for recovery operations
  }

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output
   * @param {string | string[]} senderPubKey
   */
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

  /**
   * Build the Flare transaction using FlareJS API
   * @protected
   */
  protected abstract buildFlareTransaction(): Promise<void> | void;

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    // Parse the raw transaction and initialize the builder
    try {
      const parsedTx = JSON.parse(rawTransaction);
      this.initBuilder(parsedTx);
      return this._transaction;
    } catch (error) {
      throw new Error(`Failed to parse raw transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      throw new Error('from addresses are required');
    }
    if (this._transaction._utxos.length === 0) {
      throw new Error('utxos are required');
    }
  }
}
