import { BitGo } from '../../bitgo';
import { BlockExplorerUnavailable } from '../../errors';
import { BaseCoin } from '../baseCoin';
import { AbstractUtxoCoin, UtxoNetwork } from './abstractUtxoCoin';
import * as common from '../../common';
import * as bitcoin from '@bitgo/utxo-lib';
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
    return common.Environments[this.bitgo.getEnv()].blockchairBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58: string, apiKey?: string): Bluebird<any> {
    const self = this;
    return co(function *getAddressInfoFromExplorer() {
      // we are using blockchair api: https://blockchair.com/api/docs#link_300
      // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
      const addrInfo = yield request.get(self.recoveryBlockchainExplorerUrl(`/dashboards/address/${addressBase58}`))
       .query({ key: apiKey })
       .result();
      addrInfo.txCount = addrInfo.data[addressBase58].address.transaction_count;
      addrInfo.totalBalance = addrInfo.data[addressBase58].address.balance;
      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58: string, apiKey?: string): Bluebird<any> {
    const self = this;
    return co(function *getUnspentInfoFromExplorer() {
      // using blockchair api: https://blockchair.com/api/docs#link_300
      // https://api.blockchair.com/{:btc_chain}/dashboards/address/{:address}₀
      // example utxo from response:
      // {"block_id":-1,"transaction_hash":"cf5bcd42c688cb7c55b5811645e7f0d2a000a85564ca3d6b9fc20f57e14b30bb","index":1,"value":558},
      const unspentInfo = yield request.get(self.recoveryBlockchainExplorerUrl(`/dashboards/address/${addressBase58}`))
        .query({ key: apiKey })
        .result();

      const unspents = unspentInfo.data[addressBase58].utxo;

      const unspentInfos = unspents.map(unspent => {
        return {
          amount: unspent.value,
          n: unspent.index,
          txid: unspent.transaction_hash,
          address: addressBase58
        }
      });
      return unspentInfos;
    }).call(this);
  }

  /**
   * Verify that the txhex user signs correspond to the correct tx they intended
   * by 1) getting back the decoded transaction based on the txhex
   * and then 2) compute the txid (hash), h1 of the decoded transaction 3) compare h1
   * to the txid (hash) of the transaction (including unspent info) we constructed
   * @param {TransactionInfo} txInfo
   * @returns {Bluebird<any>}
   */
  public verifyRecoveryTransaction(txInfo: TransactionInfo): Bluebird<any> {
    const self = this;
    return co(function *verifyRecoveryTransaction() {
      const smartbitURL = common.Environments[this.bitgo.getEnv()].smartbitBaseUrl + '/blockchain/decodetx';
      let res;
      try {
        res = yield request.post(smartbitURL)
          .send({ hex: txInfo.transactionHex })
          .result();
      } catch (e) {
        if ( e || !res) { // if smartbit fails to respond
          throw new BlockExplorerUnavailable(e);
        }
      }

      /**
       * Smartbit's response when something goes wrong
       * {"success":false,"error":{"code":"REQ_ERROR","message":"TX decode failed"}}
       * we should process the error message here
       * interpret the res from smartbit
       */
      if (!res.success) {
        throw new Error(res.error.message);
      }

      const transactionDetails = res.transaction;

      const tx = bitcoin.Transaction.fromHex(txInfo.transactionHex, this.network);
      if (transactionDetails.TxId !== tx.getId()) {
        console.log('txhash/txid returned by blockexplorer: ', transactionDetails.TxId);
        console.log('txhash/txid of the transaction bitgo constructed', tx.getId());
        throw new Error('inconsistent recovery transaction id');
      }
      return transactionDetails;
    }).call(this);
  }
}
