import * as _ from 'lodash';
import { Environments, EnvironmentName } from './v2/environments';
import { OfcTokenConfig } from './v2/coins/ofcToken';
import { Erc20TokenConfig } from './v2/coins/erc20Token';
import { StellarTokenConfig } from './v2/coins/stellarToken';
import { coins, BaseCoin, Erc20Coin, StellarCoin, OfcCoin, CoinKind, NetworkType } from '@bitgo/statics';

export interface Tokens {
  bitcoin: {
    eth: {
      tokens: Erc20TokenConfig[];
    };
    xlm: {
      tokens: StellarTokenConfig[];
    };
    ofc: {
      tokens: OfcTokenConfig[];
    };
  };
  testnet: {
    eth: {
      tokens: Erc20TokenConfig[];
    };
    xlm: {
      tokens: StellarTokenConfig[];
    };
    ofc: {
      tokens: OfcTokenConfig[];
    };
  };
}

// Get the list of ERC-20 tokens from statics and format it properly
const formattedErc20Tokens = coins.filter((coin: BaseCoin) => {
  return coin instanceof Erc20Coin;
}).map((token: Erc20Coin): Erc20TokenConfig => {
  return {
    type: token.name,
    coin: token.network.type === NetworkType.MAINNET ? 'eth' : 'teth',
    network: token.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: token.fullName,
    tokenContractAddress: token.contractAddress.toString().toLowerCase(),
    decimalPlaces: token.decimalPlaces,
  };
});

// Get the list of Stellar tokens from statics and format it properly
const formattedStellarTokens = coins.filter((coin: BaseCoin) => {
  return coin instanceof StellarCoin;
}).map((token: StellarCoin): StellarTokenConfig => {
  return {
    type: token.name,
    coin: token.network.type === NetworkType.MAINNET ? 'xlm' : 'txlm',
    network: token.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
    name: token.fullName,
    decimalPlaces: token.decimalPlaces,
  };
});

// Get the list of OFC tokens from statics and format it properly
const formattedOfcCoins = coins.filter((coin: BaseCoin) => {
  return coin instanceof OfcCoin;
}).map((token: OfcCoin): OfcTokenConfig => {
  return {
    type: token.name,
    coin: 'ofc',
    backingCoin: token.asset,
    name: token.fullName,
    decimalPlaces: token.decimalPlaces,
    isFiat: token.kind === CoinKind.FIAT,
  };
});


export const tokens: Tokens = {
  // network name for production environments
  bitcoin: {
    eth: {
      tokens: formattedErc20Tokens.filter(token => token.network === 'Mainnet'),
    },
    xlm: {
      tokens: formattedStellarTokens.filter(token => token.network === 'Mainnet'),
    },
    ofc: {
      tokens: formattedOfcCoins.filter(token => coins.get(token.type).network.type === NetworkType.MAINNET),
    },
  },
  // network name for test environments
  testnet: {
    eth: {
      tokens: formattedErc20Tokens.filter(token => token.network === 'Testnet'),
    },
    xlm: {
      tokens: formattedStellarTokens.filter(token => token.network === 'Testnet'),
    },
    ofc: {
      tokens: formattedOfcCoins.filter(token => coins.get(token.type).network.type === NetworkType.TESTNET),
    },
  },
};

/**
 * Verify mainnet or testnet tokens
 * @param tokens
 */
const verifyTokens = function(tokens) {
  const verifiedTokens = {};
  _.forEach(tokens, function(token) {
    if (verifiedTokens[token.type]) {
      throw new Error('token : ' + token.type + ' duplicated.');
    }
    verifiedTokens[token.type] = true;

    if (token.tokenContractAddress && token.tokenContractAddress !== _.toLower(token.tokenContractAddress)) {
      throw new Error('token contract: ' + token.type + ' is not all lower case: ' + token.tokenContractAddress);
    }
  });
  return verifiedTokens;
};

const mainnetErc20Tokens = verifyTokens(tokens.bitcoin.eth.tokens);
const mainnetStellarTokens = verifyTokens(tokens.bitcoin.xlm.tokens);
export const mainnetTokens = _.assign({}, mainnetErc20Tokens, mainnetStellarTokens);

const testnetErc20Tokens = verifyTokens(tokens.testnet.eth.tokens);
const testnetStellarTokens = verifyTokens(tokens.testnet.xlm.tokens);
export const testnetTokens = _.assign({}, testnetErc20Tokens, testnetStellarTokens);


