import { BaseCoin, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from './base';
import { InvalidContractAddressError, InvalidDomainError } from './errors';
import { AccountNetwork, BaseNetwork, EthereumNetwork, Networks, TronNetwork } from './networks';

export interface AccountConstructorOptions {
  fullName: string;
  name: string;
  alias?: string;
  network: AccountNetwork;
  asset: UnderlyingAsset;
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

export interface AcaCoinConstructorOptions extends AccountConstructorOptions {
  tokenSymbol: string;
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
    if (!options.contractAddress.match(/^0x[a-f0-9]{40}$/)) {
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

    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
    if (options.domain !== '' && !options.domain.match(domainPattern)) {
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
 * The Aca network supports tokens
 * Aca tokens are identified by their token symbol. i.e: AUSD, LDOT
 *
 */
export class AcaCoin extends AccountCoinToken {
  public tokenSymbol: string;
  constructor(options: AcaCoinConstructorOptions) {
    super({
      ...options,
    });

    this.tokenSymbol = options.tokenSymbol;
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
  name: string,
  fullName: string,
  network: AccountNetwork,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1,
  prefix = '',
  suffix: string = name.toUpperCase(),
  isToken = false
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
      primaryKeyCurve,
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
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function erc20(
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
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.kovan
) {
  return erc20(name, fullName, decimalPlaces, contractAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for erc721 token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet erc721 token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Goerli test network.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function terc721(
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.goerli,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return erc721(name, fullName, contractAddress, features, prefix, suffix, network, primaryKeyCurve);
}

/**
 * Factory function for erc1155 token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet erc1155 token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param contractAddress Contract address of this token
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES defined in `AccountCoin`
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Goerli test network.
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function terc1155(
  name: string,
  fullName: string,
  contractAddress: string,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: EthereumNetwork = Networks.test.goerli,
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return erc1155(name, fullName, contractAddress, features, prefix, suffix, network, primaryKeyCurve);
}

/**
 * Factory function for ERC20-compatible account coin instances.
 *
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
  name: string,
  fullName: string,
  network: EthereumNetwork,
  decimalPlaces: number,
  contractAddress: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = AccountCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.toUpperCase(),
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new Erc20CompatibleAccountCoin({
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
    })
  );
}

/**
 * Factory function for celo token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet celo token instances.
 *
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
  return celoToken(name, fullName, decimalPlaces, contractAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for Stellar token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet Stellar token instances.
 *
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
  return stellarToken(name, fullName, decimalPlaces, asset, domain, features, prefix, suffix, network);
}

/**
 * Factory function for tron token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet tron token instances.
 *
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
    })
  );
}

/**
 * Factory function for Hedera token instances
 *
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
    })
  );
}

/**
 * Factory function for ALGO token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet ALGO token instances.
 *
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
  return algoToken(name, alias, fullName, decimalPlaces, asset, tokenURL, features, prefix, suffix, network);
}

/**
 * Factory function for eos token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet eos token instances.
 *
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
  return eosToken(name, fullName, decimalPlaces, contractName, asset, features, prefix, suffix, network);
}

/**
 * Factory function for sol token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet solana token instances.
 *
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
  return solToken(name, fullName, decimalPlaces, tokenAddress, asset, features, prefix, suffix, network);
}

/**
 * Factory function for aca token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param tokenSymbol Token symbol of this token
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to Acala main network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES and REQUIRES_RESERVE defined in `AccountCoin`
 * @param primaryKeyCurve The elliptic curve for this chain/token
 */
export function acaToken(
  name: string,
  fullName: string,
  decimalPlaces: number,
  tokenSymbol: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.REQUIRES_RESERVE],
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.main.aca,
  primaryKeyCurve: KeyCurve = KeyCurve.Ed25519
) {
  return Object.freeze(
    new AcaCoin({
      name,
      fullName,
      network,
      tokenSymbol,
      prefix,
      suffix,
      features,
      decimalPlaces,
      asset,
      isToken: true,
      primaryKeyCurve,
    })
  );
}

/**
 * Factory function for testnet acala token instances.
 *
 * @param name unique identifier of the token
 * @param fullName Complete human-readable name of the token
 * @param decimalPlaces Number of decimal places this token supports (divisibility exponent)
 * @param tokenSymbol Token symbol of this token i.e: AUSD
 * @param asset Asset which this coin represents. This is the same for both mainnet and testnet variants of a coin.
 * @param prefix? Optional token prefix. Defaults to empty string
 * @param suffix? Optional token suffix. Defaults to token name.
 * @param network? Optional token network. Defaults to the testnet Acala network.
 * @param features? Features of this coin. Defaults to the DEFAULT_FEATURES and REQUIRES_RESERVE defined in `AccountCoin`
 */
export function tacaToken(
  name: string,
  fullName: string,
  decimalPlaces: number,
  tokenSymbol: string,
  asset: UnderlyingAsset,
  features: CoinFeature[] = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.REQUIRES_RESERVE],
  prefix = '',
  suffix: string = name.toUpperCase(),
  network: AccountNetwork = Networks.test.aca
) {
  return acaToken(name, fullName, decimalPlaces, tokenSymbol, asset, features, prefix, suffix, network);
}

/**
 * Factory function for avaxErc20 token instances.
 *
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
    })
  );
}

/**
 * Factory function for testnet avaxErc20 token instances.
 *
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
    })
  );
}

/**
 * Factory function for Mumbai testnet polygonErc20 token instances.
 *
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
 * Factory function for fiat coin instances.
 *
 * @param name unique identifier of the coin, should start with 'fiat' or 'tfiat'
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
    })
  );
}
