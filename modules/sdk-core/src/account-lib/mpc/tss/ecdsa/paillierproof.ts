import { bitLength, randBits } from 'bigint-crypto-utils';
import { bigIntFromBufferBE } from '../../util';
import { gcd, modInv, modPow } from 'bigint-mod-arith';

// Security parameters.
const k = 128;
const alpha = 2;

// Generate a random coprime less than x with the same bit depth.
async function randomCoPrimeLessThan(x: bigint): Promise<bigint> {
  while (true) {
    const y = bigIntFromBufferBE(Buffer.from(await randBits(bitLength(x), true)));
    if (y > BigInt(0) && y < x && gcd(x, y) === BigInt(1)) {
      return y;
    }
  }
}

export async function generateP(n: bigint): Promise<Array<bigint>> {
  const m = k / Math.log2(alpha);
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
  const m = k / Math.log2(alpha);
  if (sigma.length != m) {
    return false;
  }
  if (!sigma.every((sigma_i) => sigma_i > 0)) {
    return false;
  }
  // c) Verify that $p_i = \sigma_i^N \mod N$ for $i = 1...m$.
  return new Promise(function (resolve) {
    setTimeout(() => {
      for (let i = 0; i < m; i++) {
        if (p[i] != modPow(sigma[i], n, n)) {
          resolve(false);
          return;
        }
      }
      resolve(true);
    });
  });
}
