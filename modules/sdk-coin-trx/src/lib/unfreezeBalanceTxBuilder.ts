import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionReceipt } from './iface';
import { TronResource } from './resourceTypes';

interface RawUnfreezeBalanceContract {
  parameter: {
    value: {
      resource?: string;
      unfreeze_balance?: number;
      owner_address?: string;
    };
  };
  type: string;
}

export class UnfreezeBalanceTxBuilder extends TransactionBuilder {
  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingUnlock;
  }

  initBuilder(rawTransaction: TransactionReceipt | string): void {
    this.transaction = this.fromImplementation(rawTransaction);
    this.transaction.setTransactionType(this.transactionType);
  }

  validateTransaction(transaction: Transaction | TransactionReceipt): void {
    if (transaction && typeof (transaction as Transaction).toJson === 'function') {
      super.validateTransaction(transaction as Transaction);
      const rawTx = (transaction as Transaction).toJson();
      this.validateUnfreezeTransaction(rawTx);
    } else {
      this.validateUnfreezeTransaction(transaction as TransactionReceipt);
    }
  }

  /**
   * Validates if the transaction is a valid unfreeze transaction
   * @param {TransactionReceipt} transaction - The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateUnfreezeTransaction(transaction: TransactionReceipt): void {
    if (!transaction?.raw_data?.contract?.length) {
      throw new InvalidTransactionError('Invalid transaction: missing or empty contract array');
    }

    const contract = transaction.raw_data.contract[0] as RawUnfreezeBalanceContract;

    // Validate contract type
    if (contract.type !== 'UnfreezeBalanceV2Contract') {
      throw new InvalidTransactionError(
        `Invalid unfreeze transaction: expected contract type UnfreezeBalanceV2Contract but got ${contract.type}`
      );
    }

    // Validate parameter value
    if (!contract?.parameter?.value) {
      throw new InvalidTransactionError('Invalid unfreeze transaction: missing parameter value');
    }

    const value = contract.parameter.value;

    // Validate resource
    if (!Object.values(TronResource).includes(value.resource as TronResource)) {
      throw new InvalidTransactionError(
        `Invalid unfreeze transaction: resource must be ${Object.values(TronResource).join(' or ')}, got ${
          value.resource
        }`
      );
    }

    // Validate unfreeze_balance
    if (!value.unfreeze_balance || value.unfreeze_balance <= 0) {
      throw new InvalidTransactionError('Invalid unfreeze transaction: unfreeze_balance must be positive');
    }

    // Validate owner_address
    if (!value.owner_address || typeof value.owner_address !== 'string' || value.owner_address.length === 0) {
      throw new InvalidTransactionError('Invalid unfreeze transaction: missing or invalid owner_address');
    }
  }

  /**
   * Check if the transaction is a valid unfreeze transaction
   * @param {TransactionReceipt} transaction - Transaction to check
   * @returns True if the transaction is a valid unfreeze transaction
   */
  canSign(transaction: TransactionReceipt): boolean {
    try {
      this.validateUnfreezeTransaction(transaction);
      return true;
    } catch (e) {
      return false;
    }
  }
}
