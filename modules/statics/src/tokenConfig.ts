import {
  AlgoCoin,
  AptCoin,
  AptNFTCollection,
  ArbethERC20Token,
  AvaxERC20Token,
  BeraERC20Token,
  BscCoin,
  CeloCoin,
  CoredaoERC20Token,
  CosmosChainToken,
  EosCoin,
  Erc1155Coin,
  Erc20Coin,
  Erc721Coin,
  EthLikeERC20Token,
  EthLikeERC721Token,
  FlrERC20Token,
  MonERC20Token,
  XdcERC20Token,
  HederaToken,
  Nep141Token,
  OpethERC20Token,
  PolygonERC20Token,
  Sip10Token,
  SolCoin,
  StellarCoin,
  SuiCoin,
  TaoCoin,
  PolyxCoin,
  TronErc20Coin,
  VetToken,
  WorldERC20Token,
  XrpCoin,
  ZkethERC20Token,
  VetNFTCollection,
  AdaToken,
  JettonToken,
  AccountCoin,
} from './account';
import { CoinFamily, CoinKind, BaseCoin, CoinFeature } from './base';
import { coins } from './coins';
import { Networks, NetworkType } from './networks';
import { OfcCoin } from './ofc';

export interface BaseTokenConfig {
  coin: string;
  decimalPlaces: number;
  name: string;
  type: string;
}

export interface BaseNetworkConfig extends BaseTokenConfig {
  network: string;
}

export interface BaseContractAddressConfig extends BaseNetworkConfig {
  tokenContractAddress: string;
}

export type AvaxcTokenConfig = BaseContractAddressConfig;
export type CeloTokenConfig = BaseContractAddressConfig;
export type EthLikeTokenConfig = BaseContractAddressConfig;
export type EosTokenConfig = BaseContractAddressConfig & {
  contractName: string;
  contractAddress: string;
};
export type Erc20TokenConfig = BaseContractAddressConfig;
export type TrxTokenConfig = BaseContractAddressConfig;
export type StellarTokenConfig = BaseNetworkConfig;

export type SolTokenConfig = BaseNetworkConfig & {
  tokenAddress: string;
  contractAddress: string;
};

export type AdaTokenConfig = BaseNetworkConfig & {
  policyId: string;
  assetName: string;
  contractAddress: string;
};

export type AlgoTokenConfig = BaseNetworkConfig & {
  alias?: string;
};

export type OfcTokenConfig = BaseTokenConfig & {
  backingCoin: string;
  isFiat: boolean;
};

export type HbarTokenConfig = BaseNetworkConfig & {
  nodeAccountId: string;
  tokenId: string;
  contractAddress: string;
};

export type XrpTokenConfig = BaseNetworkConfig & {
  issuerAddress: string;
  currencyCode: string;
  domain?: string;
  contractAddress: string;
};

export type SuiTokenConfig = BaseNetworkConfig & {
  packageId: string;
  module: string;
  symbol: string;
  contractAddress: string;
};

export type AptTokenConfig = BaseNetworkConfig & {
  assetId: string;
};

export type AptNFTCollectionConfig = BaseNetworkConfig & {
  nftCollectionId: string;
};

export type Sip10TokenConfig = BaseNetworkConfig & {
  assetId: string;
};

export type TaoTokenConfig = BaseNetworkConfig & {
  subnetId: string;
};

export type PolyxTokenConfig = BaseNetworkConfig & {
  ticker: string;
  assetId: string;
};

export type Nep141TokenConfig = BaseNetworkConfig & {
  contractAddress: string;
  storageDepositAmount: string;
};

export type VetTokenConfig = BaseNetworkConfig & {
  contractAddress: string;
};

export type VetNFTCollectionConfig = BaseNetworkConfig & {
  nftCollectionId: string;
};

export type CosmosTokenConfig = BaseNetworkConfig & {
  denom: string;
};

export type JettonTokenConfig = BaseNetworkConfig & {
  contractAddress: string;
};

export type EthLikeERC721TokenConfig = BaseContractAddressConfig & {
  network: string;
};

export type Tip20TokenConfig = BaseContractAddressConfig;

export type TokenConfig =
  | Erc20TokenConfig
  | StellarTokenConfig
  | OfcTokenConfig
  | CeloTokenConfig
  | EthLikeTokenConfig
  | EosTokenConfig
  | AvaxcTokenConfig
  | SolTokenConfig
  | HbarTokenConfig
  | AdaTokenConfig
  | AlgoTokenConfig
  | TrxTokenConfig
  | XrpTokenConfig
  | SuiTokenConfig
  | AptTokenConfig
  | AptNFTCollectionConfig
  | Sip10TokenConfig
  | Nep141TokenConfig
  | CosmosTokenConfig
  | VetTokenConfig
  | VetNFTCollectionConfig
  | TaoTokenConfig
  | PolyxTokenConfig
  | JettonTokenConfig
  | EthLikeERC721TokenConfig
  | Tip20TokenConfig;

