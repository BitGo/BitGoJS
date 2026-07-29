import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionClause } from '@vechain/sdk-core';
import BigNumber from 'bignumber.js';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { DecreaseStakeTransaction } from '../transaction/decreaseStakeTransaction';
import utils from '../utils';

export class DecreaseStakeBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new DecreaseStakeTransaction(_coinConfig);
  }

  initBuilder(tx: DecreaseStakeTransaction): void {
    this._transaction = tx;
  }

  get decreaseStakeTransaction(): DecreaseStakeTransaction {
    return this._transaction as DecreaseStakeTransaction;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
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
    this.decreaseStakeTransaction.stakingContractAddress = address;
    return this;
  }

  amount(value: string): this {
    this.decreaseStakeTransaction.amount = value;
    return this;
  }

  validator(address: string): this {
    if (!address) {
      throw new Error('Validator address is required');
    }
    this.validateAddress({ address });
    this.decreaseStakeTransaction.validator = address;
    return this;
  }

  transactionData(data: string): this {
    this.decreaseStakeTransaction.transactionData = data;
    return this;
  }

  /** @inheritdoc */
  validateTransaction(transaction?: DecreaseStakeTransaction): void {
    if (!transaction) {
      throw new Error('transaction not defined');
    }
    assert(transaction.stakingContractAddress, 'Staking contract address is required');
    assert(transaction.validator, 'Validator address is required');
    assert(transaction.amount, 'Amount is required');

    const amt = new BigNumber(transaction.amount);
    if (amt.isLessThanOrEqualTo(0)) {
      throw new Error('Amount must be greater than 0');
    }

    this.validateAddress({ address: transaction.stakingContractAddress });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    await this.decreaseStakeTransaction.build();
    return this.transaction;
  }
}
