var Xrp = require('./xrp');
var _ = require('lodash');

var Txrp = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Txrp.prototype;
  this.network = 'altnet.rippletest.net';
};

Txrp.prototype.__proto__ = Xrp.prototype;

module.exports = Txrp;
