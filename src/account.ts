import { BaseCoin, CoinFeature, CoinKind, UnderlyingAsset } from './base';
import { InvalidContractAddress } from './errors';
import { AccountNetwork, Networks } from './networks';

export interface AccountConstructorOptions {
  fullName: string;
  name: string;
  network: AccountNetwork;
  features: CoinFeature[];
  decimalPlaces: number;
  isToken: boolean;
  prefix?: string;
  suffix?: string;
}

export class AccountCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.ACCOUNT_MODEL,
    CoinFeature.REQUIRES_BIG_NUMBER,
    CoinFeature.VALUELESS_TRANSFER,
    CoinFeature.TRANSACTION_DATA,
  ];

  public readonly network: AccountNetwork;

  constructor(options: AccountConstructorOptions) {
    super({
      kind: CoinKind.CRYPTO,
      family: options.network.family,
      decimalPlaces: options.decimalPlaces,
      asset: UnderlyingAsset.SELF,
      prefix: '',
      suffix: options.name,
      ...options,
    });

    this.network = options.network;
  }
}

export interface Erc20ConstructorOptions extends AccountConstructorOptions {
  contractAddress: string;
}

export interface ContractAddress extends String {
  __contractaddress_phantom__: never;
}

export class Erc20 extends AccountCoin {
  public contractAddress: ContractAddress;

  constructor(options: Erc20ConstructorOptions) {
    super({
      isToken: true,
      ...options,
    });

    // valid ERC 20 contract addresses are "0x" followed by 40 lowercase hex characters
    if (!options.contractAddress.match(/^0x[a-f0-9]{40}$/)) {
      throw new InvalidContractAddress(options.name, options.contractAddress);
    }

    this.contractAddress = (options.contractAddress as unknown) as ContractAddress;
  }
}

/**
 * Factory function for account coin instances.
 *
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param decimalPlaces Number of decimal places this coin supports (divisibility exponent)
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param isToken? Whether or not this account coin is a token of another coin
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function account(
  name: string,
  fullName: string,
  network: AccountNetwork,
  decimalPlaces: number,
  prefix?: string,
  suffix?: string,
  isToken: boolean = false,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES
) {
  return new AccountCoin({
    name,
    fullName,
    network,
    prefix,
    suffix,
    features,
    decimalPlaces,
    isToken,
  });
}

/**
 * Factory function for erc20 token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Ethereum main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function erc20(
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  prefix?: string,
  suffix?: string,
  network: AccountNetwork = Networks.main.ethereum,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES
) {
  return new Erc20({
    name,
    fullName,
    network: Networks.main.ethereum,
    contractAddress,
    prefix,
    suffix,
    features,
    decimalPlaces,
    isToken: true,
  });
}

/**
 * Factory function for testnet erc20 token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the Kovan test network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function terc20(
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  prefix?: string,
  suffix?: string,
  network: AccountNetwork = Networks.test.kovan,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES
) {
  return erc20(name, fullName, decimalPlaces, contractAddress, prefix, suffix, network, features);
}
