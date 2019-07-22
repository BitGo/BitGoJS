/**
 * @prettier
 */
import * as bitcoin from 'bitgo-utxo-lib';
import * as common from '../common';
import { BaseCoin } from './baseCoin';
import { NodeCallback } from './types';
import { Wallet } from './wallet';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { hdPath } from '../bitcoin';
const util = require('../util');
const co = Bluebird.coroutine;

export class Wallets {
  private readonly bitgo: any;
  private readonly baseCoin: BaseCoin;

  constructor(bitgo: any, baseCoin: BaseCoin) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
  }

  /**
   * Get a wallet by ID (proxy for getWallet)
   * @param params
   * @param callback
   */
  get(params: any = {}, callback?: NodeCallback<Wallet>): Bluebird<Wallet> {
    return this.getWallet(params, callback);
  }

  /**
   * List a user's wallets
   * @param params
   * @param callback
   * @returns {*}
   */
  list(params: any = {}, callback?: NodeCallback<{ wallets: Wallet[] }>): Bluebird<{ wallets: Wallet[] }> {
    return co(function*() {
      const queryObject: any = {};

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
      const body = yield this.bitgo
        .get(this.baseCoin.url('/wallet'))
        .query(queryObject)
        .result();
      body.wallets = body.wallets.map(w => new Wallet(self.bitgo, self.baseCoin, w));
      return body;
    })
      .call(this)
      .asCallback(callback);
  }

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
  add(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      common.validateParams(params, [], ['label', 'enterprise', 'type'], callback);

      // no need to pass keys for (single) custodial wallets
      if (params.type !== 'custodial') {
        if (Array.isArray(params.keys) === false || !_.isNumber(params.m) || !_.isNumber(params.n)) {
          throw new Error('invalid argument');
        }

        // TODO: support more types of multisig
        if (!this.baseCoin.isValidMofNSetup(params)) {
          throw new Error('unsupported multi-sig type');
        }
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

      if (params.isCustodial && !_.isBoolean(params.isCustodial)) {
        throw new Error('invalid argument for isCustodial - boolean expected');
      }

      const walletParams: any = _.pick(params, [
        'label',
        'm',
        'n',
        'keys',
        'enterprise',
        'isCold',
        'isCustodial',
        'tags',
        'clientFlags',
        'type',
      ]);

      // Additional params needed for xrp
      if (params.rootPub) {
        walletParams.rootPub = params.rootPub;
      }

      // In XLM this private key is used only for wallet creation purposes, once the wallet is initialized then we
      // update its weight to 0 making it an invalid key.
      // https://www.stellar.org/developers/guides/concepts/multi-sig.html#additional-signing-keys
      if (params.rootPrivateKey) {
        walletParams.rootPrivateKey = params.rootPrivateKey;
      }

      if (params.initializationTxs) {
        walletParams.initializationTxs = params.initializationTxs;
      }

      if (params.disableTransactionNotifications) {
        walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
      }

      const newWallet = yield this.bitgo
        .post(this.baseCoin.url('/wallet'))
        .send(walletParams)
        .result();
      return {
        wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
      };
    })
      .call(this)
      .asCallback(callback);
  }

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
   * @param params.gasPrice
   * @param params.disableKRSEmail
   * @param callback
   * @returns {*}
   */
  generateWallet(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      common.validateParams(params, ['label'], ['passphrase', 'userKey', 'backupXpub'], callback);
      const label = params.label;

      let walletParams: any = {
        label: label,
        m: 2,
        n: 3,
      };

      const hasBackupXpub = !!params.backupXpub;
      const hasBackupXpubProvider = !!params.backupXpubProvider;
      if (hasBackupXpub && hasBackupXpubProvider) {
        throw new Error('Cannot provide more than one backupXpub or backupXpubProvider flag');
      }

      if (!_.isUndefined(params.passcodeEncryptionCode)) {
        if (!_.isString(params.passcodeEncryptionCode)) {
          throw new Error('passcodeEncryptionCode must be a string');
        }
      }

      if (!_.isUndefined(params.enterprise)) {
        if (!_.isString(params.enterprise)) {
          throw new Error('invalid enterprise argument, expecting string');
        }
        walletParams.enterprise = params.enterprise;
      }

      if (!_.isUndefined(params.disableTransactionNotifications)) {
        if (!_.isBoolean(params.disableTransactionNotifications)) {
          throw new Error('invalid disableTransactionNotifications argument, expecting boolean');
        }
        walletParams.disableTransactionNotifications = params.disableTransactionNotifications;
      }

      if (!_.isUndefined(params.gasPrice)) {
        if (!_.isNumber(params.gasPrice)) {
          throw new Error('invalid gas price argument, expecting number');
        }
        walletParams.gasPrice = params.gasPrice;
      }

      if (!_.isUndefined(params.disableKRSEmail)) {
        if (!_.isBoolean(params.disableKRSEmail)) {
          throw new Error('invalid disableKRSEmail argument, expecting boolean');
        }
      }

      // Ensure each krsSpecific param is either a string, boolean, or number
      if (!_.isUndefined(params.krsSpecific)) {
        Object.keys(params.krsSpecific).forEach(key => {
          const val = params.krsSpecific[key];
          if (!_.isBoolean(val) && !_.isString(val) && !_.isNumber(val)) {
            throw new Error('krsSpecific object contains illegal values. values must be strings, booleans, or numbers');
          }
        });
      }

      let derivationPath = undefined;

      const passphrase = params.passphrase;
      const canEncrypt = !!passphrase && typeof passphrase === 'string';
      const isCold = !canEncrypt || !!params.userKey;
      const reqId = util.createRequestId();

      // Add the user keychain
      const userKeychainPromise = co(function*() {
        let userKeychainParams;
        let userKeychain;
        // User provided user key
        if (params.userKey) {
          userKeychain = { pub: params.userKey };
          userKeychainParams = userKeychain;
          if (params.coldDerivationSeed) {
            // the derivation only makes sense when a key already exists
            const derivation = this.baseCoin.deriveKeyWithSeed({
              key: params.userKey,
              seed: params.coldDerivationSeed,
            });
            derivationPath = derivation.derivationPath;
            userKeychain.pub = derivation.key;
          }
        } else {
          if (!canEncrypt) {
            throw new Error('cannot generate user keypair without passphrase');
          }
          // Create the user key.
          userKeychain = this.baseCoin.keychains().create();
          userKeychain.encryptedPrv = this.bitgo.encrypt({ password: passphrase, input: userKeychain.prv });
          userKeychainParams = {
            pub: userKeychain.pub,
            encryptedPrv: userKeychain.encryptedPrv,
            originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
          };
        }

        userKeychainParams.reqId = reqId;
        const newUserKeychain = yield this.baseCoin.keychains().add(userKeychainParams);
        return _.extend({}, newUserKeychain, userKeychain);
      }).call(this);

      const backupKeychainPromise = co(function*() {
        if (params.backupXpubProvider || this.baseCoin.getFamily() === 'rmg') {
          // If requested, use a KRS or backup key provider
          return this.baseCoin.keychains().createBackup({
            provider: params.backupXpubProvider || 'defaultRMGBackupProvider',
            disableKRSEmail: params.disableKRSEmail,
            krsSpecific: params.krsSpecific,
            type: this.baseCoin.getChain(),
            reqId,
          });
        }

        // User provided backup xpub
        if (params.backupXpub) {
          // user provided backup ethereum address
          return this.baseCoin.keychains().add({ pub: params.backupXpub, source: 'backup', reqId });
        } else {
          if (!canEncrypt) {
            throw new Error('cannot generate backup keypair without passphrase');
          }
          // No provided backup xpub or address, so default to creating one here
          return this.baseCoin.keychains().createBackup({ reqId });
        }
      }).call(this);

      const { userKeychain, backupKeychain, bitgoKeychain } = yield Bluebird.props({
        userKeychain: userKeychainPromise,
        backupKeychain: backupKeychainPromise,
        bitgoKeychain: this.baseCoin.keychains().createBitGo({ enterprise: params.enterprise, reqId }),
      });

      walletParams.keys = [userKeychain.id, backupKeychain.id, bitgoKeychain.id];

      walletParams.isCold = isCold;

      if (_.isString(userKeychain.prv)) {
        walletParams.keySignatures = {
          backup: this.baseCoin.signMessage(userKeychain, backupKeychain.pub).toString('hex'),
          bitgo: this.baseCoin.signMessage(userKeychain, bitgoKeychain.pub).toString('hex'),
        };
      }

      if (_.includes(['xrp', 'xlm'], this.baseCoin.getFamily()) && !_.isUndefined(params.rootPrivateKey)) {
        walletParams.rootPrivateKey = params.rootPrivateKey;
      }

      const keychains = {
        userKeychain,
        backupKeychain,
        bitgoKeychain,
      };
      walletParams = yield this.baseCoin.supplementGenerateWallet(walletParams, keychains);
      this.bitgo._reqId = reqId;
      const newWallet = yield this.bitgo
        .post(this.baseCoin.url('/wallet'))
        .send(walletParams)
        .result();
      const result: any = {
        wallet: new Wallet(this.bitgo, this.baseCoin, newWallet),
        userKeychain: userKeychain,
        backupKeychain: backupKeychain,
        bitgoKeychain: bitgoKeychain,
      };

      if (!_.isUndefined(backupKeychain.prv)) {
        result.warning = 'Be sure to backup the backup keychain -- it is not stored anywhere else!';
      }

      if (!_.isUndefined(derivationPath)) {
        userKeychain.derivationPath = derivationPath;
      }

      return result;
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * List the user's wallet shares
   * @param params
   * @param callback
   */
  listShares(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.baseCoin.url('/walletshare'))
      .result()
      .asCallback(callback);
  }

  /**
   * Gets a wallet share information, including the encrypted sharing keychain. requires unlock if keychain is present.
   * @param params
   * @param params.walletShareId - the wallet share to get information on
   * @param callback
   */
  getShare(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    common.validateParams(params, ['walletShareId'], [], callback);

    return this.bitgo
      .get(this.baseCoin.url('/walletshare/' + params.walletShareId))
      .result()
      .nodeify(callback);
  }

  /**
   * Update a wallet share
   * @param params.walletShareId - the wallet share to update
   * @param params.state - the new state of the wallet share
   * @param params
   * @param callback
   */
  updateShare(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    params = params || {};
    common.validateParams(params, ['walletShareId'], [], callback);

    return this.bitgo
      .post(this.baseCoin.url('/walletshare/' + params.walletShareId))
      .send(params)
      .result()
      .nodeify(callback);
  }

  /**
   * Resend a wallet share invitation email
   * @param params
   * @param params.walletShareId - the wallet share whose invitiation should be resent
   * @param callback
   */
  resendShareInvite(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      common.validateParams(params, ['walletShareId'], [], callback);

      const urlParts = params.walletShareId + '/resendemail';
      return this.bitgo.post(this.baseCoin.url('/walletshare/' + urlParts)).result();
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Cancel a wallet share
   * @param params
   * @param params.walletShareId - the wallet share to update
   * @param callback
   */
  cancelShare(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    params = params || {};
    common.validateParams(params, ['walletShareId'], [], callback);

    return this.bitgo
      .del(this.baseCoin.url('/walletshare/' + params.walletShareId))
      .send()
      .result()
      .nodeify(callback);
  }

  /**
   * Accepts a wallet share, adding the wallet to the user's list
   * Needs a user's password to decrypt the shared key
   *
   * @param params
   * @param params.walletShareId - the wallet share to accept
   * @param params.userPassword - (required if more a keychain was shared) user's password to decrypt the shared wallet
   * @param params.newWalletPassphrase - new wallet passphrase for saving the shared wallet prv.
   *                                     If left blank and a wallet with more than view permissions was shared,
   *                                     then the user's login password is used.
   * @param params.overrideEncryptedPrv - set only if the prv was received out-of-band.
   * @param callback
   */
  acceptShare(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return co(function*() {
      common.validateParams(
        params,
        ['walletShareId'],
        ['overrideEncryptedPrv', 'userPassword', 'newWalletPassphrase'],
        callback
      );

      let encryptedPrv = params.overrideEncryptedPrv;

      const walletShare = yield this.getShare({ walletShareId: params.walletShareId });

      // Return right away if there is no keychain to decrypt, or if explicit encryptedPrv was provided
      if (!walletShare.keychain || !walletShare.keychain.encryptedPrv || encryptedPrv) {
        return this.updateShare({
          walletShareId: params.walletShareId,
          state: 'accepted',
        });
      }

      // More than viewing was requested, so we need to process the wallet keys using the shared ecdh scheme
      if (!params.userPassword) {
        throw new Error('userPassword param must be provided to decrypt shared key');
      }

      const sharingKeychain = yield this.bitgo.getECDHSharingKeychain();
      if (!sharingKeychain.encryptedXprv) {
        throw new Error('encryptedXprv was not found on sharing keychain');
      }

      // Now we have the sharing keychain, we can work out the secret used for sharing the wallet with us
      sharingKeychain.prv = this.bitgo.decrypt({ password: params.userPassword, input: sharingKeychain.encryptedXprv });
      const rootExtKey = bitcoin.HDNode.fromBase58(sharingKeychain.prv);

      // Derive key by path (which is used between these 2 users only)
      const privKey = hdPath(rootExtKey).deriveKey(walletShare.keychain.path);
      const secret = this.bitgo.getECDHSecret({ eckey: privKey, otherPubKeyHex: walletShare.keychain.fromPubKey });

      // Yes! We got the secret successfully here, now decrypt the shared wallet prv
      const decryptedSharedWalletPrv = this.bitgo.decrypt({
        password: secret,
        input: walletShare.keychain.encryptedPrv,
      });

      // We will now re-encrypt the wallet with our own password
      const newWalletPassphrase = params.newWalletPassphrase || params.userPassword;
      encryptedPrv = this.bitgo.encrypt({ password: newWalletPassphrase, input: decryptedSharedWalletPrv });
      const updateParams: any = {
        walletShareId: params.walletShareId,
        state: 'accepted',
      };

      if (encryptedPrv) {
        updateParams.encryptedPrv = encryptedPrv;
      }

      return this.updateShare(updateParams);
    })
      .call(this)
      .nodeify(callback);
  }

  /**
   * Get a wallet by its ID
   * @param params
   * @param params.id wallet id
   * @param callback
   * @returns {*}
   */
  getWallet(params: any = {}, callback?: NodeCallback<Wallet>): Bluebird<Wallet> {
    return co(function*() {
      common.validateParams(params, ['id'], [], callback);

      const query: any = {};

      if (params.allTokens) {
        if (!_.isBoolean(params.allTokens)) {
          throw new Error('invalid allTokens argument, expecting boolean');
        }
        query.allTokens = params.allTokens;
      }

      this.bitgo._reqId = params.reqId || util.createRequestId();

      const wallet = yield this.bitgo
        .get(this.baseCoin.url('/wallet/' + params.id))
        .query(query)
        .result();
      return new Wallet(this.bitgo, this.baseCoin, wallet);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * Get a wallet by its address
   * @param params
   * @param params.address wallet address
   * @param callback
   * @returns {*}
   */
  getWalletByAddress(params: any = {}, callback?: NodeCallback<Wallet>): Bluebird<Wallet> {
    return co(function*() {
      common.validateParams(params, ['address'], [], callback);

      this.bitgo._reqId = params.reqId || util.createRequestId();

      const wallet = yield this.bitgo.get(this.baseCoin.url('/wallet/address/' + params.address)).result();
      return new Wallet(this.bitgo, this.baseCoin, wallet);
    })
      .call(this)
      .asCallback(callback);
  }

  /**
   * For any given supported coin, get total balances for all wallets of that
   * coin type on the account.
   * @param params
   * @param callback
   * @returns {*}
   */
  getTotalBalances(params: any = {}, callback?: NodeCallback<any>): Bluebird<any> {
    return this.bitgo
      .get(this.baseCoin.url('/wallet/balances'))
      .result()
      .asCallback(callback);
  }
}
