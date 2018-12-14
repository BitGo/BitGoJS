const common = require('../common');
const assert = require('assert');
const BigNumber = require('bignumber.js');
const bitcoin = require('../bitcoin');
const PendingApproval = require('./pendingApproval');
const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');
const debug = require('debug')('bitgo:v2:wallet');
const internal = require('./internal');
const util = require('../util');

const Wallet = function(bitgo, baseCoin, walletData) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
  this._wallet = walletData;
  const userId = _.get(bitgo, '_user.id');
  if (_.isString(userId)) {
    const userDetails = _.find(walletData.users, { user: userId });
    this._permissions = _.get(userDetails, 'permissions');
  }
};

Wallet.prototype.url = function(extra) {
  extra = extra || '';
  return this.baseCoin.url('/wallet/' + this.id() + extra);
};

Wallet.prototype.id = function() {
  return this._wallet.id;
};

Wallet.prototype.approvalsRequired = function() {
  return this._wallet.approvalsRequired;
};

Wallet.prototype.balance = function() {
  return this._wallet.balance;
};

Wallet.prototype.confirmedBalance = function() {
  return this._wallet.confirmedBalance;
};

Wallet.prototype.spendableBalance = function() {
  return this._wallet.spendableBalance;
};

Wallet.prototype.balanceString = function() {
  return this._wallet.balanceString;
};

Wallet.prototype.confirmedBalanceString = function() {
  return this._wallet.confirmedBalanceString;
};

Wallet.prototype.spendableBalanceString = function() {
  return this._wallet.spendableBalanceString;
};

Wallet.prototype.coin = function() {
  return this._wallet.coin;
};

Wallet.prototype.label = function() {
  return this._wallet.label;
};

Wallet.prototype.keyIds = function() {
  return this._wallet.keys;
};

Wallet.prototype.receiveAddress = function() {
  return this._wallet.receiveAddress.address;
};

/**
 * Return the token flush thresholds for this wallet
 * @return {*|Object} pairs of { [tokenName]: thresholds } base units
 */
Wallet.prototype.tokenFlushThresholds = function() {
  if (this.baseCoin.getFamily() !== 'eth') {
    throw new Error('not supported for this wallet');
  }
  return this._wallet.coinSpecific.tokenFlushThresholds;
};

Wallet.prototype.pendingApprovals = function() {
  const self = this;
  return this._wallet.pendingApprovals.map(function(currentApproval) {
    return new PendingApproval(self.bitgo, self.baseCoin, currentApproval, self);
  });
};

/**
 * Refresh the wallet object by syncing with the back-end
 * @param callback
 * @returns {Wallet}
 */
Wallet.prototype.refresh = function(params, callback) {
  return co(function *() {
    const res = yield this.bitgo.get(this.url()).result();
    this._wallet = res;
    return this;
  }).call(this).asCallback(callback);
};

/**
 * List the transactions for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.transactions = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query = {};
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
};

/**
 * List the transactions for a given wallet
 * @param params
 *  - txHash the transaction hash to search for
 * @param callback
 * @returns {*}
 */
Wallet.prototype.getTransaction = function getTransaction(params, callback) {
  params = params || {};
  common.validateParams(params, ['txHash'], [], callback);

  const query = {};
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
};

/**
 * List the transfers for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.transfers = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query = {};
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

  return this.bitgo.get(this.url('/transfer'))
  .query(query)
  .result()
  .nodeify(callback);
};

Wallet.prototype.getTransfer = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return this.bitgo.get(this.url('/transfer/' + params.id))
  .result()
  .nodeify(callback);
};

// Get a transaction by sequence id for a given wallet
Wallet.prototype.transferBySequenceId = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['sequenceId'], [], callback);

  return this.bitgo.get(this.url('/transfer/sequenceId/' + params.sequenceId))
  .result()
  .nodeify(callback);
};

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
 * @param callback
 * @returns {{maximumSpendable: Number, coin: String}}
 * NOTE : feeTxConfirmTarget omitted on purpose because gauging the maximum spendable amount with dynamic fees does not make sense
 */
