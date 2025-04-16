import { InvalidTransactionError } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';

/**
 * Valid resource types for Tron freezing
 */
export enum FreezeResource {
  BANDWIDTH = 'BANDWIDTH',
  ENERGY = 'ENERGY',
}

export class FreezeBuilder extends TransactionBuilder {
  validateTransaction(transaction: any): void {
    if (transaction && typeof transaction.toJson === 'function') {
      super.validateTransaction(transaction);
      // Get the raw transaction data from the Transaction object
      const rawTx = transaction.toJson();
      this.validateFreezeTransaction(rawTx);
    } else {
      // If it's already a raw transaction object, validate it directly
      this.validateFreezeTransaction(transaction);
    }
  }

  /**
   * Validates if the transaction is a valid freeze transaction
   * @param transaction The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateFreezeTransaction(transaction: any): void {
    if (
      !transaction ||
      !transaction.raw_data ||
      !transaction.raw_data.contract ||
      transaction.raw_data.contract.length === 0
    ) {
      throw new InvalidTransactionError('Invalid transaction: missing or empty contract array');
    }

    const contract = transaction.raw_data.contract[0];

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
    if (!Object.values(FreezeResource).includes(value.resource)) {
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
  canSign(transaction: any): boolean {
    try {
      this.validateFreezeTransaction(transaction);
      return true;
    } catch (e) {
      return false;
    }
  }
}
