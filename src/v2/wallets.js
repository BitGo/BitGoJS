const bitcoin = require('../bitcoin');
const common = require('../common');
const Wallet = require('./wallet');
const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');
const RmgCoin = require('./coins/rmg');

const Wallets = function(bitgo, baseCoin) {
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

  const queryObject = {};

  if (params.skip && params.prevId) {
    throw new Error('cannot specify both skip and prevId');
  }

  if (params.getbalances) {
    if (!_.isBoolean(params.getbalances)) {
      throw new Error('invalid getbalances argument, expecting boolean');
    }
    queryObject.getbalances = params.getbalances;
  }
  if (params.prevId) {
    if (!_.isString(params.prevId)) {
      throw new Error('invalid prevId argument, expecting string');
    }
    queryObject.prevId = params.prevId;
  }
  if (params.limit) {
    if (!_.isNumber(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    queryObject.limit = params.limit;
  }

  if (params.allTokens) {
    if (!_.isBoolean(params.allTokens)) {
      throw new Error('invalid allTokens argument, expecting boolean');
    }
    queryObject.allTokens = params.allTokens;
  }

  const self = this;
  return this.bitgo.get(this.baseCoin.url('/wallet'))
  .query(queryObject)
  .result()
  .then(function(body) {
    body.wallets = body.wallets.map(function(w) {
      return new self.coinWallet(self.bitgo, self.baseCoin, w);
    });
    return body;
  })
  .nodeify(callback);
};

/**
* add
* Add a new wallet (advanced mode).
* This allows you to manually submit the keys, type, m and n of the wallet
* Parameters include:
*    "label": label of the wallet to be shown in UI
*    "m": number of keys required to unlock wallet (2)
*    "n": number of keys available on the wallet (3)
*    "keys": array of keychain ids
*/
Wallets.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['label', 'enterprise'], callback);

  if (Array.isArray(params.keys) === false || !_.isNumber(params.m) ||
    !_.isNumber(params.n)) {
    throw new Error('invalid argument');
  }

  if (params.tags && Array.isArray(params.tags) === false) {
    throw new Error('invalid argument for tags - array expected');
  }

  if (params.clientFlags && Array.isArray(params.clientFlags) === false) {
    throw new Error('invalid argument for clientFlags - array expected');
  }

  if (params.isCold && !_.isBoolean(params.isCold)) {
    throw new Error('invalid argument for isCold - boolean expected');
  }

  // TODO: support more types of multisig
  if (params.m !== 2 || params.n !== 3) {
    throw new Error('unsupported multi-sig type');
  }

  const self = this;
  const walletParams = {
    label: params.label,
    m: params.m,
    n: params.n,
    keys: params.keys
  };

  // TODO: replace all IFs with single pick line
  if (params.enterprise) {
    walletParams.enterprise = params.enterprise;
  }

  if (params.isCold) {
    walletParams.isCold = params.isCold;
  }

  if (params.tags) {
    walletParams.tags = params.tags;
  }

  if (params.clientFlags) {
    walletParams.clientFlags = params.clientFlags;
  }

  // Additional params needed for xrp
  if (params.rootPub) {
    walletParams.rootPub = params.rootPub;
  }

  if (params.initializationTxs) {
    walletParams.initializationTxs = params.initializationTxs;
  }

  if (params.disableTransactionNotifications) {
    walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
  }

  return self.bitgo.post(self.baseCoin.url('/wallet')).send(walletParams).result()
  .then(function(newWallet) {
    return {
      wallet: new self.coinWallet(self.bitgo, self.baseCoin, newWallet)
    };
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
 * @param params.label
 * @param params.passphrase
 * @param params.userKey User xpub
 * @param params.backupXpub Backup xpub
 * @param params.backupXpubProvider
 * @param params.enterprise
 * @param params.disableTransactionNotifications
 * @param params.passcodeEncryptionCode
 * @param params.coldDerivationSeed
 * @param callback
 * @returns {*}
 */
Wallets.prototype.generateWallet = co(function *(params, callback) {
  params = params || {};
  common.validateParams(params, ['label'], ['passphrase', 'userKey', 'backupXpub', 'enterprise', 'passcodeEncryptionCode'], callback);
  const self = this;
  const label = params.label;

  if ((!!params.backupXpub + !!params.backupXpubProvider) > 1) {
    throw new Error('Cannot provide more than one backupXpub or backupXpubProvider flag');
  }

  if (params.disableTransactionNotifications !== undefined && !_.isBoolean(params.disableTransactionNotifications)) {
    throw new Error('Expected disableTransactionNotifications to be a boolean. ');
  }

  if (params.passcodeEncryptionCode && !_.isString(params.passcodeEncryptionCode)) {
    throw new Error('passcodeEncryptionCode must be a string');
  }

  let userKeychain;
  let backupKeychain;
  let bitgoKeychain;
  let derivationPath;

  const passphrase = params.passphrase;
  const canEncrypt = (!!passphrase && typeof passphrase === 'string');
  const isCold = (!canEncrypt || !!params.userKey);

  // Add the user keychain
  const userKeychainPromise = co(function *() {
    let userKeychainParams;
    // User provided user key
    if (params.userKey) {
      userKeychain = { pub: params.userKey };
      userKeychainParams = userKeychain;
      if (params.coldDerivationSeed) {
        // the derivation only makes sense when a key already exists
        const derivation = self.baseCoin.deriveKeyWithSeed({ key: params.userKey, seed: params.coldDerivationSeed });
        derivationPath = derivation.derivationPath;
        userKeychain.pub = derivation.key;
      }
    } else {
      if (!canEncrypt) {
        throw new Error('cannot generate user keypair without passphrase');
      }
      // Create the user and backup key.
      userKeychain = self.baseCoin.keychains().create();
      userKeychain.encryptedPrv = self.bitgo.encrypt({ password: passphrase, input: userKeychain.prv });
      userKeychainParams = {
        pub: userKeychain.pub,
        encryptedPrv: userKeychain.encryptedPrv,
        originalPasscodeEncryptionCode: params.passcodeEncryptionCode
      };
    }

    const newUserKeychain = yield self.baseCoin.keychains().add(userKeychainParams);
    userKeychain = _.extend({}, newUserKeychain, userKeychain);
  })();

  const backupKeychainPromise = Promise.try(function() {
    if (params.backupXpubProvider || self.baseCoin instanceof RmgCoin) {
      // If requested, use a KRS or backup key provider
      return self.baseCoin.keychains().createBackup({
        provider: params.backupXpubProvider || 'defaultRMGBackupProvider',
        disableKRSEmail: params.disableKRSEmail,
        type: null
      });
    }

    // User provided backup xpub
    if (params.backupXpub) {
      // user provided backup ethereum address
      backupKeychain = { pub: params.backupXpub, source: 'backup' };
    } else {
      if (!canEncrypt) {
        throw new Error('cannot generate backup keypair without passphrase');
      }
      // No provided backup xpub or address, so default to creating one here
      return self.baseCoin.keychains().createBackup();
    }

    return self.baseCoin.keychains().add(backupKeychain);
  })
  .then(function(newBackupKeychain) {
    backupKeychain = _.extend({}, newBackupKeychain, backupKeychain);
  });

  const bitgoKeychainParams = {
    enterprise: params.enterprise
  };

  const bitgoKeychainPromise = self.baseCoin.keychains().createBitGo(bitgoKeychainParams)
  .then(function(keychain) {
    bitgoKeychain = keychain;
  });

  // Add the user keychain
  yield Promise.all([userKeychainPromise, backupKeychainPromise, bitgoKeychainPromise]);
  let walletParams = {
    label: label,
    m: 2,
    n: 3,
    keys: [
      userKeychain.id,
      backupKeychain.id,
      bitgoKeychain.id
    ],
    isCold: isCold
  };

  if (params.enterprise) {
    walletParams.enterprise = params.enterprise;
  }

  if (params.disableTransactionNotifications) {
    walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
  }

  if (self.baseCoin.getFamily() === 'xrp' && params.rootPrivateKey) {
    walletParams.rootPrivateKey = params.rootPrivateKey;
  }

  const keychains = {
    userKeychain,
    backupKeychain,
    bitgoKeychain
  };
  walletParams = yield self.baseCoin.supplementGenerateWallet(walletParams, keychains);
  const newWallet = yield self.bitgo.post(self.baseCoin.url('/wallet')).send(walletParams).result();
  const result = {
    wallet: new self.coinWallet(self.bitgo, self.baseCoin, newWallet),
    userKeychain: userKeychain,
    backupKeychain: backupKeychain,
    bitgoKeychain: bitgoKeychain
  };

  if (backupKeychain.prv) {
    result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
  }

  if (derivationPath) {
    userKeychain.derivationPath = derivationPath;
  }

  return Promise.resolve(result).asCallback(callback);
});

//
// listShares
// List the user's wallet shares
//
Wallets.prototype.listShares = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.baseCoin.url('/walletshare'))
  .result()
  .nodeify(callback);
};

//
// getShare
// Gets a wallet share information, including the encrypted sharing keychain. requires unlock if keychain is present.
// Params:
//    walletShareId - the wallet share to get information on
//
Wallets.prototype.getShare = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], [], callback);

  return this.bitgo.get(this.baseCoin.url('/walletshare/' + params.walletShareId))
  .result()
  .nodeify(callback);
};

