import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { KaspaNetwork } from './networks';

export interface KASConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: KaspaNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

export class KASCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.UNSPENT_MODEL,
    CoinFeature.TSS,
    CoinFeature.TSS_COLD,
    CoinFeature.CUSTODY,
    CoinFeature.CUSTODY_BITGO_TRUST,
    CoinFeature.CUSTODY_BITGO_INDIA,
    CoinFeature.CUSTODY_BITGO_MENA_FZE,
    CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
    CoinFeature.CUSTODY_BITGO_GERMANY,
    CoinFeature.CUSTODY_BITGO_FRANKFURT,
  ];

  public readonly network: KaspaNetwork;

  constructor(options: KASConstructorOptions) {
    super({
      ...options,
      kind: CoinKind.CRYPTO,
      isToken: false,
      decimalPlaces: 8,
      baseUnit: BaseUnit.KAS,
    });

    this.network = options.network;
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set([CoinFeature.ACCOUNT_MODEL]);
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set([CoinFeature.UNSPENT_MODEL]);
  }
}

/**
 * Factory function for Kaspa coin instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `KASCoin`
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function kas(
  id: string,
  name: string,
  fullName: string,
  network: KaspaNetwork,
  asset: UnderlyingAsset,
  features: CoinFeature[] = KASCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  /** Kaspa uses secp256k1 with Schnorr signatures **/
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new KASCoin({
      id,
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      asset,
      primaryKeyCurve,
    })
  );
}
