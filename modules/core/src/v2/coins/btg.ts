import { BitGo } from '../../bitgo';
import { BaseCoin, VerifyRecoveryTransactionOptions } from '../baseCoin';
import { Btc } from './btc';
import * as utxolib from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import * as errors from '../../errors';
import { InsightApi } from './utxo/recovery/insightApi';
import { AddressInfo, UnspentInfo } from './abstractUtxoCoin';

export class Btg extends Btc {
  constructor(bitgo: BitGo, network?: any) {
    super(bitgo, network || utxolib.networks.bitcoingold);
  }

  static createInstance(bitgo): BaseCoin {
    return new Btg(bitgo);
  }

  getChain(): string {
    return 'btg';
  }

  getFamily(): string {
    return 'btg';
  }

  getFullName(): string {
    return 'Bitcoin Gold';
  }

  supportsBlockTarget(): boolean {
    return false;
  }

  supportsP2shP2wsh(): boolean {
    return true;
  }

  supportsP2wsh(): boolean {
    return true;
  }

  supportsP2tr(): boolean {
    return false;
  }

  getAddressInfoFromExplorer(addressBase58: string): Promise<AddressInfo> {
    return InsightApi.forCoin(this).getAddressInfo(addressBase58);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Promise<UnspentInfo[]> {
    return InsightApi.forCoin(this).getUnspentInfo(addressBase58);
  }

  verifyRecoveryTransaction(txInfo: VerifyRecoveryTransactionOptions): Bluebird<any> {
    return Bluebird.reject(new errors.MethodNotImplementedError());
  }
}
