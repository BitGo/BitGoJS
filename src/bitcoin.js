var common = require('./common');
var bitcoin = require('bitcoinjs-lib');
var ecurve = require('ecurve');
var curve = ecurve.getCurveByName('secp256k1');
var BigInteger = require('bigi');
var createHmac = require('create-hmac');
var HDNode = bitcoin.HDNode;

var secp256k1;

try {
  secp256k1 = require('secp256k1');
} catch (err) {
  console.log('running without secp256k1 acceleration');
}

// Check for IE, and disable secp256k1, due to:
// https://github.com/indutny/bn.js/issues/133
var isIE = (({}).constructor.name === undefined);
if (isIE) {
  secp256k1 = undefined;
}

bitcoin.getNetwork = function() {
  return bitcoin.networks[common.getNetwork()];
};

bitcoin.makeRandomKey = function() {
  return bitcoin.ECPair.makeRandom({ network: bitcoin.getNetwork() });
};

HDNode.prototype.getKey = function(network) {
  network = network || bitcoin.getNetwork();
  var k = this.keyPair;
  var result = new bitcoin.ECPair(k.d, k.d ? null : k.Q, { network: network, compressed: k.compressed });
  // Creating Q from d takes ~25ms, so if it's not created, use native bindings to pre-compute
  if (!result.__Q && secp256k1) {
    result.__Q = ecurve.Point.decodeFrom(curve, secp256k1.publicKeyCreate(k.d.toBuffer(32), false));
  }
  return result;
};

/**
 * Derive a child HDNode from a parent HDNode and index. Uses secp256k1 to speed
 * up public key derivations by 100x vs. bitcoinjs-lib implementation.
 *
 * @param   {HDNode} hdnode  parent HDNode
 * @param   {Number} index   child index
 * @returns {HDNode}         derived HDNode
 */
var deriveFast = function (hdnode, index) {
  // no fast path for private key derivations -- delegate to standard method
  if (!secp256k1 || hdnode.keyPair.d) {
    return hdnode.derive(index);
  }

  var isHardened = index >= bitcoin.HDNode.HIGHEST_BIT;
  if (isHardened) {
    throw new Error('cannot derive hardened key from public key');
  }

  var indexBuffer = new Buffer(4);
  indexBuffer.writeUInt32BE(index, 0);

  var data;

  // data = serP(point(kpar)) || ser32(index)
  //      = serP(Kpar) || ser32(index)
  data = Buffer.concat([
    hdnode.keyPair.getPublicKeyBuffer(),
    indexBuffer
  ]);

  var I = createHmac('sha512', hdnode.chainCode).update(data).digest();
  var IL = I.slice(0, 32);
  var IR = I.slice(32);

  var pIL = BigInteger.fromBuffer(IL);

  // In case parse256(IL) >= n, proceed with the next value for i
  if (pIL.compareTo(curve.n) >= 0) {
    return deriveFast(hdnode, index + 1);
  }

  // Private parent key -> private child key
  var hd;
  // Ki = point(parse256(IL)) + Kpar
  //    = G*IL + Kpar

  // The expensive op is the point multiply -- use secp256k1 lib to do that
  var Ki = ecurve.Point.decodeFrom(curve, secp256k1.publicKeyCreate(IL, false)).add(hdnode.keyPair.Q);

  // In case Ki is the point at infinity, proceed with the next value for i
  if (curve.isInfinity(Ki)) {
    return deriveFast(hdnode, index + 1);
  }

  var keyPair = new bitcoin.ECPair(null, Ki, {network: hdnode.network});
  hd = new bitcoin.HDNode(keyPair, IR);

  hd.depth = hdnode.depth + 1;
  hd.index = index;
  hd.parentFingerprint = hdnode.getFingerprint().readUInt32BE(0);

  return hd;
};

if (secp256k1) {
  bitcoin.ECPair.prototype.sign = function (hash) {
    if (!this.d) {
      throw new Error('Missing private key');
    }
    var sig = secp256k1.sign(hash, this.d.toBuffer(32)).signature;
    return bitcoin.ECSignature.fromDER(secp256k1.signatureExport(sig));
  };

  bitcoin.ECPair.prototype.verify = function (hash, signature) {
    signature = new bitcoin.ECSignature(signature.r, signature.s);
    signature = secp256k1.signatureNormalize(secp256k1.signatureImport(signature.toDER()));
    return secp256k1.verify(hash, signature, this.getPublicKeyBuffer());
  };
}

/**
 *  Derive a BIP32 path, given a root key
 *  We cache keys at each level of hierarchy we derive, to avoid re-deriving (approx 25ms per derivation)
 * @param rootKey key to derive off
 * @param path the path, e.g. 'm/0/0/0/1'
 * @returns {*} the derived hd key
 */
bitcoin.hdPath = function(rootKey) {
  var cache = {};
  var derive = function (path) {
    var components = path.split('/').filter(function (c) {
      return c !== '';
    });
    // strip any extraneous / characters
    path = components.join('/');
    if (cache[path]) {
      return cache[path];
    }
    var len = components.length;
    if (len === 0 || len === 1 && components[0] === 'm') {
      return rootKey;
    }
    var parentPath = components.slice(0, len - 1).join('/');
    var parentKey = derive(parentPath);
    var el = components[len - 1];

    var hardened = false;
    if (el[el.length - 1] === "'") {
      hardened = true;
    }
    var index = parseInt(el);
    var derived;
    if (hardened) {
      derived = parentKey.deriveHardened(index);
    } else {
      derived = deriveFast(parentKey, index);
    }
    cache[path] = derived;
    return derived;
  };

  var deriveKey = function(path) {
    return this.derive(path).getKey();
  };

  return {
    derive: derive,
    deriveKey: deriveKey
  };
};

module.exports = bitcoin;
