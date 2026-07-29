import 'should';
import { Secp256k1Curve } from '../../src/curves';
import { createSchnorrProof, verifySchnorrProof } from '../../src/schnorrProof';

describe('schnorr proof', function () {
  const curve = new Secp256k1Curve();

  it('should create and verify schnorr proof', function () {
    const a = curve.scalarRandom();
    const A = curve.basePointMult(a);

    verifySchnorrProof(A, createSchnorrProof(A, a, curve), curve).should.be.true();

    const m = 'sign this';
    const schnorrProof = createSchnorrProof(A, a, curve, Buffer.from(m));

    verifySchnorrProof(A, schnorrProof, curve, Buffer.from(m)).should.be.true();
  });

  it('should return false when verifying an incorrect proof', function () {
    const a = curve.scalarRandom();
    const A = curve.basePointMult(a);

    const schnorrProof = createSchnorrProof(A, a, curve);

    const a1 = curve.scalarAdd(a, BigInt(1));

    // proof for the wrong point
    verifySchnorrProof(curve.basePointMult(a1), schnorrProof, curve).should.be.false();

    // verify proof with the wrong contextual info
    verifySchnorrProof(A, schnorrProof, curve, Buffer.from('a-Z')).should.be.false();
  });
});
