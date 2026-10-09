import { ApiRequestError, BlockchairApi, AddressInfo, TransactionIO } from '@bitgo/blockapis';
import { RecoveryProviderError } from '@bitgo/sdk-core';

import type { Unspent } from '../unspent';

import { ApiNotImplementedError } from './baseApi';

/**
 * An account with bear minimum information required for recoveries.
 */
export interface RecoveryAccountData {
  txCount: number;
  totalBalance: number;
}

/**
 * Factory for AddressApi & UtxoApi
 */
export interface RecoveryProvider<TNumber extends number | bigint = number> {
  getUnspentsForAddresses(addresses: string[]): Promise<Unspent<TNumber>[]>;
  getAddressInfo(address: string): Promise<AddressInfo>;
  getTransactionHex(txid: string): Promise<string>;
  getTransactionIO(txid: string): Promise<TransactionIO>;
}

/**
 * Re-map `@bitgo/blockapis` provider failures (`ApiRequestError`) to the shared
 * `RecoveryProviderError` so a recovery scanner can distinguish "indexer failed"
 * from "wallet is empty". `ApiRequestError` is the single error type the blockchair
 * http client surfaces for network failures, non-2xx responses, and malformed bodies.
 */
function wrapProviderErrors<T extends RecoveryProvider>(provider: T): T {
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args: unknown[]) =>
          Promise.resolve(value.apply(target, args)).catch((e: unknown) => {
            if (e instanceof ApiRequestError) {
              throw new RecoveryProviderError(e.message, e);
            }
            throw e;
          });
      }
      return value;
    },
  }) as T;
}

export function forCoin(coinName: string, apiToken?: string): RecoveryProvider<number> {
  switch (coinName) {
    case 'btc':
    case 'tbtc':
    case 'bch':
    case 'bcha':
    case 'bsv':
    case 'btg':
    case 'dash':
    case 'doge':
    case 'ltc':
    case 'zec':
      return wrapProviderErrors(BlockchairApi.forCoin(coinName, { apiToken }));
  }

  throw new ApiNotImplementedError(coinName);
}
