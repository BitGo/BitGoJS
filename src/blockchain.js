//
// Address Object
// BitGo accessor to a any Bitcoin address.
// Using this does not require authentication and is unrelated to BitGo wallet management.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');

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
// Options include:
//   address: the address to get
//
Blockchain.prototype.getAddress = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.address) != 'string' ||
  typeof(callback) != 'function') {
    throw new Error('invalid arguments: address and callback arguments required.');
  }
  var self = this;
  this.bitgo.get(this.bitgo.url("/address/" + options.address))
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
// Options include:
//   address: the address to get transactions for
//
Blockchain.prototype.getAddressTransactions = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.address) != 'string' ||
  typeof(callback) != 'function') {
    throw new Error('invalid arguments: address and callback arguments required.');
  }

  var self = this;
  // TODO: support start and limit params
  this.bitgo.get(this.bitgo.url("/address/" + options.address + "/tx"))
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
// Options include:
//   address: the address to get unspent transactions
//   limit: return enough unspents to accumulate to at least this amount (in satoshis).
//
Blockchain.prototype.getAddressUnspents = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.address) != 'string' ||
  typeof(callback) != 'function') {
    throw new Error('invalid arguments: address and callback arguments required.');
  }

  var url = this.bitgo.url("/address/" + options.address + '/unspents');
  if (options.btcLimit) {
    if (typeof(options.limit) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?limit=' + (options.limit * 1e8);
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
// Options include:
//   id: the transaction id to get
//
Blockchain.prototype.getTransaction = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.id) != 'string' ||
  typeof(callback) != 'function') {
    throw new Error('invalid arguments: id and callback arguments required.');
  }
  var self = this;
  this.bitgo.get(this.bitgo.url("/tx/" + options.id))
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body);
  });
};

module.exports = Blockchain;
