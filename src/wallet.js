//
// Wallet Object
// BitGo accessor for a specific wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

//
// Constructor
//
var Wallet = function(bitgo, wallet) {
  this.bitgo = bitgo;
  this.wallet = wallet;
  this.keychains = [];
  if (wallet.private) {
    this.keychains.push(wallet.private.userKeychain.xpub);
    this.keychains.push(wallet.private.backupKeychain.xpub);
    this.keychains.push(wallet.private.bitgoKeychain.xpub);
  }
};

//
// address
// Get the address of this wallet.
//
Wallet.prototype.address = function() {
  return this.wallet.id;
}

//
// type
// Get the type of this wallet (e.g. 'bitcoin').
//
Wallet.prototype.type = function() {
  return this.wallet.type;
}


//
// label
// Get the label of this wallet.
//
Wallet.prototype.label = function() {
  return this.wallet.label;
}

//
// balance
// Get the balance of this wallet.
//
Wallet.prototype.balance = function() {
  return this.wallet.balance;
}

//
// pendingBalance
// Get the pendingBalance of this wallet.
//
Wallet.prototype.pendingBalance = function() {
  return this.wallet.pendingBalance;
}

//
// availableBalance
// Get the availableBalance of this wallet.
//
Wallet.prototype.availableBalance = function() {
  return this.wallet.availableBalance;
}

//
// createAddress
// Creates a new address for use with this wallet.
// Options include:
//   internal: a flag if this should be an internal or external chain
//
Wallet.prototype.createAddress = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var url = this.bitgo._baseUrl + '/address/chain/' + this.type() + '/' + this.address();
  var self = this;
  this.bitgo.post(url)
  .send({
    internal: options.internal
  })
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

  var url = this.bitgo._baseUrl + '/addresses/' + this.type() + '/' + this.address();
  var self = this;
  this.bitgo.del(url)
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
//
Wallet.prototype.unspents = function(callback) {
  throw new Error('not implemented');
};

//
// transactions
// List the transactions for a given wallet
// Inputs: {
// }
// Returns: {
// }
//
Wallet.prototype.transactions = function() {
  throw new Error('not implemented');
};

//
// send
// Create a transaction and send it.
// Inputs:
// Returns:
//
Wallet.prototype.send = function() {
  throw new Error('not implemented');
}

module.exports = Wallet;
