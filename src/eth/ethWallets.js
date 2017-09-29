//
// Wallets Object
// BitGo accessor to a user's wallets.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const EthWallet = require('./ethWallet');
const common = require('../common');
const Util = require('../util');
const Promise = require('bluebird');
const _ = require('lodash');

//
// Constructor
// TODO: WORK IN PROGRESS
//
const EthWallets = function(bitgo) {
  this.bitgo = bitgo;
};

//
// list
// List the user's wallets
//
EthWallets.prototype.list = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const args = [];

  if (params.skip && params.prevId) {
    throw new Error('cannot specify both skip and prevId');
  }

  if (params.limit) {
    if (!_.isNumber(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    args.push('limit=' + params.limit);
  }
  if (params.getbalances) {
    if (!_.isBoolean(params.getbalances)) {
      throw new Error('invalid getbalances argument, expecting boolean');
    }
    args.push('getbalances=' + params.getbalances);
  }
  if (params.skip) {
    if (!_.isNumber(params.skip)) {
      throw new Error('invalid skip argument, expecting number');
    }
    args.push('skip=' + params.skip);
  } else if (params.prevId) {
    args.push('prevId=' + params.prevId);
  }

  let query = '';
  if (args.length) {
    query = '?' + args.join('&');
  }

  const self = this;
  return this.bitgo.get(this.bitgo.url('/eth/wallet' + query))
  .result()
  .then(function(body) {
    body.wallets = body.wallets.map(function(w) {
      return new EthWallet(self.bitgo, w);
    });
    return body;
  })
  .nodeify(callback);
};

EthWallets.prototype.getWallet = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  const self = this;

  let query = '';
  if (params.gpk) {
    query = '?gpk=1';
  }

  return this.bitgo.get(this.bitgo.url('/eth/wallet/' + params.id + query))
  .result()
  .then(function(wallet) {
    return new EthWallet(self.bitgo, wallet);
  })
  .nodeify(callback);
};

