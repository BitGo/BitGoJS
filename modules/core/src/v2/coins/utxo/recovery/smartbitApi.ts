/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import { ApiNotImplementedError, BaseApi } from './baseApi';

export class SmartbitApi extends BaseApi {
  static forCoin(coinName: string): SmartbitApi {
    switch (coinName) {
      case 'btc':
        return new SmartbitApi('https://api.smartbit.com.au/v1');
      case 'tbtc':
        return new SmartbitApi('https://testnet-api.smartbit.com.au/v1');
    }
    throw new ApiNotImplementedError(coinName);
  }

  constructor(baseUrl: string) {
    super(baseUrl);
  }

  async getTransactionDetails(tx: utxolib.bitgo.UtxoTransaction): Promise<unknown> {
    const path = '/blockchain/decodetx';
    const res = await this.post<any>(path, { hex: tx.toBuffer().toString('hex') });

    /**
     * Smartbit's response when something goes wrong
     * {"success":false,"error":{"code":"REQ_ERROR","message":"TX decode failed"}}
     * we should process the error message here
     * interpret the res from smartbit
     */

    return res.map((body) => {
      if (!body.success) {
        throw new Error(body.error.message);
      }
      return body.transaction;
    });
  }
}
