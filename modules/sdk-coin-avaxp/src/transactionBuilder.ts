import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { BaseTransactionBuilder, TransactionType } from '@bitgo/sdk-core/src/account-lib/baseCoin';
import { NotImplementedError } from '@bitgo/sdk-core/src/account-lib/baseCoin/errors';
import { BaseAddress, BaseKey } from '@bitgo/sdk-core/src/account-lib/baseCoin/iface';
import { Transaction } from './transaction';
import { DEFAULT_CHAIN_NAMES } from './constants';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  protected _sender!: string; // this is not required for baseTx that extends all the other tx maybe switch into addDelegator / addValidator
  protected _network: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
    this._network = this.coinName() === 'avaxp' ? DEFAULT_CHAIN_NAMES.mainnet : DEFAULT_CHAIN_NAMES.testnet;
  }

  /**
   *
   * @param {BaseAddress} address The p-chain address.
   * @returns {TransactionBuilder} This transaction builder.
   *
   */
  sender({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._sender = address;
    this._transaction.sender(address);
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }

  /**
   * Builds the avaxp transaction.
   */
  protected abstract buildAvaxpTransaction(): Transaction;

  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected abstract get transactionType(): TransactionType;

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    throw new NotImplementedError('validateValue not implemented');
  }
  // endregion
}
