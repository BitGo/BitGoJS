// Implementation of BLS + DKG.
'use strict';
const bls = require('noble-bls12-381');
const math = require('noble-bls12-381/math');
const { createHmac } = require('crypto');

const chaincodeBase = 1n << 256n;

/** Convert a string to a buffer. */
function stringToBuffer(string) {
  const buffer = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    buffer[i] = string.charCodeAt(i);
  }
  return buffer;
}

/** Convert a buffer to a hex string. */
function bufferToHex(buf) {
  return Array.from(buf)
    .map(function (val) {
      const hex = val.toString(16);
      return '0'.slice(0, hex.length % 2) + hex;
    })
    .join('');
}

/** Convert a hex string to a buffer. */
function hexToBuffer(hex) {
  if (hex.length % 2) {
    hex = '0' + hex;
  }
  const buf = new Uint8Array(hex.length >>> 1);
  for (let i = 0; i < hex.length >>> 1; i++) {
    const val = hex.slice(2 * i, 2 * i + 2);
    buf[i] = parseInt(val, 16);
  }
  return buf;
}

/** Convert a buffer to a native BigInt. */
function bufferToBigInt(buf) {
  return BigInt('0x' + bufferToHex(buf));
}

/** Convert a native BigInt to a buffer. */
function bigIntToBuffer(bigint) {
  return hexToBuffer(bigint.toString(16));
}

function bigIntToBufferBE(bigint, bytes) {
  let v = bigint.toString(16);
  v = '0'.slice(0, v.length % 2) + v;
  const buf = Buffer.from(v, 'hex');
  if (bytes && buf.length < bytes) {
    return Buffer.concat([Buffer.alloc(bytes - buf.length), buf]);
  }
  return buf;
}

/** Integer to Octet Stream */
function i2osp(value, length) {
  if (value < 0 || value >= 1n << BigInt(8 * length)) {
    throw new Error(`bad I2OSP call: value=${value} length=${length}`);
  }
  const res = Array.from({ length }).fill(0);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 0xff;
    value >>>= 8;
  }
  return new Uint8Array(res);
}

