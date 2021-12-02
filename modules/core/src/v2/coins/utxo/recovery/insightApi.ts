/**
 * @prettier
 */
import { RecoveryAccountData, RecoveryProvider, RecoveryUnspent } from './RecoveryProvider';
import { ApiNotImplementedError, BaseApi } from './baseApi';

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
    const res = await this.get<any>(`/addr/${addr}`);

    return res.map((body) => {
      body.txCount = body.txApperances;
      body.totalBalance = body.balanceSat;
      return body;
    });
  }

  async getUnspents(addr: string): Promise<RecoveryUnspent[]> {
    const res = await this.get<any>(`/addr/${addr}/utxo`);
    return res.map((body) => {
      body.forEach((unspent: any) => {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });
      return body as RecoveryUnspent[];
    });
  }
}
