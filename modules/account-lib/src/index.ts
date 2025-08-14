import {
  BaseBuilder,
  BaseTransactionBuilderFactory,
  BuildTransactionError,
  Ed25519KeyDeriver,
  Ed25519BIP32,
  Eddsa,
  accountLibBaseCoin,
  acountLibCrypto,
  BaseMessageBuilderFactory,
  BuildMessageError,
  MessageStandardType,
  MIDNIGHT_TNC_HASH,
} from '@bitgo/sdk-core';
export { MIDNIGHT_TNC_HASH };

import { BaseCoin as CoinConfig, CoinFeature, coins } from '@bitgo/statics';
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

import * as Rune from '@bitgo/sdk-coin-rune';
export { Rune };

import * as Baby from '@bitgo/sdk-coin-baby';
export { Baby };

import * as Mon from '@bitgo/sdk-coin-mon';
export { Mon };

import * as Mantra from '@bitgo/sdk-coin-mantra';
export { Mantra };

import * as Cronos from '@bitgo/sdk-coin-cronos';
export { Cronos };

import * as Initia from '@bitgo/sdk-coin-initia';
export { Initia };

import * as Asi from '@bitgo/sdk-coin-asi';
export { Asi };

import * as Sol from '@bitgo/sdk-coin-sol';
export { Sol };

import * as Ada from '@bitgo/sdk-coin-ada';
export { Ada };

import * as Dot from '@bitgo/sdk-coin-dot';
export { Dot };

import * as Near from '@bitgo/sdk-coin-near';
export { Near };

import * as Bsc from '@bitgo/sdk-coin-bsc';
export { Bsc };

import * as Polygon from '@bitgo/sdk-coin-polygon';
export { Polygon };

import * as Polyx from '@bitgo/sdk-coin-polyx';
export { Polyx };

import * as Opeth from '@bitgo/sdk-coin-opeth';
export { Opeth };

import * as Sui from '@bitgo/sdk-coin-sui';
export { Sui };

import * as Ton from '@bitgo/sdk-coin-ton';
export { Ton };

import * as XRP from '@bitgo/sdk-coin-xrp';
export { XRP };

import * as zkEth from '@bitgo/sdk-coin-zketh';
export { zkEth };

import * as Oas from '@bitgo/sdk-coin-oas';
export { Oas };

import * as Coredao from '@bitgo/sdk-coin-coredao';
export { Coredao };

import * as Apt from '@bitgo/sdk-coin-apt';
export { Apt };

import * as Apechain from '@bitgo/sdk-coin-apechain';
export { Apechain };

import * as Tao from '@bitgo/sdk-coin-tao';
export { Tao };

import * as Icp from '@bitgo/sdk-coin-icp';
export { Icp };

import * as Flr from '@bitgo/sdk-coin-flr';
export { Flr };

import * as EvmCoin from '@bitgo/sdk-coin-evm';
export { EvmCoin };

import * as Sgb from '@bitgo/sdk-coin-sgb';
export { Sgb };

import * as Xdc from '@bitgo/sdk-coin-xdc';
export { Xdc };

import * as Wemix from '@bitgo/sdk-coin-wemix';
export { Wemix };

import * as World from '@bitgo/sdk-coin-world';
export { World };

import * as Stt from '@bitgo/sdk-coin-stt';
export { Stt };

import * as Soneium from '@bitgo/sdk-coin-soneium';
export { Soneium };

import * as Vet from '@bitgo/sdk-coin-vet';
export { Vet };

