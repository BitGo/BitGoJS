/**
 * @hidden
 */

/**
 */
import * as common from './common';
import * as utxolib from '@bitgo/utxo-lib';
import { V1Network } from './v2/types';
const ecurve = require('ecurve');
const curve = ecurve.getCurveByName('secp256k1');
const BigInteger = require('bigi');
const createHmac = require('create-hmac');

let secp256k1: typeof import('secp256k1') | undefined;

try {
  secp256k1 = require('secp256k1');
} catch (err) {
  console.log('running without secp256k1 acceleration');
}

export function getNetwork(network?: V1Network): utxolib.Network {
  network = network || common.getNetwork();
  return utxolib.networks[network];
}

export function makeRandomKey(): utxolib.ECPair {
  return utxolib.ECPair.makeRandom({ network: getNetwork() });
}

/** @deprecated - use bip32 package instead */
function getKey(network?: utxolib.Network): utxolib.ECPair {
  network = network || getNetwork();
  const k = this.keyPair;
  const result = new utxolib.ECPair(k.d, k.d ? null : k.Q, { network: network, compressed: k.compressed });
  // Creating Q from d takes ~25ms, so if it's not created, use native bindings to pre-compute
  if (!result.__Q && secp256k1) {
    result.__Q = ecurve.Point.decodeFrom(curve, Buffer.from(secp256k1.publicKeyCreate(k.d.toBuffer(32), false)));
  }
  return result;
}

/** @deprecated - use bip32 package instead */
utxolib.HDNode.prototype.getKey = getKey;

/** @deprecated - use bip32 package instead */
function deriveFast(hdnode: utxolib.HDNode, index: number): utxolib.HDNode {
  // no fast path for private key derivations -- delegate to standard method
  if (!secp256k1 || hdnode.keyPair.d) {
    return hdnode.derive(index);
  }

  const isHardened = index >= utxolib.HDNode.HIGHEST_BIT;
  if (isHardened) {
    throw new Error('cannot derive hardened key from public key');
  }

  const indexBuffer = Buffer.alloc(4);
  indexBuffer.writeUInt32BE(index, 0);

  // data = serP(point(kpar)) || ser32(index)
  //      = serP(Kpar) || ser32(index)
  const data = Buffer.concat([
    hdnode.keyPair.getPublicKeyBuffer(),
    indexBuffer,
  ]);

  const I = createHmac('sha512', hdnode.chainCode).update(data).digest();
  const IL = I.slice(0, 32);
  const IR = I.slice(32);

  const pIL = BigInteger.fromBuffer(IL);

  // In case parse256(IL) >= n, proceed with the next value for i
  if (pIL.compareTo(curve.n) >= 0) {
    return deriveFast(hdnode, index + 1);
  }

  // Private parent key -> private child key
  // Ki = point(parse256(IL)) + Kpar
  //    = G*IL + Kpar

  // The expensive op is the point multiply -- use secp256k1 lib to do that
  const Ki = ecurve.Point.decodeFrom(curve, Buffer.from(secp256k1.publicKeyCreate(IL, false))).add(hdnode.keyPair.Q);

  // In case Ki is the point at infinity, proceed with the next value for i
  if (curve.isInfinity(Ki)) {
    return deriveFast(hdnode, index + 1);
  }

  const keyPair = new utxolib.ECPair(null, Ki, { network: hdnode.keyPair.network });
  const hd = new utxolib.HDNode(keyPair, IR);

  hd.depth = hdnode.depth + 1;
  hd.index = index;
  hd.parentFingerprint = hdnode.getFingerprint().readUInt32BE(0);

  return hd;
}

export interface Derivable {
  derive(path: string): utxolib.HDNode;
  deriveKey(path: string): utxolib.ECPair;
}

/**
 * @deprecated - use `derivePath(p)` or `derivePath(sanitizeLegacyPath(p))` instead
 */
export function hdPath(rootKey): Derivable {
  const cache = {};
  const derive = function (path: string): utxolib.HDNode {
    const components = path.split('/').filter(function (c) {
      return c !== '';
    });
    // strip any extraneous / characters
    path = components.join('/');
    if (cache[path]) {
      return cache[path];
    }
    const len = components.length;
    if (len === 0 || len === 1 && components[0] === 'm') {
      return rootKey;
    }
    const parentPath = components.slice(0, len - 1).join('/');
    const parentKey = derive(parentPath);
    const el = components[len - 1];

    let hardened = false;
    if (el[el.length - 1] === "'") {
      hardened = true;
    }
    const index = parseInt(el, 10);
    let derived;
    if (hardened) {
      derived = parentKey.deriveHardened(index);
    } else {
      derived = deriveFast(parentKey, index);
    }
    cache[path] = derived;
    return derived;
  };

  function deriveKey(path: string): utxolib.ECPair {
    const hdNode = derive(path);
    return hdNode.keyPair;
  }

  return {
    derive: derive,
    deriveKey: deriveKey,
  };
}
