/**
 * @prettier
 */
import { formatOutputId, Unspent } from '@bitgo/utxo-lib/dist/src/bitgo';
import { RecoveryAccountData, RecoveryProvider } from './RecoveryProvider';
import { ApiNotImplementedError, BaseApi } from './baseApi';

// https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddress
type EsploraAddressStats = {
  tx_count: number;
  funded_txo_sum: number;
  spent_txo_sum: number;
};

type EsploraAddress = {
  address: string;
  chain_stats: EsploraAddressStats;
  mempool_staats: EsploraAddressStats;
};

// https://github.com/Blockstream/esplora/blob/master/API.md#get-addressaddressutxo
type EsploraUnspent = {
  txid: string;
  vout: number;
  status: unknown;
  value: number;
};

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
    const response = await this.get<EsploraAddress>(`/address/${address}`);
    return response.map((body) => {
      const totalBalance = body.chain_stats.funded_txo_sum - body.chain_stats.spent_txo_sum;
      return {
        txCount: body.chain_stats.tx_count,
        totalBalance,
      };
    });
  }

  /** @inheritDoc */
  async getUnspents(address: string): Promise<Unspent[]> {
    const res = await this.get<EsploraUnspent[]>(`/address/${address}/utxo`);

    return res.map((unspents) => {
      return unspents.map((unspent) => {
        return {
          id: formatOutputId(unspent),
          address,
          value: unspent.value,
        };
      });
    });
  }
}
