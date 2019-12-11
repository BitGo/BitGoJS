import { coins } from '@bitgo/statics';
import { BuildTransactionError } from './coin/baseCoin/errors';

import * as crypto from './utils/crypto'
export { crypto };
// coins
import * as BaseCoin from './coin/baseCoin';
export { BaseCoin };

import * as Trx from './coin/trx';
export { Trx };

// TODO: verify these with the coins available in the statics lib
export const supportedCoins = ['trx', 'ttrx'];

/**
 * Get a transaction builder for the given coin.
 *
 * @param coinName One of the {@code supportedCoins}
 * @return An instance of a {@code TransactionBuilder}
 */
export function getBuilder(coinName: string) {
  const coin = coinName.toLowerCase().trim();

  if (supportedCoins.includes(coin)) {
    return new Trx.TransactionBuilder(coins.get(coin));
  }
  throw new BuildTransactionError(`Coin ${coinName} not supported`);
}
