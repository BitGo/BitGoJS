import { modInv, modPow } from 'bigint-mod-arith';
import { randomCoPrimeLessThan } from '../../util';

// Security parameters.
const k = 128;
const alpha = 2;
const m = Math.ceil(k / Math.log2(alpha));

export async function generateP(n: bigint): Promise<Array<bigint>> {
  return Promise.all(
    Array(m)
      .fill(null)
      .map(() => randomCoPrimeLessThan(n))
  );
}

export async function prove(n: bigint, lambda: bigint, p: Array<bigint>): Promise<Array<bigint>> {
  return new Promise(function (resolve) {
    setTimeout(() => {
      const n_inv = modInv(n, lambda);
      resolve(p.map((p_i) => modPow(p_i, n_inv, n)));
    });
  });
}

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
