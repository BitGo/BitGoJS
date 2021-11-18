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
    const random_value = sodium.crypto_core_ed25519_scalar_random();
    coefs.push(random_value);
  }
  coefs.push(secret);

  const shares: Record<number, Buffer> = {};
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

export function combine(shares) {
  return {};
}
