import { NetworkType } from '@bitgo-beta/statics';
import EthereumCommon from '@ethereumjs/common';
import { InvalidTransactionError, common } from '@bitgo-beta/sdk-core';
import { mainnetCommon, testnetCommon } from './resources';
import { recoveryBlockchainExplorerQuery as abstractRecoveryQuery } from '@bitgo-beta/abstract-eth';
import request from 'superagent';
import { addHexPrefix } from 'ethereumjs-util';

const RESPONSE_STATUS_ERROR = '0';
const RESPONSE_MESSAGE_NOTOK = 'NOTOK';

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

/**
 * Handle standard blockchain explorer query
 * @param query Query parameters
 * @param bitgoEnv BitGo environment
 * @returns Response from soneium.network
 */
async function handleStandardExplorerQuery(query: Record<string, string>, bitgoEnv: string): Promise<any> {
  const apiToken = common.Environments[bitgoEnv].soneiumExplorerApiToken;
  const explorerUrl = common.Environments[bitgoEnv].soneiumExplorerBaseUrl;
  return await abstractRecoveryQuery(query, explorerUrl as string, apiToken);
}

/**
 * Handle proxy blockchain explorer query
 * @param query Query parameters
 * @param bitgoEnv BitGo environment
 * @returns Response from soneium.network
 */
async function handleProxyExplorerQuery(query: Record<string, string>, bitgoEnv: string): Promise<any> {
  const body = {
    jsonrpc: '2.0',
    method: query.action,
    params: [
      {
        to: query.to,
        data: addHexPrefix(query.data),
      },
      query.tag || 'latest',
    ],
    id: 1,
  };

  const response = await request.post(common.Environments[bitgoEnv].soneiumExplorerBaseUrl + '/api/eth-rpc').send(body);

  if (!response.ok) {
    throw new Error('Could not reach soneium.network');
  }

  if (response.body.status === RESPONSE_STATUS_ERROR && response.body.message === RESPONSE_MESSAGE_NOTOK) {
    throw new Error('Soneium.network rate limit reached');
  }

  return response.body;
}

/**
 * Make a query to soneium.network for information such as balance, token balance, solidity calls
 * @param query Query parameters
 * @param bitgoEnv BitGo environment
 * @returns Response from soneium.network
 */
export async function recoveryBlockchainExplorerQuery(query: Record<string, string>, bitgoEnv: string): Promise<any> {
  try {
    if (query.module === 'proxy') {
      return await handleProxyExplorerQuery(query, bitgoEnv);
    }
    return await handleStandardExplorerQuery(query, bitgoEnv);
  } catch (error) {
    throw new Error(`Could not query soneium explorer, error: ${error?.message || 'Unknown error'}`);
  }
}
