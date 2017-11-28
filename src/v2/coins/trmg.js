const rmgPrototype = require('./rmg').prototype;
const prova = require('../../prova');

const Trmg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = prova.networks.rmgTest;
};

Trmg.prototype = Object.create(rmgPrototype);
Trmg.constructor = Trmg;

Trmg.prototype.getChain = function() {
  return 'trmg';
};

Trmg.prototype.getFullName = function() {
  return 'Testnet Royal Mint Gold';
};


module.exports = Trmg;
