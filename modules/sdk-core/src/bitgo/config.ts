import * as _ from 'lodash';
import { coins, tokens } from '@bitgo/statics';
import { safeSlotsForCoin } from '@bitgo/sdk-lib-safes';
import { EnvironmentName, Environments } from './environments';

export type KrsProvider = {
  feeType: 'flatUsd';
  feeAmount: number;
  supportedCoins: string[];
  feeAddresses?: Record<string, string>;
};

/**
 * Coin families with a non-token coin whose safe slots include secp256k1Multisig or
 * ed25519Multisig.
 */
function safeMultisigCoinFamilies(): string[] {
  const families = new Set<string>();
  coins.forEach((coin) => {
    if (coin.isToken) {
      return;
    }
    let slots: string[];
    try {
      slots = safeSlotsForCoin(coin.name);
    } catch {
      // Coins that safeSlotsForCoin cannot place cannot be minted in a safe; skip them so module load never throws.
      return;
    }
    if (slots.some((slot) => slot === 'secp256k1Multisig' || slot === 'ed25519Multisig')) {
      families.add(coin.family);
    }
  });
  return [...families].sort();
}

// KRS providers and their fee structures
export const krsProviders: Record<string, KrsProvider> = {
  keyternal: {
    feeType: 'flatUsd',
    feeAmount: 0,
    supportedCoins: ['btc', 'eth'],
  },
  bitgoKRSv2: {
    feeType: 'flatUsd',
    feeAmount: 0, // we will receive payments off-chain
    supportedCoins: ['btc', 'eth'],
  },
  dai: {
    feeType: 'flatUsd',
    feeAmount: 0, // dai will receive payments off-chain
    supportedCoins: ['btc', 'eth', 'xlm', 'xrp', 'dash', 'zec', 'ltc', 'bch', 'bsv', 'bcha'],
  },
  // CoinCover as the external backup-root provider for Wallet Safes.
  coincover: {
    feeType: 'flatUsd',
    feeAmount: 0,
    supportedCoins: safeMultisigCoinFamilies(),
  },
};

export const defaults = {
  maxFee: 0.1e8,
  maxFeeRate: 1000000,
  minFeeRate: 5000,
  fallbackFeeRate: 50000,
  minOutputSize: 2730,
  minInstantFeeRate: 10000,
  bitgoEthAddress: '0x0f47ea803926926f299b7f1afc8460888d850f47',
};

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

export type Config = {
  krsProviders: Record<string, KrsProvider>;
};
