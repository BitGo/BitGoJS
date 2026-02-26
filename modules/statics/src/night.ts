import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { NightNetwork } from './networks';

export interface NightConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: NightNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

/**
 * Midnight Network - Privacy-first blockchain using zero-knowledge proofs
 *
 * Night is a UTXO-based chain similar to Cardano, using Ed25519 for key derivation.
 * It uses zero-knowledge proofs for privacy-preserving transactions.
 */
export class Night extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.UNSPENT_MODEL,
    CoinFeature.TSS,
    CoinFeature.TSS_COLD,
    CoinFeature.TRANSACTION_DATA,
    CoinFeature.REQUIRES_BIG_NUMBER,
    CoinFeature.SUPPORTS_TOKENS, // Supports DUST token
  ];

  public readonly network: NightNetwork;

  constructor(options: NightConstructorOptions) {
    super({
      ...options,
      kind: CoinKind.CRYPTO,
      isToken: false,
      decimalPlaces: 8, // NIGHT uses 8 decimal places
      baseUnit: BaseUnit.NIGHT,
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
 * Factory function for Night coin instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `Night`
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function night(
  id: string,
  name: string,
  fullName: string,
  network: NightNetwork,
  asset: UnderlyingAsset,
  features: CoinFeature[] = Night.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new Night({
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