Wallet.prototype.maximumSpendable = function maximumSpendable(params, callback) {
  return co(function *() {
    params = params || {};

    const filteredParams = _.pick(params, [
      'minValue', 'maxValue', 'minHeight', 'target', 'plainTarget',
      'limit', 'minConfirms', 'enforceMinConfirmsForChange', 'feeRate', 'maxFeeRate'
    ]);

    return this.bitgo.get(this.url('/maximumSpendable'))
    .query(filteredParams)
    .result();

  }).call(this).asCallback(callback);

};

/**
 * List the unspents for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.unspents = function(params, callback) {
  params = params || {};

  const query = _.pick(params, ['prevId', 'limit', 'minValue', 'maxValue', 'minHeight', 'minConfirms', 'target', 'segwit', 'chains']);

  return this.bitgo.get(this.url('/unspents'))
  .query(query)
  .result()
  .nodeify(callback);
};

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
Wallet.prototype.consolidateUnspents = function consolidateUnspents(params, callback) {
  return co(function *() {
    params = params || {};
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
};

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
Wallet.prototype.fanoutUnspents = function fanoutUnspents(params, callback) {
  return co(function *() {
    params = params || {};
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

};

/**
 * Set the token flush thresholds for the wallet. Updates the wallet.
 * Tokens will only be flushed from forwarder contracts if the balance is greater than the threshold defined here.
 * @param thresholds {Object} - pairs of { [tokenName]: threshold } (base units)
 * @param [callback]
 */
Wallet.prototype.updateTokenFlushThresholds = function(thresholds, callback) {
  return co(function *() {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('not supported for this wallet');
    }

    this._wallet = yield this.bitgo.put(this.url()).send({
      tokenFlushThresholds: thresholds
    }).result();
  }).call(this).asCallback(callback);
};

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
Wallet.prototype.sweep = function sweep(params, callback) {
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

};

/**
 * Freeze a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.freeze = function(params, callback) {
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
};

/**
 * Update comment of a transfer
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.transferComment = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], ['comment'], callback);

  return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer/' + params.id + '/comment'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * List the addresses for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.addresses = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query = {};

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
};

/**
 * Get a single wallet address by its id
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.getAddress = function(params, callback) {
  params = params || {};
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

  return this.bitgo.get(this.baseCoin.url(`/wallet/${this._wallet.id}/address/${encodeURIComponent(query)}`))
  .result()
  .nodeify(callback);
};

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
Wallet.prototype.createAddress = function({ chain, gasPrice, count = 1, label, bech32, lowPriority } = {}, callback) {
  return co(function *createAddress() {
    const addressParams = {};
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

    if (!_.isUndefined(bech32)) {
      if (!_.isBoolean(bech32)) {
        throw new Error('bech32 has to be a boolean');
      }
      addressParams.bech32 = bech32;
    }

    if (!_.isUndefined(lowPriority)) {
      if (!_.isBoolean(lowPriority)) {
        throw new Error('lowPriority has to be a boolean');
      }
      addressParams.lowPriority = lowPriority;
    }

    if (!_.isInteger(count) || count <= 0) {
      throw new Error('count has to be a positive integer');
    }

    // get keychains for address verification
    const keychains = yield Promise.map(this._wallet.keys, k => this.baseCoin.keychains().get({ id: k, reqId }));

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
      const verificationData = _.merge({}, newAddress, { rootAddress: this._wallet.receiveAddress.address });
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
};

/**
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.updateAddress = function(params, callback) {
  return co(function *gUpdateAddress() {
    const address = params.address;

    const putParams = _.pick(params, ['label']);
    const url = this.url('/address/' + encodeURIComponent(address));

    return this.bitgo.put(url).send(putParams).result();
  }).call(this).asCallback(callback);
};

Wallet.prototype.listWebhooks = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query = {};
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
};

/**
 * Simulate wallet webhook, currently for webhooks of type transfer and pending approval
 * @param params
 * - webhookId (required) id of the webhook to be simulated
 * - transferId (optional but required for transfer webhooks) id of the simulated transfer
 * - pendingApprovalId (optional but required for pending approval webhooks) id of the simulated pending approval
 * @param callback
 * @returns {*}
 */
