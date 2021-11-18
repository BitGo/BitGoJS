const assert = require('assert');
import { Ed25519Curve, BinaryOperation } from './curves';
import * as BigNum from 'bn.js';

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
export async function split(secret: BigNum, threshold: number, numShares: number, indices?: Array<number>) {
  if (indices === undefined) {
    indices = [...Array(numShares).keys()].map(x => x + 1);
  }
  assert(threshold > 1);
  assert(threshold <= numShares);
  const coefs: BigNum[] = [];
  for (let ind = 0; ind < threshold - 1; ind++) {
    const random_value = await Ed25519Curve.scalarRandom();
    coefs.push(random_value);
  }
  coefs.push(secret);

  const shares: Record<number, BigNum > = {};
  for (let ind = 0; ind < indices.length; ind++) {
    const x = new BigNum(indices[ind]);
    const partial = new BigNum(0);
    for (let other = 0; other < coefs.length; other++) {
      const scalar_mult = await Ed25519Curve.binaryOperation(partial, x, BinaryOperation.scalarMultiply);
      const new_add = await Ed25519Curve.binaryOperation(coefs[other], scalar_mult, BinaryOperation.scalarAdd);
      partial.add(new_add);
    }
    shares[indices[ind]] = partial;
  }
  return shares;
}

export function combine(shares) {
  return {};
}
