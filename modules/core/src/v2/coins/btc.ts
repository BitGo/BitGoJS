import * as utxolib from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as request from 'superagent';
const co = Bluebird.coroutine;

import { BitGo } from '../../bitgo';
import { BaseCoin, VerifyRecoveryTransactionOptions as BaseVerifyRecoveryTransactionOptions } from '../baseCoin';
import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';
import { KeyIndices } from '../keychains';
import { toBitgoRequest } from '../../api';

export interface VerifyRecoveryTransactionOptions extends BaseVerifyRecoveryTransactionOptions {
  transactionHex: string,
}

export class Btc extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoin);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Btc(bitgo);
  }

  getChain(): string {
    return 'btc';
  }

  getFamily(): string {
    return 'btc';
  }

  getFullName(): string {
    return 'Bitcoin';
  }

  supportsBlockTarget(): boolean {
    return true;
  }

  supportsP2shP2wsh(): boolean {
    return true;
  }

  supportsP2wsh(): boolean {
    return true;
  }

  supportsP2tr(): boolean {
    return true;
  }

  /* BTC needs all keys to sign for P2TR */
  keyIdsForSigning(): number[] {
    return [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO];
  }

  getRecoveryFeePerBytes(): Bluebird<number> {
    const self = this;
    return co<number>(function *getRecoveryFeePerBytes() {
      const recoveryFeeUrl = (yield self.getRecoveryFeeRecommendationApiBaseUrl()) as any;

      const publicFeeDataReq = request.get(recoveryFeeUrl);
      publicFeeDataReq.forceV1Auth = true;
      let publicFeeData;
      try {
        publicFeeData = yield toBitgoRequest(publicFeeDataReq).result();
        if (publicFeeData && publicFeeData.hourFee && _.isInteger(publicFeeData.hourFee)) {
          return publicFeeData.hourFee;
        }
      } catch (e) {
        // if bitcoinfees does not respond, we would resort to the default fee value, 100
        // but we don't want to block the recovery process
        console.dir(e);
      }
      return 100;
    }).call(this);
  }

  getRecoveryFeeRecommendationApiBaseUrl(): Bluebird<string> {
    return Bluebird.resolve('https://mempool.space/api/v1/fees/recommended');
  }

}
