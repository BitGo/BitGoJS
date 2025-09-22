import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { TransactionType, BuildTransactionError } from '@bitgo-beta/sdk-core';
import { decodeFlushTokensData, flushTokensData } from '@bitgo-beta/abstract-eth';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { FlushTokenTransaction } from '../transaction/flushTokenTransaction';
import utils from '../utils';

export class FlushTokenTransactionBuilder extends TransactionBuilder {
  /**
   * Creates a new FlushTokenTransactionBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Initializes the builder with an existing FlushTokenTransaction.
   *
   * @param {FlushTokenTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: FlushTokenTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the flush token transaction instance.
   *
   * @returns {FlushTokenTransaction} The flush token transaction
   */
  get flushTokenTransaction(): FlushTokenTransaction {
    return this._transaction as FlushTokenTransaction;
  }

  /**
   * Gets the transaction type for flush token.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.FlushTokens;
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

      // For address init transactions, value must be exactly 0
      if (clause.value !== 0) {
        return false;
      }

      const { tokenAddress } = decodeFlushTokensData(clause.data, clause.to);

      if (!utils.isValidAddress(tokenAddress as string)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the token address for this token flush tx.
   *
   * @param {string} address - The token address to be set for the token flush transaction
   * @returns {FlushTokenTransactionBuilder} This transaction builder
   */
  tokenAddress(address: string): this {
    this.validateAddress({ address });
    this.flushTokenTransaction.tokenAddress = address;
    return this;
  }

  /**
   * Sets the forwarder version for this token flush transaction.
   * The forwarder version must be 4 or higher.
   *
   * @param {number} version - The forwarder version to use (must be >= 4)
   * @returns {FlushTokenTransactionBuilder} This transaction builder
   * @throws {BuildTransactionError} When version is less than 4
   */
  forwarderVersion(version: number): this {
    if (version < 4) {
      throw new BuildTransactionError(`Invalid forwarder version: ${version}`);
    }

    this.flushTokenTransaction.forwarderVersion = version;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: FlushTokenTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.contract, 'Contract address is required');
    assert(transaction.tokenAddress, 'Token address is required');

    this.validateAddress({ address: transaction.contract });
    this.validateAddress({ address: transaction.tokenAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const transactionData = this.getFlushTokenTransactionData();
    this.transaction.type = this.transactionType;
    this.flushTokenTransaction.transactionData = transactionData;
    await this.flushTokenTransaction.build();
    return this.transaction;
  }

  /**
   * Generates the transaction data for flush token transaction
   *
   * @private
   * @returns {string} The encoded transaction data as a hex string
   */
  private getFlushTokenTransactionData(): string {
    const flushTokenData = flushTokensData(
      this.flushTokenTransaction.contract,
      this.flushTokenTransaction.tokenAddress,
      this.flushTokenTransaction.forwarderVersion
    );
    return flushTokenData;
  }
}
