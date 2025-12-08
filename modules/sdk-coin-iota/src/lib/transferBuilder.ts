import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransferTransaction } from './transferTransaction';
import { BuildTransactionError, TransactionRecipient } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { Transaction } from './transaction';
import { TransactionObjectInput } from './iface';

/**
 * Builder for IOTA transfer transactions.
 * Handles transactions that transfer IOTA tokens from the sender to one or more recipients.
 */
export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TransferTransaction(_coinConfig);
  }

  /**
   * Sets the recipients for this transfer transaction.
   * @param recipients - Array of recipients with their addresses and amounts
   * @returns This builder for method chaining
   * @throws BuildTransactionError if any recipient is invalid
   */
  recipients(recipients: TransactionRecipient[]): this {
    this.validateRecipients(recipients);
    this.transferTransaction.recipients = recipients;
    return this;
  }

  /**
   * Sets the payment objects (coin objects) to be used for this transfer.
   * These are the source coins that will be split and transferred to recipients.
   * @param paymentObjects - Array of IOTA coin objects to use for payment
   * @returns This builder for method chaining
   */
  paymentObjects(paymentObjects: TransactionObjectInput[]): this {
    this.transferTransaction.paymentObjects = paymentObjects;
    return this;
  }

  /**
   * Initializes the builder with data from an existing transfer transaction.
   * @param tx - The source transaction to copy data from
   * @throws BuildTransactionError if transaction is not a TransferTransaction
   */
  initBuilder(tx: Transaction): void {
    this.validateTransactionType(tx);
    super.initBuilder(tx);
    this.copyTransferData(tx as TransferTransaction);
  }

  /**
   * Validates that the transaction is of the correct type (TransferTransaction).
   */
  private validateTransactionType(tx: Transaction): void {
    if (!(tx instanceof TransferTransaction)) {
      throw new BuildTransactionError('Transaction must be of type TransferTransaction');
    }
  }

  /**
   * Copies transfer-specific data from source transaction.
   */
  private copyTransferData(tx: TransferTransaction): void {
    this.transferTransaction.recipients = tx.recipients;
    this.transferTransaction.paymentObjects = tx.paymentObjects;
  }

  /**
   * Validates a complete transfer transaction.
   * @param transaction - The transaction to validate
   * @throws BuildTransactionError if transaction is invalid or not a TransferTransaction
   */
  validateTransaction(transaction?: Transaction): void {
    if (!transaction) {
      throw new BuildTransactionError('Transaction is required for validation');
    }

    this.validateTransactionType(transaction);
    super.validateTransaction(transaction);
    this.validateRecipients((transaction as TransferTransaction).recipients);
  }

  /**
   * Returns the transaction as a TransferTransaction type.
   */
  protected get transferTransaction(): TransferTransaction {
    return this._transaction as TransferTransaction;
  }

  /**
   * Validates all recipients have valid addresses and amounts.
   * @param recipients - Array of recipients to validate
   * @throws BuildTransactionError if any recipient has invalid address or amount
   */
  private validateRecipients(recipients: TransactionRecipient[]): void {
    recipients.forEach((recipient) => {
      this.validateAddress({ address: recipient.address });
      this.validateValue(new BigNumber(recipient.amount));
    });
  }
}
