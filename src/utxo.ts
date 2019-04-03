import { IBaseCoin, CoinFeature, CoinType, LongName, ShortName, CoinAsset, CoinFamily } from './base';
import { UtxoNetwork } from './networks';

export interface UtxoConstructorOptions {
  longName: LongName;
  shortName: ShortName;
  network: UtxoNetwork;
  features: CoinFeature[];
}

export class UtxoCoin implements IBaseCoin {
  public readonly network: UtxoNetwork;

  public readonly decimalPlaces: number;
  public readonly family: CoinFamily;
  public readonly features: CoinFeature[];
  public readonly isToken: boolean;
  public readonly longName: LongName;
  public readonly prefix: string;
  public readonly shortName: ShortName;
  public readonly suffix: string;
  public readonly type: CoinType;

  constructor(params: UtxoConstructorOptions) {
    // fixed properties - these are defaults for all utxo
    // coins and must be specifically overridden after
    // calling super() in inheritors
    this.isToken = false;
    this.decimalPlaces = 8;
    this.prefix = '';
    this.type = CoinType.CRYPTO;
    this.network = params.network;
    this.longName = params.longName;
    this.shortName = params.shortName;
    this.family = params.network.family;
    this.features = params.features;
    this.suffix = (params.shortName as unknown) as string;
  }
}

/**
 * Factory function for utxo coin instances.
 */
export function utxo(
  longName: LongName,
  shortName: ShortName,
  network: UtxoNetwork,
  prefix?: string,
  suffix?: string,
  features: CoinFeature[] = [
    CoinFeature.UNSPENT_MODEL,
    CoinFeature.CHILD_PAYS_FOR_PARENT,
    CoinFeature.WRAPPED_SEGWIT,
    CoinFeature.NATIVE_SEGWIT,
  ]
) {
  return new UtxoCoin({
    longName,
    shortName,
    network,
    features,
  });
}
