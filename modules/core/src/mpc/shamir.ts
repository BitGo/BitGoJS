const assert = require('assert');

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
  const split = (
    secret: Buffer,
    threshold: number,
    numShares: number,
    indices?: Array<number>,
  ): Record<number, Buffer> => {
    if (indices === undefined) {
      // make range(1, n + 1)
      indices = Array.from({ length: numShares }, (_, i) => i + 1);
    }
    assert(threshold > 1);
    assert(threshold <= numShares);
    const coefs: Buffer[] = [];
    for (let ind = 0; ind < threshold - 1; ind++) {
      const random_value = curve.scalarRandom();
      coefs.push(random_value);
    }
    coefs.push(secret);

    const shares: Record<number, Buffer> = {};
    for (let ind = 0; ind < indices.length; ind++) {
      const x = indices[ind];
      const x_buffer = Buffer.alloc(32);
      // TODO BG-40908 : converting internal representation to buffers
      x_buffer.writeUInt32LE(x, 0);
      let partial = coefs[0];
      for (let other = 1; other < coefs.length; other++) {
        const scalarMult = curve.scalarMult(partial, x_buffer);
        const newAdd = curve.scalarAdd(coefs[other], scalarMult);
        partial = newAdd;
      }
      shares[x] = Buffer.from(partial);
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
  const combine = (shares: Record<number, Buffer>): Buffer => {
    let s = Buffer.alloc(32);
    for (const xi in shares) {
      const yi = shares[xi];
      const xi_buffer = Buffer.alloc(32);
      let num_buffer = Buffer.alloc(32);
      let denum_buffer = Buffer.alloc(32);
      xi_buffer.writeUInt32LE(parseInt(xi, 10), 0);
      num_buffer.writeUInt32LE(1, 0);
      denum_buffer.writeUInt32LE(1, 0);

      for (const xj in shares) {
        const xj_buffer = Buffer.alloc(32);
        xj_buffer.writeUInt32LE(parseInt(xj, 10), 0);
        if (xi !== xj) {
          num_buffer = curve.scalarMult(num_buffer, xj_buffer);
        }
      }
      num_buffer = Buffer.from(num_buffer);
      for (const xj in shares) {
        const xj_buffer = Buffer.alloc(32);
        xj_buffer.writeUInt32LE(parseInt(xj, 10), 0);
        if (xi !== xj) {
          denum_buffer = curve.scalarMult(denum_buffer, curve.scalarSub(xj_buffer, xi_buffer));
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
    split,
    combine,
  };
};

export default Shamir;
