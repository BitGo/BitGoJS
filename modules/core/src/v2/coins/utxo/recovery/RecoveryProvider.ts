import { BlockstreamApi } from './blockstreamApi';
import { BlockchairApi } from './blockchairApi';
import { InsightApi } from './insightApi';
import { ApiNotImplementedError } from './baseApi';
import { PublicUnspent } from '../unspent';

/**
 * An account with bear minimum information required for recoveries.
 */
export interface RecoveryAccountData {
  txCount: number,
  totalBalance: number,
}

/**
 * Methods required to perform different recovery actions in UTXO coins.
 */
export abstract class RecoveryProvider {
  abstract getAccountInfo(address: string): Promise<RecoveryAccountData>
  abstract getUnspents(address: string): Promise<PublicUnspent[]>;

  static forCoin(coinName: string, apiKey?: string): RecoveryProvider {
    switch (coinName) {
      case 'btc':
      case 'tbtc':
        return BlockstreamApi.forCoin(coinName);
      case 'bch':
      case 'tbch':
      case 'bcha':
      case 'tbcha': // this coin only exists in tests
      case 'bsv':
      case 'tbsv':
        return BlockchairApi.forCoin(coinName, apiKey);
      case 'btg':
      case 'dash':
      case 'tdash':
      case 'ltc':
      case 'tltc':
      case 'zec':
      case 'tzec':
        return InsightApi.forCoin(coinName);
    }

    throw new ApiNotImplementedError(coinName);
  }
}
