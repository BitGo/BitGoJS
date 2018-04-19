const stellar = require('stellar-sdk');

stellar.makeRandomKey = function() {
  return stellar.Keypair.random();
};

stellar.makeKeyFromSeed = function(seed) {
  return stellar.Keypair.fromRawEd25519Seed(seed);
};

module.exports = stellar;