/** Get the indices from a sub key path string */
function getSubKeyPathIndices(path) {
  return path
    .replace(/^m\//, '')
    .split('/')
    .map((index) => parseInt(index, 10));
}

/** Calculate offset from a public key */
function calculateOffset(pk, index, chaincode) {
  const salt = i2osp(index, 4);
  const buffer = Buffer.concat([pk, salt]);
  return createHmac('sha512', bigIntToBufferBE(chaincode, 32)).update(buffer).digest();
}

function publicDeriveIndex({ pk, chaincode }, index) {
  const pkBuf = bigIntToBuffer(pk);
  const zout = calculateOffset(pkBuf, index, chaincode);
  const zl = zout.slice(0, 32);
  const offset = bufferToBigInt(zl);
  const offsetMod = new math.Fr(offset).value;
  const pkPoint = bls.PointG1.fromCompressedHex(pkBuf);
  const publicChild = pkPoint.add(bls.PointG1.BASE.multiply(offsetMod));
  const zr = zout.slice(32);
  return {
    pk: bufferToBigInt(publicChild.toCompressedHex()),
    chaincode: bufferToBigInt(zr),
    offset,
  };
}

/** Derive a public key */
function publicDerive(pk, chaincode, path) {
  const indices = getSubKeyPathIndices(path);
  const derivedPublic = indices.reduce(publicDeriveIndex, { pk, chaincode });
  return {
    pk: derivedPublic.pk,
    chaincode: derivedPublic.chaincode,
  };
}

/** Derive a private key */
function privateDerive(sk, pk, chaincode, path) {
  const indices = getSubKeyPathIndices(path);
  function deriveIndex({ sk, pk, chaincode }, index) {
    const { pk: derivedPk, chaincode: derivedChaincode, offset } = publicDeriveIndex({ pk, chaincode }, index);
    const derivedSk = new math.Fr(sk).add(new math.Fr(offset)).value;
    return {
      sk: derivedSk,
      pk: derivedPk,
      chaincode: derivedChaincode,
    };
  }
  return indices.reduce(deriveIndex, { sk, pk, chaincode });
}

/** Return a random field element as a native BigInt. */
function randomFieldElement() {
  const buf = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  return new math.Fr(bufferToBigInt(buf)).value;
}

/** Generate a polynomial of order m. */
function generatePolynomial(m) {
  const poly = Array(m);
  for (let i = 0; i < m; i++) {
    poly[i] = randomFieldElement();
    while (i == m - 1 && poly[i].value === 0n) {
      poly[i] = randomFieldElement();
    }
  }
  return poly;
}

/** Get the value of a point in the polynomial. */
function polynomialValue(poly, point) {
  let value = new math.Fr(0n);
  let pow = 1n;
  for (let i = 0; i < poly.length; i++) {
    value = value.add(new math.Fr(poly[i]).multiply(pow));
    pow *= point;
  }
  return value.value;
}

/** Generate secret shares for n participants. */
function secretShares(poly, n) {
  const shares = Array(n);
  for (let i = 0n; i < n; i++) {
    shares[i] = polynomialValue(poly, i + 1n);
  }
  return shares;
}

/** Generate a participant's public share. */
function publicShare(poly) {
  return bufferToBigInt(bls.PointG1.BASE.multiply(poly[0]).toCompressedHex());
}

/** Merge secret shares to produce a signing key. */
function mergeSecretShares(shares) {
  return shares.reduce((sum, share) => new math.Fr(sum + share).value, 0n);
}

/** Merge public shares to produce a common public key. */
function mergePublicShares(shares) {
  const sum = shares.slice(1).reduce((sum, share) => {
    return sum.add(bls.PointG1.fromCompressedHex(bigIntToBuffer(share)));
  }, bls.PointG1.fromCompressedHex(bigIntToBuffer(shares[0])));
  return bufferToBigInt(sum.toCompressedHex());
}

function mergeChaincodes(chaincodes) {
  return chaincodes.reduce((sum, chaincode) => (sum + chaincode) % chaincodeBase, 0n);
}

/** Compute Lagrange coefficients for a point in a polynomial. */
function lagrangeCoefficients(idx) {
  const res = Array(idx.length);
  const w = idx.reduce((w, id) => w * id, 1n);
  for (let i = 0; i < idx.length; i++) {
    let v = idx[i];
    for (let j = 0; j < idx.length; j++) {
      if (j != i) {
        v *= idx[j] - idx[i];
      }
    }
    res[i] = new math.Fr(v).invert().multiply(w).value;
  }
  return res;
}

/** Compute a shared signature from shares. */
function mergeSignatures(shares) {
  const ids = Object.keys(shares);
  const coeffs = lagrangeCoefficients(ids.map((id) => BigInt(id)));
  let sign = bls.PointG2.ZERO;
  for (let i = 0; i < ids.length; i++) {
    sign = sign.add(bls.PointG2.fromSignature(bigIntToBuffer(shares[ids[i]])).multiply(coeffs[i]));
  }
  return bufferToBigInt(sign.toSignature());
}

/** Generic BLS sign function. Can be used with a secret key or a secret share. */
async function sign(message, key) {
  if (typeof message === 'string') {
    message = stringToBuffer(message);
  }
  const hashPoint = await bls.PointG2.hashToCurve(message);
  return bufferToBigInt(hashPoint.multiply(new math.Fq(key)).toSignature());
}

/** Generic BLS verify function. Can be used with a pubilc key or a public share. */
async function verify(sig, message, key) {
  sig = bls.PointG2.fromSignature(bigIntToBuffer(sig));
  if (typeof message === 'string') {
    message = stringToBuffer(message);
  }
  key = bls.PointG1.fromCompressedHex(bigIntToBuffer(key));
  return await bls.verify(sig, message, key);
}

if (typeof module !== 'undefined') {
  module.exports = {
    generatePolynomial,
    secretShares,
    publicShare,
    mergeSecretShares,
    mergePublicShares,
    mergeChaincodes,
    mergeSignatures,
    sign,
    verify,
    privateDerive,
    publicDerive,
  };
}