export interface TokenNetwork {
  eth: {
    tokens: Erc20TokenConfig[];
    nfts: EthLikeTokenConfig[];
  };
  xlm: { tokens: StellarTokenConfig[] };
  algo: { tokens: AlgoTokenConfig[] };
  ofc: { tokens: OfcTokenConfig[] };
  celo: { tokens: CeloTokenConfig[] };
  eos: { tokens: EosTokenConfig[] };
  avaxc: { tokens: AvaxcTokenConfig[] };
  polygon: { tokens: EthLikeTokenConfig[] };
  soneium: { tokens: EthLikeTokenConfig[] };
  bsc: { tokens: EthLikeTokenConfig[] };
  arbeth: { tokens: EthLikeTokenConfig[] };
  opeth: { tokens: EthLikeTokenConfig[] };
  baseeth: { tokens: EthLikeTokenConfig[] };
  og: { tokens: EthLikeTokenConfig[] };
  flow: { tokens: EthLikeTokenConfig[] };
  lineaeth: { tokens: EthLikeTokenConfig[] };
  seievm: { tokens: EthLikeTokenConfig[] };
  coredao: { tokens: EthLikeTokenConfig[] };
  world: { tokens: EthLikeTokenConfig[] };
  flr: { tokens: EthLikeTokenConfig[] };
  sol: { tokens: SolTokenConfig[] };
  hbar: { tokens: HbarTokenConfig[] };
  ada: { tokens: AdaTokenConfig[] };
  trx: { tokens: TrxTokenConfig[] };
  xrp: { tokens: XrpTokenConfig[] };
  zketh: { tokens: EthLikeTokenConfig[] };
  sui: { tokens: SuiTokenConfig[] };
  tao: { tokens: TaoTokenConfig[] };
  polyx: { tokens: PolyxTokenConfig[] };
  bera: { tokens: EthLikeTokenConfig[] };
  mon: { tokens: EthLikeTokenConfig[] };
  xdc: { tokens: EthLikeTokenConfig[] };
  ip: { tokens: EthLikeTokenConfig[] };
  apt: {
    tokens: AptTokenConfig[];
    nftCollections: AptNFTCollectionConfig[];
  };
  stx: { tokens: Sip10TokenConfig[] };
  near: { tokens: Nep141TokenConfig[] };
  vet: {
    tokens: VetTokenConfig[];
    nftCollections: VetNFTCollectionConfig[];
  };
  cosmos: { tokens: CosmosTokenConfig[] };
  ton: { tokens: JettonTokenConfig[] };
  tempo: { tokens: Tip20TokenConfig[] };
}

export interface Tokens {
  bitcoin: TokenNetwork;
  testnet: TokenNetwork;
}

export interface AmsTokenConfig {
  id: string;
  name: string;
  fullName: string;
  family: string;
  decimalPlaces: number;
  asset: string;
  features?: string[];
  prefix?: string;
  suffix?: string;
  network?: unknown;
  primaryKeyCurve?: string;
  contractAddress?: string;
  tokenAddress?: string;
  nftCollectionId?: string;
  alias?: string;
  contractName?: string;
  tokenId?: string;
  packageId?: string;
  module?: string;
  symbol?: string;
  issuerAddress?: string;
  currecnycode?: string;
  domain?: string;
  assetId?: string;
  denom?: string;
  isToken: boolean;
  baseUnit?: string;
  kind?: string;
  subnetId?: string;
  ticker?: string;
  programId?: string;
  addressCoin?: string;
  assetName?: string;
  policyId?: string;
}

export interface TrimmedAmsNetworkConfig {
  name: string;
}
export interface TrimmedAmsTokenConfig extends Omit<AmsTokenConfig, 'features' | 'network'> {
  network: TrimmedAmsNetworkConfig;
  excludedFeatures?: string[];
  additionalFeatures?: string[];
}

function getErc20TokenConfig(coin: Erc20Coin): Erc20TokenConfig {
  let baseCoin: string;
  switch (coin.network.name) {
    case Networks.main.ethereum.name:
      baseCoin = 'eth';
      break;
    case Networks.test.kovan.name:
      baseCoin = 'teth';
      break;
    case Networks.test.goerli.name:
      baseCoin = 'gteth';
      break;
    case Networks.test.holesky.name:
    case Networks.test.hoodi.name:
      baseCoin = 'hteth';
      break;
    default:
      throw new Error(`Erc20 token ${coin.name} has an unsupported network`);
  }
  return {
    type: coin.name,
    coin: baseCoin,
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}

// Get the list of ERC-20 tokens from statics and format it properly
const getFormattedErc20Tokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: Erc20TokenConfig[], coin) => {
    if (coin instanceof Erc20Coin) {
      acc.push(getErc20TokenConfig(coin));
    }
    return acc;
  }, []);

export const ethGasConfigs = {
  minimumGasPrice: 1000000000, // minimum gas price a user can provide (1 Gwei)
  defaultGasPrice: 20000000000, // default gas price if estimation fails (20 Gwei)
  maximumGasPrice: 2500000000000, // minimum gas price a user can provide (2500 Gwei)
  defaultGasLimit: 500000, // Default gas limit we set for contract send
  defaultGasLimitTokenSend: 1000000, // Default gas limit we set for token send
  minimumGasLimit: 30000, // minimum gas limit a user can set for a send
  maximumGasLimit: 20000000, // Customers cannot set gas limits beyond this amount
  newEthLikeCoinsMinGasLimit: 400000, // minimum gas limit a user can set for a send for eth like coins like arbitrum, optimism, etc
  opethGasL1Fees: 1000000000000000, // Buffer for opeth L1 gas fees
};

