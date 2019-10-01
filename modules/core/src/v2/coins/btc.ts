import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';
import * as common from '../../common';
import * as bitcoin from 'bitgo-utxo-lib';
import * as request from 'superagent';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

export interface TransactionInfo {
  transactionHex: string,
}

export class Btc extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || bitcoin.networks.bitcoin);
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

  getRecoveryFeePerBytes(): Bluebird<number> {
    const self = this;
    return co<number>(function *getRecoveryFeePerBytes() {
      const recoveryFeeUrl = yield self.getRecoveryFeeRecommendationApiBaseUrl();

      const publicFeeDataReq = request.get(recoveryFeeUrl);
      publicFeeDataReq.forceV1Auth = true;
      const publicFeeData = yield publicFeeDataReq.result();

      if (_.isInteger(publicFeeData.hourFee)) {
        return publicFeeData.hourFee;
      } else {
        return 100;
      }
    }).call(this);
  }

  getRecoveryFeeRecommendationApiBaseUrl(): Bluebird<string> {
    return Bluebird.resolve('https://bitcoinfees.earn.com/api/v1/fees/recommended');
  }

  recoveryBlockchainExplorerUrl(url: string): string {
    return common.Environments[this.bitgo.getEnv()].smartBitApiBaseUrl + '/blockchain' + url;
  }

  getAddressInfoFromExplorer(addressBase58: string): Bluebird<any> {
    const self = this;
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(self.recoveryBlockchainExplorerUrl(`/address/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.address.total.transaction_count;
      addrInfo.totalBalance = addrInfo.address.total.balance_int;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Bluebird<any> {
    const self = this;
    return co(function *getUnspentInfoFromExplorer() {
      const unspentInfo = yield request.get(self.recoveryBlockchainExplorerUrl(`/address/${addressBase58}/unspent`)).result();

      const unspents = unspentInfo.unspent;

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.value_int;
      });

      return unspents;
    }).call(this);
  }

  public verifyRecoveryTransaction(txInfo: TransactionInfo): Bluebird<any> {
    const self = this;
    return co(function *verifyRecoveryTransaction() {
      const decodedTx = yield request.post(self.recoveryBlockchainExplorerUrl(`/decodetx`))
      .send({ hex: txInfo.transactionHex })
      .result();

      const transactionDetails = decodedTx.transaction;

      const tx = bitcoin.Transaction.fromHex(txInfo.transactionHex, this.network);
      if (transactionDetails.TxId !== tx.getId()) {
        console.log(transactionDetails.TxId);
        console.log(tx.getId());
        throw new Error('inconsistent recovery transaction id');
      }

      return transactionDetails;
    }).call(this);
  }
}
