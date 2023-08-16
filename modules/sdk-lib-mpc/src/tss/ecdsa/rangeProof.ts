/**
 * Zero Knowledge Range Proofs as described in (Two-party generation of DSA signatures)[1].
 * [1]: https://reitermk.github.io/papers/2004/IJIS.pdf
 */
import { createHash } from 'crypto';
import { BaseCurve } from '../../curves';
import { PublicKey } from 'paillier-bigint';
import { bitLength, randBetween } from 'bigint-crypto-utils';
import { modInv, modPow } from 'bigint-mod-arith';
import {
  DeserializedNtilde,
  DeserializedNtildeProof,
  RSAModulus,
  RangeProof,
  RangeProofWithCheck,
  DeserializedNtildeWithProofs,
} from './types';
import { bigIntFromBufferBE, bigIntToBufferBE, randomPositiveCoPrimeTo } from '../../util';
import { OpenSSL } from '../../openssl';
import { minModulusBitLength } from './index';

// 128 as recommend by https://blog.verichains.io/p/vsa-2022-120-multichain-key-extraction.
const ITERATIONS = 128;

export async function generateSafePrimes(bitLengths: number[]): Promise<bigint[]> {
  const openSSL = new OpenSSL();
  await openSSL.init();
  const promises: Promise<bigint>[] = bitLengths.map((bitlength: number) => {
    return openSSL.generateSafePrime(bitlength);
  });
  return await Promise.all(promises);
}

async function generateModulus(bitlength = minModulusBitLength, retry = 10): Promise<RSAModulus> {
  if (bitlength < minModulusBitLength) {
    // https://www.keylength.com/en/6/
    // eslint-disable-next-line no-console
    console.warn('Generating a modulus with less than 3072 is not recommended!');
  }
  const bitlengthP = Math.floor(bitlength / 2);
  const bitlengthQ = bitlength - bitlengthP;
  for (let i = 0; i < retry; i++) {
    const [p, q] = await generateSafePrimes([bitlengthP, bitlengthQ]);
    const n = p * q;
    // For large bit lengths, the probability of generating a modulus with the wrong bit length is very low.
    if (bitLength(n) !== bitlength) {
      continue;
    }
    return { n, q1: (p - BigInt(1)) / BigInt(2), q2: (q - BigInt(1)) / BigInt(2) };
  }
  throw new Error(
    `Unable to generate modulus with bit length of ${bitlength} after ${retry} tries. Please try again or reach out to support@bitgo.com`
  );
}

/**
 * Generate "challenge" values for range proofs.
 * @param {number} bitlength The bit length of the modulus to generate. This should
 * be the same as the bit length of the paillier public keys used for MtA.
 * @returns {DeserializedNtilde} The generated Ntilde values.
 */
export async function generateNtilde(bitlength = minModulusBitLength): Promise<DeserializedNtildeWithProofs> {
  const { n: ntilde, q1, q2 } = await generateModulus(bitlength);
  const [f1, f2] = await Promise.all([randomPositiveCoPrimeTo(ntilde), randomPositiveCoPrimeTo(ntilde)]);
  const h1 = modPow(f1, BigInt(2), ntilde);
  const h2 = modPow(h1, f2, ntilde);
  const beta = modInv(f2, q1 * q2);
  const [h1wrtH2Proofs, h2wrtH1Proofs] = await Promise.all([
    generateNtildeProof(
      {
        h1: h1,
        h2: h2,
        ntilde: ntilde,
      },
      f2,
      q1,
      q2
    ),
    generateNtildeProof(
      {
        h1: h2,
        h2: h1,
        ntilde: ntilde,
      },
      beta,
      q1,
      q2
    ),
  ]);
  return {
    ntilde,
    h1,
    h2,
    ntildeProof: {
      h1WrtH2: {
        alpha: h1wrtH2Proofs.alpha,
        t: h1wrtH2Proofs.t,
      },
      h2WrtH1: {
        alpha: h2wrtH1Proofs.alpha,
        t: h2wrtH1Proofs.t,
      },
    },
  };
}

