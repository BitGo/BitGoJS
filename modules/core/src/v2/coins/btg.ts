import { BitGo } from '../../bitgo';
import { BaseCoin, VerifyRecoveryTransactionOptions } from '../baseCoin';
import { Btc } from './btc';
import * as utxolib from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
import * as common from '../../common';
import * as errors from '../../errors';
const request = require('superagent');

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

  recoveryBlockchainExplorerUrl(url: string): string {
    const baseUrl = common.Environments[this.bitgo.getEnv()].btgExplorerBaseUrl;

    if (!baseUrl) {
      throw new Error(`Recoveries not supported for ${this.getChain()} - no explorer available`);
    }

    return common.Environments[this.bitgo.getEnv()].btgExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string): Bluebird<any> {
    const self = this;
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(self.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      (addrInfo as any).txCount = (addrInfo as any).txApperances;
      (addrInfo as any).totalBalance = (addrInfo as any).balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<any> {
    const self = this;
    return co(function *getUnspentInfoFromExplorer() {
      const unspents = yield request.get(self.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      (unspents as any).forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }

  verifyRecoveryTransaction(txInfo: VerifyRecoveryTransactionOptions): Bluebird<any> {
    return Bluebird.reject(new errors.MethodNotImplementedError());
  }
}
