import * as _ from 'lodash';
import { Environments } from '@bitgo/sdk-core';
import {
  coins,
  Erc20Coin,
  StellarCoin,
  OfcCoin,
  CeloCoin,
  CoinKind,
  NetworkType,
  EosCoin,
  Networks,
  AlgoCoin,
  AvaxERC20Token,
} from '@bitgo/statics';

const defaults = {
  maxFee: 0.1e8,
  maxFeeRate: 1000000,
  minFeeRate: 5000,
  fallbackFeeRate: 50000,
  minOutputSize: 2730,
  minInstantFeeRate: 10000,
  bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47',
};

// Get the list of ERC-20 tokens from statics and format it properly
const formattedErc20Tokens = coins.reduce((acc: any, coin) => {
  if (coin instanceof Erc20Coin) {
    let baseCoin: string;
    switch (coin.network) {
      case Networks.main.ethereum:
        baseCoin = 'eth';
        break;
      case Networks.test.kovan:
        baseCoin = 'teth';
        break;
      case Networks.test.goerli:
        baseCoin = 'gteth';
        break;
      default:
        throw new Error(`Erc20 token ${coin.name} has an unsupported network`);
    }

    acc.push({
      type: coin.name,
      coin: baseCoin,
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

// Get the list of Stellar tokens from statics and format it properly
const formattedStellarTokens = coins.reduce((acc: any, coin) => {
  if (coin instanceof StellarCoin) {
    acc.push({
      type: coin.name,
      coin: coin.network.type === NetworkType.MAINNET ? 'xlm' : 'txlm',
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

// Get the list of Stellar tokens from statics and format it properly
const formattedAlgoTokens = coins.reduce((acc: any, coin) => {
  if (coin instanceof AlgoCoin) {
    acc.push({
      type: coin.name,
      coin: coin.network.type === NetworkType.MAINNET ? 'algo' : 'talgo',
      alias: coin.alias,
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

// Get the list of OFC tokens from statics and format it properly
const formattedOfcCoins = coins.reduce((acc: any, coin) => {
  if (coin instanceof OfcCoin) {
    acc.push({
      type: coin.name,
      coin: 'ofc',
      backingCoin: coin.asset,
      name: coin.fullName,
      decimalPlaces: coin.decimalPlaces,
      isFiat: coin.kind === CoinKind.FIAT,
    });
  }
  return acc;
}, []);

const formattedCeloTokens = coins.reduce((acc: any, coin) => {
  if (coin instanceof CeloCoin) {
    acc.push({
      type: coin.name,
      coin: coin.network.type === NetworkType.MAINNET ? 'celo' : 'tcelo',
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

const formattedEosTokens = coins.reduce((acc: any, coin) => {
  if (coin instanceof EosCoin) {
    acc.push({
      type: coin.name,
      coin: coin.network.type === NetworkType.MAINNET ? 'eos' : 'teos',
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      tokenContractAddress: coin.contractName.toString().toLowerCase(),
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

const formattedAvaxCTokens = coins.reduce((acc: any, coin) => {
  if (coin instanceof AvaxERC20Token) {
    acc.push({
      type: coin.name,
      coin: coin.network.type === NetworkType.MAINNET ? 'avaxc' : 'tavaxc',
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

export const tokens = {
  // network name for production environments
  bitcoin: {
    eth: {
      tokens: formattedErc20Tokens.filter((token) => token.network === 'Mainnet'),
    },
    xlm: {
      tokens: formattedStellarTokens.filter((token) => token.network === 'Mainnet'),
    },
    algo: {
      tokens: formattedAlgoTokens.filter((token) => token.network === 'Mainnet'),
    },
    ofc: {
      tokens: formattedOfcCoins.filter((token) => coins.get(token.type).network.type === NetworkType.MAINNET),
    },
    celo: {
      tokens: formattedCeloTokens.filter((token) => token.network === 'Mainnet'),
    },
    eos: {
      tokens: formattedEosTokens.filter((token) => token.network === 'Mainnet'),
    },
    avaxc: {
      tokens: formattedAvaxCTokens.filter((token) => token.network === 'Mainnet'),
    },
  },
  // network name for test environments
  testnet: {
    eth: {
      tokens: formattedErc20Tokens.filter((token) => token.network === 'Testnet'),
    },
    xlm: {
      tokens: formattedStellarTokens.filter((token) => token.network === 'Testnet'),
    },
    algo: {
      tokens: formattedAlgoTokens.filter((token) => token.network === 'Testnet'),
    },
    ofc: {
      tokens: formattedOfcCoins.filter((token) => coins.get(token.type).network.type === NetworkType.TESTNET),
    },
    celo: {
      tokens: formattedCeloTokens.filter((token) => token.network === 'Testnet'),
    },
    eos: {
      tokens: formattedEosTokens.filter((token) => token.network === 'Testnet'),
    },
    avaxc: {
      tokens: formattedAvaxCTokens.filter((token) => token.network === 'Testnet'),
    },
  },
};

export const defaultConstants = function (env) {
  if (Environments[env] === undefined) {
    throw Error(`invalid environment ${env}`);
  }

  const network = Environments[env].network;
  return _.merge({}, defaults, tokens[network]);
};
