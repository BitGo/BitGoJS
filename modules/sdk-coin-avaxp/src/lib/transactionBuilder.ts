import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  TransactionType,
  BuildTransactionError,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { DecodedUtxoObj, Tx } from './iface';
import { Tx as PVMTx } from 'avalanche/dist/apis/platformvm';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  public _signer: KeyPair[] = [];
  protected recoverSigner = false;

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
    const baseTx = tx.getUnsignedTx().getTransaction();
    if (
      baseTx.getNetworkID() !== this._transaction._networkID ||
      !baseTx.getBlockchainID().equals(this._transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }
    // EVMBaseTx has not memo.
    if ('getMemo' in baseTx) {
      this._transaction._memo = baseTx.getMemo();
    }
    this._transaction.setTransaction(tx);
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new PVMTx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /**
   * Builds the avax transaction. transaction field is changed.
   */
  protected abstract buildAvaxTransaction(): void;

  // region Getters and Setters
  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param {boolean} true if it's recovery signer, default true.
   */
  public recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  /**
   * Threshold is an int that names the number of unique signatures required to spend the output.
   * Must be less than or equal to the length of Addresses.
   * @param {number}
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
    this.validateLocktime(new BN(value));
    this._transaction._locktime = new BN(value);
    return this;
  }

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output.
   * @param {string | stirng[]} senderPubKey
   */
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction._fromAddresses = pubKeys.map(utils.parseAddress);
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
   *
   * @param value Optional Buffer for the memo
   * @returns value Buffer for the memo
   * set using Buffer.from("message")
   */
  memo(value: string): this {
    this._transaction._memo = utils.stringToBuffer(value);
    return this;
  }

  /**
   * Getter for know if build should sign
   */
  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): BaseTransaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  protected abstract get transactionType(): TransactionType;

  // endregion
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
   * Validates locktime
   * @param locktime
   */
  validateLocktime(locktime: BN): void {
    if (!locktime || locktime.lt(new BN(0))) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It overrides abstract method from BaseTransactionBuilder
   *
   * @param rawTransaction Transaction in any format
   */
  validateRawTransaction(rawTransaction: string): void {
    utils.validateRawTransaction(rawTransaction);
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
   * Check the UTXO has expected fields.
   * @param UTXO
   */
  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }

  /**
   * Check the amount is positive.
   * @param amount
   */
  validateAmount(amount: BN): void {
    if (amount.lten(0)) {
      throw new BuildTransactionError('Amount must be greater than 0');
    }
  }

  /**
   * Check the buffer has 32 byte long.
   * @param chainID
   */
  validateChainId(chainID: BufferAvax): void {
    if (chainID.length !== 32) {
      throw new BuildTransactionError('Chain id are 32 byte size');
    }
  }

  // endregion
}
