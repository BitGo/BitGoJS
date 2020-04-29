import { coins } from '@bitgo/statics';
import { BuildTransactionError } from './coin/baseCoin/errors';
import { BaseTransactionBuilder } from './coin/baseCoin';

import * as crypto from './utils/crypto';
export { crypto };
// coins
import * as BaseCoin from './coin/baseCoin';
export { BaseCoin };

import * as Trx from './coin/trx';
export { Trx };

import * as Xtz from './coin/xtz';
export { Xtz };

import * as Eth from './coin/eth';
export { Eth };

const coinBuilderMap = {
  trx: Trx.TransactionBuilder,
  ttrx: Trx.TransactionBuilder,
  xtz: Xtz.TransactionBuilder,
  txtz: Xtz.TransactionBuilder,
  eth: Eth.TransactionBuilder,
  teth: Eth.TransactionBuilder,
};

/**
 * Get the list of coin tickers supported by this library.
 */
export const supportedCoins = Object.keys(coinBuilderMap);

/**
 * Get a transaction builder for the given coin.
 *
 * @param coinName One of the {@code supportedCoins}
 * @returns An instance of a {@code TransactionBuilder}
 */
export function getBuilder(coinName: string): BaseTransactionBuilder {
  const coin = tryMapToEthFamilyCoin(coinName.toLowerCase().trim());
  const builderClass = coinBuilderMap[coin];
  if (!builderClass) {
    throw new BuildTransactionError(`Coin ${coinName} not supported`);
  }

  return new builderClass(coins.get(coin));
}

/**
 * Get a transaction builder for the given coin.
 *
 * @param {string} coin The coin name
 * @returns {string} The same coin or eth if it's compatible
 */
function tryMapToEthFamilyCoin(coin: string): string {
  switch (coin) {
    case 'rsk':
    case 'etc':
      return 'eth';
    default:
      return coin;
  }
}
