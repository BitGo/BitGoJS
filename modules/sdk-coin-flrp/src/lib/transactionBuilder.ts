import { avmSerial, pvmSerial, UnsignedTx } from '@flarenetwork/flarejs';
import { BaseTransactionBuilder, BuildTransactionError, BaseKey, BaseAddress } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedUtxoObj, Tx } from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction';
import utils from './utils';
import BigNumber from 'bignumber.js';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected recoverSigner = false;
  public _signer: KeyPair[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   * @returns itself
   */
  initBuilder(tx: Tx): this {
    const baseTx = ((tx as UnsignedTx).tx as pvmSerial.AddPermissionlessValidatorTx).baseTx;

    // Validate network and blockchain IDs match
    if (
      baseTx.NetworkId.value() !== this._transaction._networkID ||
      baseTx.BlockchainId.value() !== this._transaction._blockchainID
    ) {
      throw new Error('Network or blockchain ID mismatch');
    }

    this._transaction.setTransaction(tx);
    return this;
  }

  // region Validators
  /**
   * Validates the threshold for multi-signature transactions
   * @param threshold - Number of required signatures
   */
  validateThreshold(threshold: number): void {
    if (!threshold || threshold !== 2) {
      throw new BuildTransactionError('Invalid transaction: threshold must be set to 2');
    }
  }

  /**
   * Validates a single UTXO object
   * @param value - UTXO to validate
   */
  validateUtxo(value: DecodedUtxoObj): void {
    const requiredFields = ['outputID', 'amount', 'txid', 'outputidx'];
    for (const field of requiredFields) {
      if (!value.hasOwnProperty(field)) {
        throw new BuildTransactionError(`UTXO missing required field: ${field}`);
      }
    }
  }

  /**
   * Validates an array of UTXOs
   * @param values - Array of UTXOs to validate
   */
  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError('UTXOs array cannot be empty');
    }
    values.forEach(this.validateUtxo);
  }

  /**
   * Validates the locktime value
   * @param locktime - Timestamp after which the output can be spent
   */
  validateLocktime(locktime: bigint): void {
    if (!locktime || locktime < BigInt(0)) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }
  // endregion

  /**
   * Sets the threshold for multi-signature transactions
   * @param value - Number of required signatures
   */
  threshold(value: number): this {
    this.validateThreshold(value);
    this._transaction._threshold = value;
    return this;
  }

  /**
   * Sets the locktime for the transaction
   * @param value - Timestamp after which the output can be spent
   */
  locktime(value: string | number): this {
    this.validateLocktime(BigInt(value));
    this._transaction._locktime = BigInt(value);
    return this;
  }

  /**
   * Enables recovery mode for the transaction
   * @param recoverSigner - Whether to use recovery signing
   */
  recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  /**
   * Sets the sender's public key(s)
   * @param senderPubKey - Public key or array of public keys
   */
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = Array.isArray(senderPubKey) ? senderPubKey : [senderPubKey];
    this._transaction._fromAddresses = pubKeys.map((addr) => utils.parseAddress(addr));
    return this;
  }

  /**
   * Sets the UTXOs for the transaction
   * @param value - Array of UTXOs to use
   */
  utxos(value: DecodedUtxoObj[]): this {
    this.validateUtxos(value);
    this._transaction._utxos = value;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    try {
      // Parse the raw transaction using Flare's PVM serialization
      const [tx] = pvmSerial.AddPermissionlessValidatorTx.fromBytes(
        Buffer.from(rawTransaction, 'hex'),
        avmSerial.getAVMManager().getDefaultCodec()
      );
      this.initBuilder(tx);
      return this._transaction;
    } catch (e) {
      throw new BuildTransactionError(`Failed to parse raw transaction: ${e.message}`);
    }
  }

  /**
   * Abstract method to be implemented by specific transaction builders
   * Builds the actual transaction based on the builder's configuration
   */
  protected abstract buildImplementation(): Promise<Transaction>;

  /**
   * Check the buffer has 32 byte long.
   * @param chainID
   */
  validateChainId(chainID: Buffer): void {
    if (chainID.length !== 32) {
      throw new BuildTransactionError('Chain id are 32 byte size');
    }
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /**
   * Check that fee is greater than 0.
   * @param {bigint} fee
   */
  validateFee(fee: bigint): void {
    if (fee <= BigInt(0)) {
      throw new BuildTransactionError('Fee must be greater than 0');
    }
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    try {
      new KeyPair({ prv: key });
    } catch (e) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    // throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   *
   * @param rawTransaction Transaction in any format
   */
  validateRawTransaction(rawTransaction: string): void {
    utils.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): Transaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  /**
   * Check the amount is positive.
   * @param amount
   */
  validateAmount(amount: bigint): void {
    if (amount <= BigInt(0)) {
      throw new BuildTransactionError('Amount must be greater than 0');
    }
  }
}
