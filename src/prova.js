var common = require('./common');
var prova = require('../node_modules/prova/provalib.node');

prova.getNetwork = function() {
  return prova.networks[common.getRmgNetwork()];
};

prova.makeRandomKey = function() {
  return prova.ECPair.makeRandom({ network: prova.getNetwork() });
};

module.exports = prova;
