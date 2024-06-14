/**
 * @hidden
 */

/**
 */
//
// Wallet Object
// BitGo accessor for a specific wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import { VirtualSizes } from '@bitgo/unspents';
import * as assert from 'assert';

import { bip32 } from '@bitgo/utxo-lib';
const TransactionBuilder = require('./transactionBuilder');
import * as utxolib from '@bitgo/utxo-lib';
const PendingApproval = require('./pendingapproval');

import {
  common,
  ErrorNoInputToRecover,
  getNetwork,
  getSharedSecret,
  makeRandomKey,
  sanitizeLegacyPath,
} from '@bitgo/sdk-core';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
import * as _ from 'lodash';
const { getExternalChainCode, getInternalChainCode, isChainCode, scriptTypeForChain } = utxolib.bitgo;
const request = require('superagent');

//
// Constructor
//
const Wallet = function (bitgo, wallet) {
  // @ts-expect-error - no implicit this
  (this.bitgo as any) = bitgo;
  // @ts-expect-error - no implicit this
  this.wallet = wallet;
  // @ts-expect-error - no implicit this
  this.keychains = [];

  if (wallet.private) {
    // @ts-expect-error - no implicit this
    this.keychains = wallet.private.keychains;
  }
};

Wallet.prototype.toJSON = function () {
  return this.wallet;
};

//
// id
// Get the id of this wallet.
//
Wallet.prototype.id = function () {
  return this.wallet.id;
};

//
// label
// Get the label of this wallet.
//
Wallet.prototype.label = function () {
  return this.wallet.label;
};

//
// balance
// Get the balance of this wallet.
//
Wallet.prototype.balance = function () {
  return this.wallet.balance;
};

//
// balance
// Get the spendable balance of this wallet.
// This is the total of all unspents except those that are unconfirmed and external
//
Wallet.prototype.spendableBalance = function () {
  return this.wallet.spendableBalance;
};

//
// confirmedBalance
// Get the confirmedBalance of this wallet.
//
Wallet.prototype.confirmedBalance = function () {
  return this.wallet.confirmedBalance;
};

//
// canSendInstant
// Returns if the wallet can send instant transactions
// This is impacted by the choice of backup key provider
//
Wallet.prototype.canSendInstant = function () {
  return this.wallet && this.wallet.canSendInstant;
};

//
// instant balance
// Get the instant balance of this wallet.
// This is the total of all unspents that may be spent instantly.
//
Wallet.prototype.instantBalance = function () {
  if (!this.canSendInstant()) {
    throw new Error('not an instant wallet');
  }
  return this.wallet.instantBalance;
};

//
// unconfirmedSends
// Get the balance of unconfirmedSends of this wallet.
//
Wallet.prototype.unconfirmedSends = function () {
  return this.wallet.unconfirmedSends;
};

//
// unconfirmedReceives
// Get the balance of unconfirmedReceives balance of this wallet.
//
Wallet.prototype.unconfirmedReceives = function () {
  return this.wallet.unconfirmedReceives;
};

//
// type
// Get the type of this wallet, e.g. 'safehd'
//
Wallet.prototype.type = function () {
  return this.wallet.type;
};

Wallet.prototype.url = function (extra) {
  extra = extra || '';
  return this.bitgo.url('/wallet/' + this.id() + extra);
};

//
// pendingApprovals
// returns the pending approvals list for this wallet as pending approval objects
//
Wallet.prototype.pendingApprovals = function () {
  const self = this;
  return this.wallet.pendingApprovals.map(function (p) {
    return new PendingApproval(self.bitgo, p, self);
  });
};

//
// approvalsRequired
// returns the number of approvals required to approve pending approvals involving this wallet
//
Wallet.prototype.approvalsRequired = function () {
  return this.wallet.approvalsRequired || 1;
};

//
// get
// Refetches this wallet and returns it
//
Wallet.prototype.get = function (params, callback): Bluebird<any> {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const self = this;

  return Bluebird.resolve(
    this.bitgo
      .get(this.url())
      .result()
      .then(function (res) {
        self.wallet = res;
        return self;
      })
  ).nodeify(callback);
};

//
// updateApprovalsRequired
// Updates the number of approvals required on a pending approval involving this wallet.
// The approvals required is by default 1, but this function allows you to update the
// number such that 1 <= approvalsRequired <= walletAdmins.length - 1
//
Wallet.prototype.updateApprovalsRequired = function (params, callback): Bluebird<any> {
  params = params || {};
  common.validateParams(params, [], [], callback);
  if (
    params.approvalsRequired === undefined ||
    !_.isInteger(params.approvalsRequired) ||
    params.approvalsRequired < 1
  ) {
    throw new Error('invalid approvalsRequired: must be a nonzero positive number');
  }

  const self = this;
  const currentApprovalsRequired = this.approvalsRequired();
  if (currentApprovalsRequired === params.approvalsRequired) {
    // no-op, just return the current wallet
    return Bluebird.try(function () {
      return self.wallet;
    }).nodeify(callback);
  }

  return Bluebird.resolve(this.bitgo.put(this.url()).send(params).result()).nodeify(callback);
};

/**
 * Returns the correct chain for change, taking into consideration segwit
 */
Wallet.prototype.getChangeChain = function (params) {
  let useSegwitChange = !!this.bitgo.getConstants().enableSegwit;
  if (!_.isUndefined(params.segwitChange)) {
    if (!_.isBoolean(params.segwitChange)) {
      throw new Error('segwitChange must be a boolean');
    }

    // if segwit is disabled through the constants, segwit change should still not be created
    useSegwitChange = this.bitgo.getConstants().enableSegwit && params.segwitChange;
  }
  return useSegwitChange ? getInternalChainCode('p2shP2wsh') : getInternalChainCode('p2sh');
};

//
// createAddress
// Creates a new address for use with this wallet.
//
Wallet.prototype.createAddress = function (params, callback) {
  const self = this;
  params = params || {};
  common.validateParams(params, [], [], callback);
  if (this.type() === 'safe') {
    throw new Error('You are using a legacy wallet that cannot create a new address');
  }

  // Default to client-side address validation on, for safety. Use validate=false to disable.
  const shouldValidate = params.validate !== undefined ? params.validate : this.bitgo.getValidate();

  const allowExisting = params.allowExisting;
  if (typeof allowExisting !== 'boolean') {
    params.allowExisting = allowExisting === 'true';
  }

  const isSegwit = this.bitgo.getConstants().enableSegwit;
  const defaultChain = isSegwit ? getExternalChainCode('p2shP2wsh') : getExternalChainCode('p2sh');

  let chain = params.chain;
  if (chain === null || chain === undefined) {
    chain = defaultChain;
  }
  return Bluebird.resolve(
    this.bitgo
      .post(this.url('/address/' + chain))
      .send(params)
      .result()
      .then(function (addr) {
        if (shouldValidate) {
          self.validateAddress(addr);
        }
        return addr;
      })
  ).nodeify(callback);
};

/**
 * Generate address locally without calling server
 * @param params
 *
 */
Wallet.prototype.generateAddress = function ({ segwit, path, keychains, threshold }) {
  const isSegwit = !!segwit;
  let signatureThreshold = 2;
  if (_.isInteger(threshold)) {
    signatureThreshold = threshold;
    if (signatureThreshold <= 0) {
      throw new Error('threshold has to be positive');
    }
  }

  const pathRegex = /^\/1?[01]\/\d+$/;
  if (!path.match(pathRegex)) {
    throw new Error('unsupported path: ' + path);
  }

  let rootKeys = this.keychains;
  if (Array.isArray(keychains)) {
    rootKeys = keychains;
  }

  const network = common.Environments[this.bitgo.getEnv()].network;

  const derivedKeys = rootKeys.map(function (k) {
    const hdnode = bip32.fromBase58(k.xpub);
    const derivationPath = k.path + (k.walletSubPath || '') + path;
    return hdnode.derivePath(sanitizeLegacyPath(derivationPath)).publicKey;
  });

  const pathComponents = path.split('/');
  const normalizedPathComponents = _.map(pathComponents, (component) => {
    if (component && component.length > 0) {
      return parseInt(component, 10);
    }
  });
  const pathDetails = _.filter(normalizedPathComponents, _.isInteger);

  const addressDetails: any = {
    chainPath: path,
    path: path,
    chain: pathDetails[0],
    index: pathDetails[1],
    wallet: this.id(),
  };

  const {
    scriptPubKey: outputScript,
    redeemScript,
    witnessScript,
  } = utxolib.bitgo.outputScripts.createOutputScript2of3(derivedKeys, isSegwit ? 'p2shP2wsh' : 'p2sh');

  addressDetails.witnessScript = witnessScript?.toString('hex');
  addressDetails.redeemScript = redeemScript?.toString('hex');
  addressDetails.outputScript = outputScript.toString('hex');
  addressDetails.address = utxolib.address.fromOutputScript(outputScript, getNetwork(network));

  return addressDetails;
};

//
// validateAddress
// Validates an address and path by calculating it locally from the keychain xpubs
//
Wallet.prototype.validateAddress = function (params) {
  common.validateParams(params, ['address', 'path'], []);
  const isSegwit = !!params.witnessScript && params.witnessScript.length > 0;

  const generatedAddress = this.generateAddress({ path: params.path, segwit: isSegwit });
  if (generatedAddress.address !== params.address) {
    throw new Error('address validation failure: ' + params.address + ' vs. ' + generatedAddress.address);
  }
};

