var Eth = require('./eth');

var Teth = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Teth.prototype;
};

Teth.prototype.__proto__ = Eth.prototype;

module.exports = Teth;
