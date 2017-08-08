var Bch = require('./bch');
var bitcoin = require('bcashjs-lib');

var Tbch = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Tbch.prototype;
  this.network = bitcoin.networks.testnet;
};

Tbch.prototype.__proto__ = Bch.prototype;

Tbch.prototype.getChain = function() {
  return 'tbch';
};

module.exports = Tbch;
