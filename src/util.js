var Util = module.exports;
var bitcoin = require('bitcoinjs-lib');
var ethUtil = require('ethereumjs-util');
var Big = require('big.js');

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

// Convert a BTC xpub to an Ethereum address (with 0x) prefix
Util.xpubToEthAddress = function(xpub) {
  var hdNode = bitcoin.HDNode.fromBase58(xpub);
  var ethPublicKey = hdNode.keyPair.__Q.getEncoded(false).slice(1);
  return ethUtil.bufferToHex(ethUtil.publicToAddress(ethPublicKey, false));
};

// Convert a BTC xpriv to an Ethereum private key (without 0x prefix)
Util.xprvToEthPrivateKey = function(xprv) {
  var hdNode = bitcoin.HDNode.fromBase58(xprv);
  var ethPrivateKey = hdNode.keyPair.d.toBuffer();
  return ethUtil.setLengthLeft(ethPrivateKey, 32).toString('hex');
};

// Sign a message using Ethereum's ECsign method and return the signature string
Util.ethSignMsgHash = function(msgHash, privKey) {
  var signatureInParts = ethUtil.ecsign(new Buffer(ethUtil.stripHexPrefix(msgHash), 'hex'), new Buffer(privKey, 'hex'));

  // Assemble strings from r, s and v
  var r = ethUtil.setLengthLeft(signatureInParts.r, 32).toString('hex');
  var s = ethUtil.setLengthLeft(signatureInParts.s, 32).toString('hex');
  var v = ethUtil.stripHexPrefix(ethUtil.intToHex(signatureInParts.v));

  // Concatenate the r, s and v parts to make the signature string
  return ethUtil.addHexPrefix(r.concat(s, v));
};

// Convert from wei string (or BN) to Ether (multiply by 1e18)
Util.weiToEtherString = function(wei) {
  var bn = wei;
  if (!(wei instanceof ethUtil.BN)) {
    bn = new ethUtil.BN(wei);
  }
  Big.E_POS = 256;
  Big.E_NEG = -18;
  var weiString = bn.toString(10);
  var big = new Big(weiString);
  // 10^18
  var ether = big.div('1000000000000000000');
  return ether.toPrecision();
};

Util.preparePageableQuery = function(params) {
  var query = {};
  if (params.limit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid limit argument, expecting number');
    }
    query.limit = params.limit;
  }
  if (params.skip) {
    if (typeof(params.skip) != 'number') {
      throw new Error('invalid skip argument, expecting number');
    }
    query.skip = params.skip;
  }
  return query;
};