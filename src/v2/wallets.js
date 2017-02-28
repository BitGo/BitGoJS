var common = require('../common');
var Wallet = require('./wallet');
var Q = require('q');
var _ = require('lodash');

var Wallets = function(bitgo, baseCoin) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
  this.coinWallet = Wallet;
};

Wallets.prototype.createWalletInstance = function() {
  return new this.coinWallet(this.bitgo, this.coin);
};

/**
 * Get a wallet by ID (proxy for getWallet)
 * @param params
 * @param callback
 */
Wallets.prototype.get = function(params, callback) {
  return this.getWallet(params, callback);
};

/**
 * List a user's wallets
 * @param params
 * @param callback
 * @returns {*}
 */
Wallets.prototype.list = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var queryObject = {};

  if (params.skip && params.prevId) {
    throw new Error('cannot specify both skip and prevId');
  }

  if (params.getbalances) {
    if (typeof(params.getbalances) !== 'boolean') {
      throw new Error('invalid getbalances argument, expecting boolean');
    }
    queryObject.getbalances = params.getbalances;
  }
  if (params.prevId) {
    if (typeof(params.prevId) !== 'number') {
      throw new Error('invalid prevId argument, expecting number');
    }
    queryObject.prevId = params.prevId;
  }

  var self = this;
  return this.bitgo.get(this.baseCoin.url('/wallet'))
  .query(queryObject)
  .result()
  .then(function(body) {
    body.wallets = body.wallets.map(function(w) {
      return new self.coinWallet(self.bitgo, w);
    });
    return body;
  })
  .nodeify(callback);
};

/**
 * Generate a new wallet
 * 1. Creates the user keychain locally on the client, and encrypts it with the provided passphrase
 * 2. If no pub was provided, creates the backup keychain locally on the client, and encrypts it with the provided passphrase
 * 3. Uploads the encrypted user and backup keychains to BitGo
 * 4. Creates the BitGo key on the service
 * 5. Creates the wallet on BitGo with the 3 public keys above
 * @param params
 * @param callback
 * @returns {*}
 */
Wallets.prototype.generateWallet = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['label'], ['passphrase', 'userKey', 'backupXpub', 'enterprise', 'passcodeEncryptionCode'], callback);
  var self = this;
  var label = params.label;

  if ((!!params.backupXpub + !!params.backupXpubProvider) > 1) {
    throw new Error("Cannot provide more than one backupXpub or backupXpubProvider flag");
  }

  if (params.disableTransactionNotifications !== undefined && typeof(params.disableTransactionNotifications) != 'boolean') {
    throw new Error('Expected disableTransactionNotifications to be a boolean. ');
  }

  var userKeychain;
  var backupKeychain;
  var bitgoKeychain;
  var userKeychainParams;

  // Add the user keychain
  var userKeychainPromise = Q.fcall(function() {
    // User provided user key
    if (params.userKey) {
      userKeychain = { 'pub': params.userKey };
      userKeychainParams = userKeychain;
    } else {
      // Create the user and backup key.
      userKeychain = self.baseCoin.keychains().create();
      userKeychain.encryptedPrv = self.bitgo.encrypt({ password: params.passphrase, input: userKeychain.prv });
      userKeychainParams = {
        pub: userKeychain.pub,
        encryptedPrv: userKeychain.encryptedPrv
      };
    }

    return self.baseCoin.keychains().add(userKeychainParams)
    .then(function(newUserKeychain) {
      userKeychain = _.extend({}, newUserKeychain, userKeychain);
    });
  });

  var backupKeychainPromise = Q.fcall(function() {
    if (params.backupXpubProvider) {
      // If requested, use a KRS or backup key provider
      return self.bitgo.keychains().createBackup({
        provider: params.backupXpubProvider,
        disableKRSEmail: params.disableKRSEmail,
        type: self.baseCoin.chain
      });
    }

    // User provided backup xpub
    if (params.backupXpub) {
      // user provided backup ethereum address
      backupKeychain = { 'pub': params.backupXpub };
    } else {
      // No provided backup xpub or address, so default to creating one here
      backupKeychain = self.baseCoin.keychains().create();
    }

    return self.baseCoin.keychains().add(backupKeychain);
  })
  .then(function(newBackupKeychain) {
    backupKeychain = _.extend({}, newBackupKeychain, backupKeychain);
  });

  var bitgoKeychainPromise = self.baseCoin.keychains().createBitGo()
  .then(function(keychain) {
    bitgoKeychain = keychain;
  });

  // Add the user keychain
  return Q.all([userKeychainPromise, backupKeychainPromise, bitgoKeychainPromise])
  .then(function() {
    var walletParams = {
      "label": label,
      "m": 2,
      "n": 3,
      "keys": [
        userKeychain.id,
        backupKeychain.id,
        bitgoKeychain.id
      ]
    };

    if (params.enterprise) {
      walletParams.enterprise = params.enterprise;
    }

    if (params.disableTransactionNotifications) {
      walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
    }

    return self.bitgo.post(self.baseCoin.url('/wallet')).send(walletParams).result();
  })
  .then(function(newWallet) {
    var result = {
      wallet: new self.coinWallet(self.bitgo, self.baseCoin, newWallet),
      userKeychain: userKeychain,
      backupKeychain: backupKeychain,
      bitgoKeychain: bitgoKeychain
    };

    if (backupKeychain.xprv) {
      result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
    }

    return result;
  })
  .nodeify(callback);
};

/**
 * Get a wallet by its ID
 * @param params
 * @param callback
 * @returns {*}
 */
Wallets.prototype.getWallet = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  var self = this;

  return this.bitgo.get(this.baseCoin.url('/wallet/' + params.id))
  .result()
  .then(function(wallet) {
    return new self.coinWallet(self.bitgo, self.baseCoin, wallet);
  })
  .nodeify(callback);
};

Wallets.prototype.parentList = function() {
  return 'listing all my parents';
};

module.exports = Wallets;
