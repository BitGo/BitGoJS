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

  var url = this.bitgo._baseUrl + '/addresses';
  var self = this;
  this.bitgo.get(url)
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    var wallets = {};
    for (var address in res.body.addresses) {
      wallets[address] = new Wallet(self.bitgo, res.body.addresses[address]);
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

  var url = this.bitgo._baseUrl + '/addresses/bitcoin';
  var self = this;
  this.bitgo.post(url)
  .send({
    label: options.label,
    type: 'safehd',
    safehd: {
      m: options.m,
      n: options.n,
      userKeychainXpub: options.keychains[0],
      backupKeychainXpub: options.keychains[1]
    }
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
//   type: the type of address (only 'bitcoin' is supported)
//   address: the address of the wallet
//   otp: the one-time-password for unlocking the private data of the wallet
//
Wallets.prototype.get = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.address) != 'string' ||
      typeof(options.type) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var url = this.bitgo._baseUrl + '/addresses/' + options.type + '/' + options.address;
  var self = this;
  this.bitgo.post(url)
  .send({
    gpk: options.otp ? true : false,
    otp: options.otp
  })
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, new Wallet(self.bitgo, res.body));
  });
};

//
// getWithPrivateInfo
// Fetch an existing wallet with private info.
// This is really just a convenience method to make it more obvious that fetching
// a wallet with private info (which requires OTP) is different from fetching a wallet.
// Options include:
//   type: the type of address (only 'bitcoin' is supported)
//   address: the address of the wallet
//   otp: the one-time-password for unlocking the private data of the wallet
//
Wallets.prototype.getWithPrivateInfo = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.otp) != 'string') {
    throw new Error('invalid argument');
  }
  return this.get(options, callback);
};

module.exports = Wallets;
