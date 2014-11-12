//
// Wallet Object
// BitGo accessor for a specific wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var TransactionBuilder = require('./transactionBuilder');

//
// Constructor
//
var Wallet = function(bitgo, wallet) {
  this.bitgo = bitgo;
  this.wallet = wallet;
  this.keychains = [];
  if (wallet.private) {
    this.keychains = wallet.private.keychains;
  }
};

//
// address
// Get the address of this wallet.
//
Wallet.prototype.address = function() {
  return this.wallet.id;
};

//
// label
// Get the label of this wallet.
//
Wallet.prototype.label = function() {
  return this.wallet.label;
};

//
// balance
// Get the balance of this wallet.
//
Wallet.prototype.balance = function() {
  return this.wallet.balance;
};

//
// pendingBalance
// Get the pendingBalance of this wallet.
//
Wallet.prototype.pendingBalance = function() {
  return this.wallet.pendingBalance;
};

//
// availableBalance
// Get the availableBalance of this wallet.
//
Wallet.prototype.availableBalance = function() {
  return this.wallet.availableBalance;
};

Wallet.prototype.url = function(extra) {
  extra = extra || '';
  return this.bitgo.url('/wallet/' + this.address() + extra);
};

//
// createAddress
// Creates a new address for use with this wallet.
//
Wallet.prototype.createAddress = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var chain = options.chain || 0;
  var self = this;
  this.bitgo.post(this.url('/address/' + chain))
  .send({})
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    // TODO:  Should we return a Wallet object here?
    callback(null, res.body);
  });
};


//
// delete
// Deletes the wallet
//
Wallet.prototype.delete = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var self = this;
  this.bitgo.del(this.url())
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, {});
  });
};

//
// unspents
// List the unspents for a given wallet
// Options include:
//   btcLimit:  the limit of unspents to collect in BTC.
//
Wallet.prototype.unspents = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var url = this.url('/unspents');
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
    console.log(res.body);
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body.unspents);
  });
};

//
// transactions
// List the transactions for a given wallet
// Options include:
//     TODO:  Add iterators for start/count/etc
Wallet.prototype.transactions = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var self = this;
  this.bitgo.get(this.url('/tx'))
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    // TODO:  Get the address labels and prettify these?
    callback(null, res.body);
  });
};

//
// createTransaction
// Create a transaction
// Inputs:
//   address  - the address to send to
//   amount   - the amount to send, in satoshis
//   fee      - the blockchain fee to send (use 'undefined' to have BitGo compute the fee)
//   keychain - the keychain to use for signing
// Returns:
//   callback(err, transaction)
//
Wallet.prototype.createTransaction = function(address, amount, fee, keychain, callback) {
  if (typeof(address) != 'string' || typeof(amount) != 'number' ||
      (typeof(fee) != 'number' && typeof(fee) != 'undefined') || typeof(keychain) != 'object' ||
      typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var tb = new TransactionBuilder(this, { address: address, amount: amount }, fee);
  tb.prepare()
    .then(function() {
      return tb.sign(keychain);
    })
    .then(function() {
      callback(null, { tx: tb.tx(), fee: tb.fee });
    })
    .catch(function(e) {
      callback(e);
    });
};

//
// send
// Create a transaction and send it.
// Inputs:
//   tx  - the hex encoded, signed transaction to send
// Returns:
//
Wallet.prototype.send = function(tx, callback) {
  if (typeof(tx) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var self = this;
  this.bitgo.post(this.bitgo.url('/tx/send'))
  .send({ tx: tx })
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, { tx: res.body.transaction, hash: res.body.transactionHash });
  });
};

module.exports = Wallet;
