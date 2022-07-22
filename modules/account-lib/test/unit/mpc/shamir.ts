import { Ed25519Curve, ShamirSecret, Secp256k1Curve } from '@bitgo/sdk-core';
import { strict as assert } from 'assert';

const secret = BigInt(3012019);
const secretString = secret.toString();
let curves: Array<Ed25519Curve | Secp256k1Curve>;

describe('Shamir Secret Sharing tests', async function () {
  before(async () => {
    const ed25519 = new Ed25519Curve();
    await Ed25519Curve.initialize();
    const secp256k1 = new Secp256k1Curve();
    curves = [ed25519, secp256k1];
  });

  it('Should split secret and reconstruct properly', async () => {
    for (let index = 0; index < curves.length; index++) {
      const shamir = new ShamirSecret(curves[index]);
      const shares = shamir.split(secret, 2, 3);

      const combineSecret12 = shamir.combine({
        1: shares[1],
        2: shares[2],
      });

      combineSecret12.toString().should.equal(secretString);

      const combineSecret23 = shamir.combine({
        2: shares[2],
        3: shares[3],
      });

      combineSecret23.toString().should.equal(secretString);

      const combineSecret13 = shamir.combine({
        1: shares[1],
        3: shares[3],
      });

      combineSecret13.toString().should.equal(secretString);
    }
  });

  it('Should throw exception for invalid threshold', async () => {
    const shamir = new ShamirSecret(curves[0]);
    assert.throws(() => shamir.split(secret, 0, 1), /Threshold cannot be less than two/);
    assert.throws(() => shamir.split(secret, 4, 1), /Threshold cannot be greater than the total number of shares/);
  });
});
