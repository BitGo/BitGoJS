import * as request from 'superagent';

import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './RecoveryProvider';

export class BlockchairApi implements RecoveryProvider {
  public readonly baseUrl: string;
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
        throw new Error(`no baseUrl for coin ${coinName}`);
    }
    return new BlockchairApi(`https://api.blockchair.com/${blockchain}`, apiToken);
  }

  constructor(baseUrl: string, apiToken?: string ) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
  }

  /** @inheritdoc */
  getExplorerUrl(query: string): string {
    if (this.apiToken) {
      return this.baseUrl + query + `?key=${this.apiToken}`;
    }
    return this.baseUrl + query;
  }

  /** @inheritDoc */
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    // we are using blockchair api: https://blockchair.com/api/docs#link_300
    // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
    if (!address || address.length === 0) {
      throw new Error('invalid address');
    }
    const response = await request.get(this.getExplorerUrl(`/dashboards/address/${address}`));
    return {
      txCount: response.body.data[address].address.transaction_count,
      totalBalance: response.body.data[address].address.balance,
    };
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
    const response = await request.get(this.getExplorerUrl(`/dashboards/address/${address}`));

    const rawUnspents = response.body.data[address].utxo;

    return rawUnspents.map(unspent => {
      return {
        amount: unspent.value,
        n: unspent.index,
        txid: unspent.transaction_hash,
        address,
      };
    });
  }
}