//
// addresses
// Gets the addresses of a HD wallet.
// Options include:
//  limit: the number of addresses to get
//
Wallet.prototype.addresses = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const query: any = {};
  if (params.details) {
    query.details = 1;
  }

  const chain = params.chain;
  if (chain !== null && chain !== undefined) {
    if (Array.isArray(chain)) {
      query.chain = _.uniq(_.filter(chain, _.isInteger));
    } else {
      if (chain !== 0 && chain !== 1) {
        throw new Error('invalid chain argument, expecting 0 or 1');
      }
      query.chain = chain;
    }
  }
  if (params.limit) {
    if (!_.isInteger(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    query.limit = params.limit;
  }
  if (params.skip) {
    if (!_.isInteger(params.skip)) {
      throw new Error('invalid skip argument, expecting number');
    }
    query.skip = params.skip;
  }
  if (params.sort) {
    if (!_.isNumber(params.sort)) {
      throw new Error('invalid sort argument, expecting number');
    }
    query.sort = params.sort;
  }

  const url = this.url('/addresses');
  return Bluebird.resolve(this.bitgo.get(url).query(query).result()).nodeify(callback);
};

Wallet.prototype.stats = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);
  const args: string[] = [];
  if (params.limit) {
    if (!_.isInteger(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    args.push('limit=' + params.limit);
  }
  let query = '';
  if (args.length) {
    query = '?' + args.join('&');
  }

  const url = this.url('/stats' + query);

  return Bluebird.resolve(this.bitgo.get(url).result()).nodeify(callback);
};

/**
 * Refresh the wallet object by syncing with the back-end
 * @param callback
 * @returns {Wallet}
 */
Wallet.prototype.refresh = function (params, callback) {
  return co(function* () {
    // when set to true, gpk returns the private data of safe wallets
    const query = _.extend({}, _.pick(params, ['gpk']));
    // @ts-expect-error - no implicit this
    const res = yield this.bitgo.get(this.url()).query(query).result();
    // @ts-expect-error - no implicit this
    this.wallet = res;
    // @ts-expect-error - no implicit this
    return this;
  })
    .call(this)
    .asCallback(callback);
};

//
// address
// Gets information about a single address on a HD wallet.
// Information includes index, path, redeemScript, sent, received, txCount and balance
// Options include:
//  address: the address on this wallet to get
//
Wallet.prototype.address = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  const url = this.url('/addresses/' + params.address);

  return Bluebird.resolve(this.bitgo.get(url).result()).nodeify(callback);
};

/**
 * Freeze the wallet for a duration of choice, stopping BitGo from signing any transactions.
 * @param {number} limit The duration to freeze the wallet for in seconds, defaults to 3600.
 */
Wallet.prototype.freeze = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  if (params.duration) {
    if (!_.isNumber(params.duration)) {
      throw new Error('invalid duration - should be number of seconds');
    }
  }

  return Bluebird.resolve(this.bitgo.post(this.url('/freeze')).send(params).result()).nodeify(callback);
};

//
// delete
// Deletes the wallet
//
Wallet.prototype.delete = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(this.bitgo.del(this.url()).result()).nodeify(callback);
};

//
// labels
// List the labels for the addresses in a given wallet
//
Wallet.prototype.labels = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const url = this.bitgo.url('/labels/' + this.id());

  return Bluebird.resolve(this.bitgo.get(url).result('labels')).nodeify(callback);
};

/**
 * Rename a wallet
 * @param params
 *  - label: the wallet's intended new name
 * @param callback
 * @returns {*}
 */
Wallet.prototype.setWalletName = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['label'], [], callback);

  const url = this.bitgo.url('/wallet/' + this.id());
  return Bluebird.resolve(this.bitgo.put(url).send({ label: params.label }).result()).nodeify(callback);
};

//
// setLabel
// Sets a label on the provided address
//
Wallet.prototype.setLabel = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['address', 'label'], [], callback);

  const self = this;

  if (!self.bitgo.verifyAddress({ address: params.address })) {
    throw new Error('Invalid bitcoin address: ' + params.address);
  }

  const url = this.bitgo.url('/labels/' + this.id() + '/' + params.address);

  return Bluebird.resolve(this.bitgo.put(url).send({ label: params.label }).result()).nodeify(callback);
};

//
// deleteLabel
// Deletes the label associated with the provided address
//
Wallet.prototype.deleteLabel = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  const self = this;

  if (!self.bitgo.verifyAddress({ address: params.address })) {
    throw new Error('Invalid bitcoin address: ' + params.address);
  }

  const url = this.bitgo.url('/labels/' + this.id() + '/' + params.address);

  return Bluebird.resolve(this.bitgo.del(url).result()).nodeify(callback);
};

//
// unspents
// List ALL the unspents for a given wallet
// This method will return a paged list of all unspents
//
// Parameters include:
//   limit:  the optional limit of unspents to collect in BTC
//   minConf: only include results with this number of confirmations
//   target: the amount of btc to find to spend
//   instant: only find instant transactions (must specify a target)
//
Wallet.prototype.unspents = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const allUnspents: any[] = [];
  const self = this;

  const getUnspentsBatch = function (skip, limit?) {
    const queryObject = _.cloneDeep(params);
    if (skip > 0) {
      queryObject.skip = skip;
    }
    if (limit && limit > 0) {
      queryObject.limit = limit;
    }

    return self.unspentsPaged(queryObject).then(function (result) {
      // The API has its own limit handling. For example, the API does not support limits bigger than 500. If the limit
      // specified here is bigger than that, we will have to do multiple requests with necessary limit adjustment.
      for (let i = 0; i < result.unspents.length; i++) {
        const unspent = result.unspents[i];
        allUnspents.push(unspent);
      }

      // Our limit adjustment makes sure that we never fetch more unspents than we need, meaning that if we hit the
      // limit, we hit it precisely
      if (allUnspents.length >= params.limit) {
        return allUnspents; // we aren't interested in any further unspents
      }

      const totalUnspentCount = result.total;
      // if no target is specified and the SDK indicates that there has been a limit, we need to fetch another batch
      if (!params.target && totalUnspentCount && totalUnspentCount > allUnspents.length) {
        // we need to fetch the next batch
        // let's just offset the current skip by the count
        const newSkip = skip + result.count;
        let newLimit: number | undefined;
        if (limit > 0) {
          // we set the new limit to be precisely the number of missing unspents to hit our own limit
          newLimit = limit - allUnspents.length;
        }
        return getUnspentsBatch(newSkip, newLimit);
      }

      return allUnspents;
    });
  };

  return getUnspentsBatch(0, params.limit).nodeify(callback);
};

/**
 * List the unspents (paged) for a given wallet, returning the result as an object of unspents, count, skip and total
 * This method may not return all the unspents as the list is paged by the API
 * @param params
 * @param params.limit the optional limit of unspents to collect in BTC
 * @param params.skip index in list of unspents to start paging from
 * @param params.minConfirms only include results with this number of confirmations
 * @param params.target the amount of btc to find to spend
 * @param params.instant only find instant transactions (must specify a target)
 * @param params.targetWalletUnspents desired number of unspents to have in the wallet after the tx goes through (requires target)
 * @param params.minSize minimum unspent size in satoshis
 * @param params.segwit request segwit unspents (defaults to true if undefined)
 * @param params.allowLedgerSegwit allow segwit unspents for ledger devices (defaults to false if undefined)
 * @param callback
 * @returns {*}
 */
Wallet.prototype.unspentsPaged = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  if (!_.isUndefined(params.limit) && !_.isInteger(params.limit)) {
    throw new Error('invalid limit - should be number');
  }
  if (!_.isUndefined(params.skip) && !_.isInteger(params.skip)) {
    throw new Error('invalid skip - should be number');
  }
  if (!_.isUndefined(params.minConfirms) && !_.isInteger(params.minConfirms)) {
    throw new Error('invalid minConfirms - should be number');
  }
  if (!_.isUndefined(params.target) && !_.isNumber(params.target)) {
    throw new Error('invalid target - should be number');
  }
  if (!_.isUndefined(params.instant) && !_.isBoolean(params.instant)) {
    throw new Error('invalid instant flag - should be boolean');
  }
  if (!_.isUndefined(params.segwit) && !_.isBoolean(params.segwit)) {
    throw new Error('invalid segwit flag - should be boolean');
  }
  if (!_.isUndefined(params.targetWalletUnspents) && !_.isInteger(params.targetWalletUnspents)) {
    throw new Error('invalid targetWalletUnspents flag - should be number');
  }
  if (!_.isUndefined(params.minSize) && !_.isNumber(params.minSize)) {
    throw new Error('invalid argument: minSize must be a number');
  }
  if (!_.isUndefined(params.instant) && !_.isUndefined(params.minConfirms)) {
    throw new Error('only one of instant and minConfirms may be defined');
  }
  if (!_.isUndefined(params.targetWalletUnspents) && _.isUndefined(params.target)) {
    throw new Error('targetWalletUnspents can only be specified in conjunction with a target');
  }
  if (!_.isUndefined(params.allowLedgerSegwit) && !_.isBoolean(params.allowLedgerSegwit)) {
    throw new Error('invalid argument: allowLedgerSegwit must be a boolean');
  }

  const queryObject = _.cloneDeep(params);

  if (!_.isUndefined(params.target)) {
    // skip and limit are unavailable when a target is specified
    delete queryObject.skip;
    delete queryObject.limit;
  }

  queryObject.segwit = true;
  if (!_.isUndefined(params.segwit)) {
    queryObject.segwit = params.segwit;
  }

  if (!_.isUndefined(params.allowLedgerSegwit)) {
    queryObject.allowLedgerSegwit = params.allowLedgerSegwit;
  }

  return Bluebird.resolve(this.bitgo.get(this.url('/unspents')).query(queryObject).result()).nodeify(callback);
};

//
// transactions
// List the transactions for a given wallet
// Options include:
//     TODO:  Add iterators for start/count/etc
Wallet.prototype.transactions = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const args: string[] = [];
  if (params.limit) {
    if (!_.isInteger(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    args.push('limit=' + params.limit);
  }
  if (params.skip) {
    if (!_.isInteger(params.skip)) {
      throw new Error('invalid skip argument, expecting number');
    }
    args.push('skip=' + params.skip);
  }
  if (params.minHeight) {
    if (!_.isInteger(params.minHeight)) {
      throw new Error('invalid minHeight argument, expecting number');
    }
    args.push('minHeight=' + params.minHeight);
  }
  if (params.maxHeight) {
    if (!_.isInteger(params.maxHeight) || params.maxHeight < 0) {
      throw new Error('invalid maxHeight argument, expecting positive integer');
    }
    args.push('maxHeight=' + params.maxHeight);
  }
  if (params.minConfirms) {
    if (!_.isInteger(params.minConfirms) || params.minConfirms < 0) {
      throw new Error('invalid minConfirms argument, expecting positive integer');
    }
    args.push('minConfirms=' + params.minConfirms);
  }
  if (!_.isUndefined(params.compact)) {
    if (!_.isBoolean(params.compact)) {
      throw new Error('invalid compact argument, expecting boolean');
    }
    args.push('compact=' + params.compact);
  }
  let query = '';
  if (args.length) {
    query = '?' + args.join('&');
  }

  const url = this.url('/tx' + query);

  return Bluebird.resolve(this.bitgo.get(url).result()).nodeify(callback);
};

//
// transaction
// Get a transaction by ID for a given wallet
Wallet.prototype.getTransaction = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  const url = this.url('/tx/' + params.id);

  return Bluebird.resolve(this.bitgo.get(url).result()).nodeify(callback);
};

