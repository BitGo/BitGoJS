import common = require('../common');
import * as _ from 'lodash';
import * as Promise from 'bluebird';
const co = Promise.coroutine;

const Keychains = function(bitgo, baseCoin) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
};

Keychains.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['xpub', 'ethAddress'], callback);

  if (!params.id) {
    throw new Error('id must be defined');
  }

  const id = params.id;
  if (params.reqId) {
    this.bitgo._reqId = params.reqId;
  }
  return this.bitgo.get(this.baseCoin.url('/key/' + encodeURIComponent(id)))
  .result()
  .nodeify(callback);
};

/**
 * list the users keychains
 * @param params.limit - Max number of results in a single call.
 * @param params.prevId - Continue iterating (provided by nextBatchPrevId in the previous list)
 * @param callback
 * @returns {*}
 */
Keychains.prototype.list = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], [], callback);

    const queryObject: any = {};

    if (!_.isUndefined(params.limit)) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      queryObject.limit = params.limit;
    }
    if (!_.isUndefined(params.prevId)) {
      if (!_.isString(params.prevId)) {
        throw new Error('invalid prevId argument, expecting string');
      }
      queryObject.prevId = params.prevId;
    }

    return this.bitgo.get(this.baseCoin.url('/key')).query(queryObject).result();
  }).call(this).asCallback(callback);
};

/**
 * Change the decryption password for all possible keychains associated with a user.
 *
 * This function iterates through all keys associated with the user, decrypts
 * them with the old password and re-encrypts them with the new password.
 *
 * This should be called when a user changes their login password, and are expecting
 * that their wallet passwords are changed to match the new login password.
 *
 * @param params.oldPassword - The old password used for encrypting the key
 * @param params.newPassword - The new password to be used for encrypting the key
 * @param callback
 * @returns changedKeys Object - e.g.:
 *  {
 *    xpub1: encryptedPrv,
 *    ...
 *  }
 */
Keychains.prototype.updatePassword = function(params, callback) {
  return co(function *() {
    common.validateParams(params, ['oldPassword', 'newPassword'], [], callback);
    const changedKeys = {};
    let prevId;
    let keysLeft = true;
    while (keysLeft) {
      const result = yield this.list({ limit: 500, prevId });
      for (const key of result.keys) {
        const oldEncryptedPrv = key.encryptedPrv;
        if (_.isUndefined(oldEncryptedPrv)) {
          continue;
        }
        try {
          const updatedKeychain = this.updateSingleKeychainPassword({
            keychain: key,
            oldPassword: params.oldPassword,
            newPassword: params.newPassword
          });
          changedKeys[updatedKeychain.pub] = updatedKeychain.encryptedPrv;
        } catch (e) {
          // if the password was incorrect, silence the error, throw otherwise
          if (!e.message.includes('private key is incorrect')) {
            throw e;
          }
        }
      }
      if (result.nextBatchPrevId) {
        prevId = result.nextBatchPrevId;
      } else {
        keysLeft = false;
      }
    }
    return changedKeys;
  }).call(this).asCallback(callback);
};

/**
 * Update the password used to decrypt a single keychain
 * @param keychain - The keychain whose password should be updated
 * @param oldPassword - The old password used for encrypting the key
 * @param newPassword - The new password to be used for encrypting the key
 * @param callback
 * @returns {object}
 */
Keychains.prototype.updateSingleKeychainPassword = function({ keychain, oldPassword, newPassword }) {
  if (!_.isString(oldPassword)) {
    throw new Error('expected old password to be a string');
  }

  if (!_.isString(newPassword)) {
    throw new Error('expected new password to be a string');
  }

  if (!_.isObject(keychain) || !_.isString(keychain.encryptedPrv)) {
    throw new Error('expected keychain to be an object with an encryptedPrv property');
  }

  const oldEncryptedPrv = keychain.encryptedPrv;
  try {
    const decryptedPrv = this.bitgo.decrypt({ input: oldEncryptedPrv, password: oldPassword });
    const newEncryptedPrv = this.bitgo.encrypt({ input: decryptedPrv, password: newPassword });
    return _.assign({}, keychain, { encryptedPrv: newEncryptedPrv });
  } catch (e) {
    // catching an error here means that the password was incorrect or, less likely, the input to decrypt is corrupted
    throw new Error('password used to decrypt keychain private key is incorrect');
  }
};

Keychains.prototype.create = function(params) {
  params = params || {};
  common.validateParams(params, [], []);

  return this.baseCoin.generateKeyPair(params.seed);
};

Keychains.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['pub', 'encryptedPrv', 'type', 'source', 'originalPasscodeEncryptionCode', 'enterprise', 'derivedFromParentWithSeed'], callback);

  if (!_.isUndefined(params.disableKRSEmail)) {
    if (!_.isBoolean(params.disableKRSEmail)) {
      throw new Error('invalid disableKRSEmail argument, expecting boolean');
    }
  }

  if (params.reqId) {
    this.bitgo._reqId = params.reqId;
  }
  return this.bitgo.post(this.baseCoin.url('/key'))
  .send({
    pub: params.pub,
    encryptedPrv: params.encryptedPrv,
    type: params.type,
    source: params.source,
    provider: params.provider,
    originalPasscodeEncryptionCode: params.originalPasscodeEncryptionCode,
    enterprise: params.enterprise,
    derivedFromParentWithSeed: params.derivedFromParentWithSeed,
    disableKRSEmail: params.disableKRSEmail,
    krsSpecific: params.krsSpecific
  })
  .result()
  .nodeify(callback);
};

Keychains.prototype.createBitGo = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);
  params.source = 'bitgo';

  this.baseCoin.preCreateBitGo(params);

  return this.add(params, callback);
};

Keychains.prototype.createBackup = function(params, callback) {
  return co(function *() {
    params = params || {};
    common.validateParams(params, [], ['provider'], callback);
    params.source = 'backup';

    if (!params.provider) {
      // if the provider is undefined, we generate a local key and add the source details
      const key = this.create();
      _.extend(params, key);
    }

    const serverResponse = yield this.add(params, callback);
    return _.extend({}, serverResponse, _.pick(params, ['prv', 'encryptedPrv', 'provider', 'source']));
  }).call(this).asCallback(callback);
};


module.exports = Keychains;
