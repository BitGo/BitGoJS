import { BaseCoin, CoinFeature, CoinKind, UnderlyingAsset } from './base';
import { BaseNetwork, Networks, OfcNetwork } from './networks';

export interface OfcConstructorOptions {
  fullName: string;
  name: string;
  network: BaseNetwork;
  asset: UnderlyingAsset;
  features: CoinFeature[];
  decimalPlaces: number;
  isToken: boolean;
  kind: CoinKind;
  prefix?: string;
  suffix?: string;
}

/**
 * OFC (off chain) coins. These are virtual coins used to represent off chain assets on the BitGo platform.
 */
export class OfcCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [CoinFeature.ACCOUNT_MODEL, CoinFeature.REQUIRES_BIG_NUMBER];

  constructor(options: OfcConstructorOptions) {
    super({
      kind: options.kind,
      family: options.network.family,
      decimalPlaces: options.decimalPlaces,
      asset: options.asset,
      prefix: '',
      suffix: options.name,
      ...options,
    });
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>([CoinFeature.ACCOUNT_MODEL, CoinFeature.REQUIRES_BIG_NUMBER]);
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>([
      CoinFeature.UNSPENT_MODEL,
      CoinFeature.CHILD_PAYS_FOR_PARENT,
      CoinFeature.NATIVE_SEGWIT,
      CoinFeature.PAYGO,
      CoinFeature.WRAPPED_SEGWIT,
      CoinFeature.SUPPORTS_TOKENS,
    ]);
  }
}

/**
 * Factory function for ofc coin instances.
 *
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param decimalPlaces Number of decimal places this coin supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param kind Differentiates coins which represent fiat assets from those which represent crypto assets
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param isToken? Whether or not this account coin is a token of another coin
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `OfcCoin`
 */
export function ofc(
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  kind: CoinKind,
  prefix?: string,
  suffix?: string,
  network: OfcNetwork = Networks.main.ofc,
  features: CoinFeature[] = OfcCoin.DEFAULT_FEATURES,
  isToken: boolean = true
) {
  return Object.freeze(
    new OfcCoin({
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      decimalPlaces,
      isToken,
      asset,
      kind,
    })
  );
}

/**
 * Factory function for testnet ofc coin instances.
 *
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param decimalPlaces Number of decimal places this coin supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param kind Differentiates coins which represent fiat assets from those which represent crypto assets
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param isToken? Whether or not this account coin is a token of another coin
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `OfcCoin`
 */
export function tofc(
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  kind: CoinKind,
  prefix?: string,
  suffix?: string,
  network: OfcNetwork = Networks.test.ofc,
  features: CoinFeature[] = OfcCoin.DEFAULT_FEATURES,
  isToken: boolean = true
) {
  return Object.freeze(
    new OfcCoin({
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      decimalPlaces,
      isToken,
      asset,
      kind,
    })
  );
}
