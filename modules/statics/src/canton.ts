import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { BaseNetwork } from './networks';

export interface CantonConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: BaseNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

export class Canton extends BaseCoin {
  public readonly network: BaseNetwork;

  constructor(options: CantonConstructorOptions) {
    super({
      ...options,
      kind: CoinKind.CRYPTO,
      isToken: false,
      decimalPlaces: 10,
      baseUnit: BaseUnit.CANTON,
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
 * Factory function for canton coin instances
 *
 * @param {String} id unique identifier (uuid v4)
 * @param {String} name unique identifier of the coin
 * @param {String} fullName complete human-readable name of the coin
 * @param {BaseNetwork} network network object for this coin
 * @param {UnderlyingAsset} asset asset which this coin represents. This is the same for both mainNet and testNet variants of a coin.
 * @param {string} prefix optional coin prefix. Defaults to empty string
 * @param {string} suffix optional coin suffix. Defaults to coin name.
 * @param {CoinFeature[]} features features of this coin. Defaults to the CANTON_DEFAULT_FEATURES defined in `account`
 * @param {KeyCurve} primaryKeyCurve the elliptic curve for this chain/token
 */
export function canton(
  id: string,
  name: string,
  fullName: string,
  network: BaseNetwork,
  asset: UnderlyingAsset,
  features: CoinFeature[],
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519,
  prefix = '',
  suffix: string = name.toUpperCase()
): Readonly<Canton> {
  return Object.freeze(
    new Canton({
      id,
      name,
      fullName,
      network,
      features,
      asset,
      prefix,
      suffix,
      primaryKeyCurve,
    })
  );
}
