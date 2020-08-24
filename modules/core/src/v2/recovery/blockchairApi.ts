import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './types';
import * as common from '../../common';
import * as request from 'superagent';
import { BitGo } from '../../bitgo';

export class BlockchairApi implements RecoveryProvider {
  protected readonly bitgo: BitGo;
  protected readonly apiToken?: string;

  constructor(bitgo: BitGo, apiToken?: string) {
    this.bitgo = bitgo;
    this.apiToken = apiToken;
  }

  /** @inheritDoc */
  getExplorerUrl(query: string): string {
    if (this.apiToken) {
      return common.Environments[this.bitgo.getEnv()].blockchairBaseUrl + query + `?key=${this.apiToken}` ;
    }
    return common.Environments[this.bitgo.getEnv()].blockchairBaseUrl + query;
  }

  /** @inheritDoc */
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    // we are using blockchair api: https://blockchair.com/api/docs#link_300
    // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
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
