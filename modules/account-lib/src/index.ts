import { coins, BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseBuilder, BaseTransactionBuilderFactory, BuildTransactionError, Ed25519KeyDeriver } from '@bitgo/sdk-core';
import Eddsa from './mpc/tss';
import { Ed25519BIP32 } from './mpc/hdTree';
export { Eddsa, Ed25519BIP32 };

export { Ed25519KeyDeriver };

// coins
import * as Trx from './coin/trx';
export { Trx };

import * as Xtz from './coin/xtz';
export { Xtz };

import * as Eth from './coin/eth';
export { Eth };

import * as Eth2 from './coin/eth2';
export { Eth2 };

import * as Etc from './coin/etc';
export { Etc };

import * as AvaxC from './coin/avaxc';
export { AvaxC };

import * as Rbtc from './coin/rbtc';
export { Rbtc };

import * as Celo from './coin/celo';
export { Celo };

import * as Hbar from './coin/hbar';
export { Hbar };

import * as Cspr from './coin/cspr';
export { Cspr };

import * as Xrp from './coin/xrp';
export { Xrp };

import * as Stx from './coin/stx';
export { Stx };

import * as Algo from './coin/algo';
export { Algo };

import * as Sol from './coin/sol';
export { Sol };
import * as Dot from './coin/dot';
export { Dot };

import * as Near from './coin/near';
export { Near };

const coinBuilderMap = {
  trx: Trx.WrappedBuilder,
  ttrx: Trx.WrappedBuilder,
  xtz: Xtz.TransactionBuilder,
  txtz: Xtz.TransactionBuilder,
  etc: Etc.TransactionBuilder,
  tetc: Etc.TransactionBuilder,
  eth: Eth.TransactionBuilder,
  teth: Eth.TransactionBuilder,
  gteth: Eth.TransactionBuilder,
  rbtc: Rbtc.TransactionBuilder,
  trbtc: Rbtc.TransactionBuilder,
  celo: Celo.TransactionBuilder,
  tcelo: Celo.TransactionBuilder,
  avaxc: AvaxC.TransactionBuilder,
  tavaxc: AvaxC.TransactionBuilder,
  hbar: Hbar.TransactionBuilderFactory,
  thbar: Hbar.TransactionBuilderFactory,
  cspr: Cspr.TransactionBuilderFactory,
  tcspr: Cspr.TransactionBuilderFactory,
  xrp: Xrp.TransactionBuilderFactory,
  txrp: Xrp.TransactionBuilderFactory,
  stx: Stx.TransactionBuilderFactory,
  tstx: Stx.TransactionBuilderFactory,
  algo: Algo.TransactionBuilderFactory,
  talgo: Algo.TransactionBuilderFactory,
  sol: Sol.TransactionBuilderFactory,
  tsol: Sol.TransactionBuilderFactory,
  dot: Dot.TransactionBuilderFactory,
  tdot: Dot.TransactionBuilderFactory,
  near: Near.TransactionBuilderFactory,
};

/**
 * Get the list of coin tickers supported by this library.
 */
export const supportedCoins = Object.keys(coinBuilderMap);

/**
 * Get a transaction builder for the given coin.
 *
 * @param {string} coinName One of the {@code supportedCoins}
 * @returns {any} An instance of a {@code TransactionBuilder}
 */
export function getBuilder(coinName: string): BaseBuilder {
  const builderClass = coinBuilderMap[coinName];
  if (!builderClass) {
    throw new BuildTransactionError(`Coin ${coinName} not supported`);
  }

  return new builderClass(coins.get(coinName));
}

/**
 * Register a new coin instance with its builder factory
 *
 * @param {string} coinName coin name as it was registered in @bitgo/statics
 * @param {any} builderFactory the builder factory class for that coin
 * @returns {any} the factory instance for the registered coin
 */
export function register<T extends BaseTransactionBuilderFactory>(
  coinName: string,
  builderFactory: { new (_coinConfig: Readonly<CoinConfig>): T },
): T {
  const coinConfig = coins.get(coinName);
  const factory = new builderFactory(coinConfig);
  // coinBuilderMap[coinName] = factory;
  coinBuilderMap[coinName] = builderFactory; // For now register the constructor function until reimplement getBuilder method
  return factory;
}
