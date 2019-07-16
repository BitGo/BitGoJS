import { validateParams } from '../common';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';
import { Wallet } from './wallet'
const util = require('../util');
const co = Bluebird.coroutine;

export interface KeyPair {
  pub?: string;
  prv: string;
}

export interface GetKeychainOptions {
  id: string;
  xpub?: string;
  ethAddress?: string;
  reqId?: string;
}

export interface ListKeychainOptions {
  limit?: number;
  prevId?: string;
}

export interface UpdatePasswordOptions {
  oldPassword: string;
  newPassword: string;
}

interface UpdateSingleKeychainPasswordOptions {
  keychain?: any;
  oldPassword?: string;
  newPassword?: string;
}

interface AddKeychainOptions {
  pub?: string;
  encryptedPrv?: string;
  type?: string;
  source?: string;
  originalPasscodeEncryptionCode?: string;
  enterprise?: string;
  derivedFromParentWithSeed?: any;
  disableKRSEmail?: boolean;
  provider?: string;
  reqId?: string;
  krsSpecific?: any
}

export interface CreateBackupOptions {
  provider?: string;
  source?: string;
}

interface GetKeysForSigningOptions {
  reqId?: string;
  wallet?: Wallet;
}

export class Keychains {

  private readonly bitgo: any;
  private readonly baseCoin: BaseCoin;

  constructor(bitgo: any, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Get a keychain by ID
   * @param params.id
   * @param params.xpub (optional)
   * @param params.ethAddress (optional)
   * @param params.reqId (optional)
   * @param callback
   */
  get(params: GetKeychainOptions, callback?: NodeCallback<any>): Bluebird<any> {

    validateParams(params, [], ['xpub', 'ethAddress'], callback);

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
  }

  /**
   * list the users keychains
   * @param params.limit - Max number of results in a single call.
   * @param params.prevId - Continue iterating (provided by nextBatchPrevId in the previous list)
   * @param callback
   * @returns {*}
   */
  list(params: ListKeychainOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {

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
  }


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
  updatePassword(params: UpdatePasswordOptions, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      validateParams(params, ['oldPassword', 'newPassword'], [], callback);
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
  }

  /**
   * Update the password used to decrypt a single keychain
   * @param keychain - The keychain whose password should be updated
   * @param oldPassword - The old password used for encrypting the key
   * @param newPassword - The new password to be used for encrypting the key
   * @param callback
   * @returns {object}
   */
  updateSingleKeychainPassword(params: UpdateSingleKeychainPasswordOptions = {}): any {

    if (!_.isString(params.oldPassword)) {
      throw new Error('expected old password to be a string');
    }

    if (!_.isString(params.newPassword)) {
      throw new Error('expected new password to be a string');
    }

    if (!_.isObject(params.keychain) || !_.isString(params.keychain.encryptedPrv)) {
      throw new Error('expected keychain to be an object with an encryptedPrv property');
    }

    const oldEncryptedPrv = params.keychain.encryptedPrv;
    try {
      const decryptedPrv = this.bitgo.decrypt({ input: oldEncryptedPrv, password: params.oldPassword });
      const newEncryptedPrv = this.bitgo.encrypt({ input: decryptedPrv, password: params.newPassword });
      return _.assign({}, params.keychain, { encryptedPrv: newEncryptedPrv });
    } catch (e) {
      // catching an error here means that the password was incorrect or, less likely, the input to decrypt is corrupted
      throw new Error('password used to decrypt keychain private key is incorrect');
    }
  }

  /**
   * Create a keychain
   * @param params.seed
   */
  create(params: { seed?: string } = {}): KeyPair {
    return this.baseCoin.generateKeyPair(params.seed);
  }

  /**
   * Add a keychain to BitGo's records
   * @param AddKeychainOptions (see above)
   * @param callback
   */
  add(params: AddKeychainOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    params = params || {};
    validateParams(params, [], ['pub', 'encryptedPrv', 'type', 'source', 'originalPasscodeEncryptionCode', 'enterprise', 'derivedFromParentWithSeed'], callback);

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
  }

  /**
   * Create a BitGo key
   * @param params (empty)
   * @param callback
   */
  createBitGo(params: { source?: 'bitgo'} = {}, callback?: NodeCallback<any>): Bluebird<any> {
    params.source = 'bitgo';

    this.baseCoin.preCreateBitGo(params);

    return this.add(params, callback);
  }

  /**
   * Create a backup key
   * @param params.provider (optional)
   * @param callback
   */
  createBackup(params: CreateBackupOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      params.source = 'backup';

      if (!params.provider) {
        // if the provider is undefined, we generate a local key and add the source details
        const key = this.create();
        _.extend(params, key);
      }

      const serverResponse = yield this.add(params, callback);
      return _.extend({}, serverResponse, _.pick(params, ['prv', 'encryptedPrv', 'provider', 'source']));
    }).call(this).asCallback(callback);
  }

  /**
   * Gets keys for signing from a wallet
   * @param reqId
   * @param callback
   * @returns {Bluebird[]}
   */
  getKeysForSigning(params: GetKeysForSigningOptions = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function *() {
      const reqId = params.reqId || util.createRequestId();
      const ids = params.wallet.baseCoin.keyIdsForSigning();
      const keychainQueriesBluebirds = ids.map(
          id => this.get({ id: params.wallet.keyIds()[id], reqId })
      );
      return Bluebird.all(keychainQueriesBluebirds);
    }).call(this).asCallback(callback);
  }
}

