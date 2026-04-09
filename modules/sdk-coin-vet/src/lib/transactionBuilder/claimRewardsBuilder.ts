import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionClause } from '@vechain/sdk-core';
import assert from 'assert';

import { TransactionBuilder } from './transactionBuilder';
import { ClaimRewardsTransaction } from '../transaction/claimRewards';
import { Transaction } from '../transaction/transaction';
import { CLAIM_STAKING_REWARDS_METHOD_ID } from '../constants';
import utils from '../utils';

export class ClaimRewardsBuilder extends TransactionBuilder {
  /**
   * Creates a new ClaimRewardsBuilder instance.
   *
   * @param {Readonly<CoinConfig>} _coinConfig - The coin configuration object
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new ClaimRewardsTransaction(_coinConfig);
  }

  /**
   * Initializes the builder with an existing ClaimRewardsTransaction.
   *
   * @param {ClaimRewardsTransaction} tx - The transaction to initialize the builder with
   */
  initBuilder(tx: ClaimRewardsTransaction): void {
    this._transaction = tx;
  }

  /**
   * Gets the claim rewards transaction instance.
   *
   * @returns {ClaimRewardsTransaction} The claim rewards transaction
   */
  get claimRewardsTransaction(): ClaimRewardsTransaction {
    return this._transaction as ClaimRewardsTransaction;
  }

  /**
   * Gets the transaction type for claim rewards.
   *
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingClaim;
  }

  /**
   * Sets the staking contract address for this claim tx.
   * The address must be explicitly provided to ensure the correct contract is used.
   *
   * @param {string} address - The staking contract address (required)
   * @returns {ClaimRewardsBuilder} This transaction builder
   * @throws {Error} If no address is provided
   */
  stakingContractAddress(address: string): this {
    if (!address) {
      throw new Error('Staking contract address is required');
    }
    this.validateAddress({ address });
    this.claimRewardsTransaction.stakingContractAddress = address;
    return this;
  }

  /**
   * Sets the token ID for this claim tx.
   *
   * @param {number} levelId - The NFT token ID
   * @returns {DelegateTxnBuilder} This transaction builder
   */
  tokenId(tokenId: string): this {
    this.claimRewardsTransaction.tokenId = tokenId;
    return this;
  }

  /**
   * Validates the transaction clauses for claim rewards transaction.
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

      // Ensure value is '0x0', '0', or 0
      if (!['0x0', '0', 0].includes(clause.value)) {
        return false;
      }

      if (clause.data && clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: ClaimRewardsTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }

    assert(transaction.tokenId, 'Token ID is required');
    assert(transaction.stakingContractAddress, 'Staking contract address is required');

    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.claimRewardsTransaction.build();
    return this.transaction;
  }
}
