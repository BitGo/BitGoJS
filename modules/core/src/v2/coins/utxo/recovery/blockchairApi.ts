import { RecoveryAccountData, RecoveryProvider } from './RecoveryProvider';
import { ApiNotImplementedError, BaseApi, RequestOptions, Response } from './baseApi';
import { formatOutputId, PublicUnspent } from '../unspent';

export type BlockchairResponse<T> = {
  data: T;
};

// https://blockchair.com/api/docs#link_300
export type BlockchairUnspent = {
  transaction_hash: string;
  index: number;
  address: string;
  value: number;
  block_id: number;
};

// https://blockchair.com/api/docs#link_300
export type BlockchairAddress = {
  [address: string]: {
    address: {
      transaction_hash: string;
      // vout
      index: number;
      value: number;
      block_id: number;
      transaction_count: number;
      balance: number;
    };
    utxo: BlockchairUnspent[];
  };
};


export class BlockchairApi extends BaseApi implements RecoveryProvider {
  protected readonly apiToken?: string;

  static forCoin(coinName: string, apiToken?: string): BlockchairApi {
    // https://blockchair.com/api/docs#link_M0
    let blockchain;
    switch (coinName) {
      case 'btc':
        blockchain = 'bitcoin';
        break;
      case 'tbtc':
        blockchain = 'bitcoin/testnet';
        break;
      case 'bsv':
        blockchain = 'bitcoin-sv';
        break;
      case 'bch':
        blockchain = 'bitcoin-cash';
        break;
      case 'bcha':
        blockchain = 'ecash';
        break;
      case 'ltc':
        blockchain = 'litecoin';
        break;
      case 'dash':
        blockchain = 'dash';
        break;
      case 'zec':
        blockchain = 'zcash';
        break;
      case 'tbsv':
      case 'tbch':
      case 'tbcha':
        // FIXME: these only exist to satisfy tests
        blockchain = 'mock-' + coinName;
        break;
      default:
        throw new ApiNotImplementedError(coinName);
    }
    return new BlockchairApi(`https://api.blockchair.com/${blockchain}`, apiToken);
  }

  constructor(baseUrl: string, apiToken?: string ) {
    super(baseUrl);
    this.apiToken = apiToken;
  }

  request<T>(method: string, path: string, body: unknown, params: RequestOptions): Promise<Response<T>> {
    return super.request(method, path + (this.apiToken ? `?key=${this.apiToken}` : ''), body, params);
  }

  /** @inheritDoc */
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    if (!address || address.length === 0) {
      throw new Error('invalid address');
    }
    // https://blockchair.com/api/docs#link_300
    const res = await this.get<BlockchairResponse<BlockchairAddress>>(`/dashboards/address/${address}`);
    return res.map(body => {
      return {
        txCount: body.data[address].address.transaction_count,
        totalBalance: body.data[address].address.balance,
      };
    });
  }

  /** @inheritDoc */
  async getUnspents(address: string): Promise<PublicUnspent[]> {
    if (!address || address.length === 0) {
      throw new Error('invalid address');
    }
    // https://blockchair.com/api/docs#link_300
    const res = await this.get<BlockchairResponse<BlockchairUnspent[]>>(`/dashboards/address/${address}`);
    return res.map(body => {
      return body.data[address].utxo.map((unspent): PublicUnspent => {
        return {
          id: formatOutputId(unspent.transaction_hash, unspent.index),
          address,
          value: unspent.value,
        };
      });
    });
  }
}
