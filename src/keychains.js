//
// Keychains Object
// BitGo accessor to a user's keychain.
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var crypto = require('crypto');
var common = require('./common');
var Util = require('./util');
var bitcoin = require('./bitcoin');
var ethereumUtil = require('ethereumjs-util');

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

  if (params.ethAddress) {
    if (typeof(params.ethAddress) != 'string') {
      throw new Error('ethAddress must be a string');
    }
    return ethereumUtil.isValidAddress(params.ethAddress);
  }

  if (typeof(params.key) != 'string' && typeof(params.key) != 'object') {
    throw new Error('key must be a string or object');
  }

  try {
    if (!params.key.path) {
      bitcoin.HDNode.fromBase58(params.key);
    } else {
      var hdnode = bitcoin.HDNode.fromBase58(params.key.xpub);
      bitcoin.hdPath(hdnode).derive(params.key.path);
    }
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

  var seed;
  if (!params.seed) {
    // An extended private key has both a normal 256 bit private key and a 256
    // bit chain code, both of which must be random. 512 bits is therefore the
    // maximum entropy and gives us maximum security against cracking.
    seed = crypto.randomBytes(512 / 8);
  } else {
    seed = params.seed;
  }

  var extendedKey = bitcoin.HDNode.fromSeedBuffer(seed);
  var xpub = extendedKey.neutered().toBase58();
  return {
    xpub: xpub,
    xprv: extendedKey.toBase58(),
    ethAddress: Util.xpubToEthAddress(xpub)
  };
};

//
// deriveLocal
// Locally derives a keychain from a top level BIP32 string, given a path.
//
Keychains.prototype.deriveLocal = function(params) {
  params = params || {};
  common.validateParams(params, ['path'], ['xprv', 'xpub']);

  if (!params.xprv && !params.xpub) {
    throw new Error("must provide an xpub or xprv for derivation.");
  }
  if (params.xprv && params.xpub) {
    throw new Error("cannot provide both xpub and xprv");
  }

  var hdNode;
  try {
    hdNode = bitcoin.HDNode.fromBase58(params.xprv || params.xpub);
  } catch (e) {
    throw apiResponse(400, {}, "Unable to parse the xprv or xpub");
  }

  var derivedNode;
  try {
    derivedNode = bitcoin.hdPath(hdNode).derive(params.path);
  } catch (e) {
    throw apiResponse(400, {}, "Unable to derive HD key from path");
  }

  var xpub = derivedNode.neutered().toBase58();
  return {
    path: params.path,
    xpub: xpub,
    xprv: params.xprv && derivedNode.toBase58(),
    ethAddress: Util.xpubToEthAddress(xpub)
  }
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
  .then(function(keychains){
    keychains.map(function(keychain) {
      if (keychain.xpub && keychain.ethAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
        throw new Error('ethAddress and xpub do not match');
      }
    });
    return keychains;
  })
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
  .send(params)
  .result()
  .then(function(keychain){
    if (keychain.xpub && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};

//
// createBitGo
// Add a new BitGo server keychain
//
Keychains.prototype.createBitGo = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.post(this.bitgo.url('/keychain/bitgo'))
  .send(params)
  .result()
  .then(function(keychain){
    if (keychain.xpub && keychain.ethAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};

//
// createBackup
// Create a new backup keychain through bitgo - often used for creating a keychain on a KRS
//
Keychains.prototype.createBackup = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['provider'], [], callback);

  return this.bitgo.post(this.bitgo.url('/keychain/backup'))
  .send(params)
  .result()
  .then(function(keychain){
    // not all keychains have an xpub
    if (keychain.xpub && keychain.ethAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
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
  common.validateParams(params, [], ['xpub', 'ethAddress'], callback);

  if (!params.xpub && !params.ethAddress) {
    throw new Error('xpub or ethAddress must be defined');
  }

  var id = params.xpub || params.ethAddress;
  return this.bitgo.post(this.bitgo.url('/keychain/' + encodeURIComponent(id)))
  .send({})
  .result()
  .then(function(keychain){
    if (keychain.xpub && keychain.ethAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
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
    encryptedXprv: params.encryptedXprv
  })
  .result()
  .then(function(keychain){
    if (keychain.xpub && keychain.ethAddress && keychain.ethAddress !== Util.xpubToEthAddress(keychain.xpub)) {
      throw new Error('ethAddress and xpub do not match');
    }
    return keychain;
  })
  .nodeify(callback);
};


module.exports = Keychains;
