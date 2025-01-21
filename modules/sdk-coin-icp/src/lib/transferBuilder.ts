import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { BaseKey, Recipient, TransactionType, BaseTransaction } from '@bitgo/sdk-core';

export class TransferBuilder extends TransactionBuilder {
  protected _recipients: Recipient[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  send(recipients: Recipient[]): this {
    this.validateRecipients(recipients);
    this._recipients = recipients;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  sign(key: BaseKey): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    throw new Error('method not implemented');
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   */
  initBuilder(): void {
    throw new Error('method not implemented');
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    throw new Error('method not implemented');
  }

  /**
   * Build transfer programmable transaction
   *
   * @protected
   */
  protected buildIcpTransaction(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  TransactionBuilder(): void {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  fromImplementation(): BaseTransaction {
    throw new Error('method not implemented');
  }

  /** @inheritdoc */
  get transaction(): BaseTransaction {
    throw new Error('method not implemented');
  }
}
