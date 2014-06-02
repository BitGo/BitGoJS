//
// Wallets Object
// BitGo accessor to a user's wallets.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');
var ECKey = require('./bitcoin/eckey');

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
  this.bitgo._agent
  .get(url)
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    callback(null, res.body.addresses);
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
  this.bitgo._agent
  .post(url)
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
    if (err) {
      return callback(err);
    }
    if (res.status != 200) {
      return callback(new Error(res.body.error));
    }
    callback(null, res.body);
  });
};

//
// get
// Fetch an existing wallet
// Options include:
//   type: the type of address (only 'bitcoin' is supported)
//   address: the address of the wallet
//
Wallets.prototype.get = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.address) != 'string' ||
      typeof(options.type) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var url = this.bitgo._baseUrl + '/addresses/' + options.type + '/' + options.address;
  this.bitgo._agent
  .post(url)
  .send({
    gpk: options.otp ? true : false,
    otp: options.otp
  })
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    if (res.status != 200) {
      return callback(new Error(res.body.error));
    }
    callback(null, res.body);
  });
};

//
// chain
// Chain an existing wallet
// Options include:
//   type: the type of address (only 'bitcoin' is supported)
//   address: the address of the wallet
//   internal: a flag if this should be an internal or external chain
//
Wallets.prototype.chain = function(options, callback) {
  if (typeof(options) != 'object' || typeof(options.address) != 'string' ||
      typeof(options.type) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }

  var url = this.bitgo._baseUrl + '/address/chain/' + options.type + '/' + options.address;
  this.bitgo._agent
  .post(url)
  .send({
    internal: options.internal
  })
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    if (res.status != 200) {
      return callback(new Error(res.body.error));
    }
    callback(null, res.body);
  });
};

module.exports = Wallets;
