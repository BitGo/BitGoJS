import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { Networks, UtxoNetwork } from './networks';

interface UtxoConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: UtxoNetwork;
  features: CoinFeature[];
  asset: UnderlyingAsset;
  baseUnit: BaseUnit;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
}

export class UtxoCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.UNSPENT_MODEL,
    CoinFeature.CHILD_PAYS_FOR_PARENT,
    CoinFeature.CUSTODY,
    CoinFeature.CUSTODY_BITGO_TRUST,
    CoinFeature.MULTISIG_COLD,
    CoinFeature.PAYGO,
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
 * @param id uuid v4 of the coin
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
  id: string,
  name: string,
  fullName: string,
  network: UtxoNetwork,
  asset: UnderlyingAsset,
  baseUnit: BaseUnit,
  features: CoinFeature[] = UtxoCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  /** All UTXOs BitGo supports are SECP256K1 **/
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new UtxoCoin({
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

const BCH_FEATURES = [
  ...UtxoCoin.DEFAULT_FEATURES,
  CoinFeature.CUSTODY_BITGO_GERMANY,
  CoinFeature.CUSTODY_BITGO_NEW_YORK,
  CoinFeature.CUSTODY_BITGO_FRANKFURT,
  CoinFeature.CUSTODY_BITGO_SINGAPORE,
];
const BTC_FEATURES = [
  ...UtxoCoin.DEFAULT_FEATURES,
  CoinFeature.CUSTODY_BITGO_GERMANY,
  CoinFeature.CUSTODY_BITGO_NEW_YORK,
  CoinFeature.CUSTODY_BITGO_FRANKFURT,
  CoinFeature.CUSTODY_BITGO_SISTER_TRUST_ONE,
  CoinFeature.BULK_TRANSACTION,
  CoinFeature.DISTRIBUTED_CUSTODY,
  CoinFeature.CUSTODY_BITGO_SINGAPORE,
  CoinFeature.CUSTODY_BITGO_SWITZERLAND,
];
const BTG_FEATURES = [
  ...UtxoCoin.DEFAULT_FEATURES,
  CoinFeature.CUSTODY_BITGO_GERMANY,
  CoinFeature.CUSTODY_BITGO_FRANKFURT,
];
const LTC_FEATURES = [
  ...UtxoCoin.DEFAULT_FEATURES,
  CoinFeature.CUSTODY_BITGO_GERMANY,
  CoinFeature.CUSTODY_BITGO_NEW_YORK,
  CoinFeature.CUSTODY_BITGO_FRANKFURT,
  CoinFeature.CUSTODY_BITGO_SINGAPORE,
];
const DOGE_FEATURES = [
  ...UtxoCoin.DEFAULT_FEATURES,
  CoinFeature.CUSTODY_BITGO_GERMANY,
  CoinFeature.CUSTODY_BITGO_FRANKFURT,
  CoinFeature.CUSTODY_BITGO_SINGAPORE,
];

export const utxoCoins: Readonly<BaseCoin>[] = [
  utxo(
    '8d6e08d5-399f-414f-8430-6ceca1798cbf',
    'bch',
    'Bitcoin Cash',
    Networks.main.bitcoinCash,
    UnderlyingAsset.BCH,
    BaseUnit.BTC,
    BCH_FEATURES
  ),
  utxo(
    'aae6fafc-5091-4b10-9a11-aa6cefea2805',
    'tbch',
    'Testnet Bitcoin Cash',
    Networks.test.bitcoinCash,
    UnderlyingAsset.BCH,
    BaseUnit.BTC,
    BCH_FEATURES
  ),
  utxo(
    '941587ce-1c7a-4305-b908-15455d15e961',
    'bcha',
    'ECash',
    Networks.main.eCash,
    UnderlyingAsset.BCHA,
    BaseUnit.BTC
  ),
  utxo(
    'af8de1e0-3e33-47bf-94d3-fb3c2bebead2',
    'tbcha',
    'Testnet ECash',
    Networks.test.eCash,
    UnderlyingAsset.BCHA,
    BaseUnit.BTC
  ),
  utxo(
    'f728cfc7-d0cf-4f99-bca0-d25273e65fcf',
    'bsv',
    'Bitcoin SV',
    Networks.main.bitcoinSV,
    UnderlyingAsset.BSV,
    BaseUnit.BTC,
    [CoinFeature.DEPRECATED, ...UtxoCoin.DEFAULT_FEATURES]
  ),
  utxo(
    '7cb81518-85d7-400f-960e-7bc00b3bfa62',
    'tbsv',
    'Testnet Bitcoin SV',
    Networks.test.bitcoinSV,
    UnderlyingAsset.BSV,
    BaseUnit.BTC,
    [CoinFeature.DEPRECATED, ...UtxoCoin.DEFAULT_FEATURES]
  ),
  utxo(
    '5c1691c5-c9cc-49ed-abe0-c433dab2edaa',
    'btc',
    'Bitcoin',
    Networks.main.bitcoin,
    UnderlyingAsset.BTC,
    BaseUnit.BTC,
    BTC_FEATURES
  ),
  utxo(
    'cde7559d-a536-4d12-8de4-90baa09f90bd',
    'tbtc',
    'Testnet Bitcoin',
    Networks.test.bitcoin,
    UnderlyingAsset.BTC,
    BaseUnit.BTC,
    BTC_FEATURES
  ),
  utxo(
    '8feb110d-0d68-44ce-ae97-b8c30ec870a9',
    'btg',
    'Bitcoin Gold',
    Networks.main.bitcoinGold,
    UnderlyingAsset.BTG,
    BaseUnit.BTC,
    BTG_FEATURES
  ),
  utxo(
    '633246f2-af21-41b8-8b9e-ba9ae25d386f',
    'tbtg',
    'Testnet Bitcoin Gold',
    Networks.test.bitcoinGold,
    UnderlyingAsset.BTG,
    BaseUnit.BTC,
    BTG_FEATURES.filter((f) => f !== CoinFeature.MULTISIG_COLD)
  ),
  utxo(
    '9c8097f1-5d2c-4a62-a94c-96c271c0e5e0',
    'ltc',
    'Litecoin',
    Networks.main.litecoin,
    UnderlyingAsset.LTC,
    BaseUnit.LTC,
    LTC_FEATURES
  ),
  utxo(
    '1aca32c8-a3e5-42eb-82df-4c263d8bfc68',
    'tltc',
    'Testnet Litecoin',
    Networks.test.litecoin,
    UnderlyingAsset.LTC,
    BaseUnit.LTC,
    LTC_FEATURES
  ),
  utxo('0739be6a-c72e-468d-9464-ca5601965708', 'dash', 'Dash', Networks.main.dash, UnderlyingAsset.DASH, BaseUnit.DASH),
  utxo(
    '5950d78f-e8dd-457a-ab5d-310e6b476bb1',
    'tdash',
    'Testnet Dash',
    Networks.test.dash,
    UnderlyingAsset.DASH,
    BaseUnit.DASH
  ),
  utxo('508f6b53-1e6e-41fd-b541-b2498b7c4b61', 'zec', 'ZCash', Networks.main.zCash, UnderlyingAsset.ZEC, BaseUnit.ZEC),
  utxo(
    '549a4499-387c-42d3-9048-c01d6724d98a',
    'tzec',
    'Testnet ZCash',
    Networks.test.zCash,
    UnderlyingAsset.ZEC,
    BaseUnit.ZEC
  ),
  utxo(
    'c93a9160-458f-4a31-bea0-4a93ae8b1d2d',
    'doge',
    'Dogecoin',
    Networks.main.dogecoin,
    UnderlyingAsset.DOGE,
    BaseUnit.BTC,
    DOGE_FEATURES
  ),
  utxo(
    '7a1597e8-fd8e-4b68-8086-f9159e37e0ce',
    'tdoge',
    'Testnet Dogecoin',
    Networks.test.dogecoin,
    UnderlyingAsset.DOGE,
    BaseUnit.BTC,
    DOGE_FEATURES
  ),
];
