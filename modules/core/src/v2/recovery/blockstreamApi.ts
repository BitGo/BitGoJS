import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './types';
import * as common from '../../common';
import * as request from 'superagent';
import { BitGo } from '../../bitgo';
import { BlockExplorerUnavailable } from '../../errors';

export class BlockstreamApi implements RecoveryProvider {
  protected readonly bitgo: BitGo;
  protected readonly apiToken?: string;

  constructor(bitgo: BitGo, apiToken?: string) {
    this.bitgo = bitgo;
    this.apiToken = apiToken;
  }

  /** @inheritDoc */
  getExplorerUrl(query: string): string {
    if (this.apiToken) {
      // TODO: Blockstream does not require an API key for now, howeveer, at some point they may
    }
    return common.Environments[this.bitgo.getEnv()].blockstreamBaseUrl + query;
  }

  /** @inheritDoc */
  async getAccountInfo(address: string): Promise<RecoveryAccountData> {
    // https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddress
    // Example response:
    // {
    //    "address":"2NBWFbV93FQE52yEV6C7QYQ6DKTbiMoDKuT",
    //    "chain_stats":{
    //       "funded_txo_count":2,
    //       "funded_txo_sum":2000000,
    //       "spent_txo_count":1,
    //       "spent_txo_sum":1000000,
    //       "tx_count":3
    //    },
    //    "mempool_stats":{
    //       "funded_txo_count":0,
    //       "funded_txo_sum":0,
    //       "spent_txo_count":0,
    //       "spent_txo_sum":0,
    //       "tx_count":0
    //    }
    // }
    try {
      const response = await request.get(this.getExplorerUrl(`/address/${address}`));
      const totalBalance = response.body.chain_stats.funded_txo_sum - response.body.chain_stats.spent_txo_sum;
      return {
        txCount: response.body.chain_stats.tx_count,
        totalBalance,
      };
    } catch (e) {
      let errorMessage = `Failed to get address information for ${address} from ${this.getExplorerUrl('')}`;
      errorMessage += (e.response.status) ? ` - ${e.response.status}` : '';
      errorMessage += (e.response.text) ? `: ${e.response.text}` : '';
      throw new BlockExplorerUnavailable(errorMessage);
    }
  }

  /** @inheritDoc */
  async getUnspents(address: string): Promise<RecoveryUnspent[]> {
    // https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddressutxo
    // Example response:
    // [
    //    {
    //       "txid":"5353100563d6a07d7d7085281222ced09cfb4dfd6e327da3168eac9de6b541fa",
    //       "vout":0,
    //       "status":{
    //          "confirmed":true,
    //          "block_height":1483577,
    //          "block_hash":"00000000000000b992bfa11e06204c34065ea1e666b447646f2b546ac3d1e79a",
    //          "block_time":1551823417
    //       },
    //       "value":1000000
    //    }
    // ]
    try {
      const response = await request.get(this.getExplorerUrl(`/address/${address}/utxo`));
      const rawUnspents = response.body;

      return rawUnspents.map(unspent => {
        return {
          amount: unspent.value,
          n: unspent.vout,
          txid: unspent.txid,
          address,
        };
      });
    } catch (e) {
      let errorMessage = `Failed to get unspents information for ${address} from ${this.getExplorerUrl('')}`;
      errorMessage += (e.response.status) ? ` - ${e.response.status}` : '';
      errorMessage += (e.response.text) ? `: ${e.response.text}` : '';
      throw new BlockExplorerUnavailable(errorMessage);
    }
  }
}
