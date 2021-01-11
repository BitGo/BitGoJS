/**
 * @hidden
 */

/**
 */
//
// Keychains Object
// BitGo accessor to a user's keychain.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import { randomBytes } from 'crypto';
import * as common from './common';
import { Util } from './v2/internal/util';
import * as bitcoin from '@bitgo/utxo-lib';
import { hdPath } from './bitcoin';
const _ = require('lodash');
let ethereumUtil;
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

try {
  ethereumUtil = require('ethereumjs-util');
} catch (e) {
  // ethereum currently not supported
}

//
// Constructor
//
const Keychains = function(bitgo) {
  this.bitgo = bitgo;
};

//
// isValid
// Tests a xpub or xprv string to see if it is a valid keychain.
//
Keychains.prototype.isValid = function(params) {
  params = params || {};
  common.validateParams(params, [], []);

  if (params.ethAddress) {
    if (!_.isString(params.ethAddress)) {
      throw new Error('ethAddress must be a string');
    }
    return ethereumUtil.isValidAddress(params.ethAddress);
  }

  if (!_.isString(params.key) && !_.isObject(params.key)) {
    throw new Error('key must be a string or object');
  }

  try {
    if (!params.key.path) {
      bitcoin.HDNode.fromBase58(params.key);
    } else {
      const hdnode = bitcoin.HDNode.fromBase58(params.key.xpub);
      hdPath(hdnode).derive(params.key.path);
    }
    return true;
  } catch (e) {
    return false;
  }
};

//
// create
// Create a new keychain locally.
// Does not send the keychain to bitgo, only creates locally.
// If |seed| is provided, used to seed the keychain.  Otherwise,
// a random keychain is created.
//
Keychains.prototype.create = function(params) {
  params = params || {};
  common.validateParams(params, [], []);

  let seed;
  if (!params.seed) {
    // An extended private key has both a normal 256 bit private key and a 256
    // bit chain code, both of which must be random. 512 bits is therefore the
    // maximum entropy and gives us maximum security against cracking.
    seed = randomBytes(512 / 8);
  } else {
    seed = params.seed;
  }

  const extendedKey = bitcoin.HDNode.fromSeedBuffer(seed);
  const xpub = extendedKey.neutered().toBase58();

  let ethAddress;
  try {
    ethAddress = Util.xpubToEthAddress(xpub);
  } catch (e) {
    // ethereum is unavailable
  }

  return {
    xpub: xpub,
    xprv: extendedKey.toBase58(),
    ethAddress: ethAddress
  };
};

// used by deriveLocal
const apiResponse = function(status, result, message) {
  const err: any = new Error(message);
  err.status = status;
  err.result = result;
  return err;
};

//
// deriveLocal
// Locally derives a keychain from a top level BIP32 string, given a path.
//
Keychains.prototype.deriveLocal = function(params) {
  params = params || {};
  common.validateParams(params, ['path'], ['xprv', 'xpub']);

  if (!params.xprv && !params.xpub) {
    throw new Error('must provide an xpub or xprv for derivation.');
  }
  if (params.xprv && params.xpub) {
    throw new Error('cannot provide both xpub and xprv');
  }

  let hdNode;
  try {
    hdNode = bitcoin.HDNode.fromBase58(params.xprv || params.xpub);
  } catch (e) {
    throw apiResponse(400, {}, 'Unable to parse the xprv or xpub');
  }

  let derivedNode;
  try {
    derivedNode = hdPath(hdNode).derive(params.path);
  } catch (e) {
    throw apiResponse(400, {}, 'Unable to derive HD key from path');
  }

  const xpub = derivedNode.neutered().toBase58();

  let ethAddress;
  try {
    ethAddress = Util.xpubToEthAddress(xpub);
  } catch (e) {
    // ethereum is unavailable
  }

  return {
    path: params.path,
    xpub: xpub,
    xprv: params.xprv && derivedNode.toBase58(),
    ethAddress: ethAddress
  };
};