function getStellarTokenConfig(coin: StellarCoin): StellarTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'xlm' : 'txlm',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
  };
}
// Get the list of Stellar tokens from statics and format it properly
const getFormattedStellarTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: StellarTokenConfig[], coin) => {
    if (coin instanceof StellarCoin) {
      acc.push(getStellarTokenConfig(coin));
    }
    return acc;
  }, []);

function getOfcTokenConfig(coin: OfcCoin): OfcTokenConfig {
  return {
    type: coin.name,
    coin: 'ofc',
    backingCoin: coin.asset,
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
    isFiat: coin.kind === CoinKind.FIAT,
  };
}
// Get the list of OFC tokens from statics and format it properly
const getFormattedOfcCoins = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: OfcTokenConfig[], coin) => {
    if (coin instanceof OfcCoin) {
      acc.push(getOfcTokenConfig(coin));
    }
    return acc;
  }, []);

function getCeloTokenConfig(coin: CeloCoin): CeloTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'celo' : 'tcelo',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedCeloTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: CeloTokenConfig[], coin) => {
    if (coin instanceof CeloCoin) {
      acc.push(getCeloTokenConfig(coin));
    }
    return acc;
  }, []);

function getBscTokenConfig(coin: BscCoin): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'bsc' : 'tbsc',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedBscTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof BscCoin) {
      acc.push(getBscTokenConfig(coin));
    }
    return acc;
  }, []);

function getEosTokenConfig(coin: EosCoin): EosTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'eos' : 'teos',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractName.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
    contractName: coin.contractName,
    contractAddress: coin.contractAddress,
  };
}
const getFormattedEosTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EosTokenConfig[], coin) => {
    if (coin instanceof EosCoin) {
      acc.push(getEosTokenConfig(coin));
    }
    return acc;
  }, []);

function getAvaxCTokenConfig(coin: AvaxERC20Token): AvaxcTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'avaxc' : 'tavaxc',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedAvaxCTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: AvaxcTokenConfig[], coin) => {
    if (coin instanceof AvaxERC20Token) {
      acc.push(getAvaxCTokenConfig(coin));
    }
    return acc;
  }, []);

function getPolygonTokenConfig(coin: PolygonERC20Token | Erc721Coin | Erc1155Coin): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'polygon' : 'tpolygon',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedPolygonTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (
      coin instanceof PolygonERC20Token ||
      ((coin instanceof Erc721Coin || coin instanceof Erc1155Coin) && coin.family === CoinFamily.POLYGON)
    ) {
      acc.push(getPolygonTokenConfig(coin));
    }
    return acc;
  }, []);

function getSoneiumTokenConfig(coin: Erc721Coin | Erc1155Coin): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'soneium' : 'tsoneium',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedSoneiumTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if ((coin instanceof Erc721Coin || coin instanceof Erc1155Coin) && coin.family === CoinFamily.SONEIUM) {
      acc.push(getSoneiumTokenConfig(coin));
    }
    return acc;
  }, []);

function getErc721TokenConfig(coin: Erc721Coin): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'eth' : 'hteth',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedErc721Tokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof Erc721Coin && coin.family === CoinFamily.ETH) {
      acc.push(getErc721TokenConfig(coin));
    }
    return acc;
  }, []);

function getArbethTokenConfig(coin: ArbethERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'arbeth' : 'tarbeth',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedArbethTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof ArbethERC20Token) {
      acc.push(getArbethTokenConfig(coin));
    }
    return acc;
  }, []);

function getOpethTokenConfig(coin: OpethERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'opeth' : 'topeth',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedOpethTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof OpethERC20Token) {
      acc.push(getOpethTokenConfig(coin));
    }
    return acc;
  }, []);

function getBaseethTokenConfig(coin: EthLikeERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'baseeth' : 'tbaseeth',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedBaseethTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof EthLikeERC20Token && (coin.name.includes('baseeth:') || coin.name.includes('tbaseeth:'))) {
      acc.push(getBaseethTokenConfig(coin));
    }
    return acc;
  }, []);

function getOgTokenConfig(coin: EthLikeERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'og' : 'tog',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedOgTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof EthLikeERC20Token && (coin.name.includes('og:') || coin.name.includes('tog:'))) {
      acc.push(getOgTokenConfig(coin));
    }
    return acc;
  }, []);

function getSeievmTokenConfig(coin: EthLikeERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'seievm' : 'tseievm',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedSeievmTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof EthLikeERC20Token && (coin.name.includes('seievm:') || coin.name.includes('tseievm:'))) {
      acc.push(getSeievmTokenConfig(coin));
    }
    return acc;
  }, []);

function getMonTokenConfig(coin: MonERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'mon' : 'tmon',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedMonTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof MonERC20Token) {
      acc.push(getMonTokenConfig(coin));
    }
    return acc;
  }, []);

