const common = require('../common');
const assert = require('assert');
const BigNumber = require('bignumber.js');
const bitcoin = require('../bitcoin');
const PendingApproval = require('./pendingApproval');
const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');

const Wallet = function(bitgo, baseCoin, walletData) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
  this._wallet = walletData;
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
 * @param params {Object} parameters object
 * -limit {Number} maximum number of selectable unspents
 * -minValue {Number} the minimum value of unspents to use
 * -maxValue {Number} the maximum value of unspents to use
 * -minHeight {Number} the minimum height of unspents on the block chain to use
 * -minConfirms {Number} all selected unspents will have at least this many conformations
 * -enforceMinConfirmsForChange {Boolean} Enforces minConfirms on change inputs
 * -feeRate {Number} fee rate to use in calculation of maximum spendable
 * @param callback
 * @returns {{maximumSpendable: Number, coin: String}}
 */
Wallet.prototype.maximumSpendable = function maximumSpendable(params, callback) {
  return co(function *() {
    params = params || {};

    const filteredParams = _.pick(params, [
      'minValue', 'maxValue', 'minHeight', 'target', 'plainTarget',
      'limit', 'minConfirms', 'enforceMinConfirmsForChange', 'feeRate'
    ]);

    return this.bitgo.get(this.url('/maximumSpendable'))
    .send(filteredParams)
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

  return this.bitgo.get(this.url('/unspents'))
  .query(query)
  .result()
  .nodeify(callback);
};

/**
 * Consolidate unspents on a wallet
 *
 * @param params {Object} parameters object
 * -walletPassphrase {String} the users wallet passphrase
 * -prevId {String} used in batch requests
 * -limit {Number} used by mongoose to limit the amount of queries
 * -minValue {Number} the minimum value of unspents to use
 * -maxValue {Number} the maximum value of unspents to use
 * -minHeight {Number} the minimum height of unspents on the block chain to use
 * -target {Number} sum of the outputs plus sum of fees and change
 * -plainTarget {Number} the sum of the outputs
 * -targetUnspentPoolSize {Number} the number of unspents you want after the consolidation of valid unspents
 * -minConfirms {Number} all selected unspents will have at least this many conformations
 * -feeRate {Number} The fee rate to use for the consolidation
 * -maxFeePercentage {Number} The maximum value of the unspents you are willing to lose
 * @param callback
 * @returns txHex {String} the txHex of the incomplete transaction that needs to be signed by the user in the SDK
 */
Wallet.prototype.consolidateUnspents = function consolidateUnspents(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);

    const targetUnspentPoolSize = params.targetUnspentPoolSize;
    if (_.isUndefined(targetUnspentPoolSize) || !_.isNumber(targetUnspentPoolSize) || targetUnspentPoolSize < 1 || (targetUnspentPoolSize % 1) !== 0) {
      // the target must be defined, be a number, be at least one, and be a natural number
      throw new Error('targetUnspentPoolSize must be set and a positive integer');
    }

    const keychain = yield this.baseCoin.keychains().get({ id: this._wallet.keys[0] });
    const filteredParams = _.pick(params, ['minValue', 'maxValue', 'minHeight', 'target', 'plainTarget', 'targetUnspentPoolSize', 'prevId', 'limit', 'minConfirms', 'feeRate', 'maxFeePercentage']);
    const response = yield this.bitgo.post(this.url('/consolidateUnspents'))
    .send(filteredParams)
    .result();

    const transactionParams = _.extend({}, params, { txPrebuild: response, keychain: keychain });
    const signedTransaction = yield this.signTransaction(transactionParams);

    const selectParams = _.pick(params, ['comment', 'otp']);
    const finalTxParams = _.extend({}, signedTransaction, selectParams);
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
  common.validateParams(params, ['address'], [], callback);

  return this.bitgo.get(this.baseCoin.url(`/wallet/${this._wallet.id}/address/${params.address}`))
  .result()
  .nodeify(callback);
};

/**
 * Create a new address for use with this wallet
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.createAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  // TODO: verify address generation
  params.chain = params.chain || 0;
  return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/address'))
  .send(params)
  .result()
  .nodeify(callback);
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
 * Simulate wallet webhook, currently for webhooks of type transaction and pending approval
 * @param params
 * - webhookId (required): id of the webhook to be simulated
 * - txHash (optional but required for transaction webhooks) hash of the simulated transaction
 * - pendingApprovalId (optional but required for pending approval webhooks) id of the simulated pending approval
 * @param callback
 * @returns {*}
 */
Wallet.prototype.simulateWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['webhookId'], ['txHash', 'pendingApprovalId'], callback);

  assert(!!params.txHash || !!params.pendingApprovalId, 'must supply either txHash or pendingApprovalId');
  assert(!!params.txHash ^ !!params.pendingApprovalId, 'must supply either txHash or pendingApprovalId, but not both');

  // depending on the coin type of the wallet, the txHash has to adhere to its respective format
  // but the server takes care of that

  // only take the txHash and pendingApprovalId properties
  const filteredParams = _.pick(params, ['txHash', 'pendingApprovalId']);

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
  return this.bitgo.getSharingKey({ email: params.email })
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
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.prebuildTransaction = function(params, callback) {

  // Whitelist params to build tx (mostly around unspent selection)
  const whitelistedParams = _.pick(params, [
    'recipients', 'numBlocks', 'feeRate', 'minConfirms',
    'enforceMinConfirmsForChange', 'targetWalletUnspents',
    'message', 'minValue', 'maxValue', 'sequenceId',
    'lastLedgerSequence', 'ledgerSequenceDelta'
  ]);

  const self = this;
  return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/build'))
  .send(whitelistedParams)
  .result()
  .then(function(response) {
    // extend the prebuild details with the wallet id
    return _.extend({}, response, { walletId: self.id() });
  })
  .nodeify(callback);
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

    // the prebuild can be overridden by providing an explicit tx
    const txPrebuild = params.prebuildTx || (yield this.prebuildTransaction(params));
    const userKeychain = yield this.baseCoin.keychains().get({ id: this._wallet.keys[0] });
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
 * address - the destination address
 * amount - the amount in satoshis to be sent
 * message - optional message to attach to transaction
 * walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
 * prv - the private key in string form, if walletPassphrase is not available
 * minConfirms - the minimum confirmation threshold for inputs
 * enforceMinConfirmsForChange - whether to enforce minConfirms for change inputs
 * @param callback
 * @returns {*}
 */
Wallet.prototype.send = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], ['message'], callback);

  let amount;
  try {
    amount = new BigNumber(params.amount);
    assert(!amount.isNegative());
  } catch (e) {
    throw new Error('invalid argument for amount - positive number or numeric string expected');
  }

  params.recipients = [{
    address: params.address,
    amount: params.amount
  }];

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
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.sendMany = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], ['comment', 'otp'], callback);

    const halfSignedTransaction = yield this.prebuildAndSignTransaction(params);
    const selectParams = _.pick(params, ['comment', 'otp', 'sequenceId']);
    const finalTxParams = _.extend({}, halfSignedTransaction, selectParams);
    return this.bitgo.post(this.url('/tx/send'))
    .send(finalTxParams)
    .result();

  }).call(this).asCallback(callback);
};

module.exports = Wallet;