//
// updateShare
// updates a wallet share
// Params:
//    walletShareId - the wallet share to update
//    state - the new state of the wallet share
//
Wallets.prototype.updateShare = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], [], callback);

  return this.bitgo.post(this.baseCoin.url('/walletshare/' + params.walletShareId))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// resendShareInvite
// Resends a wallet share invitation email
// Params:
//    walletShareId - the wallet share whose invitiation should be resent
//
Wallets.prototype.resendShareInvite = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, ['walletShareId'], [], callback);

    const urlParts = params.walletShareId + '/resendemail';
    return this.bitgo.post(this.baseCoin.url('/walletshare/' + urlParts))
    .result();
  }).call(this).asCallback(callback);
};

//
// cancelShare
// cancels a wallet share
// Params:
//    walletShareId - the wallet share to update
//
Wallets.prototype.cancelShare = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], [], callback);

  return this.bitgo.del(this.baseCoin.url('/walletshare/' + params.walletShareId))
  .send()
  .result()
  .nodeify(callback);
};

//
// acceptShare
// Accepts a wallet share, adding the wallet to the user's list
// Needs a user's password to decrypt the shared key
// Params:
//    walletShareId - the wallet share to accept
//    userPassword - (required if more a keychain was shared) user's password to decrypt the shared wallet
//    newWalletPassphrase - new wallet passphrase for saving the shared wallet prv.
//                          If left blank and a wallet with more than view permissions was shared, then the userpassword is used.
//    overrideEncryptedPrv - set only if the prv was received out-of-band.
//
Wallets.prototype.acceptShare = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['walletShareId'], ['overrideEncryptedPrv', 'userPassword', 'newWalletPassphrase'], callback);

  const self = this;
  let encryptedPrv = params.overrideEncryptedPrv;

  return this.getShare({ walletShareId: params.walletShareId })
  .then(function(walletShare) {
    // Return right away if there is no keychain to decrypt, or if explicit encryptedPrv was provided
    if (!walletShare.keychain || !walletShare.keychain.encryptedPrv || encryptedPrv) {
      return walletShare;
    }

    // More than viewing was requested, so we need to process the wallet keys using the shared ecdh scheme
    if (!params.userPassword) {
      throw new Error('userPassword param must be provided to decrypt shared key');
    }

    return self.bitgo.getECDHSharingKeychain()
    .then(function(sharingKeychain) {
      if (!sharingKeychain.encryptedXprv) {
        throw new Error('encryptedXprv was not found on sharing keychain');
      }

      // Now we have the sharing keychain, we can work out the secret used for sharing the wallet with us
      sharingKeychain.prv = self.bitgo.decrypt({ password: params.userPassword, input: sharingKeychain.encryptedXprv });
      const rootExtKey = bitcoin.HDNode.fromBase58(sharingKeychain.prv);

      // Derive key by path (which is used between these 2 users only)
      const privKey = bitcoin.hdPath(rootExtKey).deriveKey(walletShare.keychain.path);
      const secret = self.bitgo.getECDHSecret({ eckey: privKey, otherPubKeyHex: walletShare.keychain.fromPubKey });

      // Yes! We got the secret successfully here, now decrypt the shared wallet prv
      const decryptedSharedWalletPrv = self.bitgo.decrypt({ password: secret, input: walletShare.keychain.encryptedPrv });

      // We will now re-encrypt the wallet with our own password
      const newWalletPassphrase = params.newWalletPassphrase || params.userPassword;
      encryptedPrv = self.bitgo.encrypt({ password: newWalletPassphrase, input: decryptedSharedWalletPrv });

      // Carry on to the next block where we will post the acceptance of the share with the encrypted prv
      return walletShare;
    });
  })
  .then(function() {
    const updateParams = {
      walletShareId: params.walletShareId,
      state: 'accepted'
    };

    if (encryptedPrv) {
      updateParams.encryptedPrv = encryptedPrv;
    }

    return self.updateShare(updateParams);
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

  const self = this;

  const query = {};

  if (params.allTokens) {
    if (!_.isBoolean(params.allTokens)) {
      throw new Error('invalid allTokens argument, expecting boolean');
    }
    query.allTokens = params.allTokens;
  }

  return this.bitgo.get(this.baseCoin.url('/wallet/' + params.id))
  .query(query)
  .result()
  .then(function(wallet) {
    return new self.coinWallet(self.bitgo, self.baseCoin, wallet);
  })
  .nodeify(callback);
};

/**
 * Get a wallet by its address
 * @param params
 * @param callback
 * @returns {*}
 */
Wallets.prototype.getWalletByAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  const self = this;

  return this.bitgo.get(this.baseCoin.url('/wallet/address/' + params.address))
  .result()
  .then(function(wallet) {
    return new self.coinWallet(self.bitgo, self.baseCoin, wallet);
  })
  .nodeify(callback);
};

/**
 * For any given supported coin, get total balances for all wallets of that
 * coin type on the account.
 * @param params
 * @param callback
 * @returns {*}
 */
Wallets.prototype.getTotalBalances = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], [], callback);

    return this.bitgo.get(this.baseCoin.url('/wallet/balances'))
    .result()
    .nodeify(callback);
  }).call(this).asCallback(callback);
};

module.exports = Wallets;
