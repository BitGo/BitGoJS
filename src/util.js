const Util = module.exports;
const bitcoin = require('bitgo-bitcoinjs-lib');
let ethUtil = function() {};
const Big = require('big.js');
const _ = require('lodash');
let isEthAvailable = false;

try {
  ethUtil = require('ethereumjs-util');
  isEthAvailable = true;
} catch (e) {
  // ethereum currently not supported
}

Util.isEthAvailable = function() { return isEthAvailable; };

Util.bnToByteArrayUnsigned = function(bn) {
  let ba = bn.abs().toByteArray();
  if (ba.length) {
    if (ba[0] === 0) {
      ba = ba.slice(1);
    }
    return ba.map(function(v) {
      return (v < 0) ? v + 256 : v;
    });
  } else {
    // Empty array, nothing to do
    return ba;
  }
};

// Generate the output script for a BTC P2SH multisig address
Util.p2shMultisigOutputScript = function(m, pubKeys) {
  const redeemScript = bitcoin.script.multisig.output.encode(m, pubKeys);
  const hash = bitcoin.crypto.hash160(redeemScript);
  return bitcoin.script.scriptHash.output.encode(hash);
};

// Utility method for handling arguments of pageable queries
Util.preparePageableQuery = function(params) {
  const query = {};
  if (params.limit) {
    if (!_.isNumber(params.limit)) {
      throw new Error('invalid limit argument, expecting number');
    }
    query.limit = params.limit;
  }
  if (params.skip) {
    if (!_.isNumber(params.skip)) {
      throw new Error('invalid skip argument, expecting number');
    }
    query.skip = params.skip;
  }
  return query;
};

if (isEthAvailable) {
  // Convert a BTC xpub to an Ethereum address (with 0x) prefix
  Util.xpubToEthAddress = function(xpub) {
    const hdNode = bitcoin.HDNode.fromBase58(xpub);
    const ethPublicKey = hdNode.keyPair.__Q.getEncoded(false).slice(1);
    return ethUtil.bufferToHex(ethUtil.publicToAddress(ethPublicKey, false));
  };

  // Convert a BTC xpriv to an Ethereum private key (without 0x prefix)
  Util.xprvToEthPrivateKey = function(xprv) {
    const hdNode = bitcoin.HDNode.fromBase58(xprv);
    const ethPrivateKey = hdNode.keyPair.d.toBuffer();
    return ethUtil.setLengthLeft(ethPrivateKey, 32).toString('hex');
  };

  // Sign a message using Ethereum's ECsign method and return the signature string
  Util.ethSignMsgHash = function(msgHash, privKey) {
    const signatureInParts = ethUtil.ecsign(new Buffer(ethUtil.stripHexPrefix(msgHash), 'hex'), new Buffer(privKey, 'hex'));

    // Assemble strings from r, s and v
    const r = ethUtil.setLengthLeft(signatureInParts.r, 32).toString('hex');
    const s = ethUtil.setLengthLeft(signatureInParts.s, 32).toString('hex');
    const v = ethUtil.stripHexPrefix(ethUtil.intToHex(signatureInParts.v));

    // Concatenate the r, s and v parts to make the signature string
    return ethUtil.addHexPrefix(r.concat(s, v));
  };

  // Convert from wei string (or BN) to Ether (multiply by 1e18)
  Util.weiToEtherString = function(wei) {
    let bn = wei;
    if (!(wei instanceof ethUtil.BN)) {
      bn = new ethUtil.BN(wei);
    }
    Big.E_POS = 256;
    Big.E_NEG = -18;
    const weiString = bn.toString(10);
    const big = new Big(weiString);
    // 10^18
    const ether = big.div('1000000000000000000');
    return ether.toPrecision();
  };
}