/**
 * Generate iterations of Ntilde, h1, h2 discrete log proofs.
 * @param {DeserializedNtilde} ntilde Ntilde, h1, h2 to generate the proofs for.
 * @param {bigint} x Either alpha or beta depending on whether it is a discrete log proof of
 * h1 w.r.t h2 or h2 w.r.t h1.
 * @param {bigint} q1 The Sophie Germain prime associated with the first safe prime p1 used to generate Ntilde.
 * @param {bigint} q2 The Sophie Germain prime associated with the second safe prime p2 used to generate Ntilde.
 * @returns {NtildeProof} The generated Ntilde Proofs.
 */
export async function generateNtildeProof(
  ntilde: DeserializedNtilde,
  x: bigint,
  q1: bigint,
  q2: bigint
): Promise<DeserializedNtildeProof> {
  const q1MulQ2 = q1 * q2;
  const a: bigint[] = [];
  const alpha: bigint[] = [];
  let msgToHash: Buffer = Buffer.concat([
    bigIntToBufferBE(ntilde.h1),
    bigIntToBufferBE(ntilde.h2),
    bigIntToBufferBE(ntilde.ntilde),
  ]);
  for (let i = 0; i < ITERATIONS; i++) {
    a.push(randBetween(q1MulQ2));
    alpha.push(modPow(ntilde.h1, a[i], ntilde.ntilde));
    msgToHash = Buffer.concat([msgToHash, bigIntToBufferBE(alpha[i], Math.ceil(bitLength(ntilde.ntilde) / 8))]);
  }
  const simulatedResponse = createHash('sha256').update(msgToHash).digest();
  const t: bigint[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    // Get the ith bit from a buffer of bytes.
    const ithBit = (simulatedResponse[Math.floor(i / 8)] >> (7 - (i % 8))) & 1;
    t.push((a[i] + ((BigInt(ithBit) * x) % q1MulQ2)) % q1MulQ2);
  }
  return { alpha, t };
}

/**
 * Verify discrete log proofs of h1 and h2 mod Ntilde.
 * @param {DeserializedNtilde} ntilde Ntilde, h1, h2 to generate the proofs for.
 * @param {DeserializedNtildeProof} ntildeProof Ntilde Proofs
 * @returns {boolean} true if proof is verified, false otherwise.
 */
export async function verifyNtildeProof(
  ntilde: DeserializedNtilde,
  ntildeProof: DeserializedNtildeProof
): Promise<boolean> {
  const h1ModNtilde = ntilde.h1 % ntilde.ntilde;
  const h2ModNtilde = ntilde.h2 % ntilde.ntilde;
  if (h1ModNtilde === BigInt(0) || h2ModNtilde === BigInt(0)) {
    return false;
  }
  if (h1ModNtilde === BigInt(1) || h2ModNtilde === BigInt(1)) {
    return false;
  }
  if (h1ModNtilde === h2ModNtilde) {
    return false;
  }
  if (
    ntildeProof.alpha.length > 256 ||
    ntildeProof.alpha.length !== ITERATIONS ||
    ntildeProof.t.length !== ITERATIONS
  ) {
    return false;
  }
  let msgToHash: Buffer = Buffer.concat([
    bigIntToBufferBE(ntilde.h1),
    bigIntToBufferBE(ntilde.h2),
    bigIntToBufferBE(ntilde.ntilde),
  ]);
  for (let i = 0; i < ntildeProof.alpha.length; i++) {
    msgToHash = Buffer.concat([
      msgToHash,
      bigIntToBufferBE(ntildeProof.alpha[i], Math.ceil(bitLength(ntilde.ntilde) / 8)),
    ]);
  }
  const simulatedResponse = createHash('sha256').update(msgToHash).digest();
  for (let i = 0; i < ntildeProof.alpha.length; i++) {
    // Get the ith bit from a buffer of bytes.
    const ithBit = (simulatedResponse[Math.floor(i / 8)] >> (7 - (i % 8))) & 1;
    const h1PowTi = modPow(ntilde.h1, ntildeProof.t[i], ntilde.ntilde);
    const h2PowCi = modPow(ntilde.h2, BigInt(ithBit), ntilde.ntilde);
    const alphaMulh2PowCi = (ntildeProof.alpha[i] * h2PowCi) % ntilde.ntilde;
    if (h1PowTi !== alphaMulh2PowCi) {
      return false;
    }
  }
  return true;
}
/**
 * Generate a zero-knowledge range proof that an encrypted value is "small".
 * @param {BaseCurve} curve An elliptic curve to use for group operations.
 * @param {number} modulusBits The bit count of the prover's public key.
 * @param {PublicKey} pk The prover's public key.
 * @param {DeserializedNtilde} ntilde The verifier's Ntilde values.
 * @param {bigint} c The ciphertext.
 * @param {bigint} m The plaintext.
 * @param {bigint} r The obfuscation value used to encrypt m.
 * @returns {RangeProof} The generated proof.
 */
