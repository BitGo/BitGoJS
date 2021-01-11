import { BaseCoin, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { UtxoNetwork } from './networks';

export interface UtxoConstructorOptions {
  fullName: string;
  name: string;
  network: UtxoNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

export class UtxoCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.UNSPENT_MODEL,
    CoinFeature.CHILD_PAYS_FOR_PARENT,
    CoinFeature.WRAPPED_SEGWIT,
    CoinFeature.NATIVE_SEGWIT,
  ];

  /**
   * Additional fields for utxo coins
   */
  public readonly network: UtxoNetwork;

  constructor(options: UtxoConstructorOptions) {
    super({
      ...options,
      kind: CoinKind.CRYPTO,
      isToken: false,
      decimalPlaces: 8,
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
 * Factory function for utxo coin instances.
 *
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `UtxoCoin`
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function utxo(
  name: string,
  fullName: string,
  network: UtxoNetwork,
  asset: UnderlyingAsset,
  features: CoinFeature[] = UtxoCoin.DEFAULT_FEATURES,
  prefix: string = '',
  suffix: string = name.toUpperCase(),
  /** All UTXOs BitGo supports are SECP256K1 **/
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new UtxoCoin({
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
