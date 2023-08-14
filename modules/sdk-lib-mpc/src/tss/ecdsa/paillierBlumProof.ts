import { createHmac } from 'crypto';
import { bitLength, randBits, isProbablyPrime } from 'bigint-crypto-utils';
import { modInv, modPow } from 'bigint-mod-arith';
import { bigIntFromBufferBE, bigIntToBufferBE } from '../../util';
import { DeserializedPaillierBlumProof } from './types';

// Security parameter.
const m = 80;

/**
 * Generate psuedo-random quadratic residue for (N, w, i).
 * @param N - the prime number to verify is a product of two large primes.
 * @param w - a random number with the same bitLength as N, that satisfies the Jacobi of w is -1 wrt N.
 * @returns {bigint[]} - set of challenges for N
 */
function generateY(N, w): bigint[] {
  const NBuf = bigIntToBufferBE(N);
  const wBuf = bigIntToBufferBE(w, NBuf.length);
  return Array(m)
    .fill(null)
    .map((_, i) => {
      const h = bigIntFromBufferBE(
        createHmac('sha256', Buffer.from([i]))
          .update(NBuf)
          .update(wBuf)
          .digest()
      );
      return h * h;
    });
}

// https://en.wikipedia.org/wiki/Jacobi_symbol#Implementation_in_C++
function jacobi(a, n): bigint {
  // a/n is represented as (a,n)
  if (n <= BigInt(0)) {
    throw new Error('n must greater than 0');
  }
  if (n % BigInt(2) !== BigInt(1)) {
    throw new Error('n must be odd');
  }
  // step 1
  a = a % n;
  let t = BigInt(1);
  let r;
  // step 3
  while (a !== BigInt(0)) {
    // step 2
    while (a % BigInt(2) === BigInt(0)) {
      a /= BigInt(2);
      r = n % BigInt(8);
      if (r === BigInt(3) || r === BigInt(5)) {
        t = -t;
      }
    }
    // step 4
    r = n;
    n = a;
    a = r;
    if (a % BigInt(4) === BigInt(3) && n % BigInt(4) === BigInt(3)) {
      t = -t;
    }
    a = a % n;
  }
  if (n === BigInt(1)) {
    return t;
  }
  return BigInt(0);
}

/**
 * Prove that a modulus (p*q) is the product of two large safe primes (p and q).
 * @param {bigint} p The larger prime factor of the modulus
 * @param {bigint} q The smaller prime factor of the modulus.
 * @returns {DeserializedPaillierBlumProof} The proof that the modulus is the product of two large primes.
 */
export async function prove(p: bigint, q: bigint): Promise<DeserializedPaillierBlumProof> {
  // Prover selects random w with Jacobi symbol 1 wrt N.
  const N = p * q;
  const l = (p - BigInt(1)) * (q - BigInt(1));
  const d = modInv(N, l);
  let w;
  while (true) {
    w = bigIntFromBufferBE(Buffer.from(await randBits(bitLength(N))));
    if (jacobi(w, N) === BigInt(-1)) {
      break;
    }
  }
  // Prover generates y_i.
  const y = generateY(N, w);
  // Prover calculates z_i = y_i ^ d mod N
  const z = y.map((y_i) => modPow(y_i, d, N));
  // Prover calculates x_i = y_i ^ 1/4 mod N using [HOC - Fact 2.160]
  const e = ((l + BigInt(4)) / BigInt(8)) ** BigInt(2);
  const x = y.map((y_i) => modPow(y_i, e, N));
  return { w, x, z };
}

/**
 * Verify that N is the product of two large primes.
 * @param {bigint} N The prime number being verified.
 * @param {DeserializedPaillierBlumProof} The proof to verify N is a product of two large primes.
 * @returns {boolean} True if N is a product of two large primes, and false otherwise.
 */
export async function verify(N: bigint, { w, x, z }: DeserializedPaillierBlumProof): Promise<boolean> {
  // Verifier checks N > 1.
  if (N <= 1) {
    throw new Error('N must be greater than 1');
  }
  // Verifier checks N is odd.
  if (N % BigInt(2) !== BigInt(1)) {
    throw new Error('N must be an odd number');
  }
  // Verifier checks N is not prime.
  if (await isProbablyPrime(N, 24)) {
    throw new Error('N must be a composite number');
  }
  // Verifier checks that the Jacobi symbol for w is 1 wrt N.
  if (jacobi(w, N) !== BigInt(-1)) {
    throw new Error('Jacobi symbol of w must be -1 wrt to N');
  }
  // Verifier generates y_i.
  const y = generateY(N, w);
  for (let i = 0; i < m; i++) {
    // Verifier checks z_i ^ N mod N == y_i.
    if (modPow(z[i], N, N) !== y[i]) {
      throw new Error(`Paillier verification of y[${i}] failed`);
    }
    // Verifier checks x_i ^ 4 mod N == y_i.
    if (modPow(x[i], 4, N) !== y[i]) {
      throw new Error(`Paillier verification of x[${i}] failed`);
    }
  }
  return true;
}
