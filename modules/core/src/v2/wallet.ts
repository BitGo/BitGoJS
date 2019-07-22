import { BigNumber } from 'bignumber.js';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as debugLib from 'debug';

import { makeRandomKey } from '../bitcoin';
import * as common from '../common';
import { AddressGenerationError } from '../errors';
import { BaseCoin } from './baseCoin';
import * as internal from './internal';
import { drawKeycard } from './keycard';
import { TradingAccount } from './trading/tradingAccount';
import { NodeCallback } from './types';
import { PendingApproval } from './pendingApproval';

const util = require('../util');

const debug = debugLib('bitgo:v2:wallet');
const co = Bluebird.coroutine;

export class Wallet {

  public readonly bitgo: any;
  public readonly baseCoin: BaseCoin;
  public readonly _wallet: any;
  public readonly _permissions?: any;

  constructor(bitgo: any, baseCoin: BaseCoin, walletData: any) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    this._wallet = walletData;
    const userId = _.get(bitgo, '_user.id');
    if (_.isString(userId)) {
      const userDetails = _.find(walletData.users, { user: userId });
      this._permissions = _.get(userDetails, 'permissions');
    }
  }

  /**
   * Build a URL using this wallet's id which can be used for BitGo API operations
   * @param extra API specific string to append to the wallet id
   */
  url(extra: string = ''): string {
    return this.baseCoin.url('/wallet/' + this.id() + extra);
  }

  /**
   * Get this wallet's id
   */
  id(): string {
    return this._wallet.id;
  }

  /**
   * Get the number of approvals required for spending funds from this wallet
   */
  approvalsRequired(): number {
    return this._wallet.approvalsRequired;
  }

  /**
   * Get the current balance of this wallet
   */
  balance(): number {
    return this._wallet.balance;
  }

  /**
   * Get the confirmed balance of this wallet
   */
  confirmedBalance(): number {
    return this._wallet.confirmedBalance;
  }

  /**
   * Get the spendable balance of this wallet
   */
  spendableBalance(): number {
    return this._wallet.spendableBalance;
  }

  /**
   * Get a string representation of the balance of this wallet
   *
   * This is useful when balances have the potential to overflow standard javascript numbers
   */
  balanceString(): string {
    return this._wallet.balanceString;
  }

  /**
   * Get a string representation of the confirmed balance of this wallet
   *
   * This is useful when balances have the potential to overflow standard javascript numbers
   */
  confirmedBalanceString(): string {
    return this._wallet.confirmedBalanceString;
  }

  /**
   * Get a string representation of the spendable balance of this wallet
   *
   * This is useful when balances have the potential to overflow standard javascript numbers
   */
  spendableBalanceString(): string {
    return this._wallet.spendableBalanceString;
  }

  /**
   * Get the coin identifier for the type of coin this wallet holds
   */
  coin(): string {
    return this._wallet.coin;
  }

  /**
   * Get the label (name) for this wallet
   */
  public label(): string {
    return this._wallet.label;
  }

  /**
   * Get the public object ids for the keychains on this wallet.
   */
  public keyIds(): string[] {
    return this._wallet.keys;
  }

  /**
   * Get a receive address for this wallet
   */
  public receiveAddress(): string {
    return this._wallet.receiveAddress.address;
  }

  /**
   * Return the token flush thresholds for this wallet
   * @return {*|Object} pairs of { [tokenName]: thresholds } base units
   */
  tokenFlushThresholds(): any {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('not supported for this wallet');
    }
    return this._wallet.coinSpecific.tokenFlushThresholds;
  }

  /**
   * Get all pending approvals on this wallet
   */
  pendingApprovals(): PendingApproval[] {
    return this._wallet.pendingApprovals.map((currentApproval) => {
      return new PendingApproval(this.bitgo, this.baseCoin, currentApproval, this);
    });
  }

  /**
   * Refresh the wallet object by syncing with the back-end
   * @param params
   * @param callback
   * @returns {Wallet}
   */
  refresh(params: {} = {}, callback?: NodeCallback<Wallet>): Bluebird<Wallet> {
    return co(function *() {
      this._wallet = yield this.bitgo.get(this.url()).result();
      return this;
    }).call(this).asCallback(callback);
  }

  /**
   * List the transactions for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  transactions(params: { prevId?: string, limit?: number } = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: any = {};
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * List the transactions for a given wallet
   * @param params
   *  - txHash the transaction hash to search for
   * @param callback
   * @returns {*}
   */
  getTransaction(params: { prevId?: string, limit?: number, txHash?: string } = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['txHash'], [], callback);

    const query: any = {};
    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (!_.isUndefined(params.limit)) {
      if (!_.isInteger(params.limit) || params.limit < 1) {
        throw new Error('invalid limit argument, expecting positive integer');
      }
      query.limit = params.limit;
    }

    return this.bitgo.get(this.url('/tx/' + params.txHash))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * List the transfers for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  transfers(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: any = {};
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    if (params.allTokens) {
      if (!_.isBoolean(params.allTokens)) {
        throw new Error('invalid allTokens argument, expecting boolean');
      }
      query.allTokens = params.allTokens;
    }

    if (params.searchLabel) {
      if (!_.isString(params.searchLabel)) {
        throw new Error('invalid searchLabel argument, expecting string');
      }
      query.searchLabel = params.searchLabel;
    }

    if (params.address) {
      if (!_.isArray(params.address) && !_.isString(params.address)) {
        throw new Error('invalid address argument, expecting string or array');
      }
      if (_.isArray(params.address)) {
        params.address.forEach(address => {
          if (!_.isString(address)) {
            throw new Error('invalid address argument, expecting array of address strings');
          }
        });
      }
      query.address = params.address;
    }

    if (params.dateGte) {
      if (!_.isString(params.dateGte)) {
        throw new Error('invalid dateGte argument, expecting string');
      }
      query.dateGte = params.dateGte;
    }

    if (params.dateLt) {
      if (!_.isString(params.dateLt)) {
        throw new Error('invalid dateLt argument, expecting string');
      }
      query.dateLt = params.dateLt;
    }

    if (!_.isNil(params.valueGte)) {
      if (!_.isNumber(params.valueGte)) {
        throw new Error('invalid valueGte argument, expecting number');
      }
      query.valueGte = params.valueGte;
    }

    if (!_.isNil(params.valueLt)) {
      if (!_.isNumber(params.valueLt)) {
        throw new Error('invalid valueLt argument, expecting number');
      }
      query.valueLt = params.valueLt;
    }

    if (!_.isNil(params.includeHex)) {
      if (!_.isBoolean(params.includeHex)) {
        throw new Error('invalid includeHex argument, expecting boolean');
      }
      query.includeHex = params.includeHex;
    }

    if (!_.isNil(params.state)) {
      if (!Array.isArray(params.state) && !_.isString(params.state)) {
        throw new Error('invalid state argument, expecting string or array');
      }

      if (Array.isArray(params.state)) {
        params.state.forEach(state => {
          if (!_.isString(state)) {
            throw new Error('invalid state argument, expecting array of state strings');
          }
        });
      }
      query.state = params.state;
    }

    if (!_.isNil(params.type)) {
      if (!_.isString(params.type)) {
        throw new Error('invalid type argument, expecting string');
      }
      query.type = params.type;
    }

    return this.bitgo.get(this.url('/transfer'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Get transfers on this wallet
   * @param params
   * @param callback
   */
  getTransfer(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['id'], [], callback);

    return this.bitgo.get(this.url('/transfer/' + params.id))
      .result()
      .nodeify(callback);
  }

  /**
   * Get a transaction by sequence id for a given wallet
   * @param params
   * @param callback
   */
  transferBySequenceId(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['sequenceId'], [], callback);

    return this.bitgo.get(this.url('/transfer/sequenceId/' + params.sequenceId))
      .result()
      .nodeify(callback);
  }

  /**
   * Get the maximum amount you can spend in a single transaction
   *
   * @param {Object} params - parameters object
   * @param {Number} params.limit - maximum number of selectable unspents
   * @param {Number} params.minValue - the minimum value of unspents to use in satoshis
   * @param {Number} params.maxValue - the maximum value of unspents to use in satoshis
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - Enforces minConfirms on change inputs
   * @param {Number} params.feeRate - fee rate to use in calculation of maximum spendable in satoshis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {String} params.recipientAddress - recipient addresses for a more accurate calculation of the maximum available to send
   * @param callback
   * @returns {{maximumSpendable: Number, coin: String}}
   * NOTE : feeTxConfirmTarget omitted on purpose because gauging the maximum spendable amount with dynamic fees does not make sense
   */
  maximumSpendable(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      const filteredParams = _.pick(params, [
        'minValue', 'maxValue', 'minHeight', 'target', 'plainTarget', 'limit', 'minConfirms',
        'enforceMinConfirmsForChange', 'feeRate', 'maxFeeRate', 'recipientAddress'
      ]);

      return this.bitgo.get(this.url('/maximumSpendable'))
        .query(filteredParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * List the unspents for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  unspents(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query = _.pick(params, ['prevId', 'limit', 'minValue', 'maxValue', 'minHeight', 'minConfirms', 'target', 'segwit', 'chains']);

    return this.bitgo.get(this.url('/unspents'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Consolidate unspents on a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.prevId - used in batch requests
   * @param {Number} params.limit - the number of unspents retrieved per call
   * @param {Number} params.minValue - the minimum value of unspents to use in satoshis/kB
   * @param {Number} params.maxValue - the maximum value of unspents to use in satoshis/kB
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.targetUnspentPoolSize - the number of unspents you want after the consolidation of valid unspents
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Number} params.feeRate - The fee rate to use for the consolidation in satoshis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {Number} params.maxFeePercentage - the maximum relative portion that you're willing to spend towards fees
   * @param callback
   * @returns txHex {String} the txHex of the incomplete transaction that needs to be signed by the user in the SDK
   */
  consolidateUnspents(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);

      const reqId = util.createRequestId();
      const keychain = yield this.baseCoin.keychains().get({ id: this._wallet.keys[0], reqId });
      const filteredParams = _.pick(params, ['minValue', 'maxValue', 'minHeight', 'numUnspentsToMake', 'feeTxConfirmTarget', 'limit', 'minConfirms', 'enforceMinConfirmsForChange', 'feeRate', 'maxFeeRate', 'maxFeePercentage']);
      this.bitgo._reqId = reqId;
      const response = yield this.bitgo.post(this.url('/consolidateUnspents'))
        .send(filteredParams)
        .result();

      const transactionParams = _.extend({}, params, { txPrebuild: response, keychain: keychain });
      const signedTransaction = yield this.signTransaction(transactionParams);
      const selectParams = _.pick(params, ['comment', 'otp']);
      const finalTxParams = _.extend({}, signedTransaction, selectParams);

      this.bitgo._reqId = reqId;
      return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Fanout unspents for a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   * @param {Number} params.minValue - the minimum value of unspents to use
   * @param {Number} params.maxValue - the maximum value of unspents to use
   * @param {Number} params.minHeight - the minimum height of unspents on the block chain to use
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Number} params.maxFeePercentage - the maximum proportion of an unspent you are willing to lose to fees
   * @param {Number} params.feeTxConfirmTarget - estimate the fees to aim for first confirmation with this number of blocks
   * @param {Number} params.feeRate - The desired fee rate for the transaction in satoshis/kB
   * @param {Number} params.maxFeeRate - The max limit for a fee rate in satoshis/kB
   * @param {Number} params.maxNumInputsToUse - the number of unspents you want to use in the transaction
   * @param {Number} params.numUnspentsToMake - the number of new unspents to make
   * @param callback
   * @returns txHex {String} the txHex of the incomplete transaction that needs to be signed by the user in the SDK
   */
  fanoutUnspents(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);

      const filteredParams = _.pick(params, ['minValue', 'maxValue', 'minHeight', 'maxNumInputsToUse', 'numUnspentsToMake', 'minConfirms', 'enforceMinConfirmsForChange', 'feeRate', 'maxFeeRate', 'maxFeePercentage', 'feeTxConfirmTarget']);
      const reqId = util.createRequestId();
      this.bitgo._reqId = reqId;
      const response = yield this.bitgo.post(this.url('/fanoutUnspents'))
        .send(filteredParams)
        .result();

      const keychain = yield this.baseCoin.keychains().get({ id: this._wallet.keys[0], reqId });
      const transactionParams = _.extend({}, params, { txPrebuild: response, keychain: keychain, prv: params.xprv });
      const signedTransaction = yield this.signTransaction(transactionParams);

      const selectParams = _.pick(params, ['comment', 'otp']);
      const finalTxParams = _.extend({}, signedTransaction, selectParams);
      this.bitgo._reqId = reqId;
      return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Set the token flush thresholds for the wallet. Updates the wallet.
   * Tokens will only be flushed from forwarder contracts if the balance is greater than the threshold defined here.
   * @param thresholds {Object} - pairs of { [tokenName]: threshold } (base units)
   * @param [callback]
   */
  updateTokenFlushThresholds(thresholds: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      if (this.baseCoin.getFamily() !== 'eth') {
        throw new Error('not supported for this wallet');
      }

      this._wallet = yield this.bitgo.put(this.url()).send({
        tokenFlushThresholds: thresholds
      }).result();
    }).call(this).asCallback(callback);
  }

  /**
   * Sweep funds for a wallet
   *
   * @param {Object} params - parameters object
   * @param {String} params.address - The address to send all the funds in the wallet to
   * @param {String} params.walletPassphrase - the users wallet passphrase
   * @param {String} params.xprv - the private key in string form if the walletPassphrase is not available
   * @param {String} params.otp - Two factor auth code to enable sending the transaction
   * @param {Number} params.feeTxConfirmTarget - Estimate the fees to aim for first confirmation within this number of blocks
   * @param {Number} params.feeRate - The desired fee rate for the transaction in satoshis/kB
   * @param {Number} [params.maxFeeRate] - upper limit for feeRate in satoshis/kB
   * @param [callback]
   * @returns txHex {String} the txHex of the signed transaction
   */
  sweep(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      params = params || {};
      common.validateParams(params, ['address'], ['walletPassphrase', 'xprv', 'otp'], callback);

      if (['eth', 'xrp'].includes(this.baseCoin.getFamily())) {
        if (this.confirmedBalanceString() !== this.balanceString()) {
          throw new Error('cannot sweep when unconfirmed funds exist on the wallet, please wait until all inbound transactions confirm');
        }

        const value = this.spendableBalanceString();
        if (!value || value === '0') {
          throw new Error('no funds to sweep');
        }
        params.recipients = [{
          address: params.address,
          amount: value
        }];

        return this.sendMany(params);
      }
      // the following flow works for all UTXO coins

      const reqId = util.createRequestId();
      const filteredParams = _.pick(params, ['address', 'feeRate', 'maxFeeRate', 'feeTxConfirmTarget']);
      this.bitgo._reqId = reqId;
      const response = yield this.bitgo.post(this.url('/sweepWallet'))
        .send(filteredParams)
        .result();
      // TODO: add txHex validation to protect man in the middle attacks replacing the txHex, BG-3588

      const keychain = yield this.baseCoin.keychains().get({ id: this._wallet.keys[0], reqId });
      const transactionParams = _.extend({}, params, { txPrebuild: response, keychain: keychain, prv: params.xprv });
      const signedTransaction = yield this.signTransaction(transactionParams);

      const selectParams = _.pick(params, ['otp']);
      const finalTxParams = _.extend({}, signedTransaction, selectParams);
      this.bitgo._reqId = reqId;
      return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Freeze a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  freeze(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    params = params || {};
    common.validateParams(params, [], [], callback);

    if (params.duration) {
      if (!_.isNumber(params.duration)) {
        throw new Error('invalid duration: should be number of seconds');
      }
    }

    return this.bitgo.post(this.url('/freeze'))
      .result()
      .nodeify(callback);
  }

  /**
   * Update comment of a transfer
   * @param params
   * @param callback
   * @returns {*}
   */
  transferComment(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['id'], ['comment'], callback);

    return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer/' + params.id + '/comment'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * List the addresses for a given wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  addresses(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, [], [], callback);

    const query: any = {};

    if (params.mine) {
      query.mine = !!params.mine;
    }

    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.sort) {
      if (!_.isNumber(params.sort)) {
        throw new Error('invalid sort argument, expecting number');
      }
      query.sort = params.sort;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    if (params.labelContains) {
      if (!_.isString(params.labelContains)) {
        throw new Error('invalid labelContains argument, expecting string');
      }
      query.labelContains = params.labelContains;
    }

    if (!_.isUndefined(params.segwit)) {
      if (!_.isBoolean(params.segwit)) {
        throw new Error('invalid segwit argument, expecting boolean');
      }
      query.segwit = params.segwit;
    }

    if (!_.isUndefined(params.chains)) {
      if (!_.isArray(params.chains)) {
        throw new Error('invalid chains argument, expecting array of numbers');
      }
      query.chains = params.chains;
    }

    return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/addresses'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Get a single wallet address by its id
   * @param params
   * @param callback
   * @returns {*}
   */
  getAddress(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, [], ['address', 'id'], callback);
    let query;
    if (!params.address && !params.id) {
      throw new Error('address or id of address required');
    }
    if (params.address) {
      query = params.address;
    } else {
      query = params.id;
    }

    if (params.reqId) {
      this.bitgo._reqId = params.reqId;
    }

    return this.bitgo.get(this.baseCoin.url(`/wallet/${this._wallet.id}/address/${encodeURIComponent(query)}`))
      .result()
      .nodeify(callback);
  }

  /**
   * Create one or more new address(es) for use with this wallet.
   *
   * If the `count` field is defined and greater than 1, an object with a single
   * array property named `addresses` containing `count` address objects
   * will be returned. Otherwise, a single address object is returned.
   *
   * @param {Number} [chain] on which the new address should be created
   * @param {(Number|String)} [gasPrice] gas price for new address creation, if applicable
   * @param {String} [label] label for the new address(es)
   * @param {Number} [count=1] number of new addresses which should be created (maximum 250)
   * @param {Boolean} [lowPriority] Ethereum-specific param to create address using low priority fee address
   * @param callback
   */
  createAddress({
    chain = undefined,
    gasPrice = undefined,
    count = 1,
    label = undefined,
    lowPriority = undefined
  } = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      const addressParams: any = {};
      const reqId = util.createRequestId();

      if (!_.isUndefined(chain)) {
        if (!_.isInteger(chain)) {
          throw new Error('chain has to be an integer');
        }
        addressParams.chain = chain;
      }

      if (!_.isUndefined(gasPrice)) {
        if (!_.isInteger(gasPrice) && (isNaN(Number(gasPrice)) || !_.isString(gasPrice))) {
          throw new Error('gasPrice has to be an integer or numeric string');
        }
        addressParams.gasPrice = gasPrice;
      }

      if (!_.isUndefined(label)) {
        if (!_.isString(label)) {
          throw new Error('label has to be a string');
        }
        addressParams.label = label;
      }

      if (!_.isInteger(count) || count <= 0 || count > 250) {
        throw new Error('count has to be a number between 1 and 250');
      }

      if (!_.isUndefined(lowPriority)) {
        if (!_.isBoolean(lowPriority)) {
          throw new Error('lowPriority has to be a boolean');
        }
        addressParams.lowPriority = lowPriority;
      }

      // get keychains for address verification
      const keychains = yield Bluebird.map(this._wallet.keys, k => this.baseCoin.keychains().get({ id: k, reqId }));
      const rootAddress = _.get(this._wallet, 'receiveAddress.address');

      const newAddresses = _.times(count, co(function *createAndVerifyAddress() {
        this.bitgo._reqId = reqId;
        const newAddress = yield this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/address'))
          .send(addressParams)
          .result();

        // infer its address type
        if (_.isObject(newAddress.coinSpecific) && _.isFunction(this.baseCoin.constructor.inferAddressType)) {
          newAddress.addressType = this.baseCoin.constructor.inferAddressType(newAddress);
        }

        newAddress.keychains = keychains;
        const verificationData = _.merge({}, newAddress, { rootAddress });

        if (verificationData.error) {
          throw new AddressGenerationError(verificationData.error);
        }

        this.baseCoin.verifyAddress(verificationData);

        return newAddress;
      }).bind(this));

      if (newAddresses.length === 1) {
        return newAddresses[0];
      }

      return {
        addresses: yield Promise.all(newAddresses)
      };
    }).call(this).asCallback(callback);
  }

  /**
   * Update properties on an address
   * @param params
   * @param callback
   * @returns {*}
   */
  updateAddress(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      const address = params.address;

      const putParams = _.pick(params, ['label']);
      const url = this.url('/address/' + encodeURIComponent(address));

      return this.bitgo.put(url).send(putParams).result();
    }).call(this).asCallback(callback);
  }

  /**
   * List webhooks on this wallet
   * @param params
   * @param callback
   */
  listWebhooks(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const query: any = {};
    if (params.prevId) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      query.prevId = params.prevId;
    }

    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }

    return this.bitgo.get(this.url('/webhooks'))
      .query(query)
      .result()
      .nodeify(callback);
  }

  /**
   * Simulate wallet webhook, currently for webhooks of type transfer and pending approval
   * @param params
   * - webhookId (required) id of the webhook to be simulated
   * - transferId (optional but required for transfer webhooks) id of the simulated transfer
   * - pendingApprovalId (optional but required for pending approval webhooks) id of the simulated pending approval
   * @param callback
   * @returns {*}
   */
  simulateWebhook(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['webhookId'], ['transferId', 'pendingApprovalId'], callback);

    const hasTransferId = !!params.transferId;
    const hasPendingApprovalId = !!params.pendingApprovalId;
    if (!hasTransferId && !hasPendingApprovalId) {
      throw new Error('must supply either transferId or pendingApprovalId');
    }

    if (hasTransferId && hasPendingApprovalId) {
      throw new Error('must supply either transferId or pendingApprovalId, but not both');
    }

    // depending on the coin type of the wallet, the txHash has to adhere to its respective format
    // but the server takes care of that

    // only take the transferId and pendingApprovalId properties
    const filteredParams = _.pick(params, ['transferId', 'pendingApprovalId']);

    const webhookId = params.webhookId;
    return this.bitgo.post(this.url('/webhooks/' + webhookId + '/simulate'))
      .send(filteredParams)
      .result()
      .nodeify(callback);
  }

  /**
   * Add a webhook to this wallet
   * @param params
   * @param callback
   */
  addWebhook(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['url', 'type'], [], callback);

    return this.bitgo.post(this.url('/webhooks'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Remove a webhook from this wallet
   * @param params
   * @param callback
   */
  removeWebhook(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['url', 'type'], [], callback);

    return this.bitgo.del(this.url('/webhooks'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Gets the user key chain for this wallet
   *
   * The user key chain is the first keychain of the wallet and usually has the encrypted prv stored on BitGo.
   * Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
   * @param params
   * @param callback
   */
  getEncryptedUserKeychain(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    const tryKeyChain = co(function *(index: number) {
      if (!this._wallet.keys || index >= this._wallet.keys.length) {
        throw new Error('No encrypted keychains on this wallet.');
      }

      const params = { id: this._wallet.keys[index] };

      const keychain = yield this.baseCoin.keychains().get(params);
      // If we find the prv, then this is probably the user keychain we're looking for
      if (keychain.encryptedPrv) {
        return keychain;
      }
      return tryKeyChain(index + 1);
    }).bind(this);

    return tryKeyChain(0).nodeify(callback);
  }

  /**
   * Gets the unencrypted private key for this wallet (be careful!)
   * Requires wallet passphrase
   *
   * @param params
   * @param callback
   */
  getPrv(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      common.validateParams(params, [], ['walletPassphrase', 'prv'], callback);

      // Prepare signing key
      if (_.isUndefined(params.prv) && _.isUndefined(params.walletPassphrase)) {
        throw new Error('must either provide prv or wallet passphrase');
      }

      if (!_.isUndefined(params.prv) && !_.isString(params.prv)) {
        throw new Error('prv must be a string');
      }

      if (!_.isUndefined(params.walletPassphrase) && !_.isString(params.walletPassphrase)) {
        throw new Error('walletPassphrase must be a string');
      }

      if (params.prv) {
        return params.prv;
      }

      const userKeychain = yield this.getEncryptedUserKeychain();
      const userEncryptedPrv = userKeychain.encryptedPrv;

      let userPrv;
      try {
        userPrv = this.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
      } catch (e) {
        throw new Error('error decrypting wallet passphrase');
      }

      return userPrv;
    }).call(this).asCallback(callback);
  }

  /**
   * Send an encrypted wallet share to BitGo.
   * @param params
   * @param callback
   */
  createShare(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['user', 'permissions'], [], callback);

    if (params.keychain && !_.isEmpty(params.keychain)) {
      if (!params.keychain.pub || !params.keychain.encryptedPrv || !params.keychain.fromPubKey || !params.keychain.toPubKey || !params.keychain.path) {
        throw new Error('requires keychain parameters - pub, encryptedPrv, fromPubKey, toPubKey, path');
      }
    }

    return this.bitgo.post(this.url('/share'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Share this wallet with another BitGo user.
   * @param params
   * @param callback
   * @returns {*}
   */
  shareWallet(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      common.validateParams(params, ['email', 'permissions'], ['walletPassphrase', 'message'], callback);

      if (params.reshare !== undefined && !_.isBoolean(params.reshare)) {
        throw new Error('Expected reshare to be a boolean.');
      }

      if (params.skipKeychain !== undefined && !_.isBoolean(params.skipKeychain)) {
        throw new Error('Expected skipKeychain to be a boolean. ');
      }
      const needsKeychain = !params.skipKeychain && params.permissions.indexOf('spend') !== -1;

      if (params.disableEmail !== undefined && !_.isBoolean(params.disableEmail)) {
        throw new Error('Expected disableEmail to be a boolean.');
      }

      const sharing = yield this.bitgo.getSharingKey({ email: params.email.toLowerCase() });
      let sharedKeychain;
      if (needsKeychain) {
        try {
          const keychain = yield this.getEncryptedUserKeychain({});
          // Decrypt the user key with a passphrase
          if (keychain.encryptedPrv) {
            if (!params.walletPassphrase) {
              throw new Error('Missing walletPassphrase argument');
            }
            try {
              keychain.prv = this.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedPrv });
            } catch (e) {
              throw new Error('Unable to decrypt user keychain');
            }

            const eckey = makeRandomKey();
            const secret = this.bitgo.getECDHSecret({ eckey: eckey, otherPubKeyHex: sharing.pubkey });
            const newEncryptedPrv = this.bitgo.encrypt({ password: secret, input: keychain.prv });

            sharedKeychain = {
              pub: keychain.pub,
              encryptedPrv: newEncryptedPrv,
              fromPubKey: eckey.getPublicKeyBuffer().toString('hex'),
              toPubKey: sharing.pubkey,
              path: sharing.path
            };
          }
        } catch (e) {
          if (e.message === 'No encrypted keychains on this wallet.') {
            sharedKeychain = {};
            // ignore this error because this looks like a cold wallet
          } else {
            throw e;
          }
        }
      }

      const options: any = {
        user: sharing.userId,
        permissions: params.permissions,
        reshare: params.reshare,
        message: params.message,
        disableEmail: params.disableEmail
      };

      if (sharedKeychain) {
        options.keychain = sharedKeychain;
      } else if (params.skipKeychain) {
        options.keychain = {};
      }

      return this.createShare(options);
    }).call(this).asCallback(callback);
  }

  /**
   * Remove user from wallet
   * @param params
   * - userId Id of the user to remove
   * @param callback
   * @return {*}
   */
   removeUser(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['userId'], [], callback);

    const userId = params.userId;
    return this.bitgo.del(this.url('/user/' + userId))
      .result()
      .nodeify(callback);
  }

  /**
   * Fetch a transaction prebuild (unsigned transaction) from BitGo
   *
   * @param {Object} params
   * @param {{address: string, amount: string}} params.recipients - list of recipients and necessary recipient information
   * @param {Number} params.numBlocks - Estimates the approximate fee per kilobyte necessary for a transaction confirmation within numBlocks blocks
   * @param {Number} params.feeRate - the desired feeRate for the transaction in base units/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in base units/kB
   * @param {Number} params.minConfirms - Minimum number of confirmations unspents going into this transaction should have
   * @param {Boolean} params.enforceMinConfirmsForChange - Enforce minimum number of confirmations on change (internal) inputs.
   * @param {Number} params.targetWalletUnspents - The desired count of unspents in the wallet. If the wallet’s current unspent count is lower than the target, up to four additional change outputs will be added to the transaction.
   * @param {Number} params.minValue - Ignore unspents smaller than this amount of base units
   * @param {Number} params.maxValue - Ignore unspents larger than this amount of base units
   * @param {Number} params.sequenceId - The sequence ID of the transaction
   * @param {Number} params.lastLedgerSequence - Absolute max ledger the transaction should be accepted in, whereafter it will be rejected.
   * @param {String} params.ledgerSequenceDelta - Relative ledger height (in relation to the current ledger) that the transaction should be accepted in, whereafter it will be rejected.
   * @param {Number} params.gasPrice - Custom gas price to be used for sending the transaction
   * @param {Boolean} params.noSplitChange - Set to true to disable automatic change splitting for purposes of unspent management
   * @param {Array} params.unspents - The unspents to use in the transaction. Each unspent should be in the form prevTxId:nOutput
   * @param {String} params.changeAddress - Specifies the destination of the change output
   * @param {Number} params.validFromBlock - (Algorand) The minimum round this will run on
   * @param {Number} params.validToBlock - (Algorand) The maximum round this will run on
   * @param {Boolean} params.instant - Build this transaction to conform with instant sending coin-specific method (if available)
   * @param {{value: String, type: String}} params.memo - Memo to use in transaction (supported by Stellar)
   * @param {String} params.addressType - The type of address to create for change. One of `p2sh`, `p2shP2wsh`, and `p2wsh`. Case-sensitive.
   * @param {Boolean} params.hop - Build this as an Ethereum hop transaction
   * @param {String} params.walletPassphrase The passphrase to the wallet user key, to sign commitment data for Ethereum hop transactions
   * @param callback
   * @returns {*}
   */
  prebuildTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      // Whitelist params to build tx
      const whitelistedParams = _.pick(params, [
        'recipients', 'numBlocks', 'feeRate', 'maxFeeRate', 'minConfirms', 'enforceMinConfirmsForChange',
        'targetWalletUnspents', 'message', 'minValue', 'maxValue', 'sequenceId', 'lastLedgerSequence',
        'ledgerSequenceDelta', 'gasPrice', 'noSplitChange', 'unspents', 'changeAddress', 'instant', 'memo', 'addressType',
        'cpfpTxIds', 'cpfpFeeRate', 'maxFee', 'idfVersion', 'idfSignedTimestamp', 'idfUserId', 'strategy',
        'validFromBlock', 'validToBlock',
      ]);
      debug('prebuilding transaction: %O', whitelistedParams);

      if (params.reqId) {
        this.bitgo._reqId = params.reqId;
      }
      const extraParams = yield this.baseCoin.getExtraPrebuildParams(Object.assign(params, { wallet: this }));
      Object.assign(whitelistedParams, extraParams);
      const buildQuery = this.bitgo.post(this.baseCoin.url('/wallet/' + this.id() + '/tx/build'))
        .send(whitelistedParams)
        .result();
      const blockHeightQuery = this.baseCoin.getLatestBlockHeight ?
        this.baseCoin.getLatestBlockHeight(params.reqId) :
        Promise.resolve(undefined);
      const queries = [buildQuery, blockHeightQuery];
      const [buildResponse, blockHeight] = yield Promise.all(queries);
      debug('postprocessing transaction prebuild: %O', buildResponse);
      if (!_.isUndefined(blockHeight)) {
        buildResponse.blockHeight = blockHeight;
      }
      let prebuild = yield this.baseCoin.postProcessPrebuild(Object.assign(buildResponse, { wallet: this, buildParams: whitelistedParams }));
      delete prebuild.wallet;
      delete prebuild.buildParams;
      prebuild = _.extend({}, prebuild, { walletId: this.id() });
      debug('final transaction prebuild: %O', prebuild);
      return prebuild;
    }).call(this).asCallback(callback);
  }

  /**
   * Sign a transaction
   * @param params
   * - txPrebuild
   * - [keychain / key] (object) or prv (string)
   * - walletPassphrase
   * @param callback
   * @return {*}
   */
  signTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      const txPrebuild = params.txPrebuild;
      if (!txPrebuild || typeof txPrebuild !== 'object') {
        throw new Error('txPrebuild must be an object');
      }
      const presign = yield this.baseCoin.presignTransaction(params);
      const userPrv = this.getUserPrv(presign);
      const signingParams = _.extend({}, presign, { txPrebuild: txPrebuild, prv: userPrv });
      return this.baseCoin.signTransaction(signingParams);
    }).call(this).asCallback(callback);
  }

  /**
   * Get the user private key from either a derivation or an encrypted keychain
   * @param [params.keychain / params.key] (object) or params.prv (string)
   * @param params.walletPassphrase (string)
   */
  getUserPrv(params: any = {}): any {
    const userKeychain = params.keychain || params.key;
    let userPrv = params.prv;
    if (userPrv && typeof userPrv !== 'string') {
      throw new Error('prv must be a string');
    }
    if (userPrv && params.coldDerivationSeed) {
      // the derivation only makes sense when a key already exists
      const derivation = this.baseCoin.deriveKeyWithSeed({ key: userPrv, seed: params.coldDerivationSeed });
      userPrv = derivation.key;
    } else if (!userPrv) {
      if (!userKeychain || typeof userKeychain !== 'object') {
        throw new Error('keychain must be an object');
      }
      const userEncryptedPrv = userKeychain.encryptedPrv;
      if (!userEncryptedPrv) {
        throw new Error('keychain does not have property encryptedPrv');
      }
      if (!params.walletPassphrase) {
        throw new Error('walletPassphrase property missing');
      }

      userPrv = this.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
    }
    return userPrv;
  }

  /**
   * Get a transaction prebuild from BitGo, validate it, and then decrypt the user key and sign the transaction
   * @param params
   * @param callback
   */
  prebuildAndSignTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      if (params.prebuildTx && params.recipients) {
        const error: any = new Error('Only one of prebuildTx and recipients may be specified');
        error.code = 'both_prebuildtx_and_recipients_specified';
        throw error;
      }

      if (params.recipients && !Array.isArray(params.recipients)) {
        const error: any = new Error('expecting recipients array');
        error.code = 'recipients_not_array';
        throw error;
      }

      if (_.isArray(this._permissions) && !this._permissions.includes('spend')) {
        const error: any = new Error('no spend permission on this wallet');
        error.code = 'user_not_allowed_to_spend_from_wallet';
        throw error;
      }

      // call prebuildTransaction and keychains-get in parallel
      // the prebuild can be overridden by providing an explicit tx
      const txPrebuildQuery = params.prebuildTx ? Promise.resolve(params.prebuildTx) : this.prebuildTransaction(params);

      // retrieve our keychains needed to run the prebuild - some coins use all pubs
      const keychains = yield this.baseCoin.keychains().getKeysForSigning({ wallet: this, reqId: params.reqId });

      const txPrebuild = yield txPrebuildQuery;

      try {
        const verificationParams = _.pick(params.verification || {}, ['disableNetworking', 'keychains', 'addresses']);
        yield this.baseCoin.verifyTransaction({
          txParams: params,
          txPrebuild,
          wallet: this,
          verification: verificationParams,
          reqId: params.reqId
        });
      } catch (e) {
        debug('Transaction prebuild failure:', e);
        console.error('transaction prebuild failed local validation:');
        throw e;
      }

      // pass our three keys
      const signingParams = _.extend({}, params, {
        txPrebuild: txPrebuild,
        wallet: {
          // this is the version of the multisig address at wallet creation time
          addressVersion: this._wallet.coinSpecific.addressVersion
        },
        keychain: keychains[0],
        backupKeychain: (keychains.length > 1) ? keychains[1] : null,
        bitgoKeychain: (keychains.length > 2) ? keychains[2] : null,
      });

      try {
        return yield this.signTransaction(signingParams);
      } catch (error) {
        if (error.message.includes('insufficient funds')) {
          error.code = 'insufficient_funds';
          error.walletBalances = {
            balanceString: this.balanceString(),
            confirmedBalanceString: this.confirmedBalanceString(),
            spendableBalanceString: this.spendableBalanceString(),
            balance: this.balance(),
            confirmedBalance: this.confirmedBalance(),
            spendableBalance: this.spendableBalance()
          };
          error.txParams = _.omit(params, ['keychain', 'prv', 'passphrase', 'walletPassphrase', 'key']);
        }
        throw error;
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Accelerate a transaction's confirmation using Child-Pays-For-Parent (CPFP)
   * @param params
   * @param callback
   */
  accelerateTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      // TODO(BG-9349): change the last check to > 0 and the error message once platform allows multiple transactions to
      //                be bumped in the same CPFP transaction
      if (_.isUndefined(params.cpfpTxIds) || !Array.isArray(params.cpfpTxIds) || params.cpfpTxIds.length !== 1) {
        const error: any = new Error('expecting cpfpTxIds to be an array of length 1');
        error.code = 'cpfptxids_not_array';
        throw error;
      }

      if (_.isUndefined(params.cpfpFeeRate)) {
        if (params.noCpfpFeeRate !== true) {
          const error: any = new Error('cpfpFeeRate must be set unless noCpfpFeeRate is set');
          error.code = 'cpfpfeerate_not_set';
          throw error;
        }
      } else {
        if (!_.isInteger(params.cpfpFeeRate) || params.cpfpFeeRate < 0) {
          const error: any = new Error('cpfpFeeRate must be a non-negative integer');
          error.code = 'cpfpfeerate_not_nonnegative_integer';
          throw error;
        }
      }

      if (_.isUndefined(params.maxFee)) {
        if (params.noMaxFee !== true) {
          const error: any = new Error('maxFee must be set unless noMaxFee is set');
          error.code = 'maxfee_not_set';
          throw error;
        }
      } else {
        if (!_.isInteger(params.maxFee) || params.maxFee < 0) {
          const error: any = new Error('maxFee must be a non-negative integer');
          error.code = 'maxfee_not_nonnegative_integer';
          throw error;
        }
      }

      if (params.recipients !== undefined) {
        if (!Array.isArray(params.recipients) || params.recipients.length !== 0) {
          throw new Error(`invalid value for 'recipients': must be empty array when set`);
        }
      }

      params.recipients = [];

      // We must pass the build params through to submit in case the CPFP tx ever has to be rebuilt.
      const submitParams = Object.assign(params, yield this.prebuildAndSignTransaction(params));
      return yield this.submitTransaction(submitParams);
    }).call(this).asCallback(callback);
  }

  /**
   * Submit a half-signed transaction to BitGo
   * @param params
   * - txHex: transaction hex to submit
   * - halfSigned: object containing transaction (txHex or txBase64) to submit
   * @param callback
   */
  submitTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, [], ['otp', 'txHex'], callback);
    const hasTxHex = !!params.txHex;
    const hasHalfSigned = !!params.halfSigned;

    if ((hasTxHex && hasHalfSigned) || (!hasTxHex && !hasHalfSigned)) {
      throw new Error('must supply either txHex or halfSigned, but not both');
    }
    return this.bitgo.post(this.baseCoin.url('/wallet/' + this.id() + '/tx/send'))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Send coins to a recipient
   * @param params
   * @param params.address - the destination address
   * @param params.amount - the amount in satoshis/wei/base value to be sent
   * @param params.message - optional message to attach to transaction
   * @param params.data - [Ethereum Specific] optional data to pass to transaction
   * @param params.walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
   * @param params.prv - the private key in string form, if walletPassphrase is not available
   * @param params.minConfirms - the minimum confirmation threshold for inputs
   * @param params.enforceMinConfirmsForChange - whether to enforce minConfirms for change inputs
   * @param callback
   * @returns {*}
   */
  send(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['address'], ['message', 'data'], callback);
    const coin = this.baseCoin;

    const amount = new BigNumber(params.amount);
    if (amount.isNegative()) {
      throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
    }

    if (!coin.valuelessTransferAllowed() && amount.isZero()) {
      throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
    }

    params.recipients = [{
      address: params.address,
      amount: params.amount
    }];
    if (params.data && coin.transactionDataAllowed()) {
      params.recipients[0].data = params.data;
    }

    return this.sendMany(params).nodeify(callback);
  }

  /**
   * Send money to multiple recipients
   * 1. Gets the user keychain by checking the wallet for a key which has an encrypted prv
   * 2. Decrypts user key
   * 3. Creates the transaction with default fee
   * 4. Signs transaction with decrypted user key
   * 5. Sends the transaction to BitGo
   * @param {object} params
   * @param {{address: string, amount: string}} params.recipients - list of recipients and necessary recipient information
   * @param {Number} params.numBlocks - Estimates the approximate fee per kilobyte necessary for a transaction confirmation within numBlocks blocks
   * @param {Number} params.feeRate - the desired feeRate for the transaction in satothis/kB
   * @param {Number} params.maxFeeRate - upper limit for feeRate in satoshis/kB
   * @param {Number} params.minConfirms - all selected unspents will have at least this many confirmations
   * @param {Boolean} params.enforceMinConfirmsForChange - Enforces minConfirms on change inputs
   * @param {Number} params.targetWalletUnspents - The desired count of unspents in the wallet
   * @param {String} params.message - optional message to attach to transaction
   * @param {Number} params.minValue - Ignore unspents smaller than this amount of satoshis
   * @param {Number} params.maxValue - Ignore unspents larger than this amount of satoshis
   * @param {Number} params.sequenceId - The sequence ID of the transaction
   * @param {Number} params.lastLedgerSequence - Absolute max ledger the transaction should be accepted in, whereafter it will be rejected.
   * @param {String} params.ledgerSequenceDelta - Relative ledger height (in relation to the current ledger) that the transaction should be accepted in, whereafter it will be rejected.
   * @param {Number} params.gasPrice - Custom gas price to be used for sending the transaction
   * @param {Boolean} params.noSplitChange - Set to true to disable automatic change splitting for purposes of unspent management
   * @param {Array} params.unspents - The unspents to use in the transaction. Each unspent should be in the form prevTxId:nOutput
   * @param {String} params.comment - Any additional comment to attach to the transaction
   * @param {String} params.otp - Two factor auth code to enable sending the transaction
   * @param {String} params.changeAddress - Specifies the destination of the change output
   * @param {Boolean} params.instant - Send this transaction using coin-specific instant sending method (if available)
   * @param {{value: String, type: String}} params.memo - Memo to use in transaction (supported by Stellar)
   * @param callback
   * @returns {*}
   */
  sendMany(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      common.validateParams(params, [], ['comment', 'otp'], callback);
      debug('sendMany called');
      const reqId = params.reqId || util.createRequestId();
      params.reqId = reqId;
      const coin = this.baseCoin;
      if (_.isObject(params.recipients)) {
        params.recipients.map(function(recipient) {
          const amount = new BigNumber(recipient.amount);
          if (amount.isNegative()) {
            throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
          }
          if (!coin.valuelessTransferAllowed() && amount.isZero()) {
            throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
          }
        });
      }

      const halfSignedTransaction = yield this.prebuildAndSignTransaction(params);
      const selectParams = _.pick(params, [
        'recipients', 'numBlocks', 'feeRate', 'maxFeeRate', 'minConfirms',
        'enforceMinConfirmsForChange', 'targetWalletUnspents',
        'message', 'minValue', 'maxValue', 'sequenceId',
        'lastLedgerSequence', 'ledgerSequenceDelta', 'gasPrice',
        'noSplitChange', 'unspents', 'comment', 'otp', 'changeAddress',
        'instant', 'memo'
      ]);
      const finalTxParams = _.extend({}, halfSignedTransaction, selectParams);
      this.bitgo._reqId = reqId;
      return this.bitgo.post(this.url('/tx/send'))
        .send(finalTxParams)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Recover an unsupported token from a BitGo multisig wallet
   * params are validated in Eth.prototype.recoverToken
   * @param params
   * @param params.tokenContractAddress the contract address of the unsupported token
   * @param params.recipient the destination address recovered tokens should be sent to
   * @param params.walletPassphrase the wallet passphrase
   * @param params.prv the xprv
   * @param callback
   */
  recoverToken(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      if (this.baseCoin.getFamily() !== 'eth') {
        throw new Error('token recovery only supported for eth wallets');
      }

      return this.baseCoin.recoverToken(_.merge(params, { wallet: this }));
    }).call(this).asCallback(callback);
  }

  /**
   * Get transaction metadata for the oldest transaction that is still pending or attempted
   * @param callback
   * @param params
   * @param params.walletId [Optional] The ID of the wallet (must provide one of walletId and enterpriseId)
   * @param params.enterpriseId [Optional] The ID of the enterprise (must provide one of walletId and enterpriseId)
   * @returns {Object} Object with txid, walletId, tx, and fee (if supported for coin)
   */
  getFirstPendingTransaction(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      const query = { walletId: this.id() };
      return internal.getFirstPendingTransaction(query, this.baseCoin, this.bitgo);
    }).call(this).asCallback(callback);
  }

  /**
   * Change the fee on the pending transaction that corresponds to the given txid to the given new fee
   * @param params
   * @param {String} params.txid The transaction Id corresponding to the transaction whose fee is to be changed
   * @param {Number} params.fee The new fee to apply to the denoted transaction
   * @param callback
   * @returns {String} The transaction ID of the new transaction that contains the new fee rate
   */
  changeFee(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      common.validateParams(params, ['txid', 'fee'], [], callback);

      return this.bitgo.post(this.baseCoin.url('/wallet/' + this.id() + '/tx/changeFee'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Fetch info from merchant server
   * @param {Object} params The params passed into the function
   * @param {String} params.url The Url to retrieve info from
   * @param callback
   * @returns {Object} The info returned from the merchant server
   */
  getPaymentInfo(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *coGetPaymentInfo() {
      params = params || {};
      common.validateParams(params, ['url'], [], callback);

      return this.bitgo.get(this.url('/paymentInfo'))
        .query(params)
        .result();

    }).call(this).asCallback(callback);
  }

  /**
   * Send json payment response
   * @param {Object} params The params passed into the function
   * @param {String} params.paymentUrl - The url to send the fully signed transaction to
   * @param {String} params.txHex - The transaction hex of the payment
   * @param {String} params.memo {String} - A memo supplied by the merchant, to be inserted into the transfer as the comment
   * @param {String} params.expires {String} - ISO Date format of when the payment request expires
   * @param callback
   * @returns {Object} The info returned from the merchant server Payment Ack
   */
  sendPaymentResponse(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *coSendPaymentResponse() {

      return this.bitgo.post(this.url('/sendPayment'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Create a policy rule
   * @param params
   * @param params.condition condition object
   * @param params.action action object
   * @param callback
   * @returns {*}
   */
  createPolicyRule(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      params = params || {};
      common.validateParams(params, ['id', 'type'], ['message'], callback);

      if (!_.isObject(params.condition)) {
        throw new Error('missing parameter: conditions object');
      }

      if (!_.isObject(params.action)) {
        throw new Error('missing parameter: action object');
      }

      return this.bitgo.post(this.url('/policy/rule'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Update a policy rule
   * @param params
   * @param params.condition condition object
   * @param params.action action object
   * @param callback
   * @returns {*}
   */
  setPolicyRule(params: any = {}, callback?: NodeCallback<any>) {
    return co(function *() {
      params = params || {};
      common.validateParams(params, ['id', 'type'], ['message'], callback);

      if (!_.isObject(params.condition)) {
        throw new Error('missing parameter: conditions object');
      }

      if (!_.isObject(params.action)) {
        throw new Error('missing parameter: action object');
      }

      return this.bitgo.put(this.url('/policy/rule'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Remove Policy Rule
   * @param params
   * @param callback
   * @returns {*}
   */
  removePolicyRule(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      params = params || {};
      common.validateParams(params, ['id'], ['message'], callback);

      return this.bitgo.del(this.url('/policy/rule'))
        .send(params)
        .result();
    }).call(this).asCallback(callback);
  }

  /**
   * Remove this wallet
   * @param params
   * @param callback
   * @returns {*}
   */
  remove(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo.del(this.url()).result().asCallback(callback);
  }

  /**
   * Create a trading account from this wallet
   */
  toTradingAccount(): TradingAccount {
    if (this.baseCoin.getFamily() !== 'ofc') {
      throw new Error('Can only convert an Offchain (OFC) wallet to a trading account');
    }

    return new TradingAccount(this, this.bitgo);
  }

  /**
   * Creates and downloads PDF keycard for wallet (requires response from wallets.generateWallet)
   *
   * Note: this is example code and is not the version used on bitgo.com
   *
   * @param params
   *   * jsPDF - an instance of the jsPDF library
   *   * QRCode - an instance of the QRious library
   *   * userKeychain - a wallet's private user keychain
   *   * backupKeychain - a wallet's private backup keychain
   *   * bitgoKeychain - a wallet's private bitgo keychain
   *   * passphrase - the wallet passphrase
   *   * passcodeEncryptionCode - the encryption secret used for Box D
   *   * activationCode - a randomly generated six-digit activation code
   *   * walletKeyID - the Key ID used for deriving a cold wallet's signing key
   *   * backupKeyID - the Key ID used for deriving a cold wallet's backup key
   * @returns {*}
   */
  downloadKeycard(params: any = {}): void {
    if (!window || !window.location) {
      throw new Error('The downloadKeycard function is only callable within a browser.');
    }

    // Grab parameters with default for activationCode
    const {
      jsPDF,
      QRCode,
      wallet,
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      passphrase,
      passcodeEncryptionCode,
      walletKeyID,
      backupKeyID,
      activationCode = Math.floor(Math.random() * 900000 + 100000).toString()
    } = params;

    if (!jsPDF || typeof jsPDF !== 'function') {
      throw new Error('Please pass in a valid jsPDF instance');
    }

    // Validate keychains
    if (!userKeychain || typeof userKeychain !== 'object') {
      throw new Error(`Wallet keychain must have a 'user' property`);
    }

    if (!backupKeychain || typeof backupKeychain !== 'object') {
      throw new Error('Backup keychain is required and must be an object');
    }

    if (!bitgoKeychain || typeof bitgoKeychain !== 'object') {
      throw new Error('Bitgo keychain is required and must be an object');
    }

    if (walletKeyID && typeof walletKeyID !== 'string') {
      throw new Error('walletKeyID must be a string');
    }

    if (backupKeyID && typeof backupKeyID !== 'string') {
      throw new Error('backupKeyID must be a string');
    }

    // Validate activation code if provided
    if (typeof activationCode !== 'string') {
      throw new Error('Activation Code must be a string');
    }

    if (activationCode.length !== 6) {
      throw new Error('Activation code must be six characters');
    }

    const coinShortName = this.baseCoin.type;
    const coinName = this.baseCoin.getFullName();

    const doc = drawKeycard({
      jsPDF,
      QRCode,
      coinShortName,
      coinName,
      activationCode,
      walletLabel: this.label(),
      passphrase,
      passcodeEncryptionCode,
      userKeychain,
      backupKeychain,
      bitgoKeychain,
      walletKeyID,
      backupKeyID,
    });

    // Save the PDF on the user's browser
    doc.save(`BitGo Keycard for ${wallet.label()}.pdf`);
  }
}
