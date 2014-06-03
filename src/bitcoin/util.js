// Bitcoin utility functions

var Crypto = require('./crypto-js/index');
var BigInteger = require('./jsbn/jsbn2');

module.exports = {
  /**
   * Cross-browser compatibility version of Array.isArray.
   */
  isArray: Array.isArray,

  /**
   * Turn an integer into a little-endian array of |length| bytes
   */
  numToBytes: function(num, length, big_endian) {
    if (length === undefined) length = 8;
    if (length === 0) return [];
    if (big_endian) {
      return this.numToBytes(Math.floor(num / 256), length - 1).concat([num % 256]);
    } else {
      return [num % 256].concat(this.numToBytes(Math.floor(num / 256), length - 1));
    }
  },

  bytesToNum: function(bytes) {
    var num = 0;
    var factor = 1;
    for (var i = 0; i < bytes.length; ++i) {
      num += bytes[i] * factor;
      factor *= 256;
    }
    return num;
  },

  /**
   * Turn an integer into a "var_int".
   *
   * "var_int" is a variable length integer used by Bitcoin's binary format.
   *
   * NOTE:  This function was just buggy in the original implementation.
   *
   * Returns a byte array.
   */
  numToVarInt: function (num, big_endian) {
    if (num < 0xfd) {
      // unsigned char
      return [num];
    } else if (num < 0x10000) {
      // unsigned short (LE)
      return [253].concat(this.numToBytes(num, 2, big_endian));
    } else if (num < 0x100000000) {
      // unsigned int (LE)
      return [254].concat(this.numToBytes(num, 4, big_endian)); 
    } else {
      // unsigned long long (LE)
      return [255].concat(this.numToBytes(num, 8, big_endian));
    }
  },

  hexToBytes: Crypto.util.hexToBytes,

  bytesToHex: Crypto.util.bytesToHex,

  /**
   * Calculate RIPEMD160(SHA256(data)).
   *
   * Takes an arbitrary byte array as inputs and returns the hash as a byte
   * array.
   */
  sha256ripe160: function (data) {
    return Crypto.RIPEMD160(Crypto.SHA256(data, {asBytes: true}), {asBytes: true});
  },

  /**
   * Calculate SHA256(SHA256(data)).
   *
   * Takes an arbitrary byte array as inputs and returns the doubly hashed
   * data as a byte array.
   */
  dsha256: function (data) {
    return Crypto.SHA256(Crypto.SHA256(data, { asBytes: true }), { asBytes: true });
  }
};
