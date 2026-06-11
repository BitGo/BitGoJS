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
  jettonToken,
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
  adaToken,
  erc20Token,
  erc721Token,
} from './account';
import { ofcToken } from './ofc';
import { BaseCoin, CoinFeature, DynamicCoin } from './base';
import { AmsNetworkConfigMap, AmsTokenConfig, TrimmedAmsTokenConfig } from './tokenConfig';
import { CoinMap } from './map';
import { BaseNetwork, getNetwork, getNetworksMap, NetworkType } from './networks';
import { getNetworkFeatures } from './networkFeatureMapForTokens';
import { ofcErc20Coins, tOfcErc20Coins } from './coins/ofcErc20Coins';
import { ofcHoodethTokens } from './coins/ofcHoodethTokens';
import { ofcCoins } from './coins/ofcCoins';
import { allCoinsAndTokens } from './allCoinsAndTokens';
import { botOfcTokens } from './coins/botOfcTokens';

export const coins = CoinMap.fromCoins([
  ...allCoinsAndTokens,
  ...ofcErc20Coins,
  ...ofcHoodethTokens,
  ...tOfcErc20Coins,
  ...ofcCoins,
  ...botOfcTokens,
]);

// Build a map of ERC20-supporting chain family names to their mainnet coin names
// Maps family -> coin name (e.g., 'ip' -> 'ip')
const erc20ChainToNameMap: Record<string, string> = {};

allCoinsAndTokens.forEach((coin) => {
  if (
    coin.features.includes(CoinFeature.SUPPORTS_ERC20) &&
    coin.network.type === NetworkType.MAINNET &&
    !coin.isToken
  ) {
    erc20ChainToNameMap[coin.family] = coin.name;
  }
});

const erc721ChainToNameMap: Record<string, string> = {};
allCoinsAndTokens.forEach((coin) => {
  if (
    coin.features.includes(CoinFeature.SUPPORTS_ERC721) &&
    coin.network.type === NetworkType.MAINNET &&
    !coin.isToken
  ) {
    erc721ChainToNameMap[coin.family] = coin.name;
  }
});

export function createToken(token: AmsTokenConfig): Readonly<BaseCoin> | undefined {
  if (!token.isToken) {
    try {
      return buildDynamicCoin(token);
    } catch (error) {
      console.warn(`Failed to build dynamic coin for ${token.name} (${token.id}):`, error);
      return undefined;
    }
  }
  const initializerMap: Record<string, unknown> = {
    algo: algoToken,
    apt: aptToken,
    arbeth: arbethErc20,
    avaxc: avaxErc20,
    baseeth: erc20Token,
    bera: beraErc20,
    flow: erc20Token,
    lineaeth: erc20Token,
    seievm: erc20Token,
    mon: erc20Token,
    xdc: erc20Token,
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
    ada: adaToken,
    ton: jettonToken,
  };

  // EVM-compatible chains are identified by a numeric chainId on their network object.
  const tokenNetwork = token.network instanceof BaseNetwork ? token.network : undefined;
  if (
    tokenNetwork &&
    'chainId' in tokenNetwork &&
    typeof (tokenNetwork as { chainId?: unknown }).chainId === 'number'
  ) {
    if (!erc20ChainToNameMap[token.family]) {
      erc20ChainToNameMap[token.family] = token.family;
    }
  }

  // dynamically add erc20 token initializers for eth like chains to the initializer map
  Object.keys(erc20ChainToNameMap).forEach((key) => {
    initializerMap[key] = erc20Token;
  });

  Object.keys(erc721ChainToNameMap).forEach((key) => {
    initializerMap[key] = erc721Token;
  });

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
    case erc20ChainToNameMap[family]:
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.contractAddress || token.tokenAddress, // contractAddress
        token.asset,
        token.network,
        token.features,
        token.prefix,
        token.suffix,
        token.primaryKeyCurve
      );
    case erc721ChainToNameMap[family]:
      return initializer(
        ...commonArgs.slice(0, 3), // id, name, fullName
        token.contractAddress, // contractAddress
        token.network,
        token.features,
        token.prefix,
        token.suffix,
        token.primaryKeyCurve
      );
    case 'arbeth':
    case 'avaxc':
    case 'baseeth':
    case 'bera':
    case 'bsc':
    case 'flow':
    case 'lineaeth':
    case 'seievm':
    case 'mon':
    case 'xdc':
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
        token.asset,
        token.features,
        token.programId,
        ...commonArgs.slice(6) // prefix, suffix, network, primaryKeyCurve
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
        token.kind, // kind
        token.addressCoin // addressCoin
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
    case 'ada':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.assetName,
        token.policyId,
        token.contractAddress,
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );
    case 'ton':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );
    default:
      return undefined;
  }
}

/**
 * Build a real DynamicCoin + DynamicNetwork instance for AMS-discovered base chains
 * whose family is not yet registered in the SDK's initializerMap.
 * Called from createToken() as a fallback when no initializer exists and isToken is false.
 */
