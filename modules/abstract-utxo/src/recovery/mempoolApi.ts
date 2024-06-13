/**
 * @prettier
 */
import * as _ from 'lodash';

import { ApiNotImplementedError, BaseApi } from './baseApi';

export class MempoolApi extends BaseApi {
  static forCoin(coinName: string): MempoolApi {
    switch (coinName) {
      case 'btc':
      case 'tbtc':
        // FIXME: tbtc is enabled here for legacy reasons;
        return new MempoolApi('https://mempool.space/api/v1');
    }
    throw new ApiNotImplementedError(coinName);
  }

  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async getRecoveryFeePerBytes(): Promise<number> {
    const res = await this.get<any>('/fees/recommended');
    return res.map((body) => {
      if (body.fastestFee && _.isInteger(body.fastestFee)) {
        return body.fastestFee;
      } else if (body.hourFee && _.isInteger(body.hourFee)) {
        return body.hourFee;
      }
      throw new Error('unexpected response');
    });
  }
}
