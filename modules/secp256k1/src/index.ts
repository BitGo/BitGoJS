import { ECPairAPI, ECPairFactory, ECPairInterface } from 'ecpair';
import * as necc from '@noble/secp256k1';
import { schnorr } from '@noble/curves/secp256k1';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { BIP32API, BIP32Factory, BIP32Interface } from 'bip32';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore base_crypto is exported as a subPath export, ignoring since compiler complains about importing like this
import * as baseCrypto from '@brandonblack/musig/base_crypto';
import { MuSig, MuSigFactory } from '@brandonblack/musig';

const createHash = require('create-hash');

necc.etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]): Uint8Array =>
  hmac(sha256, key, necc.etc.concatBytes(...messages));

const defaultTrue = (param?: boolean): boolean => param !== false;

function throwToNull<Type>(fn: () => Type): Type | null {
  try {
    return fn();
  } catch (e) {
    return null;
  }
}

function isPoint(p: Uint8Array, xOnly: boolean): boolean {
  if ((p.length === 32) !== xOnly) return false;
  try {
    return !!necc.ProjectivePoint.fromHex(p);
  } catch (e) {
    return false;
  }
}

function toBigInt(b: Uint8Array | Buffer): bigint {
  const buff = Buffer.from(b);
  if (buff.length !== 32) {
    throw new Error('Invalid size ${buff.length}');
  }
  return BigInt(`0x${buff.toString('hex')}`);
}

const ecc = {
  isPoint: (p: Uint8Array): boolean => isPoint(p, false),
  isPrivate: (d: Uint8Array): boolean => necc.utils.isValidPrivateKey(d),
  isXOnlyPoint: (p: Uint8Array): boolean => isPoint(p, true),

  xOnlyPointAddTweak: (p: Uint8Array, tweak: Uint8Array): { parity: 0 | 1; xOnlyPubkey: Uint8Array } | null =>
    throwToNull(() => {
      const P = necc.ProjectivePoint.fromHex(p).add(necc.ProjectivePoint.fromPrivateKey(tweak)).toRawBytes(true);
      const parity = P[0] % 2 === 1 ? 1 : 0;
      return { parity, xOnlyPubkey: P.slice(1) };
    }),

  pointFromScalar: (sk: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => necc.getPublicKey(sk, defaultTrue(compressed))),

  pointCompress: (p: Uint8Array, compressed?: boolean): Uint8Array => {
    return necc.ProjectivePoint.fromHex(p).toRawBytes(defaultTrue(compressed));
  },

  pointMultiply: (a: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() =>
      necc.ProjectivePoint.fromHex(a).multiply(necc.etc.bytesToNumberBE(tweak)).toRawBytes(defaultTrue(compressed))
    ),

  pointAdd: (a: Uint8Array, b: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => {
      const A = necc.ProjectivePoint.fromHex(a);
      const B = necc.ProjectivePoint.fromHex(b);
      return A.add(B).toRawBytes(defaultTrue(compressed));
    }),

  pointAddScalar: (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => necc.ProjectivePoint.fromHex(p).add(necc.ProjectivePoint.fromPrivateKey(tweak)).toRawBytes(true)),

  privateAdd: (d: Uint8Array, tweak: Uint8Array): Uint8Array | null =>
    throwToNull(() => {
      const res = necc.etc.numberToBytesBE(
        necc.etc.mod(necc.utils.normPrivateKeyToScalar(d) + necc.utils.normPrivateKeyToScalar(tweak), necc.CURVE.n)
      );
      // tiny-secp256k1 returns null rather than allowing a 0 private key to be returned
      // ECPair.testEcc() requires that behavior.
      if (res?.every((i) => i === 0)) return null;
      return res;
    }),

  privateNegate: (d: Uint8Array): Uint8Array =>
    necc.etc.numberToBytesBE(necc.etc.mod(-necc.utils.normPrivateKeyToScalar(d), necc.CURVE.n)),

  sign: (h: Uint8Array, d: Uint8Array, e?: Uint8Array): Uint8Array => {
    return necc.sign(h, d, { extraEntropy: e }).toCompactRawBytes();
  },

  signSchnorr: (h: Uint8Array, d: Uint8Array, e: Uint8Array = Buffer.alloc(32, 0x00)): Uint8Array => {
    return schnorr.sign(h, d, e);
  },

  verify: (h: Uint8Array, Q: Uint8Array, signature: Uint8Array, strict?: boolean): boolean => {
    return necc.verify(signature, h, Q, { lowS: strict });
  },

  verifySchnorr: (h: Uint8Array, Q: Uint8Array, signature: Uint8Array): boolean => {
    return schnorr.verify(signature, h, Q);
  },
};

const crypto = {
  ...baseCrypto,
  pointMultiplyUnsafe(p: Uint8Array, a: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      const product = necc.ProjectivePoint.fromHex(p).mulAddQUns(necc.ProjectivePoint.ZERO, toBigInt(a), BigInt(1));
      if (!product) return null;
      return product.toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointMultiplyAndAddUnsafe(p1: Uint8Array, a: Uint8Array, p2: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      const p2p = necc.ProjectivePoint.fromHex(p2);
      const p = necc.ProjectivePoint.fromHex(p1).mulAddQUns(p2p, toBigInt(a), BigInt(1));
      if (!p) return null;
      return p.toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointAdd(a: Uint8Array, b: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      return necc.ProjectivePoint.fromHex(a).add(necc.ProjectivePoint.fromHex(b)).toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointAddTweak(p: Uint8Array, tweak: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      const P = necc.ProjectivePoint.fromHex(p);
      const t = baseCrypto.readSecret(tweak);
      const Q = necc.ProjectivePoint.BASE.mulAddQUns(P, t, BigInt(1));
      if (!Q) throw new Error('Tweaked point at infinity');
      return Q.toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointCompress(p: Uint8Array, compress = true): Uint8Array {
    return necc.ProjectivePoint.fromHex(p).toRawBytes(compress);
  },
  liftX(p: Uint8Array): Uint8Array | null {
    try {
      return necc.ProjectivePoint.fromHex(p).toRawBytes(false);
    } catch {
      return null;
    }
  },
  getPublicKey(s: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      return necc.getPublicKey(s, compress);
    } catch {
      return null;
    }
  },
  taggedHash: schnorr.utils.taggedHash,
  sha256(...messages: Uint8Array[]): Uint8Array {
    const sha256 = createHash('sha256');
    for (const message of messages) sha256.update(message);
    return sha256.digest();
  },
};

const ECPair: ECPairAPI = ECPairFactory(ecc);
const bip32: BIP32API = BIP32Factory(ecc);
const musig: MuSig = MuSigFactory(crypto);

export { ecc, ECPair, ECPairAPI, ECPairInterface, bip32, BIP32API, BIP32Interface, musig, MuSig };