//
// generateWallet
// Generate a new 2-of-3 wallet and it's associated keychains.
// Returns the locally created keys with their encrypted xprvs.
// **WARNING: BE SURE TO BACKUP! NOT DOING SO CAN RESULT IN LOSS OF FUNDS!**
//
// 1. Creates the user keychain locally on the client, and encrypts it with the provided passphrase
// 2. If no xpub was provided, creates the backup keychain locally on the client, and encrypts it with the provided passphrase
// 3. Uploads the encrypted user and backup keychains to BitGo
// 4. Creates the BitGo key on the service
// 5. Creates the wallet on BitGo with the 3 public keys above
//
// Parameters include:
//   "passphrase": wallet passphrase to encrypt user and backup keys with
//   "label": wallet label, is shown in BitGo UI
//   "backupAddress": backup ethereum address, it is HIGHLY RECOMMENDED you generate this on a separate machine!
//                 BITGO DOES NOT GUARANTEE SAFETY OF WALLETS WITH MULTIPLE KEYS CREATED ON THE SAME MACHINE **
//   "backupXpubProvider": Provision backup key from this provider (KRS), e.g. "keyternal".
//                         Setting this value will create an instant-capable wallet.
// Returns: {
//   wallet: newly created wallet model object
//   userKeychain: the newly created user keychain, which has an encrypted xprv stored on BitGo
//   backupKeychain: the newly created backup keychain
//
// ** BE SURE TO BACK UP THE ENCRYPTED USER AND BACKUP KEYCHAINS!**
//
// }
EthWallets.prototype.generateWallet = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['passphrase', 'label'], ['backupAddress', 'backupXpub', 'backupXpubProvider', 'enterprise'], callback);
  const self = this;

  if ((!!params.backupAddress + !!params.backupXpub + !!params.backupXpubProvider) > 1) {
    throw new Error('Cannot provide more than one backupAddress or backupXpub or backupXpubProvider flag');
  }

  if (params.disableTransactionNotifications !== undefined && !_.isBoolean(params.disableTransactionNotifications)) {
    throw new Error('Expected disableTransactionNotifications to be a boolean. ');
  }

  let userKeychain;
  let userAddress;
  let backupKeychain;
  let backupAddress;
  let bitgoAddress;

  // Add the user keychain
  const userKeychainPromise = Promise.try(function() {
    // Create the user and backup key.
    userKeychain = self.bitgo.keychains().create();
    userKeychain.encryptedXprv = self.bitgo.encrypt({ password: params.passphrase, input: userKeychain.xprv });
    userAddress = Util.xpubToEthAddress(userKeychain.xpub);
    return self.bitgo.keychains().add({
      xpub: userKeychain.xpub,
      encryptedXprv: userKeychain.encryptedXprv
    });
  });

  const backupKeychainPromise = Promise.try(function() {
    if (params.backupXpubProvider) {
      // If requested, use a KRS or backup key provider
      return self.bitgo.keychains().createBackup({
        provider: params.backupXpubProvider,
        disableKRSEmail: params.disableKRSEmail,
        type: 'eth'
      });
    }

    // User provided backup address
    if (params.backupAddress) {
      backupAddress = params.backupAddress;
      return; // no keychain to store
    }

    // User provided backup xpub
    if (params.backupXpub) {
      // user provided backup ethereum address
      backupKeychain = { xpub: params.backupXpub };
    } else {
      // No provided backup xpub or address, so default to creating one here
      backupKeychain = self.bitgo.keychains().create();
    }
    return self.bitgo.keychains().add(backupKeychain);
  })
  .then(function(newBackupKeychain) {
    // the backup keychain might be null if only ethAddress was provided
    if (newBackupKeychain) {
      // add properties returned from server to backupKeychain for fields that are not already defined
      // for fields that are defined, keep the original, client-side definition
      backupKeychain = _.extend({}, newBackupKeychain, backupKeychain);

      if (backupKeychain.xprv) {
        backupKeychain.encryptedXprv = self.bitgo.encrypt({ password: params.passphrase, input: backupKeychain.xprv });
      }
      backupAddress = backupKeychain.ethAddress;
    }
  });

  const bitgoKeychainPromise = self.bitgo.keychains().createBitGo({ type: 'eth' })
  .then(function(keychain) {
    bitgoAddress = keychain.ethAddress;
  });

  // parallelize the independent keychain retrievals/syncs
  return Promise.all([userKeychainPromise, backupKeychainPromise, bitgoKeychainPromise])
  .then(function() {
    const walletParams = {
      m: 2,
      n: 3,
      addresses: [
        userAddress,
        backupAddress,
        bitgoAddress
      ],
      label: params.label,
      enterprise: params.enterprise,
      disableTransactionNotifications: params.disableTransactionNotifications
    };
    return self.add(walletParams);
  })
  .then(function(newWallet) {
    const result = {
      wallet: newWallet,
      userKeychain: userKeychain,
      backupKeychain: backupKeychain
    };

    if (backupKeychain && backupKeychain.xprv) {
      result.warning = 'Be sure to back up the backup keychain -- it is not stored anywhere else!';
    }

    return result;
  })
  .nodeify(callback);
};

//
// add
// Add a new EthWallet (advanced mode).
// This allows you to manually submit the signing addresses, type, m and n of the wallet
// Parameters include:
//    "label": label of the wallet to be shown in UI
//    "m": number of keys required to unlock wallet (2)
//    "n": number of keys available on the wallet (3)
//    "addresses": array of signing addresses
EthWallets.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['label', 'enterprise'], callback);

  if (Array.isArray(params.addresses) === false || !_.isNumber(params.m) ||
  !_.isNumber(params.n)) {
    throw new Error('invalid argument');
  }

  // lowercase the addresses
  params.addresses = _.invokeMap(params.addresses, 'toLowerCase');

  if (params.m !== 2 || params.n !== 3) {
    throw new Error('unsupported multi-sig type');
  }

  const self = this;
  const walletParams = _.extend({ type: 'eth' }, params);

  return this.bitgo.post(this.bitgo.url('/eth/wallet'))
  .send(walletParams)
  .result()
  .then(function(body) {
    const serverAddresses = _.map(body.private.addresses, 'address');
    if (!_.isEqual(walletParams.addresses, serverAddresses)) {
      throw new Error('server addresses do not match');
    }
    return new EthWallet(self.bitgo, body);
  })
  .nodeify(callback);
};

//
// get
// Shorthand to getWallet
// Parameters include:
//   id: the id of the wallet
//
EthWallets.prototype.get = function(params, callback) {
  return this.getWallet(params, callback);
};

//
// remove
// Remove an existing wallet.
// Parameters include:
//   id: the id of the wallet
//
EthWallets.prototype.remove = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return this.bitgo.del(this.bitgo.url('/eth/wallet/' + params.id))
  .result()
  .nodeify(callback);
};

module.exports = EthWallets;
