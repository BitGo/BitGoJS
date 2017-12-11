const btgPrototype = require('./btg').prototype;
const bitcoin = require('bitgo-bitcoinjs-lib');

const Tbtg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = bitcoin.networks.testnet;
};

Tbtg.prototype = Object.create(btgPrototype);
Tbtg.constructor = Tbtg;

Tbtg.prototype.getChain = function() {
  return 'tbtg';
};

Tbtg.prototype.getFullName = function() {
  return 'Testnet Bitcoin Gold';
};

module.exports = Tbtg;
