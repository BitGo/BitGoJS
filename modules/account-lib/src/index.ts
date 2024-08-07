import {
  BaseBuilder,
  BaseTransactionBuilderFactory,
  BuildTransactionError,
  Ed25519KeyDeriver,
  Ed25519BIP32,
  Eddsa,
  accountLibBaseCoin,
  acountLibCrypto,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
export { Ed25519BIP32, Eddsa };

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

import * as Eth2 from '@bitgo/sdk-coin-eth2';
export { Eth2 };

import * as Etc from '@bitgo/sdk-coin-etc';
export { Etc };

import * as AvaxC from '@bitgo/sdk-coin-avaxc';
export { AvaxC };

import * as Rbtc from '@bitgo/sdk-coin-rbtc';
export { Rbtc };

import * as Celo from '@bitgo/sdk-coin-celo';
export { Celo };

import * as Hbar from '@bitgo/sdk-coin-hbar';
export { Hbar };

import { CsprLib as Cspr } from '@bitgo/sdk-coin-cspr';
export { Cspr };

import { StxLib as Stx } from '@bitgo/sdk-coin-stx';
export { Stx };

import { AlgoLib as Algo } from '@bitgo/sdk-coin-algo';
export { Algo };

import * as Arbeth from '@bitgo/sdk-coin-arbeth';
export { Arbeth };

import * as Atom from '@bitgo/sdk-coin-atom';
export { Atom };

import * as Osmo from '@bitgo/sdk-coin-osmo';
export { Osmo };

import { AvaxpLib as AvaxP } from '@bitgo/sdk-coin-avaxp';
export { AvaxP };

import * as Tia from '@bitgo/sdk-coin-tia';
export { Tia };

import * as Bera from '@bitgo/sdk-coin-bera';
export { Bera };

import * as Bld from '@bitgo/sdk-coin-bld';
export { Bld };

import * as Hash from '@bitgo/sdk-coin-hash';
export { Hash };

import * as Sei from '@bitgo/sdk-coin-sei';
export { Sei };

import * as Injective from '@bitgo/sdk-coin-injective';
export { Injective };

import * as Islm from '@bitgo/sdk-coin-islm';
export { Islm };

import * as Zeta from '@bitgo/sdk-coin-zeta';
export { Zeta };

import * as Coreum from '@bitgo/sdk-coin-coreum';
export { Coreum };

import * as Sol from '@bitgo/sdk-coin-sol';
export { Sol };

import * as Dot from '@bitgo/sdk-coin-dot';
export { Dot };

import * as Near from '@bitgo/sdk-coin-near';
export { Near };

import * as Bsc from '@bitgo/sdk-coin-bsc';
export { Bsc };

import * as Polygon from '@bitgo/sdk-coin-polygon';
export { Polygon };

import * as Opeth from '@bitgo/sdk-coin-opeth';
export { Opeth };

import * as Sui from '@bitgo/sdk-coin-sui';
export { Sui };

import * as Ton from '@bitgo/sdk-coin-ton';
export { Ton };

import * as zkEth from '@bitgo/sdk-coin-zketh';
export { zkEth };

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
  hteth: Eth.TransactionBuilder,
  rbtc: Rbtc.TransactionBuilder,
  trbtc: Rbtc.TransactionBuilder,
  celo: Celo.TransactionBuilder,
  tcelo: Celo.TransactionBuilder,
  avaxc: AvaxC.TransactionBuilder,
  tavaxc: AvaxC.TransactionBuilder,
  bsc: Bsc.TransactionBuilder,
  tbsc: Bsc.TransactionBuilder,
  avaxp: AvaxP.TransactionBuilderFactory,
  tavaxp: AvaxP.TransactionBuilderFactory,
  hbar: Hbar.TransactionBuilderFactory,
  thbar: Hbar.TransactionBuilderFactory,
  cspr: Cspr.TransactionBuilderFactory,
  tcspr: Cspr.TransactionBuilderFactory,
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
  sui: Sui.TransactionBuilderFactory,
  tsui: Sui.TransactionBuilderFactory,
  tia: Tia.TransactionBuilderFactory,
  ttia: Tia.TransactionBuilderFactory,
  atom: Atom.TransactionBuilderFactory,
  tatom: Atom.TransactionBuilderFactory,
  osmo: Osmo.TransactionBuilderFactory,
  tosmo: Osmo.TransactionBuilderFactory,
  bld: Bld.TransactionBuilderFactory,
  tbld: Bld.TransactionBuilderFactory,
  hash: Hash.TransactionBuilderFactory,
  thash: Hash.TransactionBuilderFactory,
  sei: Sei.TransactionBuilderFactory,
  tsei: Sei.TransactionBuilderFactory,
  injective: Injective.TransactionBuilderFactory,
  tinjective: Injective.TransactionBuilderFactory,
  zeta: Zeta.TransactionBuilderFactory,
  tzeta: Zeta.TransactionBuilderFactory,
  islm: Islm.TransactionBuilderFactory,
  tislm: Islm.TransactionBuilderFactory,
  coreum: Coreum.TransactionBuilderFactory,
  tcoreum: Coreum.TransactionBuilderFactory,
  arbeth: Arbeth.TransactionBuilder,
  tarbeth: Arbeth.TransactionBuilder,
  opeth: Opeth.TransactionBuilder,
  topeth: Opeth.TransactionBuilder,
  ton: Ton.TransactionBuilder,
  tton: Ton.TransactionBuilder,
  zketh: zkEth.TransactionBuilder,
  tzketh: zkEth.TransactionBuilder,
  bera: Bera.TransactionBuilder,
  tbera: Bera.TransactionBuilder,
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
