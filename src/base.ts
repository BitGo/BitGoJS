export const enum CoinType {
  CRYPTO = 'crypto',
  FIAT = 'fiat',
}

export const enum CoinFamily {
  BTC = 'btc',
  ETH = 'eth',
  LTC = 'ltc',
  BTG = 'btg',
  BCH = 'bch',
  BSV = 'bsv',
  DASH = 'dash',
  OFC = 'ofc',
  RMG = 'rmg',
  SUSD = 'susd',
  XLM = 'xlm',
  XRP = 'xrp',
}

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
}

export const enum CoinAsset {
  BTC = 'btc',
  USD = 'usd',
}

// there is a method to this madness.
// The idea here is we want a distinct type, but which
// has complete overlap with the String prototype.
// the phantom properties will never be present at
// runtime, and serve only to differentiate the
// different string types to the type system.
export interface ShortName extends String {
  __shortname_phantom__: never;
}

export interface LongName extends String {
  __longname_phantom__: never;
}

export interface IBaseCoin {
  /*
    Display properties
   */
  longName: LongName;
  shortName: ShortName;
  /*
    Classification properties
   */
  type: CoinType;
  family: CoinFamily;
  isToken: boolean;
  /*
    Coin Features. These are yes or no questions about what the coin supports and does not support.
   */
  features: CoinFeature[];
  /*
    Conversion properties
   */
  decimalPlaces: number;
  /*
    Optional properties
   */
  prefix?: string;
  suffix?: string;
  // asset which this coin represents; if not itself (in which case, this will be null)
  asset?: CoinAsset;
}
