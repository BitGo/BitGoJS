/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Bch } from './bch';
import * as bitcoin from 'bitgo-utxo-lib';
const request = require('superagent');
import * as Bluebird from 'bluebird';
import { BaseCoin } from '../baseCoin';
import { UtxoNetwork } from './abstractUtxoCoin';
const co = Bluebird.coroutine;
import * as common from '../../common';
import * as errors from '../../errors';

export class Bsv extends Bch {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || bitcoin.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bsv(bitgo);
  }

  getChain(): string {
    return 'bsv';
  }

  getFamily(): string {
    return 'bsv';
  }

  getFullName(): string {
    return 'Bitcoin SV';
  }

  recoveryBlockchainExplorerUrl(url: string): string {
    const baseUrl = common.Environments[this.bitgo.getEnv()].bsvExplorerBaseUrl;

    // TODO BG-9989: There is no explorer api for Bitcoin SV yet. Once we have one, add it to src/common.js and update
    // this method.
    if (!baseUrl) {
      throw new errors.WalletRecoveryUnsupported(
        `Recoveries not supported for ${this.getChain()} - no explorer available`
      );
    }

    return common.Environments[this.bitgo.getEnv()].bsvExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string): Bluebird<any> {
    const self = this;
    return co(function* getAddressInfoFromExplorer() {
      // TODO BG-9989: Update this method with the correct API route and parsing once we have one
      const addrInfo = yield request.get(self.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<any> {
    const self = this;
    return co(function* getUnspentInfoFromExplorer() {
      // TODO BG-9989: Update this method with the correct API route and parsing once we have one
      const unspents = yield request.get(self.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }
}
