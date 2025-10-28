import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransferTransaction } from './transferTransaction';
import { BuildTransactionError, TransactionRecipient } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { Transaction } from './transaction';
import { TransactionObjectInput } from './iface';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TransferTransaction(_coinConfig);
  }

  recipients(recipients: TransactionRecipient[]): this {
    this.validateRecipients(recipients);
    this.transferTransaction.recipients = recipients;
    return this;
  }

  paymentObjects(paymentObjects: TransactionObjectInput[]): this {
    if (paymentObjects.length === 0) {
      throw new BuildTransactionError('No Objects provided for payment');
    }
    this.transferTransaction.paymentObjects = paymentObjects;
    return this;
  }

  initBuilder(tx: Transaction): void {
    if (!(tx instanceof TransferTransaction)) {
      throw new BuildTransactionError('Transaction must be of type TransferTransaction');
    }
    super.initBuilder(tx);
    this.transferTransaction.recipients = tx.recipients;
    this.transferTransaction.paymentObjects = tx.paymentObjects;
  }

  validateTransaction(transaction?: Transaction): void {
    if (!transaction) {
      throw new BuildTransactionError('Transaction is required for validation');
    }
    if (!(transaction instanceof TransferTransaction)) {
      throw new BuildTransactionError('Transaction must be of type TransferTransaction');
    }
    super.validateTransaction(transaction);
    this.validateRecipients(transaction.recipients);
  }

  protected get transferTransaction(): TransferTransaction {
    return this._transaction as TransferTransaction;
  }

  private validateRecipients(recipients: TransactionRecipient[]) {
    recipients.forEach((recipient) => {
      this.validateAddress({ address: recipient.address });
      this.validateValue(new BigNumber(recipient.amount));
    });
  }
}
