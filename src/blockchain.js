//
// Address Object
// BitGo accessor to a any Bitcoin address.
// Using this does not require authentication and is unrelated to BitGo wallet management.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');
var common = require('./common');

//
// Constructor
//
var Blockchain = function(bitgo) {
  this.bitgo = bitgo;
};

//
// Get an address
// Fetch an address summary information.
// Includes balance and pending balance.
//
// Parameters include:
//   address: the address to get
//
Blockchain.prototype.getAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;
  this.bitgo.get(this.bitgo.url("/address/" + params.address))
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body);
  });
};

//
// Get address transactions
// List the transactions for a given address
// Parameters include:
//   address: the address to get transactions for
//
Blockchain.prototype.getAddressTransactions = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;
  // TODO: support start and limit params
  this.bitgo.get(this.bitgo.url("/address/" + params.address + "/tx"))
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    // TODO:  Get the address labels and prettify these?
    callback(null, res.body);
  });
};

//
// Unspent Transactions
// List the unspent outputs for a given address
// Parameters include:
//   address: the address to get unspent transactions
//   limit: return enough unspents to accumulate to at least this amount (in satoshis).
//
Blockchain.prototype.getAddressUnspents = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var url = this.bitgo.url("/address/" + params.address + '/unspents');
  if (params.limit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid limit - number expected');
    }
    url += '?limit=' + (params.limit * 1e8);
  }

  var self = this;
  this.bitgo.get(url)
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body.unspents);
  });
};

//
// Get transaction
// Fetch transaction details.
//
// Parameters include:
//   id: the transaction id to get
//
Blockchain.prototype.getTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;
  this.bitgo.get(this.bitgo.url("/tx/" + params.id))
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body);
  });
};

module.exports = Blockchain;
