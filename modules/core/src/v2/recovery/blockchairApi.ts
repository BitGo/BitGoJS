import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './types';
import * as common from '../../common';
import * as request from 'superagent';
import { BitGo } from '../../bitgo';

const BlockchairCoin = [
  'bitcoin',
  'bitcoin-sv'
];

const devBase = ['dev', 'latest', 'local', 'localNonSecure', 'adminDev', 'adminLatest'];
const testnetBase = ['test', 'adminTest'];
const mainnetBase = ['prod', 'staging', 'adminProd'];

export class BlockchairApi implements RecoveryProvider {
  protected readonly bitgo: BitGo;
  protected readonly apiToken?: string;
  protected readonly coin: string;


  constructor(bitgo: BitGo, coin: string, apiToken?: string ) {
    if (!BlockchairCoin.includes(coin)) {
      throw new Error(`coin ${coin} not supported by blockchair`);
    }
    this.bitgo = bitgo;
    this.coin = coin;
    this.apiToken = apiToken;
  }

  /** @inheritDoc */
  getExplorerUrl(query: string): string {
    const env = this.bitgo.getEnv();
    let url;
    if (mainnetBase.includes(env)) {
      url = 'https://api.blockchair.com/';
    } else if (testnetBase.includes(env) || devBase.includes((env))) {
      url = `https://api.blockchair.com/${this.coin}/testnet`;
    } else if (env === 'mock') {
      url = 'https://api.blockchair.fakeurl/${coin}/testnet';
    } else {
      throw new Error(`Environment ${env} unsupported`);
    }

    if (this.apiToken) {
      return url + query + `?key=${this.apiToken}`;
    }
    return url + query;
  }

  /** @inheritDoc */
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    // we are using blockchair api: https://blockchair.com/api/docs#link_300
    // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
    if(!address || address.length === 0) {
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
    if(!address || address.length === 0) {
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
