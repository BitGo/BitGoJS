import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { WithdrawStakeTransaction } from '../transaction/withdrawStakeTransaction';
import utils from '../utils';

export class WithdrawStakeBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new WithdrawStakeTransaction(_coinConfig);
  }

  initBuilder(tx: WithdrawStakeTransaction): void {
    this._transaction = tx;
  }

  get withdrawStakeTransaction(): WithdrawStakeTransaction {
    return this._transaction as WithdrawStakeTransaction;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingPledge;
  }

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

  stakingContractAddress(address: string): this {
    if (!address) {
      throw new Error('Staking contract address is required');
    }
    this.validateAddress({ address });
    this.withdrawStakeTransaction.stakingContractAddress = address;
    return this;
  }

  validator(address: string): this {
    if (!address) {
      throw new Error('Validator address is required');
    }
    this.validateAddress({ address });
    this.withdrawStakeTransaction.validator = address;
    return this;
  }

  transactionData(data: string): this {
    this.withdrawStakeTransaction.transactionData = data;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: WithdrawStakeTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.validator, 'Validator address is required');

    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.withdrawStakeTransaction.build();
    return this.transaction;
  }
}
