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
  SELF = 'self', // sentinel value which means that this coin represents itself, and has no other underlying asset
}

export interface IBaseCoin {
  /*
    Display properties
   */
  longName: string;
  shortName: string;
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
  // asset which this coin represents. If it represents itself, this should be set to CoinAsset.SELF.
  asset: CoinAsset;
}
