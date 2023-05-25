import { bitLength } from 'bigint-crypto-utils';
import { modInv, modPow } from 'bigint-mod-arith';

import { randomPositiveCoPrimeLessThan } from '../../util';

// Security parameters.
const k = 128;
const alpha = 2;
export const m = Math.ceil(k / Math.log2(alpha));
const minBitLength = 3072;

/**
 * Generate a set of challenges $p$ for a given pallier public key modulus $n$.
 * @param n - pallier public key modulus
 * @returns {Promise<Array<bigint>>} - array of challenges $p_i$
 */
export async function generateP(n: bigint): Promise<Array<bigint>> {
  if (bitLength(n) < minBitLength) {
    throw new Error('modulus n must have a bit length larger than or equal to 3072');
  }
  return Promise.all(
    Array(m)
      .fill(null)
      .map(() => randomPositiveCoPrimeLessThan(n))
  );
}

/**
 * Generate a set of proofs $sigma$ for a given set of challenges $p$ using the pallier public key modulus $n$ and the private key $\lambda$.
 * @param n - pallier public key modulus $n$
 * @param lambda - private key $\lambda,  which is the $\euler(N) = (p-1)(q-1)$
 * @param p - array of challenges $p$
 * @returns {Promise<Array<bigint>>} - array of proofs $\sigma$
 */
export async function prove(n: bigint, lambda: bigint, p: Array<bigint>): Promise<Array<bigint>> {
  return new Promise(function (resolve) {
    setTimeout(() => {
      const n_inv = modInv(n, lambda);
      resolve(p.map((p_i) => modPow(p_i, n_inv, n)));
    });
  });
}

/**
 * Verify a set of proofs $\sigma$ on the modulus $n$ using the challenges $p$ that were provided to the prover to generate the proofs.
 * @param n - pallier public key modulus $n$
 * @param p - array of challenges $p$
 * @param sigma - array of proofs $\sigma$
 */
export async function verify(n: bigint, p: Array<bigint>, sigma: Array<bigint>): Promise<boolean> {
  // a) Check that $N$ is a positive integer and is not divisible by all
  // the primes less than $\alpha$.
  // (Since is $\alpha = 2$, we only check that $N$ is positive.
  if (n <= 0) {
    return false;
  }
  if (alpha > 2) {
    throw new Error('unsupported alpha value');
  }
  // b) Check that $\sigma_i$ is a positive integer $i = 1...m$.
  if (sigma.length !== m) {
    return false;
  }
  if (!sigma.every((sigma_i) => sigma_i > 0)) {
    return false;
  }
  // c) Verify that $p_i = \sigma_i^N \mod N$ for $i = 1...m$.
  return new Promise(function (resolve) {
    setTimeout(() => {
      for (let i = 0; i < m; i++) {
        if (p[i] !== modPow(sigma[i], n, n)) {
          resolve(false);
          return;
        }
      }
      resolve(true);
    });
  });
}
