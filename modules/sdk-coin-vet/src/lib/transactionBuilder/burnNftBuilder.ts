import assert from 'assert';
import { TransactionClause } from '@vechain/sdk-core';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { TransactionBuilder } from './transactionBuilder';
import { BurnNftTransaction } from '../transaction/burnNftTransaction';
import { Transaction } from '../transaction/transaction';
import utils from '../utils';
import { BURN_NFT_METHOD_ID } from '../constants';

export class BurnNftBuilder extends TransactionBuilder {
  /**
   * Creates a new BurnNftBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new BurnNftTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing BurnNftTransaction.
   *
   * @param {BurnNftTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: BurnNftTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the burn NFT transaction instance.
   *
   * @returns {BurnNftTransaction} The burn NFT transaction
   */
  get burnNftTransaction(): BurnNftTransaction {
    return this._transaction as BurnNftTransaction;
  }

  /**
   * Gets the transaction type for burning NFT.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /**
   * Validates the transaction clauses for burning NFT.
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

      // For burn NFT transactions, value must be exactly '0x0'
      if (clause.value !== 0) {
        return false;
      }

      // Check if the data starts with the burn method ID
      if (!clause.data.startsWith(BURN_NFT_METHOD_ID)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the token ID for this burn NFT transaction.
   *
   * @param {string} tokenId - The ID of the NFT token to burn
   * @returns {BurnNftBuilder} This transaction builder
   */
  tokenId(tokenId: string): this {
    this.burnNftTransaction.tokenId = tokenId;
    return this;
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
    this.burnNftTransaction.stakingContractAddress = address;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: BurnNftTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.tokenId, 'Token ID is required');

    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.burnNftTransaction.build();
    return this.transaction;
  }
}
