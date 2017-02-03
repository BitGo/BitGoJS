var BaseCoin = require('../baseCoin');
var Rmg = require('./rmg');
var common = require('../../common');
var prova = require('prova');
var _ = require('lodash');

var Trmg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Trmg.prototype;
  this.network = prova.networks.rmgTest;
};

Trmg.prototype.__proto__ = Rmg.prototype;

module.exports = Trmg;
