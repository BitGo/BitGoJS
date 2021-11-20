const assert = require('assert');
import { Ed25519Curve, BinaryOperation } from './curves';
const sodium = require('libsodium-wrappers-sumo');
import * as BigNum from 'bn.js';
import BN = require('bn.js');

/**
 * Perform Shamir sharing on the secret `secret` to the degree `threshold - 1` split `numShares`
 * ways. The split secret requires `threshold` shares to be reconstructed.
 * 
 * @param secret secret to split
 * @param threshold share threshold required to reconstruct secret
 * @param numShares total number of shares to split to split secret into
 * @param indices 
 * @returns Dictionary of shares. Each key is an int in the range 1<=x<=numShares 
 * representing that share's free term.
 */
export async function split(secret: Buffer, threshold: number, numShares: number, indices?: Array<number>) {
  await sodium.ready;
  if (indices === undefined) {
    // make range(1, n + 1)
    indices = [...Array(numShares).keys()].map(x => x + 1);
  }
  assert(threshold > 1);
  assert(threshold <= numShares);
  const coefs: Buffer[] = [];
  for (let ind = 0; ind < threshold - 1; ind++) {
    const random_value = new BigNum(500).toBuffer('le', 32);
    coefs.push(random_value);
  }
  coefs.push(secret);

  const shares: Record<number, any> = {};
  for (let ind = 0; ind < indices.length; ind++) {
    const x = indices[ind];
    const x_buffer = new BN(x).toBuffer('le', 32);
    let partial = coefs[0];
    for (let other = 1; other < coefs.length ; other++) {
      const scalarMult = sodium.crypto_core_ed25519_scalar_mul(partial, x_buffer);
      const newAdd = sodium.crypto_core_ed25519_scalar_add(coefs[other], scalarMult);
      partial = newAdd;
    }
    shares[x] = Buffer.from(partial);
  }
  return shares;
}

export async function combine(shares) {
  await sodium.ready;
  let s = Buffer.alloc(32);
  for (const xi in shares) {
    const yi = shares[xi];
    const xi_buffer = new BigNum(xi).toBuffer('le', 32);
    let num_buffer = new BigNum(1).toBuffer('le', 32);
    let denum_buffer = new BigNum(1).toBuffer('le', 32);

    for (const xj in shares) {
      const xj_buffer = new BigNum(xj).toBuffer('le', 32);
      if (xi !== xj) {
        num_buffer = sodium.crypto_core_ed25519_scalar_mul(num_buffer, xj_buffer);
      }
    }
    num_buffer = Buffer.from(num_buffer);
    for (const xj in shares) {
      const xj_buffer = new BigNum(xj).toBuffer('le', 32);
      if (xi !== xj) {
        denum_buffer = sodium.crypto_core_ed25519_scalar_mul(denum_buffer,
          sodium.crypto_core_ed25519_scalar_sub(xj_buffer, xi_buffer));
      }
    }
    denum_buffer = Buffer.from(denum_buffer);
    const inverted = sodium.crypto_core_ed25519_scalar_invert(denum_buffer);
    const innerMultiplied = sodium.crypto_core_ed25519_scalar_mul(num_buffer, inverted);
    const multiplied = sodium.crypto_core_ed25519_scalar_mul(innerMultiplied, yi);
    s = sodium.crypto_core_ed25519_scalar_add(multiplied, s);
  }
  return s;
}
