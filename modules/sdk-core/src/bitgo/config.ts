import * as _ from 'lodash';
import { tokens } from '@bitgo/statics';
import { EnvironmentName, Environments } from './environments';

export type KrsProvider = {
  feeType: 'flatUsd';
  feeAmount: number;
  supportedCoins: string[];
  feeAddresses?: Record<string, string>;
};

// KRS providers and their fee structures
export const krsProviders: Record<string, KrsProvider> = {
  keyternal: {
    feeType: 'flatUsd',
    feeAmount: 99,
    supportedCoins: ['btc', 'eth'],
    feeAddresses: {
      btc: '', // TODO [BG-6965] Get address from Keyternal - recovery will fail for now until Keyternal is ready
    },
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
