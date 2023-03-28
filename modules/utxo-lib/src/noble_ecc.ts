import { sha256 } from '@noble/hashes/sha256';
import { ECPairAPI, ECPairFactory, ECPairInterface } from 'ecpair';
import { ProjPointType } from '@noble/curves/abstract/weierstrass';
import { secp256k1, schnorr } from '@noble/curves/secp256k1';
import { BIP32API, BIP32Factory, BIP32Interface } from 'bip32';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore base_crypto is exported as a subPath export, ignoring since compiler complains about importing like this
import * as baseCrypto from '@brandonblack/musig/base_crypto';
import { MuSig, MuSigFactory } from '@brandonblack/musig';

const defaultTrue = (param?: boolean): boolean => param !== false;

function throwToNull<Type>(fn: () => Type): Type | null {
  try {
    return fn();
  } catch (e) {
    return null;
  }
}

function pointAddTweak(P: ProjPointType<bigint>, tweak: Uint8Array): ProjPointType<bigint> {
  const t = baseCrypto.readSecret(tweak);
  const Q = secp256k1.ProjectivePoint.BASE.multiplyAndAddUnsafe(P, t, BigInt(1));
  if (!Q) throw new Error('Unexpected point at infinity while tweaking');
  return Q;
}

const ecc = {
  isPoint: baseCrypto.isPoint,
  isPrivate: secp256k1.utils.isValidPrivateKey,
  isXOnlyPoint: baseCrypto.isXOnlyPoint,

  xOnlyPointAddTweak: (p: Uint8Array, tweak: Uint8Array): { parity: 0 | 1; xOnlyPubkey: Uint8Array } | null =>
    throwToNull(() => {
      const X = schnorr.utils.bytesToNumberBE(p);
      const Q = pointAddTweak(schnorr.utils.lift_x(X), tweak);
      return {
        parity: Q.hasEvenY() ? 0 : 1,
        xOnlyPubkey: schnorr.utils.pointToBytes(Q),
      };
    }),

  pointFromScalar: (sk: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => secp256k1.getPublicKey(sk, defaultTrue(compressed))),

  pointCompress: (p: Uint8Array, compressed?: boolean): Uint8Array =>
    secp256k1.ProjectivePoint.fromHex(p).toRawBytes(defaultTrue(compressed)),

  pointMultiply: (a: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => {
      const product = secp256k1.ProjectivePoint.fromHex(a).multiplyAndAddUnsafe(
        secp256k1.ProjectivePoint.ZERO,
        BigInt(`0x${Buffer.from(tweak).toString('hex')}`),
        BigInt(1)
      );
      if (!product) return null;
      return product.toRawBytes(defaultTrue(compressed));
    }),

  pointAdd: (a: Uint8Array, b: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => {
      const A = secp256k1.ProjectivePoint.fromHex(a);
      const B = secp256k1.ProjectivePoint.fromHex(b);
      return A.add(B).toRawBytes(defaultTrue(compressed));
    }),

  pointAddScalar: (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null =>
    throwToNull(() => pointAddTweak(secp256k1.ProjectivePoint.fromHex(p), tweak).toRawBytes(defaultTrue(compressed))),

  privateAdd: (d: Uint8Array, tweak: Uint8Array): Uint8Array | null =>
    throwToNull(() => {
      const res = baseCrypto.scalarAdd(d, tweak);
      // tiny-secp256k1 returns null rather than allowing a 0 private key to be returned
      // ECPair.testEcc() requires that behavior.
      if (res?.every((i) => i === 0)) return null;
      return res;
    }),

  privateNegate: baseCrypto.scalarNegate,

  sign: (h: Uint8Array, d: Uint8Array, e?: Uint8Array): Uint8Array => {
    return secp256k1.sign(h, d, { extraEntropy: e }).toCompactRawBytes();
  },

  signSchnorr: (h: Uint8Array, d: Uint8Array, e: Uint8Array = Buffer.alloc(32, 0x00)): Uint8Array => {
    return schnorr.sign(h, d, e);
  },

  verify: (h: Uint8Array, Q: Uint8Array, signature: Uint8Array, strict?: boolean): boolean => {
    const s = secp256k1.Signature.fromCompact(signature);
    if (strict && s.r > secp256k1.CURVE.n / BigInt(2)) return false;
    return secp256k1.verify(s, h, Q);
  },

  verifySchnorr: (h: Uint8Array, Q: Uint8Array, signature: Uint8Array): boolean => {
    return schnorr.verify(signature, h, Q);
  },
};

const crypto = {
  ...baseCrypto,
  pointMultiplyUnsafe(p: Uint8Array, a: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      const product = secp256k1.ProjectivePoint.fromHex(p).multiplyAndAddUnsafe(
        secp256k1.ProjectivePoint.ZERO,
        schnorr.utils.bytesToNumberBE(a),
        BigInt(1)
      );
      if (!product) return null;
      return product.toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointMultiplyAndAddUnsafe(p1: Uint8Array, a: Uint8Array, p2: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      const p2p = secp256k1.ProjectivePoint.fromHex(p2);
      const p = secp256k1.ProjectivePoint.fromHex(p1).multiplyAndAddUnsafe(
        p2p,
        schnorr.utils.bytesToNumberBE(a),
        BigInt(1)
      );
      if (!p) return null;
      return p.toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointAdd(a: Uint8Array, b: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      return secp256k1.ProjectivePoint.fromHex(a).add(secp256k1.ProjectivePoint.fromHex(b)).toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointAddTweak(p: Uint8Array, tweak: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      const P = secp256k1.ProjectivePoint.fromHex(p);
      const t = baseCrypto.readSecret(tweak);
      const Q = secp256k1.ProjectivePoint.BASE.multiplyAndAddUnsafe(P, t, BigInt(1));
      if (!Q) throw new Error('Tweaked point at infinity');
      return Q.toRawBytes(compress);
    } catch {
      return null;
    }
  },
  pointCompress(p: Uint8Array, compress = true): Uint8Array {
    return secp256k1.ProjectivePoint.fromHex(p).toRawBytes(compress);
  },
  liftX(p: Uint8Array): Uint8Array | null {
    try {
      return secp256k1.ProjectivePoint.fromHex(p).toRawBytes(false);
    } catch {
      return null;
    }
  },
  getPublicKey(s: Uint8Array, compress: boolean): Uint8Array | null {
    try {
      return secp256k1.getPublicKey(s, compress);
    } catch {
      return null;
    }
  },
  taggedHash: schnorr.utils.taggedHash,
  sha256(...messages: Uint8Array[]): Uint8Array {
    const h = sha256.create();
    for (const message of messages) h.update(message);
    return h.digest();
  },
};

const ECPair: ECPairAPI = ECPairFactory(ecc);
const bip32: BIP32API = BIP32Factory(ecc);
const musig: MuSig = MuSigFactory(crypto);

export { ecc, ECPair, ECPairAPI, ECPairInterface, bip32, BIP32API, BIP32Interface, musig, MuSig };
