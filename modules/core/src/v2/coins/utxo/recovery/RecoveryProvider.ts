import { AddressApi, BlockchairApi, BlockstreamApi, UtxoApi } from '@bitgo/blockapis';

import { ApiNotImplementedError } from './baseApi';

/**
 * An account with bear minimum information required for recoveries.
 */
export interface RecoveryAccountData {
  txCount: number,
  totalBalance: number,
}

/**
 * Factory for AddressApi & UtxoApi
 */
export class RecoveryProvider {
  static forCoin(coinName: string, apiToken?: string): AddressApi & UtxoApi {
    switch (coinName) {
      case 'btc':
      case 'tbtc':
        return BlockstreamApi.forCoin(coinName);
      case 'bch':
      case 'bcha':
      case 'bsv':
      case 'btg':
      case 'dash':
      case 'ltc':
      case 'zec':
        return BlockchairApi.forCoin(coinName, { apiToken });
    }

    throw new ApiNotImplementedError(coinName);
  }
}
