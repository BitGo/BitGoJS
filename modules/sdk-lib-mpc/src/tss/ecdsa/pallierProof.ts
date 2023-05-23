import assert from 'assert';
import { modInv, modPow } from 'bigint-mod-arith';

import { randomCoPrimeLessThan } from '../../util';
import { bitLength } from 'bigint-crypto-utils';

// Security parameters.
const k = 128;
const alpha = 2;
export const m = Math.ceil(k / Math.log2(alpha));

/**
 * Generate challenges for a pallier key given a modulus
 * @param n - modulus (p*q)
 */
export function generateP(n: bigint): Array<bigint> {
  assert(n > 0, new Error('n must be a positive integer larger than 0'));
  assert(bitLength(n) >= 3072, new Error('n must have a bitlength of 3072 or larger'));
  return Array(m)
    .fill(null)
    .map(() => randomCoPrimeLessThan(n));
}

/**
 * Generate a proof for a modulus given an array of challenges
 * @param n - modulus (p*q)
 * @param lambda
 * @param p - array of challenges
 * @returns {Array<bigint>} - array of proofs
 */
export async function prove(n: bigint, lambda: bigint, p: Array<bigint>): Promise<Array<bigint>> {
  const n_inv = modInv(n, lambda);
  return p.map((p_i) => modPow(p_i, n_inv, n));
}

/**
 * Verify challenge proofs for modulus
 * @param n - modulus (p*q)
 * @param p - array of challenges
 * @param sigma
 */
export function verify(n: bigint, p: Array<bigint>, sigma: Array<bigint>): boolean {
  assert(alpha === 2, new Error('unsupported alpha value'));
  // a) Check that $N$ is a positive integer and is not divisible by all
  // the primes less than $\alpha$.
  // (Since is $\alpha = 2$, we only check that $N$ is positive.
  if (n <= 0) {
    return false;
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
