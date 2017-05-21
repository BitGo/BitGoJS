var common = require('../common');
var assert = require('assert');
var bitcoin = require('../bitcoin');
var Q = require('q');
var _ = require('lodash');

var PendingApproval = function(bitgo, baseCoin, pendingApprovalData, wallet) {
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

  if (this._pendingApproval.walletId) {
    return 'wallet';
  } else if (this._pendingApproval.enterprise) {
    return 'enterprise';
  } else {
    throw new Error('unexpected pending approval owner: neither walletId nor enterprise was present');
  }
};

//
// walletId
// Get the wallet ID that owns / is associated with the pending approval
//
PendingApproval.prototype.walletId = function() {
  return this._pendingApproval.walletId;
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

  var self = this;
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
  var self = this;
  if (!self.wallet) {
    return self.baseCoin.wallets().get({ id: self.info().transactionRequest.sourceWallet })
    .then(function(wallet) {
      if (!wallet) {
        throw new Error('unexpected - unable to get wallet using sourcewallet');
      }
      self.wallet = wallet;
    });
  }

  if (self.wallet.id() != self.info().transactionRequest.sourceWallet) {
    throw new Error('unexpected source wallet for pending approval');
  }

  return Q(); // otherwise returns undefined
};

//
// approve
// sets the pending approval to an approved state
//
PendingApproval.prototype.approve = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletPassphrase', 'otp'], callback);

  var canRecreateTransaction = true;
  if (this.type() === 'transactionRequest' && !(params.walletPassphrase || params.xprv)) {
    canRecreateTransaction = false;
  }

  var self = this;
  return Q()
  .then(function() {
    let txHex;
    if(self.info && self.info().transactionRequest && self.info().transactionRequest.coinSpecific
      && self.info().transactionRequest.coinSpecific[self.baseCoin.type]
      && self.info().transactionRequest.coinSpecific[self.baseCoin.type].txHex) {
      txHex = self.info().transactionRequest.coinSpecific[self.baseCoin.type].txHex;
    } else {
      throw new Error('missing txHex on pending approval');
    }
    var approvalParams = { txHex: txHex, 'state': 'approved', 'otp': params.otp };
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
      throw new Error('unspents expired, wallet passphrase or xprv required to recreate transaction')
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

  var self = this;

  return this.bitgo.put(this.url())
  .send({ 'state': 'rejected' })
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

module.exports = PendingApproval;
