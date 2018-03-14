const zecPrototype = require('./zec').prototype;

const Tzec = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away

  // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp#L295
  this.network = {
    messagePrefix: '\x19ZCash Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x1d25,
    scriptHash: 0x1cba,
    wif: 0xef,
    dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
    dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
    feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
  };
};

Tzec.prototype = Object.create(zecPrototype);
Tzec.constructor = Tzec;

Tzec.prototype.getChain = function() {
  return 'tzec';
};

Tzec.prototype.getFullName = function() {
  return 'Testnet ZCash';
};

module.exports = Tzec;
