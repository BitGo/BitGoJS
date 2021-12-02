import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './RecoveryProvider';
import { ApiNotImplementedError, BaseApi, RequestOptions, Response } from './baseApi';

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
    // we are using blockchair api: https://blockchair.com/api/docs#link_300
    // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
    if (!address || address.length === 0) {
      throw new Error('invalid address');
    }
    const res = await this.get<any>(`/dashboards/address/${address}`);
    return res.map(body => {
      return {
        txCount: body.data[address].address.transaction_count,
        totalBalance: body.data[address].address.balance,
      };
    });
  }

  /** @inheritDoc */
  async getUnspents(address: string): Promise<RecoveryUnspent[]> {
    // using blockchair api: https://blockchair.com/api/docs#link_300
    // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
    // example utxo from response:
    // {block_id":-1,"transaction_hash":"cf5bcd42c688cb7c55b5811645e7f0d2a000a85564ca3d6b9fc20f57e14b30bb","index":1,"value":558},
    if (!address || address.length === 0) {
      throw new Error('invalid address');
    }
    const res = await this.get<any>(`/dashboards/address/${address}`);

    return res.map(body => {
      return body.data[address].utxo.map(unspent => {
        return {
          amount: unspent.value,
          n: unspent.index,
          txid: unspent.transaction_hash,
          address,
        };
      });
    });
  }
}
