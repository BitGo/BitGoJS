var Btc = require('./btc');
var bitcoin = require('bitcoinjs-lib');
var _ = require('lodash');

var Ltc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Ltc.prototype;
  this.network = bitcoin.networks.litecoin;
};

Ltc.prototype.__proto__ = Btc.prototype;

module.exports = Ltc;
