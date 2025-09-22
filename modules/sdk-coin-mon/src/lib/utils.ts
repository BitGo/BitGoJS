import { NetworkType } from '@bitgo-beta/statics';
import EthereumCommon from '@ethereumjs/common';
import { InvalidTransactionError } from '@bitgo-beta/sdk-core';
import { mainnetCommon, testnetCommon } from './resources';

const commons: Map<NetworkType, EthereumCommon> = new Map<NetworkType, EthereumCommon>([
  [NetworkType.MAINNET, mainnetCommon],
  [NetworkType.TESTNET, testnetCommon],
]);

/**
 * @param {NetworkType} network either mainnet or testnet
 * @returns {EthereumCommon} Ethereum common configuration object
 */
export function getCommon(network: NetworkType): EthereumCommon {
  const common = commons.get(network);
  if (!common) {
    throw new InvalidTransactionError('Missing network common configuration');
  }
  return common;
}
