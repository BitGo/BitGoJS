const Btc = require('./btc');
const bitcoin = require('bitcoinjs-lib');
const _ = require('lodash');

const Tbtc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Tbtc.prototype;
  this.network = bitcoin.networks.testnet;
};

Tbtc.prototype.__proto__ = Btc.prototype;

Tbtc.prototype.getChain = function() {
  return 'tbtc';
};

module.exports = Tbtc;
