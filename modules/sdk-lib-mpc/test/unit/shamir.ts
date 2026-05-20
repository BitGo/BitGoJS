import 'should';
import { strict as assert } from 'assert';
import { Shamir as ShamirSecret, Ed25519Curve, Secp256k1Curve } from '../../src';

type TssCurves = (Ed25519Curve | Secp256k1Curve)[];

const secret = BigInt(3012019);
const secretString = secret.toString();
let curves: TssCurves;

/**
 * Shamir Key Share generation test
 * @param curves
 * @param {bigint} salt
 */
async function shamirKeyshareTests(curves: TssCurves, salt?: bigint) {
  for (let index = 0; index < curves.length; index++) {
    const shamir = new ShamirSecret(curves[index]);
    const { shares, v } = shamir.split(secret, 2, 3, undefined, salt);

    shamir.verify(shares[1], v, 1).should.equal(true);
    shamir.verify(shares[2], v, 2).should.equal(true);
    shamir.verify(shares[3], v, 3).should.equal(true);

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
}

describe('Shamir Secret Sharing tests', async function () {
  before(async () => {
    const ed25519 = new Ed25519Curve();
    await Ed25519Curve.initialize();
    const secp256k1 = new Secp256k1Curve();
    curves = [ed25519, secp256k1];
  });

  it('Should split secret and reconstruct properly', async () => {
    shamirKeyshareTests(curves);
  });

  it('Should split secret and reconstruct properly with a custom salt', async () => {
    shamirKeyshareTests(curves, BigInt(12345678));
  });

  it('Should throw exception for invalid threshold', async () => {
    const shamir = new ShamirSecret(curves[0]);
    assert.throws(() => shamir.split(secret, 0, 1), /Threshold cannot be less than two/);
    assert.throws(() => shamir.split(secret, 4, 1), /Threshold cannot be greater than the total number of shares/);
  });

  it('Should throw an exception if when supplied with an invalid indice', async () => {
    const shamir = new ShamirSecret(curves[0]);
    assert.throws(() => shamir.split(secret, 2, 3, [0]), /Invalid value supplied for indices/);
  });

  it('Should throw an exception if supplied with modularly non-unique shares', async () => {
    const shamir = new ShamirSecret(curves[0]);
    const splitUModified = {};
    splitUModified['0'] = BigInt('0x1234');
    splitUModified['7237005577332262213973186563042994240857116359379907606001950938285454250989'] = BigInt('0x1234');
    assert.throws(
      () => shamir.combine(splitUModified),
      /Error: Failed to combine Shamir shares , Error: invalid reciprocate/
    );
  });
});
