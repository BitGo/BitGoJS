const common = require('../common');
const assert = require('assert');
const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');

const PendingApproval = function(bitgo, baseCoin, pendingApprovalData, wallet) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
  this.wallet = wallet;
  this._pendingApproval = pendingApprovalData;
};

//
// id
// Get the id of this pending approval.
//
PendingApproval.prototype.id = function() {
  return this._pendingApproval.id;
};

//
// ownerType
// Get the owner type (wallet or enterprise)
// Pending approvals can be approved or modified by different scopes (depending on how they were created)
// If a pending approval is owned by a wallet, then it can be approved by administrators of the wallet
// If a pending approval is owned by an enterprise, then it can be approved by administrators of the enterprise
//
PendingApproval.prototype.ownerType = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  if (this._pendingApproval.wallet) {
    return 'wallet';
  } else if (this._pendingApproval.enterprise) {
    return 'enterprise';
  } else {
    throw new Error('unexpected pending approval owner: neither wallet nor enterprise was present');
  }
};

//
// walletId
// Get the wallet ID that owns / is associated with the pending approval
//
PendingApproval.prototype.walletId = function() {
  return this._pendingApproval.wallet;
};

//
// enterpriseId
// Get the enterprise ID that owns / is associated with the pending approval
//
PendingApproval.prototype.enterpriseId = function() {
  return this._pendingApproval.enterprise;
};

//
// state
// Get the state of the pending approval
//
PendingApproval.prototype.state = function() {
  return this._pendingApproval.state;
};

//
// creator
// Get the id of the user that performed the action resulting in this pending approval
//
PendingApproval.prototype.creator = function() {
  return this._pendingApproval.creator;
};

//
// type
// Get the type of the pending approval (what it approves)
// Example: transactionRequest, tagUpdateRequest, policyRuleRequest
//
PendingApproval.prototype.type = function() {
  assert(this._pendingApproval.info);
  return this._pendingApproval.info.type;
};

//
// type
// Get information about the pending approval
//
PendingApproval.prototype.info = function() {
  return this._pendingApproval.info;
};

//
// approvalsRequired
// get the number of approvals that are required for this pending approval to be approved.
// Defaults to 1 if approvalsRequired doesn't exist on the object
//
PendingApproval.prototype.approvalsRequired = function() {
  return this._pendingApproval.approvalsRequired || 1;
};

//
// url
// Gets the url for this pending approval
//
PendingApproval.prototype.url = function(extra) {
  extra = extra || '';
  return this.baseCoin.url('/pendingapprovals/' + this.id() + extra);
};

//
// get
// Refetches this pending approval and returns it
//
PendingApproval.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  const self = this;
  return this.bitgo.get(this.url())
  .result()
  .then(function(res) {
    self.pendingApproval = res;
    return self;
  })
  .nodeify(callback);
};

//
// Helper function to ensure that self.wallet is set
//
PendingApproval.prototype.populateWallet = function() {
  const self = this;
  if (!self.wallet) {
    return self.baseCoin.wallets().get({ id: self.info().transactionRequest.sourceWallet })
    .then(function(wallet) {
      if (!wallet) {
        throw new Error('unexpected - unable to get wallet using sourcewallet');
      }
      self.wallet = wallet;
    });
  }

  if (self.wallet.id() !== self.info().transactionRequest.sourceWallet) {
    throw new Error('unexpected source wallet for pending approval');
  }

  return Promise.resolve(); // otherwise returns undefined
};

//
// approve
// sets the pending approval to an approved state
//
PendingApproval.prototype.approve = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletPassphrase', 'otp'], callback);

  let canRecreateTransaction = true;
  // cold wallets cannot recreate transactions if the only thing provided is the wallet passphrase
  /*
    The transaction can be recreated if either
    – there is an xprv
    – there is a walletPassphrase and the wallet is not cold (because if it's cold, the passphrase is of little use)
    Therefore, if neither of these is true, the transaction cannot be recreated, which is reflected in the if
    statement below.
   */
  const isColdWallet = !!_.get(this.wallet, '_wallet.isCold');
  if (!params.xprv && !(params.walletPassphrase && !isColdWallet)) {
    canRecreateTransaction = false;
  }

  const self = this;
  return Promise.try(function() {
    if (self.type() === 'transactionRequest') {
      /*
      If this is a request for approving a transaction, depending on whether this user has a private key to the wallet
      (some admins may not have the spend permission), the transaction could either be rebroadcast as is, or it could
      be reconstructed. It is preferable to reconstruct a tx in order to adhere to the latest network conditions
      such as newer unspents, different fees, or a higher sequence id
       */
      if (params.tx) {
        // the approval tx was reconstructed and explicitly specified - pass it through
        return {
          txHex: params.tx
        };
      }

      const transaction = _.get(self.info(), `transactionRequest.coinSpecific.${self.baseCoin.type}`);

      // this user may not have spending privileges or a passphrase may not have been passed in
      if (!canRecreateTransaction) {
        if (!_.isObject(transaction)) {
          throw new Error('there is neither an original transaction object nor can a new one be recreated');
        }
        return transaction;
      }

      return self.populateWallet()
      .then(function() {
        return self.recreateAndSignTransaction(params);
      });
    }
  })
  .then(function(transaction) {
    const approvalParams = { state: 'approved', otp: params.otp };
    if (transaction) {
      // if the transaction already has a half signed property, we take that directly
      approvalParams.halfSigned = transaction.halfSigned || transaction;
    }
    return self.bitgo.put(self.url())
    .send(approvalParams)
    .result()
    .nodeify(callback);
  })
  .catch(function(error) {
    if (!canRecreateTransaction &&
    (
      error.message.indexOf('could not find unspent output for input') !== -1 ||
      error.message.indexOf('transaction conflicts with an existing transaction in the send queue') !== -1)
    ) {
      throw new Error('unspents expired, wallet passphrase or xprv required to recreate transaction');
    }
    throw error;
  });
};

//
// rejected
// sets the pending approval to a rejected state
//
PendingApproval.prototype.reject = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.put(this.url())
  .send({ state: 'rejected' })
  .result()
  .nodeify(callback);
};

//
// cancel
// rejects the pending approval
//
PendingApproval.prototype.cancel = function(params, callback) {
  return this.reject(params, callback);
};

/**
 * Recreate a transaction for a pending approval to respond to updated network conditions
 * @param params
 */
PendingApproval.prototype.recreateAndSignTransaction = function(params) {
  return co(function *() {
    params = _.extend({}, params);
    common.validateParams(params, [], []);

    // this method only makes sense with existing transaction requests
    assert(this.info().transactionRequest);

    const recipients = this.info().transactionRequest.recipients;
    const prebuildParams = _.extend({}, params, { recipients: recipients }, this.info().transactionRequest.buildParams);
    return this.wallet.prebuildAndSignTransaction(prebuildParams);
  }).call(this);
};

module.exports = PendingApproval;
