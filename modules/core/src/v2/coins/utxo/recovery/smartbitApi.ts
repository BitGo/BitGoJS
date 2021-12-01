/**
 * @prettier
 */
import * as request from 'superagent';
import * as utxolib from '@bitgo/utxo-lib';
import { ApiNotImplementedError, ApiRequestError } from './errors';

export class SmartbitApi {
  static forCoin(coinName: string): SmartbitApi {
    switch (coinName) {
      case 'btc':
        return new SmartbitApi('https://api.smartbit.com.au/v1');
      case 'tbtc':
        return new SmartbitApi('https://testnet-api.smartbit.com.au/v1');
    }
    throw new ApiNotImplementedError(coinName);
  }

  constructor(public baseUrl: string) {}

  /**
   * Verify that the txhex user signs correspond to the correct tx they intended
   * by 1) getting back the decoded transaction based on the txhex
   * and then 2) compute the txid (hash), h1 of the decoded transaction 3) compare h1
   * to the txid (hash) of the transaction (including unspent info) we constructed
   */
  async verifyRecoveryTransaction(tx: utxolib.bitgo.UtxoTransaction): Promise<unknown> {
    const url = this.baseUrl + '/blockchain/decodetx';
    let res;
    try {
      res = await request.post(url).send({ hex: tx.toBuffer().toString('hex') });
    } catch (e) {
      throw new ApiRequestError(url, e);
    }

    if (res.ok) {
      throw new ApiRequestError(url, res.status);
    }

    /**
     * Smartbit's response when something goes wrong
     * {"success":false,"error":{"code":"REQ_ERROR","message":"TX decode failed"}}
     * we should process the error message here
     * interpret the res from smartbit
     */
    if (!res.body.success) {
      throw new Error(res.body.error.message);
    }

    const transactionDetails = res.body.transaction;

    if (transactionDetails.TxId !== tx.getId()) {
      console.log('txhash/txid returned by blockexplorer: ', transactionDetails.TxId);
      console.log('txhash/txid of the transaction bitgo constructed', tx.getId());
      throw new Error('inconsistent recovery transaction id');
    }
    return transactionDetails;
  }
}
