const xrpPrototype = require('./xrp').prototype;

const Txrp = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
};

Txrp.prototype = Object.create(xrpPrototype);
Txrp.constructor = Txrp;

Txrp.prototype.getChain = function() {
  return 'txrp';
};

Txrp.prototype.getRippledUrl = function() {
  return 'https://s.altnet.rippletest.net:51234';
};

Txrp.prototype.getFullName = function() {
  return 'Testnet Ripple';
};

module.exports = Txrp;
