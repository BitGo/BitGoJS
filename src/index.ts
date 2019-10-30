// coins
import * as Trx from './coin/trx';
export { Trx };

import * as BaseCoin from './coin/baseCoin';
export { BaseCoin };

import {coins} from "@bitgo/statics";
import {BuildTransactionError} from "./coin/baseCoin/errors";
import {TransactionBuilder} from "./coin/trx/transactionBuilder";

export function getBuilder(coinName: string) {
  switch (coinName.toLowerCase().trim()) {
    case 'ttrx':
      return new TransactionBuilder(coins.get('ttrx'));
    case 'trx':
      return new TransactionBuilder(coins.get('trx'));
    default:
      throw new BuildTransactionError(`Coin ${coinName} not supported`);
  }
}