export async function prove(
  curve: BaseCurve,
  modulusBits: number,
  pk: PublicKey,
  ntilde: DeserializedNtilde,
  c: bigint,
  m: bigint,
  r: bigint
): Promise<RangeProof> {
  const modulusBytes = Math.floor((modulusBits + 7) / 8);
  const q = curve.order();
  const q3 = q ** BigInt(3);
  const qntilde = q * ntilde.ntilde;
  const q3ntilde = q3 * ntilde.ntilde;
  const alpha = randBetween(q3);
  const beta = await randomPositiveCoPrimeTo(pk.n);
  const gamma = randBetween(q3ntilde);
  const rho = randBetween(qntilde);
  const z = (modPow(ntilde.h1, m, ntilde.ntilde) * modPow(ntilde.h2, rho, ntilde.ntilde)) % ntilde.ntilde;
  const u = (modPow(pk.g, alpha, pk._n2) * modPow(beta, pk.n, pk._n2)) % pk._n2;
  const w = (modPow(ntilde.h1, alpha, ntilde.ntilde) * modPow(ntilde.h2, gamma, ntilde.ntilde)) % ntilde.ntilde;
  const hash = createHash('sha256');
  hash.update('\x06\x00\x00\x00\x00\x00\x00\x00');
  hash.update(bigIntToBufferBE(pk.n, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(pk.g, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(c, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(z, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(u, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(w, modulusBytes));
  hash.update('$');
  const e = bigIntFromBufferBE(hash.digest()) % q;
  const s = (modPow(r, e, pk.n) * beta) % pk.n;
  const s1 = e * m + alpha;
  const s2 = e * rho + gamma;
  return { z, u, w, s, s1, s2 };
}

/**
 * Verify a zero-knowledge range proof that an encrypted value is "small".
 * @param {BaseCurve} curve An elliptic curve to use for group operations.
 * @param {number} modulusBits The bit count of the prover's public key.
 * @param {PublicKey} pk The prover's public key.
 * @param {DeserializedNtilde} ntilde The verifier's Ntilde values.
 * @param {RangeProof} proof The range proof.
 * @param {bigint} c The ciphertext.
 * @returns {boolean} True if verification succeeds.
 */
export function verify(
  curve: BaseCurve,
  modulusBits: number,
  pk: PublicKey,
  ntilde: DeserializedNtilde,
  proof: RangeProof,
  c: bigint
): boolean {
  if (proof.u === BigInt(0) || proof.s === BigInt(0)) {
    return false;
  }
  const modulusBytes = Math.floor((modulusBits + 7) / 8);
  const q = curve.order();
  const q3 = q ** BigInt(3);
  if (proof.s1 > q3) {
    return false;
  }
  const hash = createHash('sha256');
  hash.update('\x06\x00\x00\x00\x00\x00\x00\x00');
  hash.update(bigIntToBufferBE(pk.n, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(pk.g, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(c, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.z, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.u, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.w, modulusBytes));
  hash.update('$');
  const e = bigIntFromBufferBE(hash.digest()) % q;
  let products: bigint;
  products = (modPow(pk.g, proof.s1, pk._n2) * modPow(proof.s, pk.n, pk._n2) * modPow(c, -e, pk._n2)) % pk._n2;
  if (proof.u !== products) {
    return false;
  }
  products =
    (((modPow(ntilde.h1, proof.s1, ntilde.ntilde) * modPow(ntilde.h2, proof.s2, ntilde.ntilde)) % ntilde.ntilde) *
      modPow(proof.z, -e, ntilde.ntilde)) %
    ntilde.ntilde;
  return proof.w === products;
}

/**
 * Generate a zero-knowledge range proof that a homomorphically manipulated value is "small".
 * @param {BaseCurve} curve An elliptic curve to use for group operations.
 * @param {number} modulusBits The bit count of the prover's public key.
 * @param {PublicKey} pk The prover's public key.
 * @param {DeserializedNtilde} ntilde The verifier's Ntilde values.
 * @param {bigint} c1 The original ciphertext.
 * @param {bigint} c2 The manipulated ciphertext.
 * @param {bigint} x The plaintext value multiplied by the original plaintext.
 * @param {bigint} y The plaintext value that is added to x.
 * @param {bigint} r The obfuscation value used to encrypt x.
 * @param {bigint} X The curve's base point raised to x.
 * @returns {RangeProofWithCheck} The generated proof.
 */
export async function proveWithCheck(
  curve: BaseCurve,
  modulusBits: number,
  pk: PublicKey,
  ntilde: DeserializedNtilde,
  c1: bigint,
  c2: bigint,
  x: bigint,
  y: bigint,
  r: bigint,
  X: bigint
): Promise<RangeProofWithCheck> {
  const modulusBytes = Math.floor((modulusBits + 7) / 8);
  const q = curve.order();
  const q3 = q ** BigInt(3);
  const q7 = q ** BigInt(7);
  const qntilde = q * ntilde.ntilde;
  const q3ntilde = q3 * ntilde.ntilde;
  const alpha = randBetween(q3);
  const rho = randBetween(qntilde);
  const sigma = randBetween(qntilde);
  const tau = randBetween(q3ntilde);
  const rhoprm = randBetween(q3ntilde);
  const beta = await randomPositiveCoPrimeTo(pk.n);
  const gamma = randBetween(q7);
  const u = curve.basePointMult(curve.scalarReduce(alpha));
  const z = (modPow(ntilde.h1, x, ntilde.ntilde) * modPow(ntilde.h2, rho, ntilde.ntilde)) % ntilde.ntilde;
  const zprm = (modPow(ntilde.h1, alpha, ntilde.ntilde) * modPow(ntilde.h2, rhoprm, ntilde.ntilde)) % ntilde.ntilde;
  const t = (modPow(ntilde.h1, y, ntilde.ntilde) * modPow(ntilde.h2, sigma, ntilde.ntilde)) % ntilde.ntilde;
  const v =
    (((modPow(c1, alpha, pk._n2) * modPow(pk.g, gamma, pk._n2)) % pk._n2) * modPow(beta, pk.n, pk._n2)) % pk._n2;
  const w = (modPow(ntilde.h1, gamma, ntilde.ntilde) * modPow(ntilde.h2, tau, ntilde.ntilde)) % ntilde.ntilde;
  const hash = createHash('sha256');
  hash.update('\x0d\x00\x00\x00\x00\x00\x00\x00');
  hash.update(bigIntToBufferBE(pk.n, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(pk.g, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(X, 33));
  hash.update('$');
  hash.update(bigIntToBufferBE(c1, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(c2, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(u, 33));
  hash.update('$');
  hash.update(bigIntToBufferBE(z, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(zprm, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(t, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(v, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(w, modulusBytes));
  hash.update('$');
  const e = bigIntFromBufferBE(hash.digest()) % q;
  const s = (modPow(r, e, pk.n) * beta) % pk.n;
  const s1 = e * x + alpha;
  const s2 = e * rho + rhoprm;
  const t1 = e * y + gamma;
  const t2 = e * sigma + tau;
  return { z, zprm, t, v, w, s, s1, s2, t1, t2, u };
}

/**
 * Verify a zero-knowledge range proof that a homomorphically manipulated value is "small".
 * @param {BaseCurve} curve An elliptic curve to use for group operations.
 * @param {number} modulusBits The bit count of the prover's public key.
 * @param {PublicKey} pk The prover's public key.
 * @param {DeserializedNtilde} ntilde The verifier's Ntilde values.
 * @param {RangeProofWithCheck} proof The range proof.
 * @param {bigint} c1 The original ciphertext.
 * @param {bigint} c2 The manipulated ciphertext.
 * @param {bigint} X The curve's base point raised to x.
 * @returns {boolean} True if verification succeeds.
 */
export function verifyWithCheck(
  curve: BaseCurve,
  modulusBits: number,
  pk: PublicKey,
  ntilde: DeserializedNtilde,
  proof: RangeProofWithCheck,
  c1: bigint,
  c2: bigint,
  X: bigint
): boolean {
  const modulusBytes = Math.floor((modulusBits + 7) / 8);
  const q = curve.order();
  const q3 = q ** BigInt(3);
  const q7 = q ** BigInt(7);
  if (proof.s1 > q3) {
    return false;
  }
  if (proof.t1 > q7) {
    return false;
  }
  const hash = createHash('sha256');
  hash.update('\x0d\x00\x00\x00\x00\x00\x00\x00');
  hash.update(bigIntToBufferBE(pk.n, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(pk.g, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(X, 33));
  hash.update('$');
  hash.update(bigIntToBufferBE(c1, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(c2, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.u, 33));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.z, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.zprm, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.t, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.v, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(proof.w, modulusBytes));
  hash.update('$');
  const e = bigIntFromBufferBE(hash.digest()) % q;
  const gS1 = curve.basePointMult(curve.scalarReduce(proof.s1));
  const xEU = curve.pointAdd(curve.pointMultiply(X, e), proof.u);
  if (gS1 !== xEU) {
    return false;
  }
  let left, right;
  const h1ExpS1 = modPow(ntilde.h1, proof.s1, ntilde.ntilde);
  const h2ExpS2 = modPow(ntilde.h2, proof.s2, ntilde.ntilde);
  left = (h1ExpS1 * h2ExpS2) % ntilde.ntilde;
  const zExpE = modPow(proof.z, e, ntilde.ntilde);
  right = (zExpE * proof.zprm) % ntilde.ntilde;
  if (left !== right) {
    return false;
  }
  const h1ExpT1 = modPow(ntilde.h1, proof.t1, ntilde.ntilde);
  const h2ExpT2 = modPow(ntilde.h2, proof.t2, ntilde.ntilde);
  left = (h1ExpT1 * h2ExpT2) % ntilde.ntilde;
  const tExpE = modPow(proof.t, e, ntilde.ntilde);
  right = (tExpE * proof.w) % ntilde.ntilde;
  if (left !== right) {
    return false;
  }
  const c1ExpS1 = modPow(c1, proof.s1, pk._n2);
  const sExpN = modPow(proof.s, pk.n, pk._n2);
  const gammaExpT1 = modPow(pk.g, proof.t1, pk._n2);
  left = (((c1ExpS1 * sExpN) % pk._n2) * gammaExpT1) % pk._n2;
  const c2ExpE = modPow(c2, e, pk._n2);
  right = (c2ExpE * proof.v) % pk._n2;
  return left === right;
}