Wallet.prototype.simulateWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['webhookId'], ['transferId', 'pendingApprovalId'], callback);

  assert(!!params.transferId || !!params.pendingApprovalId, 'must supply either transferId or pendingApprovalId');
  assert(!!params.transferId ^ !!params.pendingApprovalId, 'must supply either transferId or pendingApprovalId, but not both');

  // depending on the coin type of the wallet, the txHash has to adhere to its respective format
  // but the server takes care of that

  // only take the transferId and pendingApprovalId properties
  const filteredParams = _.pick(params, ['transferId', 'pendingApprovalId']);

  const webhookId = params.webhookId;
  return this.bitgo.post(this.url('/webhooks/' + webhookId + '/simulate'))
  .send(filteredParams)
  .result()
  .nodeify(callback);
};

Wallet.prototype.addWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.bitgo.post(this.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

Wallet.prototype.removeWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.bitgo.del(this.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// Key chains
// Gets the user key chain for this wallet
// The user key chain is typically the first keychain of the wallet and has the encrypted prv stored on BitGo.
// Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
Wallet.prototype.getEncryptedUserKeychain = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);
  const self = this;

  const tryKeyChain = function(index) {
    if (!self._wallet.keys || index >= self._wallet.keys.length) {
      return self.bitgo.reject('No encrypted keychains on this wallet.', callback);
    }

    const params = { id: self._wallet.keys[index] };

    return self.baseCoin.keychains().get(params)
    .then(function(keychain) {
      // If we find the prv, then this is probably the user keychain we're looking for
      if (keychain.encryptedPrv) {
        return keychain;
      }
      return tryKeyChain(index + 1);
    });
  };

  return tryKeyChain(0).nodeify(callback);
};

// Key chains
// Gets the unencrypted private key for this wallet (be careful!)
// Requires wallet passphrase
Wallet.prototype.getPrv = function(params, callback) {
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
};

//
// createShare
// share the wallet with an existing BitGo user.
// Parameters:
//   user - the recipient, must have a corresponding user record in our database
//   keychain - the keychain to be shared with the recipient
//   permissions - the recipient's permissions if the share is accepted
// Returns:
//
Wallet.prototype.createShare = function(params, callback) {
  params = params || {};
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
};

/**
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.shareWallet = function(params, callback) {
  params = params || {};
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

  const self = this;
  let sharing;
  let sharedKeychain;
  return this.bitgo.getSharingKey({ email: params.email.toLowerCase() })
  .then(function(result) {
    sharing = result;

    if (needsKeychain) {
      return self.getEncryptedUserKeychain({})
      .then(function(keychain) {
        // Decrypt the user key with a passphrase
        if (keychain.encryptedPrv) {
          if (!params.walletPassphrase) {
            throw new Error('Missing walletPassphrase argument');
          }
          try {
            keychain.prv = self.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedPrv });
          } catch (e) {
            throw new Error('Unable to decrypt user keychain');
          }

          const eckey = bitcoin.makeRandomKey();
          const secret = self.bitgo.getECDHSecret({ eckey: eckey, otherPubKeyHex: sharing.pubkey });
          const newEncryptedPrv = self.bitgo.encrypt({ password: secret, input: keychain.prv });

          sharedKeychain = {
            pub: keychain.pub,
            encryptedPrv: newEncryptedPrv,
            fromPubKey: eckey.getPublicKeyBuffer().toString('hex'),
            toPubKey: sharing.pubkey,
            path: sharing.path
          };
        }
      });
    }
  })
  .then(function() {
    const options = {
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

    return self.createShare(options);
  })
  .nodeify(callback);
};

/**
 * Remove user from wallet
 * @param params
 * - userId Id of the user to remove
 * @param callback
 * @return {*}
 */
Wallet.prototype.removeUser = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['userId'], [], callback);

  const userId = params.userId;

  return this.bitgo.del(this.url('/user/' + userId))
  .result()
  .nodeify(callback);
};

/**
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
 * @param {Boolean} params.instant - Build this transaction to conform with instant sending coin-specific method (if available)
 * @param {{value: String, type: String}} params.memo - Memo to use in transaction (supported by Stellar)
 * @param {String} params.addressType - The type of address to create for change. One of `p2sh`, `p2shP2wsh`, and `p2wsh`. Case-sensitive.
 * @param callback
 * @returns {*}
 */