//
// pollForTransaction
// Poll a transaction until successful or times out
// Parameters:
//   id: the txid
//   delay: delay between polls in ms (default: 1000)
//   timeout: timeout in ms (default: 10000)
Wallet.prototype.pollForTransaction = function (params, callback) {
  const self = this;
  params = params || {};
  common.validateParams(params, ['id'], [], callback);
  if (params.delay && !_.isNumber(params.delay)) {
    throw new Error('invalid delay parameter');
  }
  if (params.timeout && !_.isNumber(params.timeout)) {
    throw new Error('invalid timeout parameter');
  }
  params.delay = params.delay || 1000;
  params.timeout = params.timeout || 10000;

  const start = new Date();

  const doNextPoll = function () {
    return self
      .getTransaction(params)
      .then(function (res) {
        return res;
      })
      .catch(function (err) {
        if (err.status !== 404 || new Date().valueOf() - start.valueOf() > params.timeout) {
          throw err;
        }
        return Bluebird.delay(params.delay).then(function () {
          return doNextPoll();
        });
      });
  };

  return doNextPoll();
};

//
// transaction by sequence id
// Get a transaction by sequence id for a given wallet
Wallet.prototype.getWalletTransactionBySequenceId = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['sequenceId'], [], callback);

  const url = this.url('/tx/sequence/' + params.sequenceId);

  return Bluebird.resolve(this.bitgo.get(url).result()).nodeify(callback);
};

//
// Key chains
// Gets the user key chain for this wallet
// The user key chain is typically the first keychain of the wallet and has the encrypted xpriv stored on BitGo.
// Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
Wallet.prototype.getEncryptedUserKeychain = function (params, callback) {
  return co(function* () {
    params = params || {};
    common.validateParams(params, [], [], callback);
    // @ts-expect-error - no implicit this
    const self = this;

    const tryKeyChain = co(function* (index) {
      if (!self.keychains || index >= self.keychains.length) {
        const error: any = new Error('No encrypted keychains on this wallet.');
        error.code = 'no_encrypted_keychain_on_wallet';
        throw error;
      }

      const params = { xpub: self.keychains[index].xpub };

      const keychain = yield self.bitgo.keychains().get(params);
      // If we find the xprv, then this is probably the user keychain we're looking for
      keychain.walletSubPath = self.keychains[index].path;
      if (keychain.encryptedXprv) {
        return keychain;
      }
      return tryKeyChain(index + 1);
    });

    return tryKeyChain(0);
  })
    .call(this)
    .asCallback(callback);
};

//
// createTransaction
// Create a transaction (unsigned). To sign it, do signTransaction
// Parameters:
//   recipients - object of recipient addresses and the amount to send to each e.g. {address:1500, address2:1500}
//   fee      - the blockchain fee to send (optional)
//   feeRate  - the fee per kb to send (optional)
//   minConfirms - minimum number of confirms to use when gathering unspents
//   forceChangeAtEnd - force change address to be last output (optional)
//   noSplitChange - disable automatic change splitting for purposes of unspent management
//   changeAddress - override the change address (optional)
//   validate - extra verification of change addresses (which are always verified server-side) (defaults to global config)
// Returns:
//   callback(err, { transactionHex: string, unspents: [inputs], fee: satoshis })
Wallet.prototype.createTransaction = function (params, callback) {
  params = _.extend({}, params);
  common.validateParams(params, [], [], callback);

  if (
    (!_.isNumber(params.fee) && !_.isUndefined(params.fee)) ||
    (!_.isNumber(params.feeRate) && !_.isUndefined(params.feeRate)) ||
    (!_.isNumber(params.minConfirms) && !_.isUndefined(params.minConfirms)) ||
    (!_.isBoolean(params.forceChangeAtEnd) && !_.isUndefined(params.forceChangeAtEnd)) ||
    (!_.isString(params.changeAddress) && !_.isUndefined(params.changeAddress)) ||
    (!_.isBoolean(params.validate) && !_.isUndefined(params.validate)) ||
    (!_.isBoolean(params.instant) && !_.isUndefined(params.instant))
  ) {
    throw new Error('invalid argument');
  }

  if (!_.isObject(params.recipients)) {
    throw new Error('expecting recipients object');
  }

  params.validate = params.validate !== undefined ? params.validate : this.bitgo.getValidate();
  params.wallet = this;

  return TransactionBuilder.createTransaction(params).nodeify(callback);
};

//
// signTransaction
// Sign a previously created transaction with a keychain
// Parameters:
// transactionHex - serialized form of the transaction in hex
// unspents - array of unspent information, where each unspent is a chainPath
//            and redeemScript with the same index as the inputs in the
//            transactionHex
// keychain - Keychain containing the xprv to sign with.
// signingKey - For legacy safe wallets, the private key string.
// validate - extra verification of signatures (which are always verified server-side) (defaults to global config)
// Returns:
//   callback(err, transaction)
Wallet.prototype.signTransaction = function (params, callback) {
  params = _.extend({}, params);
  common.validateParams(params, ['transactionHex'], [], callback);

  if (!Array.isArray(params.unspents)) {
    throw new Error('expecting the unspents array');
  }

  if ((!_.isObject(params.keychain) || !params.keychain.xprv) && !_.isString(params.signingKey)) {
    // allow passing in a WIF private key for legacy safe wallet support
    const error: any = new Error('expecting keychain object with xprv or signingKey WIF');
    error.code = 'missing_keychain_or_signingKey';
    throw error;
  }

  params.validate = params.validate !== undefined ? params.validate : this.bitgo.getValidate();
  params.bitgo = this.bitgo;
  return TransactionBuilder.signTransaction(params)
    .then(function (result) {
      return {
        tx: result.transactionHex,
      };
    })
    .nodeify(callback);
};

//
// send
// Send a transaction to the Bitcoin network via BitGo.
// One of the keys is typically signed, and BitGo will sign the other (if approved) and relay it to the P2P network.
// Parameters:
//   tx  - the hex encoded, signed transaction to send
// Returns:
//
Wallet.prototype.sendTransaction = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['tx'], ['message', 'otp'], callback);

  return Bluebird.resolve(this.bitgo.post(this.bitgo.url('/tx/send')).send(params).result())
    .then(function (body) {
      if (body.pendingApproval) {
        return _.extend(body, { status: 'pendingApproval' });
      }

      if (body.otp) {
        return _.extend(body, { status: 'otp' });
      }

      return {
        status: 'accepted',
        tx: body.transaction,
        hash: body.transactionHash,
        instant: body.instant,
        instantId: body.instantId,
      };
    })
    .nodeify(callback);
};

/**
 * Share the wallet with an existing BitGo user.
 * @param {string} user The recipient's user id, must have a corresponding user record in our database.
 * @param {keychain} keychain The keychain to be shared with the recipient.
 * @param {string} permissions A comma-separated value string that specifies the recipient's permissions if the share is accepted.
 * @param {string} message The message to be used for this share.
 */
Wallet.prototype.createShare = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['user', 'permissions'], [], callback);

  if (params.keychain && !_.isEmpty(params.keychain)) {
    if (
      !params.keychain.xpub ||
      !params.keychain.encryptedXprv ||
      !params.keychain.fromPubKey ||
      !params.keychain.toPubKey ||
      !params.keychain.path
    ) {
      throw new Error('requires keychain parameters - xpub, encryptedXprv, fromPubKey, toPubKey, path');
    }
  }

  return Bluebird.resolve(this.bitgo.post(this.url('/share')).send(params).result()).nodeify(callback);
};

//
// createInvite
// invite a non BitGo customer to join a wallet
// Parameters:
//   email - the recipient's email address
//   permissions - the recipient's permissions if the share is accepted
// Returns:
//
Wallet.prototype.createInvite = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['email', 'permissions'], ['message'], callback);

  const options: any = {
    toEmail: params.email,
    permissions: params.permissions,
  };

  if (params.message) {
    options.message = params.message;
  }

  return Bluebird.resolve(this.bitgo.post(this.url('/invite')).send(options).result()).nodeify(callback);
};

//
// confirmInviteAndShareWallet
// confirm my invite on this wallet to a recipient who has
// subsequently signed up by creating the actual wallet share
// Parameters:
//   walletInviteId - the wallet invite id
//   walletPassphrase - required if the wallet share success is expected
// Returns:
//
Wallet.prototype.confirmInviteAndShareWallet = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['walletInviteId'], ['walletPassphrase'], callback);

  const self = this;
  return this.bitgo
    .wallets()
    .listInvites()
    .then(function (invites) {
      const outgoing = invites.outgoing;
      const invite = _.find(outgoing, function (out) {
        return out.id === params.walletInviteId;
      });
      if (!invite) {
        throw new Error('wallet invite not found');
      }

      const options = {
        email: invite.toEmail,
        permissions: invite.permissions,
        message: invite.message,
        walletPassphrase: params.walletPassphrase,
      };

      return self.shareWallet(options);
    })
    .then(function () {
      // @ts-expect-error - no implicit this
      return this.bitgo.put(this.bitgo.url('/walletinvite/' + params.walletInviteId));
    })
    .nodeify(callback);
};

