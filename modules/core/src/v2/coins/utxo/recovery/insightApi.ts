import { AbstractUtxoCoin } from '../../index';
import { AddressInfo, UnspentInfo } from '../../abstractUtxoCoin';

import * as request from 'superagent';

/**
 * https://explorer.api.bitcoin.com/docs/bch/v1/
 */
export class InsightApi {
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

  static forCoin(coin: AbstractUtxoCoin): InsightApi {
    const baseUrl = InsightApi.baseUrl(coin.getChain());
    if (!baseUrl) {
      throw new Error(`could not find baseUrl for ${coin.getChain()}`);
    }
    return new InsightApi(baseUrl);
  }

  constructor(public baseUrl: string) {
    if (!baseUrl.startsWith('https://')) {
      throw new Error(`baseUrl must start with https://`);
    }
    if (baseUrl.endsWith(`/`)) {
      throw new Error(`baseUrl must not end with slash (/)`);
    }
  }

  async get<T>(path: string): Promise<T> {
    if (!path.startsWith('/')) {
      throw new Error(`url must start with slash (/)`);
    }
    const url = this.baseUrl + path;
    const result = await request.get(url);
    if (result.statusCode !== 200) {
      throw new Error(`Error in GET ${url}: ${result.statusCode} ${result.status}`);
    }
    return result.body as T;
  }

  async getAddressInfo(addr: string): Promise<AddressInfo> {
    const addrInfo: any = await this.get(`/addr/${addr}`);

    addrInfo.txCount = addrInfo.txApperances;
    addrInfo.totalBalance = addrInfo.balanceSat;

    return addrInfo as AddressInfo;
  }

  async getUnspentInfo(addr: string): Promise<UnspentInfo[]> {
    const unspents: any[] = await this.get(`/addr/${addr}/utxo`);

    unspents.forEach((unspent: any) => {
      unspent.amount = unspent.satoshis;
      unspent.n = unspent.vout;
    });

    return unspents as UnspentInfo[];
  }
}
