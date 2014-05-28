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
  numToBytes: function(num, length) {
    if (length === undefined) length = 8;
    if (length === 0) return [];
    return [num % 256].concat(this.numToBytes(Math.floor(num / 256), length - 1));
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
  numToVarInt: function (i) {
    if (i < 0xfd) {
      // unsigned char
      return [i];
    } else if (i < 0x10000) {
      // unsigned short (LE)
      return [0xfd, i & 255, i >>> 8];    // little endian!
    } else if (i < 0x100000000) {
      // unsigned int (LE)
      return [0xfe].concat(Crypto.util.wordsToBytes([i]).reverse());  // little endian!
    } else {
      throw "long long not implemented";
      // unsigned long long (LE)
      //return [0xff].concat(Crypto.util.wordsToBytes([i >>> 32, i]).reverse());
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
