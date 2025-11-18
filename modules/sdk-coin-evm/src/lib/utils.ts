import { CoinFeature, NetworkType, BaseCoin, EthereumNetwork } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';
import request from 'superagent';
import { InvalidTransactionError } from '@bitgo/sdk-core';

/**
 * @param {NetworkType} network either mainnet or testnet
 * @returns {EthereumCommon} Ethereum common configuration object
 */
export function getCommon(coin: Readonly<BaseCoin>): EthereumCommon {
  if (!coin.features.includes(CoinFeature.SHARED_EVM_SDK)) {
    throw new InvalidTransactionError(`Cannot use common sdk module for the coin ${coin.name}`);
  }
  return EthereumCommon.custom(
    {
      name: coin.network.name,
      networkId: (coin.network as EthereumNetwork).chainId,
      chainId: (coin.network as EthereumNetwork).chainId,
    },
    {
      baseChain: coin.network.type === NetworkType.MAINNET ? 'mainnet' : 'sepolia',
      hardfork: coin.features.includes(CoinFeature.EIP1559) ? 'london' : undefined,
      eips: coin.features.includes(CoinFeature.EIP1559) ? [1559] : undefined,
    }
  );
}

function tinybarsToWei(tinybars: string): string {
  // Convert from tinybars to wei (1 HBAR = 10^8 tinybars, 1 HBAR = 10^18 wei)
  // So: wei = tinybars * 10^10
  return (BigInt(tinybars) * BigInt('10000000000')).toString();
}

/**
 *
 * @param query - etherscan query parameters for the API call
 * @param rpcUrl - RPC URL of the Hedera network
 * @param explorerUrl - base URL of the Hedera Mirror Node API
 * @param token - optional API key to use for the query
 * @returns
 */
export async function recovery_HBAREVM_BlockchainExplorerQuery(
  query: Record<string, string>,
  rpcUrl: string,
  explorerUrl: string,
  token?: string
): Promise<Record<string, unknown>> {
  // Hedera Mirror Node API does not use API keys, but we keep this for compatibility
  if (token) {
    query.apikey = token;
  }

  const { module, action } = query;

  // Remove trailing slash from explorerUrl if present
  const baseUrl = explorerUrl.replace(/\/$/, '');

  switch (`${module}.${action}`) {
    case 'account.balance':
      return await queryAddressBalanceHedera(query, baseUrl);

    case 'account.txlist':
      return await getAddressNonceHedera(query, baseUrl);

    case 'account.tokenbalance':
      return await queryTokenBalanceHedera(query, baseUrl);

    case 'proxy.eth_gasPrice':
      return await getGasPriceFromRPC(query, rpcUrl);

    case 'proxy.eth_estimateGas':
      return await getGasLimitFromRPC(query, rpcUrl);

    case 'proxy.eth_call':
      return await querySequenceIdFromRPC(query, rpcUrl);

    default:
      throw new Error(`Unsupported API call: ${module}.${action}`);
  }
}

/**
 * 1. Gets address balance using Hedera Mirror Node API
 */
async function queryAddressBalanceHedera(
  query: Record<string, string>,
  baseUrl: string
): Promise<Record<string, unknown>> {
  const address = query.address;
  const url = `${baseUrl}/accounts/${address}`;
  const response = await request.get(url).send();

  if (!response.ok) {
    throw new Error('could not reach explorer');
  }

  const balance = response.body.balance?.balance || '0';

  const balanceInWei = tinybarsToWei(balance);

  return { result: balanceInWei };
}

/**
 * 2. Gets nonce using Hedera Mirror Node API
 */
async function getAddressNonceHedera(query: Record<string, string>, baseUrl: string): Promise<Record<string, unknown>> {
  const address = query.address;
  const accountUrl = `${baseUrl}/accounts/${address}`;
  const response = await request.get(accountUrl).send();

  if (!response.ok) {
    throw new Error('could not reach explorer');
  }

  const nonce = response.body.ethereum_nonce || 0;

  return { nonce: nonce };
}

/**
 * 3. Gets token balance using Hedera Mirror Node API
 */
async function queryTokenBalanceHedera(
  query: Record<string, string>,
  baseUrl: string
): Promise<Record<string, unknown>> {
  const contractAddress = query.contractaddress;
  const address = query.address;

  // Get token balances for the account
  const url = `${baseUrl}/accounts/${address}/tokens`;
  const response = await request.get(url).send();

  if (!response.ok) {
    throw new Error('could not reach explorer');
  }

  // Find the specific token balance
  const tokens = response.body.tokens || [];
  const tokenBalance = tokens.find(
    (token: { token_id: string; contract_address: string; balance: number }) =>
      token.token_id === contractAddress || token.contract_address === contractAddress
  );

  const balance = tokenBalance && tokenBalance.balance !== null ? tokenBalance.balance.toString() : '0';

  const balanceInWei = tinybarsToWei(balance);

  return { result: balanceInWei };
}

/**
 * 4. Gets sequence ID using RPC call
 */
async function querySequenceIdFromRPC(query: Record<string, string>, rpcUrl: string): Promise<Record<string, unknown>> {
  const { to, data } = query;

  const requestBody = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: to,
        data: data,
      },
    ],
    id: 1,
  };

  const response = await request.post(rpcUrl).send(requestBody).set('Content-Type', 'application/json');

  if (!response.ok) {
    throw new Error('could not fetch sequence ID from RPC');
  }

  return response.body;
}

/**
 * 5. getGasPriceFromRPC - Gets gas price using Hedera Mirror Node API
 */
async function getGasPriceFromRPC(query: Record<string, string>, rpcUrl: string): Promise<Record<string, unknown>> {
  const requestBody = {
    jsonrpc: '2.0',
    method: 'eth_gasPrice',
    params: [],
    id: 1,
  };

  const response = await request.post(rpcUrl).send(requestBody).set('Content-Type', 'application/json');

  if (!response.ok) {
    throw new Error('could not fetch gas price from RPC');
  }

  return response.body;
}

/**
 * 6. getGasLimitFromRPC - Gets gas limit estimate using RPC call.
 */
async function getGasLimitFromRPC(query: Record<string, string>, rpcUrl: string): Promise<Record<string, unknown>> {
  const { from, to, data } = query;

  const requestBody = {
    jsonrpc: '2.0',
    method: 'eth_estimateGas',
    params: [
      {
        from,
        to,
        data,
      },
    ],
    id: 1,
  };
  const response = await request.post(rpcUrl).send(requestBody).set('Content-Type', 'application/json');

  if (!response.ok) {
    throw new Error('could not estimate gas limit from RPC');
  }

  return response.body;
}
