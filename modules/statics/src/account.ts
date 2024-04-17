import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { DOMAIN_PATTERN } from './constants';
import { InvalidContractAddressError, InvalidDomainError } from './errors';
import { AccountNetwork, BaseNetwork, EthereumNetwork, Networks, TronNetwork } from './networks';

export interface AccountConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  alias?: string;
  network: AccountNetwork;
  asset: UnderlyingAsset;
  baseUnit: BaseUnit;
  features: CoinFeature[];
  decimalPlaces: number;
  isToken: boolean;
  prefix?: string;
  suffix?: string;
  primaryKeyCurve: KeyCurve;
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
    CoinFeature.CUSTODY,
    CoinFeature.CUSTODY_BITGO_TRUST,
  ];

  public readonly network: AccountNetwork;

  constructor(options: AccountConstructorOptions) {
    super({
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

export interface StellarCoinConstructorOptions extends AccountConstructorOptions {
  domain: string;
}

export interface HederaCoinConstructorOptions extends AccountConstructorOptions {
  nodeAccountId: string;
}

export interface HederaTokenConstructorOptions extends AccountConstructorOptions {
  nodeAccountId: string;
  tokenId: string;
}

export interface AlgoCoinConstructorOptions extends AccountConstructorOptions {
  tokenURL: string;
}

export interface EosCoinConstructorOptions extends AccountConstructorOptions {
  contractName: string;
}

export interface SolCoinConstructorOptions extends AccountConstructorOptions {
  tokenAddress: string;
}

export interface AdaCoinConstructorOptions extends AccountConstructorOptions {
  policyId: string;
  assetName: string;
}

export interface XrpCoinConstructorOptions extends AccountConstructorOptions {
  issuerAddress: string;
  currencyCode: string;
  domain: string;
}

type FiatCoinName = `fiat${string}` | `tfiat${string}`;
export interface FiatCoinConstructorOptions extends AccountConstructorOptions {
  name: FiatCoinName;
}

export interface ContractAddress extends String {
  __contractaddress_phantom__: never;
}

export class AccountCoinToken extends AccountCoin {
  constructor(options: AccountConstructorOptions) {
    super({
      ...options,
    });
  }
}

/**
 * Some blockchains support tokens which are defined by an address at which they have a smart contract deployed.
 * Examples are ERC20 tokens, and the equivalent on other chains.
 */
export class ContractAddressDefinedToken extends AccountCoinToken {
  public contractAddress: ContractAddress;

  constructor(options: Erc20ConstructorOptions) {
    super({
      ...options,
    });

    // valid ERC 20 contract addresses are "0x" followed by 40 lowercase hex characters
    // do not use a valid address format for generic tokens because they not have onchain addresses
    if (!options.contractAddress.match(/^0x[a-f0-9]{40}$/) && !options.features.includes(CoinFeature.GENERIC_TOKEN)) {
      throw new InvalidContractAddressError(options.name, options.contractAddress);
    }

    this.contractAddress = options.contractAddress as unknown as ContractAddress;
  }
}

/**
 * ERC20 token addresses are Base58 formatted on some blockchains.
 */
export class Base58ContractAddressDefinedToken extends AccountCoinToken {
  public contractAddress: ContractAddress;

  constructor(options: Erc20ConstructorOptions) {
    super({
      ...options,
    });

    if (!/^[1-9A-HJ-NP-Za-km-z]{34}$/.test(options.contractAddress)) {
      throw new InvalidContractAddressError(options.name, options.contractAddress);
    }

    this.contractAddress = options.contractAddress as unknown as ContractAddress;
  }
}

/**
 * ERC 20 is a token standard for the Ethereum blockchain. They are similar to other account coins, but have a
 * contract address property which identifies the smart contract which defines the token.
 */
export class Erc20Coin extends ContractAddressDefinedToken {}

/**
 * ERC 721 is the non fungible token standard for the Ethereum blockchain.
 *
 * {@link https://eips.ethereum.org/EIPS/eip-721 EIP721}
 */
export class Erc721Coin extends ContractAddressDefinedToken {}

/**
 * ERC 1155 is the multi token standard for the Ethereum blockchain.
 *
 * {@link https://eips.ethereum.org/EIPS/eip-1155 EIP1155}
 */
export class Erc1155Coin extends ContractAddressDefinedToken {}

/**
 * The TRON blockchain supports tokens of the ERC20 standard similar to ETH ERC20 tokens.
 */
export class TronErc20Coin extends Base58ContractAddressDefinedToken {}

/**
 * Some blockchains have native coins which also support the ERC20 interface such as CELO.
 */
export class Erc20CompatibleAccountCoin extends ContractAddressDefinedToken {
  constructor(options: Erc20ConstructorOptions) {
    super({
      ...options,
      // These coins should not be classified as tokens as they are not children of other coins
      isToken: false,
    });
  }
}

/**
 * The CELO blockchain supports tokens of the ERC20 standard similar to ETH ERC20 tokens.
 */
export class CeloCoin extends ContractAddressDefinedToken {}

/**
 * The BSC blockchain supports tokens of the ERC20 standard similar to ETH ERC20 tokens.
 */
export class BscCoin extends ContractAddressDefinedToken {}

/**
 * The Stellar network supports tokens (non-native assets)
 * XLM is also known as the native asset.
 * Stellar tokens work similar to XLM, but the token name is determined by the chain,
 * the token code and the issuer account in the form: (t)xlm:<token>-<issuer>
 */
export class StellarCoin extends AccountCoinToken {
  public domain: string;

  constructor(options: StellarCoinConstructorOptions) {
    super({
      ...options,
    });

    if (options.domain !== '' && !options.domain.match(DOMAIN_PATTERN)) {
      throw new InvalidDomainError(options.name, options.domain);
    }

    this.domain = options.domain as string;
  }
}

/**
 * The Hedera coin needs a client set with the node account Id.
 * It's an account based coin that needs the node account ID
 * where the transaction will be sent.
 *
 */
export class HederaCoin extends AccountCoinToken {
  public nodeAccountId: string;

  constructor(options: HederaCoinConstructorOptions) {
    super({
      ...options,
    });

    this.nodeAccountId = options.nodeAccountId;
  }
}

/**
 * The Hedera network supports tokens.
 * Hedera tokens work similar to native Hedera coin,
 * but the token is determined by the tokenId on the node
 *
 */
export class HederaToken extends AccountCoinToken {
  public nodeAccountId: string;
  public tokenId: string;

  constructor(options: HederaTokenConstructorOptions) {
    super({
      ...options,
    });

    this.nodeAccountId = options.nodeAccountId;
    this.tokenId = options.tokenId;
  }
}

/**
 * The Algo network supports tokens (assets)
 * Algo tokens work similar to native ALGO coin, but the token name is determined by
 * unique asset id on the chain. Internally, BitGo uses token identifiers of the format: (t)algo:<assetId>
 *
 */
export class AlgoCoin extends AccountCoinToken {
  public tokenURL: string;
  constructor(options: AlgoCoinConstructorOptions) {
    super({
      ...options,
    });

    if (options.tokenURL) {
      try {
        new URL(options.tokenURL);
      } catch (ex) {
        throw new InvalidDomainError(options.name, options.tokenURL);
      }
    }

    this.tokenURL = options.tokenURL;
  }
}

/**
 * The Eos network supports tokens
 * Eos tokens work similar to native Eos coin, but the token name is determined by
 * the contractName on the chain.
 *
 */
export class EosCoin extends AccountCoinToken {
  public contractName: string;
  constructor(options: EosCoinConstructorOptions) {
    super({
      ...options,
    });

    this.contractName = options.contractName;
  }
}

/**
 * The Sol network supports tokens
 * Sol tokens work similar to native SOL coin, but the token name is determined by
 * the tokenAddress on the chain.
 *
 */
export class SolCoin extends AccountCoinToken {
  public tokenAddress: string;
  constructor(options: SolCoinConstructorOptions) {
    super({
      ...options,
    });

    this.tokenAddress = options.tokenAddress;
  }
}

/**
 * The Ada network supports tokens
 * Ada tokens are identified by their policy ID and asset name
 *
 */
export class AdaCoin extends AccountCoinToken {
  public policyId: string;
  public assetName: string;
  constructor(options: AdaCoinConstructorOptions) {
    super({
      ...options,
    });

    this.policyId = options.policyId;
    this.assetName = options.assetName;
  }
}

/**
 * The AVAX C Chain network support tokens
 * AVAX C Chain Tokens are ERC20 coins
 */
export class AvaxERC20Token extends ContractAddressDefinedToken {
  constructor(options: Erc20ConstructorOptions) {
    super(options);
  }
}

/**
 * The Polygon Chain network support tokens
 * Polygon Chain Tokens are ERC20 coins
 */
export class PolygonERC20Token extends ContractAddressDefinedToken {
  constructor(options: Erc20ConstructorOptions) {
    super(options);
  }
}

/**
 * The Arbitrum Chain network support tokens
 * Arbitrum Chain Tokens are ERC20 tokens
 */
export class ArbethERC20Token extends ContractAddressDefinedToken {
  constructor(options: Erc20ConstructorOptions) {
    super(options);
  }
}

/**
 * The Optimism Chain network support tokens
 * Optimism Chain Tokens are ERC20 tokens
 */
export class OpethERC20Token extends ContractAddressDefinedToken {
  constructor(options: Erc20ConstructorOptions) {
    super(options);
  }
}

/**
 * The zkSync network support tokens
 * zkSync Tokens are ERC20 tokens
 */
export class ZkethERC20Token extends ContractAddressDefinedToken {
  constructor(options: Erc20ConstructorOptions) {
    super(options);
  }
}

/**
 * The Xrp network supports tokens
 * Xrp tokens are identified by their issuer address
 * Naming format is similar to XLM
 * <network>:<token>-<issuer>
 */
export class XrpCoin extends AccountCoinToken {
  public issuerAddress: string;
  public currencyCode: string;
  public domain: string;
  constructor(options: XrpCoinConstructorOptions) {
    super({
      ...options,
    });

    if (options.domain !== '' && !options.domain.match(DOMAIN_PATTERN)) {
      throw new InvalidDomainError(options.name, options.domain);
    }

    this.domain = options.domain as string;
    this.currencyCode = options.currencyCode;
    this.issuerAddress = options.issuerAddress;
  }
}

/**
 * Fiat currencies, such as USD, EUR, or YEN.
 */
export class FiatCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [...AccountCoin.DEFAULT_FEATURES];

  public readonly network: BaseNetwork;

  constructor(options: FiatCoinConstructorOptions) {
    super({ ...options, kind: CoinKind.FIAT });

    this.network = options.network;
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>([CoinFeature.ACCOUNT_MODEL]);
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>([CoinFeature.UNSPENT_MODEL]);
  }
}

/**
 * Factory function for account coin instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param decimalPlaces Number of decimal places this coin supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve? The elliptic curve for this chain/token
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param isToken? Whether or not this account coin is a token of another coin
 */
export function account(
  id: string,
  name: string,
  fullName: string,
  network: AccountNetwork,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  baseUnit: BaseUnit,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1,
  prefix = '',
  suffix: string = name.toUpperCase(),
  isToken = false
) {
  return Object.freeze(
    new AccountCoin({
      id,
      name,
      fullName,
      network,
      prefix,
      suffix,
      baseUnit,
      features,
      decimalPlaces,
      isToken,
      asset,
      primaryKeyCurve,
    })
  );
}

/**
 * Factory function for erc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Ethereum main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function erc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.main.ethereum,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new Erc20Coin({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for testnet erc20 token instances.
 *
 * @param id uuid v4
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
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.kovan
) {
  return erc20(id, name, fullName, decimalPlaces, contractAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for erc721 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Ethereum main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function erc721(
  id: string,
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.main.ethereum,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new Erc721Coin({
      id,
      name,
      fullName,
      network,
      contractAddress,
      prefix,
      suffix,
      features,
      decimalPlaces: 0,
      asset: UnderlyingAsset.ERC721,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for testnet erc721 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Holesky test network.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function terc721(
  id: string,
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.holesky,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return erc721(id, name, fullName, contractAddress, features, prefix, suffix, network, primaryKeyCurve);
}

/**
 * Factory function for nonstandard token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Ethereum main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function nonstandardToken(
  id: string,
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.main.ethereum,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new ContractAddressDefinedToken({
      id,
      name,
      fullName,
      network,
      contractAddress,
      prefix,
      suffix,
      features,
      decimalPlaces: 0,
      asset: UnderlyingAsset.NONSTANDARD,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for erc1155 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Ethereum main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function erc1155(
  id: string,
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.main.ethereum,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new Erc1155Coin({
      id,
      name,
      fullName,
      network,
      contractAddress,
      prefix,
      suffix,
      features,
      decimalPlaces: 0,
      asset: UnderlyingAsset.ERC1155,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for testnet erc1155 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Holesky test network.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function terc1155(
  id: string,
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.holesky,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return erc1155(id, name, fullName, contractAddress, features, prefix, suffix, network, primaryKeyCurve);
}

/**
 * Factory function for ERC20-compatible account coin instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param network Network object for this coin
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function erc20CompatibleAccountCoin(
  id: string,
  name: string,
  fullName: string,
  network: EthereumNetwork,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  baseUnit: BaseUnit,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new Erc20CompatibleAccountCoin({
      id,
      name,
      fullName,
      network,
      contractAddress,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: false,
      primaryKeyCurve,
      baseUnit,
    })
  );
}

/**
 * Factory function for celo token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to CELO main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function celoToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.main.celo,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new CeloCoin({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for testnet celo token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet CELO network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function tceloToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.celo
) {
  return celoToken(id, name, fullName, decimalPlaces, contractAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for celo token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to BSC main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function bscToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.main.bsc,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new BscCoin({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.BSC,
    })
  );
}

/**
 * Factory function for testnet bsc token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet BSC network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function tbscToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.bsc
) {
  return bscToken(id, name, fullName, decimalPlaces, contractAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for Stellar token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param domain Domain of the token issuer (used to access token information from the issuer's stellar.toml file)
 * See https://www.stellar.org/developers/guides/concepts/stellar-toml.html
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Stellar mainnet.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function stellarToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  domain = '',
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.stellar,
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new StellarCoin({
      id,
      name,
      fullName,
      decimalPlaces,
      asset,
      domain,
      features,
      prefix,
      suffix,
      network,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.XLM,
    })
  );
}

/**
 * Factory function for testnet Stellar token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param domain Domain of the token issuer (used to access token information from the issuer's stellar.toml file)
 * See https://www.stellar.org/developers/guides/concepts/stellar-toml.html
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Stellar testnet.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function tstellarToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  domain = '',
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.stellar
) {
  return stellarToken(id, name, fullName, decimalPlaces, asset, domain, features, prefix, suffix, network);
}

/**
 * Factory function for tron token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to TRON main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function tronToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: TronNetwork = Networks.main.trx,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new TronErc20Coin({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.TRX,
    })
  );
}

/**
 * Factory function for testnet tron token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet TRON network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function ttronToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: TronNetwork = Networks.test.trx,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return tronToken(
    id,
    name,
    fullName,
    decimalPlaces,
    contractAddress,
    asset,
    features,
    prefix,
    suffix,
    network,
    primaryKeyCurve
  );
}

/**
 * Factory function for Hedera coin instances
 *
 * @param id uuid v4
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param nodeAccountId node account Id from which the transaction will be sent
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Hedera mainnet.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function hederaCoin(
  id: string,
  name: string,
  fullName: string,
  network: AccountNetwork,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  nodeAccountId = '0.0.3',
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new HederaCoin({
      id,
      name,
      fullName,
      decimalPlaces,
      asset,
      nodeAccountId,
      features,
      prefix,
      suffix,
      network,
      isToken: false,
      primaryKeyCurve,
      baseUnit: BaseUnit.HBAR,
    })
  );
}

/**
 * Factory function for Hedera token instances
 *
 * @param id uuid v4
 * @param name unique identifier of the coin
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param nodeAccountId node account Id from which the transaction will be sent
 * @param tokenId The unique identifier of this token
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Hedera mainnet.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function hederaToken(
  id: string,
  name: string,
  fullName: string,
  network: AccountNetwork,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  nodeAccountId = '0.0.3',
  tokenId: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new HederaToken({
      id,
      name,
      fullName,
      decimalPlaces,
      asset,
      nodeAccountId,
      tokenId,
      features,
      prefix,
      suffix,
      network,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.HBAR,
    })
  );
}

/**
 * Factory function for ALGO token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token

 * @param alias (optional) alternative identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param tokenURL Optional asset Url for more informationa about the asset
 * See https://developer.algorand.org/docs/reference/transactions/#url
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to ALGO mainnet.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function algoToken(
  id: string,
  name: string,
  alias: string | undefined,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  tokenURL = '',
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.algorand,
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
): Readonly<AlgoCoin> {
  return Object.freeze(
    new AlgoCoin({
      id,
      name,
      alias,
      fullName,
      decimalPlaces,
      asset,
      tokenURL: tokenURL,
      features,
      prefix,
      suffix,
      network,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.ALGO,
    })
  );
}

/**
 * Factory function for testnet ALGO token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param alias (optional) alternative identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param tokenURL Optional asset Url for more informationa about the asset
 * See https://developer.algorand.org/docs/reference/transactions/#url
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Algo testnet.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function talgoToken(
  id: string,
  name: string,
  alias: string | undefined,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  tokenURL = '',
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.algorand
): Readonly<AlgoCoin> {
  return algoToken(id, name, alias, fullName, decimalPlaces, asset, tokenURL, features, prefix, suffix, network);
}

/**
 * Factory function for eos token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractName Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to EOS main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function eosToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractName: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.eos,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new EosCoin({
      id,
      name,
      fullName,
      network,
      contractName,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.EOS,
    })
  );
}

/**
 * Factory function for testnet eos token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet EOS network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function teosToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractName: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.eos
) {
  return eosToken(id, name, fullName, decimalPlaces, contractName, asset, features, prefix, suffix, network);
}

/**
 * Factory function for sol token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param tokenAddress Token address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to SOL main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES and REQUIRES_RESERVE defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function solToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  tokenAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.REQUIRES_RESERVE],
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.sol,
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new SolCoin({
      id,
      name,
      fullName,
      network,
      tokenAddress,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.SOL,
    })
  );
}

/**
 * Factory function for testnet solana token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param tokenAddress Token address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet Solana network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES and REQUIRES_RESERVE defined in `AccountCoin`
 */
export function tsolToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  tokenAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.REQUIRES_RESERVE],
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.sol
) {
  return solToken(id, name, fullName, decimalPlaces, tokenAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for ada token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param tokenSymbol Token symbol of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Cardano main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES and REQUIRES_RESERVE defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function adaToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  policyId: string,
  assetName: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.REQUIRES_RESERVE],
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.ada,
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new AdaCoin({
      id,
      name,
      fullName,
      network,
      policyId,
      assetName,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.ADA,
    })
  );
}