Wallet.prototype.prebuildTransaction = function(params, callback) {
  return co(function *() {
    // Whitelist params to build tx (mostly around unspent selection)
    const whitelistedParams = _.pick(params, [
      'recipients', 'numBlocks', 'feeRate', 'maxFeeRate', 'minConfirms', 'enforceMinConfirmsForChange',
      'targetWalletUnspents', 'message', 'minValue', 'maxValue', 'sequenceId', 'lastLedgerSequence',
      'ledgerSequenceDelta', 'gasPrice', 'noSplitChange', 'unspents', 'changeAddress', 'instant', 'memo', 'addressType',
      'cpfpTxIds', 'cpfpFeeRate', 'maxFee'
    ]);

    if (params.reqId) {
      this.bitgo._reqId = params.reqId;
    }
    let response = yield this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/build'))
    .send(whitelistedParams)
    .result();
    response = yield this.baseCoin.postProcessPrebuild(response);
    return _.extend({}, response, { walletId: this.id() });
  }).call(this).asCallback(callback);
};

/**
 * Sign a transaction
 * @param params
 * - txPrebuild
 * - [keychain / key] (object) or prv (string)
 * - walletPassphrase
 * @param callback
 * @return {*}
 */
Wallet.prototype.signTransaction = function(params, callback) {
  const userKeychain = params.keychain || params.key;
  const txPrebuild = params.txPrebuild;
  if (!txPrebuild || typeof txPrebuild !== 'object') {
    throw new Error('txPrebuild must be an object');
  }
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

  const self = this;
  return Promise.try(function() {
    const signingParams = _.extend({}, params, { txPrebuild: txPrebuild, prv: userPrv });
    return self.baseCoin.signTransaction(signingParams);
  })
  .nodeify(callback);
};

