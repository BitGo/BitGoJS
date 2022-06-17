import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import {
  NotImplementedError,
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  TransactionType,
  InvalidTransactionError,
  ParseTransactionError,
  BuildTransactionError,
  NotSupported,
  BaseTransaction,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { BN } from 'avalanche';
import { BaseTx } from 'avalanche/dist/apis/platformvm/basetx';
import { Credential } from 'avalanche/dist/common';
import utils from './utils';
import { DecodedUtxoObj } from './iface';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  public _signer: KeyPair[] = [];
  protected recoverSigner = false;

  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param recoverSigner
   */
  public recoverMode(recoverSigner = true): this {
    this.recoverSigner = recoverSigner;
    return this;
  }

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * commented out check until multisig signing is in effect
   * TODO: STLX-17077
   * @param value
   */

  threshold(value: number): this {
    // this.validateThreshold(value);
    this._transaction._threshold = value;
    return this;
  }

  locktime(value: string | number): this {
    this.validateLocktime(new BN(value));
    this._transaction._locktime = new BN(value);
    return this;
  }

  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction._fromPubKeys = pubKeys.map(utils.parseAddress);
    return this;
  }

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
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx?: BaseTx): this {
    if (!tx) return this;
    if (
      tx.getNetworkID() !== this._transaction._networkID ||
      !tx.getBlockchainID().equals(this._transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }
    this._transaction._memo = tx.getMemo();
    const out = tx.getOuts()[0];
    if (!out.getAssetID().equals(this._transaction._assetId)) {
      throw new Error('AssetID are not equals');
    }
    const secpOut = out.getOutput();
    this._transaction._locktime = secpOut.getLocktime();
    this._transaction._threshold = secpOut.getThreshold();
    this._transaction._fromPubKeys = secpOut.getAddresses();
    this._transaction.avaxPTransaction = tx;
    return this;
  }

  credentials(credentials: Credential[]): this {
    this.transaction.credentials = credentials;
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    throw new NotSupported('from raw transaction is not supported. See TransactionBuilderFactory.from method');
  }

  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    // TODO: STLX-17317: sign with recovery key
    // if (this.hasSigner) {
    //    this.recoverSigner = this._fromPubKeys[1].equals(utils.parseAddress(this._signer[0].getAddress()));
    // }
    this.transaction.avaxPTransaction = this.buildAvaxpTransaction();
    if (this.hasSigner) {
      if (!this.transaction.hasCredentials) {
        this.transaction.credentials = utils.getCredentials(this.transaction.avaxPTransaction);
      }
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    this.transaction.setTransactionType(this.transactionType);
    return this.transaction;
  }

  /**
   * Builds the avaxp transaction
   * @return {Transaction} avaxp sdk transaction
   */
  protected abstract buildAvaxpTransaction(): BaseTx;

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

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
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    try {
      utils.cb58Decode(rawTransaction);
    } catch (e) {
      throw new ParseTransactionError('Raw transaction is not hex string');
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

  validateUtxos(values: DecodedUtxoObj[]): void {
    if (values.length === 0) {
      throw new BuildTransactionError("Utxos can't be empty array");
    }
    values.forEach(this.validateUtxo);
  }

  validateUtxo(value: DecodedUtxoObj): void {
    ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
      if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
    });
  }

  // endregion
}
