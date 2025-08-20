import {
  algoToken,
  aptNFTCollection,
  aptToken,
  arbethErc20,
  avaxErc20,
  beraErc20,
  bscToken,
  celoToken,
  cosmosToken,
  eosToken,
  erc20,
  hederaToken,
  nep141Token,
  opethErc20,
  polygonErc20,
  polyxToken,
  sip10Token,
  solToken,
  stellarToken,
  suiToken,
  taoToken,
  tronToken,
  vetNFTCollection,
  vetToken,
  xrpToken,
} from './account';
import { ofcToken } from './ofc';
import { BaseCoin, CoinFamily } from './base';
import { AmsTokenConfig, TrimmedAmsTokenConfig } from './tokenConfig';
import { CoinMap } from './map';
import { Networks } from './networks';
import { networkFeatureMapForTokens } from './networkFeatureMapForTokens';
import { ofcErc20Coins, tOfcErc20Coins } from './coins/ofcErc20Coins';
import { ofcCoins } from './coins/ofcCoins';
import { allCoinsAndTokens } from './allCoinsAndTokens';

export const coins = CoinMap.fromCoins([...allCoinsAndTokens, ...ofcErc20Coins, ...tOfcErc20Coins, ...ofcCoins]);

export function createToken(token: AmsTokenConfig): Readonly<BaseCoin> | undefined {
  const initializerMap: Record<string, unknown> = {
    algo: algoToken,
    apt: aptToken,
    arbeth: arbethErc20,
    avaxc: avaxErc20,
    bera: beraErc20,
    bsc: bscToken,
    celo: celoToken,
    cosmos: cosmosToken,
    eth: erc20,
    eos: eosToken,
    hbar: hederaToken,
    near: nep141Token,
    opeth: opethErc20,
    polygon: polygonErc20,
    sol: solToken,
    stx: sip10Token,
    sui: suiToken,
    tao: taoToken,
    polyx: polyxToken,
    trx: tronToken,
    vet: vetToken,
    xlm: stellarToken,
    xrp: xrpToken,
    ofc: ofcToken,
  };

  //return the BaseCoin from default coin map if present
  if (isCoinPresentInCoinMap({ ...token })) {
    if (coins.has(token.name)) {
      return coins.get(token.name);
    }
    if (coins.has(token.id)) {
      return coins.get(token.id);
    }
    if (token.alias && coins.has(token.alias)) {
      return coins.get(token.alias);
    }
  }
  const family = token.family;
  const initializer = initializerMap[family] as (...args: unknown[]) => Readonly<BaseCoin>;
  if (!initializer) {
    return undefined;
  }

  const commonArgs = [
    token.id,
    token.name,
    token.fullName,
    token.decimalPlaces,
    token.asset,
    token.features,
    token.prefix,
    token.suffix,
    token.network,
    token.primaryKeyCurve,
  ];

  switch (family) {
    case 'arbeth':
    case 'avax':
    case 'bera':
    case 'bsc':
    case 'celo':
    case 'eth':
    case 'opeth':
    case 'polygon':
    case 'trx':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.contractAddress || token.tokenAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'apt':
      const { initFunc, objectId } = getAptTokenInitializer(token);
      return initFunc(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        objectId,
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'vet':
      const { vetInitFunc, vetObjectId, isNFT } = getVetTokenInitializer(token);
      if (isNFT) {
        return vetInitFunc(
          ...commonArgs.slice(0, 3), // id, name, fullName
          vetObjectId,
          ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
        );
      } else {
        return vetInitFunc(
          ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
          vetObjectId,
          ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
        );
      }

    case 'stx':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.assetId, // assetId
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'algo':
      return initializer(
        ...commonArgs.slice(0, 2), // id, name
        token.alias, // alias
        ...commonArgs.slice(2) // fullName, decimal, asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'eos':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.contractName, // contractName
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4, 8), // asset, features, prefix, suffix
        token.symbol, // symbol
        ...commonArgs.slice(8) // network, primaryKeyCurve
      );

    case 'hbar':
      return initializer(
        ...commonArgs.slice(0, 3), // id, name, fullName
        token.network, // network
        token.decimalPlaces,
        token.asset,
        token.contractAddress, // contractAddress
        ...commonArgs.slice(5, 8), // features, prefix, suffix
        token.primaryKeyCurve
      );

    case 'sol':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.tokenAddress, // tokenAddress
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'sui':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.packageId, // packageId
        token.module, // module
        token.symbol, // symbol
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'tao':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.subnetId, // subnetId
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );
    case 'polyx':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.ticker, // ticker
        token.assetId, // assetId
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'xlm':
      return initializer(
        ...commonArgs.slice(0, 5), // id, name, fullName, decimalPlaces, asset
        token.domain, // domain
        ...commonArgs.slice(5) // features, prefix, suffix, network, primaryKeyCurve
      );

    case 'xrp':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.issuerAddress, // issuerAddress
        token.currecnycode, // currencyCode
        token.contractAddress, // contractAddress
        token.domain, // domain
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );
    case 'ofc':
      return initializer(
        ...commonArgs, // id, name, fullName, decimalPlaces, asset, prefix, suffix, network, primaryKeyCurve
        token.baseUnit, // baseUnit
        token.isToken, // isToken
        token.kind // kind
      );
    case 'asi':
    case 'atom':
    case 'baby':
    case 'bld':
    case 'coreum':
    case 'cronos':
    case 'hash':
    case 'injective':
    case 'initia':
    case 'osmo':
    case 'thor':
    case 'sei':
    case 'tia':
    case 'zeta':
      return initializer(
        ...commonArgs.slice(0, 3), // id, name, fullName
        token.denom, // denom
        token.decimalPlaces, // decimalPlaces
        token.network, // network
        token.baseUnit, // baseUnit
        ...commonArgs.slice(4, 8), // asset, features, prefix, suffix
        token.primaryKeyCurve // primaryKeyCurve
      );
    default:
      return undefined;
  }
}

