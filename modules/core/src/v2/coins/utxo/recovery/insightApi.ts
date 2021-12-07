/**
 * @prettier
 */
import { formatOutputId, Unspent } from '@bitgo/utxo-lib/src/bitgo';
import { RecoveryAccountData, RecoveryProvider } from './RecoveryProvider';
import { ApiNotImplementedError, BaseApi } from './baseApi';

// https://explorer.api.bitcoin.com/docs/bch/v1/#/addr/addrGetUtxo
type InsightUnspent = {
  address: string;
  txid: string;
  vout: number;
  satoshis: number;
};

// https://explorer.api.bitcoin.com/docs/bch/v1/#/addr/addr
export type InsightAddr = {
  addrStr: string;
  balanceSat: number;
  txAppearances: number;
};

// https://explorer.api.bitcoin.com/docs/bch/v1/#/addrs/addrsGetUtxo
export type InsightAddrUtxo = {
  txid: string;
  vout: number;
  address: string;
  scriptPubKey: string;
  satoshis: number;
};

/**
 * https://explorer.api.bitcoin.com/docs/bch/v1/
 */
export class InsightApi extends BaseApi implements RecoveryProvider {
  static baseUrl(coinName: string): string | undefined {
    switch (coinName) {
      case 'dash':
        return 'https://insight.dash.org/insight-api';
      case 'tdash':
        return 'https://testnet-insight.dashevo.org/insight-api';
      case 'ltc':
        return 'https://insight.litecore.io/api';
      case 'tltc':
        // FIXME: defunct
        return 'https://insight.litecore-test.io/api';
      case 'zec':
        return 'https://zcashnetwork.info/api';
      case 'tzec':
        // FIXME: defunct
        return 'https://explorer.testnet.z.cash/api';
    }
  }

  static forCoin(coinName: string): InsightApi {
    const baseUrl = InsightApi.baseUrl(coinName);
    if (!baseUrl) {
      throw new ApiNotImplementedError(coinName);
    }
    return new InsightApi(baseUrl);
  }

  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async getAccountInfo(addr: string): Promise<RecoveryAccountData> {
    const res = await this.get<InsightAddr>(`/addr/${addr}`);

    return res.map((body) => {
      return {
        txCount: body.txAppearances,
        totalBalance: body.balanceSat,
      };
    });
  }

  async getUnspents(addr: string): Promise<Unspent[]> {
    const res = await this.get<InsightUnspent[]>(`/addr/${addr}/utxo`);
    return res.map((body) => {
      return body.map((unspent) => {
        return {
          id: formatOutputId(unspent),
          address: unspent.address,
          value: unspent.satoshis,
        };
      });
    });
  }
}