/**
 * Factory function for testnet cardano token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param tokenSymbol Token symbol of this token i.e: AUSD
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet Cardano network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES and REQUIRES_RESERVE defined in `AccountCoin`
 */
export function tadaToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  policyId: string,
  assetName: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.REQUIRES_RESERVE],
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.ada
) {
  return adaToken(id, name, fullName, decimalPlaces, policyId, assetName, asset, features, prefix, suffix, network);
}

/**
 * Factory function for avaxErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to AvalancheC main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function avaxErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.avalancheC,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new AvaxERC20Token({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for testnet avaxErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the AvalancheC test network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function tavaxErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.avalancheC,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return avaxErc20(
    id,
    name,
    fullName,
    decimalPlaces,
    contractAddress,
    asset,
    features,
    prefix,
    suffix,
    network,
    primaryKeyCurve
  );
}

/**
 * Factory function for polygonErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Polygon main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function polygonErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.polygon,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new PolygonERC20Token({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for Amoy testnet polygonErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the Polygon test network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function tpolygonErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.polygon,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return polygonErc20(
    id,
    name,
    fullName,
    decimalPlaces,
    contractAddress,
    asset,
    features,
    prefix,
    suffix,
    network,
    primaryKeyCurve
  );
}

/**
 * Factory function for arbethErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Arbitrum main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function arbethErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.arbitrum,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new ArbethERC20Token({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for Arbitrum Sepolia testnet arbethErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the Arbitrum test network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function tarbethErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.arbitrum,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return arbethErc20(
    id,
    name,
    fullName,
    decimalPlaces,
    contractAddress,
    asset,
    features,
    prefix,
    suffix,
    network,
    primaryKeyCurve
  );
}

/**
 * Factory function for opethErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Optimism main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function opethErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.optimism,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new OpethERC20Token({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for Optimism Sepolia testnet opethErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the Optimism test network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function topethErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.optimism,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return opethErc20(
    id,
    name,
    fullName,
    decimalPlaces,
    contractAddress,
    asset,
    features,
    prefix,
    suffix,
    network,
    primaryKeyCurve
  );
}

/**
 * Factory function for zkethErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to zkSync mainnet network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function zkethErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.zkSync,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new ZkethERC20Token({
      id,
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
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

/**
 * Factory function for zkSync Sepolia testnet zkethErc20 token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param contractAddress Contract address of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the zkSync sepolia test network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function tzkethErc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.zkSync,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return zkethErc20(
    id,
    name,
    fullName,
    decimalPlaces,
    contractAddress,
    asset,
    features,
    prefix,
    suffix,
    network,
    primaryKeyCurve
  );
}

/**
 * Factory function for xrp token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param issuerAddress: The address of the issuer of the token,
 * @param currencyCode The token symbol. Example: USD, BTC, ETH, etc.
 * @param domain? the domain of the issuer of the token,
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Cardano main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function xrpToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  issuerAddress: string,
  currencyCode: string,
  domain = '',
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.xrp,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new XrpCoin({
      id,
      name,
      fullName,
      network,
      issuerAddress,
      currencyCode,
      domain,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: true,
      primaryKeyCurve,
      baseUnit: BaseUnit.XRP,
    })
  );
}

/**
 * Factory function for testnet cardano token instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param issuerAddress: The address of the issuer of the token,
 * @param currencyCode The token symbol. Example: USD, BTC, ETH, etc.
 * @param domain? the domain of the issuer of the token,
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet Cardano network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 */
export function txrpToken(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  issuerAddress: string,
  currencyCode: string,
  domain = '',
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.xrp
) {
  return xrpToken(
    id,
    name,
    fullName,
    decimalPlaces,
    issuerAddress,
    currencyCode,
    domain,
    asset,
    features,
    prefix,
    suffix,
    network
  );
}

/**
 * Factory function for fiat coin instances.
 *
 * @param id uuid v4
 * @param name unique identifier of the coin, should start with 'fiat' or 'tfiat' followed by the 3-char ISO-4217 alphabetical code
 * @param fullName Complete human-readable name of the coin
 * @param network Network object for this coin
 * @param decimalPlaces Number of decimal places this coin supports (divisibility exponent)
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `FiatCoin`
 * @param primaryKeyCurve? The elliptic curve for this chain/token
 * @param prefix? Optional coin prefix. Defaults to empty string
 * @param suffix? Optional coin suffix. Defaults to coin name.
 * @param isToken? Whether or not this coin is a token of another coin
 */
export function fiat(
  id: string,
  name: FiatCoinName,
  fullName: string,
  network: BaseNetwork,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  features: CoinFeature[] = FiatCoin.DEFAULT_FEATURES,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1,
  prefix = '',
  suffix: string = name.toUpperCase(),
  isToken = false
) {
  return Object.freeze(
    new FiatCoin({
      id,
      name,
      fullName,
      network,
      prefix,
      suffix,
      features,
      decimalPlaces,
      isToken,
      asset,
      primaryKeyCurve,
      baseUnit: BaseUnit.FIAT,
    })
  );
}
