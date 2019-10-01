import * as _ from 'lodash';
import { Environments, EnvironmentName } from './v2/environments';
import { OfcTokenConfig } from './v2/coins/ofcToken';
import { Erc20TokenConfig } from './v2/coins/erc20Token';
import { StellarTokenConfig } from './v2/coins/stellarToken';
import { coins, Erc20Coin, StellarCoin, OfcCoin, CoinKind, NetworkType } from '@bitgo/statics';

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
const formattedErc20Tokens = coins.reduce((acc: Erc20TokenConfig[], coin) => {
  if (coin instanceof Erc20Coin) {
    acc.push({
      type: coin.name,
      coin: coin.network.type === NetworkType.MAINNET ? 'eth' : 'teth',
      network: coin.network.type === NetworkType.MAINNET ? 'Mainnet' : 'Testnet',
      name: coin.fullName,
      tokenContractAddress: coin.contractAddress.toString().toLowerCase(),
      decimalPlaces: coin.decimalPlaces,
    });
  }
  return acc;
}, []);

// Get the list of Stellar tokens from statics and format it properly
const formattedStellarTokens = coins.reduce((acc: StellarTokenConfig[], coin) => {
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

// Get the list of OFC tokens from statics and format it properly
const formattedOfcCoins = coins.reduce((acc: OfcTokenConfig[], coin) => {
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
