import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';
import BigNumber from 'bignumber.js';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { IncreaseStakeTransaction } from '../transaction/increaseStakeTransaction';
import utils from '../utils';

export class IncreaseStakeBuilder extends TransactionBuilder {
  /**
   * Creates a new increase stake txn instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new IncreaseStakeTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing increase stake txn.
   *
   * @param {IncreaseStakeTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: IncreaseStakeTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the increase stake transaction instance.
   *
   * @returns {IncreaseStakeTransaction} The increase stake transaction
   */
  get increaseStakeTransaction(): IncreaseStakeTransaction {
    return this._transaction as IncreaseStakeTransaction;
  }

  /**
   * Gets the transaction type for increase stake.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingAdd;
  }

  /**
   * Validates the transaction clauses for increase stake transaction.
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
   * Sets the staking contract address for this increase stake tx.
   * The address must be explicitly provided to ensure the correct contract is used.
   *
   * @param {string} address - The contract address (required)
   * @returns {IncreaseStakeBuilder} This transaction builder
   * @throws {Error} If no address is provided
   */
  stakingContractAddress(address: string): this {
    if (!address) {
      throw new Error('Staking contract address is required');
    }
    this.validateAddress({ address });
    this.increaseStakeTransaction.stakingContractAddress = address;
    return this;
  }

  /**
   * Sets the amount to stake for this increase stake tx (VET amount being sent).
   *
   * @param {string} amount - The amount to stake in wei
   * @returns {IncreaseStakeBuilder} This transaction builder
   */
  amountToStake(amount: string): this {
    this.increaseStakeTransaction.amountToStake = amount;
    return this;
  }

  /**
   * Sets the validator address for this increase stake tx.
   * @param {string} address - The validator address
   * @returns {IncreaseStakeBuilder} This transaction builder
   */
  validator(address: string): this {
    if (!address) {
      throw new Error('Validator address is required');
    }
    this.validateAddress({ address });
    this.increaseStakeTransaction.validator = address;
    return this;
  }

  /**
   * Sets the transaction data for this increase stake tx.
   *
   * @param {string} data - The transaction data
   * @returns {IncreaseStakeBuilder} This transaction builder
   */
  transactionData(data: string): this {
    this.increaseStakeTransaction.transactionData = data;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: IncreaseStakeTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.validator, 'Validator address is required');
    assert(transaction.amountToStake, 'Staking amount is required');

    // Validate staking amount is greater than 0
    const amount = new BigNumber(transaction.amountToStake);
    if (amount.isLessThanOrEqualTo(0)) {
      throw new Error('Staking amount must be greater than 0');
    }

    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.increaseStakeTransaction.build();
    return this.transaction;
  }
}