//
// sendCoins
// Send coins to a destination address from this wallet using the user key.
// 1. Gets the user keychain by checking the wallet for a key which has an encrypted xpriv
// 2. Decrypts user key
// 3. Creates the transaction with default fee
// 4. Signs transaction with decrypted user key
// 3. Sends the transaction to BitGo
//
// Parameters:
//   address - the destination address
//   amount - the amount in satoshis to be sent
//   message - optional message to attach to transaction
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
//   xprv - the private key in string form, if walletPassphrase is not available
//   (See transactionBuilder.createTransaction for other passthrough params)
// Returns:
//
Wallet.prototype.sendCoins = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], ['message'], callback);

  if (!_.isNumber(params.amount)) {
    throw new Error('invalid argument for amount - number expected');
  }

  params.recipients = {};
  params.recipients[params.address] = params.amount;

  return this.sendMany(params).nodeify(callback);
};

//
// sendMany
// Send coins to multiple destination addresses from this wallet using the user key.
// 1. Gets the user keychain by checking the wallet for a key which has an encrypted xpriv
// 2. Decrypts user key
// 3. Creates the transaction with default fee
// 4. Signs transaction with decrypted user key
// 3. Sends the transaction to BitGo
//
// Parameters:
//   recipients - array of { address: string, amount: number, travelInfo: object } to send to
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
//   xprv - the private key in string form, if walletPassphrase is not available
//   (See transactionBuilder.createTransaction for other passthrough params)
// Returns:
//
Wallet.prototype.sendMany = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], ['message', 'otp'], callback);
  const self = this;

  if (!_.isObject(params.recipients)) {
    throw new Error('expecting recipients object');
  }

  if (params.fee && !_.isNumber(params.fee)) {
    throw new Error('invalid argument for fee - number expected');
  }

  if (params.feeRate && !_.isNumber(params.feeRate)) {
    throw new Error('invalid argument for feeRate - number expected');
  }

  if (params.instant && !_.isBoolean(params.instant)) {
    throw new Error('invalid argument for instant - boolean expected');
  }

  let bitgoFee;
  let travelInfos;
  let finalResult;
  let unspentsUsed;

  const acceptedBuildParams = [
    'numBlocks',
    'feeRate',
    'minConfirms',
    'enforceMinConfirmsForChange',
    'targetWalletUnspents',
    'message',
    'minValue',
    'maxValue',
    'noSplitChange',
    'comment',
  ];
  const preservedBuildParams = _.pick(params, acceptedBuildParams);

  // Get the user keychain
  const retPromise = this.createAndSignTransaction(params)
    .then(function (transaction) {
      // Send the transaction
      bitgoFee = transaction.bitgoFee;
      travelInfos = transaction.travelInfos;
      unspentsUsed = transaction.unspents;
      return self.sendTransaction({
        tx: transaction.tx,
        message: params.message,
        sequenceId: params.sequenceId,
        instant: params.instant,
        otp: params.otp,
        // The below params are for logging only, and do not impact the API call
        estimatedSize: transaction.estimatedSize,
        buildParams: preservedBuildParams,
      });
    })
    .then(function (result) {
      const tx = utxolib.bitgo.createTransactionFromHex(result.tx, utxolib.networks.bitcoin);
      const inputsSum = _.sumBy(unspentsUsed, 'value');
      const outputsSum = _.sumBy(tx.outs, 'value');
      const feeUsed = inputsSum - outputsSum;
      if (isNaN(feeUsed)) {
        throw new Error('invalid feeUsed');
      }
      (result.fee = feeUsed), (result.feeRate = (feeUsed * 1000) / tx.virtualSize());
      result.travelInfos = travelInfos;
      if (bitgoFee) {
        result.bitgoFee = bitgoFee;
      }
      finalResult = result;

      // Handle sending travel infos if they exist, but make sure we never fail here.
      // Error or result (with possible sub-errors) will be provided in travelResult
      if (travelInfos && travelInfos.length) {
        try {
          return self
            .pollForTransaction({ id: result.hash })
            .then(function () {
              return self.bitgo.travelRule().sendMany(result);
            })
            .then(function (res) {
              finalResult.travelResult = res;
            })
            .catch(function (err) {
              // catch async errors
              finalResult.travelResult = { error: err.message };
            });
        } catch (err) {
          // catch synchronous errors
          finalResult.travelResult = { error: err.message };
        }
      }
    })
    .then(function () {
      return finalResult;
    });
  return Bluebird.resolve(retPromise).nodeify(callback);
};

/**
 * Accelerate a stuck transaction using Child-Pays-For-Parent (CPFP).
 *
 * This should only be used for stuck transactions which have no unconfirmed inputs.
 *
 * @param {Object} params - Input parameters
 * @param {String} params.transactionID - ID of transaction to accelerate
 * @param {Number} params.feeRate - New effective fee rate for stuck transaction (sat per 1000 bytes)
 * @param {Number} params.maxAdditionalUnspents - Maximum additional unspents to use from the wallet to cover any child fees that the parent unspent output cannot cover. Defaults to 100.
 * @param {String} params.walletPassphrase - The passphrase which should be used to decrypt the wallet private key. One of either walletPassphrase or xprv is required.
 * @param {String} params.xprv - The private key for the wallet. One of either walletPassphrase or xprv is required.
 * @param {Function} callback
 * @returns Result of sendTransaction() on the child transaction
 */
