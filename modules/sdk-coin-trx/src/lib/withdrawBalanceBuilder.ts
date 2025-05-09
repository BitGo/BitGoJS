import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionReceipt } from './iface';

interface RawWithdrawContract {
  parameter: {
    value: {
      owner_address?: string;
    };
  };
  type: string;
}

export class WithdrawBuilder extends TransactionBuilder {
  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /** Override to initialize this builder from a raw transaction */
  initBuilder(rawTransaction: TransactionReceipt | string): void {
    this.transaction = this.fromImplementation(rawTransaction);
    // Explicitly set the transaction type after initialization
    this.transaction.setTransactionType(this.transactionType);
  }

  validateTransaction(transaction: Transaction | TransactionReceipt): void {
    if (transaction && typeof (transaction as Transaction).toJson === 'function') {
      super.validateTransaction(transaction as Transaction);
      const rawTx = (transaction as Transaction).toJson();
      this.validateWithdrawTransaction(rawTx);
    } else {
      this.validateWithdrawTransaction(transaction as TransactionReceipt);
    }
  }

  /**
   * Validates if the transaction is a valid withdraw transaction
   * @param transaction The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateWithdrawTransaction(transaction: TransactionReceipt): void {
    if (
      !transaction ||
      !transaction.raw_data ||
      !transaction.raw_data.contract ||
      transaction.raw_data.contract.length === 0
    ) {
      throw new InvalidTransactionError('Invalid transaction: missing or empty contract array');
    }

    const contract = transaction.raw_data.contract[0] as RawWithdrawContract;

    // Validate contract type
    if (contract.type !== 'WithdrawExpireUnfreezeContract') {
      throw new InvalidTransactionError(
        `Invalid withdraw transaction: expected contract type WithdrawExpireUnfreezeContract but got ${contract.type}`
      );
    }

    // Validate parameter value
    if (!contract.parameter || !contract.parameter.value) {
      throw new InvalidTransactionError('Invalid withdraw transaction: missing parameter value');
    }

    const value = contract.parameter.value;

    // Validate owner_address
    if (!value.owner_address || typeof value.owner_address !== 'string' || value.owner_address.length === 0) {
      throw new InvalidTransactionError('Invalid withdraw transaction: missing or invalid owner_address');
    }
  }

  /**
   * Check if the transaction is a valid withdraw transaction
   * @param transaction Transaction to check
   * @returns True if the transaction is a valid withdraw transaction
   */
  canSign(transaction: TransactionReceipt): boolean {
    try {
      this.validateWithdrawTransaction(transaction);
      return true;
    } catch (e) {
      return false;
    }
  }
}
