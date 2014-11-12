//
// Wallets Object
// BitGo accessor to a user's wallets.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');
var ECKey = require('./bitcoin/eckey');
var Wallet = require('./wallet');

//
// Constructor
//
var Wallets = function(bitgo) {
  this.bitgo = bitgo;
};

//
// list
// List the user's wallets
//
Wallets.prototype.list = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var self = this;
  this.bitgo.get(this.bitgo.url('/wallet'))
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    var wallets = {};
    for (var wallet in res.body.wallets) {
      wallets[wallet] = new Wallet(self.bitgo, res.body.wallets[wallet]);
    }
    callback(null, wallets);
  });
};

//
// createKey
// Create a single bitcoin key.  This runs locally.
// Returns: {
//   address: <address>
//   key: <key, in WIF format>
// }
Wallets.prototype.createKey = function() {
  var key = new ECKey();
  return {
    address: key.getBitcoinAddress(),
    key: key.getWalletImportFormat()
  };
};

//
// add
// Add a new wallet
//    TODO: document options here
//
Wallets.prototype.add = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function' ||
    Array.isArray(options.keychains) === false || typeof(options.m) !== 'number' ||
    typeof(options.n) != 'number') {
    throw new Error('invalid argument');
  }

  // TODO: support more types of multisig
  if (options.m != 2 || options.n != 3) {
    throw new Error('unsupported multi-sig type');
  }
  var self = this;
  var keychains = options.keychains.map(function(k) { return {xpub: k.xpub}; });
  this.bitgo.post(this.bitgo.url('/wallet'))
  .send({
    label: options.label,
    m: options.m,
    n: options.n,
    keychains: keychains
  })
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, new Wallet(self.bitgo, res.body));
  });
};

//
// get
// Fetch an existing wallet
// Options include:
//   address: the address of the wallet
//
Wallets.prototype.get = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.id) != 'string' ||
      typeof(callback) != 'function') {
    throw new Error('invalid arguments: id and callback arguments required.');
  }
  var self = this;
  this.bitgo.get(this.bitgo.url('/wallet/' + options.id))
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, new Wallet(self.bitgo, res.body));
  });
};

module.exports = Wallets;
