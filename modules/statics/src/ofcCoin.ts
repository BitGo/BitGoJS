import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { BaseNetwork } from './networks';

export interface OfcConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: BaseNetwork;
  asset: UnderlyingAsset;
  baseUnit: BaseUnit;
  features: CoinFeature[];
  decimalPlaces: number;
  isToken: boolean;
  kind: CoinKind;
  prefix?: string;
  suffix?: string;
  addressCoin?: string;
  primaryKeyCurve: KeyCurve;
}

export const DISALLOWED_FEATURES = [
  CoinFeature.UNSPENT_MODEL,
  CoinFeature.CHILD_PAYS_FOR_PARENT,
  CoinFeature.PAYGO,
  CoinFeature.SUPPORTS_TOKENS,
  // OFC inherits features from the base asset but the features are not always applicable to OFC
  CoinFeature.SHARED_EVM_SIGNING,
  CoinFeature.EVM_COMPATIBLE_WP,
];

export const REQUIRED_FEATURES = [CoinFeature.ACCOUNT_MODEL, CoinFeature.REQUIRES_BIG_NUMBER];

/**
 * OFC (off chain) coins. These are virtual coins used to represent off chain assets on the BitGo platform.
 */
export class OfcCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.ACCOUNT_MODEL,
    CoinFeature.REQUIRES_BIG_NUMBER,
    CoinFeature.CUSTODY,
    CoinFeature.CUSTODY_BITGO_TRUST,
    CoinFeature.CUSTODY_BITGO_MENA_FZE,
    CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
    CoinFeature.CUSTODY_BITGO_INDIA,
  ];

  // If set, this coin is the native address format for this token.
  public readonly addressCoin?: string;
  public readonly minimumDenomination: number;
  constructor(options: OfcConstructorOptions) {
    const { addressCoin, ...baseOptions } = options;
    super(baseOptions);
    this.addressCoin = addressCoin;
    this.minimumDenomination = Math.pow(10, this.decimalPlaces);
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>(REQUIRED_FEATURES);
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>(DISALLOWED_FEATURES);
  }
}
