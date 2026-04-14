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

/**
 * Kaspa (KAS) coin statics.
 *
 * UTXO-based BlockDAG chain using Schnorr signatures over secp256k1.
 */
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
      decimalPlaces: 8, // 1 KAS = 10^8 sompi
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
 * @param id            uuid v4
 * @param name          unique identifier of the coin (e.g. 'kaspa', 'tkaspa')
 * @param fullName      Complete human-readable name (e.g. 'Kaspa', 'Kaspa Testnet')
 * @param network       Network object (KaspaMainnet or KaspaTestnet)
 * @param asset         Underlying asset (UnderlyingAsset.KAS)
 * @param features      CoinFeature array; defaults to KASCoin.DEFAULT_FEATURES
 * @param prefix        Optional prefix (empty string)
 * @param suffix        Optional suffix (defaults to upper-case coin name)
 * @param primaryKeyCurve Key curve (Secp256k1 for Kaspa)
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
