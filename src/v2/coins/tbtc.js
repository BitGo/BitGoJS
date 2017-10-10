const btcPrototype = require('./btc').prototype;
const bitcoin = require('bitcoinjs-lib');

const Tbtc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = bitcoin.networks.testnet;
};

Tbtc.prototype = Object.create(btcPrototype);
Tbtc.constructor = Tbtc;

Tbtc.prototype.getChain = function() {
  return 'tbtc';
};

module.exports = Tbtc;
