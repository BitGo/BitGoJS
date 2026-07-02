import assert from 'assert';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType, BuildTransactionError } from '@bitgo/sdk-core';
import { flushCoinsData, flushCoinsMethodId } from '@bitgo/abstract-eth';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from '../transaction/transaction';
import { FlushCoinsTransaction } from '../transaction/flushCoinsTransaction';
import utils from '../utils';

export class FlushCoinsTransactionBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new FlushCoinsTransaction(_coinConfig);
  }

  initBuilder(tx: FlushCoinsTransaction): void {
    this._transaction = tx;
  }

  get flushCoinsTransaction(): FlushCoinsTransaction {
    return this._transaction as FlushCoinsTransaction;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.FlushCoins;
  }

  /**
   * Validates the transaction clauses for a flush coins transaction.
   * The clause must call the parameterless `flush()` method (selector 0x6b9f96ea)
   * on a valid forwarder address with zero value.
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

      if (clause.value !== 0) {
        return false;
      }

      if (!clause.data.startsWith(flushCoinsMethodId)) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: FlushCoinsTransaction): void {
    if (!transaction) {
      throw new BuildTransactionError('transaction not defined');
    }
    assert(transaction.contract, 'Contract address is required');
    this.validateAddress({ address: transaction.contract });
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.type = this.transactionType;
    this.flushCoinsTransaction.transactionData = flushCoinsData();
    await this.flushCoinsTransaction.build();
    return this.transaction;
  }
}
