import * as bitGoUtxoLib from 'bitgo-utxo-lib';
import * as Bluebird from 'bluebird';
import * as request from 'superagent';
import { BaseCoin } from '../baseCoin';
import { AbstractUtxoCoin } from './abstractUtxoCoin';
import * as common from '../../common';

const co = Bluebird.coroutine;

export interface ZecTransactionBuilder {
  setVersion: (number) => void;
  setVersionGroupId: (number) => void;
}

export class Zec extends AbstractUtxoCoin {
  constructor(bitgo: any, network?) {
    super(bitgo, network || bitGoUtxoLib.networks.zcash);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Zec(bitgo);
  }

  getChain() {
    return 'zec';
  }

  getFamily() {
    return 'zec';
  }

  getCoinLibrary() {
    return bitGoUtxoLib;
  }

  getFullName() {
    return 'ZCash';
  }

  supportsBlockTarget() {
    return false;
  }

  /**
   *
   * @param txBuilder
   * @returns {*}
   */
  prepareTransactionBuilder(txBuilder: ZecTransactionBuilder): any {
    txBuilder.setVersion(bitGoUtxoLib.Transaction.ZCASH_SAPLING_VERSION);
    txBuilder.setVersionGroupId(0x892f2085);
    return txBuilder;
  }

  /**
   * Calculate the hash to verify the signature against
   * @param transaction Transaction object
   * @param inputIndex
   * @param pubScript
   * @param amount The previous output's amount
   * @param hashType
   * @returns {*}
   */
  calculateSignatureHash(transaction: any, inputIndex: number, pubScript: Buffer, amount: number, hashType: number): Buffer {
    return transaction.hashForZcashSignature(inputIndex, pubScript, amount, hashType);
  }

  recoveryBlockchainExplorerUrl(url: string) {
    return common.Environments[this.bitgo.getEnv()].zecExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string): Bluebird<{ txCount: number; totalBalance: number; }> {
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<{ address: string; amount: number; n: number; }[]> {
    return co(function *getUnspentInfoFromExplorer() {
      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }
}
