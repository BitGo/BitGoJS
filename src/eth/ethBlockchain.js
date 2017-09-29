//
// EthBlockchain Object
// BitGo accessor to a any Bitcoin address.
// Using this does not require authentication and is unrelated to BitGo wallet management.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

require('superagent');
const common = require('../common');

//
// Constructor
// TODO: WORK IN PROGRESS!
// @param: bitgo Instance of BitGoJS
//
const EthBlockchain = function(bitgo) {
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
EthBlockchain.prototype.getAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  return this.bitgo.get(this.bitgo.url('/eth/address/' + params.address))
  .result()
  .nodeify(callback);
};

//
// Get address transactions
// List the transactions for a given address
// Parameters include:
//   address: the address to get transactions for
//
EthBlockchain.prototype.getAddressTransactions = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  // TODO: support start and limit params
  return this.bitgo.get(this.bitgo.url('/eth/address/' + params.address + '/tx'))
  .result()
  .nodeify(callback);
};

//
// Get transaction
// Fetch transaction details.
//
// Parameters include:
//   id: the transaction id to get
//
EthBlockchain.prototype.getTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return this.bitgo.get(this.bitgo.url('/eth/tx/' + params.id))
  .result()
  .nodeify(callback);
};

//
// Get block
// Fetch block details.
//
// Parameters include:
//   id: the block hash to get, or latest for the latest
//
EthBlockchain.prototype.getBlock = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  return this.bitgo.get(this.bitgo.url('/eth/block/' + params.id))
  .result()
  .nodeify(callback);
};

module.exports = EthBlockchain;
