import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseKey, BaseTransaction, BaseTransactionBuilder, BaseAddress, Recipient } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { IcpCombineApiPayload, IcpUnsignedTransaction } from './iface';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _unsignedTransaction: IcpUnsignedTransaction;
  protected _combineApiPayload: IcpCombineApiPayload;

  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): BaseTransaction {
    throw new Error('method not implemented');
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  abstract initBuilder(tx: Transaction): void;

  /**
   * Sets the sender of this transaction.
   */
  sender(senderAddress: string): this {
    throw new Error('method not implemented');
  }

  /**
   * gets the gas data of this transaction.
   */
  gasData(): this {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new Error('method not implemented');
  }

  /**
   * validates the recipients of the transaction
   */
  validateRecipients(recipients: Recipient[]): void {
    throw new Error('method not implemented');
  }

  /**
   * validates the gas data of the transaction
   */
  validateGasData(): void {
    throw new Error('method not implemented');
  }

  /**
   * validates the gas price of the transaction
   */
  validateGasPrice(gasPrice: number): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  validateValue(): void {
    throw new Error('method not implemented');
  }

  /**
   * Validates the specific transaction builder internally
   */
  validateDecodedTransaction(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  validateTransaction(): void {
    throw new Error('method not implemented');
  }
}
