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
import { CantonPrepareCommandResponse } from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction/transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  private _signatures: Signature[] = [];

  initBuilder(tx: Transaction): void {
    this._transaction = tx;
  }

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  abstract setTransaction(transaction: CantonPrepareCommandResponse): void;

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
    if (!rawTransaction || !this._transaction.prepareCommand) {
      throw new BuildTransactionError('invalid raw transaction');
    }
    const localHash = await utils.computeHashFromPrepareSubmissionResponse(rawTransaction);
    if (localHash !== this._transaction.prepareCommand.preparedTransactionHash) {
      throw new BuildTransactionError('invalid raw transaction, hash not matching');
    }
  }

  /** @inheritdoc */
  async validateTransaction(transaction?: Transaction): Promise<void> {
    if (!transaction?.prepareCommand?.preparedTransaction) {
      return;
    }
    const localHash = await utils.computeHashFromPrepareSubmissionResponse(
      transaction.prepareCommand.preparedTransaction
    );
    if (localHash !== transaction.prepareCommand.preparedTransactionHash) {
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
