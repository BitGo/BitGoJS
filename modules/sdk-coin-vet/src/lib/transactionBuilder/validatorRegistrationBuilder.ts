import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';
import BigNumber from 'bignumber.js';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { ValidatorRegistrationTransaction } from '../transaction/validatorRegistrationTransaction';
import utils from '../utils';

export class ValidatorRegistrationBuilder extends TransactionBuilder {
  /**
   * Creates a new add validation Clause txn instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new ValidatorRegistrationTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing validation registration txn.
   *
   * @param {ValidatorRegistrationTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: ValidatorRegistrationTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the staking transaction instance.
   *
   * @returns {ValidatorRegistrationTransaction} The validator registration transaction
   */
  get validatorRegistrationTransaction(): ValidatorRegistrationTransaction {
    return this._transaction as ValidatorRegistrationTransaction;
  }

  /**
   * Gets the transaction type for validator registration.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingLock;
  }

  /**
   * Validates the transaction clauses for validator registration transaction.
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
   * Sets the staking contract address for this validator registration tx.
   * The address must be explicitly provided to ensure the correct contract is used.
   *
   * @param {string} address - The contract address (required)
   * @returns {ValidatorRegistrationBuilder} This transaction builder
   * @throws {Error} If no address is provided
   */
  stakingContractAddress(address: string): this {
    if (!address) {
      throw new Error('Staking contract address is required');
    }
    this.validateAddress({ address });
    this.validatorRegistrationTransaction.stakingContractAddress = address;
    return this;
  }

  /**
   * Sets the staking period for this validator registration tx.
   *
   * @param {number} period - The staking period
   * @returns {ValidatorRegistrationBuilder} This transaction builder
   */
  stakingPeriod(period: number): this {
    this.validatorRegistrationTransaction.stakingPeriod = period;
    return this;
  }

  /**
   * Sets the amount to stake for this validator registration tx (VET amount being sent).
   *
   * @param {string} amount - The amount to stake in wei
   * @returns {ValidatorRegistrationBuilder} This transaction builder
   */
  amountToStake(amount: string): this {
    this.validatorRegistrationTransaction.amountToStake = amount;
    return this;
  }

  /**
   * Sets the validator address for this validator registration tx.
   * @param {string} address - The validator address
   * @returns {ValidatorRegistrationBuilder} This transaction builder
   */
  validator(address: string): this {
    if (!address) {
      throw new Error('Validator address is required');
    }
    this.validateAddress({ address });
    this.validatorRegistrationTransaction.validator = address;
    return this;
  }

  /**
   * Sets the transaction data for this validator registration tx.
   *
   * @param {string} data - The transaction data
   * @returns {ValidatorRegistrationBuilder} This transaction builder
   */
  transactionData(data: string): this {
    this.validatorRegistrationTransaction.transactionData = data;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: ValidatorRegistrationTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.stakingPeriod, 'Staking period is required');
    assert(transaction.validator, 'Validator address is required');
    assert(transaction.amountToStake, 'Staking amount is required');

    // Validate staking amount is within allowed range
    const amountInVET = new BigNumber(transaction.amountToStake).dividedBy(new BigNumber(10).pow(18));
    if (amountInVET.isLessThan(25_000_000) || amountInVET.isGreaterThan(600_000_000)) {
      throw new Error('Staking amount must be between 25M and 600M VET');
    }

    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.validatorRegistrationTransaction.build();
    return this.transaction;
  }
}
