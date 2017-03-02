var common = require('../common');
var assert = require('assert');
var Q = require('q');
var _ = require('lodash');

var Wallet = function(bitgo, baseCoin, walletData) {
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

Wallet.prototype.balance = function() {
  return this._wallet.balance;
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

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx'))
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

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer'))
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

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/unspents'))
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
    if (typeof(params.prevId) != 'number') {
      throw new Error('invalid prevId argument, expecting number');
    }
    query.prevId = params.prevId;
  }

  if (params.sort) {
    if (typeof(params.sort) != 'number') {
      throw new Error('invalid sort argument, expecting number');
    }
    query.sort = params.sort;
  }

  if (params.limit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid sort argument, expecting number');
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

  params.chain = params.chain || 0;
  return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/address'))
  .send(params)
  .result()
  .nodeify(callback);
};

Wallet.prototype.listWebhooks = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.url('/webhooks'))
  .send()
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

/**
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.shareWallet = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['email', 'permissions'], ['walletPassphrase', 'message'], callback);

  if (params.reshare !== undefined && typeof(params.reshare) != 'boolean') {
    throw new Error('Expected reshare to be a boolean.');
  }

  if (params.skipKeychain !== undefined && typeof(params.skipKeychain) != 'boolean') {
    throw new Error('Expected skipKeychain to be a boolean. ');
  }
  var needsKeychain = !params.skipKeychain && params.permissions.indexOf('spend') !== -1;

  if (params.disableEmail !== undefined && typeof(params.disableEmail) != 'boolean') {
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
        if (keychain.encryptedXprv) {
          if (!params.walletPassphrase) {
            throw new Error('Missing walletPassphrase argument');
          }
          try {
            keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedXprv });
          } catch (e) {
            throw new Error('Unable to decrypt user keychain');
          }

          var eckey = bitcoin.makeRandomKey();
          var secret = self.bitgo.getECDHSecret({ eckey: eckey, otherPubKeyHex: sharing.pubkey });
          var newEncryptedXprv = self.bitgo.encrypt({ password: secret, input: keychain.xprv });

          sharedKeychain = {
            xpub: keychain.xpub,
            encryptedXprv: newEncryptedXprv,
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
  var userPrv = params.prv;
  if (userPrv && typeof userPrv !== 'string') {
    throw new Error('prv must be a string');
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
    return self.baseCoin.signTransaction({ txPrebuild: txPrebuild, prv: userPrv });
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
  common.validateParams(params, ['txHex'], ['otp'], callback);
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

  if (typeof(params.amount) != 'number') {
    throw new Error('invalid argument for amount - number expected');
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
  // preserve the "this"-reference in signTransaction
  .spread(function(txPrebuild, userKeychain) {
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
