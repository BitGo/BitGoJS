const btcPrototype = require('./btc').prototype;
const zcashjs = require('bitcoinjs-lib-zcash');

const Zec = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away

  // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp#L140
  this.network = {
    messagePrefix: '\x19ZCash Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x1cb8,
    scriptHash: 0x1cbd,
    wif: 0x80,
    dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
    dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
    feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
  };
};

Zec.prototype = Object.create(btcPrototype);
Zec.constructor = Zec;

Zec.prototype.getChain = function() {
  return 'zec';
};
Zec.prototype.getFamily = function() {
  return 'zec';
};

Zec.prototype.getCoinLibrary = function() {
  return zcashjs;
};

Zec.prototype.getFullName = function() {
  return 'ZCash';
};

Zec.prototype.supportsBlockTarget = function() {
  return false;
};

module.exports = Zec;
