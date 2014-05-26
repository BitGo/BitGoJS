var Base58 = require('./base58');
var Crypto = require('./crypto-js/index');
var Script = require('./script');
var Util = require('./util');

var Address = function (input, version) {
  var ECKey = require('./eckey');

  if ("string" == typeof input) {
    this.fromString(input);
    return this;
  }

  if (input instanceof ECKey) {
    input = input.getPubKeyHash();
  }

  if (!(input instanceof Array)) {
    throw new Error("can't convert to address");
  }

  this.hash = input;
  this.version = version || Address.pubKeyHashVersion;
};

/**
 * Serialize this object as a standard Bitcoin address.
 *
 * Returns the address as a base58-encoded string in the standardized format.
 */
Address.prototype.toString = function () {
  // Get a copy of the hash
  var hash = this.hash.slice(0);

  // Version
  hash.unshift(this.version);

  var checksum = Crypto.SHA256(Crypto.SHA256(hash, {asBytes: true}), {asBytes: true});

  var bytes = hash.concat(checksum.slice(0,4));

  return Base58.encode(bytes);
};

/**
 * Parse a Bitcoin address contained in a string.
 */
Address.prototype.fromString = function (string) {
  var bytes = Base58.decode(string);

  var hash = bytes.slice(0, 21);

  var checksum = Crypto.SHA256(Crypto.SHA256(hash, {asBytes: true}), {asBytes: true});

  if (checksum[0] != bytes[21] ||
      checksum[1] != bytes[22] ||
      checksum[2] != bytes[23] ||
      checksum[3] != bytes[24]) {
    throw "Checksum validation failed!";
  }

  this.version = hash.shift();
  this.hash = hash;

  if (this.version != Address.pubKeyHashVersion &&
      this.version != Address.p2shVersion) {
    throw "Version " + this.version + " not supported!";
  }
};

Address.createMultiSigAddress = function(keys, numRequired) {
  if (numRequired <= 0 || numRequired > keys.length || numRequired > 16) { throw new Error("invalid number of keys required"); }
  if (Object.prototype.toString.call(keys) != '[object Array]') { throw new Error("pub keys should be an array"); }
  for (var index = 0; index < keys.length; ++index) {
    if (Object.prototype.toString.call(keys[index]) != '[object Array]') { throw new Error("pub key #" + index + " is not an array"); }
  }

  var redeemScript = Script.createMultiSigScript(numRequired, keys);
  var bytes = redeemScript.buffer;
  var hash = Util.sha256ripe160(bytes);
  var address = new Address(hash);
  address.redeemScript = bytes;
  address.version = Address.p2shVersion;
  return address;
}

Address.prototype.isP2SHAddress = function() {
  return this.version == Address.p2shVersion;
}

Address.prototype.isPubKeyHashAddress = function() {
  return this.version == Address.pubKeyHashVersion;
}

Address.validate = function(addressString)  {
  try {
    var address = new Address(addressString);
  } catch (e) {
    return false;  // invalid address.
  }
  return true;
}

// Create a bitcoin address from a public key.
Address.fromPubKey = function(pubKey) {
  return new Address(Util.sha256ripe160(pubKey));
}

module.exports = Address;