Wallet.prototype.prebuildAndSignTransaction = function(params, callback) {
  return co(function *() {
    params = params || {};

    if (params.prebuildTx && params.recipients) {
      const error = new Error('Only one of prebuildTx and recipients may be specified');
      error.code = 'both_prebuildtx_and_recipients_specified';
      throw error;
    }

    if (params.recipients && !Array.isArray(params.recipients)) {
      const error = new Error('expecting recipients array');
      error.code = 'recipients_not_array';
      throw error;
    }

    if (_.isArray(this._permissions) && !this._permissions.includes('spend')) {
      const error = new Error('no spend permission on this wallet');
      error.code = 'user_not_allowed_to_spend_from_wallet';
      throw error;
    }

    // the prebuild can be overridden by providing an explicit tx
    const txPrebuild = params.prebuildTx || (yield this.prebuildTransaction(params));
    const userKeychain = yield this.baseCoin.keychains().get({ id: this._wallet.keys[0], reqId: params.reqId });

    try {
      const verificationParams = _.pick(params.verification || {}, ['disableNetworking', 'keychains', 'addresses']);
      yield this.baseCoin.verifyTransaction({ txParams: params, txPrebuild, wallet: this, verification: verificationParams });
    } catch (e) {
      debug('Transaction prebuild failure:', e);
      console.error('transaction prebuild failed local validation:');
      throw e;
    }

    const signingParams = _.extend({}, params, { txPrebuild: txPrebuild, keychain: userKeychain });

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
};

Wallet.prototype.accelerateTransaction = function(params, callback) {
  return co(function *() {
    // TODO(BG-9349): change the last check to > 0 and the error message once platform allows multiple transactions to
    //                be bumped in the same CPFP transaction
    if (_.isUndefined(params.cpfpTxIds) || !Array.isArray(params.cpfpTxIds) || params.cpfpTxIds.length !== 1) {
      const error = new Error('expecting cpfpTxIds to be an array of length 1');
      error.code = 'cpfptxids_not_array';
      throw error;
    }

    if (_.isUndefined(params.cpfpFeeRate) && _.isUndefined(params.maxFeeRate)) {
      debug('neither cpfpFeeRate nor maxFeeRate set in accelerateTransaction');
    }

    if (_.isUndefined(params.maxFee)) {
      debug('maxFee not set in accelerateTransaction');
    }

    return yield this.prebuildAndSignTransaction(params);
  }).call(this).asCallback(callback);
};

/**
 * Submits a half-signed transaction to BitGo
 * @param params
 * - txHex: transaction hex to submit
 * @param callback
 */
Wallet.prototype.submitTransaction = function(params, callback) {
  common.validateParams(params, [], ['otp', 'txHex'], callback);
  return this.bitgo.post(this.baseCoin.url('/wallet/' + this.id() + '/tx/send'))
  .send(params)
  .result()
  .nodeify(callback);
};

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
Wallet.prototype.send = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], ['message', 'data'], callback);
  const coin = this.baseCoin;

  try {
    const amount = new BigNumber(params.amount);
    assert(!amount.isNegative());
    if (!coin.valuelessTransferAllowed()) {
      assert(!amount.isZero());
    }
  } catch (e) {
    throw new Error('invalid argument for amount - positive number greater than zero or numeric string expected');
  }

  params.recipients = [{
    address: params.address,
    amount: params.amount
  }];
  if (params.data && coin.transactionDataAllowed()) {
    params.recipients[0].data = params.data;
  }

  return this.sendMany(params)
  .nodeify(callback);
};

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
Wallet.prototype.sendMany = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], ['comment', 'otp'], callback);
    const reqId = util.createRequestId();
    params.reqId = reqId;
    const coin = this.baseCoin;
    if (_.isObject(params.recipients)) {
      params.recipients.map(function(recipient) {
        try {
          const amount = new BigNumber(recipient.amount);
          assert(!amount.isNegative());
          if (!coin.valuelessTransferAllowed()) {
            assert(!amount.isZero());
          }
        } catch (e) {
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
};

/**
 * Recover an unsupported token from a BitGo multisig wallet
 * params are validated in Eth.prototype.recoverToken
 * @param params
 * @param params.tokenContractAddress the contract address of the unsupported token
 * @param params.recipient the destination address recovered tokens should be sent to
 * @param params.walletPassphrase the wallet passphrase
 * @param params.prv the xprv
 */
Wallet.prototype.recoverToken = function(params, callback) {
  return co(function *() {
    if (this.baseCoin.getFamily() !== 'eth') {
      throw new Error('token recovery only supported for eth wallets');
    }

    return this.baseCoin.recoverToken(_.merge(params, { wallet: this }));

  }).call(this).asCallback(callback);
};

/**
 * Get transaction metadata for the oldest transaction that is still pending or attempted
 * @param callback
 * @param params.walletId [Optional] The ID of the wallet (must provide one of walletId and enterpriseId)
 * @param params.enterpriseId [Optional] The ID of the enterprise (must provide one of walletId and enterpriseId)
 * @returns {Object} Object with txid, walletId, tx, and fee (if supported for coin)
 */
Wallet.prototype.getFirstPendingTransaction = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], [], callback);
    const query = { walletId: this.id() };
    return internal.getFirstPendingTransaction(query, this.baseCoin, this.bitgo);
  }).call(this).asCallback(callback);
};

/**
 * Change the fee on the pending transaction that corresponds to the given txid to the given new fee
 * @param {String} params.txid The transaction Id corresponding to the transaction whose fee is to be changed
 * @param {Integer} params.fee The new fee to apply to the denoted transaction
 * @param callback
 * @returns {String} The transaction ID of the new transaction that contains the new fee rate
 */
Wallet.prototype.changeFee = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, ['txid', 'fee'], [], callback);

    return this.bitgo.post(this.baseCoin.url('/wallet/' + this.id() + '/tx/changeFee'))
    .send(params)
    .result();
  }).call(this).asCallback(callback);
};

/**
 * Fetch info from merchant server
 * @param {Object} params The params passed into the function
 * @param {String} params.url The Url to retrieve info from
 * @param callback
 * @returns {Object} The info returned from the merchant server
 */
