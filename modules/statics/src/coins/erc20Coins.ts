import { AccountCoin, erc20, Erc20Coin, terc20 } from '../account';
import { BaseCoin, BaseUnit, CoinFeature, CoinKind, KeyCurve, UnderlyingAsset } from '../base';
import { BaseNetwork, Networks, OfcNetwork } from '../networks';
import { erc20MasterTokens } from './erc20MasterTokens';

const DISALLOWED_FEATURES_IN_OFC = [
  CoinFeature.UNSPENT_MODEL,
  CoinFeature.CHILD_PAYS_FOR_PARENT,
  CoinFeature.PAYGO,
  CoinFeature.SUPPORTS_TOKENS,
  // OFC inherits features from the base asset but the features are not always applicable to OFC
  CoinFeature.SHARED_EVM_SIGNING,
  CoinFeature.EVM_COMPATIBLE_WP,
];

const REQUIRED_FEATURES_IN_OFC = [CoinFeature.ACCOUNT_MODEL, CoinFeature.REQUIRES_BIG_NUMBER];

const COIN_DEFAULT_FEATURES = [...AccountCoin.DEFAULT_FEATURES, CoinFeature.BULK_TRANSACTION];

export interface OfcConstructorOptions {
  id: string;
  fullName: string;
  name: string;
  network: BaseNetwork;
  asset: UnderlyingAsset;
  baseUnit: BaseUnit;
  features: CoinFeature[];
  decimalPlaces: number;
  isToken: boolean;
  kind: CoinKind;
  prefix?: string;
  suffix?: string;
  addressCoin?: string;
  primaryKeyCurve: KeyCurve;
}

class OfcCoin extends BaseCoin {
  public static readonly DEFAULT_FEATURES = [
    CoinFeature.ACCOUNT_MODEL,
    CoinFeature.REQUIRES_BIG_NUMBER,
    CoinFeature.CUSTODY,
    CoinFeature.CUSTODY_BITGO_TRUST,
    CoinFeature.CUSTODY_BITGO_MENA_FZE,
    CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
    CoinFeature.CUSTODY_BITGO_INDIA,
  ];

  // If set, this coin is the native address format for this token.
  public readonly addressCoin?: string;
  public readonly minimumDenomination: number;
  constructor(options: OfcConstructorOptions) {
    const { addressCoin, ...baseOptions } = options;
    super(baseOptions);
    this.addressCoin = addressCoin;
    this.minimumDenomination = Math.pow(10, this.decimalPlaces);
  }

  protected requiredFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>(REQUIRED_FEATURES_IN_OFC);
  }

  protected disallowedFeatures(): Set<CoinFeature> {
    return new Set<CoinFeature>(DISALLOWED_FEATURES_IN_OFC);
  }
}

function mergeFeatureWithOfcDefaultFeatures(customFeatures: CoinFeature[] | undefined): CoinFeature[] | undefined {
  if (!customFeatures || customFeatures.length === 0) {
    return undefined; // Use OfcCoin.DEFAULT_FEATURES
  }
  // Merge defaults with custom features, avoiding duplicates
  const merged = new Set([...OfcCoin.DEFAULT_FEATURES, ...customFeatures]);
  return Array.from(merged);
}

export function getFilteredFeatures(features: CoinFeature[]): CoinFeature[] {
  if (features.length == 0) {
    return [];
  }
  const filteredFeatures = features.filter((feature) => !DISALLOWED_FEATURES_IN_OFC.includes(feature));
  return [...filteredFeatures, ...REQUIRED_FEATURES_IN_OFC];
}

