const btcPrototype = require('./btc').prototype;

const Dash = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away

  // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp#L152
  this.network = {
    messagePrefix: '\x19Dash Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x4c,
    scriptHash: 0x10,
    wif: 0xcc,
    dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
    dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
    feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
  };
};

Dash.prototype = Object.create(btcPrototype);
Dash.constructor = Dash;

Dash.prototype.getChain = function() {
  return 'dash';
};
Dash.prototype.getFamily = function() {
  return 'dash';
};

Dash.prototype.getFullName = function() {
  return 'Dash';
};

Dash.prototype.supportsBlockTarget = function() {
  return false;
};

module.exports = Dash;
