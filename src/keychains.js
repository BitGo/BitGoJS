//
// Keychains Object
// BitGo accessor to a user's keychain.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BIP32 = require('./bitcoin/bip32');
var SecureRandom = require('./bitcoin/jsbn/rng');
var Util = require('./bitcoin/util');
var common = require('./common');

//
// Constructor
//
var Keychains = function(bitgo) {
  this.bitgo = bitgo;
};

//
// isValid
// Tests a xpub or xprv string to see if it is a valid keychain.
//
Keychains.prototype.isValid = function(params) {
  params = params || {};
  common.validateParams(params, [], []);

  if (typeof(params.key) != 'string' && typeof(params.key) != 'object') {
    throw new Error('key must be a string or object');
  }

  try {
    var bip32 = new BIP32(params.key);
    return true;
  } catch (e) {
    return false;
  }
};

//
// create
// Create a new keychain locally.
// Does not send the keychain to bitgo, only creates locally.
// If |seed| is provided, used to seed the keychain.  Otherwise,
// a random keychain is created.
//
Keychains.prototype.create = function(params) {
  params = params || {};
  common.validateParams(params, [], []);

  if (!params.seed) {
    params.seed = new Array(256);
    new SecureRandom().nextBytes(params.seed);
  } else {
    if (!Array.isArray(params.seed)) {
      throw new Error('invalid argument');
    }
  }

  var extendedKey = new BIP32().initFromSeed(Util.bytesToHex(params.seed));
  return {
    xpub: extendedKey.extended_public_key_string(),
    xprv: extendedKey.extended_private_key_string()
  };
};

//
// list
// List the user's keychains
//
Keychains.prototype.list = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.bitgo.url('/keychain'))
  .result('keychains')
  .nodeify(callback);
};

//
// add
// Add a new keychain
//
Keychains.prototype.add = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['xpub'], ['encryptedXprv'], callback);

  return this.bitgo.post(this.bitgo.url('/keychain'))
  .send({
    xpub: params.xpub,
    encryptedXprv: params.encryptedXprv
  })
  .result()
  .nodeify(callback);
};

//
// addBitGo
// Add a new BitGo server keychain
//
Keychains.prototype.createBitGo = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.post(this.bitgo.url('/keychain/bitgo'))
  .send({})
  .result()
  .nodeify(callback);
};

//
// get
// Fetch an existing keychain
// Parameters include:
//   xpub:  the xpub of the key to lookup (required)
//
Keychains.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['xpub'], [], callback);

  return this.bitgo.post(this.bitgo.url('/keychain/' + params.xpub))
  .send({})
  .result()
  .nodeify(callback);
};

//
// update
// Update an existing keychain
// Parameters include:
//   xpub:  the xpub of the key to lookup (required)
//
Keychains.prototype.update = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['xpub'], ['encryptedXprv'], callback);

  return this.bitgo.put(this.bitgo.url('/keychain/' + params.xpub))
  .send({
    encryptedXprv: params.encryptedXprv,
  })
  .result()
  .nodeify(callback);
};


module.exports = Keychains;