function buildDynamicCoin(token: AmsTokenConfig): Readonly<BaseCoin> {
  const network = token.network instanceof BaseNetwork ? token.network : getNetwork(token.network as string);

  return Object.freeze(
    new DynamicCoin({
      id: token.id,
      name: token.name,
      fullName: token.fullName,
      decimalPlaces: token.decimalPlaces,
      asset: token.asset as string,
      isToken: token.isToken,
      features: (token.features ?? []) as string[],
      network,
      primaryKeyCurve: (token.primaryKeyCurve as string) ?? 'secp256k1',
      prefix: token.prefix ?? '',
      suffix: token.suffix ?? token.name.toUpperCase(),
      baseUnit: (token.baseUnit as string) ?? '',
      kind: (token.kind as string) ?? 'crypto',
      alias: token.alias,
    })
  );
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
    'terc721:hoodidj',
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

  // Accumulates both static and already-accepted AMS tokens so AMS-vs-AMS contract address
  // conflicts are caught in addition to static-vs-AMS conflicts.
  const accumulatedMap = CoinMap.fromCoins(Array.from(BaseCoins.values()));

  // add the tokens not present in the static coin map
  for (const tokenConfigs of Object.values(tokenConfigMap)) {
    if (!tokenConfigs.length) continue;
    const tokenConfig = tokenConfigs[0];

    if (!isCoinPresentInCoinMap({ ...tokenConfig }) && !nftAndOtherTokens.has(tokenConfig.name)) {
      try {
        const token = createToken(tokenConfig);
        // A token whose name is absent from the accumulated map can still reuse a contract address
        // (or NFT collection id) already claimed by a static or previously-accepted AMS token.
        // Adding it would make the final CoinMap.fromCoins throw, so skip it instead.
        if (token && !accumulatedMap.hasTokenAddressConflict(token)) {
          BaseCoins.set(token.name, token);
          accumulatedMap.addCoin(token);
        } else if (token) {
          console.warn(
            `Skipping token with conflicting contract address or NFT collection id: name="${tokenConfig.name}" id="${tokenConfig.id}"`
          );
        }
      } catch (e) {
        console.warn(
          `Skipping malformed token: name="${tokenConfig.name}" id="${tokenConfig.id}" family="${
            tokenConfig.family
          }" error=${(e as Error).message}`
        );
      }
    }
  }

  return CoinMap.fromCoins(Array.from(BaseCoins.values()));
}

/**
 * Enrich base chain coins (isToken=false) with features from the AMS networks map.
 *
 * createTokenMapUsingTrimmedConfigDetails reads features for base chains from
 * TrimmedAmsTokenConfig.additionalFeatures. The assetsList endpoint returns base chains with no features;
 * features are in the networks endpoint (/api/v1/networks/:network), matched by coin.network.name === networksEntry.name.
 *
 * Coins that already have additionalFeatures defined are left unchanged.
 * Coins whose network.name has no match in networksMap are left unchanged (empty features).
 */
export function enrichBaseChainFeatures(
  coinTokenMap: Record<string, TrimmedAmsTokenConfig[]>,
  networksMap: AmsNetworkConfigMap
): Record<string, TrimmedAmsTokenConfig[]> {
  const featuresByNetworkName = new Map<string, string[]>(
    Object.values(networksMap).map((net): [string, string[]] => [net.name, net.features])
  );
  return Object.fromEntries(
    Object.entries(coinTokenMap).map(([key, coins]) => [
      key,
      coins.map((coin) => {
        if (coin.isToken || coin.additionalFeatures !== undefined || coin.network === undefined) return coin;
        const features = featuresByNetworkName.get(coin.network.name);
        return features !== undefined ? { ...coin, additionalFeatures: features } : coin;
      }),
    ])
  );
}

export function createTokenMapUsingTrimmedConfigDetails(
  reducedTokenConfigMap: Record<string, TrimmedAmsTokenConfig[]>
): CoinMap {
  const amsTokenConfigMap: Record<string, AmsTokenConfig[]> = {};
  const networkNameMap = getNetworksMap();

  for (const tokenConfigs of Object.values(reducedTokenConfigMap)) {
    if (!tokenConfigs.length) continue;
    const tokenConfig = tokenConfigs[0];
    const network = networkNameMap.get(tokenConfig.network.name);

    if (isCoinPresentInCoinMap({ ...tokenConfig })) continue;

    if (!tokenConfig.isToken) {
      // Dynamic base chain — network must be pre-registered in networkByName map before calling this function.
      if (network) {
        amsTokenConfigMap[tokenConfig.name] = [
          { ...tokenConfig, features: tokenConfig.additionalFeatures ?? [], network },
        ];
      }
    } else if (network && getNetworkFeatures(network.family as string)) {
      const features = new Set([
        ...(getNetworkFeatures(network.family as string) || []),
        ...(tokenConfig.additionalFeatures || []),
      ]);
      tokenConfig.excludedFeatures?.forEach((feature) => features.delete(feature));
      amsTokenConfigMap[tokenConfig.name] = [{ ...tokenConfig, features: Array.from(features), network }];
    }
  }

  return createTokenMapUsingConfigDetails(amsTokenConfigMap);
}

export function createTokenUsingTrimmedConfigDetails(
  tokenConfig: TrimmedAmsTokenConfig
): Readonly<BaseCoin> | undefined {
  let fullTokenConfig: AmsTokenConfig | undefined;
  const networkNameMap = getNetworksMap();
  const network = networkNameMap.get(tokenConfig.network.name);

  if (isCoinPresentInCoinMap({ ...tokenConfig })) return undefined;

  if (!tokenConfig.isToken) {
    // Dynamic base chain — network must be pre-registered in networkByName map before calling this function.
    if (network) {
      return createToken({ ...tokenConfig, features: tokenConfig.additionalFeatures ?? [], network } as AmsTokenConfig);
    }
    return undefined;
  }

  if (network && getNetworkFeatures(network.family as string)) {
    const features = new Set([
      ...(getNetworkFeatures(network.family as string) || []),
      ...(tokenConfig.additionalFeatures || []),
    ]);
    tokenConfig.excludedFeatures?.forEach((feature) => features.delete(feature));
    fullTokenConfig = { ...tokenConfig, features: Array.from(features), network } as AmsTokenConfig;
    return createToken(fullTokenConfig);
  }
}