Wallet.prototype.accelerateTransaction = function accelerateTransaction(params, callback) {
  const self = this;
  /**
   * Helper function to estimate a transactions size in virtual bytes.
   * Actual transactions may be slightly fewer virtual bytes, due to
   * the fact that valid ECSDA signatures have a variable length
   * between 8 and 73 virtual bytes.
   *
   * @param inputs.segwit The number of segwit inputs to the transaction
   * @param inputs.P2SH The number of P2SH inputs to the transaction
   * @param inputs.P2PKH The number of P2PKH inputs to the transaction
   */
  const estimateTxVSize = (inputs) => {
    const segwit = inputs.segwit || 0;
    const P2SH = inputs.P2SH || 0;
    const P2PKH = inputs.P2PKH || 0;

    const childFeeInfo = TransactionBuilder.calculateMinerFeeInfo({
      nP2shInputs: P2SH,
      nP2pkhInputs: P2PKH,
      nP2shP2wshInputs: segwit,
      nOutputs: 1,
      feeRate: 1,
    });

    return childFeeInfo.size;
  };

  /**
   * Calculate the number of satoshis that should be paid in fees by the child transaction
   *
   * @param inputs Inputs to the child transaction which are passed to estimateTxVSize
   * @param parentFee The number of satoshis the parent tx originally paid in fees
   * @param parentVSize The number of virtual bytes in the parent tx
   * @param feeRate The new fee rate which should be paid by the combined CPFP transaction
   * @returns {number} The number of satoshis the child tx should pay in fees
   */
  const estimateChildFee = ({ inputs, parentFee, parentVSize, feeRate }) => {
    // calculate how much more we *should* have paid in parent fees,
    // had the parent been originally sent with the new fee rate
    const additionalParentFee = _.ceil((parentVSize * feeRate) / 1000) - parentFee;

    // calculate how much we would pay in fees for the child,
    // if it were only paying for itself at the new fee rate
    const childFee = (estimateTxVSize(inputs) * feeRate) / 1000;

    return _.ceil(childFee + additionalParentFee);
  };

  /**
   * Helper function to find additional unspents to use to pay the child tx fees.
   * This function is called when the the parent tx output is not sufficient to
   * cover the total fees which should be paid by the child tx.
   *
   * @param inputs Inputs to the child transaction which are passed to estimateTxVSize
   * @param parentOutputValue The value of the output from the parent tx which we are using as an input to the child tx
   * @param parentFee The number of satoshis the parent tx originally paid in fees
   * @param parentVSize The number of virtual bytes in the parent tx
   * @param maxUnspents The maximum number of additional unspents which should be used to cover the remaining child fees
   * @returns An object with the additional unspents to use, the updated number of satoshis which should be paid by
   *          the child tx, and the updated inputs for the child tx.
   */
  const findAdditionalUnspents = ({ inputs, parentOutputValue, parentFee, parentVSize, maxUnspents }) => {
    return co(function* coFindAdditionalUnspents() {
      const additionalUnspents: any[] = [];

      // ask the server for enough unspents to cover the child fee, assuming
      // that it can be done without additional unspents (which is not possible,
      // since if that were the case, findAdditionalUnspents would not have been
      // called in the first place. This will be corrected before returning)
      let currentChildFeeEstimate = estimateChildFee({ inputs, parentFee, parentVSize, feeRate: params.feeRate });
      let uncoveredChildFee = currentChildFeeEstimate - parentOutputValue;

      while (uncoveredChildFee > 0 && additionalUnspents.length < maxUnspents) {
        // try to get enough unspents to cover the rest of the child fee
        // @ts-expect-error - no implicit this
        const unspents = (yield this.unspents({
          minConfirms: 1,
          target: uncoveredChildFee,
          limit: maxUnspents - additionalUnspents.length,
        })) as any;

        if (unspents.length === 0) {
          // no more unspents are available
          break;
        }

        let additionalUnspentValue = 0;

        // consume all unspents returned by the server, even if we don't need
        // all of them to cover the child fee. This is because the server will
        // return enough unspent value to ensure that the minimum change amount
        // is achieved for the child tx, and we can't leave out those unspents
        // or else the minimum change amount constraint could be violated
        _.forEach(unspents, (unspent) => {
          // update the child tx inputs
          const unspentChain = getChain(unspent);
          if (isChainCode(unspentChain) && scriptTypeForChain(unspentChain) === 'p2shP2wsh') {
            inputs.segwit++;
          } else {
            inputs.P2SH++;
          }

          additionalUnspents.push(unspent);
          additionalUnspentValue += unspent.value;
        });

        currentChildFeeEstimate = estimateChildFee({ inputs, parentFee, parentVSize, feeRate: params.feeRate });
        uncoveredChildFee = currentChildFeeEstimate - parentOutputValue - additionalUnspentValue;
      }

      if (uncoveredChildFee > 0) {
        // Unable to find enough unspents to cover the child fee
        throw new Error(`Insufficient confirmed unspents available to cover the child fee`);
      }

      // found enough unspents
      return {
        additional: additionalUnspents,
        newChildFee: currentChildFeeEstimate,
        newInputs: inputs,
      };
    }).call(this);
  };

  /**
   * Helper function to get a full copy (including witness data) of an arbitrary tx using only the tx id.
   *
   * We have to use an external service for this (currently blockstream.info), since
   * the v1 indexer service (based on bitcoinj) does not have segwit support and
   * does not return any segwit related fields in the tx hex.
   *
   * @param parentTxId The ID of the transaction to get the full hex of
   * @returns {Bluebird<any>} The full hex for the specified transaction
   */
  async function getParentTxHex({ parentTxId }: { parentTxId: string }): Promise<string> {
    const explorerBaseUrl = common.Environments[self.bitgo.getEnv()].btcExplorerBaseUrl;
    const result = await request.get(`${explorerBaseUrl}/tx/${parentTxId}/hex`);

    if (!result.text || !/([a-f0-9]{2})+/.test(result.text)) {
      throw new Error(
        `Did not successfully receive parent tx hex. Received '${_.truncate(result.text, { length: 100 })}' instead.`
      );
    }

    return result.text;
  }

  /**
   * Helper function to get the chain from an unspent or tx output.
   *
   * @param outputOrUnspent The output or unspent whose chain should be determined
   * @returns {number} The chain for the given output or unspent
   */
  const getChain = (outputOrUnspent) => {
    if (outputOrUnspent.chain !== undefined) {
      return outputOrUnspent.chain;
    }

    if (outputOrUnspent.chainPath !== undefined) {
      return _.toNumber(outputOrUnspent.chainPath.split('/')[1]);
    }

    // no way to tell the chain, let's just blow up now instead
    // of blowing up later when the undefined return value is used.
    // Note: for unspents the field to use is 'address', but for outputs
    // the field to use is 'account'
    throw Error(`Could not get chain for output on account ${outputOrUnspent.account || outputOrUnspent.address}`);
  };

  /**
   * Helper function to calculate the actual value contribution an output or unspent will
   * contribute to a transaction, were it to be used. Each type of output or unspent
   * will have a different value contribution since each type has a different number
   * of virtual bytes, and thus will cause a different fee to be paid.
   *
   * @param outputOrUnspent Output or unspent whose effective value should be determined
   * @returns {number} The actual number of satoshis that this unspent or output
   *                   would contribute to a transaction, were it to be used.
   */
  const effectiveValue = (outputOrUnspent) => {
    const chain = getChain(outputOrUnspent);
    if (isChainCode(chain) && scriptTypeForChain(chain) === 'p2shP2wsh') {
      // VirtualSizes.txP2shP2wshInputSize is in bytes, so we need to convert to kB
      return outputOrUnspent.value - (VirtualSizes.txP2shP2wshInputSize * params.feeRate) / 1000;
    }
    // VirtualSizes.txP2shInputSize is in bytes, so we need to convert to kB
    return outputOrUnspent.value - (VirtualSizes.txP2shInputSize * params.feeRate) / 1000;
  };

  /**
   * Coroutine which actually implements the accelerateTransaction algorithm
   *
   * Described at a high level, the algorithm is as follows:
   * 1) Find appropriate output from parent transaction to use as child transaction input
   * 2) Find unspent corresponding to parent transaction output. If not found, return to step 1.
   * 3) Determine if parent transaction unspent can cover entire child fee, plus minimum change
   * 4) If yes, go to step 6
   * 5) Otherwise, find additional unspents from the wallet to use to cover the remaining child fee
   * 6) Create and sign the child transaction, using the parent transaction output
   *    (and, if necessary, additional wallet unspents) as inputs
   * 7) Broadcast the new child transaction
   */
  return co(function* coAccelerateTransaction(): any {
    params = params || {};
    common.validateParams(params, ['transactionID'], [], callback);

    // validate fee rate
    if (params.feeRate === undefined) {
      throw new Error('Missing parameter: feeRate');
    }
    if (!_.isFinite(params.feeRate) || params.feeRate <= 0) {
      throw new Error('Expecting positive finite number for parameter: feeRate');
    }

    // validate maxUnspents
    if (params.maxAdditionalUnspents === undefined) {
      // by default, use at most 100 additional unspents (not including the unspent output from the parent tx)
      params.maxAdditionalUnspents = 100;
    }

    if (!_.isInteger(params.maxAdditionalUnspents) || params.maxAdditionalUnspents <= 0) {
      throw Error('Expecting positive integer for parameter: maxAdditionalUnspents');
    }

    // @ts-expect-error - no implicit this
    const parentTx = yield this.getTransaction({ id: params.transactionID });
    if (parentTx.confirmations > 0) {
      throw new Error(`Transaction ${params.transactionID} is already confirmed and cannot be accelerated`);
    }

    // get the outputs from the parent tx which are to our wallet
    const walletOutputs = _.filter(parentTx.outputs, (output) => output.isMine);

    if (walletOutputs.length === 0) {
      throw new Error(
        `Transaction ${params.transactionID} contains no outputs to this wallet, and thus cannot be accelerated`
      );
    }

    // use an output from the parent with largest effective value,
    // but check to make sure the output is actually unspent.
    // An output could be spent already if the output was used in a
    // child tx which itself has become stuck due to low fees and is
    // also unconfirmed.
    const sortedOutputs = _.sortBy(walletOutputs, effectiveValue);
    let parentUnspentToUse;
    let outputToUse;

    while (sortedOutputs.length > 0 && parentUnspentToUse === undefined) {
      outputToUse = sortedOutputs.pop();

      // find the unspent corresponding to this particular output
      // TODO: is there a better way to get this unspent?
      // TODO: The best we can do here is set minSize = maxSize = outputToUse.value
      // @ts-expect-error - no implicit this
      const unspentsResult = yield this.unspents({
        minSize: outputToUse.value,
        maxSize: outputToUse.value,
      });

      parentUnspentToUse = _.find(unspentsResult, (unspent) => {
        // make sure unspent belongs to the given txid
        if (unspent.tx_hash !== params.transactionID) {
          return false;
        }
        // make sure unspent has correct v_out index
        return unspent.tx_output_n === outputToUse.vout;
      });
    }

    if (parentUnspentToUse === undefined) {
      throw new Error(`Could not find unspent output from parent tx to use as child input`);
    }

    // get the full hex for the parent tx and decode it to get its vsize
    const parentTxHex = yield getParentTxHex({ parentTxId: params.transactionID });
    const decodedParent = utxolib.bitgo.createTransactionFromHex(parentTxHex, utxolib.networks.bitcoin);
    const parentVSize = decodedParent.virtualSize();

    // make sure id from decoded tx and given tx id match
    // this should catch problems emanating from the use of an external service
    // for getting the complete parent tx hex
    if (decodedParent.getId() !== params.transactionID) {
      throw new Error(
        `Decoded transaction id is ${decodedParent.getId()}, which does not match given txid ${params.transactionID}`
      );
    }

    // make sure new fee rate is greater than the parent's current fee rate
    // virtualSize is returned in vbytes, so we need to convert to kvB
    const parentRate = (1000 * parentTx.fee) / parentVSize;
    if (params.feeRate <= parentRate) {
      throw new Error(
        `Cannot lower fee rate! (Parent tx fee rate is ${parentRate} sat/kB, and requested fee rate was ${params.feeRate} sat/kB)`
      );
    }

    // determine if parent output can cover child fee
    const isParentOutputSegwit =
      isChainCode(outputToUse.chain) && scriptTypeForChain(outputToUse.chain) === 'p2shP2wsh';

    let childInputs = {
      segwit: isParentOutputSegwit ? 1 : 0,
      P2SH: isParentOutputSegwit ? 0 : 1,
    };

    let childFee = estimateChildFee({
      inputs: childInputs,
      parentFee: parentTx.fee,
      feeRate: params.feeRate,
      parentVSize,
    });

    const unspentsToUse = [parentUnspentToUse];

    // try to get the min change size from the server, otherwise default to 0.1 BTC
    // TODO: minChangeSize is not currently a constant defined on the client and should be added
    // @ts-expect-error - no implicit this
    const minChangeSize = this.bitgo.getConstants().minChangeSize || 1e7;

    if (outputToUse.value < childFee + minChangeSize) {
      // parent output cannot cover child fee plus the minimum change,
      // must find additional unspents to cover the difference
      const { additional, newChildFee, newInputs } = yield findAdditionalUnspents({
        inputs: childInputs,
        parentOutputValue: outputToUse.value,
        parentFee: parentTx.fee,
        maxUnspents: params.maxAdditionalUnspents,
        parentVSize,
      });
      childFee = newChildFee;
      childInputs = newInputs;
      unspentsToUse.push(...additional);
    }

    // sanity check the fee rate we're paying for the combined tx
    // to make sure it's under the max fee rate. Only the child tx
    // can break this limit, but the combined tx shall not
    // @ts-expect-error - no implicit this
    const maxFeeRate = this.bitgo.getConstants().maxFeeRate;
    const childVSize = estimateTxVSize(childInputs);
    const combinedVSize = childVSize + parentVSize;
    const combinedFee = parentTx.fee + childFee;
    // combined fee rate must be in sat/kB, so we need to convert
    const combinedFeeRate = (1000 * combinedFee) / combinedVSize;

    if (combinedFeeRate > maxFeeRate) {
      throw new Error(
        `Transaction cannot be accelerated. Combined fee rate of ${combinedFeeRate} sat/kB exceeds maximum fee rate of ${maxFeeRate} sat/kB`
      );
    }

    // create a new change address and determine change amount.
    // the tx builder will reject transactions which have no recipients,
    // and such zero-output transactions are forbidden by the Bitcoin protocol,
    // so we need at least a single recipient for the change which won't be pruned.
    const changeAmount = _.sumBy(unspentsToUse, (unspent) => unspent.value) - childFee;
    // @ts-expect-error - no implicit this
    const changeChain = this.getChangeChain({});
    // @ts-expect-error - no implicit this
    const changeAddress = yield this.createAddress({ chain: changeChain });

    // create the child tx and broadcast
    // @ts-expect-error - no implicit this
    const tx = yield this.createAndSignTransaction({
      unspents: unspentsToUse,
      recipients: [
        {
          address: changeAddress.address,
          amount: changeAmount,
        },
      ],
      fee: childFee,
      bitgoFee: {
        amount: 0,
        address: '',
      },
      xprv: params.xprv,
      walletPassphrase: params.walletPassphrase,
    });

    // child fee rate must be in sat/kB, so we need to convert
    const childFeeRate = (1000 * childFee) / childVSize;
    if (childFeeRate > maxFeeRate) {
      // combined tx is within max fee rate limits, but the child tx is not.
      // in this case, we need to use the ignoreMaxFeeRate flag to get the child tx to be accepted
      tx.ignoreMaxFeeRate = true;
    }

    // @ts-expect-error - no implicit this
    return this.sendTransaction(tx);
  })
    .call(this)
    .asCallback(callback);
};

