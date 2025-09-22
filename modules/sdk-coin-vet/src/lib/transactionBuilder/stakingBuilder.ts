import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { TransactionType } from '@bitgo-beta/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { StakingTransaction } from '../transaction/stakingTransaction';
import EthereumAbi from 'ethereumjs-abi';
import utils from '../utils';

export class StakingBuilder extends TransactionBuilder {
  /**
   * Creates a new StakingBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new StakingTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing StakingTransaction.
   *
   * @param {StakingTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: StakingTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the staking transaction instance.
   *
   * @returns {StakingTransaction} The staking transaction
   */
  get stakingTransaction(): StakingTransaction {
    return this._transaction as StakingTransaction;
  }

  /**
   * Gets the transaction type for staking.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.ContractCall;
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
   *
   * @param {string} address - The staking contract address
   * @returns {StakingBuilder} This transaction builder
   */
  stakingContractAddress(address: string): this {
    this.validateAddress({ address });
    this.stakingTransaction.stakingContractAddress = address;
    return this;
  }

  /**
   * Sets the amount to stake for this staking tx.
   *
   * @param {string} amount - The amount to stake in wei
   * @returns {StakingBuilder} This transaction builder
   */
  amountToStake(amount: string): this {
    this.stakingTransaction.amountToStake = amount;
    return this;
  }

  /**
   * Sets the staking contract ABI for this staking tx.
   *
   * @param {EthereumAbi} abi - The staking contract ABI
   * @returns {StakingBuilder} This transaction builder
   */
  stakingContractABI(abi: EthereumAbi): this {
    this.stakingTransaction.stakingContractABI = abi;
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
  validateTransaction(transaction?: StakingTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.amountToStake, 'Amount to stake is required');
    assert(transaction.stakingContractABI, 'Staking contract ABI is required');
    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.stakingTransaction.build();
    return this.transaction;
  }
}
