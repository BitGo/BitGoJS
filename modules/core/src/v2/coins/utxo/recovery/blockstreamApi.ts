import { RecoveryAccountData, RecoveryUnspent, RecoveryProvider } from './RecoveryProvider';
import { ApiNotImplementedError, BaseApi } from './baseApi';

export class BlockstreamApi extends BaseApi implements RecoveryProvider {
  static forCoin(coinName: string): BlockstreamApi {
    switch (coinName) {
      case 'btc':
        return new BlockstreamApi('https://blockstream.info/api');
      case 'tbtc':
        return new BlockstreamApi('https://blockstream.info/testnet/api');
    }

    throw new ApiNotImplementedError(coinName);
  }

  constructor(baseUrl: string) {
    super(baseUrl);
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
    const response = await this.get<any>(`/address/${address}`);
    return response.map(body => {
      const totalBalance = body.chain_stats.funded_txo_sum - body.chain_stats.spent_txo_sum;
      return {
        txCount: body.chain_stats.tx_count,
        totalBalance,
      };
    });
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
    const res = await this.get<any>(`/address/${address}/utxo`);

    return res.map(unspents => {
      return unspents.map(unspent => {
        return {
          amount: unspent.value,
          n: unspent.vout,
          txid: unspent.txid,
          address,
        };
      });
    });
  }
}
