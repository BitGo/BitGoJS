import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransactionReceipt } from './iface';

/**
 * Valid resource types for Tron freezing
 */
export enum FreezeResource {
  BANDWIDTH = 'BANDWIDTH',
  ENERGY = 'ENERGY',
}

interface RawContract {
  parameter: {
    value: {
      resource?: string;
      frozen_balance?: number;
      owner_address?: string;
    };
  };
  type: string;
}

export class FreezeTransactionBuilder extends TransactionBuilder {
  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  initBuilder(rawTransaction: TransactionReceipt | string): void {
    this.transaction = this.fromImplementation(rawTransaction);
    this.transaction.setTransactionType(this.transactionType);
  }

  validateTransaction(transaction: Transaction | TransactionReceipt): void {
    if (transaction && typeof (transaction as Transaction).toJson === 'function') {
      super.validateTransaction(transaction as Transaction);
      const rawTx = (transaction as Transaction).toJson();
      this.validateFreezeTransaction(rawTx);
    } else {
      this.validateFreezeTransaction(transaction as TransactionReceipt);
    }
  }

  /**
   * Validates if the transaction is a valid freeze transaction
   * @param transaction The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateFreezeTransaction(transaction: TransactionReceipt): void {
    if (
      !transaction ||
      !transaction.raw_data ||
      !transaction.raw_data.contract ||
      transaction.raw_data.contract.length === 0
    ) {
      throw new InvalidTransactionError('Invalid transaction: missing or empty contract array');
    }

    const contract = transaction.raw_data.contract[0] as RawContract;

    // Validate contract type
    if (contract.type !== 'FreezeBalanceV2Contract') {
      throw new InvalidTransactionError(
        `Invalid freeze transaction: expected contract type FreezeBalanceV2Contract but got ${contract.type}`
      );
    }

    // Validate parameter value
    if (!contract.parameter || !contract.parameter.value) {
      throw new InvalidTransactionError('Invalid freeze transaction: missing parameter value');
    }

    const value = contract.parameter.value;

    // Validate resource
    if (!Object.values(FreezeResource).includes(value.resource as FreezeResource)) {
      throw new InvalidTransactionError(
        `Invalid freeze transaction: resource must be ${Object.values(FreezeResource).join(' or ')}, got ${
          value.resource
        }`
      );
    }

    // Validate frozen_balance
    if (!value.frozen_balance || value.frozen_balance <= 0) {
      throw new InvalidTransactionError('Invalid freeze transaction: frozen_balance must be positive');
    }

    // Validate owner_address
    if (!value.owner_address || typeof value.owner_address !== 'string' || value.owner_address.length === 0) {
      throw new InvalidTransactionError('Invalid freeze transaction: missing or invalid owner_address');
    }
  }

  /**
   * Check if the transaction is a valid freeze transaction
   * @param transaction Transaction to check
   * @returns True if the transaction is a valid freeze transaction
   */
  canSign(transaction: TransactionReceipt): boolean {
    try {
      this.validateFreezeTransaction(transaction);
      return true;
    } catch (e) {
      return false;
    }
  }
}