function ofcerc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  kind: CoinKind = CoinKind.CRYPTO,
  features: CoinFeature[] = OfcCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.replace(/^ofc/, '').toUpperCase(),
  network: OfcNetwork = Networks.main.ofc,
  isToken = true,
  addressCoin = 'eth',
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new OfcCoin({
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
      kind,
      addressCoin,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}

function tofcerc20(
  id: string,
  name: string,
  fullName: string,
  decimalPlaces: number,
  asset: UnderlyingAsset,
  kind: CoinKind = CoinKind.CRYPTO,
  features: CoinFeature[] = OfcCoin.DEFAULT_FEATURES,
  prefix = '',
  suffix: string = name.replace(/^ofc/, '').toUpperCase(),
  network: OfcNetwork = Networks.test.ofc,
  isToken = true,
  addressCoin = 'teth',
  primaryKeyCurve: KeyCurve = KeyCurve.Secp256k1
) {
  return Object.freeze(
    new OfcCoin({
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
      kind,
      addressCoin,
      primaryKeyCurve,
      baseUnit: BaseUnit.ETH,
    })
  );
}
/**
 * Generate mainnet and testnet ERC20 coins from the master token list.
 */
function generateAllERC20Coins(): Readonly<Erc20Coin>[] {
  const allErc20Coins: Readonly<Erc20Coin>[] = [];
  for (const coinDetail of erc20MasterTokens) {
    // generate mainnet ERC20 coins/tokens
    if (coinDetail.onchain && !coinDetail.isTestnet) {
      allErc20Coins.push(
        erc20(
          coinDetail.onchain.id,
          coinDetail.onchain.name,
          coinDetail.fullName,
          coinDetail.decimalPlaces,
          coinDetail.onchain.contractAddress,
          coinDetail.underlyingAsset,
          coinDetail.onchain.features,
          undefined, // prefix
          undefined, // suffix
          coinDetail.onchain.network // network - default to Ethereum mainnet
        )
      );
    }

    // generate testnet ERC20 coins/tokens
    if (coinDetail.onchain && coinDetail.isTestnet) {
      allErc20Coins.push(
        terc20(
          coinDetail.onchain.id,
          coinDetail.onchain.name,
          coinDetail.fullName,
          coinDetail.decimalPlaces,
          coinDetail.onchain.contractAddress,
          coinDetail.underlyingAsset,
          coinDetail.onchain.features || coinDetail.features,
          undefined, // prefix
          undefined, // suffix
          coinDetail.onchain.network // network - default to Holesky testnet
        )
      );
    }
  }
  return allErc20Coins;
}

/**
 * Generate mainnet and testnet OFC ERC20 coins from the master token list.
 */
function generateAllOFCERC20Coins(): Readonly<OfcCoin>[] {
  const allOFCErc20Coins: Readonly<OfcCoin>[] = [];
  for (const coinDetail of erc20MasterTokens) {
    let features = mergeFeatureWithOfcDefaultFeatures(coinDetail?.offchain?.features);
    const filteredFeatures: CoinFeature[] | undefined = coinDetail.onchain
      ? getFilteredFeatures(coinDetail.onchain.features || COIN_DEFAULT_FEATURES)
      : [];
    if (filteredFeatures.length > 0) {
      features = filteredFeatures;
    }

    // generate mainnet OFC ERC20 coins (onchain, not testnet)
    if (coinDetail.offchain && !coinDetail.isTestnet) {
      allOFCErc20Coins.push(
        ofcerc20(
          coinDetail.offchain.id,
          coinDetail.offchain.name,
          coinDetail.fullName,
          coinDetail.decimalPlaces,
          coinDetail.underlyingAsset,
          undefined, // kind - defaults to CoinKind.CRYPTO
          features,
          undefined, // prefix
          undefined, // suffix
          coinDetail.offchain.network, // network - default to OFC mainnet
          undefined, // isToken
          coinDetail.offchain.addressCoin // addressCoin - default to 'eth'
        )
      );
    }

    // generate testnet OFC ERC20 coins (onchain, not testnet)
    if (coinDetail.offchain && coinDetail.isTestnet) {
      allOFCErc20Coins.push(
        tofcerc20(
          coinDetail.offchain.id,
          coinDetail.offchain.name,
          coinDetail.fullName,
          coinDetail.decimalPlaces,
          coinDetail.underlyingAsset,
          undefined, // kind - defaults to CoinKind.CRYPTO
          features,
          undefined, // prefix
          undefined, // suffix
          coinDetail.offchain.network, // network - default to OFC testnet
          undefined, // isToken
          coinDetail.offchain.addressCoin // addressCoin - default to 'hteth' (holesky testnet)
        )
      );
    }
  }
  return allOFCErc20Coins;
}

export const ofcErc20Coins = [...generateAllOFCERC20Coins()];
export const erc20Coins = [...generateAllERC20Coins(), ...ofcErc20Coins];