import * as CosmosSharedCoin from '@bitgo/sdk-coin-cosmos';
export { CosmosSharedCoin };

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
  tcelo: Celo.TestnetTransactionBuilder,
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
  rune: Rune.TransactionBuilderFactory,
  trune: Rune.TransactionBuilderFactory,
  oas: Oas.TransactionBuilder,
  toas: Oas.TransactionBuilder,
  coredao: Coredao.TransactionBuilder,
  tcoredao: Coredao.TransactionBuilder,
  apechain: Apechain.TransactionBuilder,
  tapechain: Apechain.TransactionBuilder,
  apt: Apt.TransactionBuilder,
  tapt: Apt.TransactionBuilder,
  tao: Tao.TransactionBuilderFactory,
  ttao: Tao.TransactionBuilderFactory,
  icp: Icp.TransactionBuilder,
  ticp: Icp.TransactionBuilder,
  baby: Baby.TransactionBuilder,
  tbaby: Baby.TransactionBuilder,
  cronos: Cronos.TransactionBuilder,
  tcronos: Cronos.TransactionBuilder,
  initia: Initia.TransactionBuilder,
  tinitia: Initia.TransactionBuilder,
  asi: Asi.TransactionBuilder,
  tasi: Asi.TransactionBuilder,
  flr: Flr.TransactionBuilder,
  tflr: Flr.TransactionBuilder,
  sgb: Sgb.TransactionBuilder,
  tsgb: Sgb.TransactionBuilder,
  xdc: Xdc.TransactionBuilder,
  txdc: Xdc.TransactionBuilder,
  wemix: Wemix.TransactionBuilder,
  twemix: Wemix.TransactionBuilder,
  mantra: Mantra.TransactionBuilder,
  tmantra: Mantra.TransactionBuilder,
  mon: Mon.TransactionBuilder,
  tmon: Mon.TransactionBuilder,
  world: World.TransactionBuilder,
  tworld: World.TransactionBuilder,
  stt: Stt.TransactionBuilder,
  tstt: Stt.TransactionBuilder,
  soneium: Soneium.TransactionBuilder,
  tsoneium: Soneium.TransactionBuilder,
  polyx: Polyx.TransactionBuilderFactory,
  tpolyx: Polyx.TransactionBuilderFactory,
  vet: Vet.TransactionBuilderFactory,
  tvet: Vet.TransactionBuilderFactory,
};

const coinMessageBuilderFactoryMap = {
  eth: Eth.MessageBuilderFactory,
  hteth: Eth.MessageBuilderFactory,
  bsc: Bsc.MessageBuilderFactory,
  tbsc: Bsc.MessageBuilderFactory,
  ada: Ada.MessageBuilderFactory,
  tada: Ada.MessageBuilderFactory,
  sol: Sol.MessageBuilderFactory,
  tsol: Sol.MessageBuilderFactory,
};

coins
  .filter((coin) => coin.features.includes(CoinFeature.SHARED_EVM_SDK))
  .forEach((coin) => {
    coinBuilderMap[coin.name] = EvmCoin.TransactionBuilder;
  });

coins
  .filter((coin) => coin.features.includes(CoinFeature.SHARED_COSMOS_SDK))
  .forEach((coin) => {
    coinBuilderMap[coin.name] = CosmosSharedCoin.TransactionBuilder;
  });

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

export function getMessageBuilderFactory(coinName: string): BaseMessageBuilderFactory {
  const messageBuilderFactoryClass = coinMessageBuilderFactoryMap[coinName];
  if (!messageBuilderFactoryClass) {
    throw new BuildMessageError(`Message builder factory for coin ${coinName} not supported`);
  }
  return new messageBuilderFactoryClass(coins.get(coinName));
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

/**
 * Register a new coin instance with its message builder factory constructor.
 *
 * @param {string} coinName coin name as it was registered in @bitgo/statics
 * @param {any} messageBuilderFactory the message builder factory class for that coin
 * @returns {any} the message builder factory instance for the registered coin
 */
export function registerMessageBuilderFactory<T extends BaseMessageBuilderFactory>(
  coinName: string,
  messageBuilderFactory: { new (_coinConfig: Readonly<CoinConfig>): T },
): T {
  const coinConfig = coins.get(coinName);
  const factory = new messageBuilderFactory(coinConfig);
  coinMessageBuilderFactoryMap[coinName] = messageBuilderFactory;
  return factory;
}

/**
 * Verify a message against the given encoded payload.
 *
 * @param {string} coinName - The name of the coin.
 * @param {string} messageRaw - The raw message to verify.
 * @param {string} messageEncoded - The encoded message to verify against.
 * @param {MessageStandardType} messageStandardType - The type of message standard.
 * @param {Record<string, unknown>} [metadata] - Optional metadata for verification.
 * @returns {Promise<boolean>} - Returns true if the verification is successful, false otherwise.
 */
export async function verifyMessage(
  coinName: string,
  messageRaw: string,
  messageEncoded: string,
  messageStandardType: MessageStandardType,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  try {
    const messageBuilderFactory = getMessageBuilderFactory(coinName);
    const messageBuilder = messageBuilderFactory.getMessageBuilder(messageStandardType);
    if (!messageBuilder || !messageBuilder.isMessageWhitelisted(messageRaw)) {
      return false;
    }
    messageBuilder.setPayload(messageRaw);
    const message = await messageBuilder.build();
    return await message.verifyEncodedPayload(messageEncoded, metadata);
  } catch (e) {
    return false;
  }
}