function getAptTokenInitializer(token: AmsTokenConfig) {
  if (token.assetId) {
    // used for fungible-assets / legacy coins etc.
    return {
      initFunc: aptToken as (...args: unknown[]) => Readonly<BaseCoin>,
      objectId: token.assetId,
    };
  }
  // used for non-fungible token (NFT) collections
  return {
    initFunc: aptNFTCollection as (...args: unknown[]) => Readonly<BaseCoin>,
    objectId: token.nftCollectionId,
  };
}

function getVetTokenInitializer(token: AmsTokenConfig) {
  if (token.nftCollectionId) {
    return {
      vetInitFunc: vetNFTCollection as (...args: unknown[]) => Readonly<BaseCoin>,
      vetObjectId: token.nftCollectionId,
      isNFT: true,
    };
  }

  return {
    vetInitFunc: vetToken as (...args: unknown[]) => Readonly<BaseCoin>,
    vetObjectId: token.contractAddress,
    isNFT: false,
  };
}

export function isCoinPresentInCoinMap({ name, id, alias }: { name: string; id?: string; alias?: string }): boolean {
  return Boolean(coins.has(name) || (id && coins.has(id)) || (alias && coins.has(alias)));
}

export function createTokenMapUsingConfigDetails(tokenConfigMap: Record<string, AmsTokenConfig[]>): CoinMap {
  const BaseCoins: Map<string, Readonly<BaseCoin>> = new Map();

  const nftAndOtherTokens = new Set([
    'erc721:bsctoken',
    'terc721:bsctoken',
    'erc1155:bsctoken',
    'terc1155:bsctoken',
    'erc721:witch',
    'erc721:token',
    'erc1155:token',
    'nonstandard:token',
    'terc721:token',
    'terc1155:token',
    'tnonstandard:token',
    'terc721:bitgoerc721',
    'terc1155:bitgoerc1155',
    'erc721:polygontoken',
    'erc1155:polygontoken',
    'terc721:polygontoken',
    'terc1155:polygontoken',
    'erc721:soneiumtoken',
    'erc1155:soneiumtoken',
    'terc721:soneiumtoken',
    'terc1155:soneiumtoken',
  ]);

  // Add all the coins from statics coin map first
  coins.forEach((coin, coinName) => {
    BaseCoins.set(coinName, coin);
  });

  // add the tokens not present in the static coin map
  for (const tokenConfigs of Object.values(tokenConfigMap)) {
    const tokenConfig = tokenConfigs[0];

    if (
      !isCoinPresentInCoinMap({ ...tokenConfig }) &&
      tokenConfig.isToken &&
      !nftAndOtherTokens.has(tokenConfig.name)
    ) {
      const token = createToken(tokenConfig);
      if (token) {
        BaseCoins.set(token.name, token);
      }
    }
  }

  return CoinMap.fromCoins(Array.from(BaseCoins.values()));
}

export function createTokenMapUsingTrimmedConfigDetails(
  reducedTokenConfigMap: Record<string, TrimmedAmsTokenConfig[]>
): CoinMap {
  const amsTokenConfigMap: Record<string, AmsTokenConfig[]> = {};
  const networkNameMap = new Map(
    Object.values(Networks).flatMap((networkType) =>
      Object.values(networkType).map((network) => [network.name, network])
    )
  );

  for (const tokenConfigs of Object.values(reducedTokenConfigMap)) {
    const tokenConfig = tokenConfigs[0];
    const network = networkNameMap.get(tokenConfig.network.name);
    if (
      !isCoinPresentInCoinMap({ ...tokenConfig }) &&
      network &&
      tokenConfig.isToken &&
      networkFeatureMapForTokens[network.family as CoinFamily]
    ) {
      const features = new Set([
        ...(networkFeatureMapForTokens[network.family as CoinFamily] || []),
        ...(tokenConfig.additionalFeatures || []),
      ]);
      tokenConfig.excludedFeatures?.forEach((feature) => features.delete(feature));
      amsTokenConfigMap[tokenConfig.name] = [{ ...tokenConfig, features: Array.from(features), network }];
    }
  }

  return createTokenMapUsingConfigDetails(amsTokenConfigMap);
}
