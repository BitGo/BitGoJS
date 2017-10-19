const bchPrototype = require('./bch').prototype;
const bitcoin = require('bitcoinjs-lib');

const Tbch = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = bitcoin.networks.testnet;
};

Tbch.prototype = Object.create(bchPrototype);
Tbch.constructor = Tbch;

Tbch.prototype.getChain = function() {
  return 'tbch';
};

module.exports = Tbch;