//
// createAndSignTransaction
// INTERNAL function to create and sign a transaction
//
// Parameters:
//   recipients - array of { address, amount } to send to
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
//   (See transactionBuilder.createTransaction for other passthrough params)
// Returns:
//
Wallet.prototype.createAndSignTransaction = function (params, callback) {
  return co(function* () {
    params = params || {};
    common.validateParams(params, [], [], callback);

    if (!_.isObject(params.recipients)) {
      throw new Error('expecting recipients object');
    }

    if (params.fee && !_.isNumber(params.fee)) {
      throw new Error('invalid argument for fee - number expected');
    }

    if (params.feeRate && !_.isNumber(params.feeRate)) {
      throw new Error('invalid argument for feeRate - number expected');
    }

    if (params.dynamicFeeConfirmTarget && !_.isNumber(params.dynamicFeeConfirmTarget)) {
      throw new Error('invalid argument for confirmTarget - number expected');
    }

    if (params.instant && !_.isBoolean(params.instant)) {
      throw new Error('invalid argument for instant - boolean expected');
    }

    // @ts-expect-error - no implicit this
    const transaction = (yield this.createTransaction(params)) as any;
    const fee = transaction.fee;
    const feeRate = transaction.feeRate;
    const estimatedSize = transaction.estimatedSize;
    const bitgoFee = transaction.bitgoFee;
    const travelInfos = transaction.travelInfos;
    const unspents = transaction.unspents;

    // Sign the transaction
    try {
      // @ts-expect-error - no implicit this
      const keychain = yield this.getAndPrepareSigningKeychain(params);
      transaction.keychain = keychain;
    } catch (e) {
      if (e.code !== 'no_encrypted_keychain_on_wallet') {
        throw e;
      }
      // this might be a safe wallet, so let's retrieve the private key info
      // @ts-expect-error - no implicit this
      yield this.refresh({ gpk: true });
      // @ts-expect-error - no implicit this
      const safeUserKey = _.get(this.wallet, 'private.userPrivKey');
      if (_.isString(safeUserKey) && _.isString(params.walletPassphrase)) {
        // @ts-expect-error - no implicit this
        transaction.signingKey = this.bitgo.decrypt({ password: params.walletPassphrase, input: safeUserKey });
      } else {
        throw e;
      }
    }

    transaction.feeSingleKeyWIF = params.feeSingleKeyWIF;
    // @ts-expect-error - no implicit this
    const result = yield this.signTransaction(transaction);
    return _.extend(result, {
      fee,
      feeRate,
      instant: params.instant,
      bitgoFee,
      travelInfos,
      estimatedSize,
      unspents,
    });
  })
    .call(this)
    .asCallback(callback);
};

//
// getAndPrepareSigningKeychain
// INTERNAL function to get the user keychain for signing.
// Caller must provider either a keychain, or walletPassphrase or xprv as a string
// If the caller provides the keychain with xprv, it is simply returned.
// If the caller provides the encrypted xprv (walletPassphrase), then fetch the keychain object and decrypt
// Otherwise if the xprv is provided, fetch the keychain object and augment it with the xprv.
//
// Parameters:
//   keychain - keychain with xprv
//   xprv - the private key in string form
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
// Returns:
//   Keychain object containing xprv, xpub and paths
//
Wallet.prototype.getAndPrepareSigningKeychain = function (params, callback) {
  params = params || {};

  // If keychain with xprv is already provided, use it
  if (_.isObject(params.keychain) && params.keychain.xprv) {
    return Bluebird.resolve(params.keychain);
  }

  common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);
  if ((params.walletPassphrase && params.xprv) || (!params.walletPassphrase && !params.xprv)) {
    throw new Error('must provide exactly one of xprv or walletPassphrase');
  }

  const self = this;

  // Caller provided a wallet passphrase
  if (params.walletPassphrase) {
    return self.getEncryptedUserKeychain().then(function (keychain) {
      // Decrypt the user key with a passphrase
      try {
        keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedXprv });
      } catch (e) {
        throw new Error('Unable to decrypt user keychain');
      }

      if (keychain.xpub && bip32.fromBase58(keychain.xprv).neutered().toBase58() !== keychain.xpub) {
        throw new Error('derived xpub does not match stored xpub');
      }
      return keychain;
    });
  }

  // Caller provided an xprv - validate and construct keychain object
  let xpub;
  try {
    xpub = bip32.fromBase58(params.xprv).neutered().toBase58();
  } catch (e) {
    throw new Error('Unable to parse the xprv');
  }

  if (xpub === params.xprv) {
    throw new Error('xprv provided was not a private key (found xpub instead)');
  }

  const walletXpubs = _.map(self.keychains, 'xpub');
  if (!_.includes(walletXpubs, xpub)) {
    throw new Error('xprv provided was not a keychain on this wallet!');
  }

  // get the keychain object from bitgo to find the path and (potential) wallet structure
  return self.bitgo
    .keychains()
    .get({ xpub: xpub })
    .then(function (keychain) {
      keychain.xprv = params.xprv;
      return keychain;
    });
};

/**
 * Takes a wallet's unspents and fans them out into a larger number of equally sized unspents
 * @param params
 *  target: set how many unspents you want to have in the end
 *  minConfirms: minimum number of confirms the unspents must have
 *  xprv: private key to sign transaction
 *  walletPassphrase: wallet passphrase to decrypt the wallet's private key
 * @param callback
 * @returns {*}
 */
Wallet.prototype.fanOutUnspents = function (params, callback) {
  const self = this;
  return Bluebird.coroutine(function* () {
    // maximum number of inputs for fanout transaction
    // (when fanning out, we take all the unspents and make a bigger number of outputs)
    const MAX_FANOUT_INPUT_COUNT = 80;
    // maximum number of outputs for fanout transaction
    const MAX_FANOUT_OUTPUT_COUNT = 300;
    params = params || {};
    common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);
    const validate = params.validate === undefined ? true : params.validate;

    const target = params.target;
    // the target must be defined, be a number, be at least two, and be a natural number
    if (!_.isNumber(target) || target < 2 || target % 1 !== 0) {
      throw new Error('Target needs to be a positive integer');
    }
    if (target > MAX_FANOUT_OUTPUT_COUNT) {
      throw new Error('Fan out target too high');
    }

    let minConfirms = params.minConfirms;
    if (minConfirms === undefined) {
      minConfirms = 1;
    }
    if (!_.isNumber(minConfirms) || minConfirms < 0) {
      throw new Error('minConfirms needs to be an integer >= 0');
    }

    /**
     * Split a natural number N into n almost equally sized (±1) natural numbers.
     * In order to calculate the sizes of the parts, we calculate floor(N/n), and thus have the base size of all parts.
     * If N % n !== 0, this leaves us with a remainder r where r < n. We distribute r equally among the n parts by
     * adding 1 to the first r parts.
     * @param total
     * @param partCount
     * @returns {Array}
     */
    const splitNumberIntoCloseNaturalNumbers = function (total, partCount) {
      const partSize = Math.floor(total / partCount);
      const remainder = total - partSize * partCount;
      // initialize placeholder array
      const almostEqualParts = new Array(partCount);
      // fill the first remainder parts with the value partSize+1
      _.fill(almostEqualParts, partSize + 1, 0, remainder);
      // fill the remaining parts with the value partSize
      _.fill(almostEqualParts, partSize, remainder);
      // assert the correctness of the almost equal parts
      // TODO: add check for the biggest deviation between any two parts and make sure it's <= 1
      if (_(almostEqualParts).sum() !== total || _(almostEqualParts).size() !== partCount) {
        throw new Error('part sum or part count mismatch');
      }
      return almostEqualParts;
    };

    // first, let's take all the wallet's unspents (with min confirms if necessary)
    const allUnspents = (yield self.unspents({ minConfirms: minConfirms })) as any;
    if (allUnspents.length < 1) {
      throw new Error('No unspents to branch out');
    }

    // this consolidation is essentially just a waste of money
    if (allUnspents.length >= target) {
      throw new Error('Fan out target has to be bigger than current number of unspents');
    }

    // we have at the very minimum 81 inputs, and 81 outputs. That transaction will be big
    // in the medium run, this algorithm could be reworked to only work with a subset of the transactions
    if (allUnspents.length > MAX_FANOUT_INPUT_COUNT) {
      throw new Error('Too many unspents');
    }

    // this is all the money that is currently in the wallet
    const grossAmount = _(allUnspents).map('value').sum();

    // in order to not modify the params object, we create a copy
    const txParams = _.extend({}, params);
    txParams.unspents = allUnspents;
    txParams.recipients = {};

    // create target amount of new addresses for this wallet
    const newAddressPromises = _.range(target).map(() =>
      self.createAddress({ chain: self.getChangeChain(params), validate: validate })
    );
    const newAddresses = yield Bluebird.all(newAddressPromises);
    // let's find a nice, equal distribution of our Satoshis among the new addresses
    const splitAmounts = splitNumberIntoCloseNaturalNumbers(grossAmount, target);
    // map the newly created addresses to the almost components amounts we just calculated
    txParams.recipients = _.zipObject(_.map(newAddresses, 'address'), splitAmounts);
    txParams.noSplitChange = true;
    // attempt to create a transaction. As it is a wallet-sweeping transaction with no fee, we expect it to fail
    try {
      yield self.sendMany(txParams);
    } catch (error) {
      // as expected, the transaction creation did indeed fail due to insufficient fees
      // the error suggests a fee value which we then use for the transaction
      // however, let's make sure it wasn't something else
      if (!error.fee && (!error.result || !error.result.fee)) {
        // if the error does not contain a fee property, it is something else that has gone awry, and we throw it
        const debugParams = _.omit(txParams, ['walletPassphrase', 'xprv']);
        error.message += `\n\nTX PARAMS:\n ${JSON.stringify(debugParams, null, 4)}`;
        throw error;
      }
      const baseFee = error.fee || error.result.fee;
      let totalFee = baseFee;
      if (error.result.bitgoFee && error.result.bitgoFee.amount) {
        totalFee += error.result.bitgoFee.amount;
        txParams.bitgoFee = error.result.bitgoFee;
      }

      // Need to clear these out since only 1 may be set
      delete txParams.fee;
      txParams.originalFeeRate = txParams.feeRate;
      delete txParams.feeRate;
      delete txParams.feeTxConfirmTarget;
      txParams.fee = baseFee;
      // in order to maintain the equal distribution, we need to subtract the fee from the cumulative funds
      // in case some unspents got pruned, we need to use error.result.available
      const netAmount = error.result.available - totalFee; // after fees
      // that means that the distribution has to be recalculated
      const remainingSplitAmounts = splitNumberIntoCloseNaturalNumbers(netAmount, target);
      // and the distribution again mapped to the new addresses
      txParams.recipients = _.zipObject(_.map(newAddresses, 'address'), remainingSplitAmounts);
    }

    // this time, the transaction creation should work
    let fanoutTx;
    try {
      fanoutTx = yield self.sendMany(txParams);
    } catch (e) {
      const debugParams = _.omit(txParams, ['walletPassphrase', 'xprv']);
      e.message += `\n\nTX PARAMS:\n ${JSON.stringify(debugParams, null, 4)}`;
      throw e;
    }

    return Bluebird.resolve(fanoutTx).asCallback(callback);
  })().asCallback(callback);
};

