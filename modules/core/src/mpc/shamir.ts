const assert = require('assert');
import * as BigNum from 'bn.js';

const Shamir = (curve: any) => {
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
  const split = (secret: BigNum, threshold: number, numShares: number, indices?: Array<number>): Record<number, BigNum> => {
    if (indices === undefined) {
      // make range(1, n + 1)
      indices = Array.from({ length: numShares }, (_, i) => i + 1);
    }
    assert(threshold > 1);
    assert(threshold <= numShares);
    const coefs: BigNum[] = [];
    for (let ind = 0; ind < threshold - 1; ind++) {
      const random_value = curve.scalarRandom();
      coefs.push(random_value);
    }
    coefs.push(secret);

    const shares: Record<number, BigNum> = {};
    for (let ind = 0; ind < indices.length; ind++) {
      const x = new BigNum(indices[ind]);
      let partial = coefs[0];
      for (let other = 1; other < coefs.length; other++) {
        const scalarMult = curve.scalarMult(partial, x);
        const newAdd = curve.scalarAdd(coefs[other], scalarMult);
        partial = newAdd;
      }
      shares[x.toString()] = partial.toNumber;
    }
    return shares;
  };

  /**
   * Reconstitute a secret from a dictionary of shares. The number of shares must
   * be equal to `t` to reconstitute the original secret.
   *
   * @param shares dictionary of shares. each key is the free term of the share
   * @returns secret
   */
  const combine = (shares: Record<number, BigNum>): BigNum => {
    let s = new BigNum(0);
    for (const xi in shares) {
      const yi = shares[xi];
      let num = new BigNum(1);
      let denum = new BigNum(1);

      for (const xj in shares) {
        if (xi !== xj) {
          num = curve.scalarMult(num, new BigNum(xj));
        }
      }
      for (const xj in shares) {
        if (xi !== xj) {
          denum = curve.scalarMult(denum, curve.scalarSub(new BigNum(xj), new BigNum(xi)));
        }
      }
      const inverted = curve.scalarInvert(denum);
      const innerMultiplied = curve.scalarMult(num, inverted);
      const multiplied = curve.scalarMult(innerMultiplied, yi);
      s = curve.scalarAdd(multiplied, s);
    }
    return s;
  };

  return {
    split,
    combine,
  };
};

export default Shamir;
