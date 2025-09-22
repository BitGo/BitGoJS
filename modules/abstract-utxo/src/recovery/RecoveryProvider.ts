import { BlockchairApi, AddressInfo, TransactionIO } from '@bitgo-beta/blockapis';
import { bitgo } from '@bitgo-beta/utxo-lib';

import { ApiNotImplementedError } from './baseApi';

type Unspent<TNumber extends number | bigint = number> = bitgo.Unspent<TNumber>;

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
      return BlockchairApi.forCoin(coinName, { apiToken });
  }

  throw new ApiNotImplementedError(coinName);
}
