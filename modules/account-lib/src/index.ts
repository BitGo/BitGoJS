import { coins, BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  acountLibCrypto,
  accountLibBaseCoin,
  BaseBuilder,
  BaseTransactionBuilderFactory,
  BuildTransactionError,
  Ed25519BIP32,
  Ed25519KeyDeriver,
  Eddsa,
} from '@bitgo/sdk-core';
export { Eddsa, Ed25519BIP32 };

/**
 * Deprecated after version 2.19.0
 * Retained for short term backwards compatibility - migrate to: @bitgo/sdk-api and @bitgo/sdk-core
 */
export const crypto = acountLibCrypto;

export { Ed25519KeyDeriver };

/**
 * Deprecated after version 2.19.0
 * Retained for short term backwards compatibility - migrate to: @bitgo/sdk-api and @bitgo/sdk-core
 */
export const BaseCoin = accountLibBaseCoin;

// coins
import * as Trx from '@bitgo/sdk-coin-trx';
export { Trx };

import { XtzLib as Xtz } from '@bitgo/sdk-coin-xtz';
export { Xtz };

import * as Eth from '@bitgo/sdk-coin-eth';
export { Eth };

import * as Eth2 from './coin/eth2';
export { Eth2 };

import * as Etc from '@bitgo/sdk-coin-etc';
export { Etc };

import * as AvaxC from '@bitgo/sdk-coin-avaxc';
export { AvaxC };

import * as Rbtc from '@bitgo/sdk-coin-rbtc';
export { Rbtc };

import * as Celo from '@bitgo/sdk-coin-celo';
export { Celo };

import * as Hbar from './coin/hbar';
export { Hbar };

import { CsprLib as Cspr } from '@bitgo/sdk-coin-cspr';
export { Cspr };

import * as Xrp from './coin/xrp';
export { Xrp };

import { StxLib as Stx } from '@bitgo/sdk-coin-stx';
export { Stx };

import { AlgoLib as Algo } from '@bitgo/sdk-coin-algo';
export { Algo };

import { AvaxpLib as AvaxP } from '@bitgo/sdk-coin-avaxp';
export { AvaxP };

import * as Sol from '@bitgo/sdk-coin-sol';
export { Sol };

import * as Dot from '@bitgo/sdk-coin-dot';
export { Dot };

import * as Near from '@bitgo/sdk-coin-near';
export { Near };

import * as Polygon from './coin/polygon';
export { Polygon };

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
  avaxp: AvaxP.TransactionBuilderFactory,
  tavaxp: AvaxP.TransactionBuilderFactory,
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
  polygon: Polygon.TransactionBuilder,
  tpolygon: Polygon.TransactionBuilder,
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
