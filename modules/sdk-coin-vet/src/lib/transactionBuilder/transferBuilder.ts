import BigNumber from 'bignumber.js';
import { TransactionClause } from '@vechain/sdk-core';

import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import utils from '../utils';
import { Transaction } from '../transaction/transaction';

export class TransferBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  protected isValidTransactionClauses(clauses: TransactionClause[]): boolean {
    try {
      if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
        return false;
      }

      return clauses.every((clause) => {
        if (!clause.to || !utils.isValidAddress(clause.to)) {
          return false;
        }

        if (!clause.value || new BigNumber(clause.value).isLessThanOrEqualTo(0)) {
          return false;
        }

        // For native VET transfers, data must be exactly '0x'
        if (clause.data !== '0x') {
          return false;
        }

        return true;
      });
    } catch (e) {
      return false;
    }
  }
}
