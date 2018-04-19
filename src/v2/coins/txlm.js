const xlmPrototype = require('./xlm').prototype;

const Txlm = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
};

Txlm.prototype = Object.create(xlmPrototype);
Txlm.constructor = Txlm;

Txlm.prototype.getChain = function() {
  return 'txlm';
};

Txlm.prototype.getRippledUrl = function() {
  return 'https://s.altnet.rippletest.net:51234';
};

Txlm.prototype.getFullName = function() {
  return 'Testnet Stellar';
};

module.exports = Txlm;