Wallet.prototype.getPaymentInfo = function(params, callback) {
  return co(function *coGetPaymentInfo() {
    params = params || {};
    common.validateParams(params, ['url'], [], callback);

    return this.bitgo.get(this.url('/paymentInfo'))
    .query(params)
    .result();

  }).call(this).asCallback(callback);
};

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
Wallet.prototype.sendPaymentResponse = function(params, callback) {
  return co(function *coSendPaymentResponse() {

    return this.bitgo.post(this.url('/sendPayment'))
    .send(params)
    .result();
  }).call(this).asCallback(callback);
};


/**
 * Create a policy rule
 * @param params
 * @param params.condition condition object
 * @param params.action action object
 * @param callback
 * @returns {*}
 */
Wallet.prototype.createPolicyRule = function(params, callback) {
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
};

/**
 * Update a policy rule
 * @param params
 * @param params.condition condition object
 * @param params.action action object
 * @param callback
 * @returns {*}
 */
Wallet.prototype.setPolicyRule = function(params, callback) {
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
};

/**
 * Remove Policy Rule
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.removePolicyRule = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, ['id'], ['message'], callback);

    return this.bitgo.del(this.url('/policy/rule'))
    .send(params)
    .result();
  }).call(this).asCallback(callback);
};


/**
 * Remove Wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.remove = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], [], callback);

    return this.bitgo.del(this.url())
    .result();
  }).call(this).asCallback(callback);
};


/**
 * Creates and downloads PDF keycard for wallet (requires response from wallets.generateWallet)
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
 * @param callback
 * @returns {*}
 */