function getFlowTokenConfig(coin: EthLikeERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'flow' : 'tflow',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedFlowTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof EthLikeERC20Token && (coin.name.includes('flow:') || coin.name.includes('tflow:'))) {
      acc.push(getFlowTokenConfig(coin));
    }
    return acc;
  }, []);

function getLineaethTokenConfig(coin: EthLikeERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'lineaeth' : 'tlineaeth',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedLineaethTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof EthLikeERC20Token && (coin.name.includes('lineaeth:') || coin.name.includes('tlineaeth:'))) {
      acc.push(getLineaethTokenConfig(coin));
    }
    return acc;
  }, []);

function getZkethTokenConfig(coin: ZkethERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'zketh' : 'tzketh',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedZkethTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof ZkethERC20Token) {
      acc.push(getZkethTokenConfig(coin));
    }
    return acc;
  }, []);

function getBeraTokenConfig(coin: BeraERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'bera' : 'tbera',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedBeraTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof BeraERC20Token) {
      acc.push(getBeraTokenConfig(coin));
    }
    return acc;
  }, []);

function getCoredaoTokenConfig(coin: CoredaoERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'coredao' : 'tcoredao',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedCoredaoTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof CoredaoERC20Token) {
      acc.push(getCoredaoTokenConfig(coin));
    }
    return acc;
  }, []);

function getWorldTokenConfig(coin: WorldERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'world' : 'tworld',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedWorldTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof WorldERC20Token) {
      acc.push(getWorldTokenConfig(coin));
    }
    return acc;
  }, []);

function getFlrTokenConfig(coin: FlrERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'flr' : 'tflr',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedFlrTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof FlrERC20Token) {
      acc.push(getFlrTokenConfig(coin));
    }
    return acc;
  }, []);

function getXdcTokenConfig(coin: XdcERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'xdc' : 'txdc',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedXdcTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof XdcERC20Token) {
      acc.push(getXdcTokenConfig(coin));
    }
    return acc;
  }, []);

function getSolTokenConfig(coin: SolCoin): SolTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'sol' : 'tsol',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenAddress: coin.tokenAddress,
    decimalPlaces: coin.decimalPlaces,
    contractAddress: coin.contractAddress,
  };
}
const getFormattedSolTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: SolTokenConfig[], coin) => {
    if (coin instanceof SolCoin) {
      acc.push(getSolTokenConfig(coin));
    }
    return acc;
  }, []);

function getAlgoTokenConfig(coin: AlgoCoin): AlgoTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'algo' : 'talgo',
    alias: coin.alias,
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
  };
}
export const getFormattedAlgoTokens = (customCoinMap = coins): AlgoTokenConfig[] =>
  customCoinMap.reduce((acc: AlgoTokenConfig[], coin) => {
    if (coin instanceof AlgoCoin) {
      acc.push(getAlgoTokenConfig(coin));
    }
    return acc;
  }, []);

function getHbarTokenConfig(coin: HederaToken): HbarTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'hbar' : 'thbar',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
    nodeAccountId: coin.nodeAccountId,
    tokenId: coin.tokenId,
    contractAddress: coin.contractAddress,
  };
}
const getFormattedHbarTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: HbarTokenConfig[], coin) => {
    if (coin instanceof HederaToken) {
      acc.push(getHbarTokenConfig(coin));
    }
    return acc;
  }, []);

function getAdaTokenConfig(coin: AdaToken): AdaTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'ada' : 'tada',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    policyId: coin.policyId,
    assetName: coin.assetName,
    decimalPlaces: coin.decimalPlaces,
    contractAddress: coin.contractAddress,
  };
}
const getFormattedAdaTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: AdaTokenConfig[], coin) => {
    if (coin instanceof AdaToken) {
      acc.push(getAdaTokenConfig(coin));
    }
    return acc;
  }, []);

function getTrxTokenConfig(coin: TronErc20Coin): TrxTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'trx' : 'ttrx',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedTrxTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: TrxTokenConfig[], coin) => {
    if (coin instanceof TronErc20Coin) {
      acc.push(getTrxTokenConfig(coin));
    }
    return acc;
  }, []);

function getXrpTokenConfig(coin: XrpCoin): XrpTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'xrp' : 'txrp',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
    issuerAddress: coin.issuerAddress,
    currencyCode: coin.currencyCode,
    domain: coin.domain,
    contractAddress: coin.contractAddress,
  };
}
const getFormattedXrpTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: XrpTokenConfig[], coin) => {
    if (coin instanceof XrpCoin) {
      acc.push(getXrpTokenConfig(coin));
    }
    return acc;
  }, []);

function getSuiTokenConfig(coin: SuiCoin): SuiTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'sui' : 'tsui',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
    packageId: coin.packageId,
    module: coin.module,
    symbol: coin.symbol,
    contractAddress: coin.contractAddress,
  };
}
const getFormattedSuiTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: SuiTokenConfig[], coin) => {
    if (coin instanceof SuiCoin) {
      acc.push(getSuiTokenConfig(coin));
    }
    return acc;
  }, []);

