import { AccountCoin, AccountConstructorOptions } from './account';
import { BaseUnit, CoinFeature, KeyCurve, UnderlyingAsset } from './base';
import { EVM_FEATURES } from './coinFeatures';
import { AccountNetwork } from './networks';

export interface HypeEvmConstructorOptions extends AccountConstructorOptions {
  tokenId: number;
  systemAddress: string;
}

export class HypeEvm extends AccountCoin {
  public static readonly DEFAULT_FEATURES = [
    ...EVM_FEATURES,
    CoinFeature.SHARED_EVM_SIGNING,
    CoinFeature.SHARED_EVM_SDK,
    CoinFeature.EVM_COMPATIBLE_IMS,
    CoinFeature.EVM_COMPATIBLE_UI,
    CoinFeature.EVM_NON_BITGO_RECOVERY,
    CoinFeature.EVM_UNSIGNED_SWEEP_RECOVERY,
    CoinFeature.SUPPORTS_ERC20,
    CoinFeature.STAKING,
  ];

  public tokenId: number;
  public systemAddress: string;

  constructor(options: HypeEvmConstructorOptions) {
    super({
      ...options,
    });

    this.tokenId = options.tokenId;
    this.systemAddress = options.systemAddress;
  }
}

/**
 * Factory function for hypeEvm coin instances
 *
 * @param id uuid v4
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined for EVM like coins
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function hypeEvm(
  id: string,
  name: string,
  fullName: string,
  network: AccountNetwork,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  baseUnit: BaseUnit,
  tokenId: number,
  systemAddress: string,
  features: CoinFeature[] = HypeEvm.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new HypeEvm({
      id,
      name,
      fullName,
      network,
      decimalPlaces,
      asset,
      baseUnit,
      features,
      prefix,
      suffix,
      primaryKeyCurve,
      isToken: false,
      tokenId,
      systemAddress,
    })
  );
}