//
// list
// List the user's keychains
//
Keychains.prototype.list = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.bitgo.url('/keychain'))
  .result('keychains')
  .then(function(keychains) {
    keychains.map(function(keychain) {
      if (keychain.xpub && keychain.ethAddress && Util.xpubToEthAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
        throw new Error('ethAddress and xpub do not match');
      }
    });
    return keychains;
  })
  .nodeify(callback);
};

/**
 * iterates through all keys associated with the user, decrypts them with the old password and encrypts them with the
 * new password
 * @param params.oldPassword {String} - The old password used for encrypting the key
 * @param params.newPassword {String} - The new password to be used for encrypting the key
 * @param callback
 * @returns result.keychains {Object} - e.g.:
 *  {
 *    xpub1: encryptedPrv1,
 *    xpub2: encryptedPrv2,
 *    ...
 *  }
 *  @returns result.version {Number}
 */
Keychains.prototype.updatePassword = function(params, callback) {
  return co(function *coUpdatePassword() {
    common.validateParams(params, ['oldPassword', 'newPassword'], [], callback);
    const encrypted = yield this.bitgo.post(this.bitgo.url('/user/encrypted')).result();
    const newKeychains = {};
    const self = this;
    _.forOwn(encrypted.keychains, function keychainsForOwn(oldEncryptedXprv, xpub) {
      try {
        const decryptedPrv = self.bitgo.decrypt({ input: oldEncryptedXprv, password: params.oldPassword });
        const newEncryptedPrv = self.bitgo.encrypt({ input: decryptedPrv, password: params.newPassword });
        newKeychains[xpub] = newEncryptedPrv;
      } catch (e) {
        // decrypting the keychain with the old password didn't work so we just keep it the way it is
        newKeychains[xpub] = oldEncryptedXprv;
      }
    });
    return { keychains: newKeychains, version: encrypted.version };
  }).call(this).asCallback(callback);
};

//
// add
// Add a new keychain
//
Keychains.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['xpub'], ['encryptedXprv', 'type', 'isLedger'], callback);

  return this.bitgo.post(this.bitgo.url('/keychain'))
  .send({
    xpub: params.xpub,
    encryptedXprv: params.encryptedXprv,
    type: params.type,
    originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
    isLedger: params.isLedger
  })
  .result()
  .then(function(keychain) {
    if (keychain.xpub && keychain.ethAddress && Util.xpubToEthAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};

//
// createBitGo
// Add a new BitGo server keychain
//
Keychains.prototype.createBitGo = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.post(this.bitgo.url('/keychain/bitgo'))
  .send(params)
  .result()
  .then(function(keychain) {
    if (keychain.xpub && keychain.ethAddress && Util.xpubToEthAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};

//
// createBackup
// Create a new backup keychain through bitgo - often used for creating a keychain on a KRS
//
Keychains.prototype.createBackup = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['provider'], [], callback);

  return this.bitgo.post(this.bitgo.url('/keychain/backup'))
  .send(params)
  .result()
  .then(function(keychain) {
    // not all keychains have an xpub
    if (keychain.xpub && keychain.ethAddress && Util.xpubToEthAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};

//
// get
// Fetch an existing keychain
// Parameters include:
//   xpub:  the xpub of the key to lookup (required)
//
Keychains.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['xpub', 'ethAddress'], callback);

  if (!params.xpub && !params.ethAddress) {
    throw new Error('xpub or ethAddress must be defined');
  }

  const id = params.xpub || params.ethAddress;
  return this.bitgo.post(this.bitgo.url('/keychain/' + encodeURIComponent(id)))
  .send({})
  .result()
  .then(function(keychain) {
    if (keychain.xpub && keychain.ethAddress && Util.xpubToEthAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};

//
// update
// Update an existing keychain
// Parameters include:
//   xpub:  the xpub of the key to lookup (required)
//
Keychains.prototype.update = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['xpub'], ['encryptedXprv'], callback);

  return this.bitgo.put(this.bitgo.url('/keychain/' + params.xpub))
  .send({
    encryptedXprv: params.encryptedXprv
  })
  .result()
  .then(function(keychain) {
    if (keychain.xpub && keychain.ethAddress && Util.xpubToEthAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};


module.exports = Keychains;
