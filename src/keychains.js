//
// Keychains Object
// BitGo accessor to a user's keychain.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var request = require('superagent');
var BIP32 = require('./bitcoin/bip32');
var SecureRandom = require('./bitcoin/jsbn/rng');
var Util = require('./bitcoin/util');

//
// Constructor
//
var Keychains = function(bitgo) {
  this.bitgo = bitgo;
};

//
// create
// Create a new keychain locally.
// Does not send the keychain to bitgo, only creates locally.
// If |seed| is provided, used to seed the keychain.  Otherwise,
// a random keychain is created.
//
Keychains.prototype.create = function(seed) {
  if (!seed) {
    seed = new Array(256);
    new SecureRandom().nextBytes(seed);
  }
  var extendedKey = new BIP32().initFromSeed(Util.bytesToHex(seed));
  return {
    xpub: extendedKey.extended_public_key_string(),
    xprv: extendedKey.extended_private_key_string()
  };
}

//
// list
// List the user's keychains
//
Keychains.prototype.list = function(callback) {
  var url = this.bitgo._baseUrl + '/keychains';
  this.bitgo._agent
  .get(url)
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    callback(null, res.body.keychains);
  });
};

//
// add
// Add a new keychain
//
Keychains.prototype.add = function(options, callback) {
  var url = this.bitgo._baseUrl + '/keychains';
  this.bitgo._agent
  .post(url)
  .send({
    label: options.label,
    xpub: options.xpub,
    xprv: options.encryptedXprv
  })
  .end(function(err, res) {
    if (err) {
      return callback(err);
    }
    callback(null, res.body);
  });
};

module.exports = Keychains;
