import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { LightningNetwork, Networks } from './networks';

interface LightningConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: LightningNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  baseUnit: BaseUnit;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

export class LightningCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [CoinFeature.LIGHTNING_MODEL];

  /**
   * Additional fields for lightning coins
   */
  public readonly network: LightningNetwork;

  constructor(options: LightningConstructorOptions) {
    super({
      ...options,
      kind: CoinKind.CRYPTO,
      isToken: false,
      decimalPlaces: 11,
    });

    this.network = options.network;
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set([CoinFeature.ACCOUNT_MODEL]);
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set([CoinFeature.LIGHTNING_MODEL]);
  }
}

/**
 * Factory function for lightning coin instances.
 *
 * @param id uuid v4 of the coin
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `LightningCoin`
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function lightning(
  id: string,
  name: string,
  fullName: string,
  network: LightningNetwork,
  asset: UnderlyingAsset,
  baseUnit: BaseUnit,
  features: CoinFeature[] = LightningCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  /** All Lightnings BitGo supports are SECP256K1 **/
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new LightningCoin({
      id,
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      asset,
      primaryKeyCurve,
      baseUnit,
    })
  );
}

const LNBTC_FEATURES = [...LightningCoin.DEFAULT_FEATURES];

export const lightningCoins: Readonly<BaseCoin>[] = [
  lightning(
    '051aab40-efbc-4f58-9506-14cc95369e0a',
    'lnbtc',
    'LightningBitcoin',
    Networks.main.lnbtc,
    UnderlyingAsset.LNBTC,
    BaseUnit.LNBTC,
    LNBTC_FEATURES
  ),
  lightning(
    '3cbabaa7-a063-4db3-b3a8-ea8cc38033e5',
    'tlnbtc',
    'Testnet LightningBitcoin',
    Networks.test.lnbtc,
    UnderlyingAsset.LNBTC,
    BaseUnit.LNBTC,
    LNBTC_FEATURES
  ),
];
