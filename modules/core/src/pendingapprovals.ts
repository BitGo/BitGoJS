/**
 * @hidden
 */

/**
 */
//
// Pending approvals listing object
// Lists pending approvals and get pending approval objects
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

import * as common from './common';
const PendingApproval = require('./pendingapproval');

//
// Constructor
//
const PendingApprovals = function(bitgo) {
  this.bitgo = bitgo;
};

//
// list
// List the pending approvals available to the user
//
PendingApprovals.prototype.list = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['walletId', 'enterpriseId'], callback);

  const queryParams: any = {};
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
  return Bluebird.resolve(
    this.bitgo.get(this.bitgo.url('/pendingapprovals')).query(queryParams).result()
  ).then(function(body) {
    body.pendingApprovals = body.pendingApprovals.map(function(p) { return new PendingApproval(self.bitgo, p); });
    return body;
  }).nodeify(callback);
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
  return Bluebird.resolve(
    this.bitgo.get(this.bitgo.url('/pendingapprovals/' + params.id)).result()
  ).then(function(body) {
    return new PendingApproval(self.bitgo, body);
  }).nodeify(callback);
};

export = PendingApprovals;
