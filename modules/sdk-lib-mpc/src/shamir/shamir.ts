import crypto from 'crypto';
import { BaseCurve } from '../curves';
import { SplitSecret } from './types';
import { bigIntFromBufferLE, bigIntToBufferLE, clamp } from '../util';

export class Shamir {
  curve: BaseCurve;

  constructor(curve: BaseCurve) {
    this.curve = curve;
  }

  /**
   * Perform Shamir sharing on the secret `secret` to the degree `threshold - 1` split `numShares`
   * ways. The split secret requires `threshold` shares to be reconstructed.
   *
   * @param secret secret to split
   * @param threshold share threshold required to reconstruct secret
   * @param numShares total number of shares to split secret into
   * @param indices optional indices which can be used while generating the shares
   * @param salt optional salt which could be used while generating the shares
   * @returns Dictionary containing `shares`, a dictionary where each key is an int
   * in the range 1<=x<=numShares representing that share's free term, and `v`, an
   * array of proofs to be shared with all participants.
   */
  split(secret: bigint, threshold: number, numShares: number, indices?: Array<number>, salt = BigInt(0)): SplitSecret {
    let bigIndices: Array<bigint>;
    if (indices) {
      bigIndices = indices.map((i) => {
        if (i < 1) {
          throw new Error('Invalid value supplied for indices');
        }
        return BigInt(i);
      });
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
    const v: Array<bigint> = [];
    for (let ind = 0; ind < threshold - 1; ind++) {
      const coeff = clamp(
        bigIntFromBufferLE(crypto.createHmac('sha256', ind.toString(10)).update(bigIntToBufferLE(secret, 32)).digest())
      );
      coefs.push(coeff);
      v.unshift(this.curve.basePointMult(coeff));
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
    return { shares, v };
  }

  /**
   * Verify a VSS share.
   *
   * @param u Secret share received from other party.
   * @param v Verification values received from other party.
   * @param index Verifier's index.
   * @returns True on success; otherwise throws Error.
   */
  verify(u: bigint, v: Array<bigint>, index: number): boolean {
    if (v.length < 2) {
      throw new Error('Threshold cannot be less than two');
    }
    if (index < 1) {
      throw new Error('Invalid value supplied for index');
    }
    const i = BigInt(index);
    let x = v[0];
    let t = BigInt(1);
    for (const vsj of v.slice(1)) {
      t = this.curve.scalarMult(t, i);
      const vjt = this.curve.pointMultiply(vsj, t);
      x = this.curve.pointAdd(x, vjt);
    }
    const sigmaG = this.curve.basePointMult(u);
    if (x !== sigmaG) {
      throw new Error('Could not verify share');
    }
    return true;
  }

  /**
   * Reconstitute a secret from a dictionary of shares. The number of shares must
   * be equal to `t` to reconstitute the original secret.
   *
   * @param shares dictionary of shares. each key is the free term of the share
   * @returns secret
   */
  combine(shares: Record<number, bigint>): bigint {
    try {
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
    } catch (error) {
      throw new Error('Failed to combine Shamir shares , ' + error);
    }
  }
}
