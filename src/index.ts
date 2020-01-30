import { coins } from '@bitgo/statics';
import { BuildTransactionError } from './coin/baseCoin/errors';

import * as crypto from './utils/crypto'
export { crypto };
// coins
import * as BaseCoin from './coin/baseCoin';
export { BaseCoin };

import * as Trx from './coin/trx';
export { Trx };

import * as Xtz from './coin/xtz';
import {BaseTransactionBuilder} from "./coin/baseCoin";
export { Xtz };

export const supportedCoins = {
  trx: new Trx.TransactionBuilder(coins.get('trx')),
  ttrx: new Trx.TransactionBuilder(coins.get('ttrx')),
};

/**
 * Get a transaction builder for the given coin.
 *
 * @param coinName One of the {@code supportedCoins}
 * @return An instance of a {@code TransactionBuilder}
 */
export function getBuilder(coinName: string): BaseTransactionBuilder {
  const coin = coinName.toLowerCase().trim();
  const builder = supportedCoins[coin];
  if (builder) {
    return builder;
  }
  throw new BuildTransactionError(`Coin ${coinName} not supported`);
}
