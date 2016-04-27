var Util = module.exports;
var bitcoin = require('bitcoinjs-lib');

Util.bnToByteArrayUnsigned = function(bn) {
  var ba = bn.abs().toByteArray();
  if (ba.length) {
    if (ba[0] == 0) {
      ba = ba.slice(1);
    }
    return ba.map(function (v) {
      return (v < 0) ? v + 256 : v;
    });
  } else {
    // Empty array, nothing to do
    return ba;
  }
};

Util.p2shMultisigOutputScript = function(m, pubKeys) {
  var redeemScript = bitcoin.script.multisigOutput(2, pubKeys);
  var hash = bitcoin.crypto.hash160(redeemScript);
  return bitcoin.script.scriptHashOutput(hash);
};
