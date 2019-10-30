// coins
import * as BaseCoin from './coin/baseCoin';
export { BaseCoin };

import * as Trx from './coin/trx';
export { Trx };

import { coins } from "@bitgo/statics";
import { BuildTransactionError } from "./coin/baseCoin/errors";

export function getBuilder(coinName: string) {
  switch (coinName.toLowerCase().trim()) {
    case 'ttrx':
      return new Trx.TransactionBuilder(coins.get('ttrx'));
    case 'trx':
      return new Trx.TransactionBuilder(coins.get('trx'));
    default:
      throw new BuildTransactionError(`Coin ${coinName} not supported`);
  }
}
