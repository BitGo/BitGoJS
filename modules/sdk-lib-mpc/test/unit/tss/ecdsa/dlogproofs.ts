import sinon from 'sinon';
import {
  generateNtilde,
  generateNtildeProof,
  generateSafePrimes,
  verifyNtildeProof,
} from '../../../../src/tss/ecdsa/rangeproof';
import { OpenSSL } from '../../../../src';

describe('h1H2DiscreteLogProofs', function () {
  let switchPrime = false;
  let safePrimeMock: sinon.SinonStub;
  before(async function () {
    safePrimeMock = sinon.stub(OpenSSL.prototype, 'generateSafePrime').callsFake(async (bitlength: number) => {
      // Both primes below were generated using 'openssl prime -bits 256 -generate -safe'.
      if (switchPrime) {
        switchPrime = false;
        return BigInt('105026459418240911050597781175405200114409463599422710187772697695413160518507');
      } else {
        switchPrime = true;
        return BigInt('97740038048923029272833872518628089389073263932043585221445032564807403246907');
      }
    });
  });
  after(function () {
    safePrimeMock.reset();
    safePrimeMock.restore();
  });
  it('should generate valid ntilde proofs', async function () {
    // 512 bits is not secure for generating an Ntilde, this is for testing purposes ONLY.
    const ntilde = await generateNtilde(512);
    (
      await verifyNtildeProof(
        {
          ntilde: ntilde.ntilde,
          h1: ntilde.h1,
          h2: ntilde.h2,
        },
        ntilde.ntildeProof!.h1WrtH2
      )
    ).should.be.true();
    (
      await verifyNtildeProof({ ntilde: ntilde.ntilde, h1: ntilde.h2, h2: ntilde.h1 }, ntilde.ntildeProof!.h2WrtH1)
    ).should.be.true();
  });
  it('catch h1 and h2 not being in the same group', async function () {
    const [p, q] = await generateSafePrimes([257, 257]);
    const ntilde = p * q;
    const ntildeObj = {
      ntilde: ntilde,
      h1: BigInt(4),
      h2: p + BigInt(1),
    };
    // h1 = f1 ^ 2 where f1 is coprime to ntilde, since h1 = 4 and we know p and q can not be 2 as they are of bitlength 257
    // we f1 to be 2.
    const ntildeProof = await generateNtildeProof(
      ntildeObj,
      BigInt(2),
      (p - BigInt(1)) / BigInt(2),
      (q - BigInt(1)) / BigInt(2)
    );
    // log_h1(h2) verification should fail as there is no x such that h1 ^ x = h2 mod ntidle, since h1 and h2 are not forced to be in the same group.
    (
      await verifyNtildeProof(ntildeObj, { alpha: ntildeProof.alpha.slice(0, 128), t: ntildeProof.t.slice(0, 128) })
    ).should.be.false();
  });
});
