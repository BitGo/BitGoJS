import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionClause } from '@vechain/sdk-core';
import assert from 'assert';

import { TransactionBuilder } from './transactionBuilder';
import { ClaimRewardsTransaction } from '../transaction/claimRewards';
import { Transaction } from '../transaction/transaction';
import { ClaimRewardsData } from '../types';
import { CLAIM_BASE_REWARDS_METHOD_ID, CLAIM_STAKING_REWARDS_METHOD_ID } from '../constants';
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
   * Validates the transaction clauses for claim rewards transaction.
   * @param {TransactionClause[]} clauses - The transaction clauses to validate.
   * @returns {boolean} - Returns true if the clauses are valid, false otherwise.
   */
  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    try {
      if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return false;
      }

      let hasValidClaimClause = false;

      for (const clause of clauses) {
        if (!clause.to || !utils.isValidAddress(clause.to)) {
          return false;
        }

        // For claim rewards transactions, value must be '0x0' or 0
        if (clause.value !== '0x0' && clause.value !== 0 && clause.value !== '0') {
          return false;
        }

        const isDelegationContract = utils.isDelegationContractAddress(clause.to);
        const isNftContract = utils.isNftContractAddress(clause.to);

        if (clause.data && (isDelegationContract || isNftContract)) {
          if (
            (clause.data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID) && isNftContract) ||
            (clause.data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID) && isDelegationContract)
          ) {
            hasValidClaimClause = true;
          }
        }
      }

      return hasValidClaimClause;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the claim rewards data for this transaction.
   *
   * @param {ClaimRewardsData} data - The claim rewards data
   * @returns {ClaimRewardsBuilder} This transaction builder
   */
  claimRewardsData(data: ClaimRewardsData): this {
    this.validateClaimRewardsData(data);
    this.claimRewardsTransaction.claimRewardsData = data;
    return this;
  }

  /**
   * Validates the claim rewards data.
   *
   * @param {ClaimRewardsData} data - The claim rewards data to validate
   */
  private validateClaimRewardsData(data: ClaimRewardsData): void {
    if (!data) {
      throw new Error('Claim rewards data is required');
    }

    if (!data.tokenId) {
      throw new Error('Token ID is required');
    }

    // Validate tokenId is a valid number string
    if (!/^\d+$/.test(data.tokenId)) {
      throw new Error('Token ID must be a valid number string');
    }

    if (data.claimBaseRewards !== undefined && typeof data.claimBaseRewards !== 'boolean') {
      throw new Error('claimBaseRewards must be a boolean');
    }

    if (data.claimStakingRewards !== undefined && typeof data.claimStakingRewards !== 'boolean') {
      throw new Error('claimStakingRewards must be a boolean');
    }

    // At least one type of rewards must be claimed (both default to true if undefined)
    const claimBase = data.claimBaseRewards !== false;
    const claimStaking = data.claimStakingRewards !== false;

    if (!claimBase && !claimStaking) {
      throw new Error('At least one type of rewards (base or staking) must be claimed');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: ClaimRewardsTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }

    const claimData = transaction.claimRewardsData;
    assert(claimData, 'Claim rewards data is required');
    assert(claimData.tokenId, 'Token ID is required');

    // Validate tokenId is a valid number string
    if (!/^\d+$/.test(claimData.tokenId)) {
      throw new Error('Token ID must be a valid number string');
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.claimRewardsTransaction.build();
    return this.transaction;
  }
}