function getTaoTokenConfig(coin: TaoCoin): TaoTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'tao' : 'ttao',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
    subnetId: coin.subnetId,
  };
}
const getFormattedTaoTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: TaoTokenConfig[], coin) => {
    if (coin instanceof TaoCoin) {
      acc.push(getTaoTokenConfig(coin));
    }
    return acc;
  }, []);

function getPolyxTokenConfig(coin: PolyxCoin): PolyxTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'polyx' : 'tpolyx',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    decimalPlaces: coin.decimalPlaces,
    ticker: coin.ticker,
    assetId: coin.assetId,
  };
}
const getFormattedPolyxTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: PolyxTokenConfig[], coin) => {
    if (coin instanceof PolyxCoin) {
      acc.push(getPolyxTokenConfig(coin));
    }
    return acc;
  }, []);

function getAptTokenConfig(coin: AptCoin): AptTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'apt' : 'tapt',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    assetId: coin.assetId,
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedAptTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: AptTokenConfig[], coin) => {
    if (coin instanceof AptCoin) {
      acc.push(getAptTokenConfig(coin));
    }
    return acc;
  }, []);

function getAptNFTCollectionConfig(coin: AptNFTCollection): AptNFTCollectionConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'apt' : 'tapt',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    nftCollectionId: coin.nftCollectionId,
    decimalPlaces: coin.decimalPlaces,
  };
}

function getVetNFTCollectionConfig(coin: VetNFTCollection): VetNFTCollectionConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'vet' : 'tvet',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    nftCollectionId: coin.nftCollectionId,
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedAptNFTCollections = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: AptNFTCollectionConfig[], coin) => {
    if (coin instanceof AptNFTCollection) {
      acc.push(getAptNFTCollectionConfig(coin));
    }
    return acc;
  }, []);

const getFormattedVetNFTCollections = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: VetNFTCollectionConfig[], coin) => {
    if (coin instanceof VetNFTCollection) {
      acc.push(getVetNFTCollectionConfig(coin));
    }
    return acc;
  }, []);

function getSip10TokenConfig(coin: Sip10Token): Sip10TokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'stx' : 'tstx',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    assetId: coin.assetId,
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedSip10Tokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: Sip10TokenConfig[], coin) => {
    if (coin instanceof Sip10Token) {
      acc.push(getSip10TokenConfig(coin));
    }
    return acc;
  }, []);

function getNep141TokenConfig(coin: Nep141Token): Nep141TokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'near' : 'tnear',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    contractAddress: coin.contractAddress,
    storageDepositAmount: coin.storageDepositAmount,
    decimalPlaces: coin.decimalPlaces,
  };
}
const getFormattedNep141Tokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: Nep141TokenConfig[], coin) => {
    if (coin instanceof Nep141Token) {
      acc.push(getNep141TokenConfig(coin));
    }
    return acc;
  }, []);

function getVetTokenConfig(coin: VetToken): VetTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'vet' : 'tvet',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    contractAddress: coin.contractAddress,
    decimalPlaces: coin.decimalPlaces,
  };
}

const getFormattedVetTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: VetTokenConfig[], coin) => {
    if (coin instanceof VetToken) {
      acc.push(getVetTokenConfig(coin));
    }
    return acc;
  }, []);

const getFormattedCosmosChainTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: CosmosTokenConfig[], coin) => {
    if (coin instanceof CosmosChainToken) {
      acc.push(getCosmosTokenConfig(coin));
    }
    return acc;
  }, []);

function getCosmosTokenConfig(coin: CosmosChainToken): CosmosTokenConfig {
  return {
    type: coin.name,
    coin: coin.name.split(':')[0].toLowerCase(),
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    denom: coin.denom,
    decimalPlaces: coin.decimalPlaces,
  };
}

function getJettonTokenConfig(coin: JettonToken): JettonTokenConfig {
  return {
    type: coin.name,
    coin: coin.network.type === NetworkType.MAINNET ? 'ton' : 'tton',
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    contractAddress: coin.contractAddress,
    decimalPlaces: coin.decimalPlaces,
  };
}

const getFormattedJettonTokens = (customCoinMap = coins) =>
  customCoinMap.reduce((acc: JettonTokenConfig[], coin) => {
    if (coin instanceof JettonToken) {
      acc.push(getJettonTokenConfig(coin));
    }
    return acc;
  }, []);

/**
 * Get all formatted TIP20 tokens (skeleton)
 * TODO: Implement when Tip20Token coin class is added to @bitgo/statics
 * @param customCoinMap - Coin map to search
 */
const getFormattedTip20Tokens = (customCoinMap = coins): Tip20TokenConfig[] =>
  customCoinMap.reduce((acc: Tip20TokenConfig[], coin) => {
    // TODO: Uncomment when Tip20Token class is added to @bitgo/statics
    // if (coin instanceof Tip20Token) {
    //   acc.push(getTip20TokenConfig(coin));
    // }
    return acc;
  }, []);

type EthLikeTokenMap = {
  [K in CoinFamily]: { tokens: EthLikeTokenConfig[] };
};

export enum TokenTypeEnum {
  ERC20 = 'erc20',
  ERC721 = 'erc721',
}

