import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { DelegateClauseTransaction } from '../transaction/delegateClauseTransaction';
import utils from '../utils';

export class DelegateTxnBuilder extends TransactionBuilder {
  /**
   * Creates a new Delegate Clause txn instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new DelegateClauseTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing Delegate txn.
   *
   * @param {DelegateClauseTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: DelegateClauseTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the staking transaction instance.
   *
   * @returns {DelegateClauseTransaction} The delegate transaction
   */
  get delegateTransaction(): DelegateClauseTransaction {
    return this._transaction as DelegateClauseTransaction;
  }

  /**
   * Gets the transaction type for delegate.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingDelegate;
  }

  /**
   * Validates the transaction clauses for delegate transaction.
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

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the staking contract address for this delegate tx.
   * The address must be explicitly provided to ensure the correct contract is used.
   *
   * @param {string} address - The staking contract address (required)
   * @returns {DelegateTxnBuilder} This transaction builder
   * @throws {Error} If no address is provided
   */
  stakingContractAddress(address: string): this {
    if (!address) {
      throw new Error('Staking contract address is required');
    }
    this.validateAddress({ address });
    this.delegateTransaction.stakingContractAddress = address;
    return this;
  }

  /**
   * Sets the token ID for this delegate tx.
   *
   * @param {number} levelId - The level ID for staking
   * @returns {DelegateTxnBuilder} This transaction builder
   */
  tokenId(tokenId: number): this {
    this.delegateTransaction.tokenId = tokenId;
    return this;
  }

  /**
   * Sets the transaction data for this delegate tx.
   *
   * @param {string} data - The transaction data
   * @returns {DelegateTxnBuilder} This transaction builder
   */
  transactionData(data: string): this {
    this.delegateTransaction.transactionData = data;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: DelegateClauseTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');

    assert(transaction.tokenId, 'Token ID is required');
    assert(transaction.delegateForever, 'delegate forever flag is required');
    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.delegateTransaction.build();
    return this.transaction;
  }
}
