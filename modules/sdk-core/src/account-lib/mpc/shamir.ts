const crypto = require('crypto');
import Curve from './curves';
import { bigIntFromBufferLE, bigIntToBufferLE } from './util';

export default class Shamir {
  curve: Curve;

  constructor(curve: Curve) {
    this.curve = curve;
  }

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
  split(secret: bigint, threshold: number, numShares: number, indices?: Array<number>): Record<number, bigint> {
    let bigIndices: Array<bigint>;
    if (indices) {
      bigIndices = indices.map((i) => BigInt(i));
    } else {
      // make range(1, n + 1)
      bigIndices = Array(numShares)
        .fill(null)
        .map((_, i) => BigInt(i + 1));
    }
    if (threshold < 2) {
      throw new Error('Threshold cannot be less than two');
    }

    if (threshold > numShares) {
      throw new Error('Threshold cannot be greater than the total number of shares');
    }

    const coefs: bigint[] = [];
    for (let ind = 0; ind < threshold - 1; ind++) {
      const coeff = bigIntFromBufferLE(
        crypto.createHmac('sha256', ind.toString(10)).update(bigIntToBufferLE(secret, 32)).digest()
      );
      coefs.push(coeff);
    }
    coefs.push(secret);

    const shares: Record<number, bigint> = {};
    for (let ind = 0; ind < bigIndices.length; ind++) {
      const x = bigIndices[ind];
      let partial = coefs[0];
      for (let other = 1; other < coefs.length; other++) {
        partial = this.curve.scalarAdd(coefs[other], this.curve.scalarMult(partial, x));
      }
      shares[parseInt(x.toString(), 10)] = partial;
    }
    return shares;
  }

  /**
   * Reconstitute a secret from a dictionary of shares. The number of shares must
   * be equal to `t` to reconstitute the original secret.
   *
   * @param shares dictionary of shares. each key is the free term of the share
   * @returns secret
   */
  combine(shares: Record<number, bigint>): bigint {
    let s = BigInt(0);
    for (const i in shares) {
      const yi = shares[i];
      const xi = BigInt(i);
      let num = BigInt(1);
      let denum = BigInt(1);

      for (const j in shares) {
        const xj = BigInt(j);
        if (xi !== xj) {
          num = this.curve.scalarMult(num, xj);
        }
      }
      for (const j in shares) {
        const xj = BigInt(j);
        if (xi !== xj) {
          denum = this.curve.scalarMult(denum, this.curve.scalarSub(xj, xi));
        }
      }
      const inverted = this.curve.scalarInvert(denum);
      const innerMultiplied = this.curve.scalarMult(num, inverted);
      const multiplied = this.curve.scalarMult(innerMultiplied, yi);
      s = this.curve.scalarAdd(multiplied, s);
    }
    return s;
  }
}
