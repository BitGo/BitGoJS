import util from 'util';
import axios, { AxiosError } from 'axios';
import buildDebug from 'debug';
import { SuiObjectData, SuiTransactionBlockResponse } from '../../src/lib/mystenlab/types';
import { DelegatedStake } from '../../src/lib/mystenlab/types/validator';

const debug = buildDebug('RpcClient');

function elideResponse(method: string): boolean {
  return method === 'sui_getProtocolConfig';
}

function unwrapResult<A>(method: string, v: { result: A } | { error: { code: number; message: string } }): A {
  if ('error' in v) {
    debug('< %s ERROR', method, v.error);
    throw new Error(JSON.stringify(v.error));
  }
  if (elideResponse(method)) {
    debug('< %s ...', method);
  } else {
    debug('< %s', method, util.inspect(v.result, { depth: 10 }));
  }
  return v.result;
}

export class RpcError extends Error {
  constructor(public rpcError: { code: number; message: string }) {
    super(`RPC error: ${rpcError.message} (code=${rpcError.code})`);
  }

  static isRpcErrorWithCode(e: Error, code: number): boolean {
    return e instanceof RpcError && e.rpcError.code === code;
  }
}

export type Coin = {
  coinType: string;
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  previousTransaction: string;
};

/** Wrapper around https://docs.sui.io/sui-jsonrpc */
export class RpcClient {
  // Running counter, increments every request
  id = 0;

  constructor(public url: string) {}

  static async createCheckedConnection(url: string): Promise<RpcClient> {
    const rpcClient = new RpcClient(url);
    const { protocolVersion } = await rpcClient.exec<{ protocolVersion: string }>('sui_getProtocolConfig');
    const chainId = await rpcClient.exec('sui_getChainIdentifier');
    debug('Connected to', url, 'protocolVersion', protocolVersion, 'chainId', chainId);
    return rpcClient;
  }

  async exec<T>(method: string, ...params: unknown[]): Promise<T> {
    params = params.filter((v) => v !== undefined);
    try {
      debug('>', this.url, method, params);
      const response = await axios.post(this.url, {
        jsonrpc: '2.0',
        method,
        params,
        id: `${this.id++}`,
      });
      return unwrapResult(method, response.data);
    } catch (e) {
      if (e.isAxiosError && e.response) {
        e = e as AxiosError;
        debug('< %s ERROR', method, e.response.statusText, util.inspect(e.response.data, { depth: 10 }));
        e = e as AxiosError;
        const { error = {} } = e.response.data;
        throw new RpcError(error);
      }

      throw e;
    }
  }

  /**
   * https://docs.sui.io/sui-jsonrpc#suix_getCoins
   */
  async getCoins(
    owner: string,
    coinType?: string,
    cursor?: string,
    limit?: number
  ): Promise<{
    data: Coin[];
    nextCursor?: string;
    hasNextPage?: boolean;
  }> {
    return this.exec('suix_getCoins', owner, coinType, cursor, limit);
  }

  async executeTransactionBlock(
    tx_bytes: string,
    signatures: string[],
    options?: unknown,
    request_type?: unknown
  ): Promise<SuiTransactionBlockResponse> {
    return this.exec(
      'sui_executeTransactionBlock',
      tx_bytes,
      signatures,
      {
        showInput: true,
        showRawInput: true,
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
        showBalanceChanges: true,
      },
      request_type
    );
  }

  /**
   * https://docs.sui.io/sui-jsonrpc#suix_getValidatorsApy
   * APY = Annual Percentage Yield
   */
  async getValidatorsApy(): Promise<{
    apys: { address: string; apy: string }[];
    epoch: string;
  }> {
    return this.exec('suix_getValidatorsApy');
  }

  /**
   * https://docs.sui.io/sui-jsonrpc#suix_getStakes
   */
  async getStakes(owner: string): Promise<DelegatedStake[]> {
    return this.exec('suix_getStakes', owner);
  }

  /**
   * https://docs.sui.io/sui-jsonrpc#sui_getObject
   */
  async getObject(object_id: string): Promise<{ data: SuiObjectData }> {
    return this.exec('sui_getObject', object_id, { showData: true });
  }
}
