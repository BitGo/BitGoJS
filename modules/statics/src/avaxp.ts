import { BaseCoin, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { AvalancheNetwork } from './networks';

export interface AVAXPConstructorOptions {
  fullName: string;
  name: string;
  network: AvalancheNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

export class AVAXPCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [CoinFeature.UNSPENT_MODEL];

  /**
   * Additional fields for utxo coins
   */
  public readonly network: AvalancheNetwork;

  constructor(options: AVAXPConstructorOptions) {
    super({
      ...options,
      kind: CoinKind.CRYPTO,
      isToken: false,
      decimalPlaces: 9,
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
export function avaxp(
  name: string,
  fullName: string,
  network: AvalancheNetwork,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AVAXPCoin.DEFAULT_FEATURES,
  prefix: string = '',
  suffix: string = name.toUpperCase(),
  /** All UTXOs BitGo supports are SECP256K1 **/
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new AVAXPCoin({
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
