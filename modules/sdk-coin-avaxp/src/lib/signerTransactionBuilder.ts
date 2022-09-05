import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { Tx } from 'avalanche/dist/apis/platformvm';
import {
  BaseAddress,
  BaseKey,
  BaseTransaction,
  BaseTransactionBuilder,
  BuildTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { DecodedUtxoObj } from './iface';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import BigNumber from 'bignumber.js';

/**
 * Signer transaction builder required raw tx and only allow to sign it.
 */
export class SignerTransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  public _signer: KeyPair[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
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

  protected get transactionType(): TransactionType {
    return this.transaction.type;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Tx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.transaction.setTransaction(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
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
    if (chainID.length != 32) {
      throw new BuildTransactionError('Chain id are 32 byte size');
    }
  }
  // endregion
}
