import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  // get and set region
  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new Error('Method not implemented.');
  }

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    let keyPair: KeyPair;
    try {
      keyPair = new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError('Invalid key');
    }
    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  async validateRawTransaction(rawTransaction: string): Promise<void> {
    if (!rawTransaction || !this._transaction.transaction) {
      throw new BuildTransactionError('invalid raw transaction');
    }
    const localHash = await utils.computeHashFromPrepareSubmissionResponse(rawTransaction);
    if (localHash !== this._transaction.transaction.preparedTransactionHash) {
      throw new BuildTransactionError('invalid raw transaction, hash not matching');
    }
  }

  /** @inheritdoc */
  async validateTransaction(transaction?: Transaction): Promise<void> {
    if (!transaction?.transaction?.preparedTransaction) {
      return;
    }
    const localHash = await utils.computeHashFromPrepareSubmissionResponse(transaction.transaction.preparedTransaction);
    if (localHash !== transaction.transaction.preparedTransactionHash) {
      throw new BuildTransactionError('invalid transaction');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }
}
