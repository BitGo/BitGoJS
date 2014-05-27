// Bitcoin utility functions

var Crypto = require('./crypto-js/index');

module.exports = {
  /**
   * Cross-browser compatibility version of Array.isArray.
   */
  isArray: Array.isArray || function(o)
  {
    return Object.prototype.toString.call(o) === '[object Array]';
  },

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

  hexToBytes: function(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2) {
      var byte = parseInt(hex.substr(c, 2), 16);
      if (isNaN(byte)) {
        throw 'illegal input';
      }
      bytes.push(byte);
    }
    return bytes;
  },

  bytesToHex: function (bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
      if (bytes[i] > 0xff) {
        throw 'illegal input';
      }
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
  },

  /**
   * Parse a Bitcoin value byte array, returning a BigInteger.
   */
  valueToBigInt: function (valueBuffer)
  {
    if (valueBuffer instanceof BigInteger) return valueBuffer;

    // Prepend zero byte to prevent interpretation as negative integer
    return BigInteger.fromByteArrayUnsigned(valueBuffer);
  },

  /**
   * Format a Bitcoin value as a string.
   *
   * Takes a BigInteger or byte-array and returns that amount of Bitcoins in a
   * nice standard formatting.
   *
   * Examples:
   * 12.3555
   * 0.1234
   * 900.99998888
   * 34.00
   */
  formatValue: function (valueBuffer) {
    var value = this.valueToBigInt(valueBuffer).toString();
    var integerPart = value.length > 8 ? value.substr(0, value.length-8) : '0';
    var decimalPart = value.length > 8 ? value.substr(value.length-8) : value;
    while (decimalPart.length < 8) decimalPart = "0"+decimalPart;
    decimalPart = decimalPart.replace(/0*$/, '');
    while (decimalPart.length < 2) decimalPart += "0";
    return integerPart+"."+decimalPart;
  },

  /**
   * Parse a floating point string as a Bitcoin value.
   *
   * Keep in mind that parsing user input is messy. You should always display
   * the parsed value back to the user to make sure we understood his input
   * correctly.
   */
  parseValue: function (valueString) {
    // TODO: Detect other number formats (e.g. comma as decimal separator)
    var valueComp = valueString.split('.');
    var integralPart = valueComp[0];
    var fractionalPart = valueComp[1] || "0";
    while (fractionalPart.length < 8) fractionalPart += "0";
    fractionalPart = fractionalPart.replace(/^0+/g, '');
    var value = BigInteger.valueOf(parseInt(integralPart));
    value = value.multiply(BigInteger.valueOf(100000000));
    value = value.add(BigInteger.valueOf(parseInt(fractionalPart)));
    return value;
  },

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
