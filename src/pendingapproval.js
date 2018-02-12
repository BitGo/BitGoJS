//
// Pending Approval Object
// Handles approving, rejecting and getting information on pending approvals
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//
const common = require('./common');
const assert = require('assert');

const bitcoin = require('./bitcoin');

const Promise = require('bluebird');
const _ = require('lodash');

//
// Constructor
//
const PendingApproval = function(bitgo, pendingApproval, wallet) {
  this.bitgo = bitgo;
  this.pendingApproval = pendingApproval;
  this.wallet = wallet;
};

//
// id
// Get the id of this pending approval.
//
PendingApproval.prototype.id = function() {
  return this.pendingApproval.id;
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

  if (this.pendingApproval.walletId) {
    return 'wallet';
  } else if (this.pendingApproval.enterprise) {
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
  return this.pendingApproval.walletId;
};

//
// enterpriseId
// Get the enterprise ID that owns / is associated with the pending approval
//
PendingApproval.prototype.enterpriseId = function() {
  return this.pendingApproval.enterprise;
};

//
// state
// Get the state of the pending approval
//
PendingApproval.prototype.state = function() {
  return this.pendingApproval.state;
};

//
// creator
// Get the id of the user that performed the action resulting in this pending approval
//
PendingApproval.prototype.creator = function() {
  return this.pendingApproval.creator;
};

//
// type
// Get the type of the pending approval (what it approves)
// Example: transactionRequest, tagUpdateRequest, policyRuleRequest
//
PendingApproval.prototype.type = function() {
  assert(this.pendingApproval.info);
  return this.pendingApproval.info.type;
};

//
// type
// Get information about the pending approval
//
PendingApproval.prototype.info = function() {
  return this.pendingApproval.info;
};

//
// approvalsRequired
// get the number of approvals that are required for this pending approval to be approved.
// Defaults to 1 if approvalsRequired doesn't exist on the object
//
PendingApproval.prototype.approvalsRequired = function() {
  return this.pendingApproval.approvalsRequired || 1;
};

//
// url
// Gets the url for this pending approval
//
PendingApproval.prototype.url = function(extra) {
  extra = extra || '';
  return this.bitgo.url('/pendingapprovals/' + this.id() + extra);
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
    return self.bitgo.wallets().get({ id: self.info().transactionRequest.sourceWallet })
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
// helper function to recreate and sign a transaction on a wallet
// we should hopefully be able to move this logic server side soon
//
PendingApproval.prototype.recreateAndSignTransaction = function(params, callback) {
  params = _.extend({}, params);
  common.validateParams(params, ['txHex'], [], callback);

  const transaction = bitcoin.Transaction.fromHex(params.txHex);
  if (!transaction.outs) {
    throw new Error('transaction had no outputs or failed to parse successfully');
  }

  const network = bitcoin.networks[common.getNetwork()];
  params.recipients = {};

  const self = this;

  return Promise.try(function() {
    if (self.info().transactionRequest.recipients) {
      // recipients object found on the pending approvals - use it
      params.recipients = self.info().transactionRequest.recipients;
      return;
    }
    if (transaction.outs.length <= 2) {
      transaction.outs.forEach(function(out) {
        const outAddress = bitcoin.address.fromOutputScript(out.script, network).toBase58Check();
        if (self.info().transactionRequest.destinationAddress === outAddress) {
          // If this is the destination, then spend to it
          params.recipients[outAddress] = out.value;
        }
      });
      return;
    }

    // This looks like a sendmany
    // Attempt to figure out the outputs by choosing all outputs that were not going back to the wallet as change addresses
    return self.wallet.addresses({ chain: 1, sort: -1, limit: 500 })
    .then(function(result) {
      const changeAddresses = _.keyBy(result.addresses, 'address');
      transaction.outs.forEach(function(out) {
        const outAddress = bitcoin.address.fromOutputScript(out.script, network).toBase58Check();
        if (!changeAddresses[outAddress]) {
          // If this is not a change address, then spend to it
          params.recipients[outAddress] = out.value;
        }
      });
    });
  })
  .then(function() {
    return self.wallet.createAndSignTransaction(params);
  });
};

//
// constructApprovalTx
// constructs/signs a transaction for this pending approval, returning the txHex (but not sending it)
//
PendingApproval.prototype.constructApprovalTx = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletPassphrase'], callback);

  if (this.type() === 'transactionRequest' && !(params.walletPassphrase || params.xprv)) {
    throw new Error('wallet passphrase or xprv required to approve a transactionRequest');
  }

  if (params.useOriginalFee) {
    if (!_.isBoolean(params.useOriginalFee)) {
      throw new Error('invalid type for useOriginalFeeRate');
    }
    if (params.fee || params.feeRate || params.feeTxConfirmTarget) {
      throw new Error('cannot specify a fee/feerate/feeTxConfirmTarget as well as useOriginalFee');
    }
  }

  const self = this;
  return Promise.try(function() {
    if (self.type() === 'transactionRequest') {
      const extendParams = { txHex: self.info().transactionRequest.transaction };
      if (params.useOriginalFee) {
        extendParams.fee = self.info().transactionRequest.fee;
      }
      return self.populateWallet()
      .then(function() {
        return self.recreateAndSignTransaction(_.extend(params, extendParams));
      });
    }
  });
};

//
// approve
// sets the pending approval to an approved state
//
PendingApproval.prototype.approve = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletPassphrase', 'otp'], callback);

  let canRecreateTransaction = true;
  if (this.type() === 'transactionRequest' && !(params.walletPassphrase || params.xprv)) {
    canRecreateTransaction = false;
  }

  const self = this;
  return Promise.try(function() {
    if (self.type() === 'transactionRequest') {
      if (params.tx) {
        // the approval tx was reconstructed and explicitly specified - pass it through
        return {
          tx: params.tx
        };
      }

      // this user may not have spending privileges or a passphrase may not have been passed in
      if (!canRecreateTransaction) {
        return {
          tx: self.info().transactionRequest.transaction
        };
      }

      return self.populateWallet()
      .then(function() {
        const recreationParams = _.extend({}, params, { txHex: self.info().transactionRequest.transaction }, self.info().transactionRequest.buildParams);
        return self.recreateAndSignTransaction(recreationParams);
      });
    }
  })
  .then(function(transaction) {
    const approvalParams = { state: 'approved', otp: params.otp };
    if (transaction) {
      approvalParams.tx = transaction.tx;
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

module.exports = PendingApproval;
