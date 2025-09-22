import { addHexPrefix } from 'ethereumjs-util';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { TransactionType } from '@bitgo-beta/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { TokenTransaction } from '../transaction/tokenTransaction';
import utils from '../utils';

export class TokenTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  initBuilder(tx: TokenTransaction): void {
    this._transaction = tx;
  }

  get tokenTransaction(): TokenTransaction {
    return this._transaction as TokenTransaction;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Validates the transaction clauses for flush token transaction.
   * @param {TransactionClause[]} clauses - The transaction clauses to validate.
   * @returns {boolean} - Returns true if the clauses are valid, false otherwise.
   */
  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    try {
      if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return false;
      }

      const clause = clauses[0];

      if (!clause.to || !utils.isValidAddress(clause.to)) {
        return false;
      }

      // For token transactions, the value should be 0
      if (clause.value !== 0) {
        return false;
      }

      const { address } = utils.decodeTransferTokenData(clause.data);
      const recipientAddress = addHexPrefix(address.toString()).toLowerCase();

      if (!recipientAddress || !utils.isValidAddress(recipientAddress)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  tokenAddress(address: string): this {
    this.validateAddress({ address });
    this.tokenTransaction.tokenAddress = address;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: TokenTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }

    if (!transaction.tokenAddress) {
      throw new Error('Token address is required');
    }

    this.validateAddress({ address: transaction.tokenAddress });
  }
}
