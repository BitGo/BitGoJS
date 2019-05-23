import { BaseCoin, CoinFeature, CoinKind, UnderlyingAsset } from './base';
import { InvalidContractAddress } from './errors';
import { AccountNetwork, Networks } from './networks';

export interface AccountConstructorOptions {
  fullName: string;
  name: string;
  network: AccountNetwork;
  asset: UnderlyingAsset;
  features: CoinFeature[];
  decimalPlaces: number;
  isToken: boolean;
  prefix?: string;
  suffix?: string;
}

/**
 * Account based coins, such as Ethereum, Stellar, or XRP.
 *
 * These types of coins maintain an "account balance" for each address on the network,
 * as opposed to the unspent transaction output model which maintains a record of all
 * "pieces" of coin which belong to an address.
 */
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
      isToken: false,
      ...options,
      kind: CoinKind.CRYPTO,
    });

    this.network = options.network;
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>([CoinFeature.ACCOUNT_MODEL]);
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>([CoinFeature.UNSPENT_MODEL]);
  }
}

export interface Erc20ConstructorOptions extends AccountConstructorOptions {
  contractAddress: string;
}

export interface ContractAddress extends String {
  __contractaddress_phantom__: never;
}

/**
 * ERC 20 is a token standard for the Ethereum blockchain. They are similar to other account coins, but have a
 * contract address property which identifies the smart contract which defines the token.
 */
export class Erc20Coin extends AccountCoin {
  public contractAddress: ContractAddress;

  constructor(options: Erc20ConstructorOptions) {
    super({
      ...options,
      isToken: true,
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
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
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
  asset: UnderlyingAsset,
  prefix: string = '',
  suffix: string = name,
  isToken: boolean = false,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES
) {
  return Object.freeze(
    new AccountCoin({
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      decimalPlaces,
      isToken,
      asset,
    })
  );
}

/**
 * Factory function for erc20 token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
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
  asset: UnderlyingAsset,
  prefix: string = '',
  suffix: string = name,
  network: AccountNetwork = Networks.main.ethereum,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES
) {
  return Object.freeze(
    new Erc20Coin({
      name,
      fullName,
      network,
      contractAddress,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: true,
    })
  );
}

/**
 * Factory function for testnet erc20 token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
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
  asset: UnderlyingAsset,
  prefix: string = '',
  suffix: string = name,
  network: AccountNetwork = Networks.test.kovan,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES
) {
  return erc20(name, fullName, decimalPlaces, contractAddress, asset, prefix, suffix, network, features);
}
