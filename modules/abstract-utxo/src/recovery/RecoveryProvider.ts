import { AddressApi, UtxoApi, BlockchairApi, BlockstreamApi } from '@bitgo/blockapis';
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
export type RecoveryProvider = AddressApi & UtxoApi;

export function forCoin(coinName: string, apiToken?: string): RecoveryProvider {
  switch (coinName) {
    case 'btc':
    case 'tbtc':
      return BlockstreamApi.forCoin(coinName);
    case 'bch':
    case 'bcha':
    case 'bsv':
    case 'btg':
    case 'dash':
    case 'doge':
    case 'ltc':
    case 'zec':
      return BlockchairApi.forCoin(coinName, { apiToken });
  }

  throw new ApiNotImplementedError(coinName);
}
