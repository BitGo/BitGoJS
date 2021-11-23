const assert = require('assert');
import * as BigNum from 'bn.js';

const Shamir = (curve) => {

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
  const split = (secret: Buffer, threshold: number, numShares: number, indices?: Array<number>) => {
    if (indices === undefined) {
      // make range(1, n + 1)
      indices = [...Array(numShares).keys()].map(x => x + 1);
    }
    assert(threshold > 1);
    assert(threshold <= numShares);
    const coefs: Buffer[] = [];
    for (let ind = 0; ind < threshold - 1; ind++) {
      const random_value = curve.scalarRandom();
      coefs.push(random_value);
    }
    coefs.push(secret);
  
    const shares: Record<number, any> = {};
    for (let ind = 0; ind < indices.length; ind++) {
      const x = indices[ind];
      const x_buffer = new BigNum(x).toBuffer('le', 32);
      let partial = coefs[0];
      for (let other = 1; other < coefs.length ; other++) {
        const scalarMult = curve.scalarMult(partial, x_buffer);
        const newAdd = curve.scalarAdd(coefs[other], scalarMult);
        partial = newAdd;
      }
      shares[x] = Buffer.from(partial);
    }
    return shares;
  };

  const combine = (shares) => {
    let s = Buffer.alloc(32);
    for (const xi in shares) {
      const yi = shares[xi];
      const xi_buffer = new BigNum(xi).toBuffer('le', 32);
      let num_buffer = new BigNum(1).toBuffer('le', 32);
      let denum_buffer = new BigNum(1).toBuffer('le', 32);
  
      for (const xj in shares) {
        const xj_buffer = new BigNum(xj).toBuffer('le', 32);
        if (xi !== xj) {
          num_buffer = curve.scalarMult(num_buffer, xj_buffer);
        }
      }
      num_buffer = Buffer.from(num_buffer);
      for (const xj in shares) {
        const xj_buffer = new BigNum(xj).toBuffer('le', 32);
        if (xi !== xj) {
          denum_buffer = curve.scalarMult(denum_buffer,
            curve.scalarSub(xj_buffer, xi_buffer));
        }
      }
      denum_buffer = Buffer.from(denum_buffer);
      const inverted = curve.scalarInvert(denum_buffer);
      const innerMultiplied = curve.scalarMult(num_buffer, inverted);
      const multiplied = curve.scalarMult(innerMultiplied, yi);
      s = curve.scalarAdd(multiplied, s);
    }
    return s;
  };

  return {
    split, combine,
  };
};

export default Shamir;
