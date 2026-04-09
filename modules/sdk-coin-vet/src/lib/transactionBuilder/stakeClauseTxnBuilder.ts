import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { StakeClauseTransaction } from '../transaction/stakeClauseTransaction';
import utils from '../utils';

export class StakeClauseTxnBuilder extends TransactionBuilder {
  /**
   * Creates a new StakingBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakeClauseTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing StakingTransaction.
   *
   * @param {StakingTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: StakeClauseTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the staking transaction instance.
   *
   * @returns {StakingTransaction} The staking transaction
   */
  get stakingTransaction(): StakeClauseTransaction {
    return this._transaction as StakeClauseTransaction;
  }

  /**
   * Gets the transaction type for staking.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /**
   * Validates the transaction clauses for staking transaction.
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

      // For staking transactions, value must be greater than 0
      if (!clause.value || clause.value === '0x0' || clause.value === '0') {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the staking contract address for this staking tx.
   * The address must be explicitly provided to ensure the correct contract is used.
   *
   * @param {string} address - The staking contract address (required)
   * @returns {StakingBuilder} This transaction builder
   * @throws {Error} If no address is provided
   */
  stakingContractAddress(address: string): this {
    if (!address) {
      throw new Error('Staking contract address is required');
    }
    this.validateAddress({ address });
    this.stakingTransaction.stakingContractAddress = address;
    return this;
  }

  /**
   * Sets the level ID for this staking tx.
   *
   * @param {number} levelId - The level ID for staking
   * @returns {StakingBuilder} This transaction builder
   */
  levelId(levelId: number): this {
    this.stakingTransaction.levelId = levelId;
    return this;
  }

  /**
   * Sets the amount to stake for this staking tx (VET amount being sent).
   *
   * @param {string} amount - The amount to stake in wei
   * @returns {StakingBuilder} This transaction builder
   */
  amountToStake(amount: string): this {
    this.stakingTransaction.amountToStake = amount;
    return this;
  }

  /**
   * Sets the transaction data for this staking tx.
   *
   * @param {string} data - The transaction data
   * @returns {StakingBuilder} This transaction builder
   */
  transactionData(data: string): this {
    this.stakingTransaction.transactionData = data;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: StakeClauseTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.amountToStake, 'Amount to stake is required');

    // Validate amount is a valid number string
    if (transaction.amountToStake) {
      try {
        const bn = new (require('bignumber.js'))(transaction.amountToStake);
        if (!bn.isFinite() || bn.isNaN()) {
          throw new Error('Invalid character');
        }
      } catch (e) {
        throw new Error('Invalid character');
      }
    }

    assert(transaction.levelId, 'Level ID is required');
    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.stakingTransaction.build();
    return this.transaction;
  }
}
