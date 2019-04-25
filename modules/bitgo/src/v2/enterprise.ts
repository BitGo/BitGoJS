import * as Promise from 'bluebird';
const co = Promise.coroutine;
import * as _ from 'lodash';
const CoinWallet = require('./wallet');
const internal = require('./internal');
import common = require('../common');

class Enterprise {

  bitgo: any;
  baseCoin: any;
  private _enterprise: any;

  constructor(bitgo, baseCoin, enterpriseData) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    if (!_.isObject(enterpriseData)) {
      throw new Error('enterpriseData has to be an object');
    }
    this._enterprise = enterpriseData;
  }

  get name() {
    return this._enterprise.name;
  }

  get id() {
    return this._enterprise.id;
  }

  /**
   * Enterprise URL for v1 methods, such as getting users
   * @param query
   */
  url(query) {
    const extra = query || '';
    return this.bitgo.url('/enterprise/' + this.id + extra);
  }

  /**
   * Enterprise URL for v2 methods, such as getting fee address balances
   * @param query
   */
  coinUrl(query) {
    const extra = query || '';
    return this.baseCoin.url('/enterprise/' + this.id + extra);
  }

  coinWallets(params, callback) {
    return co(function *coCoinWallets() {
      const walletData = yield this.bitgo.get(this.baseCoin.url('/wallet/enterprise/' + this.id)).result();
      walletData.wallets = walletData.wallets.map((w) => {
        return new CoinWallet(this.bitgo, this.baseCoin, w);
      });
      return walletData;
    }).call(this).asCallback(callback);
  }

  users(params, callback) {
    return co(function *() {
      return this.bitgo.get(this.url('/user')).result();
    }).call(this).asCallback(callback);
  }

  getFeeAddressBalance(params, callback) {
    return co(function *() {
      return this.bitgo.get(this.coinUrl('/feeAddressBalance')).result();
    }).call(this).asCallback(callback);
  }

  addUser(params, callback) {
    return co(function *() {
      return this.bitgo.post(this.url('/user')).send(params).result();
    }).call(this).asCallback(callback);
  }

  removeUser(params, callback) {
    return co(function *() {
      return this.bitgo.del(this.url('/user')).send(params).result();
    }).call(this).asCallback(callback);
  }

  getFirstPendingTransaction(params, callback) {
    return co(function *() {
      params = params || {};
      common.validateParams(params, [], [], callback);
      const query = { enterpriseId: this.id };
      return internal.getFirstPendingTransaction(query, this.baseCoin, this.bitgo);
    }).call(this).asCallback(callback);
  }

}

module.exports = Enterprise;
