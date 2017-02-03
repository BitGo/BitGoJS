var BaseCoin = require('../baseCoin');
var Rmg = require('./rmg');
var common = require('../../common');
var rmgjs = require('rmgjs-lib');
var _ = require('lodash');

var Trmg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Trmg.prototype;
  this.network = rmgjs.networks.aztecTest;
};

Trmg.prototype.__proto__ = Rmg.prototype;

module.exports = Trmg;
