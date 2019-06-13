import { BaseCoin } from '../baseCoin';
import { AbstractUtxoCoin } from './abstractUtxoCoin';
import * as common from '../../common';
import * as bitcoin from 'bitgo-utxo-lib';
const request = require('superagent');
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

export class Btc extends AbstractUtxoCoin {
  constructor(bitgo: any, network?) {
    super(bitgo, network || bitcoin.networks.bitcoin);
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Btc(bitgo);
  }

  getChain() {
    return 'btc';
  }

  getFamily() {
    return 'btc';
  }

  getFullName() {
    return 'Bitcoin';
  }

  supportsBlockTarget() {
    return true;
  }

  supportsP2shP2wsh() {
    return true;
  }

  supportsP2wsh() {
    return true;
  }

  getRecoveryFeePerBytes(): Bluebird<number> {
    return co(function *getRecoveryFeePerBytes() {
      const recoveryFeeUrl = yield this.getRecoveryFeeRecommendationApiBaseUrl();

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

  getRecoveryFeeRecommendationApiBaseUrl() {
    return Bluebird.resolve('https://bitcoinfees.earn.com/api/v1/fees/recommended');
  }

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].smartBitApiBaseUrl + '/blockchain' + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/address/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.address.total.transaction_count;
      addrInfo.totalBalance = addrInfo.address.total.balance_int;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co(function *getUnspentInfoFromExplorer() {
      const unspentInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/address/${addressBase58}/unspent`)).result();

      const unspents = unspentInfo.unspent;

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.value_int;
      });

      return unspents;
    }).call(this);
  }

  public verifyRecoveryTransaction(txInfo) {
    return co(function *verifyRecoveryTransaction() {
      const decodedTx = yield request.post(this.recoveryBlockchainExplorerUrl(`/decodetx`))
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
