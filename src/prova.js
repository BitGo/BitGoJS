const common = require('./common');
const prova = require('prova-lib');

prova.getNetwork = function() {
  return prova.networks[common.getRmgNetwork()];
};

prova.makeRandomKey = function() {
  return prova.ECPair.makeRandom({ network: prova.getNetwork() });
};

module.exports = prova;
