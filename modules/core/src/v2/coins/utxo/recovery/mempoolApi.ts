/**
 * @prettier
 */
import * as _ from 'lodash';
import * as request from 'superagent';

import { toBitgoRequest } from '../../../../api';
import { ApiNotImplementedError, ApiRequestError } from './errors';

export class MempoolApi {
  static forCoin(coinName: string): MempoolApi {
    switch (coinName) {
      case 'btc':
      case 'tbtc':
        // FIXME: tbtc is enabled here for legacy reasons;
        return new MempoolApi('https://mempool.space/api/v1');
    }
    throw new ApiNotImplementedError(coinName);
  }

  constructor(public baseUrl: string) {}

  async getRecoveryFeePerBytes(): Promise<number> {
    const recoveryFeeUrl = this.baseUrl + '/fees/recommended';

    const publicFeeDataReq = request.get(recoveryFeeUrl);
    publicFeeDataReq.forceV1Auth = true;
    const publicFeeData = await toBitgoRequest(publicFeeDataReq).result();
    if (publicFeeData && publicFeeData.hourFee && _.isInteger(publicFeeData.hourFee)) {
      return publicFeeData.hourFee;
    }

    throw new ApiRequestError(recoveryFeeUrl, 'unexpected response');
  }
}
