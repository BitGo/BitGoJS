const bchPrototype = require('./bch').prototype;
const bitcoinCash = require('bitgo-bitcoinjs-lib');

const Tbch = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = bitcoinCash.networks.testnet;
  this.bchPrefix = 'bchtest';
};

Tbch.prototype = Object.create(bchPrototype);
Tbch.constructor = Tbch;

Tbch.prototype.getChain = function() {
  return 'tbch';
};

Tbch.prototype.getFullName = function() {
  return 'Testnet Bitcoin Cash';
};

module.exports = Tbch;
