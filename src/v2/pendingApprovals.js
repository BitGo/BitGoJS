const common = require('../common');
const PendingApproval = require('./pendingApproval');
const _ = require('lodash');

const PendingApprovals = function(bitgo, baseCoin) {
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

  const queryParams = {};
  if (_.isString(params.walletId)) {
    queryParams.walletId = params.walletId;
  }
  if (_.isString(params.enterpriseId)) {
    queryParams.enterprise = params.enterpriseId;
  }

  if (Object.keys(queryParams).length !== 1) {
    throw new Error('must provide exactly 1 of walletId or enterpriseId to get pending approvals on');
  }

  const self = this;
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

  const self = this;
  return this.bitgo.get(this.baseCoin.url('/pendingapprovals/' + params.id))
  .result()
  .then(function(body) {
    return new self.coinPendingApproval(self.bitgo, self.baseCoin, body);
  })
  .nodeify(callback);
};

module.exports = PendingApprovals;
