const common = require('../common');
const assert = require('assert');
const BigNumber = require('bignumber.js');
const bitcoin = require('../bitcoin');
const PendingApproval = require('./pendingApproval');
const Q = require('q');
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
  var self = this;
  return this._wallet.pendingApprovals.map(function(currentApproval) {
    return new PendingApproval(self.bitgo, self.baseCoin, currentApproval, self);
  });
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

  var query = {};
  if (params.prevId) {
    if (typeof(params.prevId) !== 'string') {
      throw new Error('invalid prevId argument, expecting string');
    }
    query.prevId = params.prevId;
  }

  if (params.limit) {
    if (typeof(params.limit) !== 'number') {
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
 * List the transfers for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.transfers = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var query = {};
  if (params.prevId) {
    if (typeof(params.prevId) !== 'string') {
      throw new Error('invalid prevId argument, expecting string');
    }
    query.prevId = params.prevId;
  }

  if (params.limit) {
    if (typeof(params.limit) !== 'number') {
      throw new Error('invalid limit argument, expecting number');
    }
    query.limit = params.limit;
  }

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer'))
  .query(query)
  .result()
  .nodeify(callback);
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

  var query = {};
  if (params.prevId) {
    if (typeof(params.prevId) !== 'string') {
      throw new Error('invalid prevId argument, expecting string');
    }
    query.prevId = params.prevId;
  }

  if (params.limit) {
    if (typeof(params.limit) !== 'number') {
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
 * Freeze a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.freeze = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  if (params.duration) {
    if (typeof(params.duration) !== 'number') {
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

  var query = {};

  if (params.mine) {
    query.mine = !!params.mine;
  }

  if (params.prevId) {
    if (typeof(params.prevId) !== 'number') {
      throw new Error('invalid prevId argument, expecting number');
    }
    query.prevId = params.prevId;
  }

  if (params.sort) {
    if (typeof(params.sort) !== 'number') {
      throw new Error('invalid sort argument, expecting number');
    }
    query.sort = params.sort;
  }

  if (params.limit) {
    if (typeof(params.limit) !== 'number') {
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
 * Create a new address for use with this wallet
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.createAddress = function(params, callback) {
  var self = this;
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

  var query = {};
  if (params.prevId) {
    if (typeof(params.prevId) !== 'string') {
      throw new Error('invalid prevId argument, expecting string');
    }
    query.prevId = params.prevId;
  }

  if (params.limit) {
    if (typeof(params.limit) !== 'number') {
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
  var filteredParams = _.pick(params, ['txHash', 'pendingApprovalId']);

  var webhookId = params.webhookId;
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
  var self = this;

  var tryKeyChain = function(index) {
    if (!self._wallet.keys || index >= self._wallet.keys.length) {
      return self.bitgo.reject('No encrypted keychains on this wallet.', callback);
    }

    var params = { id: self._wallet.keys[index] };

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

  if (params.reshare !== undefined && typeof(params.reshare) !== 'boolean') {
    throw new Error('Expected reshare to be a boolean.');
  }

  if (params.skipKeychain !== undefined && typeof(params.skipKeychain) !== 'boolean') {
    throw new Error('Expected skipKeychain to be a boolean. ');
  }
  var needsKeychain = !params.skipKeychain && params.permissions.indexOf('spend') !== -1;

  if (params.disableEmail !== undefined && typeof(params.disableEmail) !== 'boolean') {
    throw new Error('Expected disableEmail to be a boolean.');
  }

  var self = this;
  var sharing;
  var sharedKeychain;
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

          var eckey = bitcoin.makeRandomKey();
          var secret = self.bitgo.getECDHSecret({ eckey: eckey, otherPubKeyHex: sharing.pubkey });
          var newEncryptedPrv = self.bitgo.encrypt({ password: secret, input: keychain.prv });

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
    var options = {
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

  var userId = params.userId;

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
  var self = this;
  return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx/build'))
  .send({ recipients: params.recipients })
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
  var userKeychain = params.keychain || params.key;
  var txPrebuild = params.txPrebuild;
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
    var userEncryptedPrv = userKeychain.encryptedPrv;
    if (!userEncryptedPrv) {
      throw new Error('keychain does not have property encryptedPrv');
    }
    if (!params.walletPassphrase) {
      throw new Error('walletPassphrase property missing');
    }
    userPrv = this.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
  }

  var self = this;
  return Q.fcall(function() {
    const signingParams = _.extend({}, params, { txPrebuild: txPrebuild, prv: userPrv });
    return self.baseCoin.signTransaction(signingParams);
  })
  .nodeify(callback);
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
  params = params || {};
  common.validateParams(params, [], ['comment', 'otp'], callback);
  var self = this;

  if (params.prebuildTx && params.recipients) {
    throw new Error('Only one of prebuildTx and recipients may be specified');
  }

  // TODO: use Array.isArray
  if (params.recipients && !(params.recipients instanceof Array)) {
    throw new Error('expecting recipients array');
  }

  // the prebuild can be overridden by providing an explicit tx
  var txPrebuild = params.prebuildTx;
  var txPrebuildPromise = null;
  if (!txPrebuild) {
    // if there is no prebuild, we need to calculate the prebuild in here
    txPrebuildPromise = self.prebuildTransaction(params);
  }

  var userKeychainPromise = self.baseCoin.keychains().get({ id: self._wallet.keys[0] });

  // pass in either the prebuild promise or, if undefined, the actual prebuild
  return Q.all([txPrebuildPromise || txPrebuild, userKeychainPromise])
  .spread(function(txPrebuild, userKeychain) {
    // TODO: fix blob for
    var signingParams = _.extend({}, params, { txPrebuild: txPrebuild, keychain: userKeychain });
    return self.signTransaction(signingParams);
  })
  .then(function(halfSignedTransaction) {
    var selectParams = _.pick(params, ['comment', 'otp']);
    var finalTxParams = _.extend({}, halfSignedTransaction, selectParams);
    return self.bitgo.post(self.baseCoin.url('/wallet/' + self._wallet.id + '/tx/send'))
    .send(finalTxParams)
    .result();
  })
  .nodeify(callback);
};

module.exports = Wallet;
