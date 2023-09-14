import 'should';
import { randomBytes } from 'crypto';
import { Secp256k1Curve } from '../../../../src/curves';
import { createZkVProof, verifyZkVProof } from '../../../../src/tss/ecdsa/zkVProof';

describe('zkV proof', function () {
  const curve = new Secp256k1Curve();

  it('should create and verify zkV proof', function () {
    const s = curve.scalarRandom();
    const l = curve.scalarRandom();
    const R = curve.basePointMult(curve.scalarRandom());
    const V = curve.pointAdd(curve.pointMultiply(R, s), curve.basePointMult(l));

    verifyZkVProof(V, createZkVProof(V, s, l, R, curve), R, curve).should.be.true();

    const sessionId = randomBytes(32);
    const zkVProof = createZkVProof(V, s, l, R, curve, sessionId);

    verifyZkVProof(V, zkVProof, R, curve, sessionId).should.be.true();
  });

  it('should return false when verifying a proof with partial V', function () {
    const s = curve.scalarRandom();
    const l = curve.scalarRandom();
    const R = curve.basePointMult(curve.scalarRandom());
    const V = curve.pointAdd(curve.pointMultiply(R, s), curve.basePointMult(l));
    const partialV = curve.pointMultiply(R, s); // partial V is missing the lG term

    const zkVProof = createZkVProof(V, s, l, R, curve);

    verifyZkVProof(partialV, zkVProof, R, curve).should.be.false();
  });

  it('should return false when verifying a proof created with bad s', function () {
    const s = curve.scalarRandom();
    const l = curve.scalarRandom();
    const R = curve.basePointMult(curve.scalarRandom());
    const V = curve.pointAdd(curve.pointMultiply(R, s), curve.basePointMult(l));

    const s2 = curve.scalarRandom();
    const zkVProof = createZkVProof(V, s2, l, R, curve);

    verifyZkVProof(V, zkVProof, R, curve).should.be.false();
  });

  it('should return false when verifying a proof with wrong contextual info', function () {
    const s = curve.scalarRandom();
    const l = curve.scalarRandom();
    const R = curve.basePointMult(curve.scalarRandom());
    const V = curve.pointAdd(curve.pointMultiply(R, s), curve.basePointMult(l));

    const sessionId = randomBytes(32);
    const zkVProof = createZkVProof(V, s, l, R, curve, sessionId);

    verifyZkVProof(V, zkVProof, R, curve).should.be.false();
  });
});