export const defaults = {
  maxFee: 0.1e8,
  maxFeeRate: 1000000,
  minFeeRate: 5000,
  fallbackFeeRate: 50000,
  minOutputSize: 2730,
  minInstantFeeRate: 10000,
  bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47'
};

// Supported cross-chain recovery routes. The coin to be recovered is the index, the valid coins for recipient wallets
// are listed in the array.
export const supportedCrossChainRecoveries = {
  btc: ['bch', 'ltc', 'bsv'],
  bch: ['btc', 'ltc', 'bsv'],
  ltc: ['btc', 'bch', 'bsv'],
  bsv: ['btc', 'ltc', 'bch']
};

// KRS providers and their fee structures
export const krsProviders = {
  keyternal: {
    feeType: 'flatUsd',
    feeAmount: 99,
    supportedCoins: ['btc', 'eth'],
    feeAddresses: {
      btc: '' // TODO [BG-6965] Get address from Keyternal - recovery will fail for now until Keyternal is ready
    }
  },
  bitgoKRSv2: {
    feeType: 'flatUsd',
    feeAmount: 0, // we will receive payments off-chain
    supportedCoins: ['btc', 'eth']
  },
  dai: {
    feeType: 'flatUsd',
    feeAmount: 0, // dai will receive payments off-chain
    supportedCoins: ['btc', 'eth', 'xlm', 'xrp', 'dash', 'zec', 'ltc', 'bch']
  }
};

export const bitcoinAverageBaseUrl = 'https://apiv2.bitcoinaverage.com/indices/local/ticker/';

// TODO: once server starts returning eth address keychains, remove bitgoEthAddress
/**
 * Get the default (hardcoded) constants for a particular network.
 *
 * Note that this may not be the complete set of constants, and additional constants may get fetched
 * from BitGo during the lifespan of a BitGo object.
 * @param env
 */
export const defaultConstants = (env: EnvironmentName) => {
  if (Environments[env] === undefined) {
    throw Error(`invalid environment ${env}`);
  }

  const network = Environments[env].network;
  return _.merge({}, defaults, tokens[network]);
};

        { type: 'pass', coin: 'eth', network: 'Mainnet', name: 'Blockpass', tokenContractAddress: '0xee4458e052b533b1aabd493b5f8c4d85d7b263dc', decimalPlaces: 6 },
        { type: 'sxp', coin: 'eth', network: 'Mainnet', name: 'Swipe', tokenContractAddress: '0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9', decimalPlaces: 18 },
        { type: 'snc', coin: 'eth', network: 'Mainnet', name: 'SunContract', tokenContractAddress: '0xf4134146af2d511dd5ea8cdb1c4ac88c57d60404', decimalPlaces: 18 },
        { type: 'ampx', coin: 'eth', network: 'Mainnet', name: 'Amplify Exchange', tokenContractAddress: '0x735af341f2d9ce3663616cd84ff522dbf62fbc1f', decimalPlaces: 18 },
        { type: 'bidl', coin: 'eth', network: 'Mainnet', name: 'Blockbid Liquidity', tokenContractAddress: '0x5c7ec304a60ed545518085bb4aba156e8a7596f6', decimalPlaces: 2 },
        { type: 'sgdx', coin: 'eth', network: 'Mainnet', name: 'eToro Singapore Dollar', tokenContractAddress: '0x0e3e965acffb719e2f5dd4309969e2debe6215dd', decimalPlaces: 18 },
        { type: 'hkdx', coin: 'eth', network: 'Mainnet', name: 'eToro Hong Kong Dollar', tokenContractAddress: '0x1af20b8d1ede928f437b3a86801796b167840d2b', decimalPlaces: 18 },
        { type: 'zarx', coin: 'eth', network: 'Mainnet', name: 'eToro South African Rand', tokenContractAddress: '0x29ec3ff4e1dcad5a207dbd5d14e48073abba0bd3', decimalPlaces: 18 },
        { type: 'plnx', coin: 'eth', network: 'Mainnet', name: 'eToro Polish Zloty', tokenContractAddress: '0xaace6480798b4a7b596ec4ce3a26b8de9b9ae2e2', decimalPlaces: 18 },
        { type: 'tryx', coin: 'eth', network: 'Mainnet', name: 'eToro Turkish Lira', tokenContractAddress: '0x6faff971d9248e7d398a98fdbe6a81f6d7489568', decimalPlaces: 18 },
        { type: 'ivy', coin: 'eth', network: 'Mainnet', name: 'Ivy Koin', tokenContractAddress: '0xa4ea687a2a7f29cf2dc66b39c68e4411c0d00c49', decimalPlaces: 18 },