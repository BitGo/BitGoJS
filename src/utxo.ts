import { IBaseCoin, CoinFeature, CoinType, CoinAsset, CoinFamily } from './base';
import { UtxoNetwork } from './networks';

export interface UtxoConstructorOptions {
  longName: string;
  shortName: string;
  network: UtxoNetwork;
  features: CoinFeature[];
  prefix?: string;
  suffix?: string;
}

export class UtxoCoin implements IBaseCoin {
  public readonly network: UtxoNetwork;
  public readonly decimalPlaces: number;
  public readonly family: CoinFamily;
  public readonly features: CoinFeature[];
  public readonly isToken: boolean;
  public readonly longName: string;
  public readonly shortName: string;
  public readonly prefix: string;
  public readonly suffix: string;
  public readonly type: CoinType;
  public readonly asset: CoinAsset;

  public static readonly DEFAULT_FEATURES = [
    CoinFeature.UNSPENT_MODEL,
    CoinFeature.CHILD_PAYS_FOR_PARENT,
    CoinFeature.WRAPPED_SEGWIT,
    CoinFeature.NATIVE_SEGWIT,
  ];

  constructor(params: UtxoConstructorOptions) {
    // fixed properties - these are defaults for all utxo
    // coins and must be specifically overridden after
    // calling super() in inheritors
    this.network = params.network;
    this.decimalPlaces = 8;
    this.family = params.network.family;
    this.features = params.features;
    this.isToken = false;
    this.longName = params.longName;
    this.shortName = params.shortName;
    this.prefix = params.prefix || '';
    this.suffix = params.suffix || params.shortName;
    this.type = CoinType.CRYPTO;
    this.asset = CoinAsset.SELF;
  }
}

/**
 * Factory function for utxo coin instances.
 */
export function utxo(
  longName: string,
  shortName: string,
  network: UtxoNetwork,
  prefix?: string,
  suffix?: string,
  features: CoinFeature[] = UtxoCoin.DEFAULT_FEATURES
) {
  return new UtxoCoin({
    longName,
    shortName,
    network,
    prefix,
    suffix,
    features,
  });
}
