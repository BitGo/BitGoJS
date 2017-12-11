const ltcPrototype = require('./ltc').prototype;
const bitcoin = require('bitgo-bitcoinjs-lib');

const Tltc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = {
    magic: 0xd9b4bef9,
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x6f,
    scriptHash: 0x3a,
    wif: 0xb0,
    dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
    dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
    feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
  };
  this.altScriptHash = bitcoin.networks.testnet.scriptHash;
  // support alt destinations on test
  this.supportAltScriptDestination = false;
};

Tltc.prototype = Object.create(ltcPrototype);
Tltc.constructor = Tltc;

Tltc.prototype.getChain = function() {
  return 'tltc';
};

Tltc.prototype.getFullName = function() {
  return 'Testnet Litecoin';
};

module.exports = Tltc;
