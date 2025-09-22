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
} from '@bitgo-beta/sdk-core';
import { BaseCoin as CoinConfig, CoinFeature, coins } from '@bitgo-beta/statics';
export { Ed25519BIP32, Eddsa };

/**
 * Deprecated after version 2.19.0
 * Retained for short term backwards compatibility - migrate to: @bitgo-beta/sdk-api and @bitgo-beta/sdk-core
 */
export const crypto = acountLibCrypto;

export { Ed25519KeyDeriver };

/**
 * Deprecated after version 2.19.0
 * Retained for short term backwards compatibility - migrate to: @bitgo-beta/sdk-api and @bitgo-beta/sdk-core
 */
export const BaseCoin = accountLibBaseCoin;

// coins
import * as Trx from '@bitgo-beta/sdk-coin-trx';
export { Trx };

import { XtzLib as Xtz } from '@bitgo-beta/sdk-coin-xtz';
export { Xtz };

import * as Eth from '@bitgo-beta/sdk-coin-eth';
export { Eth };

import * as Etc from '@bitgo-beta/sdk-coin-etc';
export { Etc };

import * as AvaxC from '@bitgo-beta/sdk-coin-avaxc';
export { AvaxC };

import * as Rbtc from '@bitgo-beta/sdk-coin-rbtc';
export { Rbtc };

import * as Celo from '@bitgo-beta/sdk-coin-celo';
export { Celo };

import * as Hbar from '@bitgo-beta/sdk-coin-hbar';
export { Hbar };

import { CsprLib as Cspr } from '@bitgo-beta/sdk-coin-cspr';
export { Cspr };

import { StxLib as Stx } from '@bitgo-beta/sdk-coin-stx';
export { Stx };

import { AlgoLib as Algo } from '@bitgo-beta/sdk-coin-algo';
export { Algo };

import * as Arbeth from '@bitgo-beta/sdk-coin-arbeth';
export { Arbeth };

import * as Atom from '@bitgo-beta/sdk-coin-atom';
export { Atom };

import * as Osmo from '@bitgo-beta/sdk-coin-osmo';
export { Osmo };

import { AvaxpLib as AvaxP } from '@bitgo-beta/sdk-coin-avaxp';
export { AvaxP };

import * as Tia from '@bitgo-beta/sdk-coin-tia';
export { Tia };

import * as Bera from '@bitgo-beta/sdk-coin-bera';
export { Bera };

import * as Bld from '@bitgo-beta/sdk-coin-bld';
export { Bld };

import * as Hash from '@bitgo-beta/sdk-coin-hash';
export { Hash };

import * as Sei from '@bitgo-beta/sdk-coin-sei';
export { Sei };

import * as Injective from '@bitgo-beta/sdk-coin-injective';
export { Injective };

import * as Islm from '@bitgo-beta/sdk-coin-islm';
export { Islm };

import * as Zeta from '@bitgo-beta/sdk-coin-zeta';
export { Zeta };

import * as Coreum from '@bitgo-beta/sdk-coin-coreum';
export { Coreum };

import * as Rune from '@bitgo-beta/sdk-coin-rune';
export { Rune };

import * as Baby from '@bitgo-beta/sdk-coin-baby';
export { Baby };

import * as Mon from '@bitgo-beta/sdk-coin-mon';
export { Mon };

import * as Cronos from '@bitgo-beta/sdk-coin-cronos';
export { Cronos };

import * as Initia from '@bitgo-beta/sdk-coin-initia';
export { Initia };

import * as Asi from '@bitgo-beta/sdk-coin-asi';
export { Asi };

import * as Sol from '@bitgo-beta/sdk-coin-sol';
export { Sol };

import * as Ada from '@bitgo-beta/sdk-coin-ada';
export { Ada };

import * as Dot from '@bitgo-beta/sdk-coin-dot';
export { Dot };

import * as Near from '@bitgo-beta/sdk-coin-near';
export { Near };

import * as Bsc from '@bitgo-beta/sdk-coin-bsc';
export { Bsc };

import * as Polygon from '@bitgo-beta/sdk-coin-polygon';
export { Polygon };

import * as Polyx from '@bitgo-beta/sdk-coin-polyx';
export { Polyx };

import * as Opeth from '@bitgo-beta/sdk-coin-opeth';
export { Opeth };

import * as Sui from '@bitgo-beta/sdk-coin-sui';
export { Sui };

import * as Ton from '@bitgo-beta/sdk-coin-ton';
export { Ton };

import * as XRP from '@bitgo-beta/sdk-coin-xrp';
export { XRP };

import * as zkEth from '@bitgo-beta/sdk-coin-zketh';
export { zkEth };

import * as Oas from '@bitgo-beta/sdk-coin-oas';
export { Oas };

import * as Coredao from '@bitgo-beta/sdk-coin-coredao';
export { Coredao };

import * as Apt from '@bitgo-beta/sdk-coin-apt';
export { Apt };

import * as Apechain from '@bitgo-beta/sdk-coin-apechain';
export { Apechain };

import * as Tao from '@bitgo-beta/sdk-coin-tao';
export { Tao };

import * as Icp from '@bitgo-beta/sdk-coin-icp';
export { Icp };

import * as Flr from '@bitgo-beta/sdk-coin-flr';
export { Flr };

import * as EvmCoin from '@bitgo-beta/sdk-coin-evm';
export { EvmCoin };

import * as Sgb from '@bitgo-beta/sdk-coin-sgb';
export { Sgb };

import * as Xdc from '@bitgo-beta/sdk-coin-xdc';
export { Xdc };

import * as Wemix from '@bitgo-beta/sdk-coin-wemix';
export { Wemix };

import * as World from '@bitgo-beta/sdk-coin-world';
export { World };

import * as Stt from '@bitgo-beta/sdk-coin-stt';
export { Stt };

import * as Soneium from '@bitgo-beta/sdk-coin-soneium';
export { Soneium };

import * as Vet from '@bitgo-beta/sdk-coin-vet';
export { Vet };

import * as CosmosSharedCoin from '@bitgo-beta/sdk-coin-cosmos';
export { CosmosSharedCoin };

import { validateAgainstMessageTemplates, MIDNIGHT_TNC_HASH } from './utils';
export { MIDNIGHT_TNC_HASH };

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
  mon: Mon.TransactionBuilder,
  tmon: Mon.TransactionBuilder,
  world: World.TransactionBuilder,
  tworld: World.TransactionBuilder,
  soneium: Soneium.TransactionBuilder,
  tsoneium: Soneium.TransactionBuilder,
  tstt: Stt.TransactionBuilder,
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
 * @param {string} coinName coin name as it was registered in @bitgo-beta/statics
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
 * @param {string} coinName coin name as it was registered in @bitgo-beta/statics
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
    messageBuilder.setPayload(messageRaw);
    const message = await messageBuilder.build();
    const isValidMessageEncoded = await message.verifyEncodedPayload(messageEncoded, metadata);
    if (!isValidMessageEncoded) {
      return false;
    }
    return validateAgainstMessageTemplates(messageRaw);
  } catch (e) {
    console.error(`Error verifying message for coin ${coinName}:`, e);
    return false;
  }
}