/**
 * Determine whether to fan out or coalesce a wallet's unspents
 * @param params
 * @param callback
 * @returns {Request|Promise.<T>|*}
 */
Wallet.prototype.regroupUnspents = function (params, callback) {
  params = params || {};
  const target = params.target;
  if (!_.isNumber(target) || target < 1 || target % 1 !== 0) {
    // the target must be defined, be a number, be at least one, and be a natural number
    throw new Error('Target needs to be a positive integer');
  }

  let minConfirms = params.minConfirms;
  if (minConfirms === undefined) {
    minConfirms = 1;
  }
  if (!_.isNumber(minConfirms) || minConfirms < 0) {
    throw new Error('minConfirms needs to be an integer equal to or bigger than 0');
  }

  const self = this;
  return self.unspents({ minConfirms: minConfirms }).then(function (unspents) {
    if (unspents.length === target) {
      return unspents;
    } else if (unspents.length > target) {
      return self.consolidateUnspents(params, callback);
    } else if (unspents.length < target) {
      return self.fanOutUnspents(params, callback);
    }
  });
};

/**
 * Consolidate a wallet's unspents into fewer unspents
 * @param params
 *  target: set how many unspents you want to have in the end
 *  maxInputCountPerConsolidation: set how many maximum inputs are to be permitted per consolidation batch
 *  xprv: private key to sign transaction
 *  walletPassphrase: wallet passphrase to decrypt the wallet's private key
 *  maxIterationCount: maximum number of iterations to be performed until function stops
 *  progressCallback: method to be called with object outlining current progress details
 * @param callback
 * @returns {*}
 */
Wallet.prototype.consolidateUnspents = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletPassphrase', 'xprv'], callback);
  const validate = params.validate === undefined ? true : params.validate;

  let target = params.target;
  if (target === undefined) {
    target = 1;
  } else if (!_.isNumber(target) || target < 1 || target % 1 !== 0) {
    // the target must be defined, be a number, be at least one, and be a natural number
    throw new Error('Target needs to be a positive integer');
  }

  if (params.maxSize && !_.isNumber(params.maxSize)) {
    throw new Error('maxSize should be a number');
  }

  if (params.minSize && !_.isNumber(params.minSize)) {
    throw new Error('minSize should be a number');
  }

  // maximum number of inputs per transaction for consolidation
  const MAX_INPUT_COUNT = 200;
  let maxInputCount = params.maxInputCountPerConsolidation;
  if (maxInputCount === undefined) {
    // null or unidentified, because equality to zero returns true in if(! clause
    maxInputCount = MAX_INPUT_COUNT;
  }
  if (typeof maxInputCount !== 'number' || maxInputCount < 2 || maxInputCount % 1 !== 0) {
    throw new Error('Maximum consolidation input count needs to be an integer equal to or bigger than 2');
  } else if (maxInputCount > MAX_INPUT_COUNT) {
    throw new Error('Maximum consolidation input count cannot be bigger than ' + MAX_INPUT_COUNT);
  }

  const maxIterationCount = params.maxIterationCount || -1;
  if (
    (params.maxIterationCount && (!_.isNumber(maxIterationCount) || maxIterationCount < 1)) ||
    maxIterationCount % 1 !== 0
  ) {
    throw new Error('Maximum iteration count needs to be an integer equal to or bigger than 1');
  }

  let minConfirms = params.minConfirms;
  if (minConfirms === undefined) {
    minConfirms = 1;
  }
  if (!_.isNumber(minConfirms) || minConfirms < 0) {
    throw new Error('minConfirms needs to be an integer equal to or bigger than 0');
  }

  let minSize = params.minSize || 0;
  if (params.feeRate) {
    // fee rate is in satoshis per kB, input size in bytes
    const feeBasedMinSize = Math.ceil((VirtualSizes.txP2shInputSize * params.feeRate) / 1000);
    if (params.minSize && minSize < feeBasedMinSize) {
      throw new Error('provided minSize too low due to too high fee rate');
    }
    minSize = Math.max(feeBasedMinSize, minSize);

    if (!params.minSize) {
      // fee rate-based min size needs no logging if it was set explicitly
      console.log(
        'Only consolidating unspents larger than ' +
          minSize +
          ' satoshis to avoid wasting money on fees. To consolidate smaller unspents, use a lower fee rate.'
      );
    }
  }

  let iterationCount = 0;

  const self = this;
  let consolidationIndex = 0;

  /**
   * Consolidate one batch of up to MAX_INPUT_COUNT unspents.
   * @returns {*}
   */
  const runNextConsolidation = co(function* () {
    const consolidationTransactions: any[] = [];
    let isFinalConsolidation = false;
    iterationCount++;
    /*
     We take a maximum of unspentBulkSizeLimit unspents from the wallet. We want to make sure that we swipe the wallet
     clean of all excessive unspents, so we add 1 to the target unspent count to make sure we haven't missed anything.
     In case there are even more unspents than that, to make the consolidation as fast as possible, we expand our
     selection to include as many as the maximum permissible number of inputs per consolidation batch.
     Should the target number of unspents be higher than the maximum number if inputs per consolidation,
     we still want to fetch them all simply to be able to determine whether or not a consolidation can be performed
     at all, which is dependent on the number of all unspents being higher than the target.
     In the next version of the unspents version SDK, we will know the total number of unspents without having to fetch
     them, and therefore will be able to simplify this method.
     */

    const queryParams: any = {
      limit: target + maxInputCount,
      minConfirms: minConfirms,
      minSize: minSize,
    };
    if (params.maxSize) {
      queryParams.maxSize = params.maxSize;
    }
    const allUnspents = (yield self.unspents(queryParams)) as any;
    // this consolidation is essentially just a waste of money
    if (allUnspents.length <= target) {
      if (iterationCount <= 1) {
        // this is the first iteration, so the method is incorrect
        throw new Error('Fewer unspents than consolidation target. Use fanOutUnspents instead.');
      } else {
        // it's a later iteration, so the target may have been surpassed (due to confirmations in the background)
        throw new Error('Done');
      }
    }

    const allUnspentsCount = allUnspents.length;

    // how many of the unspents do we want to consolidate?
    // the +1 is because the consolidated block becomes a new unspent later
    let targetInputCount = allUnspentsCount - target + 1;
    targetInputCount = Math.min(targetInputCount, allUnspents.length);

    // if the targetInputCount requires more inputs than we allow per batch, we reduce the number
    const inputCount = Math.min(targetInputCount, maxInputCount);

    // if either the number of inputs left to coalesce equals the number we will coalesce in this iteration
    // or if the number of iterations matches the maximum permitted number
    isFinalConsolidation = inputCount === targetInputCount || iterationCount === maxIterationCount;

    const currentChunk = allUnspents.splice(0, inputCount);
    const changeChain = self.getChangeChain(params);
    const newAddress = (yield self.createAddress({ chain: changeChain, validate: validate })) as any;
    const txParams = _.extend({}, params);
    const currentAddress = newAddress;
    // the total amount that we are consolidating within this batch
    const grossAmount = _(currentChunk).map('value').sum(); // before fees

    txParams.unspents = currentChunk;
    txParams.recipients = {};
    txParams.recipients[newAddress.address] = grossAmount;
    txParams.noSplitChange = true;

    if (txParams.unspents.length <= 1) {
      throw new Error('Done');
    }

    // let's attempt to create this transaction. We expect it to fail because no fee is set.
    try {
      yield self.sendMany(txParams);
    } catch (error) {
      // this error should occur due to insufficient funds
      // however, let's make sure it wasn't something else
      if (!error.fee && (!error.result || !error.result.fee)) {
        // if the error does not contain a fee property, it is something else that has gone awry, and we throw it
        const debugParams = _.omit(txParams, ['walletPassphrase', 'xprv']);
        error.message += `\n\nTX PARAMS:\n ${JSON.stringify(debugParams, null, 4)}`;
        throw error;
      }
      const baseFee = error.fee || error.result.fee;
      let bitgoFee = 0;
      let totalFee = baseFee;
      if (error.result.bitgoFee && error.result.bitgoFee.amount) {
        bitgoFee = error.result.bitgoFee.amount;
        totalFee += bitgoFee;
        txParams.bitgoFee = error.result.bitgoFee;
      }

      // if the net amount is negative, it should be replaced with the minimum output size
      const netAmount = Math.max(error.result.available - totalFee, self.bitgo.getConstants().minOutputSize);
      // Need to clear these out since only 1 may be set
      delete txParams.fee;
      txParams.originalFeeRate = txParams.feeRate;
      delete txParams.feeRate;
      delete txParams.feeTxConfirmTarget;

      // we set the fee explicitly
      txParams.fee = error.result.available - netAmount - bitgoFee;
      txParams.recipients[newAddress.address] = netAmount;
    }
    // this transaction, on the other hand, should be created with no issues, because an appropriate fee is set
    let sentTx;
    try {
      sentTx = yield self.sendMany(txParams);
    } catch (e) {
      const debugParams = _.omit(txParams, ['walletPassphrase', 'xprv']);
      e.message += `\n\nTX PARAMS:\n ${JSON.stringify(debugParams, null, 4)}`;
      throw e;
    }
    consolidationTransactions.push(sentTx);
    if (_.isFunction(params.progressCallback)) {
      params.progressCallback({
        txid: sentTx.hash,
        destination: currentAddress,
        amount: grossAmount,
        fee: sentTx.fee,
        inputCount: inputCount,
        index: consolidationIndex,
      });
    }
    consolidationIndex++;
    if (!isFinalConsolidation) {
      // this last consolidation has not yet brought the unspents count down to the target unspent count
      // therefore, we proceed by consolidating yet another batch
      // before we do that, we wait 1 second so that the newly created unspent will be fetched in the next batch
      yield Bluebird.delay(1000);
      consolidationTransactions.push(...((yield runNextConsolidation()) as any));
    }
    // this is the final consolidation transaction. We return all the ones we've had so far
    return consolidationTransactions;
  });

  return runNextConsolidation(this, target)
    .catch(function (err) {
      if (err.message === 'Done') {
        return;
      }
      throw err;
    })
    .nodeify(callback);
};