Wallet.prototype.downloadKeycard = function(params, callback) {
  const getKeyData = (coinShortName, passphrase, passcodeEncryptionCode, walletKeyID, backupKeyID) => {
    // When using just 'generateWallet', we get back an unencrypted prv for the backup keychain
    // If the user passes in their passphrase, we can encrypt it
    if (params.backupKeychain.prv && passphrase) {
      params.backupKeychain.encryptedPrv = this.bitgo.encrypt({
        input: params.backupKeychain.prv,
        password: passphrase
      });
    }

    // If we have the passcode encryption code, create a box D with the encryptedWalletPasscode
    if (passphrase && passcodeEncryptionCode) {
      params.encryptedWalletPasscode = this.bitgo.encrypt({
        input: passphrase,
        password: passcodeEncryptionCode
      });
    }

    // PDF QR Code data
    const qrData = {
      user: {
        title: 'A: User Key',
        desc: 'This is your private key, encrypted with your passcode.',
        data: params.userKeychain.encryptedPrv
      },
      backup: {
        title: 'B: Backup Key',
        desc: 'This is your backup private key, encrypted with your passcode.',
        data: params.backupKeychain.encryptedPrv
      },
      bitgo: {
        title: 'C: BitGo Public Key',
        desc: 'This is the public part of the key that BitGo will use to ' +
        'co-sign transactions\r\nwith you on your wallet.',
        data: params.bitgoKeychain.pub
      },
      passcode: {
        title: 'D: Encrypted Wallet Password',
        desc: 'This is the wallet  password, encrypted client-side ' +
        'with a key held by\r\nBitGo.',
        data: params.encryptedWalletPasscode
      }
    };

    if (walletKeyID) {
      qrData.user.keyID = walletKeyID;
    }

    if (backupKeyID) {
      qrData.backup.keyID = backupKeyID;
    }

    if (!params.userKeychain.encryptedPrv) {
      // User provided their own key - this is a cold wallet
      qrData.user.title = 'A: Provided User Key';
      qrData.user.desc = 'This is the public key you provided for your wallet.';
      qrData.user.data = params.userKeychain.pub;

      // The user provided their own public key, we can remove box D
      delete qrData.passcode;
    } else if (!params.encryptedWalletPasscode) {
      delete qrData.passcode;
    }

    if (params.backupKeychain.provider) {
      const backupKeyProviderName = params.backupKeychain.provider;
      // Backup key held with KRS
      qrData.backup = {
        title: 'B: Backup Key',
        desc:
        'This is the public key held at ' + backupKeyProviderName +
        ', an ' + coinShortName + ' recovery service. If you lose\r\nyour key, ' + backupKeyProviderName +
        ' will be able to sign transactions to recover funds.',
        data: params.backupKeychain.pub
      };
    } else if (!params.backupKeychain.encryptedPrv) {
      // User supplied the xpub
      qrData.backup = {
        title: 'B: Backup Key',
        desc: 'This is the public portion of your backup key, which you provided.',
        data: params.backupKeychain.pub
      };
    }

    return qrData;
  };

  const generateQuestions = (coin) => {
    return [
      {
        q: 'What is the KeyCard?',
        a:
          [
            'The KeyCard contains important information which can be used to recover the ' + coin + ' ',
            'from your wallet in several situations. Each BitGo wallet' +
            ' has its own, unique KeyCard. ',
            'If you have created multiple wallets, you should retain the KeyCard for each of them.'
          ]
      },
      {
        q: 'What should I do with it?',
        a:
          [
            'You should print the KeyCard and/or save the PDF to an offline storage device. The print-out ',
            'or USB stick should be kept in a safe place, such as a bank vault or home safe. It\'s a good idea ',
            'to keep a second copy in a different location.',
            '',
            'Important: If you haven\'t provided an external backup key, then the original PDF should be ',
            'deleted from any machine where the wallet will be regularly accessed to prevent malware from ',
            'capturing both the KeyCard and your wallet passcode.'
          ]
      },
      {
        q: 'What should I do if I lose it?',
        a:
          [
            'If you have lost or damaged all copies of your KeyCard, your ' + coin + ' is still safe, but this ',
            'wallet should be considered at risk for loss. As soon as is convenient, you should use BitGo ',
            'to empty the wallet into a new wallet',
            ', and discontinue use of the old wallet.'
          ]
      },
      {
        q: 'What if someone sees my KeyCard?',
        a:
          [
            'Don\'t panic! All sensitive information on the KeyCard is encrypted with your passcode, or with a',
            'key which only BitGo has. But, in general, you should make best efforts to keep your ',
            'KeyCard private. If your KeyCard does get exposed or copied in a way that makes you ',
            'uncomfortable, the best course of action is to empty the corresponding wallet into another ',
            'wallet and discontinue use of the old wallet.'
          ]
      },
      {
        q: 'What if I forget or lose my wallet password?',
        a:
          [
            'BitGo can use the information in QR Code D to help you recover access to your wallet. ',
            'Without the KeyCard, BitGo is not able to recover funds from a wallet with a lost password.'
          ]
      },
      {
        q: 'What if BitGo becomes inaccessible for an extended period?',
        a:
          [
            'Your KeyCard and wallet passcode can be used together with BitGo’s published open ',
            'source tools at https://github.com/bitgo to recover your ' + coin + '. Note: You should never enter ',
            'information from your KeyCard into tools other than the tools BitGo has published, or your ',
            'funds may be at risk for theft.'
          ]
      },
      {
        q: 'Should I write my wallet password on my KeyCard?',
        a:
          [
            'No! BitGo’s multi-signature approach to security depends on there not being a single point ',
            'of attack. But if your wallet password is on your KeyCard, then anyone who gains access to ',
            'your KeyCard will be able to steal your ' + coin + '.' + ' We recommend keeping your wallet password ',
            'safe in a secure password manager such as LastPass, 1Password or KeePass.'
          ]
      }
    ];
  };

  return co(function *() {
    params = params || {};
    common.validateParams(params, [], ['activationCode'], callback);

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

    const font = {
      header: 24,
      subheader: 15,
      body: 12
    };

    const color = {
      black: '#000000',
      darkgray: '#4c4c4c',
      gray: '#9b9b9b',
      red: '#e21e1e'
    };

    const margin = 30;

    const coinShortName = this.baseCoin.type;
    const coinName = this.baseCoin.getFullName();

    // document details
    const width = 8.5 * 72;
    let y = 0;

    // Helpers for data formatting / positioning on the paper
    const left = (x) => margin + x;
    const moveDown = (yDelta) => { y += yDelta; };

    const doc = new jsPDF('portrait', 'pt', 'letter');
    doc.setFont('helvetica');

    // PDF Header Area - includes the logo and company name
    // This is data for the BitGo logo in the top left of the PDF
    moveDown(30);

    // We don't currently add an image, since that path is dependent on BitGo frontend
    // doc.addImage(coinUtility.getSelectedCoinObj().keyCardImage, left(0), y + 10);

    // Activation Code
    moveDown(8);
    doc.setFontSize(font.body).setTextColor(color.gray);
    doc.text('Activation Code', left(460), y);

    doc.setFontSize(font.header).setTextColor(color.black);
    moveDown(25);
    doc.text('Your BitGo KeyCard', left(150), y);
    doc.setFontSize(font.header).setTextColor(color.gray);
    doc.text(activationCode.toString(), left(460), y);

    // Subheader
    // titles
    moveDown(margin);
    doc.setFontSize(font.body).setTextColor(color.gray);
    doc.text(`Created on ${new Date().toDateString()} by ${window.location.hostname} for wallet named ${wallet.label()}`, left(0), y);
    // copy
    moveDown(25);
    doc.setFontSize(font.subheader).setTextColor(color.black);
    doc.text(params.wallet.label(), left(0), y);
    // Red Bar
    moveDown(20);
    doc.setFillColor(255, 230, 230);
    doc.rect(left(0), y, width - 2 * margin, 32, 'F');

    // warning message
    moveDown(20);
    doc.setFontSize(font.body).setTextColor(color.red);
    doc.text('Print this document, or keep it securely offline. See second page for FAQ.', left(75), y);

    // Get the data for the first page (qr codes)
    const keyData = getKeyData(coinShortName, passphrase, passcodeEncryptionCode, walletKeyID, backupKeyID);

    // Generate the first page's data for the backup PDF
    moveDown(35);
    const qrSize = 130;

    // Draw each Box with QR code and description
    Object.keys(keyData).forEach(function(keyType) {
      const key = keyData[keyType];
      const topY = y;

      // Don't indent if we're not producing QR codes
      const textLeft = !!QRCode ? left(qrSize + 15) : left(15);

      // Draw a QR code if library is available
      if (QRCode) {
        const dataURL = new QRCode({ value: key.data, size: qrSize }).toDataURL('image/jpeg');
        doc.addImage(dataURL, left(0), y, qrSize, qrSize);
      }

      doc.setFontSize(font.subheader).setTextColor(color.black);
      moveDown(10);
      doc.text(key.title, textLeft, y);
      moveDown(15);
      doc.setFontSize(font.body).setTextColor(color.darkgray);
      doc.text(key.desc, textLeft, y);
      moveDown(30);
      doc.setFontSize(font.body - 2);
      doc.text('Data:', textLeft, y);
      moveDown(15);
      const innerWidth = 72 * 8.5 - textLeft - 30;
      doc.setFont('courier').setFontSize(9).setTextColor(color.black);
      const lines = doc.splitTextToSize(key.data, innerWidth);
      doc.text(lines, textLeft, y);

      // Add key ID (derivation string) if it exists
      if (key.keyID) {
        const text = 'Key Id: ' + key.keyID;
        // Gray bar
        moveDown(45);
        doc.setFillColor(247, 249, 249); // Gray background
        doc.setDrawColor(0, 0, 0); // Border
        doc.rect(textLeft, y, width, 15, 'FD');

        doc.text(text, textLeft + 5, y + 10);
      }

      doc.setFont('helvetica');
      // Move down the size of the QR code minus accumulated height on the right side, plus buffer
      moveDown(qrSize - (y - topY) + 15);
    });

    // Add a new page (Q + A page)
    doc.addPage();

    // 2nd page title
    y = 0;
    moveDown(55);
    doc.setFontSize(font.header).setTextColor(color.black);
    doc.text('BitGo KeyCard FAQ', left(0), y);

    const questions = generateQuestions(coinName);

    // Draw the Q + A data on the second page
    moveDown(30);
    questions.forEach(function(q) {
      doc.setFontSize(font.subheader).setTextColor(color.black);
      doc.text(q.q, left(0), y);
      moveDown(20);
      doc.setFontSize(font.body).setTextColor(color.darkgray);
      q.a.forEach(function(line) {
        doc.text(line, left(0), y);
        moveDown(font.body + 3);
      });
      moveDown(22);
    });

    // Save the PDF on the user's browser
    doc.save(`BitGo Keycard for ${wallet.label()}.pdf`);
  }).call(this).asCallback(callback);
};

module.exports = Wallet;