function getEthLikeTokenConfig(coin: EthLikeERC20Token): EthLikeTokenConfig {
  return {
    type: coin.name,
    coin: coin.name.split(':')[0].toLowerCase(),
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}

function getEthLikeERC721TokenConfig(coin: EthLikeERC721Token): EthLikeERC721TokenConfig {
  return {
    type: coin.name,
    coin: coin.name.split(':')[0].toLowerCase(),
    network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: coin.fullName,
    tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
    decimalPlaces: coin.decimalPlaces,
  };
}

export const getFormattedEthLikeTokenConfig = (
  customCoinMap = coins,
  tokenType: TokenTypeEnum
): EthLikeTokenConfig[] => {
  let className: typeof EthLikeERC20Token | typeof EthLikeERC721Token;
  if (tokenType === TokenTypeEnum.ERC20) {
    className = EthLikeERC20Token;
  } else if (tokenType === TokenTypeEnum.ERC721) {
    className = EthLikeERC721Token;
  } else {
    throw new Error(`Unsupported token type: ${tokenType}`);
  }

  return customCoinMap.reduce((acc: EthLikeTokenConfig[], coin) => {
    if (coin instanceof className) {
      if (tokenType === TokenTypeEnum.ERC20) {
        acc.push(getEthLikeTokenConfig(coin as EthLikeERC20Token));
      } else if (tokenType === TokenTypeEnum.ERC721) {
        acc.push(getEthLikeERC721TokenConfig(coin as EthLikeERC721Token));
      }
    }
    return acc;
  }, []);
};

/* Get all tokens of a given eth like coin for a given network */
export const getEthLikeTokens = (network: 'Mainnet' | 'Testnet', tokenType: TokenTypeEnum): EthLikeTokenMap => {
  let feature: CoinFeature;
  const networkTokens = getFormattedEthLikeTokenConfig(coins, tokenType).filter((token) => token.network === network);

  if (tokenType === TokenTypeEnum.ERC20) {
    feature = CoinFeature.SUPPORTS_ERC20;
  } else if (tokenType === TokenTypeEnum.ERC721) {
    feature = CoinFeature.SUPPORTS_ERC721;
  }

  const ethLikeTokenMap = {} as EthLikeTokenMap;

  coins.forEach((coin) => {
    if (coin instanceof AccountCoin && coin.features.includes(feature)) {
      const coinName = coin.family;
      const coinNameForNetwork = network === 'Testnet' ? `t${coinName}` : coinName;

      ethLikeTokenMap[coin.family] = {
        tokens: networkTokens.filter((token) => token.coin === coinNameForNetwork),
      };
    }
  });

  return ethLikeTokenMap;
};

const mergeEthLikeTokenMap = (...maps: EthLikeTokenMap[]): EthLikeTokenMap => {
  const mergedMap: EthLikeTokenMap = {} as EthLikeTokenMap;

  maps.forEach((map) => {
    Object.keys(map).forEach((key) => {
      if (!mergedMap[key as CoinFamily]) {
        mergedMap[key as CoinFamily] = { tokens: [] };
      }
      mergedMap[key as CoinFamily].tokens.push(...map[key as CoinFamily].tokens);
    });
  });
  return mergedMap;
};

export const getFormattedTokensByNetwork = (network: 'Mainnet' | 'Testnet', coinMap: typeof coins) => {
  const networkType = network === 'Mainnet' ? NetworkType.MAINNET : NetworkType.TESTNET;

  const ethLikeTokenMap = getEthLikeTokens(network, TokenTypeEnum.ERC20);
  const ethLikeErc721TokenMap = getEthLikeTokens(network, TokenTypeEnum.ERC721);

  return {
    ...mergeEthLikeTokenMap(ethLikeTokenMap, ethLikeErc721TokenMap),
    eth: {
      tokens: getFormattedErc20Tokens(coinMap).filter((token) => token.network === network),
      nfts: getFormattedErc721Tokens(coinMap).filter((token) => token.network === network),
    },
    xlm: {
      tokens: getFormattedStellarTokens(coinMap).filter((token) => token.network === network),
    },
    algo: {
      tokens: getFormattedAlgoTokens(coinMap).filter((token) => token.network === network),
    },
    ofc: {
      tokens: getFormattedOfcCoins(coinMap).filter((token) => coinMap.get(token.type).network.type === networkType),
    },
    celo: {
      tokens: getFormattedCeloTokens(coinMap).filter((token) => token.network === network),
    },
    bsc: {
      tokens: getFormattedBscTokens(coinMap).filter((token) => token.network === network),
    },
    eos: {
      tokens: getFormattedEosTokens(coinMap).filter((token) => token.network === network),
    },
    avaxc: {
      tokens: getFormattedAvaxCTokens(coinMap).filter((token) => token.network === network),
    },
    polygon: {
      tokens: getFormattedPolygonTokens(coinMap).filter((token) => token.network === network),
    },
    soneium: {
      tokens: getFormattedSoneiumTokens(coinMap).filter((token) => token.network === network),
    },
    arbeth: {
      tokens: getFormattedArbethTokens(coinMap).filter((token) => token.network === network),
    },
    opeth: {
      tokens: getFormattedOpethTokens(coinMap).filter((token) => token.network === network),
    },
    baseeth: {
      tokens: getFormattedBaseethTokens(coinMap).filter((token) => token.network === network),
    },
    og: {
      tokens: getFormattedOgTokens(coinMap).filter((token) => token.network === network),
    },
    flow: {
      tokens: getFormattedFlowTokens(coinMap).filter((token) => token.network === network),
    },
    mon: {
      tokens: getFormattedMonTokens(coinMap).filter((token) => token.network === network),
    },
    xdc: {
      tokens: getFormattedXdcTokens(coinMap).filter((token) => token.network === network),
    },
    lineaeth: {
      tokens: getFormattedLineaethTokens(coinMap).filter((token) => token.network === network),
    },
    seievm: {
      tokens: getFormattedSeievmTokens(coinMap).filter((token) => token.network === network),
    },
    zketh: {
      tokens: getFormattedZkethTokens(coinMap).filter((token) => token.network === network),
    },
    sol: {
      tokens: getFormattedSolTokens(coinMap).filter((token) => token.network === network),
    },
    hbar: {
      tokens: getFormattedHbarTokens(coinMap).filter((token) => token.network === network),
    },
    ada: {
      tokens: getFormattedAdaTokens(coinMap).filter((token) => token.network === network),
    },
    trx: {
      tokens: getFormattedTrxTokens(coinMap).filter((token) => token.network === network),
    },
    xrp: {
      tokens: getFormattedXrpTokens(coinMap).filter((token) => token.network === network),
    },
    sui: {
      tokens: getFormattedSuiTokens(coinMap).filter((token) => token.network === network),
    },
    tao: {
      tokens: getFormattedTaoTokens(coinMap).filter((token) => token.network === network),
    },
    polyx: {
      tokens: getFormattedPolyxTokens(coinMap).filter((token) => token.network === network),
    },
    bera: {
      tokens: getFormattedBeraTokens(coinMap).filter((token) => token.network === network),
    },
    coredao: {
      tokens: getFormattedCoredaoTokens(coinMap).filter((token) => token.network === network),
    },
    world: {
      tokens: getFormattedWorldTokens(coinMap).filter((token) => token.network === network),
    },
    flr: {
      tokens: getFormattedFlrTokens(coinMap).filter((token) => token.network === network),
    },

    stx: {
      tokens: getFormattedSip10Tokens(coinMap).filter((token) => token.network === network),
    },
    near: {
      tokens: getFormattedNep141Tokens(coinMap).filter((token) => token.network === network),
    },
    cosmos: {
      tokens: getFormattedCosmosChainTokens(coinMap).filter((token) => token.network === network),
    },
    ton: {
      tokens: getFormattedJettonTokens(coinMap).filter((token) => token.network === network),
    },
    tempo: {
      tokens: getFormattedTip20Tokens(coinMap).filter((token) => token.network === network),
    },
  };
};

export const getFormattedTokens = (coinMap = coins): Tokens => {
  const formattedAptNFTCollections = getFormattedAptNFTCollections(coinMap);
  const formattedVetNFTCollections = getFormattedVetNFTCollections(coinMap);

  return {
    bitcoin: {
      ...getFormattedTokensByNetwork('Mainnet', coinMap),
      apt: {
        tokens: getFormattedAptTokens(coinMap).filter((token) => token.network === 'Mainnet'),
        nftCollections: formattedAptNFTCollections.filter(
          (nftCollection: AptNFTCollectionConfig) => nftCollection.network === 'Mainnet'
        ),
      },
      vet: {
        tokens: getFormattedVetTokens(coinMap).filter((token) => token.network === 'Mainnet'),
        nftCollections: formattedVetNFTCollections.filter(
          (nftCollection: VetNFTCollectionConfig) => nftCollection.network === 'Mainnet'
        ),
      },
    },
    testnet: {
      ...getFormattedTokensByNetwork('Testnet', coinMap),
      apt: {
        tokens: getFormattedAptTokens(coinMap).filter((token) => token.network === 'Testnet'),
        nftCollections: formattedAptNFTCollections.filter(
          (nftCollection: AptNFTCollectionConfig) => nftCollection.network === 'Testnet'
        ),
      },
      vet: {
        tokens: getFormattedVetTokens(coinMap).filter((token) => token.network === 'Testnet'),
        nftCollections: formattedVetNFTCollections.filter(
          (nftCollection: VetNFTCollectionConfig) => nftCollection.network === 'Testnet'
        ),
      },
    },
  };
};

/**
 * Verify mainnet or testnet tokens
 * @param tokens
 */
export const verifyTokens = function (tokens: BaseTokenConfig[]) {
  const verifiedTokens: Record<string, boolean> = {};
  tokens.forEach((token) => {
    if (verifiedTokens[token.type]) {
      throw new Error('token : ' + token.type + ' duplicated.');
    }
    verifiedTokens[token.type] = true;

    if (
      (token as BaseContractAddressConfig).tokenContractAddress &&
      (token as BaseContractAddressConfig).tokenContractAddress !==
        (token as BaseContractAddressConfig).tokenContractAddress.toLocaleLowerCase()
    ) {
      throw new Error(
        'token contract: ' + token.type + ' is not all lower case: ' + (token as BaseContractAddressConfig)
      );
    }
  });

  return verifiedTokens;
};

export const tokens = getFormattedTokens();

export const formattedAlgoTokens = getFormattedAlgoTokens();

const mainnetErc20Tokens = verifyTokens(tokens.bitcoin.eth.tokens);
const mainnetErc721Tokens = verifyTokens(tokens.bitcoin.eth.nfts);
const mainnetStellarTokens = verifyTokens(tokens.bitcoin.xlm.tokens);
export const mainnetTokens = { ...mainnetErc20Tokens, ...mainnetErc721Tokens, ...mainnetStellarTokens };

const testnetErc20Tokens = verifyTokens(tokens.testnet.eth.tokens);
const testnetErc721Tokens = verifyTokens(tokens.testnet.eth.nfts);
const testnetStellarTokens = verifyTokens(tokens.testnet.xlm.tokens);
export const testnetTokens = { ...testnetErc20Tokens, ...testnetErc721Tokens, ...testnetStellarTokens };

/**
 * Get formatted token configuration for a single coin
 * @param coin - Static Base coin instance
 * @returns The formatted token configuration for the coin, or undefined if not supported
 */
export function getFormattedTokenConfigForCoin(coin: Readonly<BaseCoin>): TokenConfig | undefined {
  if (coin instanceof Erc20Coin) {
    return getErc20TokenConfig(coin);
  } else if (coin instanceof StellarCoin) {
    return getStellarTokenConfig(coin);
  } else if (coin instanceof OfcCoin) {
    return getOfcTokenConfig(coin);
  } else if (coin instanceof CeloCoin) {
    return getCeloTokenConfig(coin);
  } else if (coin instanceof BscCoin) {
    return getBscTokenConfig(coin);
  } else if (coin instanceof EosCoin) {
    return getEosTokenConfig(coin);
  } else if (coin instanceof AvaxERC20Token) {
    return getAvaxCTokenConfig(coin);
  } else if (
    coin instanceof PolygonERC20Token ||
    ((coin instanceof Erc721Coin || coin instanceof Erc1155Coin) && coin.family === CoinFamily.POLYGON)
  ) {
    return getPolygonTokenConfig(coin);
  } else if ((coin instanceof Erc721Coin || coin instanceof Erc1155Coin) && coin.family === CoinFamily.SONEIUM) {
    return getSoneiumTokenConfig(coin);
  } else if (coin instanceof Erc721Coin && coin.family === CoinFamily.ETH) {
    return getErc721TokenConfig(coin);
  } else if (coin instanceof ArbethERC20Token) {
    return getArbethTokenConfig(coin);
  } else if (coin instanceof OpethERC20Token) {
    return getOpethTokenConfig(coin);
  } else if (coin instanceof ZkethERC20Token) {
    return getZkethTokenConfig(coin);
  } else if (coin instanceof SolCoin) {
    return getSolTokenConfig(coin);
  } else if (coin instanceof HederaToken) {
    return getHbarTokenConfig(coin);
  } else if (coin instanceof AdaToken) {
    return getAdaTokenConfig(coin);
  } else if (coin instanceof TronErc20Coin) {
    return getTrxTokenConfig(coin);
  } else if (coin instanceof XrpCoin) {
    return getXrpTokenConfig(coin);
  } else if (coin instanceof SuiCoin) {
    return getSuiTokenConfig(coin);
  } else if (coin instanceof TaoCoin) {
    return getTaoTokenConfig(coin);
  } else if (coin instanceof PolyxCoin) {
    return getPolyxTokenConfig(coin);
  } else if (coin instanceof AptCoin) {
    return getAptTokenConfig(coin);
  } else if (coin instanceof AptNFTCollection) {
    return getAptNFTCollectionConfig(coin);
  } else if (coin instanceof Sip10Token) {
    return getSip10TokenConfig(coin);
  } else if (coin instanceof Nep141Token) {
    return getNep141TokenConfig(coin);
  } else if (coin instanceof CosmosChainToken) {
    return getCosmosTokenConfig(coin);
  } else if (coin instanceof VetToken) {
    return getVetTokenConfig(coin);
  } else if (coin instanceof VetNFTCollection) {
    return getVetNFTCollectionConfig(coin);
  } else if (coin instanceof CoredaoERC20Token) {
    return getCoredaoTokenConfig(coin);
  } else if (coin instanceof JettonToken) {
    return getJettonTokenConfig(coin);
  } else if (coin instanceof FlrERC20Token) {
    return getFlrTokenConfig(coin);
  } else if (coin instanceof MonERC20Token) {
    return getMonTokenConfig(coin);
  } else if (coin instanceof XdcERC20Token) {
    return getXdcTokenConfig(coin);
  } else if (coin instanceof EthLikeERC20Token) {
    return getEthLikeTokenConfig(coin);
  } else if (coin instanceof EthLikeERC721Token) {
    return getEthLikeERC721TokenConfig(coin);
  }
  // TODO: Add Tip20Token instance check when class is added to statics
  // else if (coin instanceof Tip20Token) {
  //   return getTip20TokenConfig(coin);
  // }
  return undefined;
}
