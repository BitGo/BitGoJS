var bitcoin = require('../bitcoin');
var common = require('../common');
var PendingApproval = require('./pendingApproval');
var Q = require('q');
var _ = require('lodash');

var PendingApprovals = function(bitgo, baseCoin) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
  this.coinPendingApproval = PendingApproval;
};

//
// list
// List the pending approvals available to the user
//
PendingApprovals.prototype.list = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletId', 'enterpriseId'], callback);

  var args = [];
  var queryParams = {};
  if (typeof(params.walletId) === 'string') {
    queryParams.walletId = params.walletId;
  }
  if (typeof(params.enterpriseId) === 'string') {
    queryParams.enterprise = params.enterpriseId;
  }

  if (Object.keys(queryParams).length !== 1) {
    throw new Error('must provide exactly 1 of walletId or enterpriseId to get pending approvals on');
  }

  var self = this;
  return this.bitgo.get(this.baseCoin.url('/pendingapprovals'))
  .query(queryParams)
  .result()
  .then(function(body) {
    body.pendingApprovals = body.pendingApprovals.map(function(currentApproval) {
      return new self.coinPendingApproval(self.bitgo, self.baseCoin, currentApproval);
    });
    return body;
  })
  .nodeify(callback);
};

//
// get
// Fetch an existing pending approval
// Parameters include:
//   id:  the pending approval id
//
PendingApprovals.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  var self = this;
  return this.bitgo.get(this.baseCoin.url('/pendingapprovals/' + params.id))
  .result()
  .then(function(body) {
    return new self.coinPendingApproval(self.bitgo, self.baseCoin, body);
  })
  .nodeify(callback);
};

module.exports = PendingApprovals;
