var Btc = require('./btc');
var common = require('../../common');
var bitcoin = require('bitcoinjs-lib');
var _ = require('lodash');

var Tbtc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Tbtc.prototype;
  this.network = bitcoin.networks.testnet;
};

Tbtc.prototype.__proto__ = Btc.prototype;

module.exports = Tbtc;
