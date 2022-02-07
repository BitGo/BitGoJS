import { AddressInfo, BlockchairApi, BlockstreamApi } from '@bitgo/blockapis';
import { Unspent } from '@bitgo/utxo-lib/dist/src/bitgo/Unspent';

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
export interface RecoveryProvider {
  getUnspentsForAddresses(addresses: string[]): Promise<Unspent[]>;
  getAddressInfo(address: string): Promise<AddressInfo>;
}

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
    case 'ltc':
    case 'zec':
      return BlockchairApi.forCoin(coinName, { apiToken });
  }

  throw new ApiNotImplementedError(coinName);
}
