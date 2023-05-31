import { bitLength } from 'bigint-crypto-utils';
import { modInv, modPow } from 'bigint-mod-arith';

import { randomPositiveCoPrimeLessThan } from '../../util';
import { minModulusBitLength } from './index';
import { primesSmallerThan319567 } from './primes';

// Security parameters.
const k = 128;
// eprint.iacr.org/2018/057.pdf#page6 section 5
// https://github.com/BitGo/BitGoJS/pull/3502#discussion_r1203070392
export const alpha = 319567;
export const m = Math.ceil(k / Math.log2(alpha));

/**
 * Generate a set of challenges $p$ for a given paillier public key modulus $n$.
 * @param n - paillier public key modulus
 * @returns {Promise<Array<bigint>>} - array of challenges $p_i$
 */
export async function generateP(n: bigint): Promise<Array<bigint>> {
  if (bitLength(n) < minModulusBitLength) {
    throw new Error(`modulus n must have a bit length larger than or equal to ${minModulusBitLength}`);
  }
  return Promise.all(
    Array(m)
      .fill(null)
      .map(() => randomPositiveCoPrimeLessThan(n))
  );
}

/**
 * Generate a set of proofs $sigma$ for a given set of challenges $p$ using the paillier public key modulus $n$ and the private key $\lambda$.
 * @param n - paillier public key modulus $n$
 * @param lambda - private key $\lambda,  which is the $\euler(N) = (p-1)(q-1)$
 * @param p - array of challenges $p$
 * @returns {Promise<Array<bigint>>} - array of proofs $\sigma$
 */
export function prove(n: bigint, lambda: bigint, p: Array<bigint>): bigint[] {
  if (!p.every((p_i) => p_i > 0)) {
    throw new Error('All paillier challenge values must be positive.');
  }
  const n_inv = modInv(n, lambda);
  return p.map((p_i) => modPow(p_i, n_inv, n));
}

/**
 * Verify a set of proofs $\sigma$ on the modulus $n$ using the challenges $p$ that were provided to the prover to generate the proofs.
 * @param n - paillier public key modulus $n$
 * @param p - array of challenges $p$
 * @param sigma - array of proofs $\sigma$
 */
export function verify(n: bigint, p: Array<bigint>, sigma: Array<bigint>): boolean {
  if (!p.every((p_i) => p_i > 0)) {
    throw new Error('All paillier challenge values must be positive.');
  }
  if (!sigma.every((sigma_i) => sigma_i > 0)) {
    throw new Error('All paillier challenge proof values must be positive.');
  }
  // a) Check that $N$ is a positive integer and is not divisible by all
  // the primes less than $\alpha$.
  if (n <= 0) {
    return false;
  }
  if (alpha !== 319567) {
    throw new Error('unsupported alpha value');
  }
  for (const prime of primesSmallerThan319567) {
    if (n % BigInt(prime) === BigInt(0)) {
      return false;
    }
  }
  // b) Check that $\sigma_i$ is a positive integer $i = 1...m$.
  if (sigma.length !== m) {
    return false;
  }
  if (!sigma.every((sigma_i) => sigma_i > 0)) {
    return false;
  }
  // c) Verify that $p_i = \sigma_i^N \mod N$ for $i = 1...m$.
  for (let i = 0; i < m; i++) {
    if (p[i] !== modPow(sigma[i], n, n)) {
      return false;
    }
  }
  return true;
}
