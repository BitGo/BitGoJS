var Base58 = require('./base58');
var BigInteger = require('./jsbn/jsbn2');
var Crypto = require('./crypto-js/index');
var ECDSA = require('./ecdsa');
var Util = require('./util');
var sec = require('./jsbn/sec');

// TODO:  Add BIP38

var ecparams = sec.getSECCurveByName("secp256k1");

var ECKey = function (input) {
  if (!input) {
    // Generate new key
    var n = ecparams.getN();
    this.priv = ECDSA.getBigRandom(n);
  } else if (input instanceof BigInteger) {
    // Input is a private key value
    this.priv = input;
  } else if (Util.isArray(input)) {
    // Prepend zero byte to prevent interpretation as negative integer
    this.priv = BigInteger.fromByteArrayUnsigned(input);
  } else if ("string" == typeof input) {
    var bytes = null;
    if (ECKey.isWalletImportFormat(input)) {
      bytes = ECKey.decodeWalletImportFormat(input);
    } else if (ECKey.isCompressedWalletImportFormat(input)) {
      bytes = ECKey.decodeCompressedWalletImportFormat(input);
      this.compressed = true;
    } else if (ECKey.isMiniFormat(input)) {
      bytes = Crypto.SHA256(input, { asBytes: true });
    } else if (ECKey.isHexFormat(input)) {
      bytes = Crypto.util.hexToBytes(input);
    } else if (ECKey.isBase64Format(input)) {
      bytes = Crypto.util.base64ToBytes(input);
    }

    if (bytes == null || bytes.length != 32) {
      this.priv = null;
    } else {
      // Prepend zero byte to prevent interpretation as negative integer
      this.priv = BigInteger.fromByteArrayUnsigned(bytes);
    }
  }

  this.compressed = (this.compressed == undefined) ? !!ECKey.compressByDefault : this.compressed;
};

ECKey.privateKeyPrefix = 0x80; // mainnet 0x80    testnet 0xEF

/**
 * Whether public keys should be returned compressed by default.
 */
ECKey.compressByDefault = false;

/**
 * Set whether the public key should be returned compressed or not.
 */
ECKey.prototype.setCompressed = function (v) {
  this.compressed = !!v;
  if (this.pubPoint) this.pubPoint.compressed = this.compressed;
  return this;
};

/**
 * Return public key as a byte array in DER encoding.
 */
ECKey.prototype.getPub = function () {
  if (this.compressed) {
    if (this.pubComp) return this.pubComp;
    return this.pubComp = this.getPubPoint().getEncoded(1);
  } else {
    if (this.pubUncomp) return this.pubUncomp;
    return this.pubUncomp = this.getPubPoint().getEncoded(0);
  }
};

/**
 * Return public point as ECPoint object.
 */
ECKey.prototype.getPubPoint = function () {
  if (!this.pubPoint) {
    this.pubPoint = ecparams.getG().multiply(this.priv);
    this.pubPoint.compressed = this.compressed;
  }
  return this.pubPoint;
};

/**
 * Return public key as hexadecimal string.
 */
ECKey.prototype.getPubKeyHex = function () {
  if (this.compressed) {
    if (this.pubKeyHexComp) return this.pubKeyHexComp;
    return this.pubKeyHexComp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
  } else {
    if (this.pubKeyHexUncomp) return this.pubKeyHexUncomp;
    return this.pubKeyHexUncomp = Crypto.util.bytesToHex(this.getPub()).toString().toUpperCase();
  }
};

/**
 * Get the pubKeyHash for this key.
 *
 * This is calculated as RIPE160(SHA256([encoded pubkey])) and returned as
 * a byte array.
 */
ECKey.prototype.getPubKeyHash = function () {
  if (this.compressed) {
    if (this.pubKeyHashComp) return this.pubKeyHashComp;
    return this.pubKeyHashComp = Util.sha256ripe160(this.getPub());
  } else {
    if (this.pubKeyHashUncomp) return this.pubKeyHashUncomp;
    return this.pubKeyHashUncomp = Util.sha256ripe160(this.getPub());
  }
};

ECKey.prototype.getBitcoinAddress = function () {
  var Address = require('./address');

  var hash = this.getPubKeyHash();
  var addr = new Address(hash);
  return addr;
};

/*
 * Portions of the chaining code were taken from the javascript
 * armory code included in brainwallet.github.org.
 */