Wallet.prototype.shareWallet = function (params, callback) {
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
  return this.bitgo
    .getSharingKey({ email: params.email.toLowerCase() })
    .then(function (result) {
      sharing = result;

      if (needsKeychain) {
        return self.getEncryptedUserKeychain({}).then(function (keychain) {
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

            const eckey = makeRandomKey();
            const secret = getSharedSecret(eckey, Buffer.from(sharing.pubkey, 'hex')).toString('hex');
            const newEncryptedXprv = self.bitgo.encrypt({ password: secret, input: keychain.xprv });

            sharedKeychain = {
              xpub: keychain.xpub,
              encryptedXprv: newEncryptedXprv,
              fromPubKey: eckey.publicKey.toString('hex'),
              toPubKey: sharing.pubkey,
              path: sharing.path,
            };
          }
        });
      }
    })
    .then(function () {
      interface Options {
        user: any;
        permissions: string;
        reshare: boolean;
        message: string;
        disableEmail: any;
        keychain?: any;
        skipKeychain?: boolean;
      }

      const options: Options = {
        user: sharing.userId,
        permissions: params.permissions,
        reshare: params.reshare,
        message: params.message,
        disableEmail: params.disableEmail,
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

Wallet.prototype.removeUser = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['user'], [], callback);

  return Bluebird.resolve(
    this.bitgo
      .del(this.url('/user/' + params.user))
      .send()
      .result()
  ).nodeify(callback);
};

Wallet.prototype.getPolicy = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(this.bitgo.get(this.url('/policy')).send().result()).nodeify(callback);
};

Wallet.prototype.getPolicyStatus = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(this.bitgo.get(this.url('/policy/status')).send().result()).nodeify(callback);
};

Wallet.prototype.setPolicyRule = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id', 'type'], ['message'], callback);

  if (!_.isObject(params.condition)) {
    throw new Error('missing parameter: conditions object');
  }

  if (!_.isObject(params.action)) {
    throw new Error('missing parameter: action object');
  }

  return Bluebird.resolve(this.bitgo.put(this.url('/policy/rule')).send(params).result()).nodeify(callback);
};

Wallet.prototype.removePolicyRule = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], ['message'], callback);

  return Bluebird.resolve(this.bitgo.del(this.url('/policy/rule')).send(params).result()).nodeify(callback);
};

Wallet.prototype.listWebhooks = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return Bluebird.resolve(this.bitgo.get(this.url('/webhooks')).send().result()).nodeify(callback);
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
Wallet.prototype.simulateWebhook = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['webhookId'], ['txHash', 'pendingApprovalId'], callback);

  const hasTxHash = !!params.txHash;
  const hasPendingApprovalId = !!params.pendingApprovalId;

  if ((hasTxHash && hasPendingApprovalId) || (!hasTxHash && !hasPendingApprovalId)) {
    throw new Error('must supply either txHash or pendingApprovalId, but not both');
  }

  // depending on the coin type of the wallet, the txHash has to adhere to its respective format
  // but the server takes care of that

  // only take the txHash and pendingApprovalId properties
  const filteredParams = _.pick(params, ['txHash', 'pendingApprovalId']);

  const webhookId = params.webhookId;
  return Bluebird.resolve(
    this.bitgo
      .post(this.url('/webhooks/' + webhookId + '/simulate'))
      .send(filteredParams)
      .result()
  ).nodeify(callback);
};

Wallet.prototype.addWebhook = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return Bluebird.resolve(this.bitgo.post(this.url('/webhooks')).send(params).result()).nodeify(callback);
};

Wallet.prototype.removeWebhook = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return Bluebird.resolve(this.bitgo.del(this.url('/webhooks')).send(params).result()).nodeify(callback);
};

Wallet.prototype.estimateFee = function (params, callback) {
  common.validateParams(params, [], [], callback);

  if (params.amount && params.recipients) {
    throw new Error('cannot specify both amount as well as recipients');
  }
  if (params.recipients && !_.isObject(params.recipients)) {
    throw new Error('recipients must be array of { address: abc, amount: 100000 } objects');
  }
  if (params.amount && !_.isNumber(params.amount)) {
    throw new Error('invalid amount argument, expecting number');
  }

  const recipients = params.recipients || [];

  if (params.amount) {
    // only the amount was passed in, so we need to make a false recipient to run createTransaction with
    recipients.push({
      address: common.Environments[this.bitgo.env].signingAddress, // any address will do
      amount: params.amount,
    });
  }

  const transactionParams = _.extend({}, params);
  transactionParams.amount = undefined;
  transactionParams.recipients = recipients;

  return this.createTransaction(transactionParams).then(function (tx) {
    return {
      estimatedSize: tx.estimatedSize,
      fee: tx.fee,
      feeRate: tx.feeRate,
    };
  });
};

// Not fully implemented / released on SDK. Testing for now.
Wallet.prototype.updatePolicyRule = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id', 'type'], [], callback);

  return Bluebird.resolve(this.bitgo.put(this.url('/policy/rule')).send(params).result()).nodeify(callback);
};

Wallet.prototype.deletePolicyRule = function (params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return Bluebird.resolve(this.bitgo.del(this.url('/policy/rule')).send(params).result()).nodeify(callback);
};

//
// getBitGoFee
// Get the required on-transaction BitGo fee
//
Wallet.prototype.getBitGoFee = function (params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);
  if (!_.isNumber(params.amount)) {
    throw new Error('invalid amount argument');
  }
  if (params.instant && !_.isBoolean(params.instant)) {
    throw new Error('invalid instant argument');
  }
  return Bluebird.resolve(this.bitgo.get(this.url('/billing/fee')).query(params).result()).nodeify(callback);
};

/*
 * @params
 *  walletPassphrase: passphrase of wallet used to decrypt the encrypted keys
 *  unspents: array of unspents to recover
 *  recoveryDestination: destination address to recover funds to
 *  feeRate: fee rate to use for the recovery transaction
 *  userKey: encrypted user key
 *  backupKey: encrypted backup key
 * */
Wallet.prototype.recover = async function (params) {
  if (_.isUndefined(params.walletPassphrase)) {
    throw new Error('missing walletPassphrase');
  }
  if (_.isUndefined(params.unspents)) {
    throw new Error('missing unspents');
  }
  if (_.isUndefined(params.recoveryDestination)) {
    throw new Error('invalid recoveryDestination');
  }
  if (_.isUndefined(params.feeRate)) {
    throw new Error('invalid feeRate');
  }
  if (_.isUndefined(params.userKey)) {
    throw new Error('invalid userKey');
  }
  if (_.isUndefined(params.backupKey)) {
    throw new Error('invalid backupKey');
  }

  const totalInputAmount = BigInt(utxolib.bitgo.unspentSum(params.unspents));
  if (totalInputAmount <= BigInt(0)) {
    throw new ErrorNoInputToRecover();
  }

  const outputSize = VirtualSizes.txP2wshOutputSize;
  const approximateSize =
    VirtualSizes.txSegOverheadVSize + outputSize + VirtualSizes.txP2shInputSize * params.unspents.length;
  const approximateTxFee = BigInt(approximateSize * params.feeRate);
  const recoveryAmount = totalInputAmount - approximateTxFee;
  const recipients = [{ address: params.recoveryDestination, amount: Number(recoveryAmount) }];

  const unsignedTx = await this.createTransaction({
    unspents: params.unspents,
    recipients,
    fee: Number(approximateTxFee),
  });

  const parsedUnsignedTx = utxolib.bitgo.createTransactionFromHex(unsignedTx.transactionHex, utxolib.networks.bitcoin);
  assert(parsedUnsignedTx.ins.length === params.unspents.length);
  assert(parsedUnsignedTx.outs.length === 1);
  assert(_.sumBy(params.unspents, 'value') - _.sumBy(parsedUnsignedTx.outs, 'value') === Number(approximateTxFee));

  const plainUserKey = this.bitgo.decrypt({ password: params.walletPassphrase, input: params.userKey });
  const halfSignedTx = await this.signTransaction({ ...unsignedTx, signingKey: plainUserKey });

  const plainBackupKey = this.bitgo.decrypt({ password: params.walletPassphrase, input: params.backupKey });
  const fullSignedTx = await this.signTransaction({
    ...unsignedTx,
    transactionHex: halfSignedTx.tx,
    signingKey: plainBackupKey,
  });
  return fullSignedTx.tx;
};

export = Wallet;
