const ethPrototype = require('./eth').prototype;

const Teth = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
};

Teth.prototype = Object.create(ethPrototype);
Teth.constructor = Teth;

Teth.prototype.getChain = function() {
  return 'teth';
};

Teth.prototype.getFullName = function() {
  return 'Testnet Ethereum';
};


module.exports = Teth;