/**
 * Chain a key to create a new key.  If this key is based from a private
 * key, it will create a private key chain.
 *
 * If this key is based on a public key, it will generate the public key of the chain.
 *
 * Chaincode must be a securely generated 32Byte random number.
 */
ECKey.createPubKeyFromChain = function(pubKey, chainCode) {
  if (!Util.isArray(chainCode)) {
    throw('chaincode must be a byte array');
  }
  var chainXor = Crypto.SHA256(Crypto.SHA256(pubKey, {asBytes: true}), {asBytes: true});
  for (var i = 0; i < 32; i++)
      chainXor[i] ^= chainCode[i];

  var A = BigInteger.fromByteArrayUnsigned(chainXor);
  var pt = ECPointFp.decodeFrom(ecparams.getCurve(), pubKey).multiply(A);

  var newPub = pt.getEncoded();
  return newPub;
};

ECKey.createECKeyFromChain = function(privKey, chainCode) {
  if (!Util.isArray(chainCode)) {
    throw('chaincode must be a byte array');
  }
  var eckey;
  if (privKey instanceof ECKey) {
    eckey = privKey;
  } else {
    eckey = new ECKey(privKey);
  }
  var privKey = eckey.priv;

  // TODO:  Fix this stateful compressed/uncompressed nonsense, as it is totally broken.
  // The API is stateful where you set this flag, and that determines how a pubkey is
  // returned from getPub?  Really?  Who thought up that meathead API.
  // Now we have a library where some methods require uncompressed, others compressed.  This one,
  // requires uncompressed - err - it really doesn't matter, BUT USE ONE OR THE OTHER!!! The only
  // thing that doesn't work is both.   So always use UNCOMPRESSED.
  // BIP32 only hands back COMPRESSED.  This entire library needs to be redone without stateful
  // pubkey types.  There is NO REASON for these bugs.

  var wasCompressed = eckey.compressed;
  if (wasCompressed) {
    eckey.setCompressed(false);
  }
  var pubKey = eckey.getPub();
  if (wasCompressed) {
    eckey.setCompressed(true);
  }

  var chainXor = Crypto.SHA256(Crypto.SHA256(pubKey, {asBytes: true}), {asBytes: true});
  for (var i = 0; i < 32; i++)
      chainXor[i] ^= chainCode[i];

  var A = BigInteger.fromByteArrayUnsigned(chainXor);
  var B = BigInteger.fromByteArrayUnsigned(privKey);
  var C = ecparams.getN();
  var secexp = (A.multiply(B)).mod(C);
  var pt = ecparams.getG().multiply(secexp);

  var newPriv = secexp ? secexp.toByteArrayUnsigned() : [];
  return new ECKey(newPriv);
};

/**
 * Takes a public point as a hex string or byte array
 */
ECKey.prototype.setPub = function (pub) {
  // byte array
  if (Util.isArray(pub)) {
    pub = Crypto.util.bytesToHex(pub).toString().toUpperCase();
  }
  var ecPoint = ecparams.getCurve().decodePointHex(pub);
  this.setCompressed(ecPoint.compressed);
  this.pubPoint = ecPoint;
  return this;
};

/**
 * Private key encoded as standard Wallet Import Format (WIF)
 */
ECKey.prototype.getWalletImportFormat = function () {
  var bytes = this.getPrivateKeyByteArray();
  bytes.unshift(ECKey.privateKeyPrefix); // prepend 0x80 byte
  if (this.compressed) bytes.push(0x01); // append 0x01 byte for compressed format
  var checksum = Util.dsha256(bytes);
  bytes = bytes.concat(checksum.slice(0, 4));
  var privWif = Base58.encode(bytes);
  return privWif;
};

/**
 * Private key encoded per BIP-38 (password encrypted, checksum,  base58)
 */
ECKey.prototype.getEncryptedFormat = function (passphrase) {
  return BIP38.encode(this, passphrase);
}

/**
 * Private key encoded as hexadecimal string.
 */
ECKey.prototype.getHexFormat = function () {
  return Crypto.util.bytesToHex(this.getPrivateKeyByteArray()).toString().toUpperCase();
};

/**
 * Private key encoded as Base64 string.
 */
ECKey.prototype.getBase64Format = function () {
  return Crypto.util.bytesToBase64(this.getPrivateKeyByteArray());
};

