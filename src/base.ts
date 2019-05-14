import { ConflictingCoinFeatureError } from './errors';

export const enum CoinKind {
  CRYPTO = 'crypto',
  FIAT = 'fiat',
}

/**
 * The coin family links related variants of a single coin together.
 *
 * Typically, each coin will have a testnet and mainnet variant,
 * and these will both have the same coin family.
 *
 * For example, the coins `btc` and `tbtc` both belong to the same family, `btc`.
 */
export const enum CoinFamily {
  BCH = 'bch',
  BSV = 'bsv',
  BTC = 'btc',
  BTG = 'btg',
  DASH = 'dash',
  ETH = 'eth',
  LTC = 'ltc',
  OFC = 'ofc',
  RMG = 'rmg',
  SUSD = 'susd',
  XLM = 'xlm',
  XRP = 'xrp',
  ZEC = 'zec',
}

/**
 * Coin features are yes or no questions about what a coin requires or is capable of.
 *
 * This allows coin-agnostic handling of coin-specific features. This is designed
 * to replace checking the coin name against a whitelist of supported coins
 * before executing some coin-specific logic, and instead allows one to check if a
 * coin supports the coin-specific feature that the logic implements.
 */
export const enum CoinFeature {
  VALUELESS_TRANSFER = 'valueless-transfer',
  TRANSACTION_DATA = 'transaction-data',
  REQUIRES_BIG_NUMBER = 'requires-big-number',
  REQUIRES_KRS_BACKUP_KEY = 'requires-krs-backup-key',
  PAYGO = 'paygo',
  UNSPENT_MODEL = 'unspent-model',
  ACCOUNT_MODEL = 'account-model',
  CHILD_PAYS_FOR_PARENT = 'cpfp',
  WRAPPED_SEGWIT = 'wrapped-segwit',
  NATIVE_SEGWIT = 'native-segwit',
  SUPPORTS_TOKENS = 'supports-tokens',
}

/**
 * Some coins are representations of another underlying asset class. An example
 * is Wrapped Bitcoin, which represents Bitcoin on the Ethereum blockchain.
 *
 * For these coins, the `UnderlyingAsset` provides a link to the actual
 * asset for which the coin is a unit of account.
 *
 * For all other coins, the `UnderlyingAsset` should be set to `SELF`, which
 * indicates that the coin is a unit of account only for itself, and does not
 * represent some amount of another asset class.
 */
export const enum UnderlyingAsset {
  BTC = 'btc',
  USD = 'usd',
  SELF = 'self',
}

export interface BaseCoinConstructorOptions {
  fullName: string; // full, human readable name of this coin. Eg, "Bitcoin Cash" for bch
  name: string; // unique identifier for this coin, usually the lowercase ticker or symbol. Eg, "btc" for bitcoin
  prefix?: string;
  suffix?: string;
  kind: CoinKind;
  family: CoinFamily;
  isToken: boolean;
  features: CoinFeature[];
  decimalPlaces: number;
  asset: UnderlyingAsset;
}

export abstract class BaseCoin {
  /*
    Display properties
   */
  public readonly fullName: string;
  public readonly name: string;
  public readonly prefix?: string;
  public readonly suffix?: string;
  /*
    Classification properties
   */
  public readonly kind: CoinKind;
  public readonly family: CoinFamily;
  public readonly isToken: boolean;
  /*
    Coin Features. These are yes or no questions about what the coin supports and does not support.
   */
  public readonly features: CoinFeature[];
  /*
    Conversion properties
   */
  public readonly decimalPlaces: number;
  public readonly asset: UnderlyingAsset;

  protected static CONFLICTING_FEATURES: {
    [index: string]: CoinFeature[];
  } = {
    [CoinFeature.ACCOUNT_MODEL]: [CoinFeature.UNSPENT_MODEL],
  };

  /**
   * Ensures that the base coin constructor was passed a valid set of options.
   *
   * This includes checking that:
   * - the coin features do not conflict
   * @param {BaseCoinConstructorOptions} options
   * @throws {ConflictingCoinFeatureError} if any of the coin features are in conflict with one another
   */
  private static validateOptions(options: BaseCoinConstructorOptions) {
    for (const feature of options.features) {
      const conflictingFeatures = BaseCoin.CONFLICTING_FEATURES[feature] || [];
      for (const conflictingFeature of conflictingFeatures) {
        if (options.features.includes(conflictingFeature)) {
          throw new ConflictingCoinFeatureError(feature, conflictingFeature);
        }
      }
    }
  }

  protected constructor(options: BaseCoinConstructorOptions) {
    BaseCoin.validateOptions(options);

    this.fullName = options.fullName;
    this.name = options.name;
    this.prefix = options.prefix;
    this.suffix = options.suffix;
    this.kind = options.kind;
    this.family = options.family;
    this.isToken = options.isToken;
    this.features = options.features;
    this.decimalPlaces = options.decimalPlaces;
    this.asset = options.asset;
  }
}