/**
 * Private key encoded as raw byte array.
 */
ECKey.prototype.getPrivateKeyByteArray = function () {
  // Get a copy of private key as a byte array
  var bytes = this.priv.toByteArrayUnsigned();
  // zero pad if private key is less than 32 bytes 
  while (bytes.length < 32) bytes.unshift(0x00);
  return bytes;
};

ECKey.prototype.toString = function (format) {
  format = format || "";
  if (format.toString().toLowerCase() == "base64" || format.toString().toLowerCase() == "b64") {
    return this.getBase64Format(); // Base 64
  } else if (format.toString().toLowerCase() == "wif") {
    return this.getWalletImportFormat(); // Wallet Import Format
  } else {
    return this.getHexFormat(); // Hex
  }
};

ECKey.prototype.sign = function (hash) {
  return ECDSA.sign(hash, this.priv);
};

ECKey.prototype.verify = function (hash, sig) {
  return ECDSA.verify(hash, sig, this.getPubPoint());
};

/**
 * Parse a wallet import format private key contained in a string.
 */
ECKey.decodeWalletImportFormat = function (privStr) {
  var bytes = Base58.decode(privStr);

  var hash = bytes.slice(0, 33);

  var checksum = Util.dsha256(hash);

  if (checksum[0] != bytes[33] ||
      checksum[1] != bytes[34] ||
      checksum[2] != bytes[35] ||
      checksum[3] != bytes[36]) {
    throw "Checksum validation failed!";
  }

  var version = hash.shift();

  if (version != ECKey.privateKeyPrefix) {
    throw "Version "+version+" not supported!";
  }

  return hash;
};

/**
 * Parse a compressed wallet import format private key contained in a string.
 */
ECKey.decodeCompressedWalletImportFormat = function (privStr) {
  var bytes = Base58.decode(privStr);
  var hash = bytes.slice(0, 34);
  var checksum = Util.dsha256(hash);
  if (checksum[0] != bytes[34] ||
    checksum[1] != bytes[35] ||
    checksum[2] != bytes[36] ||
    checksum[3] != bytes[37]) {
      throw "Checksum validation failed!";
    }
  var version = hash.shift();
  if (version != ECKey.privateKeyPrefix) {
    throw "Version " + version + " not supported!";
  }
  hash.pop();
  return hash;
};

/**
 * Parse and decrypt a key encoded as a BIP38 string.
 */
ECKey.decodeEncryptedFormat = function (base58Encrypted, passphrase) {
  return BIP38.decode(base58Encrypted, passphrase);
}

/**
 * Detects keys in hex format (64 characters [0-9A-F]).
 */
ECKey.isHexFormat = function (key) {
  key = key.toString();
  return /^[A-Fa-f0-9]{64}$/.test(key);
};

/**
 * Detects keys in base58 format (51 characters base58, always starts with a '5')
 */
ECKey.isWalletImportFormat = function (key) {
  key = key.toString();
  return (ECKey.privateKeyPrefix == 0x80) ?
    (/^5[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(key)) :
    (/^9[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{50}$/.test(key));
};

/**
 * Detects keys in standard Wallet Import Format (52 characters base58)
 */
ECKey.isCompressedWalletImportFormat = function (key) {
  key = key.toString();
  return (ECKey.privateKeyPrefix == ECKey.privateKeyPrefix) ?
    (/^[LK][123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(key)) :
    (/^c[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{51}$/.test(key));
};

/**
 * Detects keys in base64 format (44 characters)
 */
ECKey.isBase64Format = function (key) {
  key = key.toString();
  return (/^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789=+\/]{44}$/.test(key));
};

/**
 * Detects keys in 'mini' format (22, 26 or 30 characters, always starts with an 'S')
 */
ECKey.isMiniFormat = function (key) {
  key = key.toString();
  var validChars22 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{21}$/.test(key);
  var validChars26 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25}$/.test(key);
  var validChars30 = /^S[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{29}$/.test(key);
  var testBytes = Crypto.SHA256(key + "?", { asBytes: true });

  return ((testBytes[0] === 0x00 || testBytes[0] === 0x01) && (validChars22 || validChars26 || validChars30));
};

/**
 * Detects keys encrypted according to BIP-38 (58 base58 characters starting with 6P)
 */
ECKey.isBIP38Format = function (string) { return BIP38.isBIP38Format(string); };

module.exports = ECKey;
